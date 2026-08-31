# TipTap · Documento (l8)

Ventana de hoja directa tipo Word con:

- [TipTap](https://github.com/ueberdosis/tiptap)
- [Tailwind CSS Typography](https://github.com/tailwindlabs/tailwindcss-typography) (`prose`)
- **300 tipografías** Google Fonts (selector Fuente)
- **[Vivid Vector Alphabet](https://github.com/neodigm/vivid_vector_alphabet)** — tipografía ilustrada SVG (ribbon **Vivid Vector**)
- **Traductor ES→EN** (sin OpenAI) con flujo bilingüe inspirado en [oomol-lab/epub-translator](https://github.com/oomol-lab/epub-translator)

## Traducir ES→EN (sin OpenAI)

En la cinta: **ES→EN**, **Doc→EN**, **ES|EN** (bilingüe párrafo a párrafo).

No usa claves OpenAI. Cadena:

1. Python `deep-translator` → Google Translate
2. Google Translate gtx (HTTP, sin API key)
3. LibreTranslate (`LIBRETRANSLATE_URL`, opcional)
4. Argos Translate offline (si está instalado)
5. Fallback PHP con Google gtx

```bash
pip install deep-translator
# opcional offline:
# pip install argostranslate
```

API: `POST /api/tiptap/translate` con `{ "text": "…", "mode": "replace"|"bilingual" }`.

La plantilla `epub_translator_prompt/translate.jinja` documenta las reglas de fidelidad del flujo (segmentación por párrafos, sin omitir, bilingüe tipo `APPEND_BLOCK`).

## Vivid Vector

No es `font-family`: cada letra es un SVG. En la cinta: **VV**, **▶VV**, **VV⇄**. Doble clic en un bloque para editar.

Assets en `frontend/public/vivid/` (BSD-2-Clause).

## Build

```bash
cd tiptap_editor/frontend
npm install
npm run build
```

Abrir: `/tiptap` (dock → TipTap).
