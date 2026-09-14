'use strict';

const { app, BrowserWindow, dialog, shell, session } = require('electron');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');

const APP_TITLE = 'Hashcod Codespace';
const APP_ID = 'app.hashcod.codespace';
const LOOPBACK_HOST = '127.0.0.1';
const PRESERVE_PATHS = ['.env', 'LOCAL-DB-CREDENTIALS.txt', 'data_storage', 'uploads'];
const MIN_SPLASH_TIME_MS = 1800;

let mainWindow = null;
let phpProcess = null;
let localOrigin = '';
let shuttingDown = false;
let splashStartedAt = 0;

function log(message) {
    try {
        const dir = app.getPath('userData');
        fs.mkdirSync(dir, { recursive: true });
        const line = `[${new Date().toISOString()}] ${message}\n`;
        fs.appendFileSync(path.join(dir, 'desktop.log'), line, 'utf8');
    } catch (_) {
        // Logging must never stop the desktop app from starting.
    }
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

function copyPath(source, destination) {
    if (!fs.existsSync(source)) return;
    fs.cpSync(source, destination, {
        recursive: true,
        force: true,
        errorOnExist: false
    });
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
    try {
        installedVersion = fs.readFileSync(versionFile, 'utf8').trim();
    } catch (_) {}

    if (
        installedVersion === packagedVersion
        && fs.existsSync(path.join(liveSite, 'router.php'))
    ) {
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
        if (!fs.existsSync(liveSite) && fs.existsSync(previousSite)) {
            fs.renameSync(previousSite, liveSite);
        }
        throw error;
    }

    const envFile = path.join(liveSite, '.env');
    const envExample = path.join(liveSite, '.env.example');
    if (!fs.existsSync(envFile) && fs.existsSync(envExample)) {
        fs.copyFileSync(envExample, envFile);
    }

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

async function startLocalServer(sitePath) {
    const phpExe = resourcePath(path.join('php', 'php.exe'));
    const phpIni = resourcePath(path.join('php', 'php.ini'));
    if (!fs.existsSync(phpExe)) {
        throw new Error('The desktop package does not contain php.exe.');
    }

    const port = await getFreePort();
    const args = [];
    if (fs.existsSync(phpIni)) {
        args.push('-c', phpIni);
    }
    args.push('-S', `${LOOPBACK_HOST}:${port}`, 'router.php');

    const childEnv = {
        ...process.env,
        APP_ENV: 'local',
        HASHCOD_DESKTOP: '1',
        L8_TRUST_PROXY: '0'
    };

    phpProcess = spawn(phpExe, args, {
        cwd: sitePath,
        env: childEnv,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    phpProcess.stdout.on('data', (chunk) => log(`php: ${String(chunk).trim()}`));
    phpProcess.stderr.on('data', (chunk) => log(`php-error: ${String(chunk).trim()}`));
    phpProcess.once('error', (error) => log(`php process error: ${error.stack || error.message}`));
    phpProcess.once('exit', (code, signal) => {
        log(`php process exited code=${code} signal=${signal || 'none'}`);
        phpProcess = null;
    });

    await waitForPort(port);
    localOrigin = `http://${LOOPBACK_HOST}:${port}`;
    return localOrigin;
}

function loadingPage(message) {
    const safeMessage = String(message).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);

    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${APP_TITLE}</title><style>html,body{height:100%;margin:0;background:#fff;color:#111;font-family:Inter,Segoe UI,Arial,sans-serif}body{display:grid;place-items:center}.wrap{width:min(520px,calc(100% - 48px));text-align:center}h1{font-size:24px;margin:0 0 10px}p{font-size:14px;color:#555}.bar{height:3px;background:#ececec;overflow:hidden;border-radius:99px}.bar:after{content:"";display:block;width:38%;height:100%;background:#111;animation:move 1.15s ease-in-out infinite}@keyframes move{0%{transform:translateX(-110%)}100%{transform:translateX(320%)}}</style></head><body><main class="wrap"><h1>Hashcod Codespace</h1><p>${safeMessage}</p><div class="bar"></div></main></body></html>`;
}

async function showStartupSplash(message) {
    if (!mainWindow) return;
    if (!splashStartedAt) splashStartedAt = Date.now();

    const splashPath = splashFilePath();
    if (fs.existsSync(splashPath)) {
        await mainWindow.loadFile(splashPath, {
            query: { message: String(message || '') }
        });
        return;
    }

    await mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(
        loadingPage(message)
    ));
}

async function waitForMinimumSplash() {
    if (!splashStartedAt) return;
    const remaining = MIN_SPLASH_TIME_MS - (Date.now() - splashStartedAt);
    if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
    }
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
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (localOrigin && url.startsWith(localOrigin)) {
            return { action: 'allow' };
        }
        if (/^https?:\/\//i.test(url)) {
            shell.openExternal(url).catch(() => {});
        }
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (!localOrigin || url.startsWith(localOrigin) || url.startsWith('data:text/html') || url.startsWith('file:')) return;
        event.preventDefault();
        if (/^https?:\/\//i.test(url)) {
            shell.openExternal(url).catch(() => {});
        }
    });

    mainWindow.webContents.on('render-process-gone', (_event, details) => {
        log(`renderer gone: ${JSON.stringify(details)}`);
    });

    showStartupSplash('Preparando la aplicación local en esta laptop…').catch((error) => {
        log(`startup splash error: ${error.stack || error.message}`);
    });
}

async function bootDesktop() {
    createWindow();
    try {
        const sitePath = ensureLocalSite();
        if (mainWindow) {
            await showStartupSplash('Iniciando el servidor local seguro…');
        }

        const origin = await startLocalServer(sitePath);
        await waitForMinimumSplash();
        if (mainWindow) {
            await mainWindow.loadURL(origin + '/');
        }
    } catch (error) {
        log(`startup failure: ${error.stack || error.message}`);
        if (mainWindow) {
            await showStartupSplash('No se pudo iniciar la versión local. Revisa el mensaje de error.').catch(() => {});
        }
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
    try {
        phpProcess.kill();
    } catch (_) {}
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
        if (process.platform === 'win32') {
            app.setAppUserModelId(APP_ID);
        }
        session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
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
