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

    const WarpBlocks = {
        blocks: [],
        maxBlocks: 30,

        init: function () {
            console.log('[WarpBlocks] Block terminal engine initialized (AGPL-3.0 / Denver Technologies, Inc. & DIKTATCART / Hashcod).');
        },

        createBlock: function (command, outputHtml, meta) {
            const blockId = 'warp_block_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            const duration = meta && meta.duration ? meta.duration + 'ms' : '1ms';
            const isError = !!(meta && (meta.isError || meta.error));
            const status = isError ? 'status-error' : 'status-success';
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

        renderBlockHtml: function (block) {
            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const exitClass = block.exitCode === 0 ? 'success' : 'error';
            const exitIcon = block.exitCode === 0 ? '✔ exit 0' : '✘ exit ' + block.exitCode;
            const bookmarkClass = block.bookmarked ? 'bookmarked' : '';

            return `
                <div class="warp-block ${block.exitCode === 0 ? 'status-success' : 'status-error'}" id="${block.id}">
                    <div class="warp-block-header">
                        <div class="warp-block-header-left">
                            <span class="warp-prompt-pill">&gt;=</span>
                            <span class="warp-cmd-text" title="${esc(block.command)}">${esc(block.command)}</span>
                        </div>
                        <div class="warp-block-header-right">
                            <span class="warp-meta-pill">⚡ ${esc(block.duration)}</span>
                            <span class="warp-meta-pill">${esc(block.time)}</span>
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
                            </div>
                        </div>
                    </div>
                    <div class="warp-block-body ${block.collapsed ? 'collapsed' : ''}" id="${block.id}_body">
                        ${block.outputHtml}
                    </div>
                    <div class="warp-block-footer">
                        <span class="warp-exit-badge ${exitClass}">${exitIcon}</span>
                        <a href="javascript:void(0)" class="warp-license-badge" onclick="window.WarpBlocks.openSourceModal()" title="Ver licencia AGPL-3.0 y código fuente abierto">
                            ⚡ Warp Blocks AGPLv3 (Denver &amp; DIKTATCART)
                        </a>
                    </div>
                </div>
            `;
        },

        copyCmd: function (blockId) {
            const b = this.blocks.find(x => x.id === blockId);
            if (!b) return;
            navigator.clipboard.writeText(b.command);
            if (typeof window.showToast === 'function') window.showToast('Comando copiado');
        },

        copyOutput: function (blockId) {
            const bodyEl = document.getElementById(blockId + '_body');
            if (!bodyEl) return;
            navigator.clipboard.writeText(bodyEl.innerText || bodyEl.textContent);
            if (typeof window.showToast === 'function') window.showToast('Salida copiada');
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
            const blockEl = document.getElementById(blockId);
            if (blockEl) {
                const btn = blockEl.querySelector('.warp-tool-btn[title="Marcar favorito"]');
                if (btn) btn.classList.toggle('bookmarked', b.bookmarked);
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
                        <div class="warp-modal-title">⚡ Warp Block Terminal · Open Source Notice (AGPL-3.0)</div>
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
})(window, document);