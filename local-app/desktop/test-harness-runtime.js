'use strict';

const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const HOST = '127.0.0.1';
const PORT = 3080;
const TIMEOUT_MS = 90000;

function portOpen(timeoutMs = 700) {
    return new Promise((resolve) => {
        let settled = false;
        const socket = net.createConnection({ host: HOST, port: PORT });
        const finish = (value) => {
            if (settled) return;
            settled = true;
            socket.destroy();
            resolve(value);
        };
        socket.setTimeout(timeoutMs);
        socket.once('connect', () => finish(true));
        socket.once('timeout', () => finish(false));
        socket.once('error', () => finish(false));
    });
}

async function main() {
    if (await portOpen()) {
        console.log('DeepSeek Harness smoke test: port 3080 already active.');
        return;
    }

    const manifest = require.resolve('@deepseek-ai/dsh/package.json');
    const bin = path.join(path.dirname(manifest), 'lib', 'bin.js');
    if (!fs.existsSync(bin)) throw new Error(`DeepSeek Harness bin missing: ${bin}`);

    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hashcod-dsh-ci-'));
    const home = path.join(root, 'home');
    const workspace = path.join(root, 'workspace');
    fs.mkdirSync(home, { recursive: true });
    fs.mkdirSync(workspace, { recursive: true });

    const child = spawn(process.execPath, [bin, 'web', '--host', HOST, '--port', String(PORT), '--no-open'], {
        cwd: workspace,
        env: {
            ...process.env,
            DSH_HOME: home,
            BROWSER: 'none',
            NO_COLOR: '1'
        },
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += String(chunk); });
    child.stderr.on('data', (chunk) => { stderr += String(chunk); });

    try {
        const started = Date.now();
        while (Date.now() - started < TIMEOUT_MS) {
            if (child.exitCode !== null) {
                throw new Error(`DeepSeek Harness exited before opening 3080 (code ${child.exitCode}).\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
            }
            if (await portOpen()) {
                console.log('DeepSeek Harness runtime smoke test: OK (127.0.0.1:3080 is listening).');
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, 400));
        }
        throw new Error(`Timed out waiting for 127.0.0.1:3080.\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
    } finally {
        if (child.exitCode === null) {
            try { child.kill(); } catch (_) {}
        }
        fs.rmSync(root, { recursive: true, force: true });
    }
}

main().catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
});
