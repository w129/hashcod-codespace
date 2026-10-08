"""Bounded, domain-separated Ed25519 messages shared by review services."""
import base64
import json
import os
import secrets
import time
from http.server import BaseHTTPRequestHandler
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey


class ReviewError(Exception):
    def __init__(self, code, message, status=400):
        self.code, self.message, self.status = code, message, status


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8")


def env_key(name, private=False):
    raw = base64.b64decode(os.environ[name], validate=True)
    if len(raw) != 32:
        raise ValueError("Invalid signing configuration")
    return Ed25519PrivateKey.from_private_bytes(raw) if private else Ed25519PublicKey.from_public_bytes(raw)


def sign(data, key, key_id, domain):
    value = {"data": data, "key_id": key_id, "nonce": secrets.token_hex(16), "timestamp": int(time.time() * 1000)}
    value["signature"] = base64.b64encode(key.sign(domain.encode() + b"\n" + canonical(value))).decode()
    return value


def verify(value, key, key_id, domain, now=None):
    if not isinstance(value, dict) or set(value) != {"data", "key_id", "nonce", "timestamp", "signature"}:
        raise ReviewError("invalid_proof", "Autenticación del servicio incorrecta.", 403)
    unsigned = {k: value[k] for k in value if k != "signature"}
    clock = int(time.time() * 1000) if now is None else now
    if value["key_id"] != key_id or type(value["timestamp"]) is not int or abs(clock - value["timestamp"]) > 90000:
        raise ReviewError("expired_proof", "Autenticación del servicio caducada.", 403)
    try:
        nonce = value["nonce"]
        if not isinstance(nonce, str) or len(nonce) != 32 or len(bytes.fromhex(nonce)) != 16:
            raise ValueError()
        key.verify(base64.b64decode(value["signature"], validate=True), domain.encode() + b"\n" + canonical(unsigned))
    except Exception:
        raise ReviewError("invalid_proof", "Autenticación del servicio incorrecta.", 403) from None
    return value["data"]


class JsonHandler(BaseHTTPRequestHandler):
    max_bytes = 20000
    dispatch = None

    def log_message(self, *_):
        # No request bodies, tokens, keys, filenames or chat content in logs.
        pass

    def reply(self, value, status=200):
        raw = canonical(value)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        self.reply({"ok": True}, 200) if self.path == "/healthz" else self.reply({"ok": False}, 404)

    def do_POST(self):
        self.connection.settimeout(10)
        try:
            if self.path != "/v1/review" or self.headers.get("Origin") or self.headers.get("Transfer-Encoding"):
                raise ReviewError("not_found", "Ruta no disponible.", 404)
            if self.headers.get("Content-Type", "").split(";", 1)[0] != "application/json":
                raise ReviewError("invalid_request", "Se requiere JSON.")
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= self.max_bytes:
                raise ReviewError("too_large", "La solicitud es demasiado grande.", 413)
            raw = self.rfile.read(length)
            if len(raw) != length:
                raise ReviewError("invalid_request", "Solicitud incompleta.")
            body = json.loads(raw)
            if not isinstance(body, dict):
                raise ReviewError("invalid_request", "Solicitud incorrecta.")
            self.reply(self.dispatch(body))
        except ReviewError as error:
            self.reply({"ok": False, "code": error.code, "error": error.message}, error.status)
        except (ValueError, UnicodeError):
            self.reply({"ok": False, "code": "invalid_request", "error": "Solicitud incorrecta."}, 400)
        except Exception:
            self.reply({"ok": False, "code": "temporarily_unavailable", "error": "La revisión no está disponible. Intenta de nuevo."}, 503)

    def do_OPTIONS(self):
        self.reply({"ok": False}, 405)
