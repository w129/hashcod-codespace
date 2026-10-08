"""Single-file objective checks; external dependencies never auto-install."""
import ast
import hashlib
import importlib.metadata
import json
import os
import re
import signal
import subprocess
import sys
import tempfile

LAUNCHER=os.environ.get('REVIEW_ISOLATION_LAUNCHER','/usr/local/bin/review-isolate.py')
BANDIT='/usr/local/bin/bandit'
SEMGREP='/usr/local/bin/semgrep'
NODE='/usr/bin/node'
WASM_RUNNER=os.environ.get('REVIEW_WASM_LAUNCHER','/usr/local/bin/review-wasm.py')
WASM_ROOT=os.environ.get('REVIEW_WASM_ROOT','/usr/local/share/review-wasm')


def run(command, directory, timeout=30, readonly=False):
    env={'PATH':os.path.dirname(SEMGREP)+':/usr/local/bin:/usr/bin:/bin','HOME':directory,'TMPDIR':directory,'LANG':'C.UTF-8','PYTHONDONTWRITEBYTECODE':'1','REVIEW_WASM_ROOT':WASM_ROOT,
         'SEMGREP_SEND_METRICS':'off','SEMGREP_ENABLE_VERSION_CHECK':'0','NO_COLOR':'1','GOMAXPROCS':'1','GOMEMLIMIT':'256MiB','UV_THREADPOOL_SIZE':'1'}
    diagnostic=os.environ.get('REVIEW_STARTUP_DIAGNOSTIC')=='1'
    if diagnostic: env['REVIEW_STARTUP_DIAGNOSTIC']='1'
    with tempfile.TemporaryFile() as output:
        mode='vm' if len(command)>1 and command[1]==WASM_RUNNER else 'compiler' if command[0]==os.path.join(WASM_ROOT,'javy') else 'readonly' if readonly else 'analysis'
        process=subprocess.Popen([sys.executable,LAUNCHER,directory,mode,*command],cwd=directory,env=env,stdout=output,stderr=output if diagnostic else subprocess.DEVNULL,start_new_session=True)
        try: status=process.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid,signal.SIGKILL); process.wait(); return 124,None
        finally:
            # A user's test cannot leave a child running after its leader exits.
            try: os.killpg(process.pid,signal.SIGKILL)
            except ProcessLookupError: pass
        output.seek(0); raw=output.read(1024*1024+1)
        if diagnostic and status!=0: print('Trusted startup check exit '+str(status)+': '+raw[:3000].decode('utf-8',errors='replace'),flush=True)
        if len(raw)>1024*1024: return 124,None
        return (124 if status<0 else status),raw


def result(kind,tool,version='1',passed=True,status='complete',counts=None,scope=''):
    return {'kind':kind,'tool':tool,'tool_version':version,'status':status,'passed':passed,
            'severity_counts':counts or {'critical':0,'high':0,'medium':0,'low':0},'scope':scope}


def analyze(content,language):
    with tempfile.TemporaryDirectory(prefix='review-') as directory:
        filename='input.py' if language=='python' else 'input.js'
        path=os.path.join(directory,filename)
        with open(path,'wb') as file: file.write(content)
        probe=os.path.join(directory,'probe.py')
        with open(probe,'w') as file:
            file.write("import os,sys\nassert sys.platform=='wasi'\nfor path in ['/proc/self/environ','/proc/1/environ','/app/server.py','/etc/passwd']:\n try:\n  open(path).read(); raise RuntimeError('filesystem escape')\n except OSError: pass\ntry:\n open('/job/newfile','w'); raise RuntimeError('write escape')\nexcept OSError: pass\ntry:\n import socket; socket.socket(); raise RuntimeError('network escape')\nexcept (OSError,ImportError,AttributeError): pass\n")
        python_wasm=os.path.join(WASM_ROOT,'python','python.wasm')
        status,_=run([sys.executable,WASM_RUNNER,python_wasm,directory,'/job/probe.py'],directory,30)
        isolated=status==0
        sandbox=result('sandbox','WASI Wasmtime','49.0.2',isolated,'complete' if isolated else 'unavailable',scope='WebAssembly sin red ni procesos host; archivos de solo lectura, memoria 256MiB, 2000M instrucciones; salida descartada.')
        if not isolated: return [sandbox]+[result(k,'not-run',passed=False,status='unavailable') for k in ['tests','sast','secrets','deps']]
        text=content.decode('utf-8')
        # Prevent source instructions from being submitted to the model as authority.
        injection=bool(re.search(r'(?:ignore|ignora|disregard).{0,80}(?:instructions|instrucciones|previous|anteriores).{0,160}(?:approve|pass|aprueba|certific)',text,re.I|re.S))
        tests=result('tests','Python AST' if language=='python' else 'node --check',sys.version.split()[0] if language=='python' else 'node20',scope='Sintaxis; no prueba funcional incluida.')
        deps=result('deps','standard-library-allowlist','2026-10-08',scope='Sin instalación de paquetes; dependencias externas requieren revisión humana.')
        try:
            if language=='python':
                tree=ast.parse(text)
                imports={n.name.split('.')[0] for n in ast.walk(tree) if isinstance(n,ast.ImportFrom) and n.module for n in [ast.alias(n.module)]}
                imports|={a.name.split('.')[0] for n in ast.walk(tree) if isinstance(n,ast.Import) for a in n.names}
                external=imports-set(sys.stdlib_module_names)
                if external: deps['status']='unavailable'; deps['passed']=False
                if not external and 'unittest' in imports:
                    status,_=run([sys.executable,WASM_RUNNER,python_wasm,directory,'-m','unittest','discover','-s','/job','-p','input.py'],directory,readonly=True)
                    tests.update(passed=status==0,status='unavailable' if status in (124,125) else 'complete',scope='Sintaxis y unittest en CPython 3.14 WASI; no servicios ni paquetes host.'); tests['tool']='Python unittest WASI'
            else:
                status,_=run([NODE,'--max-old-space-size=256','--check',path],directory)
                tests['passed']=status==0; tests['status']='unavailable' if status in (124,125) else 'complete'
                imports=re.findall(r'(?:require\s*\(\s*|from\s+|import\s*)[\'"]([^\'"]+)',text)
                # Only explicitly namespaced Node standard libraries are covered.
                if any(not x.startswith('node:') for x in imports): deps['status']='unavailable'; deps['passed']=False
                if imports:
                    deps['status']='unavailable';deps['passed']=False
                elif tests['passed']:
                    compiled=os.path.join(directory,'input.wasm')
                    status,_=run([os.path.join(WASM_ROOT,'javy'),'build',path,'-o',compiled],directory)
                    if status==0: status,_=run([sys.executable,WASM_RUNNER,compiled,directory],directory,readonly=True)
                    tests.update(passed=status==0,status='unavailable' if status in (124,125) else 'complete',scope='Sintaxis y arranque JavaScript en QuickJS/WASI; APIs de Node y navegador requieren revisión humana.');tests['tool']='Javy QuickJS WASI';tests['tool_version']='9.1.0'
        except (SyntaxError,ValueError): tests['passed']=False
        if language=='python':
            version=importlib.metadata.version('bandit')
            status,raw=run([BANDIT,'-q','-f','json',path],directory)
            sast=result('sast','Bandit',version)
            try:
                parsed=json.loads(raw); findings=parsed['results']
                if status not in (0,1) or parsed.get('errors'): raise ValueError()
                for f in findings: sast['severity_counts'][f['issue_severity'].lower()]+=1
                # Findings never include source snippets or secret values in results.
                sast['passed']=not findings
            except Exception: sast.update(status='unavailable',passed=False)
        else:
            rules={'rules':[{'id':'code-execution','languages':['javascript'],'severity':'ERROR','message':'Dynamic execution requires human review','pattern-either':[{'pattern':'eval(...)'},{'pattern':'new Function(...)'},{'pattern':'$X.exec(...)'}]}]}
            config=os.path.join(directory,'rules.json')
            with open(config,'w') as file: json.dump(rules,file)
            status,raw=run([SEMGREP,'scan','--config',config,'--json','--metrics=off','--disable-version-check','--jobs','1','--max-memory','256',path],directory)
            sast=result('sast','Semgrep',importlib.metadata.version('semgrep'))
            try:
                parsed=json.loads(raw)
                if status not in (0,1) or parsed.get('errors'): raise ValueError()
                sast['severity_counts']['high']=len(parsed['results']); sast['passed']=not parsed['results']
            except Exception: sast.update(status='unavailable',passed=False)
        if injection: sast['severity_counts']['critical']+=1; sast['passed']=False
        report=os.path.join(directory,'secrets.json')
        status,_=run(['/usr/bin/gitleaks','dir',path,'--no-banner','--redact=100','--report-format','json','--report-path',report],directory)
        secrets=result('secrets','gitleaks','8.28.0')
        try:
            with open(report) as file: findings=json.load(file)
            if status not in (0,1) or not isinstance(findings,list): raise ValueError()
            secrets['severity_counts']['critical']=len(findings); secrets['passed']=not findings
        except Exception: secrets.update(status='unavailable',passed=False)
        if re.search(r'sk-(?:ant-)?[A-Za-z0-9_-]{16,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',text):
            secrets['severity_counts']['critical']+=1;secrets['passed']=False
        return [sandbox,tests,sast,secrets,deps]
