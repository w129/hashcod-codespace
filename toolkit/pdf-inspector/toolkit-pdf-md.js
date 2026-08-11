/**
 * Toolkit tool: PDF → Markdown via firecrawl/pdf-inspector (WASM)
 * + fallback capa de texto (pdf.js) + OCR (tesseract) para PDF escaneados.
 */
(function () {
    'use strict';

    const TOOLKIT_PDF_WASM_JS = '/toolkit/pdf-inspector/wasm/pdf_inspector_wasm.js';
    const TOOLKIT_PDF_MAX_BYTES = 25 * 1024 * 1024;
    const TOOLKIT_PDF_JS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs';
    const TOOLKIT_PDF_WORKER_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';
    const TOOLKIT_TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

    let toolkitPdfBusy = false;
    let toolkitPdfMarkdown = '';
    let toolkitPdfFileName = '';
    let toolkitPdfJsLib = null;
    let toolkitTesseractReady = null;

    function toolkitPdfIconHtml() {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" aria-hidden="true"><path d="M 14.998047 1.9042969 L 14.498047 2.1953125 L 12.498047 3.3554688 L 12 3.6445312 L 12 4.2207031 L 12 8.2539062 L 11.501953 7.9648438 L 11 7.6738281 L 10.498047 7.9648438 L 8.4980469 9.125 L 8 9.4140625 L 8 9.9902344 L 8 31.929688 L 8 32.507812 L 8.5 32.796875 L 34.5 47.806641 L 35 48.095703 L 35.5 47.806641 L 39.5 45.496094 L 41.498047 44.347656 L 42 44.058594 L 42 43.480469 L 42 21.539062 L 42 20.962891 L 41.5 20.673828 L 25.785156 11.599609 L 23.917969 7.28125 L 23.785156 6.9785156 L 23.5 6.8144531 L 15.5 2.1933594 L 14.998047 1.9042969 z M 15 3.3496094 L 22.501953 7.6816406 L 21 8.5449219 L 13.498047 4.21875 L 15 3.3496094 z M 13.25 4.6542969 L 20.802734 9.0097656 L 22.771484 13.552734 A 0.250025 0.250025 0 0 0 22.875 13.669922 L 38.75 22.835938 L 38.75 41.888672 L 37.25 41.021484 L 37.25 23.845703 A 0.250025 0.250025 0 0 0 37.125 23.628906 L 13.25 9.8457031 L 13.25 4.6542969 z M 22.882812 8.0390625 L 24.683594 12.195312 L 23.119141 13.095703 L 21.318359 8.9394531 L 22.882812 8.0390625 z M 11 9.1191406 L 12.875 10.207031 A 0.250025 0.250025 0 0 0 12.896484 10.21875 L 36.5 23.845703 L 35 24.710938 L 9.5 9.9902344 L 11 9.1191406 z M 9.25 10.423828 L 23.75 18.794922 L 23.75 20.958984 A 0.250025 0.250025 0 0 0 23.875 21.175781 L 27.875 23.484375 A 0.250025 0.250025 0 0 0 28.25 23.267578 L 28.25 21.392578 L 34.75 25.144531 L 34.75 46.505859 L 9.25 31.785156 L 9.25 10.423828 z M 25.003906 12.589844 L 40.5 21.539062 L 39 22.402344 L 23.501953 13.453125 L 25.003906 12.589844 z M 24.25 19.083984 L 27.75 21.103516 L 27.75 22.833984 L 24.25 20.814453 L 24.25 19.083984 z M 40.75 21.972656 L 40.75 43.335938 L 38.875 44.414062 L 35.25 46.505859 L 35.25 25.144531 L 36.75 24.277344 L 36.75 43.474609 A 0.250025 0.250025 0 0 0 37.125 43.691406 L 39.125 42.537109 A 0.250025 0.250025 0 0 0 39.25 42.320312 L 39.25 22.835938 L 40.75 21.972656 z M 23.978516 23.0625 A 0.250025 0.250025 0 0 0 23.75 23.3125 L 23.75 25.576172 A 0.250025 0.250025 0 0 0 23.875 25.792969 L 27.875 28.101562 A 0.250025 0.250025 0 0 0 28.25 27.886719 L 28.25 25.576172 A 0.250025 0.250025 0 0 0 28.123047 25.359375 L 24.123047 23.095703 A 0.250025 0.250025 0 0 0 24.003906 23.0625 A 0.250025 0.250025 0 0 0 23.978516 23.0625 z M 24.25 23.742188 L 27.75 25.722656 L 27.75 27.453125 L 24.25 25.433594 L 24.25 23.742188 z M 23.978516 27.681641 A 0.250025 0.250025 0 0 0 23.75 27.931641 L 23.75 30.195312 A 0.250025 0.250025 0 0 0 23.875 30.412109 L 27.875 32.720703 A 0.250025 0.250025 0 0 0 28.25 32.505859 L 28.25 30.195312 A 0.250025 0.250025 0 0 0 28.123047 29.976562 L 24.123047 27.714844 A 0.250025 0.250025 0 0 0 24.003906 27.681641 A 0.250025 0.250025 0 0 0 23.978516 27.681641 z M 24.25 28.361328 L 27.75 30.339844 L 27.75 32.072266 L 24.25 30.050781 L 24.25 28.361328 z M 24.980469 32.833984 A 0.250025 0.250025 0 0 0 24.763672 33.001953 L 23.763672 35.888672 A 0.250025 0.250025 0 0 0 23.75 35.970703 L 23.75 38.279297 A 0.250025 0.250025 0 0 0 23.875 38.496094 L 27.875 40.804688 A 0.250025 0.250025 0 0 0 28.25 40.587891 L 28.25 38.279297 A 0.250025 0.250025 0 0 0 28.242188 38.21875 L 27.242188 34.177734 A 0.250025 0.250025 0 0 0 27.125 34.021484 L 25.125 32.867188 A 0.250025 0.250025 0 0 0 24.980469 32.833984 z M 25.136719 33.451172 L 26.783203 34.400391 L 27.75 38.308594 L 27.75 40.154297 L 24.25 38.134766 L 24.25 36.011719 L 25.136719 33.451172 z M 37.25 41.599609 L 38.5 42.320312 L 37.25 43.041016 L 37.25 41.599609 z"></path></svg>';
    }

    function toolkitPdfFormatBytes(bytes) {
        const n = Number(bytes) || 0;
        if (n < 1024) return n + ' B';
        const units = ['KB', 'MB', 'GB'];
        let value = n / 1024;
        let unit = units[0];
        for (let i = 1; value >= 1024 && i < units.length; i++) {
            value /= 1024;
            unit = units[i];
        }
        return (value >= 10 ? value.toFixed(1) : value.toFixed(2)) + ' ' + unit;
    }

    function toolkitPdfSetStatus(text, tone) {
        const el = document.getElementById('toolkitPdfStatus');
        if (!el) return;
        el.textContent = text || '';
        el.classList.remove('ok', 'err');
        if (tone === 'ok') el.classList.add('ok');
        if (tone === 'err') el.classList.add('err');
    }

    function toolkitPdfSetBusy(busy) {
        toolkitPdfBusy = !!busy;
        const input = document.getElementById('toolkitPdfInput');
        const clearBtn = document.getElementById('toolkitPdfClearBtn');
        const drop = document.getElementById('toolkitPdfDrop');
        if (input) input.disabled = toolkitPdfBusy;
        if (clearBtn) clearBtn.disabled = toolkitPdfBusy;
        if (drop) drop.setAttribute('aria-busy', toolkitPdfBusy ? 'true' : 'false');
    }

    function toolkitPdfNormalizeMarkdown(md) {
        return String(md || '').replace(/\r\n/g, '\n').trim();
    }

    function toolkitPdfTextToMarkdown(text, title) {
        const body = String(text || '').replace(/\r\n/g, '\n').trim();
        if (!body) return '';
        const head = title ? ('# ' + title.replace(/\.pdf$/i, '') + '\n\n') : '';
        return head + body + '\n';
    }

    function toolkitPdfProcessInWorker(arrayBuffer) {
        const wasmUrl = new URL(TOOLKIT_PDF_WASM_JS, window.location.origin).href;
        const source =
            'import init, { processPdf, extractText, version } from "' + wasmUrl + '";\n' +
            'self.onmessage = async ({ data }) => {\n' +
            '  try {\n' +
            '    await init();\n' +
            '    const bytes = new Uint8Array(data.buffer);\n' +
            '    const result = processPdf(bytes, { profile: "fidelity", includePageMarkers: true });\n' +
            '    let markdown = typeof result.markdown === "string" ? result.markdown.trim() : "";\n' +
            '    let source = "pdf-inspector";\n' +
            '    if (!markdown) {\n' +
            '      const plain = extractText(bytes);\n' +
            '      if (plain && String(plain).trim()) {\n' +
            '        markdown = String(plain).trim();\n' +
            '        source = "pdf-inspector-text";\n' +
            '      }\n' +
            '    }\n' +
            '    self.postMessage({ ok: true, result: Object.assign({}, result, { markdown: markdown || null }), source: source, engineVersion: version() });\n' +
            '  } catch (error) {\n' +
            '    const detail = error instanceof Error ? error.message : String(error);\n' +
            '    self.postMessage({ ok: false, error: detail });\n' +
            '  }\n' +
            '};\n';

        return new Promise((resolve, reject) => {
            const workerUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
            let worker;
            try {
                worker = new Worker(workerUrl, { type: 'module' });
            } catch (err) {
                URL.revokeObjectURL(workerUrl);
                reject(err);
                return;
            }
            URL.revokeObjectURL(workerUrl);
            worker.addEventListener('message', ({ data }) => {
                worker.terminate();
                if (data && data.ok) resolve(data);
                else reject(new Error((data && data.error) || 'Error al convertir PDF'));
            }, { once: true });
            worker.addEventListener('error', (event) => {
                worker.terminate();
                reject(new Error(event.message || 'No se pudo cargar el motor WebAssembly'));
            }, { once: true });
            worker.postMessage({ buffer: arrayBuffer }, [arrayBuffer]);
        });
    }

    async function toolkitPdfEnsurePdfJs() {
        if (toolkitPdfJsLib) return toolkitPdfJsLib;
        const mod = await import(TOOLKIT_PDF_JS_CDN);
        const lib = mod.default || mod;
        if (lib && lib.GlobalWorkerOptions) {
            lib.GlobalWorkerOptions.workerSrc = TOOLKIT_PDF_WORKER_CDN;
        }
        toolkitPdfJsLib = lib;
        return lib;
    }

    async function toolkitPdfEnsureTesseract() {
        if (window.Tesseract) return window.Tesseract;
        if (toolkitTesseractReady) return toolkitTesseractReady;
        toolkitTesseractReady = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = TOOLKIT_TESSERACT_CDN;
            s.async = true;
            s.onload = () => {
                if (window.Tesseract) resolve(window.Tesseract);
                else reject(new Error('Tesseract no disponible'));
            };
            s.onerror = () => reject(new Error('No se pudo cargar OCR (tesseract.js)'));
            document.head.appendChild(s);
        }).catch((err) => {
            toolkitTesseractReady = null;
            throw err;
        });
        return toolkitTesseractReady;
    }

    async function toolkitPdfExtractWithPdfJs(arrayBuffer) {
        const pdfjs = await toolkitPdfEnsurePdfJs();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise;
        const parts = [];
        let chars = 0;
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = (content.items || [])
                .map((it) => (it && typeof it.str === 'string' ? it.str : ''))
                .filter(Boolean);
            const pageText = strings.join(' ').replace(/[ \t]+/g, ' ').trim();
            if (pageText) {
                parts.push('## Página ' + i + '\n\n' + pageText);
                chars += pageText.length;
            }
        }
        if (chars < 40) return '';
        return parts.join('\n\n') + '\n';
    }

    async function toolkitPdfOcrWithTesseract(arrayBuffer, onProgress) {
        const pdfjs = await toolkitPdfEnsurePdfJs();
        const Tesseract = await toolkitPdfEnsureTesseract();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise;
        const maxPages = Math.min(pdf.numPages, 20);
        const worker = await Tesseract.createWorker('spa+eng', 1, {
            logger: (m) => {
                if (!onProgress || !m) return;
                if (m.status === 'recognizing text' && typeof m.progress === 'number') {
                    onProgress('OCR ' + Math.round(m.progress * 100) + '%…');
                }
            }
        });

        const parts = [];
        try {
            for (let i = 1; i <= maxPages; i++) {
                if (onProgress) onProgress('OCR página ' + i + ' / ' + maxPages + '…');
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2 });
                const canvas = document.createElement('canvas');
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                const { data } = await worker.recognize(canvas);
                const text = (data && data.text ? data.text : '').trim();
                if (text) {
                    parts.push('## Página ' + i + '\n\n' + text);
                }
                canvas.width = 0;
                canvas.height = 0;
            }
        } finally {
            try { await worker.terminate(); } catch (e) {}
        }
        if (!parts.length) return '';
        const note = pdf.numPages > maxPages
            ? '\n\n> Nota: OCR limitado a las primeras ' + maxPages + ' páginas de ' + pdf.numPages + '.\n'
            : '';
        return parts.join('\n\n') + note + '\n';
    }

    function toolkitPdfEnableActions(enabled) {
        const copyBtn = document.getElementById('toolkitPdfCopyBtn');
        const dlBtn = document.getElementById('toolkitPdfDownloadBtn');
        if (copyBtn) copyBtn.disabled = !enabled;
        if (dlBtn) dlBtn.disabled = !enabled;
    }

    function toolkitPdfShowMarkdown(markdown, metaLine) {
        toolkitPdfMarkdown = toolkitPdfNormalizeMarkdown(markdown);
        const meta = document.getElementById('toolkitPdfMeta');
        const out = document.getElementById('toolkitPdfOutput');
        const preview = document.getElementById('toolkitPdfPreview');
        const empty = document.getElementById('toolkitPdfEmpty');
        const htmlView = document.getElementById('toolkitPdfHtml');
        const rawWrap = document.getElementById('toolkitPdfRawWrap');

        if (meta) meta.textContent = metaLine || '';
        if (empty) empty.style.display = 'none';
        if (preview) preview.hidden = false;

        if (!toolkitPdfMarkdown) {
            if (htmlView) {
                htmlView.innerHTML = '<p class="md-status err">No se pudo obtener texto de este PDF.</p>';
            }
            if (out) out.textContent = '';
            if (rawWrap) rawWrap.hidden = true;
            toolkitPdfEnableActions(false);
            return;
        }

        toolkitPdfEnableActions(true);
        if (out) out.textContent = toolkitPdfMarkdown;
        if (rawWrap) rawWrap.hidden = false;

        if (htmlView) {
            htmlView.innerHTML = '<div class="md-status">Renderizando markdown…</div>';
            const paint = (marked) => {
                if (marked && typeof marked.parse === 'function') {
                    htmlView.innerHTML = marked.parse(toolkitPdfMarkdown);
                } else {
                    htmlView.innerHTML = '<pre class="toolkit-pdf-output">' +
                        toolkitPdfMarkdown.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</pre>';
                }
            };
            if (typeof window.toolkitEnsureMarked === 'function') {
                window.toolkitEnsureMarked().then(paint).catch(() => paint(null));
            } else {
                paint(window.marked || null);
            }
        }
    }

    function toolkitPdfClearResult() {
        toolkitPdfMarkdown = '';
        const out = document.getElementById('toolkitPdfOutput');
        const preview = document.getElementById('toolkitPdfPreview');
        const empty = document.getElementById('toolkitPdfEmpty');
        const meta = document.getElementById('toolkitPdfMeta');
        const htmlView = document.getElementById('toolkitPdfHtml');
        const rawWrap = document.getElementById('toolkitPdfRawWrap');
        if (out) out.textContent = '';
        if (htmlView) htmlView.innerHTML = '';
        if (meta) meta.textContent = '';
        if (preview) preview.hidden = true;
        if (rawWrap) rawWrap.hidden = true;
        if (empty) empty.style.display = 'block';
        toolkitPdfEnableActions(false);
    }

    function toolkitPdfClearFile() {
        if (toolkitPdfBusy) return;
        toolkitPdfFileName = '';
        const input = document.getElementById('toolkitPdfInput');
        const fileInfo = document.getElementById('toolkitPdfFileInfo');
        if (input) input.value = '';
        if (fileInfo) {
            fileInfo.hidden = true;
            fileInfo.textContent = '';
        }
        toolkitPdfClearResult();
        toolkitPdfSetStatus('Elige un PDF para convertirlo a Markdown (local, pdf-inspector).');
    }

    function toolkitPdfDownload() {
        if (!toolkitPdfMarkdown) return;
        const base = (toolkitPdfFileName || 'document.pdf').replace(/\.pdf$/i, '') || 'document';
        const blob = new Blob([toolkitPdfMarkdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = base + '.md';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1200);
    }

    async function toolkitPdfConvertFile(file) {
        if (!file || toolkitPdfBusy) return;
        const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
        if (!isPdf) {
            toolkitPdfClearFile();
            toolkitPdfSetStatus('Solo se admiten archivos PDF.', 'err');
            return;
        }
        if (file.size > TOOLKIT_PDF_MAX_BYTES) {
            toolkitPdfClearFile();
            toolkitPdfSetStatus('Máximo 25 MB por archivo.', 'err');
            return;
        }

        toolkitPdfFileName = file.name || 'document.pdf';
        const fileInfo = document.getElementById('toolkitPdfFileInfo');
        if (fileInfo) {
            fileInfo.hidden = false;
            fileInfo.textContent = toolkitPdfFileName + ' · ' + toolkitPdfFormatBytes(file.size);
        }

        toolkitPdfClearResult();
        toolkitPdfSetBusy(true);
        toolkitPdfSetStatus('Cargando motor Rust (WASM) y convirtiendo…');

        try {
            const buffer = await file.arrayBuffer();
            const payload = await toolkitPdfProcessInWorker(buffer.slice(0));
            const result = (payload && payload.result) || {};
            let markdown = toolkitPdfNormalizeMarkdown(result.markdown);
            let source = (payload && payload.source) || 'pdf-inspector';

            const type = result.pdfType || '—';
            const pages = result.pageCount != null ? result.pageCount : '—';
            const ms = Number.isFinite(result.processingTimeMs)
                ? Math.max(1, Math.round(result.processingTimeMs)) + ' ms'
                : '—';
            const ver = payload.engineVersion ? ' · motor v' + payload.engineVersion : '';

            if (!markdown) {
                toolkitPdfSetStatus('Sin capa de texto en pdf-inspector… probando pdf.js…');
                try {
                    markdown = toolkitPdfNormalizeMarkdown(await toolkitPdfExtractWithPdfJs(buffer.slice(0)));
                    if (markdown) source = 'pdf.js';
                } catch (e) {
                    /* continue to OCR */
                }
            }

            if (!markdown) {
                toolkitPdfSetStatus('PDF escaneado: ejecutando OCR local (puede tardar)…');
                markdown = toolkitPdfNormalizeMarkdown(
                    await toolkitPdfOcrWithTesseract(buffer.slice(0), (msg) => toolkitPdfSetStatus(msg))
                );
                if (markdown) source = 'ocr';
            }

            if (!markdown) {
                markdown = toolkitPdfTextToMarkdown(
                    '_No se pudo extraer texto de este PDF (escaneado sin OCR usable)._',
                    toolkitPdfFileName
                );
                source = 'empty';
            } else if (source === 'pdf-inspector-text' || source === 'pdf.js' || source === 'ocr') {
                if (!/^#\s/m.test(markdown)) {
                    markdown = toolkitPdfTextToMarkdown(markdown, toolkitPdfFileName);
                }
            }

            const metaLine = type + ' · ' + pages + ' pág. · ' + ms + ver + ' · vía ' + source;
            toolkitPdfShowMarkdown(markdown, metaLine);

            if (source === 'ocr') {
                toolkitPdfSetStatus('Convertido con OCR local · markdown listo para descargar.', 'ok');
            } else if (source === 'empty') {
                toolkitPdfSetStatus('No hubo texto extraíble; se generó un markdown mínimo descargable.', 'err');
            } else {
                toolkitPdfSetStatus('Markdown listo · puedes copiarlo o descargarlo.', 'ok');
            }

            if (typeof window.toolkitLogUse === 'function') {
                window.toolkitLogUse('platform', 'pdf-md', 'PDF→MD · ' + toolkitPdfFileName);
            }
            if (typeof window.toolkitCurateFile === 'function' && toolkitPdfMarkdown) {
                window.toolkitCurateFile('platform', {
                    name: toolkitPdfFileName.replace(/\.pdf$/i, '') + '.md',
                    path: 'local://pdf-md/' + toolkitPdfFileName,
                    kind: 'markdown'
                });
            }
        } catch (err) {
            toolkitPdfClearResult();
            toolkitPdfSetStatus((err && err.message) ? err.message : String(err), 'err');
        } finally {
            toolkitPdfSetBusy(false);
        }
    }

    function closeToolkitPdfMd() {
        const overlay = document.getElementById('toolkitPdfOverlay');
        if (!overlay) return;
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
    }

    function openToolkitPdfMd() {
        const overlay = document.getElementById('toolkitPdfOverlay');
        if (!overlay) return;
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        if (!toolkitPdfMarkdown) {
            toolkitPdfSetStatus('Elige un PDF para convertirlo a Markdown (local, pdf-inspector).');
        }
        if (typeof window.toolkitLogUse === 'function') {
            window.toolkitLogUse('platform', 'pdf-md', 'Abrir PDF→Markdown');
        }
    }

    function initToolkitPdfMd() {
        if (window.__l8ToolkitPdfReady) return;
        window.__l8ToolkitPdfReady = true;

        const overlay = document.getElementById('toolkitPdfOverlay');
        const closeBtn = document.getElementById('toolkitPdfCloseBtn');
        const drop = document.getElementById('toolkitPdfDrop');
        const input = document.getElementById('toolkitPdfInput');
        const clearBtn = document.getElementById('toolkitPdfClearBtn');
        const copyBtn = document.getElementById('toolkitPdfCopyBtn');
        const dlBtn = document.getElementById('toolkitPdfDownloadBtn');

        if (closeBtn) closeBtn.addEventListener('click', closeToolkitPdfMd);
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeToolkitPdfMd();
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) {
                closeToolkitPdfMd();
            }
        });

        if (drop) {
            drop.addEventListener('click', () => {
                if (!toolkitPdfBusy && input) {
                    input.value = '';
                    input.click();
                }
            });
            drop.addEventListener('keydown', (e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !toolkitPdfBusy && input) {
                    e.preventDefault();
                    input.value = '';
                    input.click();
                }
            });
            drop.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!toolkitPdfBusy) drop.classList.add('dragging');
            });
            drop.addEventListener('dragleave', () => drop.classList.remove('dragging'));
            drop.addEventListener('drop', (e) => {
                e.preventDefault();
                drop.classList.remove('dragging');
                if (!toolkitPdfBusy && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
                    toolkitPdfConvertFile(e.dataTransfer.files[0]);
                }
            });
        }
        if (input) {
            input.addEventListener('change', () => {
                if (input.files && input.files[0]) toolkitPdfConvertFile(input.files[0]);
            });
        }
        if (clearBtn) clearBtn.addEventListener('click', toolkitPdfClearFile);
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                if (!toolkitPdfMarkdown) return;
                try {
                    await navigator.clipboard.writeText(toolkitPdfMarkdown);
                    copyBtn.textContent = 'Copiado';
                    setTimeout(() => { copyBtn.textContent = 'Copiar MD'; }, 1400);
                } catch (e) {
                    toolkitPdfSetStatus('No se pudo copiar. Selecciona el texto a mano.', 'err');
                }
            });
        }
        if (dlBtn) dlBtn.addEventListener('click', toolkitPdfDownload);

        window.openToolkitPdfMd = openToolkitPdfMd;
        window.closeToolkitPdfMd = closeToolkitPdfMd;
        window.toolkitPdfIconHtml = toolkitPdfIconHtml;
        if (window.l8Toolkit) {
            window.l8Toolkit.openPdfMd = openToolkitPdfMd;
        }
    }

    window.toolkitPdfIconHtml = toolkitPdfIconHtml;
    window.openToolkitPdfMd = openToolkitPdfMd;
    window.closeToolkitPdfMd = closeToolkitPdfMd;
    window.initToolkitPdfMd = initToolkitPdfMd;
})();
