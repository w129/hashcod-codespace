"""Expiring keys are encrypted in memory, never written to the database/disk."""
import hashlib
import hmac
import secrets
import threading
import time
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from protocol import ReviewError


class KeyVault:
    def __init__(self, master, ttl=1800):
        if len(master) < 32:
            raise ValueError("Stable review vault key required")
        self.master, self.ttl, self.values, self.lock = master, max(30, min(1800, ttl)), {}, threading.Lock()

    def cipher(self, session, owner):
        context = ("hashcod.review.user-key.v1|" + session + "|" + owner).encode()
        return AESGCM(hmac.new(self.master, context, hashlib.sha256).digest()), context

    def set(self, session, owner, value, model):
        cipher, aad = self.cipher(session, owner)
        nonce, expires = secrets.token_bytes(12), time.time() + self.ttl
        encrypted = cipher.encrypt(nonce, value.encode(), aad)
        with self.lock:
            self.values = {k: v for k, v in self.values.items() if v[3] > time.time()}
            if len(self.values) >= 1000 and session not in self.values:
                raise ReviewError("busy", "El servicio está ocupado. Intenta de nuevo.", 429)
            self.values[session] = (owner, nonce, encrypted, expires, model)
        return int(expires)

    def cleanup(self):
        with self.lock:
            self.values = {k:v for k,v in self.values.items() if v[3]>time.time()}

    def get(self, session, owner):
        with self.lock:
            value = self.values.get(session)
            if not value or value[0] != owner or value[3] <= time.time():
                if value and value[3] <= time.time():
                    self.values.pop(session, None)
                raise ReviewError("key_expired", "Añade de nuevo tu API key para continuar.", 403)
        cipher, aad = self.cipher(session, owner)
        return cipher.decrypt(value[1], value[2], aad).decode(), value[4]

    def remove(self, session):
        with self.lock:
            self.values.pop(session, None)
