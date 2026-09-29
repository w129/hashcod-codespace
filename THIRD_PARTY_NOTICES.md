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
