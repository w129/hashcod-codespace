(function () {
    'use strict';

    if (window.__hashcodSecureToolboxLinksLoaded) return;
    window.__hashcodSecureToolboxLinksLoaded = true;

    const SLOT_SELECTOR = '.tb-slot[data-slot]';
    const REFRESH_MS = 5000;
    const MAX_SVG_BYTES = 32768;
    const state = {
        links: new Map(),
        originals: new WeakMap(),
        activeSlot: null,
        bypassSlot: null,
        refreshBusy: false,
        refreshTimer: null,
        frameUrl: '',
        frameIdentity: null
    };

    function basePath() {
        const raw = typeof window.L8_BASE_PATH === 'string' ? window.L8_BASE_PATH : '/';
        if (!raw) return '/';
        return raw.endsWith('/') ? raw : raw + '/';
    }

    const ENDPOINT = basePath() + 'toolbox-secure.php';

    function validSlot(value) {
        return /^[1-4]-[1-4]$/.test(String(value || '').trim());
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    async function api(action, options) {
        const opts = Object.assign({ method: 'GET', cache: 'no-store', credentials: 'same-origin', headers: {} }, options || {});
        opts.headers = Object.assign({ 'X-Requested-With': 'XMLHttpRequest' }, opts.headers || {});
        const joiner = ENDPOINT.indexOf('?') === -1 ? '?' : '&';
        const response = await fetch(ENDPOINT + joiner + 'action=' + encodeURIComponent(action) + '&_=' + Date.now(), opts);
        let body = null;
        try { body = await response.json(); } catch (_) { body = null; }
        if (!response.ok || !body || body.ok !== true) {
            const error = new Error((body && body.error) || ('HTTP ' + response.status));
            error.status = response.status;
            error.retryAfter = body && body.retry_after ? Number(body.retry_after) : 0;
            throw error;
        }
        return body;
    }

    function postJson(action, payload) {
        return api(action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload || {})
        });
    }

    function sanitizeSvgClient(raw) {
        const text = String(raw || '').trim();
        if (!text || text.length > MAX_SVG_BYTES) return '';
        if (/<!DOCTYPE|<!ENTITY/i.test(text)) return '';
        let doc;
        try { doc = new DOMParser().parseFromString(text, 'image/svg+xml'); } catch (_) { return ''; }
        if (!doc || !doc.documentElement || doc.documentElement.nodeName.toLowerCase() !== 'svg') return '';
        if (doc.querySelector('parsererror')) return '';

        const allowedElements = new Set([
            'svg','g','path','circle','ellipse','rect','line','polyline','polygon',
            'defs','lineargradient','radialgradient','stop','clippath','mask','title','desc'
        ]);
        const allowedAttrs = new Set([
            'id','viewbox','width','height','x','y','x1','y1','x2','y2','cx','cy','r','rx','ry',
            'd','points','fill','fill-opacity','fill-rule','stroke','stroke-width','stroke-opacity',
            'stroke-linecap','stroke-linejoin','stroke-miterlimit','stroke-dasharray','stroke-dashoffset',
            'opacity','transform','gradientunits','gradienttransform','offset','stop-color','stop-opacity',
            'clip-path','clip-rule','mask','preserveaspectratio','xmlns','role','aria-hidden','focusable',
            'href','xlink:href'
        ]);
        const nodes = [doc.documentElement].concat(Array.from(doc.documentElement.querySelectorAll('*')));
        for (const node of nodes) {
            const name = node.localName.toLowerCase();
            if (!allowedElements.has(name)) return '';
            for (const attr of Array.from(node.attributes || [])) {
                const attrName = attr.name.toLowerCase();
                const value = String(attr.value || '').trim();
                if (attrName.startsWith('on') || attrName === 'style') return '';
                if (!allowedAttrs.has(attrName)) node.removeAttribute(attr.name);
                if ((attrName === 'href' || attrName === 'xlink:href') && value && value[0] !== '#') return '';
                if (/javascript:|data:text\/html|https?:\/\//i.test(value)) return '';
            }
        }
        try { return new XMLSerializer().serializeToString(doc.documentElement); } catch (_) { return ''; }
    }

    function captureOriginal(slotEl) {
        if (state.originals.has(slotEl)) return;
        const ring = slotEl.querySelector('.tb-inner-ring');
        state.originals.set(slotEl, {
            ringHtml: ring ? ring.innerHTML : '',
            title: slotEl.getAttribute('title') || '',
            aria: slotEl.getAttribute('aria-label') || ''
        });
    }

    function removeSecureDecor(slotEl) {
        slotEl.classList.remove('hashcod-secure-link-slot');
        slotEl.removeAttribute('data-hashcod-secure-link');
        const oldLabel = slotEl.querySelector(':scope > .hsl-slot-label');
        if (oldLabel) oldLabel.remove();
    }

    function restoreOriginal(slotEl) {
        captureOriginal(slotEl);
        removeSecureDecor(slotEl);
        const original = state.originals.get(slotEl);
        const ring = slotEl.querySelector('.tb-inner-ring');
        if (ring && original) ring.innerHTML = original.ringHtml;
        if (original) {
            slotEl.setAttribute('title', original.title);
            slotEl.setAttribute('aria-label', original.aria);
        }
    }

    function applyLinkToSlot(slotEl, link) {
        captureOriginal(slotEl);
        removeSecureDecor(slotEl);
        const ring = slotEl.querySelector('.tb-inner-ring');
        if (!ring) return;
        const safeSvg = sanitizeSvgClient(link.iconSvg || '');
        if (!safeSvg) return;
        ring.innerHTML = '<span class="hsl-custom-icon" aria-hidden="true">' + safeSvg + '</span>';
        slotEl.classList.add('hashcod-secure-link-slot', 'is-filled');
        slotEl.setAttribute('data-hashcod-secure-link', 'true');
        const label = String(link.label || '').trim() || ('Enlace ' + link.slot);
        slotEl.setAttribute('title', label + ' · acceso protegido con firma Dilithium-5');
        slotEl.setAttribute('aria-label', 'Abrir ' + label + ' con firma Dilithium-5');
        const badge = document.createElement('span');
        badge.className = 'hsl-slot-label';
        badge.textContent = label.length > 16 ? label.slice(0, 15) + '…' : label;
        badge.setAttribute('aria-hidden', 'true');
        slotEl.appendChild(badge);
    }

    function renderAllSlots() {
        document.querySelectorAll(SLOT_SELECTOR).forEach(function (slotEl) {
            captureOriginal(slotEl);
            const key = String(slotEl.getAttribute('data-slot') || '').trim();
            if (!validSlot(key)) return;
            const link = state.links.get(key);
            if (link) applyLinkToSlot(slotEl, link);
            else restoreOriginal(slotEl);
            slotEl.setAttribute('data-hashcod-link-capable', 'true');
        });
    }

    async function refreshLinks(silent) {
        if (state.refreshBusy) return;
        state.refreshBusy = true;
        try {
            const body = await api('pull');
            const next = new Map();
            (body.links || []).forEach(function (link) {
                if (!validSlot(link.slot)) return;
                const iconSvg = sanitizeSvgClient(link.iconSvg || '');
                if (!iconSvg) return;
                next.set(link.slot, Object.assign({}, link, { iconSvg: iconSvg }));
            });
            state.links = next;
            renderAllSlots();
            if (!silent) announce('Toolbox sincronizada con PostgreSQL.', 'success');
        } catch (error) {
            if (!silent) announce('No se pudo sincronizar la Toolbox: ' + error.message, 'error');
        } finally {
            state.refreshBusy = false;
        }
    }

    function ensureRoot() {
        let root = document.getElementById('hashcodSecureToolboxRoot');
        if (root) return root;
        root = document.createElement('div');
        root.id = 'hashcodSecureToolboxRoot';
        root.innerHTML = [
            '<div class="hsl-toast" id="hslToast" role="status" aria-live="polite"></div>',
            '<div class="hsl-modal" id="hslConfigModal" aria-hidden="true">',
              '<div class="hsl-backdrop" data-hsl-close="config"></div>',
              '<section class="hsl-panel hsl-config-panel" role="dialog" aria-modal="true" aria-labelledby="hslConfigTitle">',
                '<header class="hsl-panel-head">',
                  '<div><span class="hsl-kicker">HASHCOD / SECURE TOOLBOX</span><h2 id="hslConfigTitle">Asignar enlace al círculo</h2></div>',
                  '<button type="button" class="hsl-x" data-hsl-close="config" aria-label="Cerrar">×</button>',
                '</header>',
                '<div class="hsl-panel-body">',
                  '<div class="hsl-slot-chip" id="hslConfigSlot">CÍRCULO 1-1</div>',
                  '<label class="hsl-field"><span>ENLACE HTTP / HTTPS</span><input type="url" id="hslUrl" autocomplete="off" placeholder="https://..."></label>',
                  '<label class="hsl-field"><span>NOMBRE DEL ACCESO</span><input type="text" id="hslLabel" maxlength="120" autocomplete="off" placeholder="Ej. GitHub, Portal, Dashboard"></label>',
                  '<div class="hsl-svg-grid">',
                    '<label class="hsl-field hsl-svg-field"><span>ICONO SVG</span><textarea id="hslSvg" spellcheck="false" placeholder="&lt;svg viewBox=&quot;0 0 24 24&quot;&gt;...&lt;/svg&gt;"></textarea></label>',
                    '<div class="hsl-svg-side"><div class="hsl-preview" id="hslSvgPreview"><span>SVG</span></div><label class="hsl-file"><input type="file" id="hslSvgFile" accept="image/svg+xml,.svg"><span>CARGAR .SVG</span></label></div>',
                  '</div>',
                  '<fieldset class="hsl-identity-box"><legend>IDENTIDAD HASHCOD PARA LA PÁGINA INTEGRADA</legend>',
                    '<div class="hsl-identity-grid">',
                      '<label class="hsl-field"><span>NOMBRE / ALIAS</span><input type="text" id="hslIdentityName" maxlength="120" autocomplete="off"></label>',
                      '<label class="hsl-field"><span>USUARIO</span><input type="text" id="hslIdentityUsername" maxlength="120" autocomplete="off"></label>',
                      '<label class="hsl-field hsl-wide"><span>CORREO</span><input type="email" id="hslIdentityEmail" maxlength="254" autocomplete="off"></label>',
                    '</div>',
                    '<p>La identidad queda en Hashcod y se entrega a sitios compatibles mediante <code>postMessage</code>. No se guardan contraseñas de terceros.</p>',
                  '</fieldset>',
                  '<label class="hsl-field"><span>FIRMA DILITHIUM-5 PARA GUARDAR</span><textarea class="hsl-signature" id="hslSaveSignature" spellcheck="false" autocomplete="off" placeholder="Pega la firma configurada en Hashcod"></textarea></label>',
                  '<div class="hsl-error" id="hslConfigError" role="alert"></div>',
                '</div>',
                '<footer class="hsl-panel-actions">',
                  '<button type="button" class="hsl-btn" id="hslOriginalTool">HERRAMIENTA ORIGINAL</button>',
                  '<button type="button" class="hsl-btn hsl-danger" id="hslDelete" hidden>QUITAR ENLACE</button>',
                  '<span class="hsl-actions-spacer"></span>',
                  '<button type="button" class="hsl-btn" data-hsl-close="config">CANCELAR</button>',
                  '<button type="button" class="hsl-btn hsl-primary" id="hslSave">GUARDAR Y SINCRONIZAR</button>',
                '</footer>',
              '</section>',
            '</div>',
            '<div class="hsl-modal" id="hslAccessModal" aria-hidden="true">',
              '<div class="hsl-backdrop" data-hsl-close="access"></div>',
              '<section class="hsl-panel hsl-access-panel" role="dialog" aria-modal="true" aria-labelledby="hslAccessTitle">',
                '<header class="hsl-panel-head">',
                  '<div><span class="hsl-kicker">PROTECTED TOOLBOX LINK</span><h2 id="hslAccessTitle">Validar firma Dilithium-5</h2></div>',
                  '<button type="button" class="hsl-x" data-hsl-close="access" aria-label="Cerrar">×</button>',
                '</header>',
                '<div class="hsl-panel-body">',
                  '<div class="hsl-access-icon" id="hslAccessIcon"></div>',
                  '<p class="hsl-access-copy" id="hslAccessCopy">Este enlace solo se libera después de validar la firma en el servidor.</p>',
                  '<label class="hsl-field"><span>FIRMA DILITHIUM-5</span><textarea class="hsl-signature" id="hslAccessSignature" spellcheck="false" autocomplete="off" placeholder="Pega la firma configurada en Hashcod"></textarea></label>',
                  '<div class="hsl-error" id="hslAccessError" role="alert"></div>',
                '</div>',
                '<footer class="hsl-panel-actions">',
                  '<button type="button" class="hsl-btn" id="hslEditLink">EDITAR CÍRCULO</button>',
                  '<span class="hsl-actions-spacer"></span>',
                  '<button type="button" class="hsl-btn" data-hsl-close="access">CANCELAR</button>',
                  '<button type="button" class="hsl-btn hsl-primary" id="hslUnlock">VALIDAR Y ABRIR AQUÍ</button>',
                '</footer>',
              '</section>',
            '</div>',
            '<div class="hsl-browser" id="hslBrowser" aria-hidden="true">',
              '<header class="hsl-browser-head">',
                '<button type="button" class="hsl-browser-close" id="hslBrowserClose" aria-label="Cerrar navegador integrado">×</button>',
                '<div class="hsl-browser-brand"><span>HASHCOD</span><b>IN-PLATFORM WEB</b></div>',
                '<div class="hsl-browser-address" id="hslBrowserAddress">about:blank</div>',
                '<button type="button" class="hsl-browser-reload" id="hslBrowserReload">RECARGAR</button>',
              '</header>',
              '<div class="hsl-browser-body">',
                '<div class="hsl-frame-wrap">',
                  '<div class="hsl-frame-note">La página permanece dentro de Hashcod. Si el sitio bloquea iframes mediante CSP/X-Frame-Options, Hashcod no puede forzar su incrustación.</div>',
                  '<iframe id="hslBrowserFrame" title="Página integrada en Hashcod" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-downloads"></iframe>',
                '</div>',
                '<aside class="hsl-browser-identity">',
                  '<div class="hsl-identity-head"><span>IDENTIDAD</span><b>HASHCOD ID</b></div>',
                  '<div class="hsl-identity-avatar" id="hslIdentityAvatar">HC</div>',
                  '<dl id="hslIdentityDetails"></dl>',
                  '<p class="hsl-identity-help">Úsala para iniciar sesión o registrarte en la página abierta. Los sitios compatibles pueden recibir esta identidad con el mensaje <code>HASHCOD_IDENTITY_V1</code>.</p>',
                  '<button type="button" class="hsl-btn hsl-primary hsl-copy-all" id="hslCopyIdentity">COPIAR IDENTIDAD</button>',
                '</aside>',
              '</div>',
            '</div>'
        ].join('');
        document.body.appendChild(root);
        bindUi(root);
        return root;
    }

    function announce(message, kind) {
        ensureRoot();
        const toast = document.getElementById('hslToast');
        if (!toast) return;
        toast.textContent = message;
        toast.dataset.kind = kind || 'info';
        toast.classList.add('is-visible');
        window.clearTimeout(announce._timer);
        announce._timer = window.setTimeout(function () { toast.classList.remove('is-visible'); }, 3600);
    }

    function setModalOpen(id, open) {
        ensureRoot();
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.toggle('is-open', !!open);
        modal.setAttribute('aria-hidden', open ? 'false' : 'true');
    }

    function setError(id, text) {
        const node = document.getElementById(id);
        if (node) node.textContent = text || '';
    }

    function currentSlotElement() {
        if (!state.activeSlot) return null;
        return document.querySelector(SLOT_SELECTOR + '[data-slot="' + CSS.escape(state.activeSlot) + '"]');
    }

    function updatePreview() {
        const input = document.getElementById('hslSvg');
        const preview = document.getElementById('hslSvgPreview');
        if (!input || !preview) return false;
        const safe = sanitizeSvgClient(input.value);
        if (!safe) {
            preview.innerHTML = '<span>SVG NO VÁLIDO</span>';
            preview.dataset.valid = 'false';
            return false;
        }
        preview.innerHTML = safe;
        preview.dataset.valid = 'true';
        return true;
    }

    function openConfig(slotKey) {
        ensureRoot();
        if (!validSlot(slotKey)) return;
        state.activeSlot = slotKey;
        const existing = state.links.get(slotKey) || null;
        document.getElementById('hslConfigSlot').textContent = 'CÍRCULO ' + slotKey;
        document.getElementById('hslUrl').value = '';
        document.getElementById('hslLabel').value = existing ? (existing.label || '') : '';
        document.getElementById('hslSvg').value = existing ? (existing.iconSvg || '') : '';
        document.getElementById('hslIdentityName').value = '';
        document.getElementById('hslIdentityUsername').value = '';
        document.getElementById('hslIdentityEmail').value = '';
        document.getElementById('hslSaveSignature').value = '';
        document.getElementById('hslDelete').hidden = !existing;
        setError('hslConfigError', existing
            ? 'Por seguridad, la URL y la identidad guardadas no se exponen hasta validar la firma. Escribe los valores nuevos si quieres reemplazarlos.'
            : '');
        updatePreview();
        setModalOpen('hslAccessModal', false);
        setModalOpen('hslConfigModal', true);
        window.setTimeout(function () { document.getElementById('hslUrl').focus(); }, 40);
    }

    function openAccess(slotKey) {
        ensureRoot();
        const link = state.links.get(slotKey);
        if (!link) { openConfig(slotKey); return; }
        state.activeSlot = slotKey;
        const icon = document.getElementById('hslAccessIcon');
        icon.innerHTML = sanitizeSvgClient(link.iconSvg || '');
        document.getElementById('hslAccessCopy').textContent = (link.label || ('Círculo ' + slotKey)) + ' · la URL permanece oculta hasta validar la firma.';
        document.getElementById('hslAccessSignature').value = '';
        setError('hslAccessError', '');
        setModalOpen('hslConfigModal', false);
        setModalOpen('hslAccessModal', true);
        window.setTimeout(function () { document.getElementById('hslAccessSignature').focus(); }, 40);
    }

    function handleSlot(slotKey) {
        if (state.links.has(slotKey)) openAccess(slotKey);
        else openConfig(slotKey);
    }

    function activateOriginalTool() {
        const slotEl = currentSlotElement();
        if (!slotEl) return;
        setModalOpen('hslConfigModal', false);
        setModalOpen('hslAccessModal', false);
        state.bypassSlot = slotEl;
        try { slotEl.click(); } finally {
            window.setTimeout(function () { if (state.bypassSlot === slotEl) state.bypassSlot = null; }, 0);
        }
    }

    async function saveCurrent() {
        const slot = state.activeSlot;
        if (!validSlot(slot)) return;
        const button = document.getElementById('hslSave');
        const signature = document.getElementById('hslSaveSignature').value;
        const svg = sanitizeSvgClient(document.getElementById('hslSvg').value);
        setError('hslConfigError', '');
        if (!svg) { setError('hslConfigError', 'El SVG no es válido o contiene código no permitido.'); return; }
        const url = document.getElementById('hslUrl').value.trim();
        if (!/^https?:\/\//i.test(url)) { setError('hslConfigError', 'Introduce un enlace completo que empiece por http:// o https://.'); return; }
        if (!signature.trim()) { setError('hslConfigError', 'La firma Dilithium-5 es obligatoria para guardar.'); return; }
        button.disabled = true;
        try {
            await postJson('save', {
                slot: slot,
                url: url,
                iconSvg: svg,
                label: document.getElementById('hslLabel').value.trim(),
                identityName: document.getElementById('hslIdentityName').value.trim(),
                identityUsername: document.getElementById('hslIdentityUsername').value.trim(),
                identityEmail: document.getElementById('hslIdentityEmail').value.trim(),
                signature: signature
            });
            document.getElementById('hslSaveSignature').value = '';
            setModalOpen('hslConfigModal', false);
            await refreshLinks(true);
            announce('Círculo ' + slot + ' guardado y sincronizado en PostgreSQL.', 'success');
        } catch (error) {
            setError('hslConfigError', error.message || 'No se pudo guardar el círculo.');
        } finally {
            button.disabled = false;
        }
    }

    async function deleteCurrent() {
        const slot = state.activeSlot;
        if (!validSlot(slot) || !state.links.has(slot)) return;
        const signature = document.getElementById('hslSaveSignature').value.trim();
        if (!signature) {
            setError('hslConfigError', 'Pega la firma Dilithium-5 para quitar este enlace.');
            return;
        }
        const button = document.getElementById('hslDelete');
        button.disabled = true;
        try {
            await postJson('delete', { slot: slot, signature: signature });
            document.getElementById('hslSaveSignature').value = '';
            setModalOpen('hslConfigModal', false);
            await refreshLinks(true);
            announce('Enlace quitado del círculo ' + slot + '.', 'success');
        } catch (error) {
            setError('hslConfigError', error.message || 'No se pudo quitar el enlace.');
        } finally {
            button.disabled = false;
        }
    }

    async function unlockCurrent() {
        const slot = state.activeSlot;
        if (!validSlot(slot)) return;
        const signature = document.getElementById('hslAccessSignature').value.trim();
        if (!signature) { setError('hslAccessError', 'La firma Dilithium-5 es obligatoria.'); return; }
        const button = document.getElementById('hslUnlock');
        button.disabled = true;
        setError('hslAccessError', '');
        try {
            const body = await postJson('open', { slot: slot, signature: signature });
            document.getElementById('hslAccessSignature').value = '';
            setModalOpen('hslAccessModal', false);
            openBrowser(body.url, body.identity || {}, body.label || '');
        } catch (error) {
            setError('hslAccessError', error.message || 'No se pudo validar la firma.');
        } finally {
            button.disabled = false;
        }
    }

    function identityInitials(identity) {
        const source = String(identity.name || identity.username || 'Hashcod').trim();
        const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
        return (parts.map(function (p) { return p.charAt(0); }).join('') || 'HC').toUpperCase();
    }

    function renderIdentity(identity) {
        const details = document.getElementById('hslIdentityDetails');
        const avatar = document.getElementById('hslIdentityAvatar');
        if (avatar) avatar.textContent = identityInitials(identity);
        if (!details) return;
        const rows = [
            ['ID', identity.id || '—'],
            ['Nombre', identity.name || '—'],
            ['Usuario', identity.username || '—'],
            ['Correo', identity.email || '—']
        ];
        details.innerHTML = rows.map(function (row) {
            const canCopy = row[1] && row[1] !== '—';
            return '<div class="hsl-id-row"><dt>' + escapeHtml(row[0]) + '</dt><dd>' + escapeHtml(row[1]) + '</dd>'
                + (canCopy ? '<button type="button" class="hsl-mini-copy" data-copy-value="' + escapeHtml(row[1]) + '">COPIAR</button>' : '') + '</div>';
        }).join('');
    }

    function browserTargetOrigin(url) {
        try { return new URL(url, window.location.href).origin; } catch (_) { return '*'; }
    }

    function sendIdentityToFrame() {
        const frame = document.getElementById('hslBrowserFrame');
        if (!frame || !frame.contentWindow || !state.frameIdentity) return;
        try {
            frame.contentWindow.postMessage({
                type: 'HASHCOD_IDENTITY_V1',
                source: 'hashcod-codespace',
                identity: state.frameIdentity
            }, browserTargetOrigin(state.frameUrl));
        } catch (_) {}
    }

    function openBrowser(url, identity, label) {
        ensureRoot();
        let parsed;
        try { parsed = new URL(url, window.location.href); } catch (_) { announce('El enlace devuelto no es válido.', 'error'); return; }
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') { announce('Solo se permiten enlaces HTTP/HTTPS.', 'error'); return; }
        state.frameUrl = parsed.href;
        state.frameIdentity = Object.freeze({
            id: String(identity.id || ''),
            name: String(identity.name || ''),
            username: String(identity.username || ''),
            email: String(identity.email || ''),
            provider: 'hashcod-codespace',
            label: String(label || '')
        });
        document.getElementById('hslBrowserAddress').textContent = parsed.origin + parsed.pathname;
        renderIdentity(state.frameIdentity);
        const browser = document.getElementById('hslBrowser');
        const frame = document.getElementById('hslBrowserFrame');
        browser.classList.add('is-open');
        browser.setAttribute('aria-hidden', 'false');
        document.body.classList.add('hsl-browser-open');
        frame.src = state.frameUrl;
    }

    function closeBrowser() {
        const browser = document.getElementById('hslBrowser');
        const frame = document.getElementById('hslBrowserFrame');
        if (browser) { browser.classList.remove('is-open'); browser.setAttribute('aria-hidden', 'true'); }
        if (frame) frame.src = 'about:blank';
        document.body.classList.remove('hsl-browser-open');
        state.frameUrl = '';
        state.frameIdentity = null;
    }

    async function copyText(value) {
        const text = String(value || '');
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            announce('Copiado.', 'success');
        } catch (_) {
            const area = document.createElement('textarea');
            area.value = text;
            area.style.position = 'fixed';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            try { document.execCommand('copy'); announce('Copiado.', 'success'); } catch (error) { announce('No se pudo copiar automáticamente.', 'error'); }
            area.remove();
        }
    }

    function bindUi(root) {
        root.querySelectorAll('[data-hsl-close="config"]').forEach(function (node) {
            node.addEventListener('click', function () { setModalOpen('hslConfigModal', false); });
        });
        root.querySelectorAll('[data-hsl-close="access"]').forEach(function (node) {
            node.addEventListener('click', function () { setModalOpen('hslAccessModal', false); });
        });
        document.getElementById('hslSvg').addEventListener('input', updatePreview);
        document.getElementById('hslSvgFile').addEventListener('change', function (event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            if (file.size > MAX_SVG_BYTES) { setError('hslConfigError', 'El SVG supera 32 KB.'); return; }
            const reader = new FileReader();
            reader.onload = function () {
                document.getElementById('hslSvg').value = String(reader.result || '');
                if (!updatePreview()) setError('hslConfigError', 'El archivo SVG contiene elementos no permitidos.');
            };
            reader.readAsText(file);
        });
        document.getElementById('hslSave').addEventListener('click', saveCurrent);
        document.getElementById('hslDelete').addEventListener('click', deleteCurrent);
        document.getElementById('hslUnlock').addEventListener('click', unlockCurrent);
        document.getElementById('hslOriginalTool').addEventListener('click', activateOriginalTool);
        document.getElementById('hslEditLink').addEventListener('click', function () { if (state.activeSlot) openConfig(state.activeSlot); });
        document.getElementById('hslBrowserClose').addEventListener('click', closeBrowser);
        document.getElementById('hslBrowserReload').addEventListener('click', function () {
            const frame = document.getElementById('hslBrowserFrame');
            if (frame && state.frameUrl) frame.src = state.frameUrl;
        });
        document.getElementById('hslBrowserFrame').addEventListener('load', function () {
            window.setTimeout(sendIdentityToFrame, 120);
        });
        document.getElementById('hslIdentityDetails').addEventListener('click', function (event) {
            const button = event.target.closest('[data-copy-value]');
            if (button) copyText(button.getAttribute('data-copy-value') || '');
        });
        document.getElementById('hslCopyIdentity').addEventListener('click', function () {
            if (!state.frameIdentity) return;
            copyText([
                'Hashcod ID: ' + (state.frameIdentity.id || ''),
                'Nombre: ' + (state.frameIdentity.name || ''),
                'Usuario: ' + (state.frameIdentity.username || ''),
                'Correo: ' + (state.frameIdentity.email || '')
            ].join('\n'));
        });
    }

    document.addEventListener('click', function (event) {
        const slotEl = event.target.closest && event.target.closest(SLOT_SELECTOR);
        if (!slotEl || state.bypassSlot === slotEl) return;
        const slot = String(slotEl.getAttribute('data-slot') || '').trim();
        if (!validSlot(slot)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        handleSlot(slot);
    }, true);

    document.addEventListener('contextmenu', function (event) {
        const slotEl = event.target.closest && event.target.closest(SLOT_SELECTOR);
        if (!slotEl) return;
        const slot = String(slotEl.getAttribute('data-slot') || '').trim();
        if (!validSlot(slot)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        openConfig(slot);
    }, true);

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            if (document.getElementById('hslBrowser') && document.getElementById('hslBrowser').classList.contains('is-open')) { closeBrowser(); return; }
            setModalOpen('hslConfigModal', false);
            setModalOpen('hslAccessModal', false);
            return;
        }
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const slotEl = event.target.closest && event.target.closest(SLOT_SELECTOR);
        if (!slotEl || state.bypassSlot === slotEl) return;
        const slot = String(slotEl.getAttribute('data-slot') || '').trim();
        if (!validSlot(slot)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        handleSlot(slot);
    }, true);

    const observer = new MutationObserver(function (mutations) {
        let relevant = false;
        for (const mutation of mutations) {
            for (const node of Array.from(mutation.addedNodes || [])) {
                if (!(node instanceof Element)) continue;
                if ((node.matches && node.matches(SLOT_SELECTOR)) || (node.querySelector && node.querySelector(SLOT_SELECTOR))) {
                    relevant = true;
                    break;
                }
            }
            if (relevant) break;
        }
        if (relevant) renderAllSlots();
    });

    function start() {
        ensureRoot();
        renderAllSlots();
        refreshLinks(true);
        observer.observe(document.body, { childList: true, subtree: true });
        state.refreshTimer = window.setInterval(function () { refreshLinks(true); }, REFRESH_MS);
        window.addEventListener('focus', function () { refreshLinks(true); });
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') refreshLinks(true);
        });
        window.HashcodSecureToolbox = Object.freeze({
            sync: function () { return refreshLinks(false); },
            configure: openConfig,
            open: openAccess,
            closeBrowser: closeBrowser
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})();
