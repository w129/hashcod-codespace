(function () {
    'use strict';

    if (window.__hashcodToolboxSignatureCopyLoaded) return;
    window.__hashcodToolboxSignatureCopyLoaded = true;

    function setText(node, value) {
        if (node && node.textContent !== value) node.textContent = value;
    }

    function setAttr(node, name, value) {
        if (node && node.getAttribute(name) !== value) node.setAttribute(name, value);
    }

    function applyCopy() {
        const save = document.getElementById('hslSaveSignature');
        const access = document.getElementById('hslAccessSignature');

        if (save) {
            const label = save.closest('.hsl-field');
            const caption = label && label.querySelector('span');
            setText(caption, 'FIRMA DE ACCESO DILITHIUM-5 DEL CÍRCULO');
            setAttr(save, 'placeholder', 'Elige cualquier firma secreta que quieras. Tendrás que escribir esta misma firma para abrir el círculo.');
            setAttr(save, 'aria-label', 'Elige una firma de acceso privada para este círculo');
        }

        if (access) {
            const label = access.closest('.hsl-field');
            const caption = label && label.querySelector('span');
            setText(caption, 'MISMA FIRMA DEL CÍRCULO');
            setAttr(access, 'placeholder', 'Escribe la misma firma que elegiste cuando guardaste este círculo.');
            setAttr(access, 'aria-label', 'Escribe la misma firma usada al guardar este círculo');
        }

        const accessTitle = document.getElementById('hslAccessTitle');
        setText(accessTitle, 'Validar firma del círculo');

        // The secure Toolbox root creates both fields together. Once they exist,
        // there is no reason to keep a page-wide MutationObserver running.
        return Boolean(save && access && accessTitle);
    }

    function boot() {
        if (applyCopy()) return;

        const target = document.body || document.documentElement;
        if (!target) return;

        const observer = new MutationObserver(function () {
            if (applyCopy()) observer.disconnect();
        });
        observer.observe(target, { childList: true, subtree: true });

        // Fail-safe: never leave a full-document observer alive indefinitely.
        window.setTimeout(function () { observer.disconnect(); }, 10000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
