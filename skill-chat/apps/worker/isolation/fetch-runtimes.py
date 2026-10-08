"""Build-time only pinned official runtimes. No package download at execution."""
import base64
import hashlib
import io
import os
from pathlib import Path
import tarfile
import urllib.request
import zipfile

ROOT = Path('/opt/runtime')
ARTIFACTS = [
    ('node', 'https://nodejs.org/dist/v24.21.0/node-v24.21.0-linux-x64.tar.xz', 'sha256', 'fd8e59d5a511510f6a298afb548f18c7d2b1be404d8b4a27d94fbe49f56cb2d6'),
    ('dart', 'https://storage.googleapis.com/dart-archive/channels/stable/release/3.13.5/sdk/dartsdk-linux-x64-release.zip', 'sha256', 'ea864bc64df30a6b8bdf30b2e32550f7717d9a890de8f40293aeabb924fe232b'),
    ('coffeescript', 'https://registry.npmjs.org/coffeescript/-/coffeescript-2.7.0.tgz', 'sha512', base64.b64decode('hzWp6TUE2d/jCcN67LrW1eh5b/rSDKQK6oD6VMLlggYVUUFexgTH9z3dNYihzX4RMhze5FTUsUmOXViJKFQR/A==').hex()),
]

def install(name, url, algorithm, expected):
    with urllib.request.urlopen(url, timeout=120) as response:
        archive = response.read(512 * 1024 * 1024)
    if hashlib.new(algorithm, archive).hexdigest() != expected:
        raise RuntimeError(name + ' upstream digest mismatch')
    target = ROOT / name
    target.mkdir(parents=True, exist_ok=True)
    if name == 'dart':
        with zipfile.ZipFile(io.BytesIO(archive)) as contents:
            for member in contents.infolist():
                pieces = Path(member.filename).parts
                if not pieces or pieces[0] != 'dart-sdk' or '..' in pieces:
                    raise RuntimeError('Invalid upstream archive')
                if len(pieces) == 1:
                    continue
                destination = target.joinpath(*pieces[1:])
                if member.is_dir():
                    destination.mkdir(parents=True, exist_ok=True)
                else:
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    destination.write_bytes(contents.read(member))
                    permission = member.external_attr >> 16 & 0o777
                    destination.chmod(permission or 0o644)
        for exe in ['dart', 'dartaotruntime', 'dartvm']:
            if (target / 'bin' / exe).exists():
                (target / 'bin' / exe).chmod(0o755)
    else:
        with tarfile.open(fileobj=io.BytesIO(archive), mode='r:*') as contents:
            for member in contents:
                pieces = Path(member.name).parts
                if not pieces or '..' in pieces or len(pieces) == 1:
                    continue
                member.name = str(Path(*pieces[1:]))
                if member.isdev() or member.islnk():
                    raise RuntimeError('Unsupported upstream archive entry')
                if member.issym():
                    # Official Node bin symlinks are relative and remain in root.
                    resolved = os.path.realpath(target / Path(member.name).parent / member.linkname)
                    if not resolved.startswith(str(target) + '/'):
                        raise RuntimeError('Archive symlink escapes runtime')
                contents.extract(member, path=target, filter='data')
    print(name + ' pinned runtime digest verified')

if __name__ == '__main__':
    if os.uname().machine != 'x86_64':
        raise RuntimeError('Pinned runtimes require Linux amd64')
    for artifact in ARTIFACTS:
        install(*artifact)
