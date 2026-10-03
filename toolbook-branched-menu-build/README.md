# Toolbook BranchedMenu React island

This folder is the correct place to keep the React component source for the Toolbook BranchedMenu.

The main Hashcod Codespace application is native PHP/HTML/JavaScript, not a React SPA. Do not paste JSX directly into `components/*.js`, `index.php`, `404.html`, or the blank-screen runtime. Doing that can make the browser render unstyled HTML controls.

## Files

- `BranchedMenu.jsx` — exact React component source.
- `BranchedMenu.css` — the component stylesheet. Keep the import `import './BranchedMenu.css';` inside the JSX file.
- `entry.jsx` — the React entry point where the component is rendered and its props/items are configured.
- `package.json` — isolated React/esbuild/Hugeicons dependencies.

## Correct integration path

1. Edit the component only in `toolbook-branched-menu-build/BranchedMenu.jsx`.
2. Keep its CSS in `toolbook-branched-menu-build/BranchedMenu.css`.
3. Configure the usage example in `toolbook-branched-menu-build/entry.jsx`.
4. Build the island from this directory with `npm install` and `npm run build`.
5. The build emits:
   - `components/toolbook-branched-menu.bundle.js`
   - `components/toolbook-branched-menu.bundle.css`
6. Only when the Toolbook page is ready to display it, add a dedicated mount node such as:
   `<div id="hashcodToolbookBranchedMenuMount"></div>`
7. Load both generated assets on that page. The CSS bundle is mandatory.

The current Toolbook screen intentionally does not load this island. It stays blank until the component is deliberately mounted again.
