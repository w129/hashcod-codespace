(function () {
    'use strict';

    if (window.__hashcodGroqAuthChatLoaded) return;
    window.__hashcodGroqAuthChatLoaded = true;

    const state = {
        messages: [],
        sending: false,
        mounted: false
    };

    const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 32 32" aria-hidden="true"><path d="M 2 4 L 2 21 L 4 21 L 4 6 L 22 6 L 22 16 L 8 16 L 8 18 L 24 18 L 24 4 L 2 4 z M 8 18 L 6 18 L 6 21 L 8 21 L 8 18 z M 6 21 L 4 21 L 4 23 L 6 23 L 6 21 z M 26 11 L 26 13 L 28 13 L 28 28 L 30 28 L 30 11 L 26 11 z M 28 28 L 26 28 L 26 30 L 28 30 L 28 28 z M 26 28 L 26 25 L 24 25 L 24 28 L 26 28 z M 24 25 L 24 23 L 13 23 L 13 20 L 11 20 L 11 25 L 24 25 z"></path></svg>';

    function apiUrl() {
        const match = location.pathname.match(/^\/(?:l8|l8-codespace)(?=\/|$)/i);
        // /api/groq-chat is kept as a backward-compatible route, but the
        // server now forwards it exclusively to OpenRouter.
        return (match ? match[0] : '') + '/api/groq-chat';
    }

    function makeMessage(role, content, extraClass) {
        const row = document.createElement('div');
        row.className = 'groq-chat-message ' + role + (extraClass ? ' ' + extraClass : '');
        const bubble = document.createElement('div');
        bubble.className = 'groq-chat-bubble';
        bubble.textContent = content;
        row.appendChild(bubble);
        return row;
    }

    function mount() {
        if (state.mounted) return true;
        const validateTab = document.getElementById('authTabValidate');
        const tabs = validateTab && validateTab.parentElement;
        if (!validateTab || !tabs) return false;

        if (document.getElementById('groqAuthChatLauncher')) {
            state.mounted = true;
            return true;
        }

        const launcher = document.createElement('button');
        launcher.type = 'button';
        launcher.id = 'groqAuthChatLauncher';
        launcher.className = 'auth-tab';
        launcher.title = 'Abrir Hashcod AI con OpenRouter';
        launcher.setAttribute('aria-label', 'Abrir chat de IA con OpenRouter');
        launcher.setAttribute('aria-expanded', 'false');
        launcher.setAttribute('aria-controls', 'groqAuthChatPanel');
        launcher.innerHTML = iconSvg;
        validateTab.insertAdjacentElement('afterend', launcher);

        const panel = document.createElement('section');
        panel.id = 'groqAuthChatPanel';
        panel.hidden = true;
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'false');
        panel.setAttribute('aria-labelledby', 'groqAuthChatTitle');
        panel.innerHTML = [
            '<header class="groq-chat-head">',
                '<div class="groq-chat-brand">',
                    '<h2 class="groq-chat-title" id="groqAuthChatTitle">Hashcod AI</h2>',
                    '<div class="groq-chat-provider"><span class="groq-chat-provider-dot"></span><span>OpenRouter · listo</span></div>',
                '</div>',
                '<div class="groq-chat-head-actions">',
                    '<button type="button" id="groqAuthChatNew" title="Nuevo chat">Nuevo</button>',
                    '<button type="button" id="groqAuthChatClose" title="Cerrar" aria-label="Cerrar chat">×</button>',
                '</div>',
            '</header>',
            '<div id="groqAuthChatMessages" role="log" aria-live="polite" aria-relevant="additions">',
                '<div class="groq-chat-empty" id="groqAuthChatEmpty"><div><strong>Hashcod AI</strong>Pregunta sobre código, software o la plataforma.</div></div>',
            '</div>',
            '<div id="groqAuthChatError" class="groq-chat-error" hidden></div>',
            '<form class="groq-chat-compose" id="groqAuthChatForm">',
                '<div class="groq-chat-input-row">',
                    '<textarea id="groqAuthChatInput" maxlength="6000" rows="1" placeholder="Escribe un mensaje…" aria-label="Mensaje para Hashcod AI"></textarea>',
                    '<button type="submit" id="groqAuthChatSend">Enviar</button>',
                '</div>',
                '<p class="groq-chat-foot">IA servida por OpenRouter · la clave permanece únicamente en el servidor.</p>',
            '</form>'
        ].join('');
        document.body.appendChild(panel);

        const messagesEl = panel.querySelector('#groqAuthChatMessages');
        const emptyEl = panel.querySelector('#groqAuthChatEmpty');
        const form = panel.querySelector('#groqAuthChatForm');
        const input = panel.querySelector('#groqAuthChatInput');
        const send = panel.querySelector('#groqAuthChatSend');
        const close = panel.querySelector('#groqAuthChatClose');
        const fresh = panel.querySelector('#groqAuthChatNew');
        const errorEl = panel.querySelector('#groqAuthChatError');
        const providerEl = panel.querySelector('.groq-chat-provider span:last-child');

        function setError(message) {
            const text = String(message || '').trim();
            errorEl.textContent = text;
            errorEl.hidden = text === '';
        }

        function renderHistory() {
            messagesEl.querySelectorAll('.groq-chat-message').forEach(el => el.remove());
            emptyEl.hidden = state.messages.length > 0;
            state.messages.forEach(msg => messagesEl.appendChild(makeMessage(msg.role, msg.content)));
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        function setSending(value) {
            state.sending = Boolean(value);
            input.disabled = state.sending;
            send.disabled = state.sending;
            send.textContent = state.sending ? '...' : 'Enviar';
            providerEl.textContent = state.sending ? 'OpenRouter · pensando…' : 'OpenRouter · listo';
        }

        function placePanel() {
            if (panel.hidden) return;
            const rect = launcher.getBoundingClientRect();
            const pad = 12;
            const width = panel.offsetWidth || Math.min(390, window.innerWidth - 24);
            const height = panel.offsetHeight || Math.min(520, window.innerHeight - 24);

            let left;
            let top;
            if (window.innerWidth <= 720) {
                left = Math.max(10, (window.innerWidth - width) / 2);
                top = Math.max(10, (window.innerHeight - height) / 2);
            } else {
                left = rect.right + pad;
                if (left + width > window.innerWidth - pad) {
                    left = rect.left - width - pad;
                }
                if (left < pad) left = Math.max(pad, (window.innerWidth - width) / 2);
                top = rect.top;
                if (top + height > window.innerHeight - pad) top = window.innerHeight - height - pad;
                if (top < pad) top = pad;
            }
            panel.style.left = Math.round(left) + 'px';
            panel.style.top = Math.round(top) + 'px';
        }

        function openPanel() {
            panel.hidden = false;
            launcher.setAttribute('aria-expanded', 'true');
            launcher.classList.add('active');
            requestAnimationFrame(() => {
                placePanel();
                input.focus();
            });
        }

        function closePanel() {
            panel.hidden = true;
            launcher.setAttribute('aria-expanded', 'false');
            launcher.classList.remove('active');
            setError('');
            launcher.focus({preventScroll: true});
        }

        async function sendMessage() {
            if (state.sending) return;
            const text = input.value.trim();
            if (!text) return;

            setError('');
            input.value = '';
            input.style.height = '';
            state.messages.push({role: 'user', content: text});
            if (state.messages.length > 14) state.messages = state.messages.slice(-14);
            renderHistory();

            const pending = makeMessage('assistant', 'Pensando…', 'pending');
            messagesEl.appendChild(pending);
            messagesEl.scrollTop = messagesEl.scrollHeight;
            setSending(true);

            try {
                const response = await fetch(apiUrl(), {
                    method: 'POST',
                    credentials: 'same-origin',
                    cache: 'no-store',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({messages: state.messages.slice(-14)})
                });

                const data = await response.json().catch(() => null);
                if (!response.ok || !data || data.ok !== true) {
                    const providerMessage = data && data.provider_message ? String(data.provider_message) : '';
                    const baseMessage = data && data.error ? String(data.error) : '';
                    const diagnosticText = (baseMessage + ' ' + providerMessage).toLowerCase();
                    const isCreditLimit = Boolean(data) && (
                        Number(data.provider_status) === 402 ||
                        diagnosticText.includes('key limit exceeded') ||
                        diagnosticText.includes('total limit') ||
                        diagnosticText.includes('credit limit') ||
                        diagnosticText.includes('insufficient credit') ||
                        diagnosticText.includes('insufficient credits') ||
                        diagnosticText.includes('quota exceeded') ||
                        diagnosticText.includes('usage limit')
                    );

                    if (isCreditLimit) {
                        throw new Error('Llama al proveedor de esta IA para que te otorgue más créditos para seguir o comenzar.');
                    }

                    let message = baseMessage || 'No se pudo obtener respuesta de la IA.';
                    if (providerMessage) message += ' ' + providerMessage;
                    throw new Error(message);
                }

                const answer = String(data.content || '').trim();
                if (!answer) throw new Error('La IA devolvió una respuesta vacía.');
                state.messages.push({role: 'assistant', content: answer});
                if (state.messages.length > 14) state.messages = state.messages.slice(-14);
                if (data.model) providerEl.textContent = 'OpenRouter · ' + String(data.model).replace(/^.*\//, '');
                renderHistory();
            } catch (error) {
                renderHistory();
                setError(error && error.message ? error.message : 'No se pudo conectar con la IA.');
            } finally {
                pending.remove();
                setSending(false);
                messagesEl.scrollTop = messagesEl.scrollHeight;
                input.focus();
            }
        }

        launcher.addEventListener('click', function () {
            if (panel.hidden) openPanel();
            else closePanel();
        });
        close.addEventListener('click', closePanel);
        fresh.addEventListener('click', function () {
            if (state.sending) return;
            state.messages = [];
            setError('');
            renderHistory();
            input.value = '';
            input.focus();
        });
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            sendMessage();
        });
        input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
        input.addEventListener('input', function () {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 112) + 'px';
        });
        window.addEventListener('resize', placePanel);
        window.addEventListener('scroll', placePanel, true);
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !panel.hidden) closePanel();
        });

        state.mounted = true;
        return true;
    }

    if (!mount()) {
        const observer = new MutationObserver(function () {
            if (mount()) observer.disconnect();
        });
        observer.observe(document.documentElement, {childList: true, subtree: true});
        window.setTimeout(function () { observer.disconnect(); }, 15000);
    }
})();
