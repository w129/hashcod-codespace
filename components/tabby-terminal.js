/**
 * Tabby Terminal Controller for Hashcod Codespace
 * Based on Tabby (https://github.com/Eugeny/tabby)
 *
 * Copyright (c) 2017 Eugeny Pankov
 * Copyright (c) 2026 DIKTATCART / Hashcod
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function (window, document) {
    'use strict';

    const TABBY_SVG_TERMINAL = '<svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-12-3l3-3-3-3 1.41-1.41L12.83 12l-3.42 3.41L8 15zm5 0h5v2h-5v-2z"/></svg>';
    const TABBY_SVG_PLUS = '<svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>';
    const TABBY_SVG_PROFILE = '<svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';
    const TABBY_SVG_GEAR = '<svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>';
    const TABBY_SVG_PALETTE = '<svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.17 19.59 10.53 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-5 9c-.83 0-1.5-.67-1.5-1.5S6.17 9 7 9s1.5.67 1.5 1.5S7.83 12 7 12zm3-4c-.83 0-1.5-.67-1.5-1.5S9.17 5 10 5s1.5.67 1.5 1.5S10.83 8 10 8zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 5 14 5s1.5.67 1.5 1.5S14.83 8 14 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.17 9 17 9s1.5.67 1.5 1.5S17.83 12 17 12z"/></svg>';
    const TABBY_SVG_SEARCH = '<svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';
    const TABBY_SVG_TRASH = '<svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    const TABBY_SVG_EXPORT = '<svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>';
    const TABBY_SVG_GATEWAY = '<svg class="tabby-icon-svg gateway-crescent-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 30 30"><path fill="currentColor" d="M 15 3 C 8.3845336 3 3 8.3845336 3 15 C 3 21.615466 8.3845336 27 15 27 C 17.554923 27 19.9167 26.181425 21.853516 24.818359 A 1.0002806 1.0002806 0 0 0 20.703125 23.181641 C 19.081941 24.322575 17.129077 25 15 25 C 9.4654664 25 5 20.534534 5 15 C 5 9.4654664 9.4654664 5 15 5 C 17.129077 5 19.081941 5.6774247 20.703125 6.8183594 A 1.0002809 1.0002809 0 0 0 21.853516 5.1816406 C 19.9167 3.8185753 17.554923 3 15 3 z"></path></svg>';

    const TabbyTerminal = {
        tabs: [],
        activeTabId: 'tab_default',
        currentTheme: 'default',
        activeAutoIndex: -1,

        themes: [
            { id: 'default', name: 'Tabby Standard Dark', bg: '#1e1e24', accent: '#5294e2', fg: '#d8dee9' },
            { id: 'tabby-light', name: 'Tabby Standard Light', bg: '#fafafa', accent: '#5294e2', fg: '#2e3440' },
            { id: 'solarized-dark', name: 'Solarized Dark', bg: '#002b36', accent: '#268bd2', fg: '#839496' },
            { id: 'dracula', name: 'Dracula', bg: '#282a36', accent: '#bd93f9', fg: '#f8f8f2' },
            { id: 'one-dark', name: 'One Dark', bg: '#282c34', accent: '#61afef', fg: '#abb2bf' }
        ],

        profiles: [
            { id: 'default', name: 'Hashcod Platform Shell', icon: '🚀', desc: 'Consola principal y ejecución de comandos plataforma', defaultCmd: 'status' },
            { id: 'pqc', name: 'PQC Dilithium-5 Vault', icon: '🔒', desc: 'Explorador de base de datos con sellado post-cuántico NIST Nivel 5', defaultCmd: 'set_i code' },
            { id: 'github', name: 'GitHub Repos & Git', icon: '🐙', desc: 'Catálogo de repositorios con licencias verificadas y clonación', defaultCmd: 'repos' },
            { id: 'supabase', name: 'Supabase Cloud & Storage', icon: '☁️', desc: 'Diagnóstico de buckets de almacenamiento y persistencia Postgres', defaultCmd: 'supabase' },
            { id: 'ssh', name: 'SSH Key Manager', icon: '🔑', desc: 'Generador y visor de claves públicas Ed25519 para GitHub', defaultCmd: 'ssh_key' },
            { id: 'apps', name: 'Apps & IDEs Virtualizados', icon: '💻', desc: 'Lanzamiento de PRS Code, macOS inside y ChromeOS play', defaultCmd: 'prs-code' }
        ],

        catalog: [
            { cmd: 'repos', desc: 'Catálogo global de GitHub con licencias verificadas', category: 'GitHub' },
            { cmd: 'clone facebook/react', desc: 'Clonar o actualizar repositorio GitHub vía SSH/HTTPS', category: 'Git' },
            { cmd: 'save facebook/react', desc: 'Guardar repositorio en base de datos persistente', category: 'Storage' },
            { cmd: 'set_i code', desc: 'Super base de datos con archivos y hashes Dilithium-5', category: 'Database' },
            { cmd: 'upload', desc: 'Subir archivo con sellado criptográfico post-cuántico PQC', category: 'Files' },
            { cmd: 'supabase', desc: 'Diagnóstico de Supabase Storage y conexión Postgres', category: 'Cloud' },
            { cmd: 'ssh_key', desc: 'Mostrar y copiar clave pública Ed25519 para GitHub', category: 'Security' },
            { cmd: 'status', desc: 'Diagnóstico del servidor, memoria, navegadores y PQC', category: 'System' },
            { cmd: 'prs-code', desc: 'Lanzar IDE colaborativo PRS Code en ventana independiente', category: 'Apps' },
            { cmd: 'macos', desc: 'Abrir entorno virtualizado macOS inside', category: 'Apps' },
            { cmd: 'chromeos', desc: 'Abrir entorno virtualizado ChromeOS play', category: 'Apps' },
            { cmd: 'dil_fs', desc: 'Limpiar terminal negra e inspector de archivos', category: 'System' },
            { cmd: 'clear', desc: 'Limpiar buffer de la pestaña activa de Tabby', category: 'Terminal' },
            { cmd: 'profiles', desc: 'Abrir selector de perfiles de conexión de Tabby', category: 'Tabby' },
            { cmd: 'themes', desc: 'Selector visual de temas de Tabby Terminal', category: 'Tabby' },
            { cmd: 'palette', desc: 'Abrir paleta de comandos rápida (Ctrl+Shift+P)', category: 'Tabby' }
        ],

        init: function () {
            console.log('[TabbyTerminal] Initialized Tabby Terminal engine (MIT License - Eugeny Pankov & DIKTATCART / Hashcod).');
            this.loadSavedTheme();
            this.ensureDefaultTab();
            this.setupPromptAutocomplete();
            this.setupKeyboardShortcuts();
            this.renderTabs();
        },

        loadSavedTheme: function () {
            const saved = localStorage.getItem('tabby_theme') || 'default';
            this.applyTheme(saved);
        },

        applyTheme: function (themeId) {
            this.currentTheme = themeId;
            localStorage.setItem('tabby_theme', themeId);
            if (themeId === 'default') {
                document.body.removeAttribute('data-tabby-theme');
            } else {
                document.body.setAttribute('data-tabby-theme', themeId);
            }
            const badge = document.getElementById('tabbyThemeChipName');
            if (badge) {
                const found = this.themes.find(t => t.id === themeId);
                badge.textContent = found ? found.name : themeId;
            }
        },

        ensureDefaultTab: function () {
            if (this.tabs.length === 0) {
                this.tabs.push({
                    id: 'tab_default',
                    title: 'Hashcod Shell',
                    profileId: 'default',
                    entries: []
                });
                this.activeTabId = 'tab_default';
            }
        },

        setupKeyboardShortcuts: function () {
            window.addEventListener('keydown', (e) => {
                // Ctrl+Shift+P -> Open Command Palette
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
                    e.preventDefault();
                    this.openPaletteModal();
                }
                // Ctrl+T -> New Tab
                if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                    if (document.activeElement && document.activeElement.id === 'cmdInput') {
                        e.preventDefault();
                        this.addNewTab();
                    }
                }
                // Ctrl+W -> Close active tab
                if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
                    if (document.activeElement && document.activeElement.id === 'cmdInput') {
                        e.preventDefault();
                        this.closeTab(this.activeTabId);
                    }
                }
                // Ctrl+L -> Clear active tab buffer
                if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                    if (document.activeElement && document.activeElement.id === 'cmdInput') {
                        e.preventDefault();
                        this.clearActiveTab();
                    }
                }
            });
        },

        setupPromptAutocomplete: function () {
            const input = document.getElementById('cmdInput');
            if (!input) return;

            let dropdown = document.getElementById('tabbyAutoDropdown');
            if (!dropdown) {
                dropdown = document.createElement('div');
                dropdown.id = 'tabbyAutoDropdown';
                dropdown.className = 'tabby-autocomplete-dropdown';
                const promptRow = document.querySelector('.block-row.block-prompt');
                if (promptRow) {
                    promptRow.style.position = 'relative';
                    promptRow.appendChild(dropdown);
                }
            }

            input.addEventListener('input', () => {
                const val = input.value.trim().toLowerCase();
                if (!val) {
                    dropdown.classList.remove('open');
                    return;
                }
                const matches = this.catalog.filter(item => 
                    item.cmd.toLowerCase().startsWith(val) || 
                    item.desc.toLowerCase().includes(val) ||
                    item.category.toLowerCase().includes(val)
                );
                if (matches.length === 0) {
                    dropdown.classList.remove('open');
                    return;
                }
                this.renderAutocompleteMatches(matches, dropdown, input);
            });

            input.addEventListener('keydown', (e) => {
                if (!dropdown.classList.contains('open')) return;
                const items = dropdown.querySelectorAll('.tabby-auto-item');
                if (items.length === 0) return;

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.activeAutoIndex = (this.activeAutoIndex + 1) % items.length;
                    this.highlightAutoItem(items);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.activeAutoIndex = (this.activeAutoIndex - 1 + items.length) % items.length;
                    this.highlightAutoItem(items);
                } else if (e.key === 'Tab' || (e.key === 'Enter' && this.activeAutoIndex >= 0)) {
                    if (this.activeAutoIndex >= 0 && items[this.activeAutoIndex]) {
                        e.preventDefault();
                        const cmd = items[this.activeAutoIndex].getAttribute('data-cmd');
                        input.value = cmd;
                        dropdown.classList.remove('open');
                        this.activeAutoIndex = -1;
                        if (e.key === 'Enter') {
                            if (typeof window.submitCommand === 'function') window.submitCommand(cmd);
                        }
                    }
                } else if (e.key === 'Escape') {
                    dropdown.classList.remove('open');
                    this.activeAutoIndex = -1;
                }
            });

            document.addEventListener('click', (e) => {
                if (dropdown && !dropdown.contains(e.target) && e.target !== input) {
                    dropdown.classList.remove('open');
                }
            });
        },

        highlightAutoItem: function (items) {
            items.forEach((it, idx) => {
                it.classList.toggle('selected', idx === this.activeAutoIndex);
                if (idx === this.activeAutoIndex) it.scrollIntoView({ block: 'nearest' });
            });
        },

        renderAutocompleteMatches: function (matches, dropdown, input) {
            this.activeAutoIndex = -1;
            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            dropdown.innerHTML = matches.map(m => `
                <div class="tabby-auto-item" data-cmd="${esc(m.cmd)}" onclick="window.TabbyTerminal.selectAuto('${esc(m.cmd)}')">
                    <span class="tabby-auto-cmd">
                        <span>&gt;= ${esc(m.cmd)}</span>
                        <span class="tabby-badge">${esc(m.category)}</span>
                    </span>
                    <span style="font-size:11px; color:#888;">${esc(m.desc)}</span>
                </div>
            `).join('');
            dropdown.classList.add('open');
        },

        selectAuto: function (cmd) {
            const input = document.getElementById('cmdInput');
            const dropdown = document.getElementById('tabbyAutoDropdown');
            if (input) {
                input.value = cmd;
                input.focus();
            }
            if (dropdown) dropdown.classList.remove('open');
        },

        addNewTab: function (profileId, title) {
            const prof = this.profiles.find(p => p.id === (profileId || 'default')) || this.profiles[0];
            const newId = 'tab_' + Date.now();
            this.tabs.push({
                id: newId,
                title: title || prof.name,
                profileId: prof.id,
                entries: []
            });
            this.activeTabId = newId;
            this.renderTabs();
            if (prof.defaultCmd && profileId) {
                if (typeof window.submitCommand === 'function') {
                    window.submitCommand(prof.defaultCmd);
                }
            }
        },

        switchTab: function (tabId) {
            this.activeTabId = tabId;
            this.renderTabs();
        },

        closeTab: function (tabId) {
            if (this.tabs.length <= 1) {
                this.clearActiveTab();
                return;
            }
            this.tabs = this.tabs.filter(t => t.id !== tabId);
            if (this.activeTabId === tabId) {
                this.activeTabId = this.tabs[this.tabs.length - 1].id;
            }
            this.renderTabs();
        },

        clearActiveTab: function () {
            const active = this.tabs.find(t => t.id === this.activeTabId);
            if (active) {
                active.entries = [];
                this.renderTabs();
            }
        },

        addEntryToActiveTab: function (cmd, outputHtml, meta) {
            this.ensureDefaultTab();
            let active = this.tabs.find(t => t.id === this.activeTabId);
            if (!active) {
                active = this.tabs[0];
                this.activeTabId = active.id;
            }

            const entryId = 'entry_' + Date.now();
            const dur = meta && meta.duration ? meta.duration + 'ms' : '1ms';
            const isError = !!(meta && (meta.isError || meta.error));

            active.entries.push({
                id: entryId,
                command: cmd,
                outputHtml: outputHtml,
                duration: dur,
                isError: isError,
                time: new Date().toLocaleTimeString()
            });

            if (active.entries.length > 50) {
                active.entries.shift();
            }

            this.renderTabs();
        },

        renderTabs: function () {
            const container = document.getElementById('executionContent');
            if (!container) return;

            this.ensureDefaultTab();
            const active = this.tabs.find(t => t.id === this.activeTabId) || this.tabs[0];
            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

            const tabsHtml = this.tabs.map(t => {
                const isActive = (t.id === active.id) ? 'active' : '';
                return `
                    <div class="tabby-tab ${isActive}" onclick="window.TabbyTerminal.switchTab('${t.id}')">
                        <span class="tabby-tab-title">${esc(t.title)}</span>
                        <span class="tabby-tab-close" onclick="event.stopPropagation(); window.TabbyTerminal.closeTab('${t.id}')" title="Cerrar pestaña">&times;</span>
                    </div>
                `;
            }).join('');

            const entriesHtml = (active.entries.length === 0) 
                ? `<div style="text-align:center; padding:30px; color:#888888; font-size:12px;">Pestaña lista. Introduce un comando o abre un perfil de Tabby.</div>`
                : active.entries.map(e => `
                    <div class="tabby-entry" id="${e.id}">
                        <div class="tabby-entry-header">
                            <span class="tabby-entry-cmd">
                                <span style="color:#5294e2; font-weight:700;">&gt;=</span>
                                <span>${esc(e.command)}</span>
                            </span>
                            <div class="tabby-entry-toolbar">
                                <span style="color:#888; margin-right:6px;">⚡ ${esc(e.duration)} · ${esc(e.time)}</span>
                                <button type="button" class="tabby-mini-btn tabby-gateway-mini-btn gateway-action-btn" title="Gateway · Enviar salida de comando" onclick="window.TabbyTerminal.shareEntryGateway('${e.id}')">${TABBY_SVG_GATEWAY}</button>
                                <button type="button" class="tabby-mini-btn" title="Copiar comando" onclick="navigator.clipboard.writeText('${esc(e.command)}')">📋</button>
                                <button type="button" class="tabby-mini-btn" title="Re-ejecutar" onclick="if(typeof window.submitCommand==='function') window.submitCommand('${esc(e.command)}')">🔄</button>
                            </div>
                        </div>
                        <div class="tabby-entry-body">
                            ${e.outputHtml}
                        </div>
                    </div>
                `).join('');

            container.innerHTML = `
                <div class="tabby-terminal-container">
                    <div class="tabby-tab-bar">
                        ${tabsHtml}
                        <button type="button" class="tabby-add-tab-btn" onclick="window.TabbyTerminal.addNewTab()" title="Nueva pestaña (Ctrl+T)">
                            ${TABBY_SVG_PLUS}
                        </button>
                        <div class="tabby-tab-bar-actions">
                            <button type="button" class="tabby-action-btn tabby-gateway-btn gateway-action-btn" onclick="window.TabbyTerminal.shareActiveTabGateway()" title="Gateway · Transportar terminal y generar código único">
                                ${TABBY_SVG_GATEWAY} <span>Gateway</span>
                            </button>
                            <button type="button" class="tabby-action-btn" onclick="window.TabbyTerminal.openProfilesModal()">
                                ${TABBY_SVG_PROFILE} <span>Perfiles</span>
                            </button>
                            <button type="button" class="tabby-action-btn" onclick="window.TabbyTerminal.openThemesModal()">
                                ${TABBY_SVG_PALETTE} <span>Temas</span>
                            </button>
                            <button type="button" class="tabby-action-btn" onclick="window.TabbyTerminal.openPaletteModal()">
                                ${TABBY_SVG_GEAR} <span>Paleta</span>
                            </button>
                            <button type="button" class="tabby-action-btn" onclick="window.TabbyTerminal.exportActiveTabLog()">
                                ${TABBY_SVG_EXPORT} <span>Exportar</span>
                            </button>
                            <button type="button" class="tabby-action-btn" onclick="window.TabbyTerminal.clearActiveTab()">
                                ${TABBY_SVG_TRASH} <span>Limpiar</span>
                            </button>
                        </div>
                    </div>
                    <div class="tabby-tab-content">
                        <div class="tabby-session-log">
                            ${entriesHtml}
                        </div>
                    </div>
                </div>
            `;
        },

        shareActiveTabGateway: function () {
            const active = this.tabs.find(t => t.id === this.activeTabId);
            let text = '';
            if (active && active.entries.length > 0) {
                text += '# Tabby Terminal — Session (' + active.title + ')\n\n';
                active.entries.forEach((e, idx) => {
                    text += `### [${idx + 1}] >= ${e.command}\n`;
                    text += `*Timestamp: ${e.time} (${e.duration})*\n\n`;
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = e.outputHtml;
                    text += '```\n' + (tempDiv.innerText || tempDiv.textContent) + '\n```\n\n';
                });
            } else {
                const editor = document.getElementById('functionEditor');
                text = editor ? String(editor.value || '').trim() : '';
            }
            if (typeof window.openGatewayFromTool === 'function') {
                window.openGatewayFromTool('terminal', {
                    name: (active ? active.title : 'terminal') + '.md',
                    content: text || '# Tabby Terminal Session\n\nTerminal activa de Hashcod codespace.',
                    autoSend: true
                });
            } else if (typeof window.openPlatformGateway === 'function') {
                window.openPlatformGateway();
            }
        },

        shareEntryGateway: function (entryId) {
            const active = this.tabs.find(t => t.id === this.activeTabId);
            if (!active) return;
            const entry = active.entries.find(e => e.id === entryId);
            if (!entry) return;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = entry.outputHtml;
            const rawOut = tempDiv.innerText || tempDiv.textContent;
            const content = `# Comando: ${entry.command}\n# Ejecutado: ${entry.time} (${entry.duration})\n\n${rawOut}`;
            const cleanCmd = String(entry.command || 'cmd').replace(/[^\w.-]+/g, '_').slice(0, 30);
            if (typeof window.openGatewayFromTool === 'function') {
                window.openGatewayFromTool('terminal', {
                    name: 'tabby-' + cleanCmd + '.txt',
                    content: content,
                    autoSend: true
                });
            } else if (typeof window.openPlatformGateway === 'function') {
                window.openPlatformGateway();
            }
        },

        exportActiveTabLog: function () {
            const active = this.tabs.find(t => t.id === this.activeTabId);
            if (!active || active.entries.length === 0) {
                alert('No hay comandos en la pestaña activa para exportar.');
                return;
            }
            let text = '# Tabby Terminal — Session Log (' + active.title + ')\n';
            text += '# Exported: ' + new Date().toISOString() + '\n\n';
            active.entries.forEach((e, idx) => {
                text += `## [${idx + 1}] ${e.time} (${e.duration})\n`;
                text += `> ${e.command}\n\n`;
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = e.outputHtml;
                text += (tempDiv.innerText || tempDiv.textContent) + '\n\n';
                text += '--------------------------------------------------------\n\n';
            });
            const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'tabby-terminal-' + active.id + '.md';
            a.click();
            URL.revokeObjectURL(url);
        },

        openProfilesModal: function () {
            const existing = document.getElementById('tabbyProfilesModal');
            if (existing) existing.remove();

            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const modal = document.createElement('div');
            modal.id = 'tabbyProfilesModal';
            modal.className = 'tabby-modal-overlay';
            modal.innerHTML = `
                <div class="tabby-modal" role="dialog" aria-modal="true">
                    <div class="tabby-modal-header">
                        <div class="tabby-modal-title">${TABBY_SVG_PROFILE} <span>Perfiles de Conexión y Sesión Tabby</span></div>
                        <button type="button" class="tabby-modal-close" onclick="document.getElementById('tabbyProfilesModal').remove()">&times;</button>
                    </div>
                    <div class="tabby-modal-content">
                        <p style="margin-top:0; color:#888; font-size:12px;">Selecciona un perfil para abrir una nueva pestaña dedicada en Hashcod:</p>
                        ${this.profiles.map(p => `
                            <div class="tabby-profile-card" onclick="window.TabbyTerminal.selectProfile('${esc(p.id)}')">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <span style="font-size:20px;">${p.icon}</span>
                                    <div>
                                        <div style="font-weight:700; color:#ffffff; font-size:13px;">${esc(p.name)}</div>
                                        <div style="font-size:11px; color:#888888; margin-top:2px;">${esc(p.desc)}</div>
                                    </div>
                                </div>
                                <span class="tabby-badge">&gt;= ${esc(p.defaultCmd)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="tabby-modal-footer">
                        <span style="font-size:11px; color:#888;">Tabby Profiles Engine (MIT License)</span>
                        <button type="button" class="unlicensed-modal-btn" onclick="document.getElementById('tabbyProfilesModal').remove()">Cerrar</button>
                    </div>
                </div>
            `;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            document.body.appendChild(modal);
        },

        selectProfile: function (profileId) {
            const modal = document.getElementById('tabbyProfilesModal');
            if (modal) modal.remove();
            this.addNewTab(profileId);
        },

        openThemesModal: function () {
            const existing = document.getElementById('tabbyThemesModal');
            if (existing) existing.remove();

            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const modal = document.createElement('div');
            modal.id = 'tabbyThemesModal';
            modal.className = 'tabby-modal-overlay';
            modal.innerHTML = `
                <div class="tabby-modal" role="dialog" aria-modal="true">
                    <div class="tabby-modal-header">
                        <div class="tabby-modal-title">${TABBY_SVG_PALETTE} <span>Temas de Tabby Terminal</span></div>
                        <button type="button" class="tabby-modal-close" onclick="document.getElementById('tabbyThemesModal').remove()">&times;</button>
                    </div>
                    <div class="tabby-modal-content">
                        <p style="margin-top:0; color:#888; font-size:12px;">Personaliza la apariencia de las pestañas y la consola:</p>
                        <div class="tabby-themes-grid">
                            ${this.themes.map(t => `
                                <div class="tabby-theme-card ${t.id === this.currentTheme ? 'active' : ''}" onclick="window.TabbyTerminal.applyTheme('${t.id}')">
                                    <div class="tabby-theme-strip" style="background:${t.bg}; border:1px solid rgba(255,255,255,0.1);">
                                        <div style="flex:1; background:${t.bg};"></div>
                                        <div style="width:20px; background:${t.accent};"></div>
                                        <div style="width:20px; background:${t.fg};"></div>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <strong style="font-size:12px; color:#ffffff;">${esc(t.name)}</strong>
                                        ${t.id === this.currentTheme ? '<span style="color:#a3be8c; font-size:11px; font-weight:700;">Activo</span>' : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="tabby-modal-footer">
                        <span style="font-size:11px; color:#888;">Tabby Theme Selector</span>
                        <button type="button" class="unlicensed-modal-btn" onclick="document.getElementById('tabbyThemesModal').remove()">Listo</button>
                    </div>
                </div>
            `;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            document.body.appendChild(modal);
        },

        openPaletteModal: function () {
            const existing = document.getElementById('tabbyPaletteModal');
            if (existing) existing.remove();

            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const modal = document.createElement('div');
            modal.id = 'tabbyPaletteModal';
            modal.className = 'tabby-modal-overlay';
            modal.innerHTML = `
                <div class="tabby-modal" role="dialog" aria-modal="true">
                    <div class="tabby-modal-header">
                        <div class="tabby-modal-title">${TABBY_SVG_GEAR} <span>Paleta de Comandos Tabby (Ctrl+Shift+P)</span></div>
                        <button type="button" class="tabby-modal-close" onclick="document.getElementById('tabbyPaletteModal').remove()">&times;</button>
                    </div>
                    <div class="tabby-modal-content">
                        <input type="text" id="tabbyPaletteSearch" class="cmd-input" placeholder="Buscar comando o acción rápida..." style="margin-bottom:12px; width:100%;" oninput="window.TabbyTerminal.filterPalette(this.value)">
                        <div id="tabbyPaletteList">
                            ${this.catalog.map(c => `
                                <div class="tabby-profile-card" onclick="window.TabbyTerminal.executePaletteCmd('${esc(c.cmd)}')">
                                    <div>
                                        <div style="font-weight:700; color:#ffffff; font-size:13px;">${esc(c.cmd)} <span class="tabby-badge">${esc(c.category)}</span></div>
                                        <div style="font-size:11px; color:#888888; margin-top:2px;">${esc(c.desc)}</div>
                                    </div>
                                    <span class="tabby-badge">Ejecutar</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="tabby-modal-footer">
                        <span style="font-size:11px; color:#888;">Tabby Command Palette</span>
                        <button type="button" class="unlicensed-modal-btn" onclick="document.getElementById('tabbyPaletteModal').remove()">Cerrar</button>
                    </div>
                </div>
            `;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            document.body.appendChild(modal);

            setTimeout(() => {
                const inp = document.getElementById('tabbyPaletteSearch');
                if (inp) inp.focus();
            }, 100);
        },

        filterPalette: function (query) {
            const container = document.getElementById('tabbyPaletteList');
            if (!container) return;
            const q = query.toLowerCase().trim();
            const filtered = this.catalog.filter(c => c.cmd.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            container.innerHTML = filtered.map(c => `
                <div class="tabby-profile-card" onclick="window.TabbyTerminal.executePaletteCmd('${esc(c.cmd)}')">
                    <div>
                        <div style="font-weight:700; color:#ffffff; font-size:13px;">${esc(c.cmd)} <span class="tabby-badge">${esc(c.category)}</span></div>
                        <div style="font-size:11px; color:#888888; margin-top:2px;">${esc(c.desc)}</div>
                    </div>
                    <span class="tabby-badge">Ejecutar</span>
                </div>
            `).join('');
        },

        executePaletteCmd: function (cmd) {
            const modal = document.getElementById('tabbyPaletteModal');
            if (modal) modal.remove();
            const input = document.getElementById('cmdInput');
            if (input) input.value = cmd;
            if (typeof window.submitCommand === 'function') {
                window.submitCommand(cmd);
            }
        },

        openSourceNotice: function () {
            const existing = document.getElementById('tabbyNoticeModal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'tabbyNoticeModal';
            modal.className = 'tabby-modal-overlay';
            modal.innerHTML = `
                <div class="tabby-modal" role="dialog" aria-modal="true">
                    <div class="tabby-modal-header">
                        <div class="tabby-modal-title">${TABBY_SVG_TERMINAL} <span>Tabby Terminal Integration Notice (MIT License)</span></div>
                        <button type="button" class="tabby-modal-close" onclick="document.getElementById('tabbyNoticeModal').remove()">&times;</button>
                    </div>
                    <div class="tabby-modal-content">
                        <p><strong>Tabby Terminal Integration (MIT License):</strong></p>
                        <ul>
                            <li><strong>Upstream Project:</strong> <a href="https://github.com/Eugeny/tabby" target="_blank" style="color:#5294e2;">Eugeny/tabby</a></li>
                            <li><strong>Author:</strong> Copyright (c) 2017 Eugeny Pankov</li>
                            <li><strong>Platform Adaptation:</strong> Copyright (c) 2026 DIKTATCART / Hashcod</li>
                            <li><strong>License:</strong> MIT Permissive Open Source License.</li>
                        </ul>
                    </div>
                    <div class="tabby-modal-footer">
                        <span style="font-size:11px; color:#888;">Licensed under MIT</span>
                        <button type="button" class="unlicensed-modal-btn" onclick="document.getElementById('tabbyNoticeModal').remove()">Cerrar</button>
                    </div>
                </div>
            `;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            document.body.appendChild(modal);
        }
    };

    window.TabbyTerminal = TabbyTerminal;
    document.addEventListener('DOMContentLoaded', () => {
        TabbyTerminal.init();
    });
})(window, document);