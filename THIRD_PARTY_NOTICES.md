# Third-Party Notices

## Mac Duo

Hashcod Codespace includes a browser-based page transition inspired by the visual model of **Mac Duo**.

- Project: Mac Duo
- Source: https://github.com/sumimakito/Mac-Duo
- Copyright: 2026 Makito
- Notice: Originally developed by Makito.
- License: Apache License 2.0

The Hashcod browser adaptation uses the same high-level visual principles described by Mac Duo—bottom-edge hinge perspective, recession, blur progression, and dimming progression—translated to standard web animation. It does not include the original macOS lid-angle sensor, ScreenCaptureKit, Metal renderer, or native application code.

## Spectrum UI

The ML-DSA-87 access card adapts the interaction and visual structure of Spectrum UI's `AccountAccessCard` component for Hashcod's post-quantum challenge/signature workflow.

- Project: Spectrum UI
- Source: https://github.com/arihantcodes/spectrum-ui
- Components: `AccountAccessCard`, `FAQTabsCard`, `NavListCard`, `NumberTicker`, `NumberTickerDemo`, `ScratchCard`, `ScratchCardDemo`, `TiltCard`, `TiltCardDemo`, `BeamCard`, `BeamCardDemo`, `AnimatedCard`, and `AnimatedCardDemo`
- License: Apache License 2.0
- Modifications: the account card fields were replaced by ML-DSA-87 challenge/signature controls; the FAQTabsCard, NavListCard, NumberTicker, ScratchCard, TiltCard, BeamCard, and AnimatedCard stack were translated from React/Motion into native HTML/CSS/JavaScript, with Tailwind CSS replaced by the user-provided Spotlight Code SVG/title/description, Next.js replaced by the user-provided Pit Barriers SVG/title/description, Shadcn UI replaced by the user-provided Single bed base SVG/title/description, and Aceternity UI replaced by the user-provided Tokenized certification SVG/title/description.

## pqcrypto

Hashcod uses pqcrypto as the server-side verifier for NIST FIPS 204 ML-DSA-87 signatures.

- Project: pqcrypto
- Source: https://github.com/backbone-hq/pqcrypto
- Version: 1.0.0
- License: Apache License 2.0

## TagSpaces editorText

Hashcod Codespace adapts the edit/save lifecycle of the archived TagSpaces `editorText` extension for the liquid-glass text editor shown beneath the access FAQ.

- Project: TagSpaces editorText
- Source: https://github.com/tagspaces/editorText
- Original role: text-document editing extension using CodeMirror
- License: MIT
- Modifications: Hashcod uses its own Spectrum-style liquid-glass AutosizeTextarea interface and its own PHP + Supabase/local persistence backend. The integration preserves the editorText concepts of content loading, change tracking, save behavior, and Ctrl+S semantics rather than embedding the legacy TagSpaces UI.

## PMX-VMD-Scripting-Tools

Hashcod Codespace's liquid text-editor tools are informed by the robust text/file handling patterns in Nuthouse01's PMX/VMD Scripting Tools, including persistent editor state, Unicode/encoding awareness, validated text input, word-wrapped text handling, and safe text transformations.

- Project: PMX-VMD-Scripting-Tools
- Source: https://github.com/Nuthouse01/PMX-VMD-Scripting-Tools
- Copyright: © 2020 Nuthouse01
- License: MIT
- Hashcod adaptation: browser-side UTF-8 / Shift-JIS import, NFKC normalization, control-character cleanup, TXT export, richer counters, and server-side text sanitation. PMX/VMD model-editing logic is not embedded into the Hashcod text editor.


## Banger Editor

Hashcod Codespace's Markdown command layer in the initial text editor is inspired by the editor capabilities exposed by **Banger Editor**.

- Project: Banger Editor
- Source: https://github.com/bangle-io/banger-editor
- Copyright: © 2020 bangle-io
- License: MIT
- Hashcod adaptation: the existing textarea/autosave architecture is retained while adding Markdown formatting, history, headings, blockquotes, code/code-blocks, lists, links, horizontal rules, and slash-command suggestions modeled on the capabilities represented by Banger Editor modules. The ProseMirror runtime itself is not vendored into Hashcod.


## page-mascot

Hashcod Codespace uses a native JavaScript adaptation of **page-mascot** for the interactive panda shown in the upper-right corner of the main platform.

- Project: page-mascot
- Source: https://github.com/nilbuild/page-mascot
- Copyright: © Kamran Ahmed
- License: MIT
- Hashcod adaptation: preserves the original 3×3 direction/reaction sprite model, fine-pointer tracking, dead zone and hysteresis, click reactions, four-click dizzy state, and reduced-motion behavior. Hashcod's main UI is native PHP/JavaScript rather than React, so the interaction logic is adapted without adding a React runtime.
- Panda atlases: verified against upstream Git blob SHAs 6f3f42dcf066c2b1c01e85913d2ea8828215f474 and aaecccbcc7aaeb646aeb2a10145d31701ada5e9e.

## agenttrail

Hashcod Codespace's page mascot walker adapts ideas from **agenttrail**: its dotted, round-capped session trail (dashed polyline at 55% opacity) and its rule that visualizations only illustrate activity that is actually observed. No agenttrail source code is bundled or executed.

- Project: agenttrail
- Source: https://github.com/sodiumsun/agenttrail
- Copyright: © 2026 Kelly Sun
- License: MIT

## React Bits — RotatingText

Hashcod Codespace uses a native JavaScript adaptation of **React Bits RotatingText** on the first entry screen.

- Project: React Bits
- Source: https://github.com/DavidHDev/react-bits
- Component: `RotatingText`
- License: MIT
- Hashcod adaptation: preserves the requested four-text loop (`code`, `dev`, `programing`, `llm`, `deeplearming`, plus data-structure terms such as `data structures`, `algorithms`, `schemas`, `vectors`, `graphs`, `trees`, and `hash maps`), 2000 ms rotation interval, character-level reveal, last-to-first 25 ms staggering, vertical 100% entry / -120% exit motion, reduced-motion handling, and imperative next/previous/jump/reset controls. The first entry page is native PHP/JavaScript, so this adaptation does not add a React/Motion runtime. The demo accent background is replaced with Hashcod black.


## Animate UI — Cursor

Hashcod Codespace uses a native JavaScript/CSS adaptation of **Animate UI Cursor** as the global desktop cursor.

- Project: Animate UI
- Source: https://github.com/imskyleen/animate-ui
- Component: `CursorProvider`, `Cursor`, and `CursorFollow`
- License: MIT
- Hashcod adaptation: the previous WebGL smoke cursor is retired. The cursor is global on fine-pointer desktop devices, suppresses the native pointer, follows pointer movement with spring-inspired motion, and renders the requested branch-style SVG icon as the follow element using the requested defaults: `side="bottom"`, `sideOffset={15}`, `align="end"`, and `alignOffset={5}`. Touch/coarse-pointer devices fall back to their normal pointer behavior.

## Toolbook BranchedMenu / Hugeicons React island

Hashcod Codespace mounts the supplied BranchedMenu as an isolated React island from `toolbook-branched-menu-build/`.

- Runtime source: React JSX + CSS
- Icon renderer: `@hugeicons/react`
- Icon data: `@hugeicons/core-free-icons`
- Hugeicons license: MIT
- Integration: the native Toolbook screen creates a dedicated mount point; the React island is built with esbuild and receives an always-loaded copy of the supplied BranchedMenu CSS as a rendering fail-safe.


## Ponytail (agent skills and role)

Hashcod Codespace vendors the Ponytail skills under `.claude/skills/ponytail*` for development tooling only; there is no runtime dependency.

- Source: https://github.com/DietrichGebert/ponytail (v5.1.0)
- License: MIT, Copyright (c) 2026 DietrichGebert

## OpenDataLoader PDF (PDF extraction tool)

The Docker image installs the OpenDataLoader PDF CLI from npm (`@opendataloader/pdf`) and runs it on the server; it is not vendored in the repository.

- Source: https://github.com/opendataloader-project/opendataloader-pdf
- License: Apache-2.0
