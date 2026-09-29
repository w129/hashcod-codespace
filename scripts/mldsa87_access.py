#!/usr/bin/env python3
import argparse, base64, json, sys
from pathlib import Path
from pqcrypto.sign.ml_dsa_87 import PUBLIC_KEY_SIZE, SECRET_KEY_SIZE, SIGNATURE_SIZE, generate_keypair, sign, verify

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

def cmd_keygen_json(_):
    try:
        pk, sk = generate_keypair()
        print(json.dumps({
            "ok": True,
            "algorithm": "ML-DSA-87",
            "public_key_b64": base64.b64encode(pk).decode("ascii"),
            "secret_key_b64": base64.b64encode(sk).decode("ascii"),
            "public_key_bytes": len(pk),
            "secret_key_bytes": len(sk),
        }))
        return 0
    except Exception as e:
        print(json.dumps({"ok":False,"error":type(e).__name__}))
        return 2

def cmd_sign_json(_):
    try:
        req=json.loads(sys.stdin.read())
        sk=b64d(req.get("secret_key_b64",""), SECRET_KEY_SIZE)
        msg=str(req.get("message","")).encode("utf-8")
        if not msg: raise ValueError("empty")
        sig=sign(sk,msg)
        print(json.dumps({
            "ok":True,
            "algorithm":"ML-DSA-87",
            "signature_b64":base64.b64encode(sig).decode("ascii"),
            "signature_bytes":len(sig),
        }))
        return 0
    except Exception as e:
        print(json.dumps({"ok":False,"error":type(e).__name__}))
        return 2

def main():
    p=argparse.ArgumentParser()
    s=p.add_subparsers(dest="cmd",required=True)
    ps=s.add_parser("sign"); ps.add_argument("--secret",required=True); ps.add_argument("--challenge",required=True); ps.set_defaults(fn=cmd_sign)
    pv=s.add_parser("verify-json"); pv.set_defaults(fn=cmd_verify)
    pkg=s.add_parser("keygen-json"); pkg.set_defaults(fn=cmd_keygen_json)
    psj=s.add_parser("sign-json"); psj.set_defaults(fn=cmd_sign_json)
    a=p.parse_args(); raise SystemExit(a.fn(a))
if __name__=="__main__": main()
