import base64
import ctypes
import hashlib
import os
import socket
import threading
import time
from http.server import ThreadingHTTPServer
from analyze import analyze
from protocol import JsonHandler, ReviewError, env_key, sign, verify


class Worker:
    def __init__(self,public,private):
        self.public,self.private=public,private
        self.lock=threading.Lock(); self.nonces={}

    def dispatch(self,body):
        job=verify(body,self.public,'review-backend-v1','hashcod.review.job.v1')
        if not self.lock.acquire(blocking=False): raise ReviewError('busy','El analizador está ocupado. Intenta de nuevo.',429)
        try:
            self.nonces={k:v for k,v in self.nonces.items() if v>time.time()-180}
            if body['nonce'] in self.nonces: raise ReviewError('replay','Solicitud ya utilizada.',409)
            self.nonces[body['nonce']]=time.time()
            if not isinstance(job,dict) or set(job)!={'session_id','content_hash','language','content'} or job['language'] not in ('python','javascript'): raise ReviewError('invalid_job','Revisión incorrecta.')
            content=base64.b64decode(job['content'],validate=True)
            if len(content)>2097152: raise ReviewError('too_large','Archivo demasiado grande.',413)
            if hashlib.sha512(content).hexdigest()!=job['content_hash']: raise ReviewError('hash_mismatch','El contenido no coincide.',409)
            content.decode('utf-8')
            checks=analyze(content,job['language'])
            return sign({'session_id':job['session_id'],'content_hash':job['content_hash'],'request_nonce':body['nonce'],'checks':checks},self.private,'review-sandbox-v1','hashcod.review.checks.v1')
        finally: self.lock.release()


class Server(ThreadingHTTPServer): address_family=socket.AF_INET6


if __name__=='__main__':
    if ctypes.CDLL(None).prctl(4,0,0,0,0)!=0: raise RuntimeError('Process protection unavailable')
    # Exercise the actual installed tools as the unprivileged runtime user.
    # Railway must not mark an incomplete isolation deployment healthy.
    for source,language in [(b'def add(a,b):\n return a+b\n','python'),(b'function add(a,b) { return a+b; }\n','javascript')]:
        checks=analyze(source,language)
        if len(checks)!=5 or not all(check['passed'] and check['status']=='complete' for check in checks):
            raise RuntimeError('Sandbox readiness failed: '+','.join(check['kind'] for check in checks if not check['passed'] or check['status']!='complete'))
    print('Sandbox readiness passed: Python, JavaScript, isolation, SAST, secrets and dependencies',flush=True)
    worker=Worker(env_key('REVIEW_BACKEND_PUBLIC_KEY'),env_key('REVIEW_ATTESTATION_KEY',True))
    JsonHandler.max_bytes=2900000
    JsonHandler.dispatch=staticmethod(worker.dispatch)
    Server(('::',int(os.environ.get('PORT','8080'))),JsonHandler).serve_forever()
