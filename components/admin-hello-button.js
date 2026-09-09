(function () {
    'use strict';
    const overlay = document.getElementById('authOverlay');
    const wrapper = document.getElementById('authWrapper');
    if (!overlay || !wrapper) return;
    const panel = document.createElement('div');
    panel.className = 'admin-hello-access';
    panel.innerHTML = '<button type="button" id="adminHelloButton" aria-describedby="adminHelloStatus" title="Verificar esta laptop con Windows Hello"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M 10 3 L 10 5 L 18 5 L 18 3 L 10 3 z M 18 5 L 18 23 L 20 23 L 20 5 L 18 5 z M 18 23 L 14 23 L 14 25 L 18 25 L 18 23 z M 14 23 L 14 10 L 12 10 L 12 23 L 14 23 z M 10 5 L 8 5 L 8 27 L 10 27 L 10 5 z M 10 27 L 10 29 L 22 29 L 22 27 L 10 27 z M 22 27 L 24 27 L 24 23 L 25 23 L 25 15 L 26 15 L 26 11 L 24 11 L 24 15 L 23 15 L 23 23 L 22 23 L 22 27 z"></path></svg><span>Windows Hello</span></button><p id="adminHelloStatus" role="status" aria-live="polite">Verifica esta laptop para administrar.</p>';
    wrapper.appendChild(panel);
    const button = panel.querySelector('button');
    const status = panel.querySelector('[role="status"]');
    function position() {
        const compact = window.innerWidth < 1100 || window.innerHeight < 650 || document.body.classList.contains('mobile-mode');
        const parent = compact ? wrapper : overlay;
        if (panel.parentElement !== parent) parent.appendChild(panel);
        panel.classList.toggle('is-compact', compact);
    }
    position();
    window.addEventListener('resize', position);
    new MutationObserver(position).observe(document.body, {attributes: true, attributeFilter: ['class']});
    button.addEventListener('click', async function () {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        status.textContent = 'Confirma Windows Hello en esta laptop…';
        try {
            if (!window.HashcodAdmin) throw new Error('No se pudo cargar la verificación. Recarga la página.');
            const verified = await window.HashcodAdmin.require({force: true});
            status.textContent = verified ? 'Laptop verificada. Administración habilitada durante 10 minutos.' : 'No se validó el acceso. Pulsa para reintentar.';
        } catch (error) {
            status.textContent = error.message || 'No se pudo verificar. Inténtalo de nuevo.';
        } finally {
            button.disabled = false;
            button.removeAttribute('aria-busy');
        }
    });
})();