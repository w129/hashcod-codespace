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

    function normalizeFieldDecorations(wrapper) {
        // The field itself already carries the vector icon. Hiding the duplicated
        // leading label icon keeps rows such as Dilithium-5 aligned and readable.
        wrapper.querySelectorAll('.hashcod-auth-label-icon').forEach(function (icon) {
            icon.setAttribute('aria-hidden', 'true');
            icon.classList.add('hashcod-auth-label-icon-redundant');
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

        // Legacy modules use a mixture of IDs and classes and can be mounted
        // outside #authWrapper. Collect every known auth utility document-wide.
        const launchers = Array.from(document.querySelectorAll([
            '#cryptoCardValidationLauncherBtn',
            '#d5LauncherBtn',
            '.crypto-card-launcher-btn',
            '.crypto-card-direct-launcher-btn'
        ].join(',')));

        const unique = Array.from(new Set(launchers));
        unique.forEach(function (button) {
            if (!button || button === document.getElementById('groqAuthChatLauncher')) return;
            button.classList.add('hashcod-auth-utility-button');
            if (button.parentElement !== dock) dock.appendChild(button);
        });

        dock.hidden = dock.children.length === 0;
    }

    function apply() {
        const wrapper = document.getElementById('authWrapper');
        if (!wrapper) return false;

        normalizeBadges(wrapper);
        normalizeChatLauncher(wrapper);
        normalizeFieldDecorations(wrapper);
        normalizeUtilityLaunchers(wrapper);
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
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('resize', queueApply, { passive: true });
})();
