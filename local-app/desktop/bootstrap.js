'use strict';

const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');

const HARNESS_HOST = '127.0.0.1';
const HARNESS_PORT = 3080;
const HARNESS_ORIGIN = `http://${HARNESS_HOST}:${HARNESS_PORT}`;
const HARNESS_PACKAGE_VERSION = '0.1.1-rc.2';
const HASHCOD_HARNESS_TOOL_ID = 'deepseek-harness';
const HASHCOD_HARNESS_SLOT = 5;

let harnessProcess = null;
let harnessOwned = false;
let harnessReady = false;
let harnessLastError = '';
const trackedWindows = new Set();

function logHarness(message) {
    try {
        const dir = app.getPath('userData');
        fs.mkdirSync(dir, { recursive: true });
        fs.appendFileSync(
            path.join(dir, 'deepseek-harness.log'),
            `[${new Date().toISOString()}] ${message}\n`,
            'utf8'
        );
    } catch (_) {}
}

function portOpen(port, timeoutMs = 750) {
    return new Promise((resolve) => {
        let settled = false;
        const socket = net.createConnection({ host: HARNESS_HOST, port });
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

async function waitForHarness(timeoutMs = 90000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
        if (await portOpen(HARNESS_PORT, 650)) return true;
        if (harnessProcess && harnessProcess.exitCode !== null) {
            throw new Error(`DeepSeek Harness stopped with code ${harnessProcess.exitCode}.`);
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
    }
    throw new Error('DeepSeek Harness did not start on 127.0.0.1:3080 in time.');
}

function resolveHarnessBin() {
    const manifest = require.resolve('@deepseek-ai/dsh/package.json');
    const packageRoot = path.dirname(manifest);
    const bin = path.join(packageRoot, 'lib', 'bin.js');
    if (!fs.existsSync(bin)) {
        throw new Error(`DeepSeek Harness launcher not found at ${bin}`);
    }
    return bin;
}

function harnessRuntimePaths() {
    const root = path.join(app.getPath('userData'), 'deepseek-harness');
    const home = path.join(root, 'home');
    const workspace = path.join(root, 'workspace');
    fs.mkdirSync(home, { recursive: true });
    fs.mkdirSync(workspace, { recursive: true });
    return { root, home, workspace };
}

function rendererInstallScript() {
    return `(() => {
        if (location.hostname === '${HARNESS_HOST}' && location.port === '${HARNESS_PORT}') return;
        const ORIGIN = '${HARNESS_ORIGIN}';
        const SLOT = ${HASHCOD_HARNESS_SLOT};
        const TOOL_ID = '${HASHCOD_HARNESS_TOOL_ID}';
        const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"><rect x="7" y="9" width="50" height="46" rx="11" fill="none" stroke="currentColor" stroke-width="4"/><path d="M18 23h28M18 32h18M18 41h24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="47" cy="41" r="5" fill="currentColor"/></svg>';
        window.__HASHCOD_DSH_READY__ = Boolean(window.__HASHCOD_DSH_READY__);
        window.__HASHCOD_DSH_ERROR__ = String(window.__HASHCOD_DSH_ERROR__ || '');

        function ensureDialog() {
            let dialog = document.getElementById('hashcodDeepSeekHarnessStatus');
            if (dialog) return dialog;
            dialog = document.createElement('dialog');
            dialog.id = 'hashcodDeepSeekHarnessStatus';
            dialog.setAttribute('aria-label', 'DeepSeek Harness local');
            dialog.style.cssText = 'width:min(560px,92vw);border:1px solid #111;border-radius:16px;padding:0;background:#fff;color:#111;box-shadow:0 24px 70px rgba(0,0,0,.22);font-family:IBM Plex Mono,Consolas,monospace;';
            dialog.innerHTML = '<div style="padding:22px 24px;border-bottom:1px solid #ddd;display:flex;align-items:center;justify-content:space-between;gap:16px"><div><div style="font-size:11px;letter-spacing:.12em;color:#666">HASHCOD / AGENT HARNESS</div><div style="font-size:22px;font-weight:800;margin-top:4px">DeepSeek Harness</div></div><button type="button" data-dsh-close style="border:1px solid #111;background:#fff;border-radius:8px;width:38px;height:38px;font:inherit;cursor:pointer">×</button></div><div style="padding:22px 24px;display:grid;gap:14px"><div data-dsh-status style="padding:14px;border:1px solid #ddd;border-radius:10px;background:#f7f7f5;line-height:1.5"></div><div style="font-size:12px;color:#666;line-height:1.55">El runtime se mantiene limitado a 127.0.0.1:3080. Hashcod inicia el proceso local y espera a que el puerto esté disponible antes de permitir abrirlo.</div><div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" data-dsh-open style="border:1px solid #111;background:#111;color:#fff;border-radius:9px;padding:10px 14px;font:inherit;font-weight:700;cursor:pointer">Abrir Harness</button><button type="button" data-dsh-retry style="border:1px solid #111;background:#fff;color:#111;border-radius:9px;padding:10px 14px;font:inherit;font-weight:700;cursor:pointer">Comprobar otra vez</button></div></div>';
            document.body.appendChild(dialog);
            dialog.querySelector('[data-dsh-close]').addEventListener('click', () => dialog.close());
            dialog.querySelector('[data-dsh-open]').addEventListener('click', () => {
                if (!window.__HASHCOD_DSH_READY__) return;
                window.open(ORIGIN, '_blank');
                dialog.close();
            });
            dialog.querySelector('[data-dsh-retry]').addEventListener('click', () => updateDialog(dialog));
            return dialog;
        }

        function updateDialog(dialog) {
            const status = dialog.querySelector('[data-dsh-status]');
            const open = dialog.querySelector('[data-dsh-open]');
            if (window.__HASHCOD_DSH_READY__) {
                status.textContent = 'Runtime activo en ' + ORIGIN + '. Ya puedes abrir DeepSeek Harness.';
                open.disabled = false;
                open.style.opacity = '1';
            } else {
                status.textContent = window.__HASHCOD_DSH_ERROR__ || 'DeepSeek Harness todavía está iniciando. Hashcod seguirá comprobando el puerto local.';
                open.disabled = true;
                open.style.opacity = '.45';
            }
        }

        function openHarness() {
            if (window.__HASHCOD_DSH_READY__) {
                window.open(ORIGIN, '_blank');
                return;
            }
            const dialog = ensureDialog();
            updateDialog(dialog);
            if (typeof dialog.showModal === 'function') dialog.showModal();
            else dialog.setAttribute('open', '');
        }

        function register() {
            const tray = window.HashcodVectorTray;
            if (!tray || typeof tray.registerTool !== 'function') return false;
            tray.registerTool({
                slot: SLOT,
                id: TOOL_ID,
                label: 'DeepSeek Harness · local agent runtime',
                iconSvg: ICON,
                onClick: openHarness
            });
            document.documentElement.dataset.hashcodDeepseekHarness = 'registered';
            return true;
        }

        window.addEventListener('hashcod:dsh-status', (event) => {
            const detail = event && event.detail ? event.detail : {};
            window.__HASHCOD_DSH_READY__ = Boolean(detail.ready);
            window.__HASHCOD_DSH_ERROR__ = String(detail.error || '');
            const dialog = document.getElementById('hashcodDeepSeekHarnessStatus');
            if (dialog) updateDialog(dialog);
            register();
        });

        if (!register()) {
            let tries = 0;
            const timer = setInterval(() => {
                tries += 1;
                if (register() || tries > 80) clearInterval(timer);
            }, 250);
        }
    })();`;
}

function statusDispatchScript() {
    return `(() => {
        window.__HASHCOD_DSH_READY__ = ${harnessReady ? 'true' : 'false'};
        window.__HASHCOD_DSH_ERROR__ = ${JSON.stringify(harnessLastError)};
        window.dispatchEvent(new CustomEvent('hashcod:dsh-status', { detail: { ready: window.__HASHCOD_DSH_READY__, error: window.__HASHCOD_DSH_ERROR__ } }));
    })();`;
}

function notifyRendererStatus() {
    for (const win of trackedWindows) {
        if (!win || win.isDestroyed()) continue;
        win.webContents.executeJavaScript(statusDispatchScript()).catch(() => {});
    }
}

function installHarnessCube(win) {
    if (!win || win.isDestroyed()) return;
    trackedWindows.add(win);
    win.on('closed', () => trackedWindows.delete(win));
    win.webContents.on('dom-ready', () => {
        win.webContents.executeJavaScript(rendererInstallScript())
            .then(() => win.webContents.executeJavaScript(statusDispatchScript()))
            .catch((error) => logHarness(`renderer integration failed: ${error.message}`));
    });
}

async function startHarness() {
    try {
        if (await portOpen(HARNESS_PORT)) {
            harnessReady = true;
            harnessLastError = '';
            harnessOwned = false;
            logHarness(`Using existing DeepSeek Harness runtime at ${HARNESS_ORIGIN}.`);
            notifyRendererStatus();
            return;
        }

        const bin = resolveHarnessBin();
        const runtime = harnessRuntimePaths();
        const env = {
            ...process.env,
            ELECTRON_RUN_AS_NODE: '1',
            DSH_HOME: runtime.home,
            BROWSER: 'none',
            NO_COLOR: '1'
        };
        const args = [bin, 'web', '--host', HARNESS_HOST, '--port', String(HARNESS_PORT), '--no-open'];
        logHarness(`Starting @deepseek-ai/dsh@${HARNESS_PACKAGE_VERSION} on ${HARNESS_ORIGIN}.`);
        harnessProcess = spawn(process.execPath, args, {
            cwd: runtime.workspace,
            env,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe']
        });
        harnessOwned = true;
        harnessProcess.stdout.on('data', (chunk) => logHarness(`stdout: ${String(chunk).trim()}`));
        harnessProcess.stderr.on('data', (chunk) => logHarness(`stderr: ${String(chunk).trim()}`));
        harnessProcess.once('error', (error) => {
            harnessReady = false;
            harnessLastError = `No se pudo iniciar DeepSeek Harness: ${error.message}`;
            logHarness(harnessLastError);
            notifyRendererStatus();
        });
        harnessProcess.once('exit', (code, signal) => {
            logHarness(`process exited code=${code} signal=${signal || 'none'}`);
            harnessProcess = null;
            harnessReady = false;
            if (!app.isQuitting) {
                harnessLastError = `DeepSeek Harness se detuvo (código ${code ?? 'desconocido'}).`;
                notifyRendererStatus();
            }
        });

        await waitForHarness();
        harnessReady = true;
        harnessLastError = '';
        logHarness(`DeepSeek Harness ready at ${HARNESS_ORIGIN}.`);
        notifyRendererStatus();
    } catch (error) {
        harnessReady = false;
        harnessLastError = `DeepSeek Harness no pudo iniciar: ${error.message}`;
        logHarness(harnessLastError);
        notifyRendererStatus();
    }
}

function stopHarness() {
    if (!harnessOwned || !harnessProcess) return;
    try { harnessProcess.kill(); } catch (_) {}
    harnessProcess = null;
    harnessOwned = false;
    harnessReady = false;
}

app.on('browser-window-created', (_event, win) => installHarnessCube(win));
app.whenReady().then(() => startHarness()).catch((error) => logHarness(`startup scheduling failed: ${error.message}`));
app.on('before-quit', () => {
    app.isQuitting = true;
    stopHarness();
});

require('./main.js');
