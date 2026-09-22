#!/usr/bin/env python3
"""
Hashcod Codespace Resources Indexer

Ejemplo recomendado en Windows:
  python scripts/upload_resources.py "D:\\Empresa" --output resources/manifest.json --js-output resources/manifest.js --no-copy

Con copia local al repo, solo para pocos archivos pequeños:
  python scripts/upload_resources.py "D:\\Empresa" --output resources/manifest.json --js-output resources/manifest.js --public-dir resources/files --public-prefix /resources/files

Con Supabase Storage para miles de recursos:
  set SUPABASE_URL=https://xxxxx.supabase.co
  set SUPABASE_SERVICE_ROLE_KEY=xxxxx
  python scripts/upload_resources.py "D:\\Empresa" --supabase --bucket hashcod-resources --output resources/manifest.json --js-output resources/manifest.js
"""
from __future__ import annotations
import argparse, hashlib, json, mimetypes, os, shutil, sys, time, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

SKIP_DIRS={'.git','.svn','.hg','.idea','.vscode','.cache','.turbo','.next','node_modules','vendor','__pycache__','.pnpm-store','.yarn','.venv','venv','dist','build','target','coverage','logs','tmp','temp','cache','Pods','.gradle','.mypy_cache','.pytest_cache','data_storage','uploads'}
SKIP_NAMES={'.env','.env.local','.env.production','.env.development','id_rsa','id_ed25519','known_hosts','authorized_keys','secrets.json','credentials.json','token.json'}
SENSITIVE_EXTS={'.key','.pem','.p12','.pfx','.crt','.cer','.sqlite','.db','.bak'}
IMAGE_EXTS={'.png','.jpg','.jpeg','.gif','.webp','.svg','.ico','.bmp'}
DOC_EXTS={'.pdf','.doc','.docx','.xls','.xlsx','.ppt','.pptx','.csv'}
ARCHIVE_EXTS={'.zip','.7z','.rar','.tar','.gz','.tgz'}
MEDIA_EXTS={'.mp3','.wav','.mp4','.mov','.webm','.avi','.mkv'}
CODE_EXTS={'.html','.css','.js','.ts','.tsx','.jsx','.py','.php','.json','.md','.txt','.svg','.xml','.yml','.yaml','.sql'}

def now_iso(): return datetime.now(timezone.utc).isoformat().replace('+00:00','Z')
def safe_slug(value,fallback='resource'):
    value=(value or '').strip().replace('\\','/').split('/')[-1] or fallback
    out=[]
    for ch in value:
        if ch.isalnum() or ch in {'.','-','_'}: out.append(ch)
        elif ch.isspace(): out.append('-')
    return (''.join(out).strip('.-_') or fallback)[:160]
def sha256(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
    return h.hexdigest()
def classify(path):
    ext=path.suffix.lower()
    if ext in IMAGE_EXTS: return 'image'
    if ext in DOC_EXTS: return 'document'
    if ext in ARCHIVE_EXTS: return 'archive'
    if ext in MEDIA_EXTS: return 'media'
    if ext in CODE_EXTS: return 'code'
    return 'file'
def skip_reason(path,root,max_bytes):
    name=path.name; lower=name.lower()
    if name in SKIP_NAMES or lower in SKIP_NAMES: return 'sensitive_name'
    if path.suffix.lower() in SENSITIVE_EXTS: return 'sensitive_ext'
    try: size=path.stat().st_size
    except OSError: return 'stat_failed'
    if size<=0: return 'empty'
    if size>max_bytes: return 'too_large'
    try: parts=path.relative_to(root).parts[:-1]
    except ValueError: return 'outside_root'
    for p in parts:
        if p in SKIP_DIRS or p.lower() in SKIP_DIRS: return 'skip_dir'
    return ''
def iter_files(root,max_bytes):
    for current,dirs,files in os.walk(root):
        dirs[:]=[d for d in dirs if d not in SKIP_DIRS and d.lower() not in SKIP_DIRS]
        base=Path(current)
        for fn in files:
            p=base/fn; reason=skip_reason(p,root,max_bytes)
            yield p, reason

def copy_public(path,root,public_dir):
    if public_dir is None: return ''
    rel=path.relative_to(root); target_dir=public_dir/rel.parent; target_dir.mkdir(parents=True,exist_ok=True)
    target=target_dir/safe_slug(path.name,path.stem or 'resource')
    if target.exists(): target=target.with_name(f'{target.stem}-{int(time.time())}{target.suffix}')
    shutil.copy2(path,target)
    return target.relative_to(public_dir).as_posix()

def supabase_upload(path,storage_path,bucket,upsert=False):
    url=os.environ.get('SUPABASE_URL','').rstrip('/'); key=os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_SECRET_KEY')
    if not url or not key: raise RuntimeError('Falta SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY')
    enc_bucket=urllib.parse.quote(bucket,safe=''); enc_path='/'.join(urllib.parse.quote(x,safe='') for x in storage_path.split('/'))
    endpoint=f'{url}/storage/v1/object/{enc_bucket}/{enc_path}'
    req=urllib.request.Request(endpoint,data=path.read_bytes(),method='POST',headers={'apikey':key,'Authorization':f'Bearer {key}','Content-Type':mimetypes.guess_type(str(path))[0] or 'application/octet-stream','x-upsert':'true' if upsert else 'false'})
    try:
        with urllib.request.urlopen(req,timeout=90) as res:
            if res.status>=300: raise RuntimeError(f'Supabase status {res.status}')
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f'Supabase upload failed {exc.code}: {exc.read().decode("utf-8","ignore")[:500]}') from exc
    return f'{url}/storage/v1/object/public/{enc_bucket}/{enc_path}'

def build(args):
    root=Path(args.source).expanduser().resolve()
    if not root.is_dir(): raise SystemExit(f'No existe la carpeta: {root}')
    max_bytes=int(args.max_mb*1024*1024); public_dir=None if args.no_copy or args.supabase else Path(args.public_dir).resolve()
    if public_dir: public_dir.mkdir(parents=True,exist_ok=True)
    resources=[]; seen=set(); skipped=0; duplicates=0
    for path,reason in iter_files(root,max_bytes):
        if reason:
            skipped+=1
            if args.verbose: print('SKIP:'+reason,path)
            continue
        rel=path.relative_to(root).as_posix()
        try: digest=sha256(path)
        except OSError as exc:
            skipped+=1; print(f'SKIP:hash_failed {path}: {exc}',file=sys.stderr); continue
        if digest in seen:
            duplicates+=1
            if args.verbose: print('SKIP:duplicate',rel)
            continue
        seen.add(digest); size=path.stat().st_size; ext=path.suffix.lower().lstrip('.'); url=''; storage_path=''
        category=args.category or (path.relative_to(root).parts[0] if len(path.relative_to(root).parts)>1 else classify(path))
        if args.supabase:
            storage_path=f"{args.prefix.strip('/')}/{rel}" if args.prefix else rel
            storage_path='/'.join(safe_slug(x,'part') for x in storage_path.split('/'))
            url=supabase_upload(path,storage_path,args.bucket,args.upsert)
        else:
            copied=copy_public(path,root,public_dir)
            if copied: url=args.public_prefix.rstrip('/')+'/'+copied
        resources.append({'id':digest[:16],'name':path.name,'category':category,'type':classify(path),'extension':ext,'size_bytes':size,'sha256':digest,'original_path':rel,'storage_path':storage_path,'url':url,'download_url':url,'mime_type':mimetypes.guess_type(str(path))[0] or 'application/octet-stream','description':'Recurso indexado por Hashcod Codespace'})
        if args.verbose: print('OK',rel)
    return {'version':1,'generated_at':now_iso(),'title':'Hashcod Resources','source_root':str(root),'count':len(resources),'skipped':skipped,'duplicates':duplicates,'resources':resources}

def write_outputs(manifest,args):
    out=Path(args.output); out.parent.mkdir(parents=True,exist_ok=True); out.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    if args.js_output:
        js=Path(args.js_output); js.parent.mkdir(parents=True,exist_ok=True)
        js.write_text('window.HASHCOD_RESOURCES_MANIFEST = '+json.dumps(manifest,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
    print(f"Manifest generado: {out} · recursos={manifest['count']} · omitidos={manifest['skipped']} · duplicados={manifest['duplicates']}")
    if args.js_output: print(f'Manifest JS generado: {args.js_output}')

def main():
    p=argparse.ArgumentParser(description='Indexa recursos locales para /resources de Hashcod Codespace')
    p.add_argument('source'); p.add_argument('--output',default='resources/manifest.json'); p.add_argument('--js-output',default='resources/manifest.js')
    p.add_argument('--public-dir',default='resources/files'); p.add_argument('--public-prefix',default='/resources/files'); p.add_argument('--no-copy',action='store_true')
    p.add_argument('--max-mb',type=float,default=25.0); p.add_argument('--category',default=''); p.add_argument('--verbose',action='store_true')
    p.add_argument('--supabase',action='store_true'); p.add_argument('--bucket',default='hashcod-resources'); p.add_argument('--prefix',default='resources'); p.add_argument('--upsert',action='store_true')
    args=p.parse_args(); write_outputs(build(args),args); return 0
if __name__=='__main__': raise SystemExit(main())
