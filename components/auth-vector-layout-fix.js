(function () {
    'use strict';

    if (window.__hashcodAuthVectorLayoutFixLoaded) return;
    window.__hashcodAuthVectorLayoutFixLoaded = true;

    (function loadExternalRailStyles() {
        if (document.getElementById('authUtilityOutsideStylesheet')) return;
        const current = document.currentScript;
        const currentSrc = current && current.src ? current.src : '';
        const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
            ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
            : '/components/';
        const link = document.createElement('link');
        link.id = 'authUtilityOutsideStylesheet';
        link.rel = 'stylesheet';
        link.href = componentBase + 'auth-utility-outside.css?v=20260910-1';
        document.head.appendChild(link);
    })();

    let queued = false;
    let scrollBound = false;

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

    function utilityDock() {
        let dock = document.getElementById('hashcodAuthUtilityDock');
        if (!dock) {
            dock = document.createElement('div');
            dock.id = 'hashcodAuthUtilityDock';
            dock.className = 'hashcod-auth-utility-dock';
            dock.setAttribute('aria-label', 'Herramientas rápidas de autenticación');
            document.body.appendChild(dock);
        }
        return dock;
    }

    function positionUtilityDock(wrapper, dock) {
        const card = wrapper.querySelector('.auth-card') || wrapper;
        if (!controlIsVisible(card)) {
            dock.hidden = true;
            return;
        }

        const rect = card.getBoundingClientRect();
        const gap = 14;
        const buttonWidth = 52;
        const viewportPadding = 10;
        let left = rect.right + gap;
        let side = 'right';

        // The intended layout is outside the right edge, in one vertical column.
        // Only fall back to the left if the viewport physically has no right-side room.
        if (left + buttonWidth > window.innerWidth - viewportPadding) {
            left = rect.left - gap - buttonWidth;
            side = 'left';
        }

        left = Math.max(viewportPadding, Math.min(left, window.innerWidth - buttonWidth - viewportPadding));
        const top = Math.max(viewportPadding, Math.min(rect.top + 18, window.innerHeight - 180));

        dock.dataset.side = side;
        dock.style.left = Math.round(left) + 'px';
        dock.style.top = Math.round(top) + 'px';
        dock.hidden = dock.children.length === 0;
    }

    function normalizeUtilityLaunchers(wrapper) {
        const dock = utilityDock();
        const selectors = [
            '#cryptoCardValidationLauncherBtn',
            '#d5LauncherBtn',
            '.crypto-card-launcher-btn',
            '.crypto-card-direct-launcher-btn'
        ].join(',');
        const launchers = Array.from(new Set(Array.from(document.querySelectorAll(selectors))));

        launchers.forEach(function (button) {
            if (!button || button === document.getElementById('groqAuthChatLauncher')) return;
            button.classList.add('hashcod-auth-utility-button');
            if (button.parentElement !== dock) dock.appendChild(button);
        });

        // Keep the familiar order vertically: card validation, direct access, Dilithium.
        const ordered = [
            document.getElementById('cryptoCardValidationLauncherBtn'),
            dock.querySelector('.crypto-card-direct-launcher-btn'),
            document.getElementById('d5LauncherBtn')
        ].filter(Boolean);
        ordered.forEach(function (button) {
            if (button.parentElement === dock) dock.appendChild(button);
        });

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
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    window.addEventListener('resize', queueApply, { passive: true });
})();
