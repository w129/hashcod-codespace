(function () {
    'use strict';

    if (window.__hashcodAuthVectorLayoutFixLoaded) return;
    window.__hashcodAuthVectorLayoutFixLoaded = true;

    const currentScript = document.currentScript;
    const currentSrc = currentScript && currentScript.src ? currentScript.src : '';
    const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
        ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
        : '/components/';

    (function loadUtilityDockStyles() {
        if (document.getElementById('authUtilityOutsideStylesheet')) return;
        const link = document.createElement('link');
        link.id = 'authUtilityOutsideStylesheet';
        link.rel = 'stylesheet';
        link.href = componentBase + 'auth-utility-outside.css?v=20260910-5';
        document.head.appendChild(link);
    })();

    let queued = false;
    let scrollBound = false;

    const TOOL_ASSETS = {
        openCryptoCardUploadPanel: {
            file: 'crypto-card-validation.js?v=20260910-4',
            match: 'crypto-card-validation.js',
            id: 'hashcodCryptoCardValidationEngine'
        },
        openCryptoCardValidationWindow: {
            file: 'crypto-card-validation.js?v=20260910-4',
            match: 'crypto-card-validation.js',
            id: 'hashcodCryptoCardValidationEngine'
        },
        openDilithiumOneTimeKeyTool: {
            file: 'dilithium-one-time-key.js?v=20260910-4',
            match: 'dilithium-one-time-key.js',
            id: 'hashcodDilithiumOneTimeKeyEngine'
        }
    };

    function waitForCondition(test, retries, delay) {
        if (test()) return Promise.resolve(true);
        if (retries <= 0) return Promise.resolve(false);
        return new Promise(function (resolve) {
            window.setTimeout(function () {
                resolve(waitForCondition(test, retries - 1, delay));
            }, delay);
        });
    }

    function ensureScript(file, match, id) {
        let script = document.getElementById(id) || document.querySelector('script[src*="' + match + '"]');
        if (!script) {
            script = document.createElement('script');
            script.id = id;
            script.src = componentBase + file;
            script.defer = true;
            document.head.appendChild(script);
        }
        return script;
    }

    ensureScript('auth-register-resilience.js?v=20260914-2', 'auth-register-resilience.js', 'hashcodAuthRegisterResilience');

    async function ensureAdminEngine() {
        if (window.HashcodAdmin && typeof window.HashcodAdmin.require === 'function') return true;
        ensureScript('admin-device.js?v=20260918-codekey2', 'admin-device.js', 'hashcodAdminDeviceEngine');
        return waitForCondition(function () {
            return Boolean(window.HashcodAdmin && typeof window.HashcodAdmin.require === 'function');
        }, 60, 100);
    }

    async function ensureToolFunction(fnName) {
        if (typeof window[fnName] === 'function') return true;
        const asset = TOOL_ASSETS[fnName];
        if (!asset) return false;
        ensureScript(asset.file, asset.match, asset.id);
        return waitForCondition(function () {
            return typeof window[fnName] === 'function';
        }, 60, 100);
    }

    function smallestExactText(root, text) {
        const wanted = String(text || '').trim().toUpperCase();
        const nodes = Array.from(root.querySelectorAll('span,small,strong,div,button'))
            .filter(function (node) {
                return String(node.textContent || '').trim().toUpperCase() === wanted;
            })
            .sort(function (a, b) {
                return a.children.length - b.children.length || a.textContent.length - b.textContent.length;
            });
        return nodes[0] || null;
    }

    function normalizeBadges(wrapper) {
        ['PQC AUTH', 'BETA'].forEach(function (label) {
            const badge = smallestExactText(wrapper, label);
            if (!badge) return;
            badge.classList.add('hashcod-auth-header-badge');
            badge.dataset.hashcodHeaderBadge = label.toLowerCase().replace(/\s+/g, '-');
        });
    }

    function normalizeChatLauncher(wrapper) {
        const launcher = document.getElementById('groqAuthChatLauncher');
        const tabs = wrapper.querySelector('.auth-tabs');
        const validate = document.getElementById('authTabValidate');
        if (!launcher || !tabs) return;

        if (launcher.parentElement !== tabs) {
            if (validate && validate.parentElement === tabs) validate.insertAdjacentElement('afterend', launcher);
            else tabs.appendChild(launcher);
        } else if (validate && launcher.previousElementSibling !== validate) {
            validate.insertAdjacentElement('afterend', launcher);
        }

        launcher.classList.add('hashcod-auth-chat-tab-fixed');
        launcher.setAttribute('aria-label', 'Abrir Hashcod AI');
        launcher.setAttribute('title', 'Abrir Hashcod AI');
    }

    function controlIsVisible(control) {
        if (!control || !control.isConnected) return false;
        if (control.type === 'hidden') return false;
        const style = window.getComputedStyle(control);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
        const rect = control.getBoundingClientRect();
        return rect.width > 1 && rect.height > 1;
    }

    function normalizeFieldDecorations(wrapper) {
        wrapper.querySelectorAll('.hashcod-auth-label-icon').forEach(function (icon) {
            icon.setAttribute('aria-hidden', 'true');
            icon.classList.add('hashcod-auth-label-icon-redundant');
        });

        wrapper.querySelectorAll('.hashcod-auth-input-icon').forEach(function (icon) {
            const parent = icon.parentElement;
            const control = parent && parent.querySelector('input:not([type="hidden"]), textarea, select');
            icon.classList.toggle('hashcod-auth-input-icon-orphaned', !controlIsVisible(control));
        });
    }

    function normalizeMessages(wrapper) {
        wrapper.querySelectorAll('.hashcod-auth-message').forEach(function (message) {
            const clone = message.cloneNode(true);
            clone.querySelectorAll('.hashcod-auth-message-icon').forEach(function (icon) {
                if (icon.parentNode) icon.parentNode.removeChild(icon);
            });
            const meaningfulText = String(clone.textContent || '').replace(/\s+/g, ' ').trim();
            message.classList.toggle('hashcod-auth-message-empty', meaningfulText.length === 0);
        });
    }

    function utilityDock(wrapper) {
        const card = wrapper.querySelector('.auth-card') || wrapper;
        let dock = document.getElementById('hashcodAuthUtilityDock');
        if (!dock) {
            dock = document.createElement('div');
            dock.id = 'hashcodAuthUtilityDock';
            dock.className = 'hashcod-auth-utility-dock';
            dock.setAttribute('aria-label', 'Herramientas rápidas de autenticación');
        }

        if (dock.parentElement !== card) card.appendChild(dock);
        dock.dataset.side = 'inside';
        dock.style.removeProperty('left');
        dock.style.removeProperty('top');
        dock.style.removeProperty('right');
        dock.style.removeProperty('bottom');
        return dock;
    }

    function positionUtilityDock(wrapper, dock) {
        const card = wrapper.querySelector('.auth-card') || wrapper;
        if (!controlIsVisible(card)) {
            dock.hidden = true;
            return;
        }

        if (dock.parentElement !== card) card.appendChild(dock);
        dock.dataset.side = 'inside';
        dock.style.removeProperty('left');
        dock.style.removeProperty('top');
        dock.style.removeProperty('right');
        dock.style.removeProperty('bottom');
        dock.hidden = dock.children.length === 0;
    }

    async function openWhenAvailable(fnName) {
        const ready = await ensureToolFunction(fnName);
        if (!ready) {
            console.error('[Hashcod] No se cargó la función ' + fnName + '.');
            return false;
        }
        const fn = window[fnName];
        if (typeof fn !== 'function') return false;
        return fn();
    }

    function bindUtilityAction(button) {
        if (!button || button.dataset.hashcodRailActionBound === 'true') return;

        const isDirectCard = button.classList.contains('crypto-card-direct-launcher-btn');
        const isCardValidation = button.id === 'cryptoCardValidationLauncherBtn' ||
            (button.classList.contains('crypto-card-launcher-btn') && !isDirectCard);
        const isDilithium = button.id === 'd5LauncherBtn';

        if (!isDirectCard && !isCardValidation && !isDilithium) return;
        button.dataset.hashcodRailActionBound = 'true';

        if (isDirectCard) {
            button.hidden = false;
            button.disabled = false;
            button.removeAttribute('aria-disabled');
            button.setAttribute('aria-label', 'Agregar tarjeta criptográfica validada');
            button.setAttribute('title', 'Agregar tarjeta criptográfica validada');
        }

        button.addEventListener('click', async function (event) {
            event.preventDefault();

            try {
                if (isDirectCard) {
                    await openWhenAvailable('openCryptoCardUploadPanel');
                    return;
                }

                if (isCardValidation) {
                    const adminReady = await ensureAdminEngine();
                    if (!adminReady) {
                        console.error('[Hashcod] No se pudo cargar Windows Hello para la validación de tarjeta.');
                        return;
                    }
                    await openWhenAvailable('openCryptoCardValidationWindow');
                    return;
                }

                if (isDilithium) {
                    const adminReady = await ensureAdminEngine();
                    if (!adminReady) {
                        console.error('[Hashcod] No se pudo cargar Windows Hello para Dilithium-5.');
                        return;
                    }
                    if (document.documentElement.dataset.adminAuthenticated !== 'true') {
                        const verified = await window.HashcodAdmin.require();
                        if (!verified) return;
                    }
                    await openWhenAvailable('openDilithiumOneTimeKeyTool');
                }
            } catch (error) {
                console.error('[Hashcod] No se pudo abrir la herramienta solicitada:', error);
            }
        }, false);
    }

    function normalizeUtilityLaunchers(wrapper) {
        const dock = utilityDock(wrapper);
        const selectors = [
            '#cryptoCardValidationLauncherBtn',
            '#d5LauncherBtn',
            '.crypto-card-launcher-btn',
            '.crypto-card-direct-launcher-btn'
        ].join(',');
        const launchers = Array.from(new Set(Array.from(document.querySelectorAll(selectors))));

        launchers.forEach(function (button) {
            if (!button || button === document.getElementById('groqAuthChatLauncher')) return;
            bindUtilityAction(button);
            button.classList.add('hashcod-auth-utility-button');
            if (button.parentElement !== dock) dock.appendChild(button);
        });

        const ordered = [
            document.getElementById('cryptoCardValidationLauncherBtn'),
            dock.querySelector('.crypto-card-direct-launcher-btn'),
            document.getElementById('d5LauncherBtn')
        ].filter(Boolean);
        const orderMatches = ordered.every(function (button, index) {
            return dock.children[index] === button;
        });
        if (!orderMatches) {
            ordered.forEach(function (button) {
                if (button.parentElement === dock) dock.appendChild(button);
            });
        }

        positionUtilityDock(wrapper, dock);
    }

    function normalizeTurnstile(wrapper) {
        wrapper.querySelectorAll('.cf-turnstile').forEach(function (node) {
            node.classList.add('hashcod-auth-turnstile');
        });
    }

    function normalizeWindowsHello(wrapper) {
        const panel = wrapper.querySelector('.admin-hello-access');
        if (!panel) return;
        panel.classList.add('hashcod-auth-windows-hello');
        const status = panel.querySelector('#adminHelloStatus');
        if (status) status.classList.add('hashcod-auth-windows-hello-status');
    }

    function apply() {
        const wrapper = document.getElementById('authWrapper');
        if (!wrapper) return false;

        normalizeBadges(wrapper);
        normalizeChatLauncher(wrapper);
        normalizeFieldDecorations(wrapper);
        normalizeMessages(wrapper);
        normalizeUtilityLaunchers(wrapper);
        normalizeTurnstile(wrapper);
        normalizeWindowsHello(wrapper);
        wrapper.classList.add('hashcod-auth-layout-fixed');
        return true;
    }

    function queueApply() {
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(function () {
            queued = false;
            apply();
        });
    }

    function bindScrollTracking() {
        if (scrollBound) return;
        scrollBound = true;
        window.addEventListener('scroll', queueApply, { passive: true, capture: true });
    }

    if (!apply()) {
        const wait = new MutationObserver(function () {
            if (apply()) wait.disconnect();
        });
        wait.observe(document.documentElement, { childList: true, subtree: true });
        window.setTimeout(function () { wait.disconnect(); }, 20000);
    }

    bindScrollTracking();
    const observer = new MutationObserver(queueApply);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'disabled'] });
    window.addEventListener('resize', queueApply, { passive: true });
})();
