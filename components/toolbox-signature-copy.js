(function () {
    'use strict';

    if (window.__hashcodToolboxSignatureCopyLoaded) return;
    window.__hashcodToolboxSignatureCopyLoaded = true;

    function applyCopy() {
        const save = document.getElementById('hslSaveSignature');
        const access = document.getElementById('hslAccessSignature');

        if (save) {
            const label = save.closest('.hsl-field');
            const caption = label && label.querySelector('span');
            if (caption) caption.textContent = 'FIRMA DE ACCESO DILITHIUM-5 DEL CÍRCULO';
            save.placeholder = 'Elige cualquier firma secreta que quieras. Tendrás que escribir esta misma firma para abrir el círculo.';
            save.setAttribute('aria-label', 'Elige una firma de acceso privada para este círculo');
        }

        if (access) {
            const label = access.closest('.hsl-field');
            const caption = label && label.querySelector('span');
            if (caption) caption.textContent = 'MISMA FIRMA DEL CÍRCULO';
            access.placeholder = 'Escribe la misma firma que elegiste cuando guardaste este círculo.';
            access.setAttribute('aria-label', 'Escribe la misma firma usada al guardar este círculo');
        }

        const accessTitle = document.getElementById('hslAccessTitle');
        if (accessTitle) accessTitle.textContent = 'Validar firma del círculo';

        return Boolean(save || access);
    }

    function boot() {
        applyCopy();
        const observer = new MutationObserver(function () { applyCopy(); });
        observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
