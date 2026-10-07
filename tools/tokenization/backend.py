"""Bounded JSON worker using psf/requests. Runs behind the PHP security boundary."""
import json
import os
import sys
from urllib.parse import urlsplit

import requests

DEFAULT_URL = 'https://azzzmfwoqcbvsfjvmqyz.supabase.co/functions/v1/hashcod-shared-cloud'
MAX_INPUT = 16384
MAX_OUTPUT = 1048576


def edge_url():
    value = os.environ.get('HASHCOD_SHARED_CLOUD_URL', DEFAULT_URL).rstrip('/')
    parsed = urlsplit(value)
    test_http = (os.environ.get('APP_ENV') == 'test'
                 and os.environ.get('HASHCOD_TOKENIZATION_ALLOW_TEST_HTTP') == '1'
                 and parsed.hostname in ('127.0.0.1', 'localhost'))
    if (parsed.username or parsed.password or parsed.query or parsed.fragment
            or not parsed.hostname or parsed.path != '/functions/v1/hashcod-shared-cloud'
            or not ((parsed.scheme == 'https' and parsed.hostname.endswith('.supabase.co')
                     and parsed.port in (None, 443)) or (parsed.scheme == 'http' and test_http))):
        raise ValueError('Invalid endpoint')
    return value


def call(payload):
    action = payload.get('action')
    body = payload.get('body')
    if action not in ('submit', 'auth', 'list') or not isinstance(body, dict):
        raise ValueError('Invalid action')
    with requests.Session() as session:
        # No ambient proxy/.netrc credentials; HTTPS verification stays enabled.
        session.trust_env = False
        with session.post(edge_url(), params={'action': 'tokenization.' + action},
                          json=body, headers={'Accept': 'application/json'},
                          timeout=(5, 20), allow_redirects=False, stream=True) as response:
            if response.status_code not in (200, 400, 403, 405, 409, 413, 429, 503):
                raise ValueError('Unexpected upstream status')
            chunks, size = [], 0
            for chunk in response.iter_content(8192):
                size += len(chunk)
                if size > MAX_OUTPUT:
                    raise ValueError('Response too large')
                chunks.append(chunk)
            data = json.loads(b''.join(chunks))
            if not isinstance(data, dict) or not isinstance(data.get('ok'), bool):
                raise ValueError('Invalid response')
            return {'status': response.status_code, 'data': data}


def main():
    try:
        raw = sys.stdin.buffer.read(MAX_INPUT + 1)
        if len(raw) > MAX_INPUT:
            raise ValueError('Input too large')
        payload = json.loads(raw)
        if not isinstance(payload, dict):
            raise ValueError('Invalid input')
        result = call(payload)
    except Exception:
        # Never echo request bodies, keys, contacts, upstream URLs or diagnostics.
        result = {'status': 503, 'data': {'ok': False, 'error': 'No se pudo conectar con las solicitudes. Intenta de nuevo.'}}
    sys.stdout.write(json.dumps(result, ensure_ascii=True, separators=(',', ':')))


if __name__ == '__main__':
    main()
