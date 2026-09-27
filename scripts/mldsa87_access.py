#!/usr/bin/env python3
import argparse, base64, json, sys
from pathlib import Path
from pqcrypto.sign.ml_dsa_87 import PUBLIC_KEY_SIZE, SECRET_KEY_SIZE, SIGNATURE_SIZE, sign, verify

def b64d(s, n):
    b=base64.b64decode(str(s).strip(), validate=True)
    if len(b)!=n: raise ValueError("invalid length")
    return b

def cmd_sign(a):
    sk=b64d(Path(a.secret).read_text(encoding="utf-8"), SECRET_KEY_SIZE)
    sig=sign(sk, a.challenge.encode("utf-8"))
    print(base64.b64encode(sig).decode("ascii"))
    return 0

def cmd_verify(_):
    try:
        req=json.loads(sys.stdin.read())
        pk=b64d(req.get("public_key_b64",""), PUBLIC_KEY_SIZE)
        sig=b64d(req.get("signature_b64",""), SIGNATURE_SIZE)
        msg=str(req.get("challenge","")).encode("utf-8")
        if not msg: raise ValueError("empty")
        verify(pk,msg,sig)
        print(json.dumps({"ok":True,"algorithm":"ML-DSA-87"}))
        return 0
    except Exception as e:
        print(json.dumps({"ok":False,"error":type(e).__name__}))
        return 2

def main():
    p=argparse.ArgumentParser()
    s=p.add_subparsers(dest="cmd",required=True)
    ps=s.add_parser("sign"); ps.add_argument("--secret",required=True); ps.add_argument("--challenge",required=True); ps.set_defaults(fn=cmd_sign)
    pv=s.add_parser("verify-json"); pv.set_defaults(fn=cmd_verify)
    a=p.parse_args(); raise SystemExit(a.fn(a))
if __name__=="__main__": main()
