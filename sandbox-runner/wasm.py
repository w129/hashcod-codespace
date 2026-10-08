"""Only WebAssembly executes submitted code; no host Python/Node imports."""
import os
import sys
from pathlib import Path
import wasmtime


def execute(module_path,job,python_args=None):
    root=Path(os.environ.get('REVIEW_WASM_ROOT','/usr/local/share/review-wasm'))
    if (root/'engine-version').read_text().strip()!='49.0.2': raise RuntimeError('Unpatched engine')
    config=wasmtime.Config();config.consume_fuel=True;config.wasm_threads=False;config.wasm_memory64=False
    config.parallel_compilation=False;config.memory_reservation=256*1024*1024;config.memory_guard_size=65536
    engine=wasmtime.Engine(config);store=wasmtime.Store(engine)
    store.set_limits(memory_size=256*1024*1024,table_elements=100000,instances=2,tables=2,memories=1)
    store.set_fuel(2000000000)
    wasi=wasmtime.WasiConfig()
    if python_args is not None:
        wasi.argv=['python','-B',*python_args]
        wasi.env=[('PYTHONHOME','/runtime'),('PYTHONPATH','/job'),('PYTHONDONTWRITEBYTECODE','1')]
        wasi.preopen_dir(str(root/'python'),'/runtime',fs_mutable=False)
        wasi.preopen_dir(job,'/job',fs_mutable=False)
    else: wasi.argv=['review.js'];wasi.env=[]
    # Guest output is discarded at the host boundary, never buffered, logged or
    # added to a provider prompt. No Python callbacks run on native IO threads.
    wasi.stdout_file=os.devnull;wasi.stderr_file=os.devnull;wasi.stdin_file=os.devnull
    store.set_wasi(wasi)
    linker=wasmtime.Linker(engine);linker.define_wasi()
    module=wasmtime.Module.from_file(engine,module_path)
    instance=linker.instantiate(store,module)
    try: instance.exports(store)['_start'](store)
    except wasmtime.ExitTrap as e:
        if e.code!=0: return e.code
    return 0


if __name__=='__main__':
    try: sys.exit(execute(sys.argv[1],sys.argv[2],sys.argv[3:] if len(sys.argv)>3 else None))
    except Exception: sys.exit(124)
