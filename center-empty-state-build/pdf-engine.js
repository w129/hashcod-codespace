import './pdf-upsert-polyfill.js';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs';
GlobalWorkerOptions.workerSrc = '/components/file-vault-pdf/worker.js?v=6.4.299';
window.HashcodFileVaultPdf = Object.freeze({
  load: (data) => getDocument({
    data,
    isEvalSupported: false,
    enableXfa: false,
    cMapUrl: '/components/file-vault-pdf/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/components/file-vault-pdf/standard_fonts/',
    wasmUrl: '/components/file-vault-pdf/wasm/',
  }),
});
