"""Pinned upstream runtime downloads, checked before extraction."""
import gzip
import hashlib
import io
import importlib.util
import os
import pathlib
import sys
import tarfile
import urllib.request
import zipfile

root=pathlib.Path(sys.argv[1]); root.mkdir(parents=True,exist_ok=True)
downloads=[
 ('https://github.com/brettcannon/cpython-wasi-build/releases/download/v3.14.7/python-3.14.7-wasi_sdk-24.zip','2e064d3fb8172471d39d741348efa722349c40b96301f69968dff714999c584b','python'),
 ('https://github.com/bytecodealliance/javy/releases/download/v9.1.0/javy-x86_64-linux-v9.1.0.gz','a68b122d48eb3dfc1b801d4e14c39271fde3638243d3272d206e376ac9189e39','javy'),
 ('https://github.com/bytecodealliance/wasmtime/releases/download/v49.0.2/wasmtime-v49.0.2-x86_64-linux-c-api.tar.xz','4818e139aeb83b7adbaaf41b267bf18992c18463ae26d1a9acdcfc63ea9eb316','engine')]
for url,digest,kind in downloads:
 raw=urllib.request.urlopen(url,timeout=120).read()
 if hashlib.sha256(raw).hexdigest()!=digest: raise ValueError('Runtime integrity mismatch')
 if kind=='python':
  with zipfile.ZipFile(io.BytesIO(raw)) as archive: archive.extractall(root/'python')
 elif kind=='javy':
  path=root/'javy';path.write_bytes(gzip.decompress(raw));path.chmod(0o755)
 else:
  with tarfile.open(fileobj=io.BytesIO(raw)) as archive:
   member=next(m for m in archive.getmembers() if m.name.endswith('/lib/libwasmtime.so'))
   # The Python 49.0.0 bindings share the patch ABI; use the security-fixed engine.
   path=pathlib.Path(importlib.util.find_spec('wasmtime').origin).parent/'linux-x86_64'/'_libwasmtime.so'
   temporary=path.with_suffix('.download')
   temporary.write_bytes(archive.extractfile(member).read());os.replace(temporary,path)
  (root/'engine-version').write_text('49.0.2')
