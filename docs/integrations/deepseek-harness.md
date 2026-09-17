# Hashcod × DeepSeek Harness

## Purpose

Hashcod Codespace integrates DeepSeek Harness in the sixth cube of the 3D vector tray (`slot 5`). The cube is a local control surface for the upstream agent harness; it is not a forked reimplementation of the DeepSeek core.

## Upstream

- Repository: `https://github.com/wangbo178/Agi-deepseek-harnees`
- Product name: DeepSeek Harness (`dsh`)
- License: MIT
- Status: developer preview
- Default Web UI: `http://127.0.0.1:3080`
- Official launch pattern: `npx @deepseek-ai/dsh web`
- Required Node engine in the referenced source: Node `22.19+` or `24+`

DeepSeek Harness uses Cordis and follows an everything-is-a-plugin architecture. Profiles compose bundles and patches; model adapters, tools, sessions, the agent loop, persistence, sandboxing and approval policy are replaceable capabilities.

## Hashcod integration profile

Identifier: `HASHCOD-DSH-1`

The integration provides:

1. sixth-cube registration in `HashcodVectorTray`,
2. a Hashcod-styled local Harness Control Center,
3. configurable localhost port with `3080` as the default,
4. runtime reachability checks when browser security policy permits them,
5. direct handoff to the upstream Web UI,
6. a local launcher that starts the official `@deepseek-ai/dsh` package,
7. explicit loopback-only binding to `127.0.0.1`,
8. upstream attribution from inside the UI.

## Security boundary

The DeepSeek Harness Web API is treated as a local execution-capable surface. Hashcod therefore keeps the default integration on `127.0.0.1`; the launcher does not bind the Harness to `0.0.0.0` or another remote interface.

The browser cube does not execute shell commands itself. Local startup is performed by `local-app/deepseek-harness-launcher.mjs`, which invokes `npx` without `shell: true` and forwards a fixed loopback host.

## Files

- `components/deepseek-harness-loader.js`
- `components/deepseek-harness-cube.js`
- `components/deepseek-harness-cube.css`
- `local-app/deepseek-harness-launcher.mjs`
- `tests/e2e/test_deepseek_harness_cube.js`
- `tests/e2e/test_deepseek_harness_browser_playwright.js`

No DeepSeek API key is stored in Hashcod source code by this integration.