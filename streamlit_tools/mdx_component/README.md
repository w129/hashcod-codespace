# l8 MDX Editor (Streamlit component)

Wraps [`@mdxeditor/editor`](https://github.com/mdx-editor/editor) for SoroOtbedit.

- Native markdown (headings, lists, links, tables, code, HR)
- Diff/source toggle for raw markdown
- Outline jump (`jump_line` / `jump_text`) for Yohaku

## Build

```bash
cd frontend
npm install
npm run build
```

The `frontend/build/` folder is what Streamlit loads at runtime (committed).
