# l8 Draft.js (Streamlit component)

Wraps [Draft.js](https://github.com/facebookarchive/draft-js) (Facebook archive) for SoroOtbedit.

Uses Draft.js primitives end-to-end:

- `Editor` + `RichUtils` (inline/block)
- `CompositeDecorator` + LINK entities
- `EditorState.undo` / `redo`
- `AtomicBlockUtils` for horizontal rules
- `handleBeforeInput` markdown shortcuts (`#`, `-`, `>`, …)
- Markdown I/O via `draft-js-import-markdown` / `draft-js-export-markdown`
- Outline jump (`jump_line` / `jump_text`) for Yohaku

## Build

```bash
cd frontend
npm install
npm run build
```
