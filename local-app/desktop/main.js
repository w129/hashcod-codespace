'use strict';

const { app, BrowserWindow, dialog, shell, session } = require('electron');
const fs = require('fs');
const path = require('path');
const net = require('net');
const crypto = require('crypto');
const { spawn } = require('child_process');

const APP_TITLE = 'Hashcod Codespace';
const APP_ID = 'app.hashcod.codespace';
const LOOPBACK_HOST = '127.0.0.1';
const CLOUD_ORIGIN = 'https://hashcod-codespace-1.onrender.com';
const PRESERVE_PATHS = ['.env', 'LOCAL-DB-CREDENTIALS.txt', 'data_storage', 'uploads'];
const MIN_SPLASH_TIME_MS = 1800;
const DESKTOP_ALLOWED_PERMISSIONS = new Set([
    'media',
    'clipboard-read',
    'clipboard-sanitized-write',
    'fullscreen',
    'notifications',
    'pointerLock'
]);

let mainWindow = null;
let phpProcess = null;
let localOrigin = '';
let shuttingDown = false;
let splashStartedAt = 0;
let desktopBridgeToken = '';

function log(message) {
    try {
        const dir = app.getPath('userData');
        fs.mkdirSync(dir, { recursive: true });
        const line = `[${new Date().toISOString()}] ${message}\n`;
        fs.appendFileSync(path.join(dir, 'desktop.log'), line, 'utf8');
    } catch (_) {}
}

function resourcePath(name) {
    return path.join(process.resourcesPath, name);
}

function desktopIconPath() {
    const iconPath = resourcePath('icon.png');
    return fs.existsSync(iconPath) ? iconPath : undefined;
}

function splashFilePath() {
    return path.join(__dirname, 'splash.html');
}

function localRuntimeRoot() {
    return path.join(app.getPath('userData'), 'runtime');
}

function ensureDesktopBridgeToken() {
    if (!desktopBridgeToken) desktopBridgeToken = crypto.randomBytes(32).toString('hex');
    return desktopBridgeToken;
}

function isLoopbackUrl(value) {
    try {
        const parsed = new URL(String(value || ''));
        return parsed.protocol === 'http:' && parsed.hostname === LOOPBACK_HOST;
    } catch (_) {
        return false;
    }
}

function copyPath(source, destination) {
    if (!fs.existsSync(source)) return;
    fs.cpSync(source, destination, { recursive: true, force: true, errorOnExist: false });
}

function ensureLocalSite() {
    const bundledSite = resourcePath('site');
    const runtimeRoot = localRuntimeRoot();
    const liveSite = path.join(runtimeRoot, 'site');
    const stagingSite = path.join(runtimeRoot, 'site.staging');
    const previousSite = path.join(runtimeRoot, 'site.previous');
    const versionFile = path.join(runtimeRoot, 'bundle-version.txt');
    const packagedVersion = app.getVersion();

    if (!fs.existsSync(path.join(bundledSite, 'router.php'))) {
        throw new Error('The desktop package does not contain the Hashcod Codespace site payload.');
    }

    fs.mkdirSync(runtimeRoot, { recursive: true });
    let installedVersion = '';
    try { installedVersion = fs.readFileSync(versionFile, 'utf8').trim(); } catch (_) {}

    if (installedVersion === packagedVersion && fs.existsSync(path.join(liveSite, 'router.php'))) {
        return liveSite;
    }

    log(`Installing local site bundle ${packagedVersion}; previous bundle ${installedVersion || 'none'}.`);
    fs.rmSync(stagingSite, { recursive: true, force: true });
    fs.rmSync(previousSite, { recursive: true, force: true });
    fs.mkdirSync(stagingSite, { recursive: true });
    copyPath(bundledSite, stagingSite);

    if (fs.existsSync(liveSite)) {
        for (const relativePath of PRESERVE_PATHS) {
            const oldPath = path.join(liveSite, relativePath);
            const newPath = path.join(stagingSite, relativePath);
            if (fs.existsSync(oldPath)) {
                fs.rmSync(newPath, { recursive: true, force: true });
                copyPath(oldPath, newPath);
            }
        }
        fs.renameSync(liveSite, previousSite);
    }

    try {
        fs.renameSync(stagingSite, liveSite);
        fs.rmSync(previousSite, { recursive: true, force: true });
    } catch (error) {
        if (!fs.existsSync(liveSite) && fs.existsSync(previousSite)) fs.renameSync(previousSite, liveSite);
        throw error;
    }

    const envFile = path.join(liveSite, '.env');
    const envExample = path.join(liveSite, '.env.example');
    if (!fs.existsSync(envFile) && fs.existsSync(envExample)) fs.copyFileSync(envExample, envFile);

    fs.mkdirSync(path.join(liveSite, 'data_storage'), { recursive: true });
    fs.mkdirSync(path.join(liveSite, 'uploads'), { recursive: true });
    fs.writeFileSync(versionFile, packagedVersion + '\n', 'utf8');
    return liveSite;
}

function getFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.once('error', reject);
        server.listen(0, LOOPBACK_HOST, () => {
            const address = server.address();
            const port = address && typeof address === 'object' ? address.port : 0;
            server.close((error) => {
                if (error) reject(error);
                else if (!port) reject(new Error('Could not allocate a local TCP port.'));
                else resolve(port);
            });
        });
    });
}

function waitForPort(port, timeoutMs = 30000) {
    const startedAt = Date.now();
    return new Promise((resolve, reject) => {
        const attempt = () => {
            if (phpProcess && phpProcess.exitCode !== null) {
                reject(new Error(`Local PHP server stopped with code ${phpProcess.exitCode}.`));
                return;
            }
            let finished = false;
            const socket = net.createConnection({ host: LOOPBACK_HOST, port });
            socket.setTimeout(800);
            const retry = () => {
                if (finished) return;
                finished = true;
                socket.destroy();
                if (Date.now() - startedAt >= timeoutMs) {
                    reject(new Error('The local Hashcod Codespace server did not start in time.'));
                    return;
                }
                setTimeout(attempt, 250);
            };
            socket.once('connect', () => {
                if (finished) return;
                finished = true;
                socket.destroy();
                resolve();
            });
            socket.once('timeout', retry);
            socket.once('error', retry);
        };
        attempt();
    });
}

function setHeader(responseHeaders, name, values) {
    const key = Object.keys(responseHeaders).find((candidate) => candidate.toLowerCase() === name.toLowerCase()) || name;
    responseHeaders[key] = Array.isArray(values) ? values : [String(values)];
}

function installDesktopRequestBridge() {
    const token = ensureDesktopBridgeToken();
    const filter = { urls: ['http://127.0.0.1/*'] };

    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        const requestHeaders = Object.assign({}, details.requestHeaders || {});
        requestHeaders['X-Hashcod-Desktop-Token'] = token;
        requestHeaders['X-Hashcod-Desktop-App'] = APP_ID;
        callback({ requestHeaders });
    });

    // Production deliberately disables camera/microphone and limits frames. The
    // installed loopback app needs camera scanning, clipboard and embedded HTTPS
    // tools, so relax only those response policies inside 127.0.0.1.
    session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
        const responseHeaders = Object.assign({}, details.responseHeaders || {});
        setHeader(responseHeaders, 'Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=()');

        const cspKey = Object.keys(responseHeaders).find((key) => key.toLowerCase() === 'content-security-policy');
        if (cspKey && Array.isArray(responseHeaders[cspKey])) {
            responseHeaders[cspKey] = responseHeaders[cspKey].map((value) => {
                let next = String(value || '');
                if (/frame-src\s/i.test(next)) {
                    next = next.replace(/frame-src\s+[^;]*/i, "frame-src 'self' https:");
                } else {
                    next += "; frame-src 'self' https:";
                }
                return next;
            });
        }
        callback({ responseHeaders });
    });
}

function installDesktopPermissionPolicy() {
    const allowed = (webContents, permission, requestingOrigin) => {
        const origin = String(requestingOrigin || (webContents && webContents.getURL ? webContents.getURL() : ''));
        return isLoopbackUrl(origin) && DESKTOP_ALLOWED_PERMISSIONS.has(permission);
    };

    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
        callback(allowed(webContents, permission, details && details.requestingUrl ? details.requestingUrl : ''));
    });
    session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
        return allowed(webContents, permission, requestingOrigin);
    });
}

async function startLocalServer(sitePath) {
    const phpExe = resourcePath(path.join('php', 'php.exe'));
    const phpIni = resourcePath(path.join('php', 'php.ini'));
    if (!fs.existsSync(phpExe)) throw new Error('The desktop package does not contain php.exe.');

    const port = await getFreePort();
    localOrigin = `http://${LOOPBACK_HOST}:${port}`;
    const args = [];
    if (fs.existsSync(phpIni)) args.push('-c', phpIni);
    args.push('-S', `${LOOPBACK_HOST}:${port}`, 'router.php');

    const childEnv = {
        ...process.env,
        APP_ENV: 'local',
        HASHCOD_DESKTOP: '1',
        HASHCOD_DESKTOP_ORIGIN: localOrigin,
        HASHCOD_DESKTOP_ADMIN_TOKEN: ensureDesktopBridgeToken(),
        HASHCOD_CLOUD_ORIGIN: CLOUD_ORIGIN,
        L8_TRUST_PROXY: '0',
        L8_REQUIRE_AUTH_MUTATIONS: '1'
    };

    phpProcess = spawn(phpExe, args, { cwd: sitePath, env: childEnv, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    phpProcess.stdout.on('data', (chunk) => log(`php: ${String(chunk).trim()}`));
    phpProcess.stderr.on('data', (chunk) => log(`php-error: ${String(chunk).trim()}`));
    phpProcess.once('error', (error) => log(`php process error: ${error.stack || error.message}`));
    phpProcess.once('exit', (code, signal) => {
        log(`php process exited code=${code} signal=${signal || 'none'}`);
        phpProcess = null;
    });

    await waitForPort(port);
    return localOrigin;
}

function loadingPage(message) {
    const safeMessage = String(message).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${APP_TITLE}</title><style>html,body{height:100%;margin:0;background:#fff;color:#111;font-family:Inter,Segoe UI,Arial,sans-serif}body{display:grid;place-items:center}.wrap{width:min(520px,calc(100% - 48px));text-align:center}h1{font-size:24px;margin:0 0 10px}p{font-size:14px;color:#555}.bar{height:3px;background:#ececec;overflow:hidden;border-radius:99px}.bar:after{content:"";display:block;width:38%;height:100%;background:#111;animation:move 1.15s ease-in-out infinite}@keyframes move{0%{transform:translateX(-110%)}100%{transform:translateX(320%)}}</style></head><body><main class="wrap"><h1>Hashcod Codespace</h1><p>${safeMessage}</p><div class="bar"></div></main></body></html>`;
}

async function showStartupSplash(message) {
    if (!mainWindow) return;
    if (!splashStartedAt) splashStartedAt = Date.now();
    const splashPath = splashFilePath();
    if (fs.existsSync(splashPath)) {
        await mainWindow.loadFile(splashPath, { query: { message: String(message || '') } });
        return;
    }
    await mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(loadingPage(message)));
}

async function waitForMinimumSplash() {
    if (!splashStartedAt) return;
    const remaining = MIN_SPLASH_TIME_MS - (Date.now() - splashStartedAt);
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
}

function markDesktopRenderer() {
    if (!mainWindow || !isLoopbackUrl(mainWindow.webContents.getURL())) return;
    mainWindow.webContents.executeJavaScript(`
        (() => {
            document.documentElement.dataset.hashcodDesktop = 'true';
            window.__HASHCOD_DESKTOP__ = true;
            window.turnstileTokens = window.turnstileTokens || {};
            window.turnstileTokens.register = 'desktop-loopback';
            if (!document.getElementById('hashcodDesktopCompatStyle')) {
                const style = document.createElement('style');
                style.id = 'hashcodDesktopCompatStyle';
                style.textContent = '.cf-turnstile,#cfTurnstileRegister{display:none!important}';
                document.head.appendChild(style);
            }
            document.addEventListener('click', (event) => {
                const button = event.target && event.target.closest ? event.target.closest('#authRegisterBtn') : null;
                if (!button) return;
                window.turnstileTokens = window.turnstileTokens || {};
                window.turnstileTokens.register = 'desktop-loopback';
                const holder = document.getElementById('cfTurnstileRegister');
                const input = holder && holder.querySelector('input[name="cf-turnstile-response"],textarea[name="cf-turnstile-response"]');
                if (input) input.value = 'desktop-loopback';
            }, true);
        })();
    `).catch((error) => log(`desktop renderer marker failed: ${error.message}`));
}

function createWindow() {
    mainWindow = new BrowserWindow({
        title: APP_TITLE,
        icon: desktopIconPath(),
        width: 1440,
        height: 900,
        minWidth: 980,
        minHeight: 680,
        show: false,
        autoHideMenuBar: true,
        backgroundColor: '#ffffff',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            spellcheck: true
        }
    });

    mainWindow.once('ready-to-show', () => mainWindow && mainWindow.show());
    mainWindow.on('closed', () => { mainWindow = null; });
    mainWindow.webContents.on('dom-ready', markDesktopRenderer);

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (isLoopbackUrl(url)) return { action: 'allow' };
        if (/^https?:\/\//i.test(url)) shell.openExternal(url).catch(() => {});
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (isLoopbackUrl(url) || url.startsWith('data:text/html') || url.startsWith('file:')) return;
        event.preventDefault();
        if (/^https?:\/\//i.test(url)) shell.openExternal(url).catch(() => {});
    });
    mainWindow.webContents.on('render-process-gone', (_event, details) => log(`renderer gone: ${JSON.stringify(details)}`));
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
        if (isMainFrame) log(`load failure code=${errorCode} url=${validatedURL} description=${errorDescription}`);
    });

    showStartupSplash('Preparando la aplicación local en esta laptop…').catch((error) => log(`startup splash error: ${error.stack || error.message}`));
}

async function bootDesktop() {
    createWindow();
    try {
        const sitePath = ensureLocalSite();
        if (mainWindow) await showStartupSplash('Iniciando el servidor local seguro…');
        const origin = await startLocalServer(sitePath);
        await session.defaultSession.clearCache();
        await waitForMinimumSplash();
        if (mainWindow) await mainWindow.loadURL(origin + '/');
    } catch (error) {
        log(`startup failure: ${error.stack || error.message}`);
        if (mainWindow) await showStartupSplash('No se pudo iniciar la versión local. Revisa el mensaje de error.').catch(() => {});
        dialog.showMessageBox({
            type: 'error',
            title: APP_TITLE,
            message: 'No se pudo iniciar Hashcod Codespace Local.',
            detail: `${error.message}\n\nRegistro: ${path.join(app.getPath('userData'), 'desktop.log')}`
        }).catch(() => {});
    }
}

function stopLocalServer() {
    if (!phpProcess) return;
    try { phpProcess.kill(); } catch (_) {}
    phpProcess = null;
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (!mainWindow) return;
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
    });

    app.whenReady().then(async () => {
        if (process.platform === 'win32') app.setAppUserModelId(APP_ID);
        ensureDesktopBridgeToken();
        installDesktopRequestBridge();
        installDesktopPermissionPolicy();
        await bootDesktop();
    });

    app.on('before-quit', () => {
        shuttingDown = true;
        stopLocalServer();
    });
    app.on('window-all-closed', () => {
        if (!shuttingDown) stopLocalServer();
        app.quit();
    });
}
