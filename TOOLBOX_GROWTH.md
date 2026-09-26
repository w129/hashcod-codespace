# Toolbox: automatic successor bars

Each Toolbox bar contains 16 slots. A bar is full when its 16 distinct slot coordinates have the existing `is-filled` class. A full bar numbered `n` makes bar `n + 1` available. If that successor already exists, it is reused. Partial bars do not trigger growth. Existing bars 1–4 and their tool handlers remain compatible; clearing a slot does not delete subsequent bars.

The mathematical model is the finite ordinals below omega: every materialized bar has a successor, with no final configured bar number. This is on-demand, potentially unbounded growth, not an actual infinite allocation or transfinite arithmetic. RAM, HTML size and device resources remain finite. Decimal strings in PHP and `BigInt` in JavaScript avoid fixed-width page-number overflow. Never pass a large page number as a JavaScript `Number`; use its decimal string.

## Runtime

- `toolbox-growth.php` derives a versioned page manifest from the trusted Toolbox markup in the rendered platform response. `l8-html.php` injects it before CSP nonce processing; `laragon-local-entry.php` uses the same helper.
- `components/toolbox-growth.js` materializes missing successors with fresh slot identifiers and the current Toolbox decorations. It observes slot class/coordinate changes, so a component filling the final slot gets the next bar without reloading. Repeated notifications are idempotent.
- The static `404.html` distribution calculates the same growth from its DOM if no PHP manifest is present. The PHP and static entrypoints load the same versioned component and CSS.
- Navigation renders at most seven chips, with previous/next buttons and Alt+ArrowLeft/Right. Navigation never creates pages merely to satisfy an arbitrary requested page number.
- Page markup remains proportional to the number of materialized bars; this change does not virtualize tool content or claim constant memory for unlimited tools.

## Source of occupancy and persistence

The current Toolbox catalog is defined by platform markup. It has no active user-editable Toolbox storage API; `toolbox-secure.php` remains retired with HTTP 410. This change does not reactivate that API, change authentication, add provider dependencies, or create a database table.

For permanent tools, preserve their catalog markup in both platform entrypoints. For tools registered at runtime, the owning component must restore its saved slot content and `is-filled` state; the growth component then reconstructs the necessary empty successors. An empty successor is derived state, not a separate database record. Arbitrary DOM edits alone are not persisted across reloads. A future editable catalog must implement authenticated durable storage in its own registration path before relying on reload persistence.

## Verification and release

Run:

```sh
php tests/e2e/test_toolbox_ordinal_growth.php
node tests/e2e/test_toolbox_ordinal_dom.js
node tests/e2e/test_toolbox_ordinal_growth.js
node tests/e2e/test_secure_toolbox_links.js
node tests/e2e/test_desktop_runtime_contract.js
```

The DOM suite requires `jsdom`; the browser suite requires `playwright` and Chromium. They are test-only dependencies, installed separately by `.github/workflows/toolbox-growth.yml`. `CHROMIUM_EXECUTABLE_PATH` can select an existing test browser. Tests cover partial/full occupancy, duplicate slot counting, successor reuse, growth past four bars, exact large ordinals, duplicate IDs, navigation, original handlers and mobile navigation width.

The desktop workflow packages these same tracked root files and checks source parity. After merge, verify the deployed page loads `toolbox-growth.js?v=20260920-ordinal1` and confirm the rebuilt Windows installer contains that version. A real Windows/Electron run and deployed-site smoke test remain release checks; isolated DOM tests do not establish deployment success.

Rollback: revert this change, including both entrypoint controller replacements, so the previous four-page controller is restored with matching assets.
