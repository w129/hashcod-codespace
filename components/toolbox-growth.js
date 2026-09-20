(function () {
    'use strict';
    function init() {
        if (window.__hashcodToolboxGrowthLoaded) return;
        const navigation = document.getElementById('toolboxPaginationBar');
        const first = document.getElementById('toolboxPanel');
        if (!navigation || !first) return;
        window.__hashcodToolboxGrowthLoaded = true;
        const host = first.parentElement;
        const chips = navigation.querySelector('.tb-page-chips');
        const panels = new Map();
        let current = '1';
        const ordinal = value => {
            // Unsafe Numbers have already lost precision before reaching us.
            if (typeof value === 'number' && !Number.isSafeInteger(value)) return null;
            const text = String(value);
            return /^[1-9][0-9]*$/.test(text) ? text : null;
        };
        const compare = (a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0);
        const successor = value => (BigInt(value) + 1n).toString();
        const ordered = () => Array.from(panels.keys()).sort(compare);

        // Clone decorations only. Never copy another tool's IDs or handlers.
        const template = first.cloneNode(true);
        template.querySelector('.tb-grid-container').replaceChildren();
        template.removeAttribute('id');
        template.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        function createPage(page) {
            if (panels.has(page)) return panels.get(page);
            const panel = template.cloneNode(true);
            panel.id = 'toolboxPanel' + page;
            panel.dataset.toolboxPage = page;
            panel.classList.remove('active');
            panel.style.display = 'none';
            const grid = panel.querySelector('.tb-grid-container');
            for (let row = 1; row <= 4; row++) {
                const line = document.createElement('div');
                line.className = 'tb-grid-row';
                for (let column = 1; column <= 4; column++) {
                    const slot = document.createElement('div');
                    slot.className = 'tb-slot';
                    slot.dataset.slot = 't' + page + '-' + row + '-' + column;
                    slot.id = 'slot-' + slot.dataset.slot;
                    slot.title = 'Toolbox ' + page + ' · Slot ' + row + '-' + column;
                    slot.setAttribute('role', 'button');
                    slot.setAttribute('aria-label', slot.title);
                    slot.tabIndex = 0;
                    slot.innerHTML = '<div class="tb-inner-ring"><div class="tb-focal-center"></div></div>'
                        + '<div class="tb-corner-dot d-tl"></div><div class="tb-corner-dot d-tr"></div>'
                        + '<div class="tb-corner-dot d-bl"></div><div class="tb-corner-dot d-br"></div>';
                    line.appendChild(slot);
                }
                grid.appendChild(line);
            }
            panels.set(page, panel);
            const last = Array.from(host.querySelectorAll('.toolbox-panel')).pop();
            (last || first).after(panel);
            observe(panel);
            return panel;
        }
        function renderNavigation() {
            const pages = ordered();
            const index = pages.indexOf(current);
            // Window the chips: navigation does not grow with the page count.
            const visible = new Set([pages[0], ...pages.slice(Math.max(0, index - 2), index + 3), pages[pages.length - 1]]);
            chips.replaceChildren();
            for (const page of visible) {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.id = 'tbChip' + page;
                chip.className = 'tb-page-chip' + (page === current ? ' active' : '');
                chip.textContent = 'Toolbox ' + page;
                chip.setAttribute('role', 'tab');
                chip.setAttribute('aria-selected', String(page === current));
                chip.setAttribute('aria-controls', panels.get(page).id);
                chip.addEventListener('click', () => window.switchToolboxPage(page));
                chips.appendChild(chip);
            }
        }
        function expand(panel) {
            const page = ordinal(panel.dataset.toolboxPage);
            if (!page) return false;
            const occupied = new Set();
            const prefix = page === '1' ? '' : 't' + page + '-';
            panel.querySelectorAll('.tb-slot.is-filled[data-slot]').forEach(slot => {
                const id = slot.dataset.slot;
                if (id.startsWith(prefix) && /^[1-4]-[1-4]$/.test(id.slice(prefix.length))) occupied.add(id);
            });
            if (occupied.size !== 16 || panels.has(successor(page))) return false;
            createPage(successor(page));
            return true;
        }
        const observer = new MutationObserver(records => {
            const changed = new Set();
            records.forEach(record => {
                const panel = record.target.closest('.toolbox-panel');
                if (panel) changed.add(panel);
            });
            let expanded = false;
            changed.forEach(panel => { if (expand(panel)) expanded = true; });
            if (expanded) renderNavigation();
        });
        function observe(panel) {
            observer.observe(panel, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'data-slot'] });
        }
        host.querySelectorAll('.toolbox-panel[data-toolbox-page]').forEach(panel => {
            const page = ordinal(panel.dataset.toolboxPage);
            if (page) { panels.set(page, panel); observe(panel); }
        });
        const manifest = document.getElementById('hashcodToolboxGrowth');
        if (manifest) {
            try {
                const data = JSON.parse(manifest.textContent);
                if (data.version === 1 && Array.isArray(data.pages)) data.pages.forEach(page => {
                    if (typeof page === 'string' && ordinal(page)) createPage(page);
                });
            } catch (error) {
                console.warn('Toolbox: configuración inválida; se usará el catálogo de la página.');
            }
        }
        // Also supports static HTML and components that fill slots after load.
        Array.from(panels.values()).forEach(expand);
        window.switchToolboxPage = value => {
            const page = ordinal(value);
            if (!page || !panels.has(page)) return;
            panels.get(current)?.classList.remove('active');
            if (panels.has(current)) panels.get(current).style.display = 'none';
            current = page;
            panels.get(page).style.display = 'flex';
            panels.get(page).classList.add('active');
            renderNavigation();
        };
        function move(delta) {
            const pages = ordered();
            window.switchToolboxPage(pages[(pages.indexOf(current) + delta + pages.length) % pages.length]);
        }
        window.nextToolboxPage = () => move(1);
        window.prevToolboxPage = () => move(-1);
        window.addEventListener('keydown', event => {
            if (event.target?.isContentEditable || event.target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
            if (event.altKey && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
                event.preventDefault();
                move(event.key === 'ArrowRight' ? 1 : -1);
            }
        });
        window.switchToolboxPage(current);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
}());
