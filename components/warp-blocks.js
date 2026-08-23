/**
 * Copyright (C) 2026 DIKTATCART / Hashcod
 *
 * This file is free software: you can redistribute it and/or modify
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
    const WARP_SVG_CHEVRON = '<svg class="warp-icon-svg" style="width:10px; height:10px;" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>';

    const WarpBlocks = {
        blocks: [],
        maxBlocks: 50,
        searchQuery: '',
        filterBookmarked: false,
        activeAutoIndex: -1,

        catalog: [
            { cmd: 'repos', desc: 'Listar repositorios de GitHub con licencias MIT/Apache/BSD', category: 'GitHub' },
            { cmd: 'clone facebook/react', desc: 'Clonar o actualizar repositorio GitHub', category: 'Git' },
            { cmd: 'save facebook/react', desc: 'Guardar repositorio en base de datos Supabase', category: 'Storage' },
            { cmd: 'set_i code', desc: 'Abrir catálogo global de archivos y firmas Dilithium-5', category: 'Database' },
            { cmd: 'upload', desc: 'Subir archivo local con sellado criptográfico PQC', category: 'Files' },
            { cmd: 'supabase', desc: 'Verificar estado de base de datos y Supabase Storage', category: 'Cloud' },
            { cmd: 'ssh_key', desc: 'Mostrar y copiar clave pública Ed25519 para GitHub', category: 'Security' },
            { cmd: 'status', desc: 'Ver estado general de la plataforma Hashcod', category: 'System' },
            { cmd: 'prs-code', desc: 'Lanzar IDE de código PRS en ventana independiente', category: 'Apps' },
            { cmd: 'macos', desc: 'Abrir entorno macOS inside', category: 'Apps' },
            { cmd: 'chromeos', desc: 'Abrir entorno ChromeOS play', category: 'Apps' },
            { cmd: 'dil_fs', desc: 'Limpiar terminal negra y editor de código', category: 'System' },
            { cmd: 'clear', desc: 'Limpiar todos los bloques de la sesión actual', category: 'Terminal' },
            { cmd: 'workflows', desc: 'Abrir panel de flujos de trabajo predefinidos de Warp', category: 'Warp' }
        ],

        workflows: [
            { title: 'Clonar e Inspeccionar React', cmd: 'clone facebook/react', desc: 'Descarga React y carga el árbol de código en la consola' },
            { title: 'Comprobar Conexión Supabase', cmd: 'supabase', desc: 'Verifica bucket de almacenamiento y persistencia Postgres' },
            { title: 'Ver Clave SSH para GitHub', cmd: 'ssh_key', desc: 'Muestra la clave Ed25519 para configurar repositorios privados' },
            { title: 'Explorar Base de Datos Global', cmd: 'set_i code', desc: 'Muestra todos los archivos con firma NIST Dilithium-5' },
            { title: 'Subir Archivo Criptográfico', cmd: 'upload', desc: 'Abre el explorador de archivos para subir y firmar' },
            { title: 'Limpiar Consola y Bloques', cmd: 'clear', desc: 'Vacía la sesión actual de terminal' }
        ],

        init: function () {
            console.log('[WarpBlocks] Warp block terminal initialized (AGPL-3.0 / Denver Technologies, Inc. & DIKTATCART / Hashcod).');
            this.setupPromptAutocomplete();
            this.setupKeyboardShortcuts();
        },

        setupKeyboardShortcuts: function () {
            window.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'k')) {
                    if (document.activeElement && document.activeElement.id === 'cmdInput') {
                        e.preventDefault();
                        this.clearAll();
                    }
                }
                if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || (e.shiftKey && e.key.toLowerCase() === 'r'))) {
                    e.preventDefault();
                    this.openWorkflowsModal();
                }
            });
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
                        <div style="padding:20px; text-align:center; color:#6B7280; font-family:'Geist Mono', monospace; font-size:12px; border:1px dashed #D1D5DB; border-radius:6px;">
                            Sin bloques que coincidan con el filtro actual.
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
                        <input type="text" class="warp-session-search-input" placeholder="Buscar en historial de celdas..." value="${esc(this.searchQuery)}" oninput="window.WarpBlocks.setSearch(this.value)">
                    </div>
                    <div class="warp-session-actions">
                        <button type="button" class="warp-session-btn ${bookmarkActive}" title="Filtrar celdas favoritas" onclick="window.WarpBlocks.toggleBookmarkFilter()">
                            ${WARP_SVG_STAR} <span>Favoritos</span>
                        </button>
                        <button type="button" class="warp-session-btn" title="Ver Workflows predefinidos" onclick="window.WarpBlocks.openWorkflowsModal()">
                            ${WARP_SVG_ZAP} <span>Workflows</span>
                        </button>
                        <button type="button" class="warp-session-btn" title="Descargar log de sesión" onclick="window.WarpBlocks.exportSessionLog()">
                            ${WARP_SVG_EXPORT} <span>Exportar</span>
                        </button>
                        <button type="button" class="warp-session-btn" title="Limpiar sesión de terminal" onclick="window.WarpBlocks.clearAll()">
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
                        <a href="javascript:void(0)" class="warp-license-badge" onclick="window.WarpBlocks.openSourceModal()" title="Ver licencia AGPL-3.0 y código fuente abierto">
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
                        <div class="warp-modal-title">${WARP_SVG_ZAP} <span>Warp Workflows &amp; Snippets</span></div>
                        <button type="button" class="warp-modal-close" onclick="document.getElementById('warpWorkflowsModal').remove()">&times;</button>
                    </div>
                    <div class="warp-modal-content">
                        <p style="margin-top:0; color:#6B7280; font-size:12px;">Selecciona un flujo de trabajo preconfigurado para ejecutarlo o insertarlo en la línea de comando:</p>
                        ${this.workflows.map(wf => `
                            <div class="warp-workflow-card" onclick="window.WarpBlocks.runWorkflow('${esc(wf.cmd)}')">
                                <div>
                                    <div style="font-weight:700; color:#111827; font-size:13px;">${esc(wf.title)}</div>
                                    <div style="font-size:11px; color:#6B7280; margin-top:2px;">${esc(wf.desc)}</div>
                                </div>
                                <span class="warp-prompt-pill" style="font-size:11px;">&gt;= ${esc(wf.cmd)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="warp-modal-footer">
                        <span style="font-size:11px; color:#6B7280;">Warp Workflows Engine</span>
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
                            <li><strong>Original Warp Terminal codebase:</strong> Copyright &copy; 2020-2026 Denver Technologies, Inc. (Licensed under AGPL-3.0).</li>
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