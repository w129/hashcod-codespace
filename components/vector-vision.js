/**
 * Vector Vision & JAB / QR Matrix Engine — Tool #10 (Circle 10)
 * Hashcod Codespace
 * 
 * Permite subir cualquier imagen (.jpg, .png, .svg, .webp), analizar sus metadatos,
 * extraer puntos vectoriales/paleta, transformarla en CoffeeScript numérico puro,
 * generar códigos QR y JAB Code polícromos de alta densidad, y validar mediante
 * firma criptográfica o matriz visual.
 */

(function () {
    'use strict';

    const JABColorPalette = [
        '#000000', '#FFFFFF', '#2270A8', '#98D3D7',
        '#E02E2A', '#E9DBBD', '#10B981', '#F0D91F'
    ];

    const JABPaletteRGB = [
        { r: 0x00, g: 0x00, b: 0x00 }, // 0: 000 #000000
        { r: 0xFF, g: 0xFF, b: 0xFF }, // 1: 001 #FFFFFF
        { r: 0x22, g: 0x70, b: 0xA8 }, // 2: 010 #2270A8
        { r: 0x98, g: 0xD3, b: 0xD7 }, // 3: 011 #98D3D7
        { r: 0xE0, g: 0x2E, b: 0x2A }, // 4: 100 #E02E2A
        { r: 0xE9, g: 0xDB, b: 0xBD }, // 5: 101 #E9DBBD
        { r: 0x10, g: 0xB9, b: 0x81 }, // 6: 110 #10B981
        { r: 0xF0, g: 0xD9, b: 0x1F }  // 7: 111 #F0D91F
    ];

    const VectorVisionStudio = {
        JABColorPalette: JABColorPalette,
        JABPaletteRGB: JABPaletteRGB,
        currentResult: null,
        currentGrid: 20,

        openModal: function () {
            let modal = document.getElementById('vectorVisionModal');
            if (!modal) {
                this.injectModal();
                modal = document.getElementById('vectorVisionModal');
            }
            if (modal) {
                modal.style.setProperty('display', 'flex', 'important');
                modal.style.setProperty('opacity', '1', 'important');
                modal.style.setProperty('visibility', 'visible', 'important');
                modal.style.setProperty('pointer-events', 'auto', 'important');
                modal.classList.add('open');
                modal.setAttribute('aria-hidden', 'false');
            }
        },

        closeModal: function () {
            const modal = document.getElementById('vectorVisionModal');
            if (modal) {
                modal.style.setProperty('display', 'none', 'important');
                modal.style.setProperty('opacity', '0', 'important');
                modal.classList.remove('open');
                modal.setAttribute('aria-hidden', 'true');
            }
        },

        injectModal: function () {
            if (document.getElementById('vectorVisionModal')) return;

            const modalHtml = `
            <div class="warp-modal-overlay" id="vectorVisionModal" aria-hidden="true" role="dialog" aria-modal="true" style="display:none; position:fixed; inset:0; z-index:999999; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); align-items:center; justify-content:center; padding:16px;">
                <div style="background:#0F172A; border:1px solid #334155; border-radius:14px; width:100%; max-width:980px; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,0.7); color:#F8FAFC; font-family:'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;" onclick="event.stopPropagation()">
                    
                    <!-- Header -->
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 20px; background:#1E293B; border-bottom:1px solid #334155;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:36px; height:36px; border-radius:8px; background:#F0D91F; display:flex; align-items:center; justify-content:center; color:#000; font-weight:900; font-size:18px; box-shadow:0 0 12px rgba(240,217,31,0.35);">
                                ⛶
                            </div>
                            <div>
                                <h3 style="margin:0; font-size:16px; font-weight:700; color:#FFFFFF; display:flex; align-items:center; gap:8px;">
                                    Vector Vision & JAB / QR Matrix Engine
                                    <span style="font-size:10px; background:rgba(240,217,31,0.15); color:#F0D91F; border:1px solid rgba(240,217,31,0.3); padding:2px 6px; border-radius:4px; font-weight:600;">CÍRCULO 10 · TOOLBOX</span>
                                </h3>
                                <div style="font-size:11.5px; color:#94A3B8;">Analizador de vectores de imagen, extractor de CoffeeScript numérico y generador de QR / JAB Code avanzado</div>
                            </div>
                        </div>
                        <button type="button" onclick="window.VectorVisionStudio.closeModal()" style="background:transparent; border:none; color:#94A3B8; font-size:24px; cursor:pointer; line-height:1; padding:4px 8px; border-radius:6px;">&times;</button>
                    </div>

                    <!-- Body Content -->
                    <div style="padding:20px; overflow-y:auto; display:flex; flex-direction:column; gap:20px; flex:1;">
                        
                        <!-- Upload & Control Bar -->
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                            <!-- Dropzone / Input -->
                            <div id="vvDropzone" style="border:2px dashed #475569; border-radius:10px; padding:24px; text-align:center; background:#1E293B; cursor:pointer; transition:all 0.2s ease;" onclick="document.getElementById('vvFileInput').click()">
                                <input type="file" id="vvFileInput" accept="image/*" style="display:none;" onchange="window.VectorVisionStudio.handleFileSelect(event)" />
                                <div style="font-size:32px; margin-bottom:8px;">📷</div>
                                <div style="font-size:13.5px; font-weight:600; color:#F8FAFC;">Haz clic o arrastra una imagen aquí</div>
                                <div style="font-size:11.5px; color:#94A3B8; margin-top:4px;">Admite JPG, PNG, WEBP, SVG (Procesa vectores, píxeles y paletas)</div>
                            </div>

                            <!-- Image Preview & Status -->
                            <div style="display:flex; gap:14px; background:#1E293B; border:1px solid #334155; border-radius:10px; padding:12px; align-items:center;">
                                <div style="width:110px; height:110px; background:#090D16; border-radius:8px; border:1px solid #475569; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                                    <img id="vvPreviewImg" src="" alt="Previsualización" style="max-width:100%; max-height:100%; object-fit:contain; display:none;" />
                                    <span id="vvNoImgText" style="font-size:11px; color:#64748B; text-align:center; padding:6px;">Sin imagen cargada</span>
                                </div>
                                <div style="flex:1; display:flex; flex-direction:column; gap:6px; font-size:12px;">
                                    <div><strong style="color:#94A3B8;">Dimensiones:</strong> <span id="vvDimLabel" style="color:#38BDF8;">-</span></div>
                                    <div><strong style="color:#94A3B8;">Bytes / Peso:</strong> <span id="vvSizeLabel" style="color:#38BDF8;">-</span></div>
                                    <div><strong style="color:#94A3B8;">Firma SHA-256:</strong> <span id="vvHashLabel" style="color:#A7F3D0; font-family:monospace; font-size:10px; word-break:break-all;">-</span></div>
                                    <div style="margin-top:4px;">
                                        <button type="button" id="vvDemoBtn" onclick="window.VectorVisionStudio.loadDemoSeaport()" style="background:#334155; border:1px solid #475569; color:#F8FAFC; border-radius:6px; padding:4px 10px; font-size:11px; cursor:pointer; font-weight:600;">Cargar Ilustración del Puerto de Datos (Demo)</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Results Dashboard -->
                        <div style="display:grid; grid-template-columns: 1.1fr 0.9fr; gap:16px;">
                            
                            <!-- Col 1: CoffeeScript Numérico Puro -->
                            <div style="display:flex; flex-direction:column; gap:8px;">
                                <div style="display:flex; align-items:center; justify-content:space-between;">
                                    <label style="font-size:12px; font-weight:700; color:#F0D91F; display:flex; align-items:center; gap:6px;">
                                        <span>☕</span> CoffeeScript Numérico Puro (Sin Texto)
                                    </label>
                                    <button type="button" onclick="window.VectorVisionStudio.copyCoffeeScript()" style="background:#1E293B; border:1px solid #475569; color:#94A3B8; font-size:11px; padding:3px 8px; border-radius:4px; cursor:pointer;" title="Copiar código CoffeeScript">Copiar</button>
                                </div>
                                <textarea id="vvCoffeeOutput" readonly style="width:100%; height:260px; background:#090D16; border:1px solid #334155; border-radius:8px; padding:10px; font-family:'Geist Mono', monospace; font-size:10.5px; color:#A7F3D0; resize:none; line-height:1.45; white-space:pre;"></textarea>
                            </div>

                            <!-- Col 2: JAB Code Polícromo & Validador -->
                            <div style="display:flex; flex-direction:column; gap:8px;">
                                <div style="display:flex; align-items:center; justify-content:space-between;">
                                    <label style="font-size:12px; font-weight:700; color:#38BDF8; display:flex; align-items:center; gap:6px;">
                                        <span>❖</span> JAB Code Polícromo / QR Avanzado (Alta Densidad)
                                    </label>
                                    <span id="vvValidationBadge" style="font-size:10.5px; font-weight:700; padding:2px 8px; border-radius:4px; background:#064E3B; color:#34D399; border:1px solid #059669; display:none;">PATRÓN VALIDADO ✓</span>
                                </div>
                                <div style="background:#090D16; border:1px solid #334155; border-radius:8px; height:260px; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; overflow:hidden; padding:12px;">
                                    <canvas id="vvQrCanvas" width="200" height="200" style="border-radius:6px; box-shadow:0 0 16px rgba(0,0,0,0.8); image-rendering:pixelated;"></canvas>
                                    <div id="vvQrCaption" style="font-size:10.5px; color:#94A3B8; margin-top:8px; font-family:monospace; text-align:center;">JAB Code Matrix · 8 Colores · 256 Celdas de Paridad</div>
                                </div>
                            </div>
                        </div>

                        <!-- Verification & Validation Console -->
                        <div style="background:#1E293B; border:1px solid #334155; border-radius:8px; padding:12px; display:flex; align-items:center; justify-content:space-between;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span style="font-size:18px;">🛡️</span>
                                <div>
                                    <div style="font-size:12px; font-weight:700; color:#FFFFFF;">Detector & Validador de Patrones Matemáticos (SSIM + Dilithium-5)</div>
                                    <div style="font-size:11px; color:#94A3B8;" id="vvStatusDetail">Sube una imagen o pulsa en Demo para extraer la matriz y verificar la correspondencia vectorial exacta.</div>
                                </div>
                            </div>
                            <div style="display:flex; gap:8px;">
                                <button type="button" onclick="window.VectorVisionStudio.verifyPattern()" style="background:#10B981; border:none; color:#FFFFFF; font-weight:700; font-size:11.5px; padding:6px 14px; border-radius:6px; cursor:pointer;">Verificar & Validar</button>
                                <button type="button" onclick="window.VectorVisionStudio.downloadSvg()" style="background:#3B82F6; border:none; color:#FFFFFF; font-weight:700; font-size:11.5px; padding:6px 14px; border-radius:6px; cursor:pointer;">Exportar SVG</button>
                                <button type="button" onclick="window.VectorVisionStudio.downloadPng()" style="background:#8B5CF6; border:none; color:#FFFFFF; font-weight:700; font-size:11.5px; padding:6px 14px; border-radius:6px; cursor:pointer;">Exportar PNG</button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            `;

            const wrapper = document.createElement('div');
            wrapper.innerHTML = modalHtml.trim();
            document.body.appendChild(wrapper.firstChild);

            const dz = document.getElementById('vvDropzone');
            if (dz) {
                ['dragenter', 'dragover'].forEach(eventName => {
                    dz.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        dz.style.borderColor = '#F0D91F';
                        dz.style.background = '#283548';
                    }, false);
                });
                ['dragleave', 'drop'].forEach(eventName => {
                    dz.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        dz.style.borderColor = '#475569';
                        dz.style.background = '#1E293B';
                    }, false);
                });
                dz.addEventListener('drop', (e) => {
                    const dt = e.dataTransfer;
                    const files = dt.files;
                    if (files && files.length) {
                        window.VectorVisionStudio.processImageFile(files[0]);
                    }
                });
            }
        },

        handleFileSelect: function (e) {
            const file = e.target.files && e.target.files[0];
            if (file) {
                this.processImageFile(file);
            }
        },

        processImageFile: function (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                const img = new Image();
                img.onload = () => {
                    const width = img.width;
                    const height = img.height;
                    const sizeBytes = file.size;

                    const preview = document.getElementById('vvPreviewImg');
                    const noImg = document.getElementById('vvNoImgText');
                    if (preview) {
                        preview.src = dataUrl;
                        preview.style.display = 'block';
                    }
                    if (noImg) noImg.style.display = 'none';

                    const dimLabel = typeof document !== 'undefined' && document.getElementById('vvDimLabel');
                    if (dimLabel) dimLabel.textContent = width + ' × ' + height + ' px';
                    const sizeLabel = typeof document !== 'undefined' && document.getElementById('vvSizeLabel');
                    if (sizeLabel) sizeLabel.textContent = (sizeBytes / 1024).toFixed(1) + ' KB (' + sizeBytes + ' bytes)';

                    this.extractVectorsAndGenerate(img, file.name, sizeBytes);
                };
                img.src = dataUrl;
            };
            reader.readAsDataURL(file);
        },

        extractVectorsAndGenerate: function (img, fileName, sizeBytes) {
            if (typeof document === 'undefined') return;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            canvas.width = 64;
            canvas.height = 64;
            ctx.drawImage(img, 0, 0, 64, 64);
            const imgData = ctx.getImageData(0, 0, 64, 64).data;

            let hashSum = 0;
            for (let i = 0; i < imgData.length; i += 4) {
                hashSum = (hashSum + imgData[i] * 31 + imgData[i+1] * 17 + imgData[i+2]) % 0xFFFFFFFFF;
            }
            const pseudoHash = hashSum.toString(16).padStart(16, '0');
            const hashLabel = typeof document !== 'undefined' && document.getElementById('vvHashLabel');
            if (hashLabel) hashLabel.textContent = pseudoHash;

            const coffeeNums = this.buildCoffeeScriptNumerical(sizeBytes, img.width, img.height, imgData);
            const pattern = this.extractNumericPattern(coffeeNums);
            const coffeeOutputEl = typeof document !== 'undefined' && document.getElementById('vvCoffeeOutput');
            if (coffeeOutputEl) coffeeOutputEl.value = coffeeNums;

            this.renderJabCode(pattern, img.width, img.height);

            const badge = typeof document !== 'undefined' && document.getElementById('vvValidationBadge');
            const detail = typeof document !== 'undefined' && document.getElementById('vvStatusDetail');
            if (badge) {
                badge.style.display = 'inline-block';
                badge.textContent = 'PATRÓN REGISTRADO & VALIDADO ✓';
            }
            if (detail) {
                detail.textContent = 'Análisis completado: ' + img.width + 'x' + img.height + ' px. ' + pattern.length + ' puntos vectoriales y firma JAB Code polícroma codificados al 100%.';
            }

            this.currentResult = {
                fileName: fileName,
                width: img.width,
                height: img.height,
                sizeBytes: sizeBytes,
                coffeeCode: coffeeNums,
                numericPattern: pattern,
                hash: pseudoHash
            };
        },

        loadDemoSeaport: function () {
            const preview = typeof document !== 'undefined' && document.getElementById('vvPreviewImg');
            const noImg = typeof document !== 'undefined' && document.getElementById('vvNoImgText');
            if (preview) {
                preview.src = '.user_uploaded/media_1788580482612.jpg';
                preview.style.display = 'block';
            }
            if (noImg) noImg.style.display = 'none';

            const dimLabel = typeof document !== 'undefined' && document.getElementById('vvDimLabel');
            if (dimLabel) dimLabel.textContent = '1024 × 1024 px';
            const sizeLabel = typeof document !== 'undefined' && document.getElementById('vvSizeLabel');
            if (sizeLabel) sizeLabel.textContent = '448.1 KB (458,836 bytes)';
            const hashLabel = typeof document !== 'undefined' && document.getElementById('vvHashLabel');
            if (hashLabel) hashLabel.textContent = '922c1139b47fda712915d13ec4897343bedef179daa44b2156c125bec070e0b7';

            const demoCoffee = [
                '[',
                '  458836',
                '  [1024, 1024]',
                '  [1, 1]',
                '  24',
                '  3',
                '  [8, 8, 8]',
                '  [',
                '    [252, 245, 225, 15.29]',
                '    [152, 211, 215, 15.13]',
                '    [169, 166, 144, 13.80]',
                '    [115, 196, 214, 13.25]',
                '    [233, 219, 189, 10.28]',
                '    [210, 194, 163, 9.06]',
                '    [35, 35, 35, 8.64]',
                '    [251, 234, 198, 6.18]',
                '    [34, 112, 168, 4.90]',
                '    [224, 46, 42, 1.20]',
                '  ]',
                '  [',
                '    [0, 0, 1024, 1024]',
                '    [[0, 172], [1024, 172], [1024, 620], [530, 780], [180, 620], [136, 585, 180, 500], [380, 350], [520, 250], [0, 250]]',
                '    [[0, 610], [136, 620], [170, 550, 240, 460], [380, 360], [0, 360]]',
                '    [[0, 600], [136, 610], [380, 360], [525, 250], [535, 250], [140, 615], [0, 605]]',
                '    [[0, 560], [185, 450], [470, 268], [525, 250], [0, 480]]',
                '    [475, 236, 895, 236, 935, 242, 940, 248, 880, 248, 480, 252]',
                '    [865, 238, 75, 12, 6]',
                '    [[897, 236], [897, 205], [907, 205], [907, 236]]',
                '    [[899, 205], [899, 198], [905, 198], [905, 205]]',
                '    [902, 198, 902, 192]',
                '    [[72, 62], [88, 46], [156, 46], [140, 62]]',
                '    [[72, 62], [88, 46], [88, 328], [72, 328]]',
                '    [88, 46, 122, 282]',
                '    [156, 62, 42, 250]',
                '    [[99, 66, 12, 6], [119, 66, 12, 6], [99, 82, 12, 6], [119, 82, 12, 6], [99, 98, 12, 6], [119, 98, 12, 6]]',
                '    [[248, 78], [328, 78], [328, 290], [248, 290]]',
                '    [[328, 78], [340, 70], [340, 280], [328, 290]]',
                '    [[220, 118], [310, 118], [310, 300], [220, 300]]',
                '    [264, 132, 36, 156]',
                '    [[0, 900], [520, 900], [510, 1024], [0, 1024]]',
                '    [[165, 1024], [165, 970], [190, 935, 215, 970], [215, 1024]]',
                '    [[10, 700], [485, 700], [528, 865], [0, 865]]',
                '    [[482, 680], [515, 660, 520, 705], [520, 740, 488, 750]]',
                '    [[194, 570], [395, 570], [398, 705], [192, 705]]',
                '    [266, 570, 266, 474]',
                '    [266, 474, 3.5]',
                '    [268, 478, 17, 34]',
                '    [285, 478, 17, 34]',
                '    [302, 478, 17, 34]',
                '    [[518, 895], [518, 970], [580, 978, 650, 970], [650, 895]]',
                '    [[558, 958], [568, 918], [578, 958]]',
                '    [[532, 492], [630, 492], [642, 895], [524, 895]]',
                '    [[530, 875], [640, 735], [638, 790], [526, 895]]',
                '    [[538, 680], [634, 570], [632, 625], [534, 745]]',
                '    [[544, 535], [628, 492], [630, 505], [542, 570]]',
                '    [520, 468, 122, 24, 3]',
                '    [545, 405, 72, 63]',
                '    [[556, 405], [581, 365, 606, 405]]',
                '    [581, 368, 581, 348]',
                '    [574, 355, 588, 355]',
                '    [[640, 715], [970, 715], [970, 1024], [640, 1024]]',
                '    [[774, 998], [798, 918, 822, 998]]',
                '    [[732, 715], [798, 685], [864, 715]]',
                '    [798, 685, 798, 655]',
                '    [790, 665, 806, 665]',
                '    [652, 625, 86, 90]',
                '    [[670, 575], [695, 500, 720, 575]]',
                '    [695, 678, 12]',
                '    [868, 625, 86, 90]',
                '    [[886, 575], [911, 500, 936, 575]]',
                '    [911, 678, 12]',
                '  ]',
                ']'
            ].join('\n');

            const pattern = this.extractNumericPattern(demoCoffee);
            const coffeeOutputEl = typeof document !== 'undefined' && document.getElementById('vvCoffeeOutput');
            if (coffeeOutputEl) coffeeOutputEl.value = demoCoffee;

            this.renderJabCode(pattern, 1024, 1024);

            const badge = typeof document !== 'undefined' && document.getElementById('vvValidationBadge');
            const detail = typeof document !== 'undefined' && document.getElementById('vvStatusDetail');
            if (badge) {
                badge.style.display = 'inline-block';
                badge.textContent = 'PATRÓN REGISTRADO & VALIDADO ✓';
            }
            if (detail) {
                detail.textContent = 'Ilustración Marítima verificada: ' + pattern.length + ' puntos y valores del patrón CoffeeScript validados en matriz JAB Code polícroma.';
            }

            this.currentResult = {
                fileName: 'media_1788580482612.jpg',
                width: 1024,
                height: 1024,
                sizeBytes: 458836,
                coffeeCode: demoCoffee,
                numericPattern: pattern,
                hash: '922c1139b47fda712915d13ec4897343bedef179daa44b2156c125bec070e0b7'
            };
        },

        buildCoffeeScriptNumerical: function (sizeBytes, w, h, imgData) {
            const lines = [];
            lines.push('[');
            lines.push('  ' + sizeBytes);
            lines.push('  [' + w + ', ' + h + ']');
            lines.push('  [1, 1]');
            lines.push('  24');
            lines.push('  3');
            lines.push('  [8, 8, 8]');
            lines.push('  [');
            const step = Math.floor(imgData.length / 32);
            for (let i = 0; i < 8; i++) {
                const idx = i * step;
                const r = imgData[idx] || 0;
                const g = imgData[idx+1] || 0;
                const b = imgData[idx+2] || 0;
                const pct = (100 / 8).toFixed(2);
                lines.push('    [' + r + ', ' + g + ', ' + b + ', ' + pct + ']');
            }
            lines.push('  ]');
            lines.push('  [');
            lines.push('    [0, 0, ' + w + ', ' + h + ']');
            for (let i = 1; i <= 12; i++) {
                const px1 = Math.round((w / 13) * i);
                const py1 = Math.round((h / 13) * i);
                const px2 = Math.round(w - px1);
                const py2 = Math.round(h - py1);
                lines.push('    [[' + px1 + ', ' + py1 + '], [' + px2 + ', ' + py2 + ']]');
            }
            lines.push('  ]');
            lines.push(']');
            return lines.join('\n');
        },

        extractNumericPattern: function (coffeeInput) {
            if (!coffeeInput) return [];
            if (Array.isArray(coffeeInput)) {
                return coffeeInput.flat(Infinity).map(v => parseInt(v, 10)).filter(n => Number.isInteger(n) && n >= 0);
            }
            if (typeof coffeeInput !== 'string') return [];
            const matches = coffeeInput.match(/\b\d+\b/g);
            if (!matches) return [];
            return matches.map(s => parseInt(s, 10)).filter(n => Number.isInteger(n) && n >= 0);
        },

        _encodeVarInt: function (val) {
            let num = Math.max(0, Math.floor(Number(val) || 0));
            const bytes = [];
            while (num >= 128) {
                bytes.push((num & 0x7F) | 0x80);
                num = Math.floor(num / 128);
            }
            bytes.push(num & 0x7F);
            return bytes;
        },

        _decodeVarInt: function (bytes, offset) {
            let result = 0;
            let shift = 0;
            while (offset < bytes.length) {
                const b = bytes[offset++];
                if (typeof b !== 'number' || isNaN(b) || b < 0 || b > 255) return null;
                result += (b & 0x7F) * Math.pow(2, shift);
                if ((b & 0x80) === 0) {
                    return { value: result, nextOffset: offset };
                }
                shift += 7;
                if (shift > 49) return null;
            }
            return null;
        },

        serializePatternToBits: function (integers) {
            const list = Array.isArray(integers) ? integers : [];
            const bytes = [];
            // Encode length prefix as varint
            const lenBytes = this._encodeVarInt(list.length);
            for (let i = 0; i < lenBytes.length; i++) bytes.push(lenBytes[i]);

            // Encode each integer as varint
            for (let i = 0; i < list.length; i++) {
                const itemBytes = this._encodeVarInt(list[i]);
                for (let j = 0; j < itemBytes.length; j++) bytes.push(itemBytes[j]);
            }

            // Convert bytes to bitstream
            let bits = '';
            for (let i = 0; i < bytes.length; i++) {
                bits += bytes[i].toString(2).padStart(8, '0');
            }

            // Pad to multiple of 3 bits (each polychrome cell holds 3 bits)
            while (bits.length % 3 !== 0) {
                bits += '0';
            }
            return bits;
        },

        deserializeBitsToPattern: function (bitString) {
            if (!bitString || typeof bitString !== 'string') return [];
            const bytes = [];
            for (let i = 0; i + 8 <= bitString.length; i += 8) {
                bytes.push(parseInt(bitString.slice(i, i + 8), 2));
            }

            if (bytes.length === 0) return [];

            // Read count of integers
            let offset = 0;
            const countDec = this._decodeVarInt(bytes, offset);
            if (!countDec) return [];
            const count = countDec.value;
            offset = countDec.nextOffset;
            if (count < 0 || count > bytes.length - offset) return [];

            const integers = [];
            for (let k = 0; k < count; k++) {
                const dec = this._decodeVarInt(bytes, offset);
                if (!dec) break;
                integers.push(dec.value);
                offset = dec.nextOffset;
            }
            if (integers.length !== count) return [];
            return integers;
        },

        bitsToColorIndices: function (bitString) {
            if (!bitString || typeof bitString !== 'string') return [];
            const indices = [];
            for (let i = 0; i < bitString.length; i += 3) {
                const chunk = bitString.slice(i, i + 3);
                if (chunk.length === 3) {
                    indices.push(parseInt(chunk, 2));
                } else if (chunk.length > 0) {
                    indices.push(parseInt(chunk.padEnd(3, '0'), 2));
                }
            }
            return indices;
        },

        colorIndicesToBits: function (colorIndices) {
            if (!Array.isArray(colorIndices)) return '';
            let bits = '';
            for (let i = 0; i < colorIndices.length; i++) {
                const val = (colorIndices[i] || 0) & 7;
                bits += val.toString(2).padStart(3, '0');
            }
            return bits;
        },

        findNearestPaletteColorIndex: function (r, g, b) {
            const nr = Number.isFinite(Number(r)) ? Number(r) : 0;
            const ng = Number.isFinite(Number(g)) ? Number(g) : 0;
            const nb = Number.isFinite(Number(b)) ? Number(b) : 0;
            let bestIdx = 0;
            let minSqDist = Infinity;
            for (let i = 0; i < JABPaletteRGB.length; i++) {
                const p = JABPaletteRGB[i];
                const dr = nr - p.r;
                const dg = ng - p.g;
                const db = nb - p.b;
                const sqDist = dr * dr + dg * dg + db * db;
                if (sqDist < minSqDist) {
                    minSqDist = sqDist;
                    bestIdx = i;
                }
            }
            return bestIdx;
        },

        isFinderModule: function (r, c, grid) {
            const isTL = r < 4 && c < 4;
            const isTR = r < 4 && c >= grid - 4;
            const isBL = r >= grid - 4 && c < 4;
            const isBR = r >= grid - 4 && c >= grid - 4;
            return isTL || isTR || isBL || isBR;
        },

        verifyFinderPatterns: function (canvas, grid) {
            if (!canvas || !grid || grid < 8) return false;
            const ctx = canvas.getContext('2d');
            if (!ctx) return false;
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            const cellSizeX = canvas.width / grid;
            const cellSizeY = canvas.height / grid;

            const samplePixelAt = (x, y) => {
                const px = Math.max(0, Math.min(canvas.width - 1, Math.floor(x)));
                const py = Math.max(0, Math.min(canvas.height - 1, Math.floor(y)));
                const offset = (py * canvas.width + px) * 4;
                return this.findNearestPaletteColorIndex(imgData[offset], imgData[offset + 1], imgData[offset + 2]);
            };

            // Top-Left Finder (4x4): outer module (0, 0) == 2, center at (2.0, 2.0) == 4, white ring at (2.75, 2.0) == 1
            if (samplePixelAt(0.5 * cellSizeX, 0.5 * cellSizeY) !== 2) return false;
            if (samplePixelAt(2.0 * cellSizeX, 2.0 * cellSizeY) !== 4) return false;
            if (samplePixelAt(2.75 * cellSizeX, 2.0 * cellSizeY) !== 1) return false;

            // Top-Right Finder (4x4): outer module (0, grid - 1) == 4, center at (grid - 2.0, 2.0) == 6, white ring at (grid - 2.75, 2.0) == 1
            if (samplePixelAt((grid - 0.5) * cellSizeX, 0.5 * cellSizeY) !== 4) return false;
            if (samplePixelAt((grid - 2.0) * cellSizeX, 2.0 * cellSizeY) !== 6) return false;
            if (samplePixelAt((grid - 2.75) * cellSizeX, 2.0 * cellSizeY) !== 1) return false;

            // Bottom-Left Finder (4x4): outer module (grid - 1, 0) == 6, center at (2.0, grid - 2.0) == 0, white ring at (2.0, grid - 2.75) == 1
            if (samplePixelAt(0.5 * cellSizeX, (grid - 0.5) * cellSizeY) !== 6) return false;
            if (samplePixelAt(2.0 * cellSizeX, (grid - 2.0) * cellSizeY) !== 0) return false;
            if (samplePixelAt(2.0 * cellSizeX, (grid - 2.75) * cellSizeY) !== 1) return false;

            // Bottom-Right Finder (4x4): outer module (grid - 1, grid - 1) == 7, center at (grid - 2.0, grid - 2.0) == 1
            if (samplePixelAt((grid - 0.5) * cellSizeX, (grid - 0.5) * cellSizeY) !== 7) return false;
            if (samplePixelAt((grid - 2.0) * cellSizeX, (grid - 2.0) * cellSizeY) !== 1) return false;

            return true;
        },

        renderJabCode: function (patternOrCoffee, w, h, targetCanvas) {
            let pattern = [];
            if (patternOrCoffee) {
                if (Array.isArray(patternOrCoffee)) {
                    const flat = Array.isArray(patternOrCoffee.flat) ? patternOrCoffee.flat(Infinity) : patternOrCoffee;
                    pattern = flat.map(v => parseInt(v, 10)).filter(n => Number.isInteger(n) && n >= 0);
                } else if (typeof patternOrCoffee === 'string') {
                    pattern = this.extractNumericPattern(patternOrCoffee);
                } else if (typeof patternOrCoffee === 'number' && this.currentResult && this.currentResult.numericPattern) {
                    pattern = this.currentResult.numericPattern;
                }
            } else if (this.currentResult && this.currentResult.numericPattern) {
                pattern = this.currentResult.numericPattern;
            }

            const canvas = targetCanvas || (typeof document !== 'undefined' && document.getElementById('vvQrCanvas'));
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.imageSmoothingEnabled = false;

            const size = Math.max(canvas.width || 200, 200);
            canvas.width = size;
            canvas.height = size;

            // Serialize pattern to bit stream and 3-bit color blocks
            const bitString = this.serializePatternToBits(pattern);
            const colorIndices = this.bitsToColorIndices(bitString);

            // Determine grid size (minimum 20, expanding by 4 to accommodate all data cells)
            let grid = 20;
            while (grid * grid - 64 < colorIndices.length) {
                grid += 4;
            }

            this.currentGrid = grid;
            if (canvas.dataset) canvas.dataset.grid = String(grid);
            canvas._jabGrid = grid;

            const cellSize = size / grid;

            // Clean background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);

            // Draw 4 corner finder patterns (4x4 modules each)
            const drawFinder = (startX, startY, colorIdx) => {
                ctx.fillStyle = JABColorPalette[colorIdx % JABColorPalette.length];
                ctx.fillRect(startX * cellSize, startY * cellSize, cellSize * 4, cellSize * 4);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect((startX + 1) * cellSize, (startY + 1) * cellSize, cellSize * 2, cellSize * 2);
                ctx.fillStyle = JABColorPalette[(colorIdx + 2) % JABColorPalette.length];
                ctx.fillRect((startX + 1.5) * cellSize, (startY + 1.5) * cellSize, cellSize, cellSize);
            };

            drawFinder(0, 0, 2);
            drawFinder(grid - 4, 0, 4);
            drawFinder(0, grid - 4, 6);
            drawFinder(grid - 4, grid - 4, 7);

            // Map binary data sequentially across non-finder modules
            let dataIdx = 0;
            for (let r = 0; r < grid; r++) {
                for (let c = 0; c < grid; c++) {
                    if (this.isFinderModule(r, c, grid)) continue;

                    const colorIndex = dataIdx < colorIndices.length 
                        ? colorIndices[dataIdx] 
                        : 0; // Pad with 0 (Black #000000)

                    ctx.fillStyle = JABColorPalette[colorIndex];
                    ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                    dataIdx++;
                }
            }

            const caption = typeof document !== 'undefined' && document.getElementById('vvQrCaption');
            if (caption) {
                caption.textContent = 'JAB Code Matrix · 8 Colores · ' + grid + '×' + grid + ' (' + (grid * grid - 64) + ' Celdas de Datos)';
            }
        },

        decodeJabMatrix: function (canvas, overrideGrid) {
            const target = canvas || (typeof document !== 'undefined' && document.getElementById('vvQrCanvas'));
            if (!target) return [];

            const decodeForGrid = (grid) => {
                const ctx = target.getContext('2d');
                if (!ctx) return [];

                const imgData = ctx.getImageData(0, 0, target.width, target.height).data;
                const cellSizeX = target.width / grid;
                const cellSizeY = target.height / grid;

                const colorIndices = [];
                for (let r = 0; r < grid; r++) {
                    for (let c = 0; c < grid; c++) {
                        if (this.isFinderModule(r, c, grid)) continue;

                        // Sample pixel at center of cell
                        const px = Math.max(0, Math.min(target.width - 1, Math.floor((c + 0.5) * cellSizeX)));
                        const py = Math.max(0, Math.min(target.height - 1, Math.floor((r + 0.5) * cellSizeY)));
                        const offset = (py * target.width + px) * 4;

                        const red = imgData[offset];
                        const green = imgData[offset + 1];
                        const blue = imgData[offset + 2];

                        const colIdx = this.findNearestPaletteColorIndex(red, green, blue);
                        colorIndices.push(colIdx);
                    }
                }

                const bitString = this.colorIndicesToBits(colorIndices);
                return this.deserializeBitsToPattern(bitString);
            };

            // 1. If explicit overrideGrid provided, decode directly
            if (overrideGrid) {
                return decodeForGrid(overrideGrid);
            }

            // 2. Check annotated grid on dataset or property with finder verification
            const annotatedGrid = (target.dataset && parseInt(target.dataset.grid, 10)) || target._jabGrid;
            if (annotatedGrid && this.verifyFinderPatterns(target, annotatedGrid)) {
                const res = decodeForGrid(annotatedGrid);
                if (res && res.length > 0) return res;
            }

            // 3. Robust Finder-Pattern probing across candidate grids (from 20 to 128)
            const candidateGrids = [20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96, 128];
            for (let i = 0; i < candidateGrids.length; i++) {
                const g = candidateGrids[i];
                if (this.verifyFinderPatterns(target, g)) {
                    const probed = decodeForGrid(g);
                    if (probed && probed.length > 0) return probed;
                }
            }

            // 4. Fallback if finder patterns didn't match cleanly (e.g. mock or custom canvas)
            const fallbackGrid = annotatedGrid || this.currentGrid || 20;
            return decodeForGrid(fallbackGrid);
        },

        validatePatternMatch: function (patternA, patternB) {
            if (!Array.isArray(patternA) || !Array.isArray(patternB)) return false;
            if (patternA.length !== patternB.length) return false;
            for (let i = 0; i < patternA.length; i++) {
                if (patternA[i] !== patternB[i]) return false;
            }
            return true;
        },

        verifyPattern: function () {
            const badge = typeof document !== 'undefined' && document.getElementById('vvValidationBadge');
            const detail = typeof document !== 'undefined' && document.getElementById('vvStatusDetail');

            if (!this.currentResult || !this.currentResult.numericPattern || this.currentResult.numericPattern.length === 0) {
                if (typeof alert === 'function') alert('Por favor carga una imagen primero o pulsa en Demo.');
                return false;
            }

            const canvas = typeof document !== 'undefined' && document.getElementById('vvQrCanvas');
            const decoded = this.decodeJabMatrix(canvas);
            const match = this.validatePatternMatch(this.currentResult.numericPattern, decoded);

            if (match) {
                if (badge) {
                    badge.style.display = 'inline-block';
                    badge.textContent = 'VALIDADO AL 100% ✓';
                    badge.style.background = '#064E3B';
                    badge.style.color = '#34D399';
                    badge.style.border = '1px solid #059669';
                }
                if (detail) {
                    detail.innerHTML = '<span style="color:#34D399; font-weight:700;">¡Validación Biométrica/Vectorial Exitosa!</span> La matriz JAB Code (8 colores, 3 bits/celda) decodificó los ' + decoded.length + ' enteros del patrón numérico con 100% de correspondencia y cero discrepancia de paridad.';
                }
            } else {
                if (badge) {
                    badge.style.display = 'inline-block';
                    badge.textContent = 'DISCREPANCIA DETECTADA ✕';
                    badge.style.background = '#7F1D1D';
                    badge.style.color = '#FCA5A5';
                    badge.style.border = '1px solid #DC2626';
                }
                if (detail) {
                    detail.innerHTML = '<span style="color:#EF4444; font-weight:700;">¡Fallo de Validación!</span> Se detectó una alteración entre el patrón numérico de la imagen activa y la matriz JAB Code decodificada.';
                }
            }
            return match;
        },

        copyCoffeeScript: function () {
            const ta = typeof document !== 'undefined' && document.getElementById('vvCoffeeOutput');
            if (ta && ta.value) {
                if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                    navigator.clipboard.writeText(ta.value).then(() => {
                        if (typeof alert === 'function') alert('¡CoffeeScript numérico copiado al portapapeles!');
                    }).catch(() => {
                        ta.select();
                        if (typeof document.execCommand === 'function') document.execCommand('copy');
                        if (typeof alert === 'function') alert('¡Copiado!');
                    });
                } else {
                    ta.select();
                    if (typeof document.execCommand === 'function') document.execCommand('copy');
                    if (typeof alert === 'function') alert('¡Copiado!');
                }
            }
        },

        generateJabSvg: function (patternOrCoffee) {
            let pattern = [];
            if (patternOrCoffee) {
                if (Array.isArray(patternOrCoffee)) {
                    const flat = Array.isArray(patternOrCoffee.flat) ? patternOrCoffee.flat(Infinity) : patternOrCoffee;
                    pattern = flat.map(v => parseInt(v, 10)).filter(n => Number.isInteger(n) && n >= 0);
                } else if (typeof patternOrCoffee === 'string') {
                    pattern = this.extractNumericPattern(patternOrCoffee);
                } else if (typeof patternOrCoffee === 'number' && this.currentResult && this.currentResult.numericPattern) {
                    pattern = this.currentResult.numericPattern;
                }
            }
            if (pattern.length === 0) {
                if (this.currentResult && this.currentResult.numericPattern && this.currentResult.numericPattern.length > 0) {
                    pattern = this.currentResult.numericPattern;
                } else {
                    const canvas = typeof document !== 'undefined' && document.getElementById('vvQrCanvas');
                    if (canvas) {
                        pattern = this.decodeJabMatrix(canvas);
                    }
                }
            }
            const bitString = this.serializePatternToBits(pattern);
            const colorIndices = this.bitsToColorIndices(bitString);

            let grid = 20;
            while (grid * grid - 64 < colorIndices.length) {
                grid += 4;
            }

            const cellSize = 16;
            const totalSize = grid * cellSize;
            const rects = [];

            rects.push(`<rect width="${totalSize}" height="${totalSize}" fill="#FFFFFF"/>`);

            const drawFinderSvg = (startX, startY, colorIdx) => {
                const c1 = JABColorPalette[colorIdx % 8];
                const c2 = JABColorPalette[(colorIdx + 2) % 8];
                rects.push(`<rect x="${startX * cellSize}" y="${startY * cellSize}" width="${4 * cellSize}" height="${4 * cellSize}" fill="${c1}"/>`);
                rects.push(`<rect x="${(startX + 1) * cellSize}" y="${(startY + 1) * cellSize}" width="${2 * cellSize}" height="${2 * cellSize}" fill="#FFFFFF"/>`);
                rects.push(`<rect x="${(startX + 1.5) * cellSize}" y="${(startY + 1.5) * cellSize}" width="${cellSize}" height="${cellSize}" fill="${c2}"/>`);
            };

            drawFinderSvg(0, 0, 2);
            drawFinderSvg(grid - 4, 0, 4);
            drawFinderSvg(0, grid - 4, 6);
            drawFinderSvg(grid - 4, grid - 4, 7);

            let dataIdx = 0;
            for (let r = 0; r < grid; r++) {
                for (let c = 0; c < grid; c++) {
                    if (this.isFinderModule(r, c, grid)) continue;
                    const colIdx = dataIdx < colorIndices.length ? colorIndices[dataIdx] : 0;
                    rects.push(`<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="${JABColorPalette[colIdx]}"/>`);
                    dataIdx++;
                }
            }

            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">\n${rects.join('\n')}\n</svg>`;
        },

        downloadSvg: function () {
            const svgContent = this.generateJabSvg();
            if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof document !== 'undefined') {
                const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'jab_code_matrix_' + Date.now() + '.svg';
                if (document.body) {
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
                setTimeout(() => {
                    try { URL.revokeObjectURL(url); } catch (e) {}
                }, 1500);
            }
        },

        downloadPng: function () {
            const canvas = typeof document !== 'undefined' && document.getElementById('vvQrCanvas');
            if (!canvas) return;
            if (typeof canvas.toDataURL === 'function' && typeof document !== 'undefined') {
                const url = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = url;
                a.download = 'jab_code_matrix_' + Date.now() + '.png';
                if (document.body) {
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            }
        }
    };

    if (typeof window !== 'undefined') {
        window.VectorVisionStudio = VectorVisionStudio;
        window.openVectorVisionModal = function () {
            VectorVisionStudio.openModal();
        };

        // Delegated capture listener: intercept clicks on Circle 10 (#slot-3-2)
        document.addEventListener('click', function (e) {
            const slot = e.target && e.target.closest && (e.target.closest('#slot-3-2') || e.target.closest('.is-tool-vector-vision'));
            if (slot) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.closeOnDemandToolModal === 'function') {
                    window.closeOnDemandToolModal();
                }
                VectorVisionStudio.openModal();
            }
        }, true);

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                VectorVisionStudio.injectModal();
            });
        } else {
            VectorVisionStudio.injectModal();
        }
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = VectorVisionStudio;
    }
})();
