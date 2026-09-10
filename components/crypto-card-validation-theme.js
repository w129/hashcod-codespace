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
        const target = Array.from(panel.querySelectorAll(selector)).find(function (node) {
            return normalize(node.textContent).includes(needle);
        });
        if (target) target.classList.add(className);
        return target || null;
    }

    function enhance() {
        const modal = document.getElementById('cryptoCardUploadPanelModal');
        const panel = document.getElementById('cryptoCardUploadPanel') || document.querySelector('.crypto-card-upload-panel');
        if (!modal || !panel) return false;

        modal.classList.add('hashcod-crypto-card-modal');
        panel.classList.add('hashcod-crypto-card-panel');
        panel.setAttribute('data-hashcod-theme', 'crypto-card-v2');

        addClassByText(panel, 'h1,h2,h3,h4,strong,div,span', 'acceso con tarjeta criptografica', 'hashcod-crypto-card-title');
        addClassByText(panel, 'p,span,div,small', 'autenticacion directa mediante tarjeta certificada', 'hashcod-crypto-card-subtitle');
        addClassByText(panel, 'span,div,p,strong', 'validacion directa', 'hashcod-crypto-card-badge');
        const instruction = addClassByText(panel, 'label,div,p,span,strong', 'arrastra tu tarjeta certificada', 'hashcod-crypto-card-instruction');
        addClassByText(panel, 'p,span,div,small', 'acceso instantaneo', 'hashcod-crypto-card-caption');

        let dropzone = panel.querySelector('[style*="dashed"], [class*="drop"], [class*="upload"]');
        if (!dropzone && instruction) {
            dropzone = instruction.closest('label,button,div') || instruction.parentElement;
        }
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
