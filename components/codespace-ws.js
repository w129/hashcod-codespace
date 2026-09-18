/**
 * ============================================================================
 * HASHCOD CODESPACE · WEBSOCKET CLIENT (codespace-ws.js)
 * Cliente WebSocket resiliente para Terminal Warp, Gateway y Notepad
 * ============================================================================
 */

(function(window) {
    'use strict';

    class CodespaceWebSocketClient {
        constructor() {
            this.ws = null;
            this.clientId = null;
            this.isConnected = false;
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.maxReconnectDelay = 10000;
            this.reconnectTimer = null;
            this.pingTimer = null;
            this.listeners = new Map();
            this.subscribedChannels = new Set(['global', 'terminal', 'gateway', 'notepad', 'system']);

            // Determinar la URL del servidor WebSocket
            this.wsUrl = this.resolveUrl();

            // Iniciar conexión automática al cargar el DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.connect());
            } else {
                this.connect();
            }
        }

        /**
         * Resuelve la URL del WebSocket según el protocolo y host
         */
        resolveUrl() {
            if (window.CODESPACE_WS_URL) return window.CODESPACE_WS_URL;

            const isHttps = window.location.protocol === 'https:';
            const protocol = isHttps ? 'wss:' : 'ws:';
            const host = window.location.hostname || 'localhost';

            // Local desktop/Laragon uses the loopback-only hardened WS server.
            if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.test') || host.endsWith('.local')) {
                return `${protocol}//${host}:8080`;
            }

            // Remote WS is opt-in. The server requires an explicit allowlist and
            // a strong token; deployments that do not configure it simply stay offline.
            return `${protocol}//${window.location.host}/ws`;
        }

        connectionUrl() {
            const token = typeof window.CODESPACE_WS_TOKEN === 'string'
                ? window.CODESPACE_WS_TOKEN.trim()
                : '';
            if (!token) return this.wsUrl;

            try {
                const url = new URL(this.wsUrl, window.location.href);
                url.searchParams.set('token', token);
                return url.toString();
            } catch (_) {
                return this.wsUrl;
            }
        }

        /**
         * Establece la conexión WebSocket
         */
        connect() {
            if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
                return;
            }

            this.isConnecting = true;
            this.updateUiState('connecting');

            try {
                this.ws = new WebSocket(this.connectionUrl());

                this.ws.onopen = () => {
                    this.isConnected = true;
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.updateUiState('connected');
                    this.startHeartbeat();
                    console.log('%c⚡ [Codespace WS] Conectado en vivo', 'color:#10B981; font-weight:bold;');

                    // Resuscribir canales registrados
                    this.subscribedChannels.forEach(ch => {
                        this.sendRaw({ action: 'subscribe', channel: ch });
                    });

                    this.dispatch('connection:open', { url: this.wsUrl });
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleIncomingMessage(data);
                    } catch (err) {
                        console.debug('[Codespace WS] Mensaje no JSON:', event.data);
                    }
                };

                this.ws.onclose = (event) => {
                    this.isConnected = false;
                    this.isConnecting = false;
                    this.stopHeartbeat();
                    this.updateUiState('disconnected');
                    this.dispatch('connection:close', { code: event.code, reason: event.reason });
                    this.scheduleReconnect();
                };

                this.ws.onerror = (err) => {
                    console.warn('[Codespace WS] Error en socket:', err);
                    this.updateUiState('error');
                    this.dispatch('connection:error', err);
                };

            } catch (err) {
                console.error('[Codespace WS] Error al instanciar WebSocket:', err);
                this.scheduleReconnect();
            }
        }

        /**
         * Programa la reconexión con backoff exponencial
         */
        scheduleReconnect() {
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
            this.reconnectTimer = setTimeout(() => {
                this.connect();
            }, delay);
        }

        /**
         * Envía pings periódicos para mantener activa la conexión
         */
        startHeartbeat() {
            this.stopHeartbeat();
            this.pingTimer = setInterval(() => {
                if (this.isConnected) {
                    this.sendRaw({ action: 'ping' });
                }
            }, 20000);
        }

        stopHeartbeat() {
            if (this.pingTimer) {
                clearInterval(this.pingTimer);
                this.pingTimer = null;
            }
        }

        /**
         * Procesa mensajes entrantes desde el servidor
         */
        handleIncomingMessage(data) {
            if (data.type === 'welcome') {
                this.clientId = data.clientId;
                return;
            }

            if (data.type === 'pong') {
                return;
            }

            if (data.type === 'event') {
                const eventName = data.event;
                const channel = data.channel;
                const payload = data.payload || {};

                // Disparar listeners específicos del evento y del canal
                this.dispatch(eventName, payload, channel);
                if (channel) {
                    this.dispatch(`${channel}:${eventName}`, payload, channel);
                }

                // Manejo de integraciones predeterminadas de la plataforma
                this.handlePlatformIntegrations(eventName, channel, payload);
            }
        }

        /**
         * Reacciones automáticas en la UI de Hashcod Codespace
         */
        handlePlatformIntegrations(eventName, channel, payload) {
            // Gateway: notificación de nuevo paquete compartido
            if (eventName === 'new_transfer' && channel === 'gateway') {
                this.showToast(`🛰️ Gateway: Paquete ${payload.code || ''} disponible en la nube.`, 'info');
                // Si estamos en la página /gateway, autocompletar el input si está vacío
                const codeInput = document.getElementById('codeInput');
                if (codeInput && !codeInput.value && payload.code) {
                    codeInput.value = payload.code;
                }
            }

            // Gateway: notificación cuando otro dispositivo descarga/reclama el paquete
            if ((eventName === 'transfer_claimed' || eventName === 'gateway_claimed') && channel === 'gateway') {
                this.showToast(`✅ Gateway: El paquete ${payload.code || ''} fue descargado exitosamente.`, 'success');
            }

            // Terminal: sincronización de comandos remotos
            if (eventName === 'command_run' && channel === 'terminal') {
                if (window.WarpTerminal && payload.from !== this.clientId) {
                    // Notificación discreta de comando en otra pestaña
                    console.log(`[WS Terminal] Comando remoto ejecutado por ${payload.user || 'user'}: ${payload.command}`);
                }
            }
        }

        /**
         * Enviar payload crudo
         */
        sendRaw(obj) {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                try {
                    this.ws.send(JSON.stringify(obj));
                    return true;
                } catch (e) {
                    return false;
                }
            }
            return false;
        }

        /**
         * Emite un evento a un canal específico
         */
        emit(event, payload, channel = 'global') {
            return this.sendRaw({
                action: 'publish',
                channel: channel,
                event: event,
                payload: payload
            });
        }

        /**
         * Emite un comando ejecutado en Terminal
         */
        emitTerminalCommand(command, cwd = '~/workspace') {
            return this.sendRaw({
                action: 'terminal_command',
                command: command,
                cwd: cwd
            });
        }

        /**
         * Emite una notificación de paquete Gateway generado
         */
        emitGatewayTransfer(code, label) {
            return this.sendRaw({
                action: 'gateway_transfer',
                code: code,
                label: label
            });
        }

        /**
         * Emite una notificación de paquete Gateway reclamado
         */
        emitGatewayClaimed(code) {
            return this.sendRaw({
                action: 'gateway_claimed',
                code: code
            });
        }

        /**
         * Suscribir a un canal
         */
        subscribe(channel) {
            this.subscribedChannels.add(channel);
            if (this.isConnected) {
                this.sendRaw({ action: 'subscribe', channel: channel });
            }
        }

        /**
         * Desuscribir de un canal
         */
        unsubscribe(channel) {
            this.subscribedChannels.delete(channel);
            if (this.isConnected) {
                this.sendRaw({ action: 'unsubscribe', channel: channel });
            }
        }

        /**
         * Registrar un listener para un evento
         */
        on(event, callback) {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, new Set());
            }
            this.listeners.get(event).add(callback);
            return () => this.off(event, callback);
        }

        /**
         * Eliminar un listener
         */
        off(event, callback) {
            if (this.listeners.has(event)) {
                this.listeners.get(event).delete(callback);
            }
        }

        /**
         * Disparar listeners registrados
         */
        dispatch(event, payload, channel) {
            if (this.listeners.has(event)) {
                this.listeners.get(event).forEach(cb => {
                    try {
                        cb(payload, channel);
                    } catch (e) {
                        console.error(`[Codespace WS] Error en listener para ${event}:`, e);
                    }
                });
            }
        }

        /**
         * Actualizar el estado visual en la UI
         */
        updateUiState(state) {
            // Actualizar chips de Warp o badges de estado
            const chips = document.querySelectorAll('.warp-ws-chip, #warpWsStatusChip');
            chips.forEach(chip => {
                chip.classList.remove('connected', 'connecting', 'disconnected', 'error');
                chip.classList.add(state);
                const label = chip.querySelector('.warp-ws-label') || chip.querySelector('span:last-child');
                if (label) {
                    if (state === 'connected') label.textContent = 'WS Live';
                    else if (state === 'connecting') label.textContent = 'WS Conectando…';
                    else label.textContent = 'WS Offline';
                }
            });
        }

        /**
         * Mostrar notificación Toast flotante
         */
        showToast(msg, type = 'info') {
            let container = document.getElementById('codespaceToastContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'codespaceToastContainer';
                container.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:999999; display:flex; flex-direction:column; gap:8px; pointer-events:none; font-family:"IBM Plex Mono",monospace; font-size:12px;';
                document.body.appendChild(container);
            }

            const toast = document.createElement('div');
            toast.style.cssText = `
                background: ${type === 'success' ? '#064E3B' : type === 'error' ? '#7F1D1D' : '#1E293B'};
                color: #ffffff;
                padding: 10px 14px;
                border-radius: 8px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                border: 1px solid ${type === 'success' ? '#059669' : type === 'error' ? '#DC2626' : '#475569'};
                opacity: 0;
                transform: translateY(10px);
                transition: opacity 0.25s ease, transform 0.25s ease;
                pointer-events: auto;
                max-width: 320px;
                line-height: 1.4;
            `;
            toast.textContent = msg;
            container.appendChild(toast);

            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            });

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px)';
                setTimeout(() => toast.remove(), 300);
            }, 4500);
        }
    }

    // Instancia global
    window.CodespaceWS = new CodespaceWebSocketClient();

})(window);
