# TipTap · Documento (l8)

Ventana de hoja directa tipo Word con:

- [TipTap](https://github.com/ueberdosis/tiptap)
- [Tailwind CSS Typography](https://github.com/tailwindlabs/tailwindcss-typography) (`prose`)
- **300 tipografías** Google Fonts (selector Fuente)
- **[Vivid Vector Alphabet](https://github.com/neodigm/vivid_vector_alphabet)** (Scott C. Krause / neodigm) — tipografía ilustrada SVG aparte del selector de fuentes (ribbon **Vivid Vector**)

## Vivid Vector

No es `font-family`: cada letra es un SVG. En la cinta: **VV** (estático), **▶VV** (ticker animado), **VV⇄** (alternar animación). Doble clic en un bloque para editar el texto.

Assets en `frontend/public/vivid/` (BSD-2-Clause).

## Build

```bash
cd tiptap_editor/frontend
npm install
npm run build
```

Abrir: `/tiptap` (dock → TipTap).
