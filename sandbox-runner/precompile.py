"""Build-time compilation of the pinned standard library, never user input."""
import os
from pathlib import Path
import sys
import wasmtime
root=Path(sys.argv[1]);config=wasmtime.Config();config.parallel_compilation=False
config.memory_reservation=256*1024*1024;config.memory_guard_size=65536
engine=wasmtime.Engine(config);store=wasmtime.Store(engine);store.set_limits(memory_size=256*1024*1024)
wasi=wasmtime.WasiConfig();wasi.env=[('PYTHONHOME','/runtime')]
wasi.argv=['python','-c',"import os,py_compile; [(py_compile.compile(os.path.join(d,n),doraise=True)) for d,dirs,files in os.walk('/runtime/lib/python3.14') for n in files if n.endswith('.py') and '/test' not in d]"]
wasi.preopen_dir(str(root/'python'),'/runtime',fs_mutable=True)
wasi.stdin_file=os.devnull;wasi.stdout_file=os.devnull;wasi.stderr_file=os.devnull
store.set_wasi(wasi);linker=wasmtime.Linker(engine);linker.define_wasi()
module=wasmtime.Module.from_file(engine,str(root/'python/python.wasm'));instance=linker.instantiate(store,module)
try: instance.exports(store)['_start'](store)
except wasmtime.ExitTrap as error:
    if error.code: raise
