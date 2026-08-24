/**
 * Durable Objects Client SDK & UI Inspector para L8 / Hashcod Codespace.
 *
 * Proporciona el cliente JavaScript de Actores con Estado (Durable Objects),
 * RPC llamadas, almacenamiento transaccional y el modal de inspección en vivo.
 */

(function () {
    'use strict';

    function l8ApiUrl(path) {
        const base = window.L8_BASE_PATH || (document.querySelector('base')?.getAttribute('href')) || '';
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        const cleanBase = base.endsWith('/') ? base : (base ? base + '/' : '');
        return cleanBase + cleanPath;
    }

    class DurableObjectStub {
        constructor(namespace, id) {
            this.namespace = namespace;
            this.id = id;
        }

        async fetch(path = '/', options = {}) {
            const method = options.method || 'POST';
            const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
            const res = await fetch(l8ApiUrl('api/do/fetch'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    namespace: this.namespace,
                    id: this.id,
                    path: path,
                    method: method,
                    ...body
                })
            });
            return await res.json();
        }

        async rpc(methodName, params = []) {
            const res = await fetch(l8ApiUrl('api/do/rpc'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    namespace: this.namespace,
                    id: this.id,
                    method: methodName,
                    params: params
                })
            });
            return await res.json();
        }

        async getStorage(key = null) {
            const url = 'api/do/inspect?namespace=' + encodeURIComponent(this.namespace) + '&id=' + encodeURIComponent(this.id);
            const res = await fetch(l8ApiUrl(url));
            const data = await res.json();
            if (key !== null) {
                return data.storage ? data.storage[key] : null;
            }
            return data.storage || {};
        }

        async putStorage(key, value) {
            return await this.fetch('/storage/put', {
                body: { key, value }
            });
        }

        async deleteStorage(key) {
            return await this.fetch('/storage/delete', {
                body: { key }
            });
        }

        async getState() {
            const url = 'api/do/inspect?namespace=' + encodeURIComponent(this.namespace) + '&id=' + encodeURIComponent(this.id);
            const res = await fetch(l8ApiUrl(url));
            return await res.json();
        }
    }

    class DurableObjectNamespace {
        constructor(name) {
            this.name = name;
        }

        async idFromName(name) {
            const res = await fetch(l8ApiUrl('api/do/id-from-name'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ namespace: this.name, name: name })
            });
            const data = await res.json();
            return data.id;
        }

        async newUniqueId() {
            const res = await fetch(l8ApiUrl('api/do/new-unique-id'));
            const data = await res.json();
            return data.id;
        }

        get(id) {
            return new DurableObjectStub(this.name, id);
        }
    }

    const DurableObjectsSDK = {
        getNamespace(name) {
            return new DurableObjectNamespace(name);
        },

        async list() {
            const res = await fetch(l8ApiUrl('api/do/list'));
            return await res.json();
        },

        async getNamespaces() {
            const res = await fetch(l8ApiUrl('api/do/namespaces'));
            return await res.json();
        },

        async dispatchAlarms() {
            const res = await fetch(l8ApiUrl('api/do/alarm/dispatch'));
            return await res.json();
        },

        openInspectorModal() {
            let modal = document.getElementById('durableObjectsModal');
            if (!modal) {
                modal = createInspectorModal();
                document.body.appendChild(modal);
            }
            modal.classList.add('open');
            loadInspectorData();
        },

        closeInspectorModal() {
            const modal = document.getElementById('durableObjectsModal');
            if (modal) {
                modal.classList.remove('open');
            }
        }
    };

    function createInspectorModal() {
        const modal = document.createElement('div');
        modal.id = 'durableObjectsModal';
        modal.className = 'do-modal-overlay';
        modal.innerHTML = `
            <div class="do-modal-container">
                <div class="do-modal-header">
                    <div class="do-modal-title">
                        <svg class="do-title-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                            <polyline points="2 17 12 22 22 17"></polyline>
                            <polyline points="2 12 12 17 22 12"></polyline>
                        </svg>
                        <span>Durable Objects · Actor Model Engine</span>
                    </div>
                    <button class="do-close-btn" onclick="window.DurableObjects.closeInspectorModal()" title="Cerrar modal">&times;</button>
                </div>
                <div class="do-modal-body">
                    <div class="do-sidebar">
                        <div class="do-sidebar-head">
                            <span>Namespaces & Actores</span>
                            <button class="do-mini-btn" onclick="loadInspectorData()" title="Refrescar">↻</button>
                        </div>
                        <div class="do-namespaces-list" id="doNamespacesList">
                            <div class="do-loading">Cargando namespaces...</div>
                        </div>
                        <div class="do-create-actor-box">
                            <div class="do-field-label">Instanciar Actor</div>
                            <select id="doNewNsSelect" class="do-input-select">
                                <option value="room">RoomActor (Colaboración)</option>
                                <option value="terminal">TerminalSessionDO</option>
                                <option value="ratelimit">RateLimiterDO</option>
                                <option value="counter">CounterDO (Métricas)</option>
                                <option value="ledger">LedgerDO (Hashchain)</option>
                                <option value="generic">GenericActor</option>
                            </select>
                            <input type="text" id="doNewActorName" class="do-input-text" placeholder="Nombre único del actor (ej: sala-1)" />
                            <button class="do-btn-primary" onclick="createOrOpenActor()">Abrir / Crear</button>
                        </div>
                    </div>
                    <div class="do-content-panel" id="doContentPanel">
                        <div class="do-empty-state">
                            <div class="do-empty-icon">⚛</div>
                            <h3>Durable Objects Activos</h3>
                            <p>Selecciona un actor en la barra lateral o crea uno nuevo para inspeccionar su almacenamiento persistente, estado en memoria y métodos RPC.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    async function loadInspectorData() {
        const listEl = document.getElementById('doNamespacesList');
        if (!listEl) return;
        try {
            const [nsRes, listRes] = await Promise.all([
                DurableObjectsSDK.getNamespaces(),
                DurableObjectsSDK.list()
            ]);

            let html = '';
            const objects = listRes.objects || [];

            (nsRes.namespaces || []).forEach(ns => {
                const nsObjs = objects.filter(o => o.namespace === ns.name);
                html += `
                    <div class="do-ns-group">
                        <div class="do-ns-title">
                            <strong>${ns.name}</strong> <span class="do-ns-class">(${ns.class})</span>
                        </div>
                        <div class="do-actors-sublist">
                            ${nsObjs.length ? nsObjs.map(o => `
                                <div class="do-actor-item" onclick="inspectActor('${ns.name}', '${o.id}')">
                                    <span class="do-actor-dot"></span>
                                    <span class="do-actor-name">${o.name || o.id.slice(0, 12) + '…'}</span>
                                    <span class="do-actor-keys">${o.keys_count}k</span>
                                </div>
                            `).join('') : '<div class="do-no-actors">Sin instancias activas</div>'}
                        </div>
                    </div>
                `;
            });
            listEl.innerHTML = html;
        } catch (e) {
            listEl.innerHTML = '<div class="do-error">Error cargando datos de Durable Objects</div>';
        }
    }

    window.createOrOpenActor = async function () {
        const ns = document.getElementById('doNewNsSelect').value;
        const name = document.getElementById('doNewActorName').value.trim() || 'default';
        const nsObj = DurableObjectsSDK.getNamespace(ns);
        const id = await nsObj.idFromName(name);
        inspectActor(ns, id, name);
    };

    window.inspectActor = async function (namespace, id, customName = '') {
        const content = document.getElementById('doContentPanel');
        if (!content) return;
        content.innerHTML = '<div class="do-loading">Cargando estado del actor...</div>';

        try {
            const stub = DurableObjectsSDK.getNamespace(namespace).get(id);
            const state = await stub.getState();

            const storage = state.storage || {};
            const keys = Object.keys(storage);

            content.innerHTML = `
                <div class="do-inspector-view">
                    <div class="do-actor-header">
                        <div class="do-actor-headline">
                            <h2>${customName || state.namespace} <span class="do-tag">${state.class}</span></h2>
                            <div class="do-actor-id-code">ID: <code>${id}</code></div>
                        </div>
                        <div class="do-actor-actions">
                            <button class="do-action-btn" onclick="inspectActor('${namespace}', '${id}', '${customName}')">↻ Refrescar</button>
                            <button class="do-action-btn" onclick="promptPutStorage('${namespace}', '${id}')">+ Guardar Clave</button>
                        </div>
                    </div>

                    <div class="do-metrics-bar">
                        <div class="do-metric-card">
                            <span class="do-metric-num">${state.version || 1}</span>
                            <span class="do-metric-lbl">Versión Transaccional</span>
                        </div>
                        <div class="do-metric-card">
                            <span class="do-metric-num">${keys.length}</span>
                            <span class="do-metric-lbl">Claves Almacenadas</span>
                        </div>
                        <div class="do-metric-card">
                            <span class="do-metric-num">${state.alarm_at ? 'Programada' : 'Inactiva'}</span>
                            <span class="do-metric-lbl">Alarma Temporal</span>
                        </div>
                    </div>

                    <div class="do-section-title">Almacenamiento Clave-Valor (Persistent Storage)</div>
                    <div class="do-kv-table-container">
                        ${keys.length ? `
                            <table class="do-kv-table">
                                <thead>
                                    <tr>
                                        <th>Clave (Key)</th>
                                        <th>Valor (JSON)</th>
                                        <th style="width: 80px;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${keys.map(k => `
                                        <tr>
                                            <td><code>${k}</code></td>
                                            <td><pre class="do-val-pre">${escapeHtml(JSON.stringify(storage[k], null, 2))}</pre></td>
                                            <td>
                                                <button class="do-del-btn" onclick="deleteStorageKey('${namespace}', '${id}', '${k}')" title="Eliminar clave">✕</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : '<div class="do-empty-kv">Este Durable Object aún no tiene claves persistidas.</div>'}
                    </div>

                    <div class="do-section-title">Ejecución RPC en Vivo</div>
                    <div class="do-rpc-tester">
                        <input type="text" id="doRpcMethodInput" class="do-input-text" placeholder="Nombre de método (ej: increment, appendTransaction, joinUser)" />
                        <input type="text" id="doRpcParamsInput" class="do-input-text" placeholder="Parámetros JSON (ej: [5] o [\"usuario1\", {\"rol\":\"admin\"}])" />
                        <button class="do-btn-primary" onclick="executeActorRpc('${namespace}', '${id}')">Ejecutar RPC</button>
                    </div>
                    <div id="doRpcResultBox" class="do-rpc-result" style="display: none;"></div>
                </div>
            `;
        } catch (e) {
            content.innerHTML = `<div class="do-error">Error al cargar actor: ${e.message}</div>`;
        }
    };

    window.promptPutStorage = async function(namespace, id) {
        const key = prompt('Introduce el nombre de la clave:');
        if (!key) return;
        const valStr = prompt('Introduce el valor (JSON o texto):', '{}');
        if (valStr === null) return;
        let val = valStr;
        try { val = JSON.parse(valStr); } catch (e) {}

        const stub = DurableObjectsSDK.getNamespace(namespace).get(id);
        await stub.putStorage(key, val);
        inspectActor(namespace, id);
    };

    window.deleteStorageKey = async function(namespace, id, key) {
        if (!confirm(`¿Eliminar la clave '${key}' de este Durable Object?`)) return;
        const stub = DurableObjectsSDK.getNamespace(namespace).get(id);
        await stub.deleteStorage(key);
        inspectActor(namespace, id);
    };

    window.executeActorRpc = async function(namespace, id) {
        const method = document.getElementById('doRpcMethodInput').value.trim();
        const paramsRaw = document.getElementById('doRpcParamsInput').value.trim();
        const box = document.getElementById('doRpcResultBox');
        if (!method) {
            alert('Indica el nombre del método RPC');
            return;
        }
        let params = [];
        if (paramsRaw) {
            try { params = JSON.parse(paramsRaw); if (!Array.isArray(params)) params = [params]; }
            catch (e) { params = [paramsRaw]; }
        }

        try {
            const stub = DurableObjectsSDK.getNamespace(namespace).get(id);
            const res = await stub.rpc(method, params);
            box.style.display = 'block';
            box.innerHTML = `<strong>Resultado RPC:</strong><pre>${escapeHtml(JSON.stringify(res, null, 2))}</pre>`;
            loadInspectorData();
        } catch (e) {
            box.style.display = 'block';
            box.innerHTML = `<strong style="color: #ef4444;">Error RPC:</strong> ${escapeHtml(e.message)}`;
        }
    };

    function escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Exportar al objeto global
    window.DurableObjects = DurableObjectsSDK;
})();
