# Toolbook BranchedMenu React island

This directory is the active React integration for the Toolbook BranchedMenu.

## Source of truth

- `BranchedMenu.jsx` — the supplied React component source.
- `BranchedMenu.css` — the supplied component stylesheet.
- `entry.jsx` — renders the requested usage example and connects selection events.
- `package.json` — isolated React, Hugeicons and esbuild dependencies.

## Runtime integration

The native PHP/HTML platform creates one mount point:

`#hashcodToolbookBranchedMenuMount`

The React island is compiled by:

`npm install && npm run build`

which generates:

- `components/toolbook-branched-menu.bundle.js`
- `components/toolbook-branched-menu.bundle.css`

Production Docker builds these assets automatically.

The Toolbook page always loads `components/toolbook-page-blank.css`. That stylesheet also contains the exact BranchedMenu CSS as a fail-safe, so the component cannot fall back to browser-default buttons if the generated CSS file is delayed or missing.

## Important

Do not paste the JSX directly into `index.php`, `404.html`, or a plain `components/*.js` file. Edit the React component here and render it through `entry.jsx`.
