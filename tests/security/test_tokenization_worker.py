"""Exercise the actual Requests worker or the packaged Windows executable."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('backend', ROOT / 'tools/tokenization/backend.py')
backend = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backend)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        self.server.received = body
        self.send_response(self.server.status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(self.server.output)


class WorkerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.env = {**os.environ, 'APP_ENV': 'test', 'HASHCOD_TOKENIZATION_ALLOW_TEST_HTTP': '1',
                   'HASHCOD_SHARED_CLOUD_URL': f'http://127.0.0.1:{cls.server.server_port}/functions/v1/hashcod-shared-cloud'}

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def run_worker(self, value):
        command = [os.environ['HASHCOD_TOKENIZATION_EXE']] if os.environ.get('HASHCOD_TOKENIZATION_EXE') else [sys.executable, str(ROOT / 'tools/tokenization/backend.py')]
        raw = value if isinstance(value, str) else json.dumps(value)
        result = subprocess.run(command, input=raw.encode(), capture_output=True, env=self.env, timeout=35)
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stderr, b'')
        return json.loads(result.stdout)

    def setUp(self):
        self.server.status = 200
        self.server.output = b'{"ok":true,"requests":[]}'

    def test_actual_requests_and_private_input(self):
        result = self.run_worker({'action': 'auth', 'body': {'key': 'test-private-key', 'token': 'test-period'}})
        self.assertTrue(result['data']['ok'])
        self.assertEqual(self.server.received['key'], 'test-private-key')
        self.assertNotIn('test-private-key', json.dumps(result))

    def test_status_update_transport(self):
        result = self.run_worker({'action': 'update', 'body': {'id': 'fixture-request', 'status': 'completed', 'expectedStatus': 'pending', 'adminTicket': 'test-ticket'}})
        self.assertTrue(result['data']['ok'])
        self.assertEqual(self.server.received['status'], 'completed')
        self.server.status = 409
        self.server.output = b'{"ok":false,"error":"Refresh the list."}'
        self.assertEqual(self.run_worker({'action': 'update', 'body': {}})['status'], 409)

    def test_upstream_denial_and_invalid_response(self):
        self.server.status = 403
        self.server.output = b'{"ok":false,"error":"Clave incorrecta."}'
        self.assertEqual(self.run_worker({'action': 'auth', 'body': {}})['status'], 403)
        for status, output in [(302, b'{}'), (500, b'<html>internal secret</html>'), (200, b'not-json'), (200, b'{"ok":"yes"}')]:
            self.server.status, self.server.output = status, output
            result = self.run_worker({'action': 'list', 'body': {}})
            self.assertEqual(result['status'], 503)
            self.assertNotIn('internal secret', json.dumps(result))

    def test_bounded_input_and_action_allowlist(self):
        for raw in ['x' * 16385, '[]', '{invalid', '{"action":"shell","body":{}}']:
            self.assertEqual(self.run_worker(raw)['status'], 503)

    def test_endpoint_restrictions(self):
        previous = dict(os.environ)
        try:
            for value in ['http://evil.test/functions/v1/hashcod-shared-cloud', 'https://user:pass@safe.supabase.co/functions/v1/hashcod-shared-cloud', 'https://safe.supabase.co.evil.test/functions/v1/hashcod-shared-cloud', 'https://safe.supabase.co/functions/v1/hashcod-shared-cloud?secret=a', 'https://safe.supabase.co/other']:
                os.environ['HASHCOD_SHARED_CLOUD_URL'] = value
                with self.assertRaises(ValueError):
                    backend.edge_url()
        finally:
            os.environ.clear()
            os.environ.update(previous)


if __name__ == '__main__':
    unittest.main()
