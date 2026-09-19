(function () {
    'use strict';

    if (window.__hashcodAuthTabsRescueLoaded) return;
    window.__hashcodAuthTabsRescueLoaded = true;

    const PANEL_IDS = Object.freeze({
        login: 'authPanelLogin',
        register: 'authPanelRegister',
        recover: 'authPanelRecover',
        validate: 'authPanelValidate'
    });

    function localScope(tab) {
        if (!tab) return null;
        return tab.closest('.auth-card') || tab.closest('#authWrapper') || tab.parentElement;
    }

    function findPanel(scope, name) {
        const id = PANEL_IDS[name];
        if (!scope || !id) return null;
        return scope.querySelector('#' + id) || null;
    }

    function setActive(scope, sourceTab, name) {
        if (!scope || !name || !PANEL_IDS[name]) return false;

        const tabs = Array.from(scope.querySelectorAll('.auth-tabs .auth-tab[data-tab]'));
        const panels = {};
        Object.keys(PANEL_IDS).forEach(function (key) {
            panels[key] = findPanel(scope, key);
        });

        tabs.forEach(function (tab) {
            const active = tab.dataset.tab === name;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
            tab.setAttribute('tabindex', active ? '0' : '-1');
        });

        Object.keys(panels).forEach(function (key) {
            if (panels[key]) panels[key].classList.toggle('active', key === name);
        });

        const d5 = scope.querySelector('#d5LauncherBtn');
        if (d5) d5.style.display = name === 'register' ? 'flex' : 'none';

        scope.dataset.hashcodAuthMode = name;
        window.dispatchEvent(new CustomEvent('hashcod:auth-tab-change', {
            detail: { name: name, tab: sourceTab || null, scope: scope }
        }));
        return Boolean(panels[name]);
    }

    function bindTab(tab) {
        if (!tab || tab.dataset.hashcodTabRescueBound === 'true') return;
        const name = String(tab.dataset.tab || '').trim();
        if (!PANEL_IDS[name]) return;

        tab.dataset.hashcodTabRescueBound = 'true';
        tab.style.setProperty('pointer-events', 'auto', 'important');
        tab.style.setProperty('cursor', 'pointer', 'important');

        tab.addEventListener('click', function () {
            const scope = localScope(tab);
            setActive(scope, tab, name);
        }, true);
    }

    function bindAll() {
        document.querySelectorAll('.auth-tabs .auth-tab[data-tab]').forEach(bindTab);
    }

    window.HashcodAuthTabs = Object.freeze({
        switch: function (name, root) {
            const scope = root || document.querySelector('#authWrapper .auth-card') || document.getElementById('authWrapper');
            if (!scope) return false;
            const tab = scope.querySelector('.auth-tabs .auth-tab[data-tab="' + name + '"]');
            return setActive(scope, tab, name);
        },
        refresh: bindAll
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindAll, { once: true });
    } else {
        bindAll();
    }

    let bindFrame = 0;
    const observer = new MutationObserver(function (records) {
        const relevant = records.some(function (record) {
            return Array.from(record.addedNodes || []).some(function (node) {
                if (!node || node.nodeType !== 1) return false;
                if (node.matches && node.matches('#authWrapper, .auth-card, .auth-tabs, .auth-tab[data-tab]')) return true;
                return Boolean(node.querySelector && node.querySelector('.auth-tabs .auth-tab[data-tab]'));
            });
        });
        if (!relevant || bindFrame) return;
        bindFrame = requestAnimationFrame(function () {
            bindFrame = 0;
            bindAll();
        });
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });

    function stopAuthObserver() {
        observer.disconnect();
        if (bindFrame) {
            cancelAnimationFrame(bindFrame);
            bindFrame = 0;
        }
    }
    window.addEventListener('hashcod:final-entry-screen', stopAuthObserver, { once: true });
    window.addEventListener('hashcod:platform-entered', stopAuthObserver, { once: true });
})();
