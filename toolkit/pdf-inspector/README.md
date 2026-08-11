# PDF → Markdown (toolkit)

Convertidor de PDF a Markdown usando [firecrawl/pdf-inspector](https://github.com/firecrawl/pdf-inspector).

- Motor principal en el navegador: WebAssembly (`wasm/`) — `@firecrawl/pdf-inspector-wasm`
- Si el PDF es escaneado / sin capa de texto: fallback **pdf.js** y luego **OCR local (tesseract.js)**
- El markdown se muestra renderizado y se puede **copiar / descargar** `.md`
- El PDF se procesa en el cliente; no se sube al servidor

Origen: `pdf-inspector` (MIT).
