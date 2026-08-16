# TipTap · Documento (l8)

Ventana de hoja directa tipo Word con:

- [TipTap](https://github.com/ueberdosis/tiptap)
- [Tailwind CSS Typography](https://github.com/tailwindlabs/tailwindcss-typography) (`prose`)
- **300 tipografías** Google Fonts (selector Fuente)
- **[Vivid Vector Alphabet](https://github.com/neodigm/vivid_vector_alphabet)** — tipografía ilustrada SVG (ribbon **Vivid Vector**)
- **Traductor ES→EN** con el prompt y motor de [oomol-lab/epub-translator](https://github.com/oomol-lab/epub-translator)

## Traducir ES→EN

En la cinta: **ES→EN** (selección o documento), **Doc→EN** (todo el documento), **ES|EN** (bilingüe párrafo a párrafo).

Cadena de traducción:

1. Python `translate_es_en.py` + paquete `epub-translator` (preferido)
2. Misma plantilla `epub_translator_prompt/translate.jinja` vía OpenAI HTTP (`OPENAI_API_KEY`)
3. Fallback: sesión AI chat de la plataforma

```bash
pip install epub-translator
# o: pip install git+https://github.com/oomol-lab/epub-translator.git
export OPENAI_API_KEY=sk-...
```

API: `POST /api/tiptap/translate` con `{ "text": "…", "mode": "replace"|"bilingual" }`.

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
