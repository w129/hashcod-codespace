#!/usr/bin/env python3
"""
Hashcod Codespace Resources Indexer

Uso recomendado en Windows:
  python scripts/upload_resources.py "D:\\Empresa" --output resources/manifest.json --public-prefix /resources/files

Modo solo índice externo, sin copiar archivos:
  python scripts/upload_resources.py "D:\\Empresa" --output resources/manifest.json --no-copy

Modo Supabase Storage opcional:
  set SUPABASE_URL=https://xxxxx.supabase.co
  set SUPABASE_SERVICE_ROLE_KEY=xxxxx
  python scripts/upload_resources.py "D:\\Empresa" --supabase --bucket hashcod-resources --output resources/manifest.json

Notas:
- No subas .env, llaves privadas, tokens, .git, node_modules, vendor, caches ni backups.
- Para miles de recursos grandes, usa Supabase Storage o R2; no metas todo en GitHub.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
import shutil
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

SKIP_DIRS = {
    ".git", ".svn", ".hg", ".idea", ".vscode", ".cache", ".turbo", ".next",
    "node_modules", "vendor", "__pycache__", ".pnpm-store", ".yarn", ".venv", "venv",
    "dist", "build", "target", "coverage", "logs", "tmp", "temp", "cache",
    "Pods", ".gradle", ".mypy_cache", ".pytest_cache", "data_storage", "uploads",
}

SKIP_NAMES = {
    ".env", ".env.local", ".env.production", ".env.development", "id_rsa", "id_ed25519",
    "known_hosts", "authorized_keys", "secrets.json", "credentials.json", "token.json",
}

SENSITIVE_EXTS = {".key", ".pem", ".p12", ".pfx", ".crt", ".cer", ".sqlite", ".db", ".bak"}
TEXT_CODE_EXTS = {".html", ".css", ".js", ".ts", ".tsx", ".jsx", ".py", ".php", ".json", ".md", ".txt", ".svg", ".xml", ".yml", ".yaml", ".sql"}
DOC_EXTS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".csv"}
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".bmp"}
ARCHIVE_EXTS = {".zip", ".7z", ".rar", ".tar", ".gz", ".tgz"}
AUDIO_VIDEO_EXTS = {".mp3", ".wav", ".mp4", ".mov", ".webm", ".avi", ".mkv"}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def safe_slug(value: str, fallback: str = "resource") -> str:
    value = value.strip().replace("\\", "/")
    value = value.split("/")[-1] or fallback
    out = []
    for ch in value:
        if ch.isalnum() or ch in {".", "-", "_"}:
            out.append(ch)
        elif ch.isspace():
            out.append("-")
    result = "".join(out).strip(".-_")
    return result[:160] or fallback


def file_sha256(path: Path, chunk_size: int = 1024 * 1024) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def classify(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in IMAGE_EXTS:
        return "image"
    if ext in DOC_EXTS:
        return "document"
    if ext in ARCHIVE_EXTS:
        return "archive"
    if ext in AUDIO_VIDEO_EXTS:
        return "media"
    if ext in TEXT_CODE_EXTS:
        return "code"
    return "file"


def should_skip(path: Path, root: Path, max_bytes: int) -> Tuple[bool, str]:
    name = path.name
    lower = name.lower()
    if name in SKIP_NAMES or lower in SKIP_NAMES:
        return True, "sensitive_name"
    if path.suffix.lower() in SENSITIVE_EXTS:
        return True, "sensitive_ext"
    try:
        size = path.stat().st_size
    except OSError:
        return True, "stat_failed"
    if size <= 0:
        return True, "empty"
    if size > max_bytes:
        return True, "too_large"
    rel_parts = path.relative_to(root).parts
    for part in rel_parts[:-1]:
        if part in SKIP_DIRS or part.lower() in SKIP_DIRS:
            return True, "skip_dir"
    return False, ""


def iter_files(root: Path, max_bytes: int) -> Iterable[Tuple[Path, str]]:
    for current, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and d.lower() not in SKIP_DIRS]
        base = Path(current)
        for filename in files:
            path = base / filename
            skip, reason = should_skip(path, root, max_bytes)
            if skip:
                yield path, "SKIP:" + reason
            else:
                yield path, "OK"


def copy_to_public(path: Path, root: Path, public_dir: Optional[Path]) -> Optional[str]:
    if public_dir is None:
        return None
    rel = path.relative_to(root)
    target_dir = public_dir / rel.parent
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / safe_slug(path.name, path.stem or "resource")
    if target.exists():
        stem = target.stem
        ext = target.suffix
        target = target.with_name(f"{stem}-{int(time.time())}{ext}")
    shutil.copy2(path, target)
    return str(target.relative_to(public_dir).as_posix())


def supabase_upload(path: Path, storage_path: str, bucket: str, upsert: bool = False) -> str:
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SECRET_KEY")
    if not url or not key:
        raise RuntimeError("Falta SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY")
    encoded_bucket = urllib.parse.quote(bucket, safe="")
    encoded_path = "/".join(urllib.parse.quote(p, safe="") for p in storage_path.split("/"))
    endpoint = f"{url}/storage/v1/object/{encoded_bucket}/{encoded_path}"
    content_type = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
    data = path.read_bytes()
    req = urllib.request.Request(
        endpoint,
        data=data,
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": content_type,
            "x-upsert": "true" if upsert else "false",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            if res.status >= 300:
                raise RuntimeError(f"Supabase upload status {res.status}")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "ignore")[:500]
        raise RuntimeError(f"Supabase upload failed {exc.code}: {body}") from exc
    return f"{url}/storage/v1/object/public/{encoded_bucket}/{encoded_path}"


def build_manifest(args: argparse.Namespace) -> Dict[str, object]:
    root = Path(args.source).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        raise SystemExit(f"La carpeta no existe o no es directorio: {root}")

    max_bytes = int(args.max_mb * 1024 * 1024)
    public_dir = None if args.no_copy or args.supabase else Path(args.public_dir).resolve()
    if public_dir is not None:
        public_dir.mkdir(parents=True, exist_ok=True)

    items: List[Dict[str, object]] = []
    seen_hashes = set()
    skipped = 0
    duplicates = 0

    for path, status in iter_files(root, max_bytes):
        if status != "OK":
            skipped += 1
            if args.verbose:
                print(status, path)
            continue
        rel = path.relative_to(root).as_posix()
        try:
            digest = file_sha256(path)
        except OSError as exc:
            skipped += 1
            print(f"SKIP:hash_failed {path}: {exc}", file=sys.stderr)
            continue
        if digest in seen_hashes:
            duplicates += 1
            if args.verbose:
                print("SKIP:duplicate", rel)
            continue
        seen_hashes.add(digest)

        size = path.stat().st_size
        ext = path.suffix.lower().lstrip(".")
        category = args.category or (path.relative_to(root).parts[0] if len(path.relative_to(root).parts) > 1 else classify(path))
        public_url = ""
        storage_path = ""

        if args.supabase:
            storage_path = f"{args.prefix.strip('/')}/{rel}" if args.prefix else rel
            storage_path = "/".join(safe_slug(part, "part") for part in storage_path.split("/"))
            public_url = supabase_upload(path, storage_path, args.bucket, upsert=args.upsert)
        else:
            copied_rel = copy_to_public(path, root, public_dir)
            if copied_rel:
                public_url = args.public_prefix.rstrip("/") + "/" + copied_rel

        items.append({
            "id": digest[:16],
            "name": path.name,
            "category": category,
            "type": classify(path),
            "extension": ext,
            "size_bytes": size,
            "sha256": digest,
            "original_path": rel,
            "storage_path": storage_path,
            "url": public_url,
            "download_url": public_url,
            "mime_type": mimetypes.guess_type(str(path))[0] or "application/octet-stream",
            "description": "Recurso indexado por Hashcod Codespace",
        })
        if args.verbose:
            print("OK", rel)

    return {
        "version": 1,
        "generated_at": now_iso(),
        "title": "Hashcod Resources",
        "source_root": str(root),
        "count": len(items),
        "skipped": skipped,
        "duplicates": duplicates,
        "resources": items,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Indexa recursos locales para /resources de Hashcod Codespace")
    parser.add_argument("source", help="Carpeta local a escanear, ejemplo: D:\\Empresa")
    parser.add_argument("--output", default="resources/manifest.json", help="Ruta del manifest JSON a generar")
    parser.add_argument("--public-dir", default="resources/files", help="Directorio local donde copiar recursos públicos")
    parser.add_argument("--public-prefix", default="/resources/files", help="Prefijo URL público para archivos copiados")
    parser.add_argument("--no-copy", action="store_true", help="No copia archivos; genera índice sin URL pública")
    parser.add_argument("--max-mb", type=float, default=25.0, help="Tamaño máximo por archivo en MB")
    parser.add_argument("--category", default="", help="Categoría fija para todos los recursos")
    parser.add_argument("--verbose", action="store_true", help="Muestra archivos procesados y omitidos")
    parser.add_argument("--supabase", action="store_true", help="Sube archivos a Supabase Storage usando variables de entorno")
    parser.add_argument("--bucket", default="hashcod-resources", help="Bucket Supabase Storage")
    parser.add_argument("--prefix", default="resources", help="Prefijo dentro del bucket Supabase")
    parser.add_argument("--upsert", action="store_true", help="Permite sobrescribir en Supabase Storage")
    args = parser.parse_args()

    manifest = build_manifest(args)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Manifest generado: {output} · recursos={manifest['count']} · omitidos={manifest['skipped']} · duplicados={manifest['duplicates']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
