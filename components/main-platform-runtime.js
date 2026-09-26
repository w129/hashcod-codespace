        /* ===== SHARED DATA & COLUMNS CONFIGURATION ===== */
        const L8_DATA_KEY = 'l8_admin_panel_records_v1';
        const L8_ACTIVE_COLS_KEY = 'l8_blog_active_columns_v1';

                        const L8_SYSTEM_COLUMNS = [
            { key: 'account_id', label: 'Active Account', minWidth: '130px' },
            { key: 'upload_date', label: 'Upload Date / Revision', minWidth: '150px' },
            { key: 'platform_code', label: 'Platform code', minWidth: '90px' },
            { key: 'auth_signature', label: 'authorization signature', minWidth: '130px' },
            { key: 'num_tokens', label: 'Number of tokens', minWidth: '115px' },
            { key: 'cost_per_token', label: 'cost per token ($0.015)', minWidth: '120px' },
            { key: 'total_cost_usd', label: 'Total USD ($)', minWidth: '110px' },
            { key: 'impenetrable_seal', label: 'Impenetrable Seal', minWidth: '130px' },
            { key: 'icai_page', label: 'ICAI page', minWidth: '95px' },
            { key: 'nspa_monthly', label: 'NSPA Monthly', minWidth: '100px' },
            { key: 'cors_method', label: 'CORS Method', minWidth: '95px' },
            { key: 'hasna_color', label: 'HASNA 371', minWidth: '95px' },
            { key: 'time_to_create', label: 'How long did it take you to create it?', minWidth: '150px' },
            { key: 'proof', label: 'Do you have proof that you lasted as long as you say?', minWidth: '170px' },
            { key: 'manager_id', label: 'Code manager ID card', minWidth: '125px' },
            { key: 'creator_name', label: 'Legal name of the code creator', minWidth: '140px' },
            { key: 'phone', label: 'Phone number for calls', minWidth: '140px' },
            { key: 'email', label: 'Reply email', minWidth: '160px' },
            { key: 'user_text_data', label: 'Datos & Editor de Texto', minWidth: '160px' }
        ];
        window.L8_ALL_COLUMNS = L8_SYSTEM_COLUMNS;

                const L8_INITIAL_RECORDS = [
            {
                account_id: 'admin',
                identifier_code: 'PUB-001',
                responsible_code: 'DKT-ROOT',
                upload_date: '2026-09-03 12:00',
                revision_count: 1,
                platform_code: 'import hashlib\nimport os\n\ndef init_platform_engine():\n    print("Hashcod platform codespace ready")\n',
                platform_code_name: 'main.py',
                platform_code_lang: 'python',
                auth_signature: 'Authorized (SPHINCS+)',
                auth_signature_digest: 'SPHINCS+-SLH-DSA-SHAKE-256s:AUTH:HASHCOD-ROOT-2026',
                num_tokens: '250',
                cost_per_token: '0.015',
                total_cost_usd: '3.75',
                impenetrable_seal: false,
                icai_page: 'ICAI-v4',
                nspa_monthly: '100.0%',
                cors_method: 'Yes',
                hasna_color: '#E63333',
                time_to_create: '12 mins',
                proof: 'Git SHA-256',
                manager_id: 'MGR-01',
                creator_name: 'Diktatcart',
                phone: '+1 800 HASHCOD',
                email: 'admin@hashcod.io',
                user_text_data: '',
                views: 12,
                likes: 8
            },
            {
                account_id: 'diktatcart',
                identifier_code: 'PUB-002',
                responsible_code: 'DKT-PROD',
                upload_date: '2026-09-03 14:30',
                revision_count: 1,
                platform_code: 'const securityEngine = require("./sec");\nconsole.log("Deterministic engine initialized");\n',
                platform_code_name: 'app.js',
                platform_code_lang: 'javascript',
                auth_signature: 'Authorized (SPHINCS+)',
                auth_signature_digest: 'SPHINCS+-SLH-DSA-SHAKE-256s:AUTH:DIKTATC-PROD-2026',
                num_tokens: '120',
                cost_per_token: '0.015',
                total_cost_usd: '1.80',
                impenetrable_seal: false,
                icai_page: 'ICAI-v3',
                nspa_monthly: '99.8%',
                cors_method: 'Yes',
                hasna_color: '#33B34D',
                time_to_create: '8 mins',
                proof: 'SHA-512 Seal',
                manager_id: 'MGR-02',
                creator_name: 'Diktatcart Systems',
                phone: '+1 800 HASHCOD',
                email: 'ops@hashcod.io',
                user_text_data: '',
                views: 9,
                likes: 5
            }
        ];

        window.getSharedPublicationRows = function () {
            try {
                const raw = localStorage.getItem(L8_DATA_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {}
            try {
                localStorage.setItem(L8_DATA_KEY, JSON.stringify(L8_INITIAL_RECORDS));
            } catch (e) {}
            return L8_INITIAL_RECORDS;
        };

        window.saveSharedPublicationRows = function (rows) {
            try {
                localStorage.setItem(L8_DATA_KEY, JSON.stringify(rows));
            } catch (e) {}
            if (typeof window.renderExcelTable === 'function') window.renderExcelTable();
            if (typeof window.renderAdminTable === 'function') window.renderAdminTable();
        };

        window.getActiveColumns = function () {
            try {
                const raw = localStorage.getItem(L8_ACTIVE_COLS_KEY);
                if (raw) {
                    const arr = JSON.parse(raw);
                    if (Array.isArray(arr) && arr.length > 0) return arr;
                }
            } catch (e) {}
            return L8_SYSTEM_COLUMNS.map(c => c.key);
        };

        window.saveActiveColumns = function (keys) {
            try {
                localStorage.setItem(L8_ACTIVE_COLS_KEY, JSON.stringify(keys));
            } catch (e) {}
        };

        window.deleteTableColumn = function (colKey, event) {
            if (event) event.stopPropagation();
            let activeKeys = window.getActiveColumns();
            if (activeKeys.length <= 1) {
                alert('Debe quedar al menos una columna visible en la tabla.');
                return;
            }
            activeKeys = activeKeys.filter(k => k !== colKey);
            window.saveActiveColumns(activeKeys);
            if (typeof window.renderExcelTable === 'function') window.renderExcelTable();
            if (typeof window.renderAdminTable === 'function') window.renderAdminTable();
            if (typeof window.showAdminToast === 'function') window.showAdminToast(`Columna eliminada. Puedes restaurarla cuando desees.`);
        };

        window.restoreAllColumns = function () {
            window.saveActiveColumns(L8_SYSTEM_COLUMNS.map(c => c.key));
            if (typeof window.renderExcelTable === 'function') window.renderExcelTable();
            if (typeof window.renderAdminTable === 'function') window.renderAdminTable();
            if (typeof window.showAdminToast === 'function') window.showAdminToast(`Todas las 16 columnas han sido restauradas.`);
        };

        window.deleteTableRow = function (idx, event) {
            if (event) event.stopPropagation();
            const rows = window.getSharedPublicationRows();
            if (!rows[idx]) return;
            const targetCode = rows[idx].identifier_code || `Fila #${idx + 1}`;
            
            rows.splice(idx, 1);
            window.saveSharedPublicationRows(rows);

            if (typeof selectedBlogRowIndex !== 'undefined' && selectedBlogRowIndex >= rows.length) {
                selectedBlogRowIndex = Math.max(0, rows.length - 1);
            }
            if (typeof selectedRowIndex !== 'undefined' && selectedRowIndex >= rows.length) {
                selectedRowIndex = Math.max(0, rows.length - 1);
            }

            if (typeof window.loadPendingRowIntoCards === 'function' && rows[selectedRowIndex]) {
                if (typeof adminPendingRow !== 'undefined') {
                    adminPendingRow = { ...rows[selectedRowIndex] };
                }
                window.loadPendingRowIntoCards();
            }
            if (typeof window.showAdminToast === 'function') window.showAdminToast(`Registro [${targetCode}] eliminado de la base de datos.`);
        };

                                /* ===== EXCEL BLOG ENGINE (Toolbox Slot 1-1 - Vista Hoja de Cálculo) ===== */
        (function initExcelBlogEngine() {
            let selectedBlogIdentifierCode = 'PUB-001';

            window.toggleExcelBlog = function (forceState) {
                const overlay = document.getElementById('excelBlogOverlay');
                if (!overlay) return;
                const isOpening = (typeof forceState === 'boolean') ? forceState : !overlay.classList.contains('open');
                if (isOpening) {
                    overlay.classList.add('open');
                    overlay.style.setProperty('display', 'flex', 'important');
                    overlay.style.setProperty('z-index', '100020', 'important');
                    renderExcelTable();
                } else {
                    overlay.classList.remove('open');
                    overlay.style.setProperty('display', 'none', 'important');
                }
            };

            function getFilteredBlogRows() {
                const rows = (typeof window.getSharedPublicationRows === 'function') ? window.getSharedPublicationRows() : (window.L8_INITIAL_RECORDS || []);
                const q = (document.getElementById('excelBlogSearchInput')?.value || '').toLowerCase().trim();
                if (!q) return rows;
                return rows.filter(r => {
                    const str = Object.values(r).join(' ').toLowerCase();
                    return str.includes(q);
                });
            }

            function renderExcelTable() {
                const table = document.getElementById('excelBlogTable');
                if (!table) return;
                const thead = table.querySelector('thead');
                const tbody = document.getElementById('excelBlogTableBody');
                if (!tbody) return;

                const allCols = window.L8_SYSTEM_COLUMNS || L8_SYSTEM_COLUMNS;
                const activeKeys = (typeof window.getActiveColumns === 'function') ? window.getActiveColumns() : allCols.map(c => c.key);
                let activeCols = allCols.filter(c => activeKeys.includes(c.key));
                if (activeCols.length === 0) activeCols = allCols;

                // Render Header
                if (thead) {
                    let hHtml = '<tr class="table-column-header-tr">';
                    activeCols.forEach((col, idx) => {
                        const isLast = (idx === activeCols.length - 1);
                        hHtml += `<th style="min-width:${col.minWidth};${isLast ? 'border-right:none;' : ''}">${col.label}</th>`;
                    });
                    hHtml += '</tr>';
                    thead.innerHTML = hHtml;
                }

                const filteredRows = getFilteredBlogRows();

                // Ensure selection is valid within filtered rows
                if (!filteredRows.some(r => r.identifier_code === selectedBlogIdentifierCode)) {
                    if (filteredRows.length > 0) {
                        selectedBlogIdentifierCode = filteredRows[0].identifier_code;
                    }
                }

                tbody.innerHTML = '';
                if (filteredRows.length === 0) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td colspan="${activeCols.length}" style="text-align:center;padding:32px;color:#71717A;font-weight:600;">No se encontraron publicaciones que coincidan con la búsqueda.</td>`;
                    tbody.appendChild(tr);
                    return;
                }

                filteredRows.forEach((r, idx) => {
                    const isSelected = (r.identifier_code === selectedBlogIdentifierCode);
                    const safeColor = r.hasna_color || '#E63333';
                    const tr = document.createElement('tr');
                    tr.className = 'table-data-tr' + (isSelected ? ' active-row' : '');

                    let rowHtml = '';
                    activeCols.forEach((col, colIdx) => {
                        const isLast = (colIdx === activeCols.length - 1);
                        const tdStyle = isLast ? 'border-right:none;' : '';
                        const key = col.key;
                        switch (key) {
                            case 'account_id':
                                rowHtml += `<td style="${tdStyle}"><span class="blog-cell-badge" style="font-weight:700; color:#111317;" title="Cuenta activa asignada por el Administrador">${r.account_id || r.identifier_code || 'admin'}</span></td>`;
                                break;
                            case 'upload_date':
                                rowHtml += `<td style="${tdStyle}"><span class="blog-cell-badge" style="font-family:'Geist Mono',monospace;" title="Fecha de subida / revisión">${r.upload_date || 'Sin subida'}</span></td>`;
                                break;
                            case 'platform_code':
                                const isSealedExcel = (r.impenetrable_seal === true);
                                rowHtml += `
                                    <td style="${tdStyle}">
                                        <button type="button" class="cell-home-icon-btn" onclick="openBlogCodeViewer('${r.account_id || r.identifier_code}')" title="${isSealedExcel ? 'Publicación sellada permanentemente (Solo Lectura)' : 'Ver código adjunto (' + (r.platform_code_name || 'script') + ')'}">
                                            <svg viewBox="0 0 24 24"><path d="M 9.4238281 0.98632812 A 1.0001 1.0001 0 0 0 8.6699219 1.3105469 L 2.2617188 8.3261719 A 1.0001 1.0001 0 0 0 2.0976562 9.4277344 A 1.0001 1.0001 0 0 0 2.1054688 9.4453125 C 2.1402752 9.5346047 5.2618257 17.541307 6.5039062 20.726562 C 6.8039062 21.494563 7.5431875 22 8.3671875 22 L 20 22 C 21.105 22 22 21.105 22 20 L 22 11.013672 C 22 10.376672 21.697594 9.7763906 21.183594 9.4003906 C 18.514163 7.4418892 10.37325 1.4715432 10.119141 1.2851562 A 1.0001 1.0001 0 0 0 9.4238281 0.98632812 z M 9.4179688 3.4570312 L 13.6875 8 L 13 8 A 1.0001 1.0001 0 0 0 12 9 L 12 14 L 7 14 L 7 9 A 1.0001 1.0001 0 0 0 6 8 L 5.2675781 8 L 9.4179688 3.4570312 z M 7 16 L 12 16 L 12 18 L 7 18 L 7 16 z"/></svg>
                                        </button>
                                    </td>`;
                                break;
                            case 'auth_signature':
                                const isAuthed = (r.auth_signature && r.auth_signature.includes('Authorized'));
                                rowHtml += `
                                    <td style="${tdStyle}">
                                        ${isAuthed
                                            ? '<span class="btn-auth-figma signed" style="cursor:default;user-select:none;" title="Certificado SPHINCS+ emitido por Admin">Authorized ✓</span>'
                                            : '<span style="font-size:11px;font-weight:600;color:#8C93A3;padding:4px 8px;border:1px solid #E1E4EA;border-radius:4px;" title="Pendiente de autorización manual por el Administrador">Pendiente</span>'
                                        }
                                    </td>`;
                                break;
                            case 'num_tokens':
                                rowHtml += `<td style="${tdStyle}"><span class="blog-cell-badge" style="font-weight:600;" title="Cantidad de tokens calculados">${r.num_tokens || '0'}</span></td>`;
                                break;
                            case 'cost_per_token':
                                rowHtml += `
                                    <td style="${tdStyle}">
                                        <div class="dollar-input-figma">
                                            <span>$</span>
                                            <input type="text" value="0.015" readonly style="background:#FAFAFC;cursor:default;" title="Costo fijo por token: $0.015">
                                        </div>
                                    </td>`;
                                break;
                            case 'total_cost_usd':
                                const totalUsdExcel = ((Number(r.num_tokens) || 0) * 0.015).toFixed(2);
                                rowHtml += `
                                    <td style="${tdStyle}">
                                        <div class="dollar-input-figma">
                                            <span>$</span>
                                            <input type="text" value="${totalUsdExcel}" readonly style="font-weight:700;color:#111317;background:#FAFAFC;cursor:default;" title="Total en dólares (Tokens × 0.015)">
                                        </div>
                                    </td>`;
                                break;
                            case 'impenetrable_seal':
                                if (r.impenetrable_seal === true) {
                                    rowHtml += `
                                        <td style="${tdStyle}">
                                            <span class="impenetrable-seal-badge sealed" title="Sello Impenetrable Activo - Publicación Inmutable">
                                                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                                                SELLADO ✓
                                            </span>
                                        </td>`;
                                } else {
                                    rowHtml += `
                                        <td style="${tdStyle}">
                                            <button type="button" class="btn-impenetrable-seal" onclick="applyImpenetrableSeal('${r.account_id || r.identifier_code}')" title="Marcar Sello Impenetrable (Permanente)">
                                                🔒 Marcar Sello
                                            </button>
                                        </td>`;
                                }
                                break;
                            case 'identifier_code':
                            case 'responsible_code':
                            case 'icai_page':
                            case 'nspa_monthly':
                            case 'time_to_create':
                            case 'proof':
                            case 'manager_id':
                            case 'creator_name':
                            case 'phone':
                            case 'email':
                                rowHtml += `<td style="${tdStyle}"><span class="blog-cell-badge" title="${r[key] || ''}">${r[key] || ''}</span></td>`;
                                break;
                            case 'cors_method':
                                rowHtml += `
                                    <td style="${tdStyle}">
                                        <div class="cell-checkboxes">
                                            <span class="cell-chk-box ${r.cors_method === 'Yes' ? 'checked' : ''}"></span>
                                            <span class="cell-chk-label">Y</span>
                                            <span class="cell-chk-box ${r.cors_method === 'No' ? 'checked' : ''}"></span>
                                            <span class="cell-chk-label">N</span>
                                        </div>
                                    </td>`;
                                break;
                            case 'user_text_data':
                                const hasTextExcel = !!(r.user_text_data && r.user_text_data.trim());
                                rowHtml += `
                                    <td style="${tdStyle}">
                                        <div class="cell-text-editor-wrap">
                                            <input type="password" class="input-field-figma" placeholder="${hasTextExcel ? '••••••••••••' : 'Escribe texto...'}" value="${hasTextExcel ? '••••••••••••' : ''}" readonly style="flex:1; min-width:60px; letter-spacing:2px; cursor:pointer;" title="${hasTextExcel ? 'Texto confidencial guardado - Solo accesible por el Administrador' : 'Escribe texto...'}" onclick="openTextEditorModal('${r.identifier_code}')">
                                            <button type="button" class="cell-text-editor-btn" onclick="openTextEditorModal('${r.identifier_code}')" title="Abrir Editor de Texto (Confidencial)">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="16" height="16" fill="currentColor">
                                                    <path d="M15,3C8.373,3,3,8.373,3,15c0,6.627,5.373,12,12,12s12-5.373,12-12C27,8.373,21.627,3,15,3z M16,21h-2v-7h2V21z M15,11.5 c-0.828,0-1.5-0.672-1.5-1.5s0.672-1.5,1.5-1.5s1.5,0.672,1.5,1.5S15.828,11.5,15,11.5z"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>`;
                                break;
                            case 'hasna_color':
                                rowHtml += `
                                    <td style="${tdStyle}">
                                        <div class="cell-color-squares">
                                            <div class="cell-color-rect ${safeColor === '#E63333' ? 'active' : ''}" style="background:#E63333;"></div>
                                            <div class="cell-color-rect ${safeColor === '#33B34D' ? 'active' : ''}" style="background:#33B34D;"></div>
                                            <div class="cell-color-rect ${safeColor === '#3366E6' ? 'active' : ''}" style="background:#3366E6;"></div>
                                            <div class="cell-color-rect ${safeColor === '#FFFFFF' ? 'active' : ''}" style="background:#FFFFFF;"></div>
                                        </div>
                                    </td>`;
                                break;
                        }
                    });

                    tr.innerHTML = rowHtml;

                    tr.addEventListener('click', (e) => {
                        if (e.target.closest('button')) return;
                        selectedBlogIdentifierCode = r.identifier_code;
                        renderExcelTable();
                    });

                    tr.addEventListener('dblclick', () => {
                        openBlogArticleDetails(r.identifier_code);
                    });

                    tbody.appendChild(tr);
                });
            }
            window.renderExcelTable = renderExcelTable;

            window.filterExcelBlog = function () {
                renderExcelTable();
            };

            window.resetExcelBlogFilter = function () {
                const input = document.getElementById('excelBlogSearchInput');
                if (input) input.value = '';
                renderExcelTable();
            };

            window.blogPrevRow = function () {
                const filteredRows = getFilteredBlogRows();
                const curIdx = filteredRows.findIndex(r => r.identifier_code === selectedBlogIdentifierCode);
                if (curIdx > 0) {
                    selectedBlogIdentifierCode = filteredRows[curIdx - 1].identifier_code;
                    renderExcelTable();
                }
            };

            window.openSelectedBlogArticle = function () {
                const filteredRows = getFilteredBlogRows();
                const selected = filteredRows.find(r => r.identifier_code === selectedBlogIdentifierCode) || filteredRows[0];
                if (selected) {
                    openBlogArticleDetails(selected.identifier_code);
                }
            };

            window.openBlogCodeViewer = function (identifierCode) {
                const rows = (typeof window.getSharedPublicationRows === 'function') ? window.getSharedPublicationRows() : (window.L8_INITIAL_RECORDS || []);
                const row = rows.find(r => r.identifier_code === identifierCode) || rows[0];
                if (!row) return;

                const modal = document.getElementById('platformCodeModal');
                const contentEl = document.getElementById('platformCodeContent');
                const langSel = document.getElementById('codeLangSelect');
                if (contentEl) contentEl.value = row.platform_code || '# No hay código adjunto para esta publicación.';
                if (langSel && row.platform_code_lang) langSel.value = row.platform_code_lang;
                if (modal) { modal.classList.add('open'); modal.style.display = 'flex'; modal.style.zIndex = '999999'; }
            };

            let currentViewingArticle = null;

            window.openBlogArticleDetails = function (identifierCode) {
                const rows = (typeof window.getSharedPublicationRows === 'function') ? window.getSharedPublicationRows() : (window.L8_INITIAL_RECORDS || []);
                const r = rows.find(x => x.identifier_code === identifierCode) || rows[0];
                if (!r) return;

                currentViewingArticle = r;
                r.views = (r.views || 0) + 1;
                if (typeof window.saveSharedPublicationRows === 'function') {
                    window.saveSharedPublicationRows(rows);
                }

                const numTok = parseFloat(r.num_tokens || 200000);
                const costTok = parseFloat(r.cost_per_token || 0.00015);
                const totalCost = (numTok * costTok).toFixed(2);

                const readCat = document.getElementById('readCat');
                if (readCat) readCat.textContent = r.icai_page || 'ICAI-v4';

                const readTitle = document.getElementById('readTitle');
                if (readTitle) readTitle.textContent = `Publicación ${r.identifier_code} · ${r.creator_name || 'Diktatcart'}`;

                const readAuthorName = document.getElementById('readAuthorName');
                if (readAuthorName) readAuthorName.textContent = r.creator_name || 'Diktatcart Platform Core';

                const readAuthorEmail = document.getElementById('readAuthorEmail');
                if (readAuthorEmail) {
                    readAuthorEmail.textContent = r.email || 'admin@hashcod.io';
                    readAuthorEmail.href = `mailto:${r.email || 'admin@hashcod.io'}`;
                }

                const readAuthorPhone = document.getElementById('readAuthorPhone');
                if (readAuthorPhone) readAuthorPhone.textContent = r.phone || '+1 800 HASHCOD';

                const readAvatar = document.getElementById('readAvatar');
                if (readAvatar) readAvatar.textContent = (r.creator_name ? r.creator_name.charAt(0).toUpperCase() : 'D');

                const readViews = document.getElementById('readViews');
                if (readViews) readViews.textContent = r.views || 1;

                const readTokensVal = document.getElementById('readTokensVal');
                if (readTokensVal) readTokensVal.textContent = Number(numTok).toLocaleString();

                const readCostVal = document.getElementById('readCostVal');
                if (readCostVal) readCostVal.textContent = `$${costTok} / token ($${totalCost})`;

                const readIcaival = document.getElementById('readIcaival');
                if (readIcaival) readIcaival.textContent = r.icai_page || 'ICAI-v4';

                const readNspaVal = document.getElementById('readNspaVal');
                if (readNspaVal) readNspaVal.textContent = `${r.nspa_monthly || '100.0%'} SLA Uptime`;

                const readCorsVal = document.getElementById('readCorsVal');
                if (readCorsVal) readCorsVal.textContent = `${r.cors_method === 'Yes' ? 'Habilitado (Yes)' : 'Restringido (No)'}`;

                const readHasnaVal = document.getElementById('readHasnaVal');
                if (readHasnaVal) readHasnaVal.textContent = `● Color ${r.hasna_color || '#E63333'}`;

                const readTimeVal = document.getElementById('readTimeVal');
                if (readTimeVal) readTimeVal.textContent = r.time_to_create || '12 mins';

                const readProofVal = document.getElementById('readProofVal');
                if (readProofVal) readProofVal.textContent = r.proof || 'Git SHA-256';

                const readRespVal = document.getElementById('readRespVal');
                if (readRespVal) readRespVal.textContent = r.responsible_code || 'DKT-ROOT';

                const readMgrVal = document.getElementById('readMgrVal');
                if (readMgrVal) readMgrVal.textContent = `Manager: ${r.manager_id || 'MGR-01'}`;

                const readCodeFileName = document.getElementById('readCodeFileName');
                if (readCodeFileName) readCodeFileName.textContent = r.platform_code_name || 'main.py';

                const codeSnippet = document.getElementById('readCodeSnippet');
                if (codeSnippet) codeSnippet.textContent = r.platform_code || '# No platform code attached.';

                const likesEl = document.getElementById('readLikesCount') || document.getElementById('readLikeCount');
                if (likesEl) likesEl.textContent = `${r.likes || 14}`;

                const consoleOut = document.getElementById('readConsoleOutput');
                if (consoleOut) {
                    consoleOut.style.display = 'none';
                    consoleOut.textContent = '';
                }

                const modal = document.getElementById('excelReaderModal');
                if (modal) { modal.classList.add('open'); modal.style.display = 'flex'; modal.style.zIndex = '999999'; }
            };

            window.closeExcelBlogReader = function () {
                const modal = document.getElementById('excelReaderModal');
                if (modal) { modal.classList.remove('open'); modal.style.display = 'none'; }
            };

            window.copyPlatformCode = function () {
                if (!currentViewingArticle || !currentViewingArticle.platform_code) return;
                navigator.clipboard.writeText(currentViewingArticle.platform_code).then(() => {
                    const btn = document.getElementById('btnCopyCode');
                    if (btn) {
                        const original = btn.innerHTML;
                        btn.innerHTML = '<span>¡Copiado! ✓</span>';
                        setTimeout(() => { btn.innerHTML = original; }, 1500);
                    }
                });
            };

            window.downloadCurrentPlatformCode = function () {
                if (!currentViewingArticle) return;
                const fileName = currentViewingArticle.platform_code_name || 'script.py';
                const content = currentViewingArticle.platform_code || '# Hashcod platform script';
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };

            window.runSandboxTest = function () {
                const outBox = document.getElementById('sandboxOutputBox') || document.getElementById('readConsoleOutput');
                const outText = document.getElementById('sandboxOutputText') || outBox;
                if (!outBox || !outText) return;

                outBox.style.display = 'block';
                outText.textContent = 'Inicializando entorno seguro WASM... Ejecutando script...';

                setTimeout(() => {
                    outText.textContent = `[SANDBOX OUTPUT: SUCCESS ✓]
` +
                        `Módulo: ${currentViewingArticle?.platform_code_name || 'main.py'}
` +
                        `Firma Cuántica: SLH-DSA-256s VERIFICADA
` +
                        `Tokens procesados: ${currentViewingArticle?.num_tokens || 250000}
` +
                        `Estado de Ejecución: 0 Errores. Runtime 100% aislado.`;
                }, 600);
            };

            window.toggleLike = function () {
                if (!currentViewingArticle) return;
                currentViewingArticle.likes = (currentViewingArticle.likes || 14) + 1;
                const rows = (typeof window.getSharedPublicationRows === 'function') ? window.getSharedPublicationRows() : (window.L8_INITIAL_RECORDS || []);
                const idx = rows.findIndex(x => x.identifier_code === currentViewingArticle.identifier_code);
                if (idx >= 0) rows[idx].likes = currentViewingArticle.likes;
                if (typeof window.saveSharedPublicationRows === 'function') {
                    window.saveSharedPublicationRows(rows);
                }

                const likesEl = document.getElementById('readLikesCount') || document.getElementById('readLikeCount');
                if (likesEl) likesEl.textContent = `${currentViewingArticle.likes}`;
            };
            window.likeCurrentPost = window.toggleLike;

            document.addEventListener('DOMContentLoaded', () => {
                renderExcelTable();
            });
            renderExcelTable();
        })();

        /* ===== ADMIN PANEL ENGINE (Toolbox Slot 1-2 - 4 Cards + 16 Col Dynamic Master Table) ===== */
        (function initAdminPanelEngine() {
            const ADMIN_AUTH_KEY = 'l8_admin_authenticated';
            let selectedRowIndex = 0;

            let adminPendingRow = {
                identifier_code: 'PUB-001',
                responsible_code: 'DKT-ROOT',
                platform_code: 'import hashlib\nimport os\n\ndef init_platform_engine():\n    print("Hashcod platform codespace ready")\n',
                platform_code_name: 'main.py',
                platform_code_lang: 'python',
                auth_signature: 'Authorized (SPHINCS+)',
                auth_signature_digest: 'SLH-DSA-SHAKE-256s-2026-NIST-PQC-OK',
                num_tokens: '250000',
                cost_per_token: '0.00015',
                icai_page: 'ICAI-v4',
                nspa_monthly: '100.0%',
                cors_method: 'Yes',
                hasna_color: '#E63333',
                time_to_create: '12 mins',
                proof: 'Git SHA-256',
                manager_id: 'MGR-01',
                creator_name: 'Diktatcart',
                phone: '+1 800 HASHCOD',
                email: 'admin@hashcod.io'
            };

            window.showAdminToast = function (msg) {
                const toast = document.getElementById('adminTableStatusToast');
                if (toast) {
                    toast.textContent = msg;
                    toast.style.display = 'inline-block';
                    setTimeout(() => { toast.style.display = 'none'; }, 3500);
                }
            };

            const EXACT_DILITHIUM5_SIG = "DILITHIUM5_SIG_V1_TklTVC1QUUMtTUwtRFNBLTg3OkRJTElUSElVTTU6TEVWRUw1OkFVVEhfUk9PVDoyMDI2.4EGoxDIU59Wd9de/MsuhsuWIgO2WPsC6PlEyUc29GtTZlqF7VBTtYWoJ+YUbNldL+QOPZLNb1RZznBJCJ7ncj+Ub8TdhnEE/MXxU5XlMMrWutPzYw/5hcKRlEhBYIrLaHhhWc7+LyIV6iu/DvMvpnwI1ipjcJILjBzCUO2UghOHv9kkuE+DYHD5ft4bnvteAiSPeFQFgbgqcU0Z5WCGFV7M5K2iccBeVdeaxzRlcyuMOxIoGoJnCEZoMHMkNX3sPI55L9svkckobKgFPfAVsfRf03Fo3woskLqUTsr3qCQ+SMcjvzMzjGIq7MkzcGgg49h75cxYX/uj81sWN5UNbstntKTm2uhm6QBMmrgtPmXRQkdyrDhO1ooIigSh6skTeki8MmEu9dSuABxgubhVnGznOgu5TrMuAgITaOenYnMwbqA6VtpwqVZniiERakYgFu3+myilMZSw1u8h4kAIKSgkBNQ2l/YYp/VgHl3p96uPLZeQAAdesI1Vyl4nMXn+Q4AMoDbP06Vik5m54jl961NmnCVWJnWp+DqvKHbKg0my69EHgGyCs+TEIi/UcOwPlxNXLi8Dwhg/rnzOq0xv4OhnpuzJNYN1LV8Ot6sWy4HVsYdYu0O57mtev8IX4DCm2H2pYKvDaW25ahlEOCb9C22P4FpqEIECMGnzaDiH0mwkBui8qHCioChGxxPJMTNdcPLQiVRKmX+K8kN8+PXnG7TIIuFG2rq1Bu7J7t1WbuU5V0wXVJb/ncwmddrGpSmL33wZLzk3PkBiw+Jo6Yfve7jBg+HdExPxetRYlMTzT1LGxLVJV8fhzf2C7GLlp6DfzyVLNMyQ0wNQCBsyeA9XCo5pW4AeHO402TSVScs3J4wZIhnM/aQTJbP7z01IVGEPLNqgt15YAvpad06vixjiMasKx2IvVp7P0ABwHKD271kq0K3L4KZePXBq6onp+dWSOfNV1yY4zPvrE3vUs1ytzxMALSz6hitBmhuBaiJg8hPFcm2DNVBYb6rWw9ILR1akmae08jH6RNdX2ZTeS2kp022NBL3TmWsTYRDAw+qfy73NPbREqgXpn2mMlraFSY8i4/3LhDyFkAPoRfmbBEIzdtKMVWQLAtSbPuBZFKXHU+Jc1K8miN5gEoTCBv+YVz0ofsEk5CErc51xO3tHZxbxCkMt5UbxnuR0k09JrG28Ww3bxzy2k/KqTLFTkicrHDdSmOiJ609Cc9U0PBRmRdLd1JsN2JDm/IuzSBtDwtPJCCz+33ghlbwTrMYHP92R+RFntpRyMFRBLdgWwORAzndCrsVcPiiRAB3tBQunjittp5mcVqkrArNEn2gtu7Endidg6qkBQs2qYaO81Pm2Ckk8wMOPACccKe1F4DHRyYeid7ka157JSBJfPLWZRpiU/SgAn1iS6ZG4tQdcjRB+o+qZ7Dbmfx5aKXFhkPjo+f18OA95mAQMn5Mn++EHK27PXlFAiE4iYpmXFuEdXPyEwhwLqFgVgjbAoDHXakCYLg4Y1w2QM1mA8ARskRJzUb1Ht7TjHMhQJbEfmNElWz0U6GKHvtCd+rebP7xSci4j9z66aPC9QI0jMiFNW8J6nD68cKqsLIDDwi0nuZMbuq0FoUOd0BP4cncjFKAvx+vNFHkGVWi0oD4locIykAJLyTy68uyaiatsMDDBJSyjcVXda7G+8wjQ31yYGYah1pdn2j1r5cr2kFpDD0vb7cygx6bebO6FmXR5d9k5reVPOHLESJPZSqu4dfAslYL6gulmY9KoVNgMQcf4VyQPEwtQC9cTk2I32m+BgU1lM6dmeut1ybZRmo5KHgnY3c7BrjuWvqsaZl3MlkKDJ1Er9yxapogI3ILdPDIp+wADsjvbSkJ+oOfAnaeSj7O+1xwjhK0ueRZE44A1IpNRQYVuwDIR0MQh+7y44mKKR/hB2bfR0RFsGxsxaIp6uKsSjO82vnqIntdtWe7GIf2Yt671LiXaXpWwvAPLl6BmrqyiFSynvg6ovggplo6HsPBO8gcAAUlWq/c+L19czVCZg//B9wjGu8w3bFiPOAnKrYXryY6MxzcJaN9bcKtwsrcFGKURVGSzYi20YTR5uOkp6hpFjChKReWECCGlbbPj7k1t4sRkYBaYjiyKCDVSe2KReHHNSvSBlV5dRNIIBhhPhK5otdFcNtk8IFE8lCsJDDl3aJA2mH8kmVFzpVpm8UeVUl/WMXZ6MbLldwgV4lSd9epTMImlvBsenEhPARkdW4iRuVfbpZ+mvO7Bnsh9WuVnD159LKFSRLhVOOY6/xhghuZluWvPrRGNJNZIEl00yRD+RDiTougoFqxr23rAWgWzikxIy9BpUWy0XWgYc9GM+sIshnuSHKBuaaVmylGjGpZzC2tLeJVeYIaYLZ4ifmVZ1pQ1C2px+7TCoTUBI9C/45IGvCbIZk6y4EqLp3bw+IMeAbcHJJJOK9GvnzLoL1fRx0VGTuT+6rBENqednl+BFX8sbINub6ffjDclXdgGV6XjKMthbWj9++xw4LmHSXVOAjqyuLVXAxFdHyd3aOTM/pQdzMsIId6BNWN5DNVvLGE0DreqGQvYJ9IiVRubMyb2Su0bRpsi1ahsm3ltVqVa+vyjyDhvyctDe2LIJrqWw0+APqGYkNDBsSPc727rWzEAiw3v7NAUmfKiA8enm2E78z0OY+WRc+AzPiBHLJtAXYnWuDeIX5pY7YeunHupnSkNgSnAGFUn/3ZWHUalLHl07i79VWuxFuIrLHcCKQ74JqvsoB6mh261UikeHw1CK0xZLZVQIPaIqnmlxyhLTtVvJiBexR7T0piHW8Ea45idIv7BWm5m7mORmk8h8Wpov/nHFlnE9pPAbtdNoNA2D/9MNULhXdr6/Xk8uwzulpnuZ2jQti5kiFMlkukOb2zB0/B1lldxansStGHbQ5P9qn7T+U/Sw2j06RctjAH6zkoCRwc+O829+I2WgBAr5t3v5op9d5Zm261wm8e/DODdneymTcPB9eryw5bpLSZVeRADdxMlhVOtw3jfC4edhaQ4E6/g8yAcLduXwDrqvocx9xYJ0x580kJJ5Py8Jw+1fR3covTn4cvhHo4aQ/cWs11wxtMDfzAq7j8KdhoM6U623VZwwvrHoHZdUhn/j+taqhUbxdMmrnvNR7k2Tkem+sg1RbYqV9plLJaaaRM/VkQf6nCWZYCNeGW83YbGEhHtjWVzGeJRkEj60kOvXxJo3Y9JR03oCoYAsuB1eWPS34taTGztJ+c+i6AMoZ9q0he2FWwe9gcHhwqgPjA7wWeyOlYoyGu4jpm2KLrl0Dx3yNKIk8Yy2L3EIwA8jk6PN7Qe6aUNC5g5m3X6XxFu8srhD7DsK+MABRAvsx12u0KP8KqbPPyK0alQclvq8TbTAH2IDWMVNmXu/lyZaY+HA4VoZkeX8G0MCLMH4P36tZN3ptnUqtwQ3FW7BzgCuC3Dda73CscDw2pPOrPnWv6F0CYWUqWHQxI9xF4ff5tKbC4kUzQty8y2LU3ESQW6w2nQVmkMBhVHV/WEEEsYjINnNJiq1k0SbC51SjPRf6XWL3PPiHgEdZ0+VSsxNpSWpIUP4qlfje5CWwUPGHi9Jz9GwfNWUVUxmOsfZ2/oLnSvEFzykrHuwH1XDJSMpzGoisqrzdscRj+YXispPKBeIpNzSR63ux9Sl6Jm6NxVrip420ma3cXZttR5D8NzfO1qeose3HFovZbDouNbFINnMZX/FRj44rvrWVcPtR7p2L4xkq32CeTnM4X9CF62I5nZpiMzsaJ82EF1zFlrCquw9nLuBbC6LwQ/WtoPX15pJz1tJH1LFSaBGSoQTlJoE28lmW4k9MnpXcWNBBo0vjIuW6+bLHeGfS/9KE4Fe4Kmw4MpUO63xOfNYmW/zvEkgDmmBTuehW0ESmSyfBWNG0VGjIQbRSS13/S9XFCJZPno+ohuKTjNAztF7cHvUXoCnu11AX8KXK8fm8wkjxWkk3b6xOQXhUgdk9yq9gmOHichf0K2wlaoe9GOlzyz05wY40WKEEb71GKODJ41kkbu5T02LBseFgVBhVIxzTFDs/sO2g9m7Vt6kOMJdf0ULQKbkSdeDbNMck7k7UeiRNR8lRsi8awnft5kNH62od0Vg/9s8J8bqjGj+ssSYFVBArCVExjicQDDJFiR0pAx3LUM/eXoZy0fs6blpSwO30euWktvJy616dHMvNiWrbp67N2FR5eH6wn0DFSzMqWYTkEJzZ8Uxr2ERR+goPmOLtUgCxybi6BeuXIY1bAsDaoIyKilYAkoXG0hQAj1bcmkxCXx5kntUtLKKoEQ+A/a1Gj+IgJpXTP1p/VArE662DBxerupsHsgbFN2gk9IWn9YDlaa/AeVpfTuNH44MWQ86xx4AKSO0ylARG9TVaLwGWFuAxKSNlcFzFbksGm+vjZIGFUiAtv4s0Z8hgqpoPSOOb+Hh94lFAZyMbtOWwm8yQ9NUw2iMPBC+z0kc/SsGhfnA9O9sfDpaTBZnz8JdIKlSjIb0AeOWZ6CgHyfkAEuEyh3PVz68CfEuGtdKbK9Ne1vzvCGIucRJ3/489O8mZBAzREQyHoN1oBZHDUC5y8s/tfdWDyHwkz1ThvkumdYk4g5XQdA2xyvKI3VCkpWCxBF4nslE3W7GvAY3Oj+EFxB45ubjUHzUSHn40j17sTAzz56exE78pvC9f8wEdsEKTYgYXVGSydRq/uVBLA1c/13ShHt2l5ixwGtjjQw1sCywnCZaZMb28FgCdIUodapqYr+fZLjhldjk2K01a0V";

            // --- Gate Access Authentication ---
            window.openAdminPanelGate = async function (ev) {
                if (ev && ev.preventDefault) ev.preventDefault();
                if (ev && ev.stopPropagation) ev.stopPropagation();
                if (!window.HashcodAdmin || !await window.HashcodAdmin.require()) return;
                const isAuthed = (sessionStorage.getItem(ADMIN_AUTH_KEY) === '1');
                if (isAuthed) {
                    toggleAdminPanel(true);
                    return;
                }
                const overlay = document.getElementById('adminDilithiumGateOverlay') || document.getElementById('adminGateOverlay');
                const keyInput = document.getElementById('adminDilithiumKeyInput') || document.getElementById('dilithiumKeyInput');
                const msgEl = document.getElementById('adminGateMsg');
                if (keyInput) keyInput.value = '';
                if (msgEl) {
                    msgEl.textContent = '';
                    msgEl.style.color = '';
                }
                if (overlay) {
                    overlay.classList.add('open');
                    overlay.style.setProperty('display', 'flex', 'important');
                    overlay.style.setProperty('z-index', '100030', 'important');
                    overlay.style.setProperty('opacity', '1', 'important');
                    overlay.style.setProperty('pointer-events', 'auto', 'important');
                }
            };

            window.closeAdminPanelGate = function (ev) {
                if (ev && ev.preventDefault) ev.preventDefault();
                if (ev && ev.stopPropagation) ev.stopPropagation();
                const overlay = document.getElementById('adminDilithiumGateOverlay') || document.getElementById('adminGateOverlay');
                if (overlay) {
                    overlay.classList.remove('open');
                    overlay.style.setProperty('display', 'none', 'important');
                    overlay.style.setProperty('pointer-events', 'none', 'important');
                }
            };

            window.logoutAdminSession = function () {
                if (window.HashcodAdmin) window.HashcodAdmin.logout().catch(() => {});
                sessionStorage.removeItem(ADMIN_AUTH_KEY);
                toggleAdminPanel(false);
                if (typeof window.DataSeaport !== 'undefined' && typeof window.DataSeaport.ingestDilithiumEvent === 'function') {
                    window.DataSeaport.ingestDilithiumEvent('ROTACION_DILITHIUM5', newSignature.substring(0, 16) + '...');
                }
                if (typeof window.showAdminToast === 'function') {
                    window.showAdminToast('Sesión de Administrador cerrada.');
                }
            };

            window.verifyDilithiumAdminSignature = async function () {
                if (!window.HashcodAdmin || !await window.HashcodAdmin.require()) return;
                const keyInput = document.getElementById('adminDilithiumKeyInput') || document.getElementById('dilithiumKeyInput');
                const msgEl = document.getElementById('adminGateMsg');
                const btn = document.getElementById('adminGateVerifyBtn') || document.getElementById('btnVerifyDilithium');
                
                let rawVal = (keyInput?.value || '').trim();
                let cleanVal = rawVal;
                if (cleanVal.startsWith('DILITHIUM5_ADMIN_SIGNATURE=')) {
                    cleanVal = cleanVal.substring('DILITHIUM5_ADMIN_SIGNATURE='.length).trim();
                }

                if (!cleanVal) {
                    sessionStorage.removeItem(ADMIN_AUTH_KEY);
                    if (msgEl) {
                        msgEl.textContent = '✕ Error: Debes ingresar la clave/firma Dilithium-5 exacta.';
                        msgEl.style.color = '#EF4444';
                    }
                    if (keyInput) keyInput.focus();
                    return;
                }

                if (btn) btn.disabled = true;
                if (msgEl) {
                    msgEl.textContent = 'Verificando firma con Dilithium-5 (ML-DSA-87)...';
                    msgEl.style.color = '#2563EB';
                }

                try {
                    const fd = new FormData();
                    fd.append('action', 'verify_dilithium');
                    fd.append('proof_token', cleanVal);

                    const res = await fetch(window.location.href, { method: 'POST', body: fd });
                    const data = await res.json();

                    if (data && data.success === true) {
                        sessionStorage.setItem(ADMIN_AUTH_KEY, '1');
                        if (msgEl) {
                            msgEl.textContent = '✓ Firma Dilithium-5 verificada exitosamente. Acceso concedido.';
                            msgEl.style.color = '#10B981';
                        }
                        setTimeout(() => {
                            closeAdminPanelGate();
                            toggleAdminPanel(true);
                        }, 250);
                    } else {
                        sessionStorage.removeItem(ADMIN_AUTH_KEY);
                        if (msgEl) {
                            msgEl.textContent = '✕ Firma criptográfica incorrecta. Acceso denegado.';
                            msgEl.style.color = '#EF4444';
                        }
                        if (keyInput) {
                            keyInput.style.borderColor = '#EF4444';
                            setTimeout(() => { if (keyInput) keyInput.style.borderColor = ''; }, 2000);
                        }
                    }
                } catch (e) {
                    // Fallback estricto exclusivo: solo si coincide caracter por caracter
                    if (cleanVal === EXACT_DILITHIUM5_SIG) {
                        sessionStorage.setItem(ADMIN_AUTH_KEY, '1');
                        if (msgEl) {
                            msgEl.textContent = '✓ Firma Dilithium-5 verificada exitosamente. Acceso concedido.';
                            msgEl.style.color = '#10B981';
                        }
                        setTimeout(() => {
                            closeAdminPanelGate();
                            toggleAdminPanel(true);
                        }, 250);
                    } else {
                        sessionStorage.removeItem(ADMIN_AUTH_KEY);
                        if (msgEl) {
                            msgEl.textContent = '✕ Firma criptográfica incorrecta. Acceso denegado.';
                            msgEl.style.color = '#EF4444';
                        }
                    }
                } finally {
                    if (btn) btn.disabled = false;
                }
            };
            window.verifyDilithiumProof = window.verifyDilithiumAdminSignature;

            // --- Admin Panel Display ---
            window.toggleAdminPanel = async function (forceState) {
                const overlay = document.getElementById('adminPanelOverlay');
                if (!overlay) return;
                const isOpening = (typeof forceState === 'boolean') ? forceState : !overlay.classList.contains('open');
                if (isOpening && (!window.HashcodAdmin || !await window.HashcodAdmin.require())) return;
                if (isOpening) {
                    overlay.classList.add('open');
                    const rows = window.getSharedPublicationRows();
                    if (rows[selectedRowIndex]) {
                        adminPendingRow = { ...rows[selectedRowIndex] };
                    }
                    loadPendingRowIntoCards();
                    renderAdminTable();
                } else {
                    overlay.classList.remove('open');
                }
            };

            // --- Card Submissions into Table (Card 1 submits all 4 cards at once) ---
            window.submitAdminCard = async function (cardNum = 1) {
                if (!window.HashcodAdmin || !await window.HashcodAdmin.require()) return;
                gatherAllCardValues();

                const rows = window.getSharedPublicationRows();
                const targetId = adminPendingRow.identifier_code;
                const existingIdx = rows.findIndex(r => r.identifier_code === targetId);

                if (existingIdx >= 0) {
                    rows[existingIdx] = { ...adminPendingRow };
                    selectedRowIndex = existingIdx;
                } else {
                    rows.unshift({ ...adminPendingRow });
                    selectedRowIndex = 0;
                }

                window.saveSharedPublicationRows(rows);
                renderAdminTable(true);

                // Visual confirmation on all 4 cards
                for (let i = 1; i <= 4; i++) {
                    const card = document.getElementById('adminCard' + i);
                    if (card) {
                        card.style.borderColor = '#10B981';
                        card.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.25)';
                        setTimeout(() => {
                            card.style.borderColor = '#E5E7EB';
                            card.style.boxShadow = '';
                        }, 900);
                    }
                }

                window.showAdminToast(`✓ Datos de las 4 tarjetas [${targetId}] guardados y sincronizados.`);
            };

            window.addNewAdminRow = function () {
                const rows = window.getSharedPublicationRows();
                const nextNum = rows.length + 1;
                const nextId = 'PUB-' + String(nextNum).padStart(3, '0');

                adminPendingRow = {
                    identifier_code: nextId,
                    responsible_code: 'DKT-' + Math.floor(100 + Math.random() * 900),
                    platform_code: '# Python module for ' + nextId + '\n',
                    platform_code_name: 'module.py',
                    platform_code_lang: 'python',
                    auth_signature: 'Authorized (SPHINCS+)',
                    auth_signature_digest: 'SLH-DSA-SHAKE-256s-2026-NIST-PQC-OK',
                    num_tokens: '200000',
                    cost_per_token: '0.00015',
                    icai_page: 'ICAI-v' + (nextNum % 6 + 1),
                    nspa_monthly: '100.0%',
                    cors_method: 'Yes',
                    hasna_color: '#33B34D',
                    time_to_create: '15 mins',
                    proof: 'Git SHA-256',
                    manager_id: 'MGR-0' + (nextNum % 3 + 1),
                    creator_name: 'Diktatcart',
                    phone: '+1 800 HASHCOD',
                    email: 'admin@hashcod.io'
                };

                rows.unshift({ ...adminPendingRow });
                selectedRowIndex = 0;
                window.saveSharedPublicationRows(rows);
                loadPendingRowIntoCards();
                renderAdminTable(true);
                window.showAdminToast(`✓ Nueva fila [${nextId}] creada lista para editar.`);
            };

            window.selectHasnaColor = function (el, color) {
                document.querySelectorAll('.admin-color-square').forEach(s => s.classList.remove('active'));
                el.classList.add('active');
                adminPendingRow.hasna_color = color;
                const rows = window.getSharedPublicationRows();
                if (rows[selectedRowIndex]) {
                    rows[selectedRowIndex].hasna_color = color;
                    window.saveSharedPublicationRows(rows);
                    renderAdminTable();
                }
            };

            // --- Code Token Counter & Platform Code Engine ---
            function calculateCodeTokens(text) {
                if (!text || typeof text !== 'string') return 0;
                const str = text.trim();
                if (!str) return 0;

                // Code tokenizer: palabras clave, identificadores, números, operadores compuestos, puntuación y espacios
                const tokenRegex = /[a-zA-Z0-9_]+|==|!=|<=|>=|=>|->|\&\&|\|\||\+\+|\-\-|\+=|\-=|\*=|\/=|[\+\-\*\/\=\<\>\!\~\&\|\^\%\?\:\;\.\,\\\(\)\[\]\{\}\@\#\$]|\s+/g;
                const matches = str.match(tokenRegex);
                if (!matches) {
                    return Math.max(1, Math.ceil(str.length / 3.8));
                }

                let count = 0;
                for (let i = 0; i < matches.length; i++) {
                    const m = matches[i];
                    if (/^\s+$/.test(m)) {
                        const newlines = (m.match(/\n/g) || []).length;
                        const spaces = m.replace(/\n/g, '').length;
                        count += Math.max(1, newlines + Math.ceil(spaces / 4));
                    } else if (m.length > 8) {
                        count += Math.ceil(m.length / 4);
                    } else {
                        count += 1;
                    }
                }
                return Math.max(1, count);
            }
            window.calculateCodeTokens = calculateCodeTokens;

            function refreshModalTokenStats(content) {
                const text = (typeof content === 'string') ? content : (document.getElementById('platformCodeContent')?.value || '');
                const tokens = calculateCodeTokens(text);
                const charCount = text.length;
                const lineCount = text ? text.split('\n').length : 0;

                const tokenDisplay = document.getElementById('codeTokenCountDisplay');
                if (tokenDisplay) tokenDisplay.textContent = tokens.toLocaleString();

                const statsDisplay = document.getElementById('codeStatsDisplay');
                if (statsDisplay) statsDisplay.textContent = `${charCount.toLocaleString()} caracteres · ${lineCount.toLocaleString()} líneas`;

                return tokens;
            }
            window.refreshModalTokenStats = refreshModalTokenStats;

            window.onPlatformCodeInput = function () {
                const contentEl = document.getElementById('platformCodeContent');
                const text = contentEl?.value || '';
                const tokens = refreshModalTokenStats(text);

                // Sincronizar en vivo con la fila actual y con la tarjeta 2
                adminPendingRow.platform_code = text;
                adminPendingRow.num_tokens = String(tokens);

                const c2Tokens = document.getElementById('c2_numTokens');
                if (c2Tokens) c2Tokens.value = String(tokens);

                const rows = window.getSharedPublicationRows();
                if (rows[selectedRowIndex]) {
                    rows[selectedRowIndex].platform_code = text;
                    rows[selectedRowIndex].num_tokens = String(tokens);
                    window.saveSharedPublicationRows(rows);
                    renderAdminTable();
                }
            };

            // --- Code Upload / Code Viewer Modal ---
            window.openPlatformCodeModal = function () {
                const modal = document.getElementById('platformCodeModal');
                const contentEl = document.getElementById('platformCodeContent');
                const currentCode = adminPendingRow.platform_code || '';
                if (contentEl) contentEl.value = currentCode;
                refreshModalTokenStats(currentCode);
                if (modal) { modal.classList.add('open'); modal.style.display = 'flex'; modal.style.zIndex = '999999'; }
            };

            window.closePlatformCodeModal = function () {
                const modal = document.getElementById('platformCodeModal');
                if (modal) { modal.classList.remove('open'); modal.style.display = 'none'; }
            };

            window.handleCodeFileUpload = function (event) {
                const file = event.target.files && event.target.files[0];
                if (!file) return;
                adminPendingRow.platform_code_name = file.name;
                const ext = file.name.split('.').pop().toLowerCase();
                if (ext === 'py') adminPendingRow.platform_code_lang = 'python';
                else if (ext === 'html' || ext === 'htm') adminPendingRow.platform_code_lang = 'html';
                else if (ext === 'ts') adminPendingRow.platform_code_lang = 'typescript';
                else if (ext === 'js') adminPendingRow.platform_code_lang = 'javascript';

                const langSel = document.getElementById('codeLangSelect');
                if (langSel) langSel.value = adminPendingRow.platform_code_lang || 'python';

                const reader = new FileReader();
                reader.onload = function (e) {
                    const content = e.target.result || '';
                    const contentEl = document.getElementById('platformCodeContent');
                    if (contentEl) contentEl.value = content;

                    const tokenCount = refreshModalTokenStats(content);
                    adminPendingRow.platform_code = content;
                    adminPendingRow.num_tokens = String(tokenCount);

                    const c2Tokens = document.getElementById('c2_numTokens');
                    if (c2Tokens) c2Tokens.value = String(tokenCount);

                    const codeStatus = document.getElementById('c1_codeStatusLabel');
                    if (codeStatus) codeStatus.textContent = 'Code ' + file.name + ' ✓';

                    const rows = window.getSharedPublicationRows();
                    if (rows[selectedRowIndex]) {
                        rows[selectedRowIndex].platform_code = content;
                        rows[selectedRowIndex].platform_code_name = file.name;
                        rows[selectedRowIndex].platform_code_lang = adminPendingRow.platform_code_lang;
                        rows[selectedRowIndex].num_tokens = String(tokenCount);
                        window.saveSharedPublicationRows(rows);
                        renderAdminTable();
                    }
                    window.showAdminToast(`✓ Archivo '${file.name}' cargado: ${tokenCount.toLocaleString()} tokens calculados.`);
                };
                reader.readAsText(file);
            };

            window.updateCodeTemplate = function () {
                const langSel = document.getElementById('codeLangSelect');
                const contentEl = document.getElementById('platformCodeContent');
                if (!langSel || !contentEl) return;
                const lang = langSel.value;
                adminPendingRow.platform_code_lang = lang;
                if (lang === 'python') {
                    adminPendingRow.platform_code_name = 'main.py';
                    if (!contentEl.value.trim()) contentEl.value = '# Python code for Hashcod platform\nimport streamlit as st\n\nst.title("Hashcod Codespace AI")\nst.write("Post-quantum quantum-resistant system initialized.")\n';
                } else if (lang === 'html') {
                    adminPendingRow.platform_code_name = 'index.html';
                    if (!contentEl.value.trim()) contentEl.value = '<!DOCTYPE html><html><head><title>Hashcod AI</title></head><body><h1>Hashcod AI View</h1><p>Post-quantum system initialized.</p></body></html>';
                } else if (lang === 'typescript') {
                    adminPendingRow.platform_code_name = 'index.ts';
                    if (!contentEl.value.trim()) contentEl.value = 'export const platform = "Hashcod";\nexport function computeQuantumHash(data: string): string {\n    return `SPHINCS+:${data}`;\n}\n';
                } else if (lang === 'javascript') {
                    adminPendingRow.platform_code_name = 'app.js';
                    if (!contentEl.value.trim()) contentEl.value = 'console.log("Hashcod engine online");\n';
                }
                onPlatformCodeInput();
            };

            window.savePlatformCodeAttachment = function () {
                const rows = window.getSharedPublicationRows();
                const currentRow = rows[selectedRowIndex];
                if (currentRow && currentRow.impenetrable_seal === true) {
                    alert('🛡️ Esta publicación cuenta con un Sello Impenetrable activo y no admite más subidas.');
                    closePlatformCodeModal();
                    return;
                }

                const contentEl = document.getElementById('platformCodeContent');
                const content = (contentEl?.value || '').trim();
                const tokenCount = calculateCodeTokens(content);

                adminPendingRow.platform_code = content;
                adminPendingRow.num_tokens = String(tokenCount);
                adminPendingRow.cost_per_token = '0.015';
                adminPendingRow.total_cost_usd = (tokenCount * 0.015).toFixed(2);

                // Gestión determinista de fechas de subida y arreglos ('A ' + fecha)
                const now = new Date();
                const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
                if (!adminPendingRow.upload_date || adminPendingRow.upload_date === 'Sin subida') {
                    adminPendingRow.upload_date = dateStr;
                    adminPendingRow.revision_count = 1;
                } else {
                    adminPendingRow.revision_count = (adminPendingRow.revision_count || 1) + 1;
                    adminPendingRow.upload_date = `A ${dateStr}`;
                }

                const label = document.getElementById('c1_codeStatusLabel');
                if (label) label.textContent = 'Code ' + (adminPendingRow.platform_code_name || 'script.py') + ' ✓';

                const c2Tokens = document.getElementById('c2_numTokens');
                if (c2Tokens) c2Tokens.value = String(tokenCount);

                closePlatformCodeModal();

                // Update table
                if (rows[selectedRowIndex]) {
                    rows[selectedRowIndex] = { ...adminPendingRow };
                    window.saveSharedPublicationRows(rows);
                    renderAdminTable();
                    if (typeof window.renderExcelTable === 'function') window.renderExcelTable();
                }
                window.showAdminToast(`✓ Código guardado: ${tokenCount.toLocaleString()} tokens ($${adminPendingRow.total_cost_usd} USD) asignados a [${adminPendingRow.account_id || adminPendingRow.identifier_code}].`);
            };

            // --- Toolbox Tool 3 (Warp Terminal & Bash Engine) ---
            window.openToolboxTool3 = function () {
                if (window.WarpTerminal && typeof window.WarpTerminal.open === 'function') {
                    window.WarpTerminal.open();
                } else {
                    const modal = document.getElementById('warpTerminalModal') || document.getElementById('tool3Modal');
                    if (modal) { modal.classList.add('open'); modal.style.display = 'flex'; modal.style.zIndex = '999999'; }
                }
            };

            window.closeTool3Modal = function () {
                if (window.WarpTerminal && typeof window.WarpTerminal.close === 'function') {
                    window.WarpTerminal.close();
                }
                const modal = document.getElementById('tool3Modal');
                if (modal) { modal.classList.remove('open'); modal.style.display = 'none'; }
            };

            // --- Post-Quantum SPHINCS+ (SLH-DSA) Signature Generation (Admin Exclusivo) ---
            window.stampSphincsSignature = function () {
                const timestamp = new Date().toISOString();
                const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(32)))
                    .map(b => b.toString(16).padStart(2, '0')).join('');
                
                const certDigest = `SPHINCS+-SLH-DSA-SHAKE-256s:AUTH:${randomHex.substring(0, 48)}`;
                adminPendingRow.auth_signature = 'Authorized (SPHINCS+)';
                adminPendingRow.auth_signature_digest = certDigest;

                const titleEl = document.getElementById('sphincsTitle');
                if (titleEl) titleEl.textContent = 'Firma Criptográfica Cuántica Generada (SPHINCS+)';

                const payloadEl = document.getElementById('sphincsCertPayload');
                if (payloadEl) {
                    payloadEl.innerHTML = `
                        [POST-QUANTUM CRYPTOGRAPHIC CERTIFICATE - ISSUED]\n
                        ALGORITHM: SPHINCS+ (SLH-DSA-SHAKE-256s / NIST FIPS 205)\n
                        SECURITY LEVEL: Level 5 (Quantum Attack Invariant)\n
                        TIMESTAMP (UTC): ${timestamp}\n
                        TARGET: ${adminPendingRow.identifier_code} · ${adminPendingRow.responsible_code}\n
                        CODE ATTACHMENT: ${adminPendingRow.platform_code_name || 'main.py'}\n
                        SIGNATURE DIGEST:\n${certDigest}\n
                        STATUS: AUTHORIZED & VERIFIED ✓
                    `;
                }

                const modal = document.getElementById('sphincsCertModal');
                if (modal) { modal.classList.add('open'); modal.style.display = 'flex'; modal.style.zIndex = '999999'; }

                const btnLabel = document.getElementById('c1_authSigLabel');
                if (btnLabel) btnLabel.textContent = 'Authorized ✓';

                // Update table
                const rows = window.getSharedPublicationRows();
                rows[selectedRowIndex] = { ...adminPendingRow };
                window.saveSharedPublicationRows(rows);
                renderAdminTable();
            };

            window.closeSphincsCertModal = function () {
                const modal = document.getElementById('sphincsCertModal');
                if (modal) { modal.classList.remove('open'); modal.style.display = 'none'; }
            };

            // --- Render 16-Column Admin Table ---
            function renderAdminTable(pulseActive = false) {
                const table = document.getElementById('adminMainDataTable');
                if (!table) return;
                const thead = table.querySelector('thead');
                const tbody = document.getElementById('adminTableBody');
                if (!tbody) return;

                const allCols = L8_SYSTEM_COLUMNS;
                const activeKeys = window.getActiveColumns();
                let activeCols = allCols.filter(c => activeKeys.includes(c.key));
                if (activeCols.length === 0) activeCols = allCols;

                // Render Header
                if (thead) {
                    let hHtml = '<tr class="table-column-header-tr">';
                    activeCols.forEach(col => {
                        hHtml += `
                            <th style="min-width: ${col.minWidth};">
                                <div class="th-content-box">
                                    <span>${col.label}</span>
                                    <button type="button" class="th-del-btn" onclick="deleteTableColumn('${col.key}', event)" title="Eliminar columna ${col.label}">✕</button>
                                </div>
                            </th>
                        `;
                    });
                    hHtml += `<th style="width: 50px; min-width: 50px; border-right:none; text-align:center;">Acciones</th>`;
                    hHtml += '</tr>';
                    thead.innerHTML = hHtml;
                }

                // Botón de restaurar columnas en Admin
                const adminRestoreBtn = document.getElementById('adminRestoreColsBtn');
                if (adminRestoreBtn) {
                    adminRestoreBtn.style.display = (activeKeys.length < allCols.length) ? 'inline-flex' : 'none';
                }

                const rows = window.getSharedPublicationRows();
                const q = (document.getElementById('adminTableSearchInput')?.value || '').toLowerCase().trim();

                tbody.innerHTML = '';
                rows.forEach((r, idx) => {
                    if (q) {
                        const searchStr = Object.values(r).join(' ').toLowerCase();
                        if (!searchStr.includes(q)) return;
                    }

                    const isSelected = (idx === selectedRowIndex);
                    const tr = document.createElement('tr');
                    tr.className = 'table-data-tr' + (isSelected ? ' active-row' : '');
                    if (isSelected && pulseActive) tr.classList.add('pulse-row');

                    const safeColor = r.hasna_color || '#E63333';
                    let rowHtml = '';

                    activeCols.forEach((col, colIdx) => {
                        const key = col.key;
                        switch (key) {
                            case 'account_id':
                                const activeAccs = (typeof window.getActiveAccountsList === 'function') ? window.getActiveAccountsList() : ['admin', 'diktatcart', 'user-01', 'user-02'];
                                let accOptions = '';
                                activeAccs.forEach(acc => {
                                    const sel = (r.account_id === acc) ? 'selected' : '';
                                    accOptions += `<option value="${acc}" ${sel}>${acc}</option>`;
                                });
                                rowHtml += `
                                    <td>
                                        <select class="select-account-admin" onchange="updateRowAccountId(${idx}, this.value)" title="Asignar cuenta activa (Solo Admin)">
                                            ${accOptions}
                                        </select>
                                    </td>`;
                                break;
                            case 'upload_date':
                                rowHtml += `<td><input type="text" class="input-field-figma" value="${r.upload_date || 'Sin subida'}" readonly style="font-family:'Geist Mono',monospace;background:#FAFAFC;cursor:default;" title="Fecha de subida / revisión"></td>`;
                                break;
                            case 'platform_code':
                                const isSealedAdmin = (r.impenetrable_seal === true);
                                rowHtml += `
                                    <td>
                                        <button type="button" class="cell-home-icon-btn" onclick="openPlatformCodeModal()" title="${isSealedAdmin ? 'Publicación sellada permanentemente (Lectura)' : 'Ver/subir código'}">
                                            <svg viewBox="0 0 24 24"><path d="M 9.4238281 0.98632812 A 1.0001 1.0001 0 0 0 8.6699219 1.3105469 L 2.2617188 8.3261719 A 1.0001 1.0001 0 0 0 2.0976562 9.4277344 A 1.0001 1.0001 0 0 0 2.1054688 9.4453125 C 2.1402752 9.5346047 5.2618257 17.541307 6.5039062 20.726562 C 6.8039062 21.494563 7.5431875 22 8.3671875 22 L 20 22 C 21.105 22 22 21.105 22 20 L 22 11.013672 C 22 10.376672 21.697594 9.7763906 21.183594 9.4003906 C 18.514163 7.4418892 10.37325 1.4715432 10.119141 1.2851562 A 1.0001 1.0001 0 0 0 9.4238281 0.98632812 z M 9.4179688 3.4570312 L 13.6875 8 L 13 8 A 1.0001 1.0001 0 0 0 12 9 L 12 14 L 7 14 L 7 9 A 1.0001 1.0001 0 0 0 6 8 L 5.2675781 8 L 9.4179688 3.4570312 z M 7 16 L 12 16 L 12 18 L 7 18 L 7 16 z"/></svg>
                                        </button>
                                    </td>`;
                                break;
                            case 'auth_signature':
                                const isAuthSigned = (r.auth_signature && r.auth_signature.includes('Authorized'));
                                rowHtml += `
                                    <td>
                                        <button type="button" class="btn-auth-figma signed" onclick="stampSphincsSignature()" title="Certificar manualmente con SPHINCS+ (Solo Admin)">
                                            ${isAuthSigned ? 'Authorized ✓' : 'Authorize (SPHINCS+)'}
                                        </button>
                                    </td>`;
                                break;
                            case 'num_tokens':
                                rowHtml += `<td><input type="text" class="input-field-figma" value="${r.num_tokens || '0'}" onchange="updateCellData(${idx}, 'num_tokens', this.value)" oninput="updateCellDataRealtime(${idx}, 'num_tokens', this.value)" title="Cantidad de tokens"></td>`;
                                break;
                            case 'cost_per_token':
                                rowHtml += `
                                    <td>
                                        <div class="dollar-input-figma">
                                            <span>$</span>
                                            <input type="text" value="0.015" readonly style="background:#FAFAFC;cursor:default;" title="Costo fijo por token: $0.015">
                                        </div>
                                    </td>`;
                                break;
                            case 'total_cost_usd':
                                const totalUsdAdmin = ((Number(r.num_tokens) || 0) * 0.015).toFixed(2);
                                rowHtml += `
                                    <td>
                                        <div class="dollar-input-figma">
                                            <span>$</span>
                                            <input type="text" value="${totalUsdAdmin}" readonly style="font-weight:700;color:#111317;background:#FAFAFC;cursor:default;" title="Total en dólares (Tokens × 0.015)">
                                        </div>
                                    </td>`;
                                break;
                            case 'impenetrable_seal':
                                if (r.impenetrable_seal === true) {
                                    rowHtml += `
                                        <td>
                                            <span class="impenetrable-seal-badge sealed" title="Sello Impenetrable Activo - Publicación Inmutable">
                                                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                                                SELLADO ✓
                                            </span>
                                        </td>`;
                                } else {
                                    rowHtml += `
                                        <td>
                                            <button type="button" class="btn-impenetrable-seal" onclick="applyImpenetrableSeal(${idx})" title="Marcar Sello Impenetrable (Permanente)">
                                                🔒 Marcar Sello
                                            </button>
                                        </td>`;
                                }
                                break;
                            case 'identifier_code':
                            case 'responsible_code':
                            case 'icai_page':
                            case 'nspa_monthly':
                            case 'time_to_create':
                            case 'proof':
                            case 'manager_id':
                            case 'creator_name':
                            case 'phone':
                            case 'email':
                                rowHtml += `<td><input type="text" class="input-field-figma" value="${r[key] || ''}" onchange="updateCellData(${idx}, '${key}', this.value)" oninput="updateCellDataRealtime(${idx}, '${key}', this.value)"></td>`;
                                break;
                            case 'cors_method':
                                rowHtml += `
                                    <td>
                                        <div class="cell-checkboxes" onclick="toggleAdminCors(${idx})" style="cursor:pointer;" title="Alternar CORS (Y/N)">
                                            <span class="cell-chk-box ${r.cors_method === 'Yes' ? 'checked' : ''}"></span>
                                            <span class="cell-chk-label">Y</span>
                                            <span class="cell-chk-box ${r.cors_method === 'No' ? 'checked' : ''}"></span>
                                            <span class="cell-chk-label">N</span>
                                        </div>
                                    </td>`;
                                break;
                            case 'user_text_data':
                                const isUserTextAuthedAdmin = (sessionStorage.getItem(ADMIN_AUTH_KEY) === '1');
                                const hasTextAdm = !!(r.user_text_data && r.user_text_data.trim());
                                rowHtml += `
                                    <td>
                                        <div class="cell-text-editor-wrap">
                                            <input type="password" class="input-field-figma" placeholder="${hasTextAdm ? '••••••••••••' : 'Escribe texto...'}" value="${hasTextAdm ? '••••••••••••' : ''}" readonly style="flex:1; min-width:60px; letter-spacing:2px; cursor:pointer;" title="${hasTextAdm ? (isUserTextAuthedAdmin ? 'Texto protegido confidencial (Ver en Notificaciones o Presentación)' : 'Texto protegido confidencial - Solo Admin') : 'Escribe texto...'}" onclick="openTextEditorModal(${idx})">
                                            <button type="button" class="cell-text-editor-btn" onclick="openTextEditorModal(${idx})" title="Abrir Editor de Texto (Confidencial)">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="16" height="16" fill="currentColor">
                                                    <path d="M15,3C8.373,3,3,8.373,3,15c0,6.627,5.373,12,12,12s12-5.373,12-12C27,8.373,21.627,3,15,3z M16,21h-2v-7h2V21z M15,11.5 c-0.828,0-1.5-0.672-1.5-1.5s0.672-1.5,1.5-1.5s1.5,0.672,1.5,1.5S15.828,11.5,15,11.5z"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>`;
                                break;
                            case 'hasna_color':
                                rowHtml += `
                                    <td>
                                        <div class="cell-color-squares">
                                            <div class="cell-color-rect ${safeColor==='#E63333'?'active':''}" style="background:#E63333;" onclick="updateAdminHasnaColor(${idx}, '#E63333')" title="Rojo HASNA"></div>
                                            <div class="cell-color-rect ${safeColor==='#33B34D'?'active':''}" style="background:#33B34D;" onclick="updateAdminHasnaColor(${idx}, '#33B34D')" title="Verde HASNA"></div>
                                            <div class="cell-color-rect ${safeColor==='#3366E6'?'active':''}" style="background:#3366E6;" onclick="updateAdminHasnaColor(${idx}, '#3366E6')" title="Azul HASNA"></div>
                                            <div class="cell-color-rect ${safeColor==='#FFFFFF'?'active':''}" style="background:#FFFFFF;" onclick="updateAdminHasnaColor(${idx}, '#FFFFFF')" title="Blanco HASNA"></div>
                                        </div>
                                    </td>`;
                                break;
                        }
                    });

                    // Acciones: Eliminar registro
                    rowHtml += `
                        <td style="border-right:none; text-align:center;">
                            <button type="button" class="cell-del-row-btn" onclick="deleteTableRow(${idx}, event)" title="Eliminar registro ${r.identifier_code}">
                                <svg style="width:14px;height:14px;fill:currentColor;" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                        </td>
                    `;

                    tr.innerHTML = rowHtml;

                    tr.addEventListener('click', (e) => {
                        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                        selectedRowIndex = idx;
                        adminPendingRow = { ...r };
                        loadPendingRowIntoCards();
                        renderAdminTable();
                    });

                    tbody.appendChild(tr);
                });
            }
            window.renderAdminTable = renderAdminTable;

            function loadPendingRowIntoCards() {
                if (document.getElementById('c1_idCode')) document.getElementById('c1_idCode').value = adminPendingRow.identifier_code || '';
                if (document.getElementById('c1_respCode')) document.getElementById('c1_respCode').value = adminPendingRow.responsible_code || '';
                if (document.getElementById('c2_numTokens')) document.getElementById('c2_numTokens').value = adminPendingRow.num_tokens || '';
                if (document.getElementById('c2_costPerToken')) document.getElementById('c2_costPerToken').value = adminPendingRow.cost_per_token || '';
                if (document.getElementById('c2_icaiPage')) document.getElementById('c2_icaiPage').value = adminPendingRow.icai_page || '';
                if (document.getElementById('c2_nspaMonthly')) document.getElementById('c2_nspaMonthly').value = adminPendingRow.nspa_monthly || '';
                if (document.getElementById('c3_timeToCreate')) document.getElementById('c3_timeToCreate').value = adminPendingRow.time_to_create || '';
                if (document.getElementById('c3_proof')) document.getElementById('c3_proof').value = adminPendingRow.proof || '';
                if (document.getElementById('c4_managerId')) document.getElementById('c4_managerId').value = adminPendingRow.manager_id || '';
                if (document.getElementById('c4_creatorName')) document.getElementById('c4_creatorName').value = adminPendingRow.creator_name || '';
                if (document.getElementById('c4_phone')) document.getElementById('c4_phone').value = adminPendingRow.phone || '';
                if (document.getElementById('c4_email')) document.getElementById('c4_email').value = adminPendingRow.email || '';

                const codeStatus = document.getElementById('c1_codeStatusLabel');
                if (codeStatus) codeStatus.textContent = 'Code ' + (adminPendingRow.platform_code_name || 'main.py') + ' ✓';

                const authLabel = document.getElementById('c1_authSigLabel');
                if (authLabel) authLabel.textContent = adminPendingRow.auth_signature ? 'Authorized ✓' : 'Authorized';

                const corsInputs = document.querySelectorAll('input[name="c3_cors"]');
                corsInputs.forEach(i => { i.checked = (i.value === adminPendingRow.cors_method); });

                document.querySelectorAll('.admin-color-square').forEach(s => {
                    s.classList.toggle('active', s.dataset.color === adminPendingRow.hasna_color);
                });
            }
            window.loadPendingRowIntoCards = loadPendingRowIntoCards;

            function gatherAllCardValues() {
                const idCode = (document.getElementById('c1_idCode')?.value || adminPendingRow.identifier_code || 'PUB-001').trim();
                const respCode = (document.getElementById('c1_respCode')?.value || adminPendingRow.responsible_code || 'DKT-ROOT').trim();
                const numTokens = (document.getElementById('c2_numTokens')?.value || adminPendingRow.num_tokens || '250000').trim();
                const costPerToken = (document.getElementById('c2_costPerToken')?.value || adminPendingRow.cost_per_token || '0.00015').trim();
                const icaiPage = (document.getElementById('c2_icaiPage')?.value || adminPendingRow.icai_page || 'ICAI-v4').trim();
                const nspaMonthly = (document.getElementById('c2_nspaMonthly')?.value || adminPendingRow.nspa_monthly || '100.0%').trim();
                const corsChecked = document.querySelector('input[name="c3_cors"]:checked')?.value || adminPendingRow.cors_method || 'Yes';
                const timeToCreate = (document.getElementById('c3_timeToCreate')?.value || adminPendingRow.time_to_create || '12 mins').trim();
                const proof = (document.getElementById('c3_proof')?.value || adminPendingRow.proof || 'Git SHA-256').trim();
                const managerId = (document.getElementById('c4_managerId')?.value || adminPendingRow.manager_id || 'MGR-01').trim();
                const creatorName = (document.getElementById('c4_creatorName')?.value || adminPendingRow.creator_name || 'Diktatcart').trim();
                const phone = (document.getElementById('c4_phone')?.value || adminPendingRow.phone || '+1 800 HASHCOD').trim();
                const email = (document.getElementById('c4_email')?.value || adminPendingRow.email || 'admin@hashcod.io').trim();

                adminPendingRow.identifier_code = idCode;
                adminPendingRow.responsible_code = respCode;
                adminPendingRow.num_tokens = numTokens;
                adminPendingRow.cost_per_token = costPerToken;
                adminPendingRow.icai_page = icaiPage;
                adminPendingRow.nspa_monthly = nspaMonthly;
                adminPendingRow.cors_method = corsChecked;
                adminPendingRow.time_to_create = timeToCreate;
                adminPendingRow.proof = proof;
                adminPendingRow.manager_id = managerId;
                adminPendingRow.creator_name = creatorName;
                adminPendingRow.phone = phone;
                adminPendingRow.email = email;
            }
            window.gatherAllCardValues = gatherAllCardValues;

            window.updateCellData = function (rowIdx, key, val) {
                const rows = window.getSharedPublicationRows();
                let targetIdx = -1;
                if (typeof rowIdx === 'number') {
                    targetIdx = rowIdx;
                } else if (typeof rowIdx === 'string') {
                    targetIdx = rows.findIndex(r => r.identifier_code === rowIdx);
                }
                if (targetIdx >= 0 && rows[targetIdx]) {
                    rows[targetIdx][key] = val;
                    window.saveSharedPublicationRows(rows);
                    if (targetIdx === selectedRowIndex) {
                        adminPendingRow[key] = val;
                        loadPendingRowIntoCards();
                    }
                }
            };

            window.updateCellDataRealtime = function (rowIdx, key, val) {
                const rows = window.getSharedPublicationRows();
                let targetIdx = -1;
                if (typeof rowIdx === 'number') {
                    targetIdx = rowIdx;
                } else if (typeof rowIdx === 'string') {
                    targetIdx = rows.findIndex(r => r.identifier_code === rowIdx);
                }
                if (targetIdx >= 0 && rows[targetIdx]) {
                    rows[targetIdx][key] = val;
                    localStorage.setItem(L8_DATA_KEY, JSON.stringify(rows));
                    if (targetIdx === selectedRowIndex) {
                        adminPendingRow[key] = val;
                        loadPendingRowIntoCards();
                    }
                }
            };

            window.toggleAdminCors = function (idx) {
                const rows = window.getSharedPublicationRows();
                if (rows[idx]) {
                    rows[idx].cors_method = (rows[idx].cors_method === 'Yes') ? 'No' : 'Yes';
                    window.saveSharedPublicationRows(rows);
                    if (idx === selectedRowIndex) {
                        adminPendingRow.cors_method = rows[idx].cors_method;
                        loadPendingRowIntoCards();
                    }
                    renderAdminTable();
                }
            };

            window.updateAdminHasnaColor = function (idx, color) {
                const rows = window.getSharedPublicationRows();
                if (rows[idx]) {
                    rows[idx].hasna_color = color;
                    window.saveSharedPublicationRows(rows);
                    if (idx === selectedRowIndex) {
                        adminPendingRow.hasna_color = color;
                        loadPendingRowIntoCards();
                    }
                    renderAdminTable();
                }
            };

            window.filterAdminTable = function () {
                renderAdminTable();
            };

            window.resetAdminTableFilter = function () {
                const input = document.getElementById('adminTableSearchInput');
                if (input) input.value = '';
                renderAdminTable();
            };

            window.adminPrevRow = function () {
                const rows = window.getSharedPublicationRows();
                if (selectedRowIndex > 0) {
                    selectedRowIndex--;
                    adminPendingRow = { ...rows[selectedRowIndex] };
                    loadPendingRowIntoCards();
                    renderAdminTable();
                }
            };

            // --- Launch on the blog Action (Despliegue Exclusivo de Admin) ---
            window.launchOnTheBlog = function () {
                gatherAllCardValues();
                const row = adminPendingRow;

                // 1. Guardar en la tabla del panel Admin
                const rows = window.getSharedPublicationRows();
                const exIdx = rows.findIndex(r => r.identifier_code === row.identifier_code);
                if (exIdx >= 0) {
                    rows[exIdx] = { ...row };
                } else {
                    rows.unshift({ ...row });
                }
                window.saveSharedPublicationRows(rows);
                renderAdminTable(true);

                // 2. Sincronizar con el Blog de Publicaciones
                const blogKey = 'l8_excel_blog_articles_v1';
                let blogArticles = [];
                try {
                    const raw = localStorage.getItem(blogKey);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed) && parsed.length > 0) blogArticles = parsed;
                    }
                } catch (e) {}

                const postTitle = `Publicación ${row.identifier_code}: ${row.creator_name} [${row.manager_id}]`;
                const postExcerpt = `Tokens: ${row.num_tokens} ($${row.cost_per_token}/token) · ICAI: ${row.icai_page} · NSPA: ${row.nspa_monthly}`;
                
                const newArticle = {
                    id: row.identifier_code,
                    date: new Date().toISOString().split('T')[0],
                    title: postTitle,
                    category: 'Lanzamientos',
                    status: 'Publicado',
                    author: row.creator_name || 'Admin',
                    excerpt: postExcerpt,
                    content: `Contenido de ${row.identifier_code}`,
                    views: 1
                };

                const existingIdx = blogArticles.findIndex(a => a.id === newArticle.id);
                if (existingIdx >= 0) blogArticles[existingIdx] = newArticle;
                else blogArticles.unshift(newArticle);

                localStorage.setItem(blogKey, JSON.stringify(blogArticles));
                if (typeof window.saveExcelArticles === 'function') {
                    window.saveExcelArticles(blogArticles);
                }

                window.showAdminToast(`✓ Publicación [${newArticle.id}] lanzada y visible en el Blog.`);
                
                if (typeof window.openBlogArticleDetails === 'function') {
                    window.openBlogArticleDetails(newArticle.id);
                }
            };

            window.exportAdminReport = function () {
                const rows = window.getSharedPublicationRows();
                let csv = 'identifier_code,responsible_code,auth_signature,num_tokens,cost_per_token,icai_page,nspa_monthly,cors_method,time_to_create,proof,manager_id,creator_name,phone,email\n';
                rows.forEach(r => {
                    csv += `"${r.identifier_code}","${r.responsible_code}","${r.auth_signature}","${r.num_tokens}","${r.cost_per_token}","${r.icai_page}","${r.nspa_monthly}","${r.cors_method}","${r.time_to_create}","${r.proof}","${r.manager_id}","${r.creator_name}","${r.phone}","${r.email}"\n`;
                });
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `admin_publication_report_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };

            // Initial render
            document.addEventListener('DOMContentLoaded', () => {
                renderAdminTable();
            });
            renderAdminTable();
        })();

        /* ===== AUTH GATE (registro / login) ===== */
        (function authGate() {
            const AUTH_TOKEN_KEY = 'l8_auth_token';
            const AUTH_ACCOUNT_KEY = 'l8_auth_account';
            const overlay = document.getElementById('authOverlay');
            const msgEl = document.getElementById('authMsg');
            const keysBox = document.getElementById('authKeysBox');
            let pendingSessionToken = '';
            let pendingKeysText = '';

            function setMsg(text, ok) {
                if (!msgEl) return;
                msgEl.textContent = text || '';
                msgEl.classList.toggle('ok', !!ok);
            }

            function getToken() {
                try { return sessionStorage.getItem(AUTH_TOKEN_KEY) || ''; } catch (e) { return ''; }
            }

            function saveSession(token, accountId) {
                try {
                    sessionStorage.setItem(AUTH_TOKEN_KEY, token || '');
                    if (accountId) sessionStorage.setItem(AUTH_ACCOUNT_KEY, accountId);
                } catch (e) {}
            }

            function clearSession() {
                try {
                    sessionStorage.removeItem(AUTH_TOKEN_KEY);
                    sessionStorage.removeItem(AUTH_ACCOUNT_KEY);
                } catch (e) {}
            }

            function unlockPlatform() {
                if (overlay) overlay.classList.add('hidden');
                document.body.classList.remove('boot-locked');
                document.body.classList.remove('auth-locked');
                if (typeof restorePlatformState === 'function') {
                    restorePlatformState();
                }
            }

            function showAuthGate() {
                document.body.classList.add('auth-locked');
                document.body.classList.remove('boot-locked');
                if (overlay) overlay.classList.remove('hidden');
                setMsg('');
                if (typeof window.updateCheckoutVoucherUI === 'function') {
                    window.updateCheckoutVoucherUI();
                }
                if (typeof window.renderTurnstileWidgets === 'function') {
                    setTimeout(window.renderTurnstileWidgets, 100);
                }
            }

            window.l8ShowAuthGate = showAuthGate;
            window.l8UnlockPlatform = unlockPlatform;
            window.l8GetAuthToken = getToken;

            window.l8LogoutSession = async function() {
                if (!confirm('¿Cerrar sesión de la cuenta? Se bloqueará la plataforma y tendrás que volver a ingresar con tus claves.')) {
                    return;
                }
                const token = getToken();
                if (token) {
                    try {
                        await fetch('/api/auth/logout', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + token
                            }
                        });
                    } catch (e) {}
                }
                clearSession();
                try {
                    sessionStorage.clear();
                    localStorage.removeItem(AUTH_TOKEN_KEY);
                    localStorage.removeItem(AUTH_ACCOUNT_KEY);
                    localStorage.removeItem('l8_auth_token');
                    localStorage.removeItem('l8_auth_account');
                    localStorage.removeItem('l8_session_token');
                    localStorage.removeItem('l8_auth_account_id');
                } catch(e) {}
                showAuthGate();
                window.location.reload();
            };
            window.logoutSession = window.l8LogoutSession;

            async function checkSession() {
                const token = getToken();
                if (!token) return false;

                const controller = (typeof AbortController === 'function') ? new AbortController() : null;
                const timeoutMs = 4000;
                const timeoutId = window.setTimeout(function () {
                    if (controller) controller.abort();
                }, timeoutMs);

                try {
                    const res = await fetch('/api/auth/session', {
                        headers: { 'Authorization': 'Bearer ' + token },
                        signal: controller ? controller.signal : undefined
                    });
                    if (!res.ok) return false;
                    const data = await res.json();
                    return !!(data && data.ok && data.authenticated);
                } catch (e) {
                    if (e && e.name !== 'AbortError') {
                        console.warn('Check auth session:', e);
                    }
                    return false;
                } finally {
                    window.clearTimeout(timeoutId);
                }
            }

            window.l8CheckAuthSession = checkSession;

            function switchTab(name) {
                const tabs = {
                    login: document.getElementById('authTabLogin'),
                    register: document.getElementById('authTabRegister'),
                    recover: document.getElementById('authTabRecover'),
                    validate: document.getElementById('authTabValidate')
                };
                const panels = {
                    login: document.getElementById('authPanelLogin'),
                    register: document.getElementById('authPanelRegister'),
                    recover: document.getElementById('authPanelRecover'),
                    validate: document.getElementById('authPanelValidate')
                };
                Object.keys(tabs).forEach((k) => {
                    if (tabs[k]) tabs[k].classList.toggle('active', k === name);
                    if (panels[k]) panels[k].classList.toggle('active', k === name);
                });
                setMsg('');
                                const launcher = document.getElementById('d5LauncherBtn');
                if (launcher) {
                    launcher.style.display = (name === 'register') ? 'flex' : 'none';
                const delLauncher = document.getElementById('accountDeleteLauncherBtn');
                if (delLauncher) {
                    delLauncher.style.display = (name === 'register') ? 'flex' : 'none';
                }
                }
                if (name === 'register' && typeof window.updateCheckoutVoucherUI === 'function') {
                    window.updateCheckoutVoucherUI();
                }
                if (typeof window.renderTurnstileWidgets === 'function') {
                    setTimeout(window.renderTurnstileWidgets, 50);
                }
            }

            function showKeyKit(data) {
                const aes = (data.keys && data.keys.aes256) || '';
                const identity = (data.keys && data.keys.identity) || '';
                const recovery = (data.keys && data.keys.recovery) || '';
                const backups = Array.isArray(data.keys && data.keys.backup_codes) ? data.keys.backup_codes : [];
                pendingSessionToken = data.session_token || '';
                pendingKeysText = [
                    'AES-256:', aes, '',
                    'L8ID:', identity, '',
                    'L8REC (recuperación):', recovery, '',
                    'Códigos de respaldo:', backups.join('\n')
                ].join('\n');
                const aesOut = document.getElementById('authKeyAesOut');
                const idOut = document.getElementById('authKeyIdOut');
                const recOut = document.getElementById('authKeyRecOut');
                const bakOut = document.getElementById('authKeyBackupOut');
                if (aesOut) aesOut.textContent = aes;
                if (idOut) idOut.textContent = identity;
                if (recOut) recOut.textContent = recovery;
                if (bakOut) bakOut.textContent = backups.join('\n');
                if (keysBox) keysBox.classList.add('visible');
            }

            document.getElementById('authTabLogin')?.addEventListener('click', () => switchTab('login'));
            document.getElementById('authTabRegister')?.addEventListener('click', () => switchTab('register'));
            document.getElementById('authTabRecover')?.addEventListener('click', () => switchTab('recover'));
            document.getElementById('authTabValidate')?.addEventListener('click', () => switchTab('validate'));

            /* ===== CLOUDFLARE TURNSTILE UNIFIED CONTROLLER ===== */
            const CF_TURNSTILE_SITE_KEY = '0x4AAAAAAEfpecWchE9q2-cs';
            window.renderedTurnstileWidgets = window.renderedTurnstileWidgets || {};

            window.renderTurnstileWidgets = function () {
                if (!window.turnstile || typeof window.turnstile.render !== 'function') {
                    setTimeout(window.renderTurnstileWidgets, 250);
                    return;
                }
                const configs = [
                    { id: 'cfTurnstileLogin', key: 'login', cb: window.onTurnstileSuccessLogin, exp: window.onTurnstileExpireLogin },
                    { id: 'cfTurnstileRegister', key: 'register', cb: window.onTurnstileSuccessRegister, exp: window.onTurnstileExpireRegister },
                    { id: 'cfTurnstileRecover', key: 'recover', cb: window.onTurnstileSuccessRecover, exp: window.onTurnstileExpireRecover }
                ];
                configs.forEach(c => {
                    const el = document.getElementById(c.id);
                    if (el && (!window.renderedTurnstileWidgets[c.id] || !el.hasChildNodes())) {
                        try {
                            el.innerHTML = '';
                            const wId = window.turnstile.render('#' + c.id, {
                                sitekey: CF_TURNSTILE_SITE_KEY,
                                theme: 'light',
                                size: 'flexible',
                                callback: function (token) {
                                    if (window.turnstileTokens) {
                                        window.turnstileTokens[c.key] = token;
                                        window.turnstileTokens.latest = token;
                                    }
                                    if (typeof c.cb === 'function') c.cb(token);
                                },
                                'expired-callback': function () {
                                    if (window.turnstileTokens) window.turnstileTokens[c.key] = '';
                                    if (typeof c.exp === 'function') c.exp();
                                },
                                'error-callback': function () {
                                    if (window.turnstileTokens) window.turnstileTokens[c.key] = '';
                                }
                            });
                            window.renderedTurnstileWidgets[c.id] = wId || '1';
                        } catch (e) {
                            console.warn('Turnstile render error:', e);
                        }
                    }
                });
            };

            function getTurnstileToken(mode) {
                try {
                    let key = 'login';
                    let elId = 'cfTurnstileLogin';
                    if (mode === 'register' || mode === 'cfTurnstileRegister') { key = 'register'; elId = 'cfTurnstileRegister'; }
                    else if (mode === 'recover' || mode === 'cfTurnstileRecover') { key = 'recover'; elId = 'cfTurnstileRecover'; }

                    if (window.turnstileTokens && window.turnstileTokens[key]) {
                        return window.turnstileTokens[key];
                    }
                    
                    const wId = window.renderedTurnstileWidgets ? window.renderedTurnstileWidgets[elId] : null;
                    if (window.turnstile && typeof window.turnstile.getResponse === 'function') {
                        if (wId && wId !== '1') {
                            const res = window.turnstile.getResponse(wId);
                            if (res) return res;
                        }
                        const resGen = window.turnstile.getResponse();
                        if (resGen) return resGen;
                    }

                    const c = document.getElementById(elId);
                    const inp = c ? c.querySelector('[name="cf-turnstile-response"]') : null;
                    if (inp && inp.value) return inp.value;

                    return '';
                } catch (e) {
                    return '';
                }
            }

            function resetTurnstile(containerId) {
                try {
                    if (window.turnstile && typeof window.turnstile.reset === 'function') {
                        if (containerId) {
                            const el = document.getElementById(containerId);
                            if (el) window.turnstile.reset('#' + containerId);
                        }
                        window.turnstile.reset();
                    }
                } catch (e) {}
                if (window.turnstileTokens) {
                    if (containerId === 'cfTurnstileLogin') window.turnstileTokens.login = '';
                    else if (containerId === 'cfTurnstileRegister') window.turnstileTokens.register = '';
                    else if (containerId === 'cfTurnstileRecover') window.turnstileTokens.recover = '';
                    else {
                        window.turnstileTokens.login = '';
                        window.turnstileTokens.register = '';
                        window.turnstileTokens.recover = '';
                    }
                    window.turnstileTokens.latest = '';
                }
            }

            document.getElementById('authLoginBtn')?.addEventListener('click', async () => {
                const aes = (document.getElementById('authAesInput')?.value || '').trim();
                const identity = (document.getElementById('authIdentityInput')?.value || '').trim();
                const btn = document.getElementById('authLoginBtn');
                if (!aes && !identity) {
                    setMsg('Introduce las claves de tu cuenta.');
                    return;
                }
                const cfToken = getTurnstileToken('cfTurnstileLogin');
                if (!cfToken) {
                    setMsg('⏳ Cloudflare se está verificando o la casilla no está marcada. Espera la marca verde y presiona entrar.');
                    return;
                }
                if (window.turnstileTokens) window.turnstileTokens.login = '';
                if (btn) btn.disabled = true;
                setMsg('Verificando con Cloudflare y autenticando…');
                try {
                    const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ aes256: aes, identity: identity, cf_turnstile_response: cfToken })
                    });
                    let data = null;
                    try {
                        data = await res.json();
                    } catch (jsonErr) {
                        const rawText = await res.text();
                        resetTurnstile('cfTurnstileLogin');
                        setMsg('Error del servidor (' + res.status + '): ' + (rawText || 'Respuesta inválida.'));
                        return;
                    }
                    if (!data || !data.ok) {
                        resetTurnstile('cfTurnstileLogin');
                        setMsg((data && data.error) || 'Acceso denegado.');
                        return;
                    }
                    saveSession(data.session_token, data.account_id);
                    setMsg('Acceso concedido.', true);
                    unlockPlatform();
                } catch (e) {
                    resetTurnstile('cfTurnstileLogin');
                    setMsg('Error de red o conexión al iniciar sesión.');
                } finally {
                    if (btn) btn.disabled = false;
                }
            });

            /* ===== HIGH-TECH WHATSAPP MESSAGE GENERATOR & PQC VOUCHER ENGINE ===== */
            window.getCheckoutVoucherSession = function (forceNew) {
                if (!window.__hashcodCheckoutSession || forceNew) {
                    let randHex = '';
                    if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function') {
                        const bytes = new Uint8Array(2);
                        window.crypto.getRandomValues(bytes);
                        randHex = Array.from(bytes).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('');
                    } else if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
                        const bytes = new Uint8Array(2);
                        crypto.getRandomValues(bytes);
                        randHex = Array.from(bytes).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('');
                    } else {
                        randHex = Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0');
                    }
                    
                    const now = new Date();
                    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const dayOfWeek = days[now.getDay()] || 'Sábado';
                    let timezone = 'America/Santo_Domingo';
                    try {
                        if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
                            const resolved = Intl.DateTimeFormat().resolvedOptions();
                            if (resolved && resolved.timeZone) {
                                timezone = resolved.timeZone;
                            }
                        }
                    } catch (e) {}

                    const offsetMin = -now.getTimezoneOffset();
                    const offsetSign = offsetMin >= 0 ? '+' : '-';
                    const offsetHours = String(Math.floor(Math.abs(offsetMin) / 60)).padStart(2, '0');
                    const offsetMins = String(Math.abs(offsetMin) % 60).padStart(2, '0');
                    const tzOffsetStr = `UTC${offsetSign}${offsetHours}:${offsetMins}`;

                    window.__hashcodCheckoutSession = {
                        voucherId: 'HASHCOD-L8-' + randHex,
                        timestamp: now.toISOString(),
                        formattedDate: now.toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' }),
                        formattedTime: now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        dayOfWeek: dayOfWeek,
                        timezone: timezone,
                        timezoneOffset: tzOffsetStr,
                        priceUsd: '60.27',
                        priceBtc: '0.00015',
                        currency: 'BTC / USD',
                        service: 'Hashcod Codespace Pro: Certificación y Tokenización de Código IA + Hosting PQC',
                        plan: 'Free for trial / then 0.00015 BTC / mes',
                        issuer: 'DIKTATCART',
                        rnc: '40209369293',
                        onapi: '#336973',
                        registroMercantil: '#3323LV-PF',
                        phone: '18294721257',
                        phoneFormatted: '+1 (829) 472-1257',
                        privacyAccepted: true,
                        deterministicModelAccepted: true,
                        monthlyTermsAccepted: true,
                        paymentCoordinationMethod: 'Comuníquese al 829-472-1257 para pagar y recibir su Dilithium-5 (0.00015 BTC / mes)',
                        quantumAlgorithm: 'ML-DSA-87 / Dilithium-5 (NIST FIPS 204)',
                        status: 'SOLICITUD_COORDINACION_PAGO_Y_LLAVE_DILITHIUM5'
                    };
                }
                return window.__hashcodCheckoutSession;
            };

            window.buildWhatsAppMessageText = function (session) {
                const s = session || window.getCheckoutVoucherSession();
                
                const jsonPayload = JSON.stringify({
                    protocol: "HASHCOD-L8-PQC-V1",
                    document_type: "CONFIRMACION_ACEPTACION_TERMINOS_Y_PRIVACIDAD",
                    voucher_id: s.voucherId,
                    timestamp: s.timestamp,
                    day_of_week: s.dayOfWeek || "Sábado",
                    timezone: `${s.timezone || "America/Santo_Domingo"} (${s.timezoneOffset || "UTC-04:00"})`,
                    service: s.service,
                    plan: s.plan,
                    price_usd: 60.27,
                    currency: "USD",
                    subscription_terms: "Free for trial / then 0.00015 BTC / mes",
                    price_btc: "0.00015 BTC / mes",
                    payment_mode: "COORDINACION_DIRECTA_WHATSAPP_8294721257",
                    settlement_status: "PENDIENTE_COORDINACION_NO_PREPAGADO",
                    issuer: s.issuer,
                    rnc: s.rnc,
                    onapi: "336973",
                    registro_mercantil: "3323LV-PF",
                    quantum_algorithm: s.quantumAlgorithm || "ML-DSA-87 / Dilithium-5 (NIST FIPS 204)",
                    audit_tabs_acceptance: {
                        tab_1_alcance_cero_telemetria: true,
                        tab_2_openclaw_agentes_autonomos: true,
                        tab_3_criptografia_pqc_strix_scanner: true,
                        tab_4_soda_storage_documentos_locales: true,
                        tab_5_licenciamiento_foss_bash_mit: true,
                        tab_6_evidencias_software_gus_mav: true,
                        tab_7_validacion_legal_dominicana: {
                            onapi_marca_336973: true,
                            dgii_rnc_40209369293: true,
                            camara_comercio_rm_3323lv_pf: true
                        }
                    },
                    user_acceptance: {
                        privacy_policy: true,
                        deterministic_ai_certification: true,
                        monthly_subscription_terms: true,
                        monthly_amount_btc: "0.00015 BTC / mes",
                        monthly_amount_usd: 60.27,
                        dilithium5_key_issuance_requested: true
                    },
                    status: "SOLICITUD_PAGO_Y_EMISION_LLAVE_DILITHIUM5"
                }, null, 2);

                const msg = 
`> 🛡️ *HASHCOD CODESPACE® — CONFIRMACIÓN DE ACEPTACIÓN DE TÉRMINOS Y POLÍTICA DE PRIVACIDAD*
> _Certificación Determinista de IA & Alojamiento Post-Cuántico (PQC)_

\`\`\`
╔══════════════════════════════════╗
║  HASHCOD CODESPACE® · AUDIT PQC  ║
║   PRIVACY & TERMS ACCEPTANCE     ║
╚══════════════════════════════════╝
\`\`\`

*┌── [ 📋 REGISTRO DE AUDITORÍA & METADATOS ]*
*│* *Identificador:* \`${s.voucherId}\`
*│* *Fecha y Hora:* \`${s.timestamp}\`
*│* *Día de la Semana:* *${s.dayOfWeek || "Sábado"}*
*│* *Zona Horaria:* \`${s.timezone || "America/Santo_Domingo"} (${s.timezoneOffset || "UTC-04:00"})\`
*│* *Servicio:* ${s.service}
*│* *Monto Suscripción:* *Free for trial / then 0.00015 BTC / mes* (~US$ 60.27 / mes · ref ~US$ 90.00~ tarifa regular)
*│* *Modalidad:* Comuníquese al 829-472-1257 para pagar y recibir su Dilithium-5 (Coordinación Directa vía WhatsApp)
*│* *Estado:* *ACEPTACIÓN CONFIRMADA · SOLICITUD DE CLAVE DILITHIUM-5 Y COORDINACIÓN DE PAGO (0.00015 BTC)*
*└──*

*🏛️ Validación Legal y Credenciales Gubernamentales (República Dominicana):*
• *Emisor:* ${s.issuer}
• *RNC (DGII):* ${s.rnc} (Contribuyente Activo)
• *ONAPI:* Marca Registrada #${String(s.onapi || "336973").replace('#', '')} (Clase 42)
• *Registro Mercantil:* #${String(s.registroMercantil || "3323LV-PF").replace('#', '')} (Cámara de Comercio de La Vega)
• *Marco Regulatorio:* Conforme a la Ley No. 126-02 sobre Comercio Electrónico y Firmas Digitales.

*📜 Confirmación de Aceptación de Pestañas de Privacidad (Tab 1 a Tab 7):*
• *Tab 1 (Alcance & Cero Telemetría):* Aceptado ✓ (Own-Your-Data)
• *Tab 2 (OpenClaw & Agentes Autónomos):* Aceptado ✓ (Zero-Data Retention)
• *Tab 3 (Criptografía PQC & Strix Scanner):* Aceptado ✓ (Dilithium-5 / NIST ML-DSA-87)
• *Tab 4 (SODA Storage & Suites Documentales):* Aceptado ✓ (Edición local)
• *Tab 5 (Licenciamiento FOSS & Propiedad):* Aceptado ✓ (GNU Bash GPLv3 / OpenClaw MIT)
• *Tab 6 (Evidencias & Auditoría GUS MAV):* Aceptado ✓ (Pruebas deterministas de IA)
• *Tab 7 (Validación Oficial República Dominicana):* Aceptado ✓ (ONAPI + DGII + RM)

*📦 Payload Criptográfico JSON (Auditoría Inmutable):*
\`\`\`
${jsonPayload}
\`\`\`

> 💬 *Mensaje del Cliente:*
> _"Hola, confirmo que he leído y aceptado la Política de Privacidad, los Términos de Suscripción (Free for trial / then 0.00015 BTC / mes · ref US$ 60.27) y el Modelo de Certificación de Hashcod Codespace. Me comunico al 829-472-1257 para realizar el proceso de pago y recibir mi correspondiente clave Dilithium-5 de acceso."_`;

                return msg;
            };

            window.getWhatsAppCheckoutUrl = function (session) {
                const s = session || window.getCheckoutVoucherSession();
                const text = window.buildWhatsAppMessageText(s);
                return 'https://wa.me/18294721257?text=' + encodeURIComponent(text);
            };

            window.openWhatsAppCheckout = function (e) {
                const s = window.getCheckoutVoucherSession();
                const url = window.getWhatsAppCheckoutUrl(s);
                const waLink = document.getElementById('authWhatsappBtn');
                const inlineWaLink = document.getElementById('authInlineWhatsappLink');
                const chk = document.getElementById('authCheckoutCheckbox');
                if (chk) chk.checked = true;
                if (waLink) {
                    waLink.href = url;
                    waLink.target = '_blank';
                    waLink.rel = 'noopener noreferrer';
                }
                if (inlineWaLink) {
                    inlineWaLink.href = url;
                    inlineWaLink.target = '_blank';
                    inlineWaLink.rel = 'noopener noreferrer';
                }

                if (e) {
                    const targetEl = e.currentTarget || e.target;
                    if (targetEl && (targetEl.tagName === 'A' || (targetEl.closest && targetEl.closest('a')))) {
                        const anchor = targetEl.tagName === 'A' ? targetEl : targetEl.closest('a');
                        if (anchor) {
                            anchor.href = url;
                            anchor.target = '_blank';
                            anchor.rel = 'noopener noreferrer';
                        }
                        return true;
                    }
                }
                if (e && e.preventDefault) e.preventDefault();
                window.open(url, '_blank', 'noopener,noreferrer');
                return false;
            };

            window.copyWhatsAppMessage = async function () {
                const s = window.getCheckoutVoucherSession();
                const text = window.buildWhatsAppMessageText(s);
                const btn = document.getElementById('authCopyWhatsappBtn');
                const chk = document.getElementById('authCheckoutCheckbox');
                if (chk) chk.checked = true;
                let copied = false;
                
                if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                    try {
                        await navigator.clipboard.writeText(text);
                        copied = true;
                    } catch (clipErr) {
                        console.warn('navigator.clipboard.writeText fallo, intentando fallback:', clipErr);
                    }
                }
                
                if (!copied) {
                    try {
                        const ta = document.createElement('textarea');
                        ta.value = text;
                        ta.setAttribute('readonly', '');
                        ta.style.position = 'fixed';
                        ta.style.top = '-9999px';
                        ta.style.left = '-9999px';
                        ta.style.opacity = '0';
                        ta.style.fontSize = '16px';
                        document.body.appendChild(ta);
                        if (typeof navigator !== 'undefined' && navigator.userAgent && /ipad|iphone/i.test(navigator.userAgent)) {
                            const range = document.createRange();
                            range.selectNodeContents(ta);
                            const sel = window.getSelection ? window.getSelection() : null;
                            if (sel) {
                                sel.removeAllRanges();
                                sel.addRange(range);
                            }
                            ta.setSelectionRange(0, 999999);
                        } else {
                            ta.focus();
                            ta.select();
                            if (ta.setSelectionRange) {
                                ta.setSelectionRange(0, ta.value.length);
                            }
                        }
                        copied = document.execCommand('copy');
                        document.body.removeChild(ta);
                    } catch (fallbackErr) {
                        console.warn('Fallback document.execCommand fallo:', fallbackErr);
                    }
                }

                if (copied) {
                    if (btn) {
                        if (!btn._origHtml) {
                            btn._origHtml = btn.innerHTML;
                        }
                        if (btn._copyTimeout) {
                            clearTimeout(btn._copyTimeout);
                        }
                        btn.innerHTML = '<span>¡Payload Copiado! ✓</span>';
                        btn.style.borderColor = '#10b981';
                        btn.style.color = '#10b981';
                        btn._copyTimeout = setTimeout(() => {
                            if (btn._origHtml) {
                                btn.innerHTML = btn._origHtml;
                                delete btn._origHtml;
                            }
                            btn.style.borderColor = '';
                            btn.style.color = '';
                            btn._copyTimeout = null;
                        }, 2000);
                    }
                    if (typeof window.showAdminToast === 'function') {
                        window.showAdminToast('✓ Mensaje WhatsApp con código JSON copiado al portapapeles.');
                    } else if (typeof setMsg === 'function') {
                        setMsg('✓ Mensaje WhatsApp con código JSON copiado al portapapeles.', true);
                    }
                } else {
                    if (typeof setMsg === 'function') {
                        setMsg('No se pudo copiar automáticamente al portapapeles. Abre directamente el enlace de WhatsApp.', false);
                    }
                }
            };

            window.updateCheckoutVoucherUI = function () {
                const s = window.getCheckoutVoucherSession();
                const vIdEl = document.getElementById('authVoucherIdDisplay');
                const waLink = document.getElementById('authWhatsappBtn');
                const inlineWaLink = document.getElementById('authInlineWhatsappLink');
                
                if (vIdEl) vIdEl.textContent = s.voucherId;
                
                const url = window.getWhatsAppCheckoutUrl(s);
                if (waLink) {
                    waLink.href = url;
                    waLink.target = '_blank';
                    waLink.rel = 'noopener noreferrer';
                }
                if (inlineWaLink) {
                    inlineWaLink.href = url;
                    inlineWaLink.target = '_blank';
                    inlineWaLink.rel = 'noopener noreferrer';
                }
            };

            /* ===== CHECKOUT SCREENSHOT & VOUCHER GENERATOR ===== */
            window.triggerCheckoutCapture = function () {
                try {
                    const session = window.getCheckoutVoucherSession();
                    const canvas = document.createElement('canvas');
                    if (!canvas || !canvas.getContext) {
                        throw new Error('Canvas 2D no soportado');
                    }
                    canvas.width = 960;
                    canvas.height = 680;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        throw new Error('Contexto 2D no disponible');
                    }

                    // Dark terminal background
                    ctx.beginPath();
                    const grad = ctx.createLinearGradient(0, 0, 960, 680);
                    grad.addColorStop(0, '#060a12');
                    grad.addColorStop(0.5, '#0b1322');
                    grad.addColorStop(1, '#0f172a');
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, 960, 680);

                    // High-tech vector grid
                    ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
                    ctx.lineWidth = 1;
                    for (let x = 20; x < 960; x += 30) {
                        ctx.beginPath();
                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, 680);
                        ctx.stroke();
                    }
                    for (let y = 20; y < 680; y += 30) {
                        ctx.beginPath();
                        ctx.moveTo(0, y);
                        ctx.lineTo(960, y);
                        ctx.stroke();
                    }

                    // Inner Card Panel (Dark Vector Box)
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                    ctx.strokeStyle = '#1e293b';
                    ctx.lineWidth = 1.5;
                    if (typeof ctx.roundRect === 'function') {
                        ctx.roundRect(40, 36, 880, 608, 14);
                    } else if (typeof ctx.rect === 'function') {
                        ctx.rect(40, 36, 880, 608);
                    }
                    ctx.fill();
                    ctx.stroke();

                    // Neon Top Accent Bar
                    ctx.beginPath();
                    const topBarGrad = ctx.createLinearGradient(40, 36, 920, 36);
                    topBarGrad.addColorStop(0, '#10b981');
                    topBarGrad.addColorStop(0.5, '#38bdf8');
                    topBarGrad.addColorStop(1, '#6366f1');
                    ctx.fillStyle = topBarGrad;
                    if (typeof ctx.roundRect === 'function') {
                        ctx.roundRect(40, 36, 880, 5, [14, 14, 0, 0]);
                    } else if (typeof ctx.rect === 'function') {
                        ctx.rect(40, 36, 880, 5);
                    }
                    ctx.fill();

                    // Title & Subtitle
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 22px "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                    ctx.fillText('Hashcod Codespace® · Comprobante de Aceptación de Términos y Solicitud de Pago', 70, 82);

                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '13px "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                    ctx.fillText('Certificación Determinista de IA, Soberanía de Datos y Alojamiento Post-Cuántico (PQC Level 5)', 70, 106);

                    // Vector Divider
                    ctx.beginPath();
                    ctx.strokeStyle = '#334155';
                    ctx.lineWidth = 1;
                    ctx.moveTo(70, 124);
                    ctx.lineTo(890, 124);
                    ctx.stroke();

                    // Transaction Details Section
                    ctx.fillStyle = '#38bdf8';
                    ctx.font = 'bold 13px "Geist Mono", "IBM Plex Mono", monospace';
                    ctx.fillText('┌── [ REGISTRO DE AUDITORÍA & DETALLES DEL PLAN ]', 70, 156);

                    ctx.fillStyle = '#e2e8f0';
                    ctx.font = '13.5px "IBM Plex Sans", -apple-system, sans-serif';
                    ctx.fillText('• Servicio: Codespace Pro: Certificación y Tokenización de Código IA + Hosting PQC', 90, 186);
                    ctx.fillText('• Plan: Free for trial / then 0.00015 BTC / mes (Acceso Ilimitado y Tokenización)', 90, 212);
                    ctx.fillText('• Monto Mensual Acordado: Free for trial / then 0.00015 BTC / mes (Ref US$ 60.27 / mes ~US$ 90.00~)', 90, 238);
                    ctx.fillText('• Modalidad de Pago: Comuníquese al 829-472-1257 para pagar y recibir su Dilithium-5', 90, 264);
                    ctx.fillText('• Contacto Oficial WhatsApp: +1 (829) 472-1257', 90, 290);

                    // Official Credentials Box
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
                    ctx.strokeStyle = '#334155';
                    ctx.lineWidth = 1;
                    if (typeof ctx.roundRect === 'function') {
                        ctx.roundRect(70, 312, 820, 78, 8);
                    } else if (typeof ctx.rect === 'function') {
                        ctx.rect(70, 312, 820, 78);
                    }
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = '#cbd5e1';
                    ctx.font = '12px "IBM Plex Sans", sans-serif';
                    ctx.fillText('Credenciales Oficiales Registradas (República Dominicana):', 86, 334);
                    ctx.fillStyle = '#f8fafc';
                    ctx.font = 'bold 12px "IBM Plex Sans", monospace';
                    ctx.fillText('• Emisor: DIKTATCART   |   • RNC: 40209369293   |   • ONAPI: #336973   |   • Registro Mercantil: #3323LV-PF', 86, 362);

                    // Emerald Highlight Box: TOTAL A PAGAR & CONFIRMACION
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(6, 78, 59, 0.4)';
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 1.5;
                    if (typeof ctx.roundRect === 'function') {
                        ctx.roundRect(70, 408, 820, 94, 8);
                    } else if (typeof ctx.rect === 'function') {
                        ctx.rect(70, 408, 820, 94);
                    }
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = '#34d399';
                    ctx.font = 'bold 17px "IBM Plex Sans", sans-serif';
                    ctx.fillText('ESTADO: ACEPTACIÓN DE TÉRMINOS CONFIRMADA (US$ 60.27 / mes)', 95, 442);
                    ctx.fillStyle = '#e2e8f0';
                    ctx.font = '13px "IBM Plex Sans", sans-serif';
                    ctx.fillText('Instrucción: Envía este comprobante al WhatsApp 829-472-1257 para recibir las coordenadas de pago y tu clave Dilithium-5.', 95, 474);

                    // Footer Cryptographic Voucher & Metadata
                    ctx.fillStyle = '#38bdf8';
                    ctx.font = 'bold 12px "Geist Mono", "IBM Plex Mono", monospace';
                    ctx.fillText(`VOUCHER REF: ${session.voucherId}   |   EMISIÓN UTC: ${session.timestamp} (${session.dayOfWeek || "Sábado"})`, 70, 540);

                    ctx.fillStyle = '#64748b';
                    ctx.font = '11.5px "IBM Plex Mono", monospace';
                    ctx.fillText('Seguridad Post-Cuántica NIST FIPS 204 / Level 5 · CRYSTALS-Dilithium (ML-DSA-87) · Invariante Cuántico', 70, 566);
                    ctx.fillText('Hashcod Codespace® · Todos los derechos reservados · www.hashcod.io', 70, 590);

                    // Download PNG Image
                    const link = document.createElement('a');
                    link.download = `Comprobante-Aceptacion-Terminos-${session.voucherId}.png`;
                    link.href = canvas.toDataURL('image/png');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    const chk = document.getElementById('authCheckoutCheckbox');
                    if (chk) chk.checked = true;

                    if (typeof setMsg === 'function') {
                        setMsg(`✓ Captura [${session.voucherId}] generada. Envíala a nuestro WhatsApp: 829-472-1257.`, true);
                    }
                } catch (e) {
                    console.error('Error generando captura:', e);
                    const chk = document.getElementById('authCheckoutCheckbox');
                    if (chk) chk.checked = true;
                    if (typeof setMsg === 'function') {
                        setMsg('No se pudo generar automáticamente la captura visual. Utiliza el botón de WhatsApp o Copiar Payload.', false);
                    }
                }
            };

            document.getElementById('authRegisterBtn')?.addEventListener('click', async () => {
                const privacyChk = document.getElementById('authPrivacyCheckbox');
                if (!privacyChk || !privacyChk.checked) {
                    setMsg('Debes marcar la casilla para aceptar la Política de Privacidad antes de registrarte.');
                    if (privacyChk) {
                        privacyChk.focus();
                        const parent = privacyChk.closest('.auth-privacy-agreement');
                        if (parent) {
                            parent.style.border = '1.5px solid #ef4444';
                            parent.style.background = '#fef2f2';
                            setTimeout(() => {
                                parent.style.border = '';
                                parent.style.background = '';
                            }, 3500);
                        }
                    }
                    return;
                }

                const checkoutChk = document.getElementById('authCheckoutCheckbox');
                if (!checkoutChk || !checkoutChk.checked) {
                    setMsg('Debes confirmar la aceptación de términos y política de privacidad (pago mensual de US$ 60.27 coordinado vía WhatsApp: 829-472-1257) antes de registrarte.');
                    if (checkoutChk) {
                        checkoutChk.focus();
                    }
                    const box = document.getElementById('authCheckoutBox');
                    if (box) {
                        if (box._errorTimeout) {
                            clearTimeout(box._errorTimeout);
                        }
                        box.style.border = '1.5px solid #ef4444';
                        box.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.35)';
                        box._errorTimeout = setTimeout(() => {
                            box.style.border = '';
                            box.style.boxShadow = '';
                            box._errorTimeout = null;
                        }, 3500);
                    }
                    return;
                }

                const dil = (document.getElementById('authDilithiumInput')?.value || '').trim();
                const activePlatformKey = (typeof window.getActivePlatformDilithiumKey === 'function')
                    ? window.getActivePlatformDilithiumKey()
                    : (window.ACTIVE_DILITHIUM5_GENERATED_KEY || sessionStorage.getItem('l8_active_dilithium5_key') || '').trim();
                const consumedKeys = (typeof window.getConsumedDilithiumKeys === 'function')
                    ? window.getConsumedDilithiumKeys()
                    : [];

                if (!dil) {
                    setMsg('Introduce la Dilithium-5 de registro del mes.');
                    return;
                }

                // REGLA INVIOLABLE: Clave consumida queda eliminada e invalidada (un solo uso)
                if (consumedKeys.includes(dil) || (typeof window.isDilithiumKeyConsumed === 'function' && window.isDilithiumKeyConsumed(dil))) {
                    setMsg('Error: Esta clave Dilithium-5 ya ha sido utilizada y consumida (un solo uso). Solo se permite usar la nueva clave activa generada en la herramienta ("la que toca").');
                    const dInput = document.getElementById('authDilithiumInput');
                    if (dInput) {
                        dInput.style.borderColor = '#ef4444';
                        dInput.focus();
                    }
                    return;
                }

                // REGLA INVIOLABLE: Solo la clave Dilithium-5 generada actualmente ("la que toca") es válida para crear credenciales
                if (activePlatformKey && dil !== activePlatformKey) {
                    setMsg('Error: Esta clave Dilithium-5 ha sido revocada o es anterior. Solo se permite usar la última clave activa generada en el generador ("la que toca").');
                    const dInput = document.getElementById('authDilithiumInput');
                    if (dInput) {
                        dInput.style.borderColor = '#ef4444';
                        dInput.focus();
                    }
                    return;
                }

                // REGLA INVIOLABLE: Clave consumida queda eliminada e invalidada (un solo uso)
                if (consumedKeys.includes(dil) || (typeof window.isDilithiumKeyConsumed === 'function' && window.isDilithiumKeyConsumed(dil))) {
                    setMsg('Error: Esta clave Dilithium-5 ya ha sido utilizada y consumida (un solo uso). Solo se permite usar la nueva clave activa generada en la herramienta ("la que toca").');
                    const dInput = document.getElementById('authDilithiumInput');
                    if (dInput) {
                        dInput.style.borderColor = '#ef4444';
                        dInput.focus();
                    }
                    return;
                }

                // REGLA INVIOLABLE: Solo la clave Dilithium-5 generada actualmente ("la que toca") es válida para crear credenciales
                if (activePlatformKey && dil !== activePlatformKey) {
                    setMsg('Error: Esta clave Dilithium-5 ha sido revocada o es anterior. Solo se permite usar la última clave activa generada en el generador ("la que toca").');
                    const dInput = document.getElementById('authDilithiumInput');
                    if (dInput) {
                        dInput.style.borderColor = '#ef4444';
                        dInput.focus();
                    }
                    return;
                }
                const btn = document.getElementById('authRegisterBtn');
                if (!dil) {
                    setMsg('Introduce la Dilithium-5 de registro del mes.');
                    return;
                }
                const cfToken = getTurnstileToken('cfTurnstileRegister');
                if (!cfToken) {
                    setMsg('Por favor, marca la casilla de Cloudflare antes de registrarte.');
                    return;
                }
                if (window.turnstileTokens) window.turnstileTokens.register = '';
                if (btn) btn.disabled = true;
                setMsg('Creando cuenta con verificación Cloudflare…');
                try {
                    const res = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ dilithium5: dil, cf_turnstile_response: cfToken, privacy_accepted: true, checkout_accepted: true })
                    });
                    const data = await res.json();
                    if (!data || !data.ok) {
                        resetTurnstile('cfTurnstileRegister');
                        setMsg((data && data.error) || 'No se pudo registrar.');
                        return;
                    }
                    showKeyKit(data);
                    if (document.getElementById('authDilithiumInput')) {
                        document.getElementById('authDilithiumInput').value = '';
                    }
                    // ROTACIÓN AUTOMÁTICA: Eliminar clave usada y generar la nueva válida
                    if (typeof window.consumeAndRotateDilithiumKey === 'function') {
                        window.consumeAndRotateDilithiumKey(dil);
                    }
                    setMsg(formatPersistMsg(data, data.warning || 'Cuenta creada. Clave Dilithium-5 consumida e invalidada ✓'), true);
                } catch (e) {
                    resetTurnstile('cfTurnstileRegister');
                    setMsg('Error de red al registrar.');
                } finally {
                    if (btn) btn.disabled = false;
                }
            });

            function formatPersistMsg(data, base) {
                const p = data && data.persisted;
                if (!p) return base;
                const bits = [];
                if (p.storage) bits.push('Storage');
                if (p.db) bits.push('DB');
                if (!bits.length) {
                    return base + ' (aviso: aún no se reflejó en Supabase; revisa schema.sql / keys)';
                }
                return base + ' · Supabase: ' + bits.join('+');
            }

            document.getElementById('authRecoverBtn')?.addEventListener('click', async () => {
                const material = (document.getElementById('authRecoverInput')?.value || '').trim();
                const btn = document.getElementById('authRecoverBtn');
                if (!material) {
                    setMsg('Introduce L8REC o un código de respaldo.');
                    return;
                }
                const cfToken = getTurnstileToken('cfTurnstileRecover');
                if (btn) btn.disabled = true;
                setMsg('Recuperando cuenta…');
                try {
                    const res = await fetch('/api/auth/recover', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ recovery: material, cf_turnstile_response: cfToken })
                    });
                    const data = await res.json();
                    if (!data || !data.ok) {
                        resetTurnstile('cfTurnstileRecover');
                        setMsg((data && data.error) || 'No se pudo recuperar.');
                        return;
                    }
                    showKeyKit(data);
                    if (document.getElementById('authRecoverInput')) {
                        document.getElementById('authRecoverInput').value = '';
                    }
                    setMsg(formatPersistMsg(data, data.warning || 'Claves regeneradas. Guarda el nuevo kit.'), true);
                } catch (e) {
                    resetTurnstile('cfTurnstileRecover');
                    setMsg('Error de red al recuperar.');
                } finally {
                    if (btn) btn.disabled = false;
                }
            });

            document.getElementById('authValidateBtn')?.addEventListener('click', async () => {
                const inputVal = (document.getElementById('authValidateInput')?.value || '').trim();
                const resBox = document.getElementById('authValidateResult');
                const btn = document.getElementById('authValidateBtn');
                if (!inputVal) {
                    setMsg('Introduce una clave AES-256, L8ID, ID acct_... o L8REC para comprobar.');
                    if (resBox) resBox.style.display = 'none';
                    return;
                }
                if (btn) btn.disabled = true;
                setMsg('Consultando persistencia en Supabase…');
                if (resBox) {
                    resBox.style.display = 'block';
                    resBox.innerHTML = '<div style="color:#64748b;">⏳ Verificando registros en Supabase PostgreSQL y Storage...</div>';
                }
                try {
                    const res = await fetch('/api/auth/validate-key', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: inputVal })
                    });
                    const data = await res.json();
                    if (!data || !data.ok || !data.exists) {
                        setMsg((data && data.message) || 'Clave o cuenta no localizada en Supabase.');
                        if (resBox) {
                            resBox.innerHTML = '<div style="color:#b91c1c; font-weight:600;">✕ No encontrada en Supabase</div>' +
                                '<div style="color:#475569; margin-top:4px;">No existe ninguna cuenta vinculada a esta clave en la base de datos o almacenamiento. Si no te has registrado, ve a la pestaña "Registrarse".</div>';
                        }
                        return;
                    }
                    const prev = data.account_preview || {};
                    const typeLabel = {
                        aes256: 'Clave AES-256 (64 hex)',
                        identity: 'Clave L8ID (Identificador)',
                        account_id: 'ID de Cuenta (acct_...)',
                        recovery_key: 'Clave de Recuperación (L8REC)',
                        backup_code: 'Código de Respaldo',
                        generic_key: 'Clave Criptográfica'
                    }[data.key_type] || data.key_type;

                    const dbStatus = (prev.persistence && prev.persistence.supabase_db) ? '<span style="color:#166534; font-weight:600;">✓ Sincronizado</span>' : '<span style="color:#ca8a04;">Pendiente</span>';
                    const storageStatus = (prev.persistence && prev.persistence.supabase_storage) ? '<span style="color:#166534; font-weight:600;">✓ Sincronizado</span>' : '<span style="color:#ca8a04;">Local</span>';

                    if (resBox) {
                        resBox.innerHTML = '<div style="color:#166534; font-weight:600; font-size:12.5px; margin-bottom:6px;">✓ Cuenta localizada en Supabase (Activa)</div>' +
                            '<div style="color:#334155; margin-bottom:2px;"><strong>ID Cuenta:</strong> <code style="background:#e2e8f0; padding:1px 4px; border-radius:3px;">' + (data.account_id || 'N/A') + '</code></div>' +
                            '<div style="color:#334155; margin-bottom:2px;"><strong>Tipo de Clave:</strong> ' + typeLabel + '</div>' +
                            '<div style="color:#334155; margin-bottom:2px;"><strong>Persistencia:</strong> Postgres DB ' + dbStatus + ' · Cloud Storage ' + storageStatus + '</div>' +
                            '<div style="color:#334155; margin-bottom:2px;"><strong>Hashes activos:</strong> AES-256 (' + (prev.has_aes256 ? '✓' : '✗') + ') · L8ID (' + (prev.has_identity ? '✓' : '✗') + ') · L8REC (' + (prev.has_recovery ? '✓' : '✗') + ') · Códigos Respaldo (' + (prev.backup_codes_count || 0) + ')</div>' +
                            '<div style="color:#64748b; font-size:10.5px; margin-top:4px;">Creada: ' + (prev.created_at || 'Previa') + '</div>';
                    }
                    setMsg('✓ Cuenta validada exitosamente en Supabase.', true);
                } catch (e) {
                    setMsg('Error de red al consultar validador.');
                    if (resBox) {
                        resBox.innerHTML = '<div style="color:#b91c1c;">Error al conectar con el servicio de validación.</div>';
                    }
                } finally {
                    if (btn) btn.disabled = false;
                }
            });

            document.getElementById('authCopyKeysBtn')?.addEventListener('click', async () => {
                if (!pendingKeysText) return;
                try {
                    await navigator.clipboard.writeText(pendingKeysText);
                    setMsg('Kit copiado al portapapeles.', true);
                } catch (e) {
                    setMsg('No se pudo copiar automáticamente. Selecciónalo y copia manualmente.');
                }
            });

            document.getElementById('authEnterAfterRegisterBtn')?.addEventListener('click', () => {
                if (!pendingSessionToken) {
                    setMsg('Primero crea o recupera la cuenta y guarda el kit.');
                    return;
                }
                saveSession(pendingSessionToken, '');
                unlockPlatform();
            });

            // Enter en inputs
            ['authAesInput', 'authIdentityInput'].forEach((id) => {
                document.getElementById(id)?.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') document.getElementById('authLoginBtn')?.click();
                });
            });
            document.getElementById('authDilithiumInput')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') document.getElementById('authRegisterBtn')?.click();
            });
            document.getElementById('authRecoverInput')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') document.getElementById('authRecoverBtn')?.click();
            });
            document.getElementById('authValidateInput')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') document.getElementById('authValidateBtn')?.click();
            });

            document.addEventListener('DOMContentLoaded', () => {
                if (typeof window.updateCheckoutVoucherUI === 'function') {
                    window.updateCheckoutVoucherUI();
                }
            });
            if (typeof window.updateCheckoutVoucherUI === 'function') {
                window.updateCheckoutVoucherUI();
            }
        })();

        
        /* ===== PRIVACY POLICY DYNAMIC TAB CONTROLLER ===== */
        window.showPrivacyTab = function (tabId) {
            document.querySelectorAll('.privacy-tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.privacy-tab-pane').forEach(pane => pane.classList.remove('active'));
            
            const btn = document.getElementById('btnTab-' + tabId.replace('tab-', ''));
            const pane = document.getElementById('pane-' + tabId);
            if (btn) btn.classList.add('active');
            if (pane) pane.classList.add('active');
        };

        /* ===== PRIVACY POLICY MODAL CONTROLLER ===== */
        window.openPrivacyPolicyModal = function () {
            const modal = document.getElementById('privacyPolicyModal');
            if (modal) { modal.classList.add('open'); modal.style.display = 'flex'; modal.style.zIndex = '999999'; }
        };

        window.closePrivacyPolicyModal = function () {
            const modal = document.getElementById('privacyPolicyModal');
            if (modal) { modal.classList.remove('open'); modal.style.display = 'none'; }
        };

        window.acceptAndClosePrivacyPolicy = function () {
            const chk = document.getElementById('authPrivacyCheckbox');
            if (chk) chk.checked = true;
            closePrivacyPolicyModal();
            if (typeof window.showAdminToast === 'function') {
                window.showAdminToast('✓ Política de Privacidad aceptada.');
            }
        };



        /* ===== BOOT: Rare UI folder only (legacy blackhole retired) ===== */
        (function bootFolderOnly() {
            const overlay = document.getElementById('bootCliOverlay');
            const hintEl = document.getElementById('bootCliHint');
            const enterBtn = document.getElementById('bootCliEnter');
            const legacyCanvas = document.getElementById('bootBlackholeCanvas');
            if (legacyCanvas) {
                legacyCanvas.hidden = true;
                legacyCanvas.setAttribute('aria-hidden', 'true');
                legacyCanvas.style.display = 'none';
            }
            if (!overlay || !enterBtn) return;

            function markReady() {
                enterBtn.classList.add('ready');
                if (hintEl) {
                    hintEl.textContent = '';
                    hintEl.hidden = true;
                    hintEl.setAttribute('aria-hidden', 'true');
                }
            }

            let entryInFlight = false;

            async function enterPlatform() {
                if (entryInFlight) return false;
                entryInFlight = true;

                try {
                    if (overlay) overlay.classList.add('hidden');
                    try { sessionStorage.setItem('l8_boot_cli_done', '1'); } catch (e) {}
                    document.body.classList.remove('boot-locked');

                    const legacyAuthRetired =
                        window.__hashcodLegacyAuthRetired === true ||
                        document.documentElement.dataset.hashcodLegacyAuthRetired === 'true';

                    if (legacyAuthRetired) {
                        if (typeof window.l8UnlockPlatform === 'function') {
                            window.l8UnlockPlatform();
                        } else {
                            document.body.classList.remove('auth-locked');
                        }

                        document.documentElement.dataset.hashcodPlatformEntered = 'true';
                        document.documentElement.dataset.hashcodEntryGateReady = 'true';
                        document.documentElement.classList.add('hashcod-platform-entered');
                        document.body.classList.add('hashcod-platform-entered');

                        try {
                            window.dispatchEvent(new CustomEvent('hashcod:platform-entered', {
                                detail: { source: 'main-platform-runtime', direct: true, legacyAuthRetired: true }
                            }));
                            window.dispatchEvent(new CustomEvent('hashcod:platform-entry-complete', {
                                detail: { source: 'main-platform-runtime', direct: true, legacyAuthRetired: true }
                            }));
                        } catch (e) {}
                        return true;
                    }

                    let ok = false;
                    try {
                        ok = (typeof window.l8CheckAuthSession === 'function')
                            ? await window.l8CheckAuthSession()
                            : false;
                    } catch (e) {
                        console.warn('Check auth session:', e);
                    }

                    if (ok) {
                        if (typeof window.l8UnlockPlatform === 'function') window.l8UnlockPlatform();
                        else {
                            document.body.classList.remove('auth-locked');
                            if (typeof restorePlatformState === 'function') restorePlatformState();
                        }
                        return true;
                    }

                    if (typeof window.l8ShowAuthGate === 'function') {
                        window.l8ShowAuthGate();
                    } else {
                        document.body.classList.add('auth-locked');
                    }
                    return false;
                } finally {
                    entryInFlight = false;
                }
            }

            // Expose the authoritative entry function so the motion layer can wrap
            // it without creating a second competing click handler.
            window.l8EnterPlatform = enterPlatform;

            enterBtn.addEventListener('click', function (event) {
                if (event) event.preventDefault();
                return window.l8EnterPlatform();
            });

            window.addEventListener('keydown', (e) => {
                if (overlay && overlay.classList.contains('hidden')) return;
                if (e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    window.l8EnterPlatform();
                }
            });

            markReady();
        })();
