(function () {
    'use strict';

    if (window.__hashcodAuthVectorLayoutFixLoaded) return;
    window.__hashcodAuthVectorLayoutFixLoaded = true;

    let queued = false;

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
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = control.getBoundingClientRect();
        return rect.width > 1 && rect.height > 1;
    }

    function normalizeFieldDecorations(wrapper) {
        // Labels already have strong text hierarchy. A second icon before every
        // label produced visual noise, especially on the monthly Dilithium row.
        wrapper.querySelectorAll('.hashcod-auth-label-icon').forEach(function (icon) {
            icon.setAttribute('aria-hidden', 'true');
            icon.classList.add('hashcod-auth-label-icon-redundant');
        });

        // Keep only input icons whose associated control is actually visible.
        // This prevents icons from inactive/hidden auth panes appearing by
        // themselves between the L8ID field, Turnstile and CTA.
        wrapper.querySelectorAll('.hashcod-auth-input-icon').forEach(function (icon) {
            const parent = icon.parentElement;
            const control = parent && parent.querySelector('input:not([type="hidden"]), textarea, select');
            icon.classList.toggle('hashcod-auth-input-icon-orphaned', !controlIsVisible(control));
        });
    }

    function normalizeUtilityLaunchers(wrapper) {
        const card = wrapper.querySelector('.auth-card') || wrapper;

        let dock = card.querySelector('.hashcod-auth-utility-dock');
        if (!dock) {
            dock = document.createElement('div');
            dock.className = 'hashcod-auth-utility-dock';
            dock.setAttribute('aria-label', 'Herramientas rápidas de autenticación');
            card.appendChild(dock);
        }

        // Legacy modules mount these controls in different containers. Move the
        // real buttons into one controlled dock without cloning or replacing
        // them, so their original event listeners remain functional.
        const launchers = Array.from(document.querySelectorAll([
            '#cryptoCardValidationLauncherBtn',
            '#d5LauncherBtn',
            '.crypto-card-launcher-btn',
            '.crypto-card-direct-launcher-btn'
        ].join(',')));

        Array.from(new Set(launchers)).forEach(function (button) {
            if (!button || button === document.getElementById('groqAuthChatLauncher')) return;
            button.classList.add('hashcod-auth-utility-button');
            if (button.parentElement !== dock) dock.appendChild(button);
        });

        dock.hidden = dock.children.length === 0;
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

    if (!apply()) {
        const wait = new MutationObserver(function () {
            if (apply()) wait.disconnect();
        });
        wait.observe(document.documentElement, { childList: true, subtree: true });
        window.setTimeout(function () { wait.disconnect(); }, 20000);
    }

    const observer = new MutationObserver(queueApply);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    window.addEventListener('resize', queueApply, { passive: true });
})();
