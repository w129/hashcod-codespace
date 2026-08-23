/**
 * Copyright (C) 2020-2026 Denver Technologies, Inc.
 * Copyright (C) 2026 DIKTATCART / Hashcod
 *
 * This file is part of Warp / Hashcod Codespace integration.
 * Modified on 2026 by DIKTATCART: Added full Warp terminal engine, themes, workflows, and PQC blocks.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

(function (window, document) {
    'use strict';

    // Iconos Vectoriales SVG Nativos Oficiales estilo Warp
    const WARP_SVG_TERMINAL = '<svg class="warp-icon-svg" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-12-3l3-3-3-3 1.41-1.41L12.83 12l-3.42 3.41L8 15zm5 0h5v2h-5v-2z"/></svg>';
    const WARP_SVG_FOLDER = '<svg class="warp-icon-svg" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>';
    const WARP_SVG_GIT = '<svg class="warp-icon-svg" viewBox="0 0 24 24"><path d="M21 9c0-.75-.41-1.4-.99-1.74l-2.01-1.15V4c0-.55-.45-1-1-1s-1 .45-1 1v2.11L14 7.26V4c0-.55-.45-1-1-1s-1 .45-1 1v4.38l-4 2.31V4c0-.55-.45-1-1-1s-1 .45-1 1v8.74c-.58.34-1 .99-1 1.76 0 1.1.9 2 2 2s2-.9 2-2c0-.75-.41-1.4-.99-1.74l-2.01-1.15V4c0-.55-.45-1-1-1s-1 .45-1 1v2.11L14 7.26V4c0-.55-.45-1-1-1s-1 .45-1 1v4.38l-4 2.31V4c0-.55-.45-1-1-1s-1 .45-1 1v8.74c-.58.34-1 .99-1 1.76 0 1.1.9 2 2 2s2-.9 2-2c0-.77-.42-1.42-1-1.76V12.7l4-2.31v1.65c-.58.34-1 .99-1 1.76 0 1.1.9 2 2 2s2-.9 2-2c0-.77-.42-1.42-1-1.76V8.42l2-1.15v4.77c-.58.34-1 .99-1 1.76 0 1.1.9 2 2 2s2-.9 2-2c0-.77-.42-1.42-1-1.76V7.26l2-1.15c.58.34 1 .99 1 1.76 0 1.1.9 2 2 2s2-.9 2-2z"/></svg>';
    const WARP_SVG_LOCK = '<svg class="warp-icon-svg" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>';
    const WARP_SVG_CLOCK = '<svg class="warp-icon-svg" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-8-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>';
    const WARP_SVG_STAR = '<svg class="warp-icon-svg" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
    const WARP_SVG_ZAP = '<svg class="warp-icon-svg" viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>';
    const WARP_SVG_EXPORT = '<svg class="warp-icon-svg" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>';
    const WARP_SVG_TRASH = '<svg class="warp-icon-svg" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    const WARP_SVG_PALETTE = '<svg class="warp-icon-svg" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.17 19.59 10.53 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-5 9c-.83 0-1.5-.67-1.5-1.5S6.17 9 7 9s1.5.67 1.5 1.5S7.83 12 7 12zm3-4c-.83 0-1.5-.67-1.5-1.5S9.17 5 10 5s1.5.67 1.5 1.5S10.83 8 10 8zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 5 14 5s1.5.67 1.5 1.5S14.83 8 14 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.17 9 17 9s1.5.67 1.5 1.5S17.83 12 17 12z"/></svg>';
    const WARP_SVG_AI = '<svg class="warp-icon-svg" viewBox="0 0 24 24"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>';

    const WarpBlocks = {
        blocks: [],
        maxBlocks: 60,
        searchQuery: '',
        filterBookmarked: false,
        activeAutoIndex: -1,
        selectedBlockIndex: -1,
        currentTheme: 'default',

        themes: [
            { id: 'default', name: 'Warp Light', bg: '#FFFFFF', accent: '#3B82F6', fg: '#111827' },
            { id: 'warp-dark', name: 'Warp Dark', bg: '#1e1e2e', accent: '#89b4fa', fg: '#cdd6f4' },
            { id: 'nord', name: 'Nord Arctic', bg: '#2e3440', accent: '#88c0d0', fg: '#eceff4' },
            { id: 'dracula', name: 'Dracula Pro', bg: '#282a36', accent: '#bd93f9', fg: '#f8f8f2' },
            { id: 'tokyo-night', name: 'Tokyo Night', bg: '#1a1b26', accent: '#7aa2f7', fg: '#c0caf5' },
            { id: 'cyberpunk', name: 'Cyberpunk Neon', bg: '#0d0f18', accent: '#00e5ff', fg: '#00ffcc' }
        ],

        catalog: [
            // Hashcod Built-ins
            { cmd: 'repos', desc: 'Catálogo de repositorios GitHub con licencias verificadas', category: 'GitHub' },
            { cmd: 'clone facebook/react', desc: 'Clonar o actualizar repositorio GitHub vía SSH/HTTPS', category: 'Git' },
            { cmd: 'save facebook/react', desc: 'Guardar repositorio en base de datos persistente', category: 'Storage' },
            { cmd: 'set_i code', desc: 'Explorador de base de datos global con firmas Dilithium-5', category: 'Database' },
            { cmd: 'upload', desc: 'Subir archivo con sellado criptográfico post-cuántico PQC', category: 'Files' },
            { cmd: 'supabase', desc: 'Estado de conexión y persistencia de Supabase Storage', category: 'Cloud' },
            { cmd: 'ssh_key', desc: 'Mostrar y copiar clave pública Ed25519 para GitHub', category: 'Security' },
            { cmd: 'status', desc: 'Diagnóstico general del servidor y motores en ejecución', category: 'System' },
            { cmd: 'prs-code', desc: 'Lanzar IDE colaborativo PRS Code en ventana externa', category: 'Apps' },
            { cmd: 'macos', desc: 'Abrir entorno virtualizado macOS inside', category: 'Apps' },
            { cmd: 'chromeos', desc: 'Abrir entorno virtualizado ChromeOS play', category: 'Apps' },
            { cmd: 'dil_fs', desc: 'Limpiar terminal negra e inspector de carpetas', category: 'System' },
            { cmd: 'clear', desc: 'Vaciar historial de celdas de la sesión', category: 'Terminal' },
            { cmd: 'workflows', desc: 'Abrir panel de flujos de trabajo predefinidos', category: 'Warp' },
            { cmd: 'themes', desc: 'Selector visual de temas de terminal Warp', category: 'Warp' },
            { cmd: 'ai', desc: 'Asistente de inteligencia artificial y generador de comandos', category: 'Warp AI' },

            // Bash Standard Shell Utilities
            { cmd: 'ls -la', desc: 'Listar archivos y permisos del directorio actual', category: 'Bash' },
            { cmd: 'pwd', desc: 'Imprimir ruta de trabajo actual', category: 'Bash' },
            { cmd: 'date', desc: 'Mostrar fecha y hora actual del servidor', category: 'Bash' },
            { cmd: 'whoami', desc: 'Usuario y privilegios actuales', category: 'Bash' },
            { cmd: 'uname -a', desc: 'Información del sistema operativo y kernel', category: 'Bash' },
            { cmd: 'git status', desc: 'Estado de cambios y rama Git', category: 'Git' },
            { cmd: 'git log --oneline -n 5', desc: 'Últimos 5 commits del repositorio', category: 'Git' },
            { cmd: 'php -v', desc: 'Versión y módulos de PHP en el servidor', category: 'Dev' },
            { cmd: 'node -v', desc: 'Versión del motor Node.js', category: 'Dev' }
        ],

        workflows: [
            { title: 'Clonar e Inspeccionar React', cmd: 'clone facebook/react', desc: 'Descarga React y carga el árbol de código en la consola', category: 'GitHub' },
            { title: 'Comprobar Conexión Supabase', cmd: 'supabase', desc: 'Verifica bucket de almacenamiento y persistencia Postgres', category: 'Cloud' },
            { title: 'Ver Clave SSH para GitHub', cmd: 'ssh_key', desc: 'Muestra la clave Ed25519 para configurar repositorios privados', category: 'Security' },
            { title: 'Explorar Base de Datos Global', cmd: 'set_i code', desc: 'Muestra todos los archivos con firma NIST Dilithium-5', category: 'PQC' },
            { title: 'Subir Archivo Criptográfico', cmd: 'upload', desc: 'Abre el explorador para subir y sellar con Dilithium-5', category: 'PQC' },
            { title: 'Ver Estado del Servidor', cmd: 'status', desc: 'Diagnóstico de memoria, PHP, navegadores y PQC', category: 'System' },
            { title: 'Cambiar Tema Warp', cmd: 'themes', desc: 'Abre el selector interactivo de paletas visuales', category: 'Warp' },
            { title: 'Warp AI Assistant', cmd: 'ai ¿Cómo clono un repositorio privado?', desc: 'Consulta al asistente inteligente de comandos', category: 'Warp AI' },
            { title: 'Limpiar Consola y Bloques', cmd: 'clear', desc: 'Vacía la sesión actual de terminal', category: 'Terminal' }
        ],

        init: function () {
            console.log('[WarpBlocks] Full Warp terminal engine loaded (AGPL-3.0 Denver & DIKTATCART / Hashcod).');
            this.loadSavedTheme();
            this.setupPromptAutocomplete();
            this.setupKeyboardShortcuts();
        },

        loadSavedTheme: function () {
            const saved = localStorage.getItem('warp_theme') || 'default';
            this.applyTheme(saved);
        },

        applyTheme: function (themeId) {
            this.currentTheme = themeId;
            localStorage.setItem('warp_theme', themeId);
            if (themeId === 'default') {
                document.body.removeAttribute('data-warp-theme');
            } else {
                document.body.setAttribute('data-warp-theme', themeId);
            }
            const badge = document.getElementById('warpThemeChipName');
            if (badge) {
                const found = this.themes.find(t => t.id === themeId);
                badge.textContent = found ? found.name : themeId;
            }
        },

        setupKeyboardShortcuts: function () {
            window.addEventListener('keydown', (e) => {
                // Ctrl+L / Cmd+K -> Clear all blocks
                if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'k')) {
                    if (document.activeElement && document.activeElement.id === 'cmdInput') {
                        e.preventDefault();
                        this.clearAll();
                    }
                }
                // Ctrl+P / Cmd+P -> Open Workflows / Palette
                if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                    e.preventDefault();
                    this.openWorkflowsModal();
                }
                // Ctrl+Shift+T -> Open Themes Modal
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'T' || e.key === 't')) {
                    e.preventDefault();
                    this.openThemesModal();
                }
                // Ctrl+Space -> Open Warp AI Modal
                if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
                    e.preventDefault();
                    this.openAiModal();
                }
                // Ctrl+Up / Ctrl+Down -> Navigate between blocks
                if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateBlocks(-1);
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateBlocks(1);
                }
            });
        },

        navigateBlocks: function (dir) {
            if (this.blocks.length === 0) return;
            const items = document.querySelectorAll('.warp-block');
            if (items.length === 0) return;

            items.forEach(el => el.classList.remove('active-focus'));
            if (this.selectedBlockIndex < 0) {
                this.selectedBlockIndex = dir > 0 ? 0 : items.length - 1;
            } else {
                this.selectedBlockIndex += dir;
                if (this.selectedBlockIndex < 0) this.selectedBlockIndex = 0;
                if (this.selectedBlockIndex >= items.length) this.selectedBlockIndex = items.length - 1;
            }
            const active = items[this.selectedBlockIndex];
            if (active) {
                active.classList.add('active-focus');
                active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        },

        setupPromptAutocomplete: function () {
            const input = document.getElementById('cmdInput');
            if (!input) return;

            let dropdown = document.getElementById('warpAutoDropdown');
            if (!dropdown) {
                dropdown = document.createElement('div');
                dropdown.id = 'warpAutoDropdown';
                dropdown.className = 'warp-autocomplete-dropdown';
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
                const items = dropdown.querySelectorAll('.warp-auto-item');
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
                <div class="warp-auto-item" data-cmd="${esc(m.cmd)}" onclick="window.WarpBlocks.selectAuto('${esc(m.cmd)}')">
                    <span class="warp-auto-cmd">
                        <span class="warp-prompt-pill" style="font-size:10px; padding:1px 4px;">&gt;=</span>
                        <span>${esc(m.cmd)}</span>
                        <span class="warp-auto-badge">${esc(m.category)}</span>
                    </span>
                    <span class="warp-auto-desc">${esc(m.desc)}</span>
                </div>
            `).join('');
            dropdown.classList.add('open');
        },

        selectAuto: function (cmd) {
            const input = document.getElementById('cmdInput');
            const dropdown = document.getElementById('warpAutoDropdown');
            if (input) {
                input.value = cmd;
                input.focus();
            }
            if (dropdown) dropdown.classList.remove('open');
        },

        createBlock: function (command, outputHtml, meta) {
            const blockId = 'warp_block_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            const duration = meta && meta.duration ? meta.duration + 'ms' : '1ms';
            const isError = !!(meta && (meta.isError || meta.error));
            const exitCode = isError ? 1 : 0;
            const timeStr = new Date().toLocaleTimeString();

            const blockObj = {
                id: blockId,
                command: command,
                outputHtml: outputHtml,
                exitCode: exitCode,
                duration: duration,
                time: timeStr,
                bookmarked: false,
                collapsed: false
            };

            this.blocks.push(blockObj);
            if (this.blocks.length > this.maxBlocks) {
                this.blocks.shift();
            }

            return blockObj;
        },

        renderSessionFeed: function () {
            const container = document.getElementById('executionContent');
            if (!container) return;

            let filtered = this.blocks;
            if (this.filterBookmarked) {
                filtered = filtered.filter(b => b.bookmarked);
            }
            if (this.searchQuery.trim()) {
                const q = this.searchQuery.toLowerCase();
                filtered = filtered.filter(b => 
                    b.command.toLowerCase().includes(q) || 
                    b.outputHtml.toLowerCase().includes(q)
                );
            }

            if (filtered.length === 0) {
                if (this.blocks.length === 0) {
                    container.innerHTML = '';
                    return;
                }
                container.innerHTML = `
                    <div style="width:100%; display:flex; flex-direction:column; gap:8px;">
                        ${this.renderToolbarHtml()}
                        <div style="padding:20px; text-align:center; color:#6B7280; font-family:'Geist Mono', monospace; font-size:12px; border:1px dashed var(--warp-border); border-radius:6px;">
                            Sin celdas que coincidan con el filtro de búsqueda.
                        </div>
                    </div>
                `;
                return;
            }

            const blocksHtml = filtered.map(b => this.renderSingleBlockHtml(b)).join('');
            container.innerHTML = `
                <div style="width:100%; display:flex; flex-direction:column; gap:8px;">
                    ${this.renderToolbarHtml()}
                    <div class="warp-session-feed">
                        ${blocksHtml}
                    </div>
                </div>
            `;
        },

        renderToolbarHtml: function () {
            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const bookmarkActive = this.filterBookmarked ? 'active' : '';
            return `
                <div class="warp-session-toolbar">
                    <div class="warp-session-search-wrapper">
                        <svg style="width:13px; height:13px; fill:#6B7280; flex-shrink:0;" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                        <input type="text" class="warp-session-search-input" placeholder="Buscar en celdas (Ctrl+F)..." value="${esc(this.searchQuery)}" oninput="window.WarpBlocks.setSearch(this.value)">
                    </div>
                    <div class="warp-session-actions">
                        <button type="button" class="warp-session-btn ${bookmarkActive}" title="Filtrar celdas destacadas" onclick="window.WarpBlocks.toggleBookmarkFilter()">
                            ${WARP_SVG_STAR} <span>Favoritos</span>
                        </button>
                        <button type="button" class="warp-session-btn" title="Selector de Temas Warp (Ctrl+Shift+T)" onclick="window.WarpBlocks.openThemesModal()">
                            ${WARP_SVG_PALETTE} <span>Temas</span>
                        </button>
                        <button type="button" class="warp-session-btn" title="Asistente AI de Comandos (Ctrl+Espacio)" onclick="window.WarpBlocks.openAiModal()">
                            ${WARP_SVG_AI} <span>Warp AI</span>
                        </button>
                        <button type="button" class="warp-session-btn" title="Workflows Predefinidos (Ctrl+P)" onclick="window.WarpBlocks.openWorkflowsModal()">
                            ${WARP_SVG_ZAP} <span>Workflows</span>
                        </button>
                        <button type="button" class="warp-session-btn" title="Exportar log de la sesión" onclick="window.WarpBlocks.exportSessionLog()">
                            ${WARP_SVG_EXPORT} <span>Exportar</span>
                        </button>
                        <button type="button" class="warp-session-btn" title="Limpiar sesión (Ctrl+L)" onclick="window.WarpBlocks.clearAll()">
                            ${WARP_SVG_TRASH} <span>Limpiar</span>
                        </button>
                    </div>
                </div>
            `;
        },

        renderSingleBlockHtml: function (block) {
            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const exitClass = block.exitCode === 0 ? 'success' : 'error';
            const exitIcon = block.exitCode === 0 ? '✔ exit 0' : '✘ exit ' + block.exitCode;
            const bookmarkClass = block.bookmarked ? 'bookmarked' : '';

            return `
                <div class="warp-block ${block.exitCode === 0 ? 'status-success' : 'status-error'} ${block.bookmarked ? 'bookmarked' : ''}" id="${block.id}">
                    <div class="warp-block-header">
                        <div class="warp-block-header-left">
                            <span class="warp-prompt-pill">&gt;=</span>
                            <span class="warp-cmd-text" title="${esc(block.command)}">${esc(block.command)}</span>
                        </div>
                        <div class="warp-block-header-right">
                            <span class="warp-meta-pill">${WARP_SVG_ZAP} ${esc(block.duration)}</span>
                            <span class="warp-meta-pill">${WARP_SVG_CLOCK} ${esc(block.time)}</span>
                            <div class="warp-block-toolbar">
                                <button type="button" class="warp-tool-btn" title="Copiar comando" onclick="window.WarpBlocks.copyCmd('${block.id}')">
                                    <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                                </button>
                                <button type="button" class="warp-tool-btn" title="Copiar salida" onclick="window.WarpBlocks.copyOutput('${block.id}')">
                                    <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                                </button>
                                <button type="button" class="warp-tool-btn" title="Re-ejecutar comando" onclick="window.WarpBlocks.rerun('${block.id}')">
                                    <svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                                </button>
                                <button type="button" class="warp-tool-btn ${bookmarkClass}" title="Marcar favorito" onclick="window.WarpBlocks.toggleBookmark('${block.id}')">
                                    <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                                </button>
                                <button type="button" class="warp-tool-btn" title="Plegar / desplegar celda" onclick="window.WarpBlocks.toggleCollapse('${block.id}')">
                                    <svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
                                </button>
                                <button type="button" class="warp-tool-btn" title="Eliminar celda" onclick="window.WarpBlocks.deleteBlock('${block.id}')">
                                    <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="warp-block-body ${block.collapsed ? 'collapsed' : ''}" id="${block.id}_body">
                        ${block.outputHtml}
                    </div>
                    <div class="warp-block-footer">
                        <span class="warp-exit-badge ${exitClass}">${exitIcon}</span>
                        <a href="javascript:void(0)" class="warp-license-badge" onclick="window.WarpBlocks.openSourceModal()" title="Ver aviso de código abierto y licencia AGPL-3.0">
                            ${WARP_SVG_ZAP} <span>Warp Blocks AGPLv3 (Denver &amp; DIKTATCART)</span>
                        </a>
                    </div>
                </div>
            `;
        },

        setSearch: function (val) {
            this.searchQuery = val || '';
            this.renderSessionFeed();
        },

        toggleBookmarkFilter: function () {
            this.filterBookmarked = !this.filterBookmarked;
            this.renderSessionFeed();
        },

        copyCmd: function (blockId) {
            const b = this.blocks.find(x => x.id === blockId);
            if (!b) return;
            navigator.clipboard.writeText(b.command);
            if (typeof window.showToast === 'function') window.showToast('Comando copiado al portapapeles');
        },

        copyOutput: function (blockId) {
            const bodyEl = document.getElementById(blockId + '_body');
            if (!bodyEl) return;
            navigator.clipboard.writeText(bodyEl.innerText || bodyEl.textContent);
            if (typeof window.showToast === 'function') window.showToast('Salida de celda copiada');
        },

        rerun: function (blockId) {
            const b = this.blocks.find(x => x.id === blockId);
            if (!b) return;
            if (typeof window.submitCommand === 'function') {
                window.submitCommand(b.command);
            }
        },

        toggleCollapse: function (blockId) {
            const b = this.blocks.find(x => x.id === blockId);
            const bodyEl = document.getElementById(blockId + '_body');
            if (!b || !bodyEl) return;
            b.collapsed = !b.collapsed;
            bodyEl.classList.toggle('collapsed', b.collapsed);
        },

        toggleBookmark: function (blockId) {
            const b = this.blocks.find(x => x.id === blockId);
            if (!b) return;
            b.bookmarked = !b.bookmarked;
            this.renderSessionFeed();
        },

        deleteBlock: function (blockId) {
            this.blocks = this.blocks.filter(x => x.id !== blockId);
            this.renderSessionFeed();
        },

        clearAll: function () {
            this.blocks = [];
            this.renderSessionFeed();
            if (typeof window.showToast === 'function') window.showToast('Sesión de terminal vaciada');
        },

        exportSessionLog: function () {
            if (this.blocks.length === 0) {
                alert('No hay celdas para exportar en la sesión.');
                return;
            }
            let text = '# Hashcod Codespace — Warp Terminal Session Log\n';
            text += '# Generated: ' + new Date().toISOString() + '\n\n';
            this.blocks.forEach((b, idx) => {
                text += `## [${idx + 1}] ${b.time} (Duration: ${b.duration}, Exit: ${b.exitCode})\n`;
                text += `> ${b.command}\n\n`;
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = b.outputHtml;
                text += (tempDiv.innerText || tempDiv.textContent) + '\n\n';
                text += '--------------------------------------------------------\n\n';
            });
            const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'warp-terminal-session-' + Date.now() + '.md';
            a.click();
            URL.revokeObjectURL(url);
        },

        openWorkflowsModal: function () {
            const existing = document.getElementById('warpWorkflowsModal');
            if (existing) existing.remove();

            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const modal = document.createElement('div');
            modal.id = 'warpWorkflowsModal';
            modal.className = 'warp-modal-overlay';
            modal.innerHTML = `
                <div class="warp-modal" role="dialog" aria-modal="true">
                    <div class="warp-modal-header">
                        <div class="warp-modal-title">${WARP_SVG_ZAP} <span>Warp Workflows &amp; Snippets (Ctrl+P)</span></div>
                        <button type="button" class="warp-modal-close" onclick="document.getElementById('warpWorkflowsModal').remove()">&times;</button>
                    </div>
                    <div class="warp-modal-content">
                        <p style="margin-top:0; color:#6B7280; font-size:12px;">Selecciona o busca un flujo preconfigurado para ejecutarlo o insertarlo en la consola:</p>
                        ${this.workflows.map(wf => `
                            <div class="warp-workflow-card" onclick="window.WarpBlocks.runWorkflow('${esc(wf.cmd)}')">
                                <div>
                                    <div style="font-weight:700; color:var(--warp-fg); font-size:13px;">${esc(wf.title)} <span class="warp-auto-badge">${esc(wf.category)}</span></div>
                                    <div style="font-size:11px; color:#6B7280; margin-top:2px;">${esc(wf.desc)}</div>
                                </div>
                                <span class="warp-prompt-pill" style="font-size:11px;">&gt;= ${esc(wf.cmd)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="warp-modal-footer">
                        <span style="font-size:11px; color:#6B7280;">Warp Workflows Engine (AGPL-3.0)</span>
                        <button type="button" class="unlicensed-modal-btn" onclick="document.getElementById('warpWorkflowsModal').remove()">Cerrar</button>
                    </div>
                </div>
            `;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            document.body.appendChild(modal);
        },

        runWorkflow: function (cmd) {
            const modal = document.getElementById('warpWorkflowsModal');
            if (modal) modal.remove();
            const input = document.getElementById('cmdInput');
            if (input) input.value = cmd;
            if (typeof window.submitCommand === 'function') {
                window.submitCommand(cmd);
            }
        },

        openThemesModal: function () {
            const existing = document.getElementById('warpThemesModal');
            if (existing) existing.remove();

            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const modal = document.createElement('div');
            modal.id = 'warpThemesModal';
            modal.className = 'warp-modal-overlay';
            modal.innerHTML = `
                <div class="warp-modal" role="dialog" aria-modal="true">
                    <div class="warp-modal-header">
                        <div class="warp-modal-title">${WARP_SVG_PALETTE} <span>Warp Terminal Themes (Ctrl+Shift+T)</span></div>
                        <button type="button" class="warp-modal-close" onclick="document.getElementById('warpThemesModal').remove()">&times;</button>
                    </div>
                    <div class="warp-modal-content">
                        <p style="margin-top:0; color:#6B7280; font-size:12px;">Selecciona un tema visual oficial de Warp para personalizar la terminal y las celdas:</p>
                        <div class="warp-themes-grid">
                            ${this.themes.map(t => `
                                <div class="warp-theme-card ${t.id === this.currentTheme ? 'active' : ''}" onclick="window.WarpBlocks.applyTheme('${t.id}')">
                                    <div class="warp-theme-preview-strip" style="background:${t.bg}; border:1px solid rgba(0,0,0,0.15);">
                                        <div style="flex:1; background:${t.bg};"></div>
                                        <div style="width:20px; background:${t.accent};"></div>
                                        <div style="width:20px; background:${t.fg};"></div>
                                    </div>
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <strong style="font-size:12px;">${esc(t.name)}</strong>
                                        ${t.id === this.currentTheme ? '<span style="color:#10B981; font-size:11px; font-weight:700;">Activo</span>' : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="warp-modal-footer">
                        <span style="font-size:11px; color:#6B7280;">Warp Theme Manager</span>
                        <button type="button" class="unlicensed-modal-btn" onclick="document.getElementById('warpThemesModal').remove()">Listo</button>
                    </div>
                </div>
            `;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            document.body.appendChild(modal);
        },

        openAiModal: function (initialQuery) {
            const existing = document.getElementById('warpAiModal');
            if (existing) existing.remove();

            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const query = initialQuery || '';

            const modal = document.createElement('div');
            modal.id = 'warpAiModal';
            modal.className = 'warp-modal-overlay';
            modal.innerHTML = `
                <div class="warp-modal" role="dialog" aria-modal="true">
                    <div class="warp-modal-header">
                        <div class="warp-modal-title">${WARP_SVG_AI} <span>Warp AI Command Assistant (Ctrl+Espacio)</span></div>
                        <button type="button" class="warp-modal-close" onclick="document.getElementById('warpAiModal').remove()">&times;</button>
                    </div>
                    <div class="warp-modal-content">
                        <p style="margin-top:0; color:#6B7280; font-size:12px;">Escribe en lenguaje natural lo que deseas hacer y Warp AI generará el comando exacto de terminal:</p>
                        <div style="display:flex; gap:8px; margin-bottom:12px;">
                            <input type="text" id="warpAiInput" class="cmd-input" placeholder="Ej: clonar un repositorio, ver claves ssh, verificar supabase..." value="${esc(query)}" style="flex:1;" onkeydown="if(event.key==='Enter') window.WarpBlocks.askAi()">
                            <button type="button" class="btn-upload-vector" onclick="window.WarpBlocks.askAi()">Generar</button>
                        </div>
                        <div id="warpAiResultContainer"></div>
                    </div>
                    <div class="warp-modal-footer">
                        <span style="font-size:11px; color:#6B7280;">Warp AI Command Engine</span>
                        <button type="button" class="unlicensed-modal-btn" onclick="document.getElementById('warpAiModal').remove()">Cerrar</button>
                    </div>
                </div>
            `;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            document.body.appendChild(modal);

            setTimeout(() => {
                const inp = document.getElementById('warpAiInput');
                if (inp) {
                    inp.focus();
                    if (query) this.askAi();
                }
            }, 100);
        },

        askAi: function () {
            const inp = document.getElementById('warpAiInput');
            const res = document.getElementById('warpAiResultContainer');
            if (!inp || !res) return;
            const q = inp.value.trim().toLowerCase();
            if (!q) return;

            // Motor local de resolución inteligente Warp AI
            let suggestion = 'status';
            let explanation = 'Muestra el diagnóstico general de la plataforma Hashcod.';

            if (q.includes('clon') || q.includes('descarg') || q.includes('repo')) {
                suggestion = 'clone facebook/react';
                explanation = 'Clona el repositorio especificado desde GitHub en el servidor seguro.';
            } else if (q.includes('ssh') || q.includes('clave') || q.includes('key')) {
                suggestion = 'ssh_key';
                explanation = 'Genera y muestra la clave pública Ed25519 para vincularla a tu cuenta de GitHub.';
            } else if (q.includes('supa') || q.includes('base') || q.includes('storage') || q.includes('guard')) {
                suggestion = 'supabase';
                explanation = 'Verifica la conexión con Supabase y la persistencia de datos.';
            } else if (q.includes('subir') || q.includes('upload') || q.includes('archiv')) {
                suggestion = 'upload';
                explanation = 'Abre el selector de archivos local para subir y sellar con firma Dilithium-5.';
            } else if (q.includes('pqc') || q.includes('dilithium') || q.includes('firma') || q.includes('set_i')) {
                suggestion = 'set_i code';
                explanation = 'Abre la super base de datos con todos los archivos sellados post-cuánticos.';
            } else if (q.includes('limpi') || q.includes('borr') || q.includes('clear')) {
                suggestion = 'clear';
                explanation = 'Limpia el feed de celdas y la consola.';
            } else if (q.includes('mac') || q.includes('macos')) {
                suggestion = 'macos';
                explanation = 'Despliega el entorno macOS inside.';
            } else if (q.includes('chrome') || q.includes('chromeos')) {
                suggestion = 'chromeos';
                explanation = 'Despliega el entorno ChromeOS play.';
            } else if (q.includes('prs') || q.includes('ide') || q.includes('editor')) {
                suggestion = 'prs-code';
                explanation = 'Abre el IDE colaborativo PRS Code.';
            } else if (q.includes('tema') || q.includes('color') || q.includes('theme')) {
                suggestion = 'themes';
                explanation = 'Abre el panel de personalización de temas de Warp.';
            }

            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            res.innerHTML = `
                <div style="background:var(--warp-card-bg); border:1px solid var(--warp-accent); border-radius:6px; padding:12px; margin-top:10px;">
                    <div style="font-weight:700; color:var(--warp-fg); font-size:12px; margin-bottom:4px;">Comando Sugerido:</div>
                    <div style="background:var(--warp-code-bg); color:var(--warp-code-fg); padding:8px 10px; border-radius:4px; font-family:monospace; font-size:13px; display:flex; justify-content:space-between; align-items:center;">
                        <code>&gt;= ${esc(suggestion)}</code>
                        <button type="button" class="warp-tool-btn" style="color:#FFF;" title="Copiar comando" onclick="navigator.clipboard.writeText('${esc(suggestion)}')">
                            <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                        </button>
                    </div>
                    <div style="font-size:11px; color:#6B7280; margin-top:8px;">${esc(explanation)}</div>
                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
                        <button type="button" class="unlicensed-modal-btn" onclick="window.WarpBlocks.insertAiCommand('${esc(suggestion)}')">Insertar en Consola</button>
                        <button type="button" class="btn-upload-vector" onclick="window.WarpBlocks.runAiCommand('${esc(suggestion)}')">Ejecutar Ahora</button>
                    </div>
                </div>
            `;
        },

        insertAiCommand: function (cmd) {
            const modal = document.getElementById('warpAiModal');
            if (modal) modal.remove();
            const inp = document.getElementById('cmdInput');
            if (inp) {
                inp.value = cmd;
                inp.focus();
            }
        },

        runAiCommand: function (cmd) {
            const modal = document.getElementById('warpAiModal');
            if (modal) modal.remove();
            const inp = document.getElementById('cmdInput');
            if (inp) inp.value = cmd;
            if (typeof window.submitCommand === 'function') {
                window.submitCommand(cmd);
            }
        },

        openSourceModal: function () {
            const existing = document.getElementById('warpSourceModal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'warpSourceModal';
            modal.className = 'warp-modal-overlay';
            modal.innerHTML = `
                <div class="warp-modal" role="dialog" aria-modal="true">
                    <div class="warp-modal-header">
                        <div class="warp-modal-title">${WARP_SVG_ZAP} <span>Warp Block Terminal · Open Source Notice (AGPL-3.0)</span></div>
                        <button type="button" class="warp-modal-close" onclick="document.getElementById('warpSourceModal').remove()">&times;</button>
                    </div>
                    <div class="warp-modal-content">
                        <p style="margin-top:0;"><strong>Authors &amp; Licensing Notice:</strong></p>
                        <ul>
                            <li><strong>Original Warp Terminal codebase:</strong> Copyright &copy; 2020-2026 Denver Technologies, Inc. (Licensed under GNU AGPL-3.0).</li>
                            <li><strong>Modifications &amp; Block Integration:</strong> Copyright &copy; 2026 DIKTATCART / Hashcod.</li>
                            <li><strong>Brand &amp; Custody:</strong> "Hashcod" is the platform and "DIKTATCART" is the enterprise author. The open AGPL-3.0 license strictly applies to this Warp-derived cell block terminal module.</li>
                        </ul>
                        <p><strong>AGPL-3.0 Network Source Code Availability:</strong></p>
                        <p>You can inspect and download the source code of this block terminal component below:</p>
                        <pre class="warp-source-pre"><code>// Location: components/warp-blocks.js &amp; components/warp-blocks.css\n// Repository: https://github.com/w129/hashcod-codespace\n// Warp Upstream: https://github.com/warpdotdev/warp.git</code></pre>
                    </div>
                    <div class="warp-modal-footer">
                        <span style="font-size:11px; color:#6B7280;">Licensed under GNU AGPL v3.0</span>
                        <div style="display:flex; gap:8px;">
                            <a href="/LICENSE-WARP.md" target="_blank" class="unlicensed-modal-btn" style="text-decoration:none; display:inline-flex; align-items:center;">Ver LICENSE-WARP.md</a>
                            <button type="button" class="unlicensed-modal-btn" onclick="document.getElementById('warpSourceModal').remove()">Cerrar</button>
                        </div>
                    </div>
                </div>
            `;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            document.body.appendChild(modal);
        }
    };

    window.WarpBlocks = WarpBlocks;
    document.addEventListener('DOMContentLoaded', () => {
        WarpBlocks.init();
    });
})(window, document);