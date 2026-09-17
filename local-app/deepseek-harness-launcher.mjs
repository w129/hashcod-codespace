import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const HOST = '127.0.0.1';
const DEFAULT_PORT = 3080;
const PACKAGE = '@deepseek-ai/dsh';

function fail(message) {
  console.error('[HASHCOD-DSH]', message);
  process.exit(1);
}

function parseArgs(argv) {
  let port = DEFAULT_PORT;
  let workspace = process.cwd();

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--port') {
      const value = Number(argv[i + 1]);
      if (!Number.isInteger(value) || value < 1024 || value > 65535) fail('Puerto inválido. Usa un valor entre 1024 y 65535.');
      port = value;
      i += 1;
    } else if (token === '--workspace') {
      const value = argv[i + 1];
      if (!value) fail('Falta la ruta después de --workspace.');
      workspace = path.resolve(value);
      i += 1;
    } else if (token === '--help' || token === '-h') {
      console.log('Hashcod DeepSeek Harness launcher');
      console.log('  node local-app/deepseek-harness-launcher.mjs [--port 3080] [--workspace <path>]');
      process.exit(0);
    } else {
      fail('Argumento no reconocido: ' + token);
    }
  }

  return { port, workspace };
}

function ensureSupportedNode() {
  const [majorText, minorText] = process.versions.node.split('.');
  const major = Number(majorText);
  const minor = Number(minorText);
  const supported = major >= 24 || (major === 22 && minor >= 19);
  if (!supported) {
    fail('DeepSeek Harness requiere Node 22.19+ o Node 24+. Versión actual: ' + process.versions.node);
  }
}

ensureSupportedNode();
const options = parseArgs(process.argv.slice(2));
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const dshHome = process.env.DSH_HOME || path.join(os.homedir(), '.hashcod', 'deepseek-harness');
const childArgs = [
  '--yes',
  PACKAGE,
  'web',
  '--host', HOST,
  '--port', String(options.port),
  '--no-open'
];

console.log('[HASHCOD-DSH] Starting DeepSeek Harness');
console.log('[HASHCOD-DSH] Workspace:', options.workspace);
console.log('[HASHCOD-DSH] Runtime: http://' + HOST + ':' + options.port);
console.log('[HASHCOD-DSH] DSH_HOME:', dshHome);

const child = spawn(npx, childArgs, {
  cwd: options.workspace,
  env: { ...process.env, DSH_HOME: dshHome },
  stdio: 'inherit',
  shell: false,
  windowsHide: true
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal);
  });
}

child.on('error', (error) => {
  fail('No se pudo iniciar npx/@deepseek-ai/dsh: ' + error.message);
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.log('[HASHCOD-DSH] Runtime cerrado por señal:', signal);
    process.exit(0);
  }
  process.exit(typeof code === 'number' ? code : 1);
});
