(function () {
    'use strict';

    if (window.__hashcodCryptoCardThemeLoaded) return;
    window.__hashcodCryptoCardThemeLoaded = true;

    function normalize(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function addClassByText(panel, selector, needle, className) {
        const matches = Array.from(panel.querySelectorAll(selector))
            .map(function (node) {
                return { node: node, text: normalize(node.textContent) };
            })
            .filter(function (item) {
                return item.text.includes(needle);
            })
            .sort(function (a, b) {
                return a.text.length - b.text.length;
            });

        const target = matches.length ? matches[0].node : null;
        if (target) target.classList.add(className);
        return target;
    }

    function findDropzone(panel, instruction) {
        const dashed = panel.querySelector('[style*="dashed"]');
        if (dashed) return dashed;

        const semantic = panel.querySelector('[class*="dropzone"], [class*="drop-zone"]');
        if (semantic) return semantic;

        if (instruction) {
            return instruction.closest('label,button,[role="button"],div') || instruction.parentElement;
        }

        return null;
    }

    function enhance() {
        const modal = document.getElementById('cryptoCardUploadPanelModal');
        const panel = document.getElementById('cryptoCardUploadPanel') || document.querySelector('.crypto-card-upload-panel');
        if (!modal || !panel) return false;

        modal.classList.add('hashcod-crypto-card-modal');
        panel.classList.add('hashcod-crypto-card-panel');
        panel.setAttribute('data-hashcod-theme', 'crypto-card-v2');

        addClassByText(panel, 'h1,h2,h3,h4,strong,span,div', 'acceso con tarjeta criptografica', 'hashcod-crypto-card-title');
        addClassByText(panel, 'p,span,small,div', 'autenticacion directa mediante tarjeta certificada', 'hashcod-crypto-card-subtitle');
        addClassByText(panel, 'span,p,strong,div', 'validacion directa', 'hashcod-crypto-card-badge');
        const instruction = addClassByText(panel, 'label,p,span,strong,div', 'arrastra tu tarjeta certificada', 'hashcod-crypto-card-instruction');
        addClassByText(panel, 'p,span,small,div', 'acceso instantaneo', 'hashcod-crypto-card-caption');

        const dropzone = findDropzone(panel, instruction);
        if (dropzone && dropzone !== panel) {
            dropzone.classList.add('hashcod-crypto-card-dropzone');
            dropzone.setAttribute('data-hashcod-dropzone', 'true');
        }

        const closeButton = Array.from(panel.querySelectorAll('button')).find(function (button) {
            const text = normalize(button.textContent);
            const title = normalize(button.getAttribute('title'));
            const label = normalize(button.getAttribute('aria-label'));
            return text === '×' || text === 'x' || title.includes('cerrar') || label.includes('cerrar');
        });
        if (closeButton) closeButton.classList.add('hashcod-crypto-card-close');

        const fileInput = panel.querySelector('input[type="file"]');
        if (fileInput) fileInput.setAttribute('aria-label', 'Seleccionar tarjeta criptográfica certificada');

        return true;
    }

    if (!enhance()) {
        const observer = new MutationObserver(function () {
            enhance();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        window.setTimeout(function () { observer.disconnect(); }, 30000);
    }
})();
