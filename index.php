<?php
// index.php - Servidor Native PHP + React TypeScript l8 (Inspección de Código por Carpetas en Consola Negra)
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>l8 codespace</title>
    <link rel="icon" href="/favicon.svg?v=3" type="image/svg+xml">
    <link rel="shortcut icon" href="/favicon.svg?v=3" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/favicon.svg?v=3">
    <meta name="application-name" content="l8 codespace">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: #ffffff;
            color: #000000;
            font-family: 'IBM Plex Mono', monospace, ui-monospace;
            font-size: 13px;
            -webkit-font-smoothing: antialiased;
        }

        .top-bar {
            background-color: #e5e5e5;
            border-bottom: 1px solid #d0d0d0;
            padding: 4px 8px;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #222222;
            user-select: none;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .left-controls {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
        }

        .checkbox-label input {
            cursor: pointer;
        }

        .top-bar-right {
            display: flex;
            align-items: center;
            gap: 8px;
            padding-right: 4px;
            position: relative;
        }
        .icon-tokens {
            position: relative;
            height: 22px;
            width: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #111111;
            background: transparent;
            border: none;
            padding: 0;
            cursor: pointer;
        }

        .icon-tokens svg {
            height: 20px;
            width: 20px;
            display: block;
            fill: currentColor;
        }

        .icon-tokens:hover {
            opacity: 0.75;
        }

        .icon-tokens.low {
            color: #b06000;
        }

        .icon-tokens.exhausted {
            color: #c5221f;
        }

        .tokens-panel {
            display: none;
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            width: min(360px, calc(100vw - 24px));
            max-height: min(70vh, 520px);
            overflow: auto;
            background: #ffffff;
            border: 1px solid #d0d0d0;
            border-radius: 10px;
            box-shadow: 0 12px 32px rgba(0,0,0,0.14);
            padding: 14px;
            z-index: 40;
            color: #111;
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
        }

        .tokens-panel.open { display: block; }

        .tokens-panel h3 {
            margin: 0 0 8px;
            font-size: 13px;
            font-weight: 700;
        }

        .tokens-panel .tokens-period {
            font-size: 11px;
            color: #666;
            margin-bottom: 12px;
        }

        .tokens-meter-track {
            height: 8px;
            border-radius: 999px;
            background: #eceae4;
            overflow: hidden;
            margin-bottom: 10px;
        }

        .tokens-meter-fill {
            height: 100%;
            width: 0%;
            background: #111111;
            border-radius: 999px;
            transition: width 0.25s ease;
        }

        .tokens-meter-fill.warn { background: #b06000; }
        .tokens-meter-fill.danger { background: #c5221f; }

        .tokens-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            font-size: 11px;
            margin-bottom: 10px;
        }

        .tokens-stats div {
            background: #faf9f6;
            border: 1px solid #e6e3dd;
            border-radius: 8px;
            padding: 8px;
        }

        .tokens-stats strong {
            display: block;
            font-size: 13px;
            margin-top: 2px;
        }

        .tokens-legend {
            font-size: 11px;
            color: #444;
            line-height: 1.45;
        }

        .tokens-section-title {
            margin: 12px 0 6px;
            font-size: 11px;
            font-weight: 700;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .tokens-history,
        .tokens-ledger {
            list-style: none;
            margin: 0;
            padding: 0;
            font-size: 11px;
            color: #333;
        }

        .tokens-history li,
        .tokens-ledger li {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            padding: 6px 0;
            border-top: 1px solid #eee;
            line-height: 1.35;
        }

        .tokens-history li:first-child,
        .tokens-ledger li:first-child {
            border-top: none;
        }

        .tokens-history .muted,
        .tokens-ledger .muted {
            color: #777;
        }

        .tokens-empty {
            font-size: 11px;
            color: #888;
            margin: 0;
        }

        .tokens-persist-note {
            margin-top: 10px;
            font-size: 10px;
            color: #888;
            line-height: 1.4;
        }


        .icon-globe,
        .icon-tokens,
        .icon-gateway,
        .icon-ubuntu-cli,
        .icon-claude-cli,
        .icon-zylon-cli,
        .icon-toolkit,
        .icon-notepad {
            height: 22px;
            width: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #111111;
            background: transparent;
            border: none;
            padding: 0;
            cursor: pointer;
        }

        .icon-gateway,
        .icon-ubuntu-cli,
        .icon-claude-cli,
        .icon-zylon-cli,
        .icon-notepad {
            cursor: pointer;
        }

        .icon-globe svg,
        .icon-tokens svg,
        .icon-gateway svg,
        .icon-ubuntu-cli svg,
        .icon-ubuntu-cli img,
        .icon-claude-cli svg,
        .icon-claude-cli img,
        .icon-zylon-cli svg,
        .icon-zylon-cli img,
        .icon-toolkit svg,
        .icon-notepad svg {
            height: 20px;
            width: 20px;
            max-width: 20px;
            max-height: 20px;
            display: block;
            fill: currentColor;
            object-fit: contain;
        }

        .icon-ubuntu-cli {
            width: 22px;
            height: 24px;
            margin-left: 4px;
        }

        .icon-ubuntu-cli img {
            width: 18px;
            height: 22px;
            max-width: 18px;
            max-height: 22px;
        }

        .icon-claude-cli,
        .icon-zylon-cli {
            width: 22px;
            height: 24px;
            margin-left: 2px;
        }

        .icon-claude-cli img,
        .icon-zylon-cli img {
            width: 18px;
            height: 18px;
            max-width: 18px;
            max-height: 18px;
        }

        .icon-gateway:hover,
        .icon-ubuntu-cli:hover,
        .icon-claude-cli:hover,
        .icon-zylon-cli:hover,
        .icon-toolkit:hover,
        .icon-notepad:hover {
            opacity: 0.75;
        }

        .icon-notepad {
            width: 22px;
            height: 22px;
            margin-left: 4px;
            margin-right: 2px;
        }

        .hashcod-created-by {
            display: inline-flex;
            align-items: center;
            flex: 0 0 auto;
            height: 14px;
            margin-left: 4px;
            line-height: 0;
            background: transparent;
        }

        .hashcod-created-by img {
            display: block;
            height: 14px;
            width: auto;
            max-width: min(170px, 46vw);
            object-fit: contain;
            background: transparent;
        }


        .icon-toolkit {
            height: 22px;
            width: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #111111;
            background: transparent;
            border: none;
            padding: 0;
            cursor: pointer;
            margin-left: 2px;
            margin-right: 2px;
        }

        .icon-toolkit svg {
            height: 20px;
            width: 20px;
            display: block;
            fill: currentColor;
        }

        .icon-toolkit:hover {
            opacity: 0.75;
        }

        /* ===== Toolkit / fichas de herramientas ===== */
        .toolkit-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 82;
            background: rgba(20, 20, 20, 0.28);
            align-items: stretch;
            justify-content: center;
            padding: 28px 16px 16px;
        }

        .toolkit-overlay.open {
            display: flex;
        }

        .toolkit-shell {
            width: min(1080px, 100%);
            height: min(780px, calc(100vh - 44px));
            background: #f6f6f6;
            border: 1px solid #cccccc;
            border-radius: 2px;
            box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            color: #111;
        }

        .toolkit-top {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            background: #e5e5e5;
            border-bottom: 1px solid #d0d0d0;
            flex-shrink: 0;
        }

        .toolkit-brand {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.02em;
            white-space: nowrap;
        }

        .toolkit-sub {
            flex: 1;
            font-size: 11px;
            color: #666;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .toolkit-close {
            border: 1px solid #bbbbbb;
            background: #f0f0f0;
            color: #111;
            font: inherit;
            font-size: 12px;
            padding: 4px 10px;
            cursor: pointer;
        }

        .toolkit-close:hover {
            background: #e4e4e4;
        }

        .toolkit-board {
            flex: 1;
            overflow: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            background:
                linear-gradient(180deg, #fafafa 0%, #f3f3f3 100%);
        }

        .toolkit-ficha {
            position: relative;
            display: grid;
            grid-template-columns: minmax(84px, 110px) minmax(0, 1fr) minmax(0, 1fr);
            grid-template-rows: minmax(140px, 1fr) 78px;
            min-height: 230px;
            background: #ffffff;
            border: 2.5px solid #111111;
            box-shadow: 0 1px 0 rgba(0,0,0,0.04);
        }

        .toolkit-ficha {
            position: relative;
        }

        .toolkit-ficha-delete {
            position: absolute;
            top: 0;
            right: 0;
            z-index: 3;
            width: 30px;
            height: 26px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: none;
            border-left: 1px solid #d0d0d0;
            border-bottom: 1px solid #d0d0d0;
            background: #e8e8e8;
            color: #111111;
            padding: 0;
            cursor: pointer;
        }

        .toolkit-ficha-delete svg {
            width: 14px;
            height: 14px;
            display: block;
            fill: currentColor;
        }

        .toolkit-ficha-delete:hover {
            background: #111111;
            color: #ffffff;
        }

        .toolkit-ficha-files .toolkit-pane-head {
            padding-right: 36px;
        }

        .toolkit-board-empty {
            border: 2.5px dashed #bbbbbb;
            background: #fafafa;
            color: #777;
            font-size: 12px;
            padding: 28px 16px;
            text-align: center;
            line-height: 1.45;
        }


        .toolkit-ficha-icon {
            grid-column: 1;
            grid-row: 1 / span 2;
            border-right: 2.5px solid #111111;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 14px 10px;
            background: #f7f7f7;
        }

        .toolkit-ficha-icon img,
        .toolkit-ficha-icon svg.platform {
            width: 44px;
            height: 44px;
            display: block;
            object-fit: contain;
        }

        .toolkit-ficha-icon .ficha-mark {
            font-size: 10px;
            font-weight: 700;
            text-align: center;
            line-height: 1.25;
            color: #222;
            max-width: 90px;
            word-break: break-word;
        }

        .toolkit-ficha-history {
            grid-column: 2;
            grid-row: 1;
            border-right: 2.5px solid #111111;
            border-bottom: 2.5px solid #111111;
            min-width: 0;
            display: flex;
            flex-direction: column;
            background: #fff;
        }

        .toolkit-ficha-files {
            grid-column: 3;
            grid-row: 1;
            border-bottom: 2.5px solid #111111;
            min-width: 0;
            display: flex;
            flex-direction: column;
            background: #fff;
        }

        .toolkit-ficha-tools {
            grid-column: 2 / span 2;
            grid-row: 2;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            overflow-x: auto;
            background: #fafafa;
        }

        .toolkit-pane-head {
            flex-shrink: 0;
            padding: 7px 10px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: #555;
            border-bottom: 1px solid #e2e2e2;
            background: #f3f3f3;
        }

        .toolkit-pane-body {
            flex: 1;
            overflow: auto;
            padding: 8px;
            min-height: 0;
        }

        .toolkit-history-list,
        .toolkit-files-list {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .toolkit-history-list li {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 8px;
            align-items: baseline;
            padding: 6px 8px;
            border: 1px solid #e8e8e8;
            background: #fcfcfc;
            font-size: 11px;
            line-height: 1.35;
        }

        .toolkit-history-list li strong {
            font-weight: 600;
            color: #111;
        }

        .toolkit-history-list li .when {
            color: #777;
            font-size: 10px;
            white-space: nowrap;
        }

        .toolkit-files-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
            gap: 6px;
        }

        .toolkit-file {
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 7px 8px;
            border: 1px solid #e5e5e5;
            background: #fcfcfc;
            min-width: 0;
            cursor: default;
        }

        .toolkit-file .file-ico {
            width: 18px;
            height: 18px;
            flex: 0 0 auto;
            color: #111;
        }

        .toolkit-file .file-ico svg {
            width: 18px;
            height: 18px;
            display: block;
            fill: currentColor;
        }

        .toolkit-file .file-name {
            font-size: 11px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            min-width: 0;
        }

        .toolkit-empty {
            font-size: 11px;
            color: #888;
            padding: 10px 6px;
            line-height: 1.4;
        }

        .toolkit-tool-btn {
            width: 40px;
            height: 40px;
            flex: 0 0 auto;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid #111;
            background: #ffffff;
            color: #111;
            padding: 0;
            cursor: pointer;
        }

        .toolkit-tool-btn svg,
        .toolkit-tool-btn img {
            width: 20px;
            height: 20px;
            display: block;
            fill: currentColor;
            object-fit: contain;
        }

        .toolkit-tool-btn:hover:not(:disabled) {
            background: #111;
            color: #fff;
        }

        .toolkit-tool-btn:hover:not(:disabled) img {
            filter: invert(1);
        }

        .toolkit-tool-btn:disabled,
        .toolkit-tool-slot {
            opacity: 0.35;
            cursor: default;
            border-style: dashed;
            background: #f5f5f5;
        }

        .toolkit-tool-slot {
            width: 40px;
            height: 40px;
            flex: 0 0 auto;
            border: 1.5px dashed #888;
            background: #f5f5f5;
        }

        @media (max-width: 720px) {
            .toolkit-ficha {
                grid-template-columns: 72px 1fr;
                grid-template-rows: auto auto auto;
                min-height: 0;
            }
            .toolkit-ficha-icon {
                grid-column: 1;
                grid-row: 1 / span 3;
            }
            .toolkit-ficha-history {
                grid-column: 2;
                grid-row: 1;
                border-right: none;
                min-height: 120px;
            }
            .toolkit-ficha-files {
                grid-column: 2;
                grid-row: 2;
                border-right: none;
                min-height: 120px;
            }
            .toolkit-ficha-tools {
                grid-column: 2;
                grid-row: 3;
            }
        }


        /* ===== Toolkit · foro Ingeniería (agency-agents) ===== */
        .toolkit-agent-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 86;
            background: rgba(20, 20, 20, 0.32);
            align-items: stretch;
            justify-content: center;
            padding: 28px 16px 16px;
        }

        .toolkit-agent-overlay.open {
            display: flex;
        }

        .toolkit-agent-shell {
            width: min(1120px, 100%);
            height: min(820px, calc(100vh - 44px));
            background: #f6f6f6;
            border: 1px solid #cccccc;
            border-radius: 2px;
            box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            color: #111;
        }

        .toolkit-agent-top {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            background: #e5e5e5;
            border-bottom: 1px solid #d0d0d0;
            flex-shrink: 0;
        }

        .toolkit-agent-brand {
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
        }

        .toolkit-agent-sub {
            flex: 1;
            font-size: 11px;
            color: #666;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .toolkit-agent-close {
            border: 1px solid #bbbbbb;
            background: #f0f0f0;
            color: #111;
            font: inherit;
            font-size: 12px;
            padding: 4px 10px;
            cursor: pointer;
        }

        .toolkit-agent-close:hover {
            background: #e4e4e4;
        }

        .toolkit-agent-main {
            flex: 1;
            min-height: 0;
            display: grid;
            grid-template-columns: minmax(220px, 300px) 1fr;
        }

        .toolkit-agent-list {
            border-right: 1px solid #d0d0d0;
            background: #fafafa;
            overflow: auto;
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .toolkit-agent-filter {
            width: 100%;
            box-sizing: border-box;
            height: 30px;
            border: 1px solid #cccccc;
            background: #fff;
            font: inherit;
            font-size: 12px;
            padding: 0 8px;
            margin-bottom: 6px;
            outline: none;
        }

        .toolkit-agent-item {
            text-align: left;
            border: 1px solid transparent;
            background: transparent;
            font: inherit;
            font-size: 11px;
            line-height: 1.35;
            padding: 8px 9px;
            cursor: pointer;
            color: #222;
        }

        .toolkit-agent-item:hover {
            background: #f0f0f0;
            border-color: #e0e0e0;
        }

        .toolkit-agent-item.active {
            background: #111;
            color: #fff;
            border-color: #111;
        }

        .toolkit-agent-item .emoji {
            margin-right: 4px;
        }

        .toolkit-agent-item .desc {
            display: block;
            margin-top: 3px;
            font-size: 10px;
            color: #777;
            line-height: 1.3;
        }

        .toolkit-agent-item.active .desc {
            color: #cfcfcf;
        }

        .toolkit-agent-view {
            overflow: auto;
            background: #ffffff;
            padding: 18px 22px 28px;
        }

        .toolkit-agent-view .md-status {
            font-size: 12px;
            color: #777;
            padding: 24px 8px;
        }

        .toolkit-agent-view .md-status.err {
            color: #c5221f;
        }

        .toolkit-md {
            font-size: 13px;
            line-height: 1.55;
            color: #181818;
            max-width: 820px;
        }

        .toolkit-md h1,
        .toolkit-md h2,
        .toolkit-md h3,
        .toolkit-md h4 {
            line-height: 1.25;
            margin: 1.1em 0 0.45em;
            font-weight: 700;
        }

        .toolkit-md h1 { font-size: 1.55em; }
        .toolkit-md h2 { font-size: 1.28em; border-bottom: 1px solid #ececec; padding-bottom: 0.25em; }
        .toolkit-md h3 { font-size: 1.1em; }

        .toolkit-md p,
        .toolkit-md ul,
        .toolkit-md ol,
        .toolkit-md pre,
        .toolkit-md blockquote {
            margin: 0.55em 0;
        }

        .toolkit-md ul,
        .toolkit-md ol {
            padding-left: 1.35em;
        }

        .toolkit-md code {
            font-family: inherit;
            font-size: 0.92em;
            background: #f3f3f3;
            padding: 0.1em 0.35em;
            border-radius: 2px;
        }

        .toolkit-md pre {
            background: #f4f4f4;
            border: 1px solid #e4e4e4;
            padding: 12px;
            overflow: auto;
        }

        .toolkit-md pre code {
            background: transparent;
            padding: 0;
        }

        .toolkit-md blockquote {
            border-left: 3px solid #cccccc;
            padding-left: 12px;
            color: #555;
        }

        .toolkit-md a {
            color: #111;
            text-decoration: underline;
        }

        .toolkit-md hr {
            border: none;
            border-top: 1px solid #e0e0e0;
            margin: 1.2em 0;
        }

        .toolkit-md-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px 14px;
            font-size: 11px;
            color: #666;
            margin-bottom: 14px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ececec;
        }

        @media (max-width: 720px) {
            .toolkit-agent-main {
                grid-template-columns: 1fr;
                grid-template-rows: minmax(160px, 34%) 1fr;
            }
            .toolkit-agent-list {
                border-right: none;
                border-bottom: 1px solid #d0d0d0;
            }
        }

        /* ===== Bloc de notas / super editor (en plataforma) ===== */
        .notepad-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 80;
            background: rgba(20, 20, 20, 0.28);
            align-items: stretch;
            justify-content: center;
            padding: 28px 16px 16px;
        }

        .notepad-overlay.open {
            display: flex;
        }

        .notepad-shell {
            width: min(1120px, 100%);
            height: min(820px, calc(100vh - 44px));
            background: #f6f6f6;
            border: 1px solid #cccccc;
            border-radius: 2px;
            box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            color: #111;
        }

        .notepad-top {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            background: #e5e5e5;
            border-bottom: 1px solid #d0d0d0;
            flex-shrink: 0;
        }

        .notepad-brand {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.02em;
            color: #222;
            white-space: nowrap;
        }

        .notepad-title {
            flex: 1;
            min-width: 0;
            height: 30px;
            border: 1px solid #cccccc;
            background: #ffffff;
            padding: 0 10px;
            font: inherit;
            font-size: 13px;
            color: #111;
            outline: none;
        }

        .notepad-title:focus {
            border-color: #999999;
        }

        .notepad-close {
            height: 30px;
            padding: 0 12px;
            border: 1px solid #cccccc;
            background: #ffffff;
            color: #111;
            font: inherit;
            font-size: 12px;
            cursor: pointer;
        }

        .notepad-close:hover {
            background: #f0f0f0;
        }

        .notepad-toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            padding: 8px 10px;
            background: #ececec;
            border-bottom: 1px solid #d0d0d0;
            flex-shrink: 0;
        }

        .notepad-tool {
            height: 28px;
            min-width: 28px;
            padding: 0 8px;
            border: 1px solid #cccccc;
            background: #ffffff;
            color: #111;
            font: inherit;
            font-size: 11px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
        }

        .notepad-tool:hover {
            background: #f7f7f7;
        }

        .notepad-tool.active {
            background: #111111;
            color: #ffffff;
            border-color: #111111;
        }

        .notepad-tool-sep {
            width: 1px;
            align-self: stretch;
            background: #d0d0d0;
            margin: 2px 4px;
        }

        .notepad-find {
            display: none;
            align-items: center;
            gap: 6px;
            width: 100%;
            margin-top: 4px;
        }

        .notepad-find.open {
            display: flex;
        }

        .notepad-find input {
            flex: 1;
            height: 28px;
            border: 1px solid #cccccc;
            background: #ffffff;
            padding: 0 8px;
            font: inherit;
            font-size: 12px;
            outline: none;
        }

        .notepad-main {
            flex: 1;
            min-height: 0;
            display: grid;
            grid-template-columns: 220px 1fr;
            background: #ffffff;
        }

        .notepad-sidebar {
            border-right: 1px solid #d0d0d0;
            background: #f0f0f0;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        .notepad-sidebar-head {
            padding: 8px;
            border-bottom: 1px solid #d0d0d0;
            display: flex;
            gap: 6px;
        }

        .notepad-sidebar-head .notepad-tool {
            flex: 1;
        }

        .notepad-list {
            list-style: none;
            margin: 0;
            padding: 6px;
            overflow: auto;
            flex: 1;
        }

        .notepad-list li {
            padding: 8px 8px;
            border: 1px solid transparent;
            cursor: pointer;
            margin-bottom: 4px;
            background: transparent;
        }

        .notepad-list li:hover {
            background: #e8e8e8;
        }

        .notepad-list li.active {
            background: #ffffff;
            border-color: #cccccc;
        }

        .notepad-list .note-name {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #111;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .notepad-list .note-meta {
            display: block;
            margin-top: 2px;
            font-size: 10px;
            color: #777;
        }

        .notepad-editor-wrap {
            min-width: 0;
            min-height: 0;
            display: flex;
            flex-direction: column;
            background: #ffffff;
        }

        .notepad-editor {
            flex: 1;
            min-height: 0;
            overflow: auto;
            padding: 16px 18px;
            outline: none;
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            font-size: 13px;
            line-height: 1.55;
            color: #111;
            white-space: pre-wrap;
            word-break: break-word;
        }

        .notepad-editor:empty:before {
            content: attr(data-placeholder);
            color: #999;
            pointer-events: none;
        }

        .notepad-status {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 6px 10px;
            background: #e5e5e5;
            border-top: 1px solid #d0d0d0;
            font-size: 11px;
            color: #555;
            flex-shrink: 0;
        }

        @media (max-width: 760px) {
            .notepad-main {
                grid-template-columns: 1fr;
            }
            .notepad-sidebar {
                max-height: 160px;
                border-right: none;
                border-bottom: 1px solid #d0d0d0;
            }
        }

        .notepad-tool.iconic {
            width: 28px;
            padding: 0;
        }

        .notepad-tool.iconic svg {
            width: 16px;
            height: 16px;
            display: block;
            fill: currentColor;
        }

        .notepad-ai-panel {
            display: none;
            width: 100%;
            margin-top: 6px;
            padding: 10px;
            border: 1px solid #cccccc;
            background: #ffffff;
            flex-direction: column;
            gap: 8px;
        }

        .notepad-ai-panel.open {
            display: flex;
        }

        .notepad-ai-row {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            align-items: center;
        }

        .notepad-ai-select,
        .notepad-ai-input {
            height: 30px;
            border: 1px solid #cccccc;
            background: #ffffff;
            font: inherit;
            font-size: 12px;
            color: #111;
            outline: none;
            padding: 0 8px;
        }

        .notepad-ai-select {
            min-width: 150px;
        }

        .notepad-ai-input {
            flex: 1;
            min-width: 180px;
        }

        .notepad-ai-status {
            font-size: 11px;
            color: #666;
            min-height: 14px;
        }

        .notepad-ai-status.err { color: #c5221f; }
        .notepad-ai-status.ok { color: #137333; }

        .notepad-ai-login {
            display: none;
            gap: 6px;
            width: 100%;
            align-items: center;
        }

        .notepad-ai-login.open {
            display: flex;
            flex-wrap: wrap;
        }

        .notepad-ocg-panel {
            display: none;
            width: 100%;
            margin-top: 6px;
            padding: 10px;
            border: 1px solid #cccccc;
            background: #ffffff;
            flex-direction: column;
            gap: 8px;
        }

        .notepad-ocg-panel.open {
            display: flex;
        }

        .notepad-ocg-row {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            align-items: center;
        }

        .notepad-ocg-select,
        .notepad-ocg-input {
            height: 30px;
            border: 1px solid #cccccc;
            background: #ffffff;
            font: inherit;
            font-size: 12px;
            color: #111;
            outline: none;
            padding: 0 8px;
        }

        .notepad-ocg-select {
            min-width: 160px;
            max-width: 100%;
        }

        .notepad-ocg-select.type {
            flex: 1;
            min-width: 220px;
        }

        .notepad-ocg-input {
            width: 72px;
        }

        .notepad-ocg-input.filter {
            flex: 1;
            min-width: 160px;
            width: auto;
        }

        .notepad-ocg-status {
            font-size: 11px;
            color: #666;
            min-height: 14px;
        }

        .notepad-ocg-status.err { color: #c5221f; }
        .notepad-ocg-status.ok { color: #137333; }

        .main-container {
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .block-row {
            display: flex;
            align-items: stretch;
            background-color: #e0e0e0;
            border: 1px solid #cccccc;
            border-radius: 2px;
            min-height: 38px;
        }

        .block-symbol {
            width: 38px;
            min-width: 38px;
            background-color: #d0d0d0;
            border-right: 1px solid #bbbbbb;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            color: #000000;
            user-select: none;
        }

        .block-body {
            flex: 1;
            padding: 8px 12px;
            background-color: #f6f6f6;
            display: flex;
            align-items: center;
            word-break: break-all;
            white-space: pre-wrap;
            line-height: 1.4;
            font-family: 'IBM Plex Mono', monospace;
        }

        .block-execution .block-body {
            background-color: #ffffff;
            min-height: 80px;
            max-height: 580px;
            overflow-y: auto;
            align-items: flex-start;
        }

        .block-input-container {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }

        .cmd-input {
            flex: 1;
            border: none;
            outline: none;
            background: transparent;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 13px;
            color: #000000;
            padding: 2px 0;
        }

        .cmd-input::placeholder {
            color: #888888;
        }

        .cell-action-icon {
            width: 24px;
            height: 24px;
            min-width: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0.9;
            transition: opacity 0.2s ease, transform 0.15s ease;
        }

        .cell-action-icon:hover {
            opacity: 1;
            transform: scale(1.08);
        }

        .cell-action-icon svg {
            width: 24px;
            height: 24px;
            display: block;
        }

        .catalog-card {
            width: 100%;
            background: #faf9f6;
            border: 1px solid #e6e3dd;
            border-radius: 10px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            font-family: 'IBM Plex Mono', monospace;
            display: flex;
            flex-direction: column;
        }

        .catalog-header-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 18px;
            background: #faf9f6;
            border-bottom: 1px solid #e6e3dd;
            flex-wrap: wrap;
            gap: 10px;
        }

        .catalog-metrics {
            display: flex;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
        }

        .metric-item {
            display: flex;
            align-items: center;
            gap: 7px;
            font-size: 12px;
            font-weight: 500;
            color: #141414;
        }

        .svg-icon-vector {
            width: 16px;
            height: 16px;
            display: inline-block;
            vertical-align: middle;
            fill: #000000;
        }

        .metric-badge-black {
            background: #000000;
            color: #ffffff;
            padding: 4px 9px;
            border-radius: 5px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.3px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .btn-upload-vector {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .btn-upload-vector:hover {
            background: #2a2a2a;
            transform: translateY(-1px);
        }

        .catalog-table-wrapper {
            width: 100%;
            overflow-x: auto;
        }

        .catalog-table-vector {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            text-align: left;
        }

        .catalog-table-vector th {
            background: #eceae4;
            color: #141414;
            font: 600 11px 'IBM Plex Mono', monospace;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            padding: 10px 14px;
            border-bottom: 1px solid #e6e3dd;
        }

        .catalog-table-vector td {
            padding: 10px 14px;
            border-bottom: 1px solid #eee6de;
            color: #222222;
            vertical-align: middle;
        }

        .catalog-table-vector tr:hover td {
            background: #f4f2ec;
        }

        .file-name-cell {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            color: #000000;
        }

        .hash-badge-vector {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 10px;
            background: #000000;
            color: #ffffff;
            padding: 3px 8px;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            max-width: 220px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .mime-tag {
            font-size: 10px;
            background: #eceae4;
            color: #55524c;
            padding: 3px 7px;
            border-radius: 4px;
            font-weight: 500;
        }

        .license-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #ffffff;
            border: 1px solid #cfcbc3;
            color: #141414;
            border-radius: 999px;
            padding: 3px 10px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
        }

        .license-badge .dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #2563eb;
            display: inline-block;
            flex-shrink: 0;
        }

        .unlicensed-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 16px;
        }

        .unlicensed-modal {
            background: #ffffff;
            border: 1px solid #e0dcd3;
            border-radius: 10px;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
            max-width: 360px;
            width: 100%;
            padding: 18px 20px;
            font-family: 'IBM Plex Mono', monospace;
        }

        .unlicensed-modal-title {
            font-size: 11px;
            font-weight: 600;
            color: #666;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .unlicensed-modal-text {
            color: #c5221f;
            font-size: 14px;
            font-weight: 700;
            line-height: 1.4;
            margin-bottom: 14px;
        }

        .unlicensed-modal-btn {
            background: #000000;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            padding: 8px 14px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
        }

        .gateway-modal {
            background: #ffffff;
            border: 1px solid #e0dcd3;
            border-radius: 10px;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
            max-width: 420px;
            width: 100%;
            padding: 18px 20px;
            font-family: 'IBM Plex Mono', monospace;
        }

        .gateway-modal-title {
            font-size: 11px;
            font-weight: 600;
            color: #666;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .gateway-modal-brand {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-size: 14px;
            font-weight: 700;
        }

        .gateway-modal-brand img {
            width: 22px;
            height: 22px;
        }

        .gateway-modal-text {
            color: #333;
            font-size: 12px;
            line-height: 1.45;
            margin-bottom: 12px;
        }

        .gateway-modal-text code {
            background: #f4f2ec;
            padding: 1px 5px;
            border-radius: 4px;
        }

        .gateway-modal label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            color: #666;
            margin-bottom: 6px;
        }

        .gateway-modal input[type="tel"] {
            width: 100%;
            border: 1px solid #d5d1c7;
            border-radius: 6px;
            padding: 9px 10px;
            font-family: inherit;
            font-size: 13px;
            margin-bottom: 12px;
            background: #faf9f6;
        }

        .gateway-modal-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
        }

        .gateway-modal-btn {
            background: #000000;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            padding: 8px 14px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
        }

        .gateway-modal-btn:disabled {
            opacity: 0.55;
            cursor: wait;
        }

        .gateway-modal-btn.secondary {
            background: #eceae4;
            color: #111;
        }

        .gateway-modal-status {
            margin-top: 12px;
            font-size: 12px;
            color: #666;
            min-height: 16px;
        }

        .gateway-modal-status.ok { color: #137333; font-weight: 600; }
        .gateway-modal-status.err { color: #c5221f; font-weight: 600; }

        .gateway-source-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 0 0 12px;
            padding: 10px 12px;
            border: 1px solid #e4e0d6;
            border-radius: 8px;
            background: #faf9f6;
        }

        .gateway-source-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 12px;
            color: #222;
            cursor: pointer;
            line-height: 1.35;
        }

        .gateway-source-item input {
            margin-top: 2px;
        }

        .gateway-source-item .muted {
            display: block;
            color: #777;
            font-size: 11px;
            font-weight: 400;
        }

        .gateway-source-item.disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }

        .gateway-code-box {
            display: none;
            margin: 10px 0 12px;
            padding: 14px 12px;
            border: 1px dashed #cfc9bb;
            border-radius: 8px;
            background: #faf9f6;
            text-align: center;
        }

        .gateway-code-box.visible { display: block; }

        .gateway-code-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #666;
            margin-bottom: 6px;
            font-weight: 600;
        }

        .gateway-code-value {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 0.12em;
            color: #111;
            line-height: 1.2;
            user-select: all;
        }

        .action-gateway-btn svg {
            width: 16px;
            height: 16px;
            fill: #000000;
        }

        .action-btn-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #000000;
            font-weight: 600;
            text-decoration: none;
            padding: 4px 8px;
            border-radius: 4px;
            transition: background 0.15s ease;
        }

        .action-btn-link:hover {
            background: #e5e5e5;
            text-decoration: underline;
        }

        .ssh-card-container {
            width: 100%;
            background: #faf9f6;
            border: 1px solid #e6e3dd;
            border-radius: 10px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
            font-family: 'IBM Plex Mono', monospace;
        }

        .ssh-key-box {
            background: #000000;
            color: #34c759;
            padding: 12px;
            border-radius: 6px;
            font-size: 11px;
            word-break: break-all;
            user-select: all;
            border: 1px solid #333;
        }

        .vertical-cmd-table {
            display: flex;
            flex-direction: column;
            gap: 4px;
            width: 100%;
        }

        .vertical-cmd-row {
            display: flex;
            align-items: center;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 13px;
            line-height: 1.5;
        }

        .vertical-cmd-name {
            color: #000000;
            font-weight: bold;
            min-width: 130px;
        }

        .vertical-cmd-sep {
            color: #777777;
            margin: 0 8px;
        }

        .vertical-cmd-desc {
            color: #111111;
        }

        .json-key { color: #000000; font-weight: 600; }
        .json-string { color: #a31515; }
        .json-number { color: #098658; }
        .json-boolean { color: #0000ff; }
        .json-null { color: #0000ff; }

        .clickable-symbol {
            cursor: pointer;
            transition: background-color 0.2s ease;
        }

        .clickable-symbol:hover {
            background-color: #bbbbbb;
        }

        .function-drawer-wrapper {
            display: flex;
            flex-direction: column;
            width: 100%;
        }

        .function-drawer {
            display: none;
            background-color: #ffffff;
            border: 1px solid #cccccc;
            border-top: none;
            padding: 16px 20px;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
            margin-top: -1px;
            animation: fadeInDrawer 0.25s ease-out;
        }

        .function-drawer.open {
            display: block;
        }

        @keyframes fadeInDrawer {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
            100% { transform: rotate(360deg); }
        }

        .function-drawer-header {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 14px;
            font-weight: bold;
            color: #000000;
            margin-bottom: 10px;
            letter-spacing: 0.2px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
        }

        /* TOOLBAR PARA INSPECIONAR CÓDIGO POR CARPETAS */
        .repo-inspector-bar {
            display: none;
            align-items: center;
            gap: 10px;
            background: #141414;
            padding: 8px 12px;
            border-radius: 6px 6px 0 0;
            border-bottom: 1px solid #333;
            flex-wrap: wrap;
        }

        .repo-file-selector {
            background: #000000;
            color: #ffffff;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 6px 10px;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 12px;
            outline: none;
            flex: 1;
            min-width: 260px;
            cursor: pointer;
        }

        .repo-file-selector option {
            background: #141414;
            color: #ffffff;
        }

        .function-drawer-inner {
            background-color: #000000;
            padding: 14px;
            border-radius: 3px;
            position: relative;
        }

        .function-editor {
            width: 100%;
            height: 220px;
            background-color: #000000;
            color: #ffffff;
            border: none;
            outline: none;
            resize: vertical;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 13px;
            line-height: 1.5;
            caret-color: #ffffff;
            padding-bottom: 36px;
            box-sizing: border-box;
        }

        .function-editor::placeholder {
            color: #888888;
        }

        .terminal-download-btn {
            position: absolute;
            right: 12px;
            bottom: 12px;
            width: 32px;
            height: 32px;
            padding: 0;
            border: none;
            background: transparent;
            color: #ffffff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 5;
            opacity: 0.85;
            transition: opacity 0.15s ease, transform 0.15s ease;
        }

        .terminal-download-btn:hover {
            opacity: 1;
            transform: translateY(-1px);
        }

        .terminal-download-btn:focus-visible {
            outline: 1px solid #ffffff;
            outline-offset: 2px;
        }

        .terminal-download-btn svg {
            width: 22px;
            height: 22px;
            display: block;
            fill: currentColor;
            pointer-events: none;
        }

        .action-code-btn {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            padding: 4px 6px !important;
            min-width: 28px;
        }

        .action-code-btn:hover {
            background: #eceae4 !important;
            text-decoration: none !important;
        }

        .virtual-keyboard-white {
            display: none;
            margin-top: -1px;
            padding: 16px 20px;
            background: #ffffff;
            border: 1px solid #cccccc;
            border-top: none;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
            user-select: none;
            animation: fadeInDrawer 0.25s ease-out;
        }

        .virtual-keyboard-white.active {
            display: block;
        }

        /* Si la terminal negra también está abierta, el teclado queda debajo con separación limpia */
        .function-drawer.open + .virtual-keyboard-white.active {
            border-top: 1px solid #cccccc;
            margin-top: 0;
        }

        .vk-3panel-container {
            display: grid;
            grid-template-columns: 1.1fr 1.15fr 1fr;
            gap: 16px;
            align-items: stretch;
            width: 100%;
        }

        .vk-card-panel {
            background: #faf9f6;
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 10px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
            overflow: hidden;
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            display: flex;
            flex-direction: column;
            min-height: 390px;
        }

        .vk-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 18px;
            border-bottom: 1px solid #e6e3dd;
            background: #faf9f6;
        }

        .vk-card-title {
            font: 600 11px/1 'IBM Plex Mono', monospace;
            letter-spacing: .09em;
            text-transform: uppercase;
            color: #141414;
        }

        .vk-pills {
            display: flex;
            gap: 4px;
        }

        .vk-pill {
            font: 500 10px/1 'IBM Plex Mono', monospace;
            padding: 5px 8px;
            border-radius: 5px;
            background: #eceae4;
            color: #7d7a72;
            cursor: pointer;
            transition: background 0.15s ease, color 0.15s ease;
        }

        .vk-pill.active {
            background: #141414;
            color: #ffffff;
        }

        .vk-card-body {
            padding: 18px;
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .vector-body {
            padding: 12px;
        }

        .vector-outer-frame {
            border: 2px solid #141414;
            padding: 3px;
            background: #ffffff;
            height: 100%;
            border-radius: 6px;
            display: flex;
            flex-direction: column;
        }

        .vector-inner-frame {
            border: 1px solid #141414;
            height: 100%;
            border-radius: 4px;
            background: #faf9f6;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px;
        }

        .vector-canvas {
            width: 100%;
            height: 100%;
            min-height: 250px;
        }

        .equations-body {
            padding: 14px;
        }

        .equations-editor {
            width: 100%;
            height: 100%;
            min-height: 250px;
            background: #ffffff;
            color: #141414;
            border: 1px solid #e6e3dd;
            border-radius: 8px;
            padding: 12px;
            font: 500 13px 'IBM Plex Mono', monospace;
            outline: none;
            resize: none;
            box-shadow: inset 0 1px 3px rgba(0,0,0,.04);
        }

        .equations-editor::placeholder {
            color: #a09d96;
        }

        body.raw-mode .block-execution .block-body {
            white-space: normal;
        }

        /* ===== BOOT CLI (originkit blackhole) ===== */
        body.boot-locked .platform-shell,
        body.auth-locked .platform-shell {
            visibility: hidden;
            pointer-events: none;
        }

        /* ===== AUTH GATE (post-Enter) ===== */
        .auth-overlay {
            position: fixed;
            inset: 0;
            z-index: 10001;
            background:
                radial-gradient(1200px 600px at 12% 0%, rgba(20, 20, 20, 0.06), transparent 55%),
                radial-gradient(900px 500px at 90% 100%, rgba(20, 20, 20, 0.05), transparent 50%),
                #f4f4f4;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            font-family: 'IBM Plex Mono', monospace;
        }

        .auth-overlay.hidden {
            display: none;
        }

        .auth-card {
            width: min(480px, 100%);
            background: #ffffff;
            border: 1px solid #d8d5cf;
            box-shadow: 0 18px 50px rgba(0, 0, 0, 0.08);
            padding: 28px 26px 24px;
            animation: authCardIn 0.45s ease both;
            max-height: min(92vh, 900px);
            overflow: auto;
        }

        @keyframes authCardIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .auth-card h1 {
            margin: 0 0 6px;
            font-size: 18px;
            font-weight: 700;
            color: #111;
            letter-spacing: -0.02em;
        }

        .auth-card .auth-sub {
            margin: 0 0 18px;
            font-size: 12px;
            color: #666;
            line-height: 1.45;
        }

        .auth-tabs {
            display: flex;
            gap: 0;
            border: 1px solid #d8d5cf;
            margin-bottom: 18px;
        }

        .auth-tab {
            flex: 1;
            border: none;
            background: #f7f6f3;
            color: #555;
            font: inherit;
            font-size: 12px;
            font-weight: 600;
            padding: 10px 8px;
            cursor: pointer;
        }

        .auth-tab.active {
            background: #111;
            color: #fff;
        }

        .auth-panel { display: none; }
        .auth-panel.active { display: block; }

        .auth-label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            color: #333;
            margin: 0 0 6px;
        }

        .auth-input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #cfcbc3;
            background: #faf9f6;
            color: #111;
            font: inherit;
            font-size: 12px;
            padding: 11px 12px;
            margin-bottom: 12px;
            outline: none;
        }

        .auth-input:focus {
            border-color: #111;
            background: #fff;
        }

        .auth-btn {
            width: 100%;
            border: none;
            background: #111;
            color: #fff;
            font: inherit;
            font-size: 12px;
            font-weight: 700;
            padding: 12px;
            cursor: pointer;
            margin-top: 4px;
        }

        .auth-btn:disabled {
            opacity: 0.55;
            cursor: wait;
        }

        .auth-btn.secondary {
            background: #fff;
            color: #111;
            border: 1px solid #111;
            margin-top: 10px;
        }

        .auth-msg {
            min-height: 18px;
            margin: 10px 0 0;
            font-size: 11px;
            color: #a10;
            line-height: 1.4;
            white-space: pre-wrap;
            word-break: break-all;
        }

        .auth-msg.ok { color: #137333; }

        .auth-keys-box {
            display: none;
            margin-top: 14px;
            padding: 12px;
            border: 1px dashed #111;
            background: #faf9f6;
            font-size: 11px;
            color: #111;
            line-height: 1.5;
        }

        .auth-keys-box.visible { display: block; }

        .auth-keys-box code {
            display: block;
            margin: 4px 0 10px;
            padding: 8px;
            background: #111;
            color: #f3f3f3;
            word-break: break-all;
            font-size: 10px;
        }

        .auth-foot {
            margin-top: 16px;
            font-size: 10px;
            color: #888;
            line-height: 1.4;
        }

        .boot-cli-overlay {
            position: fixed;
            inset: 0;
            z-index: 10000;
            background: #f4f4f4;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            font-family: 'IBM Plex Mono', monospace;
        }

        .boot-cli-overlay.hidden {
            display: none;
        }

        .boot-cli-window {
            width: 100%;
            height: 100%;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: bootRise 0.4s ease;
        }

        @keyframes bootRise {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .boot-cli-stage {
            position: relative;
            flex: 1;
            min-height: 0;
            background: #ffffff;
        }

        .boot-cli-body {
            display: none;
        }

        .boot-cli-visual {
            display: block;
            position: absolute;
            inset: 0;
            background: #ffffff;
            z-index: 2;
        }

        .boot-cli-visual canvas {
            width: 100%;
            height: 100%;
            display: block;
        }

        .boot-brand {
            position: absolute;
            top: 50%;
            right: clamp(28px, 8vw, 96px);
            transform: translateY(-50%);
            z-index: 4;
            display: flex;
            align-items: center;
            gap: clamp(12px, 2vw, 18px);
            pointer-events: none;
            animation: bootBrandIn 0.7s ease 0.15s both;
        }

        @keyframes bootBrandIn {
            from { opacity: 0; transform: translateY(calc(-50% + 8px)); }
            to { opacity: 1; transform: translateY(-50%); }
        }

        .boot-brand-icon {
            width: clamp(42px, 6vw, 64px);
            height: clamp(42px, 6vw, 64px);
            flex: 0 0 auto;
            display: block;
        }

        .boot-brand-text {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
        }

        .boot-brand-name {
            margin: 0;
            color: #111;
            font-family: 'IBM Plex Mono', monospace;
            font-weight: 700;
            font-size: clamp(22px, 3.4vw, 40px);
            letter-spacing: -0.03em;
            line-height: 1.05;
            white-space: nowrap;
        }

        .boot-brand-tag {
            margin: 0;
            color: #6a6a6a;
            font-family: 'IBM Plex Mono', monospace;
            font-size: clamp(11px, 1.2vw, 13px);
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }

        .boot-cli-footer {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 5;
            padding: 18px 22px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background: linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.92) 45%, #fff 100%);
            color: #666;
            font-size: 12px;
            pointer-events: none;
        }

        .boot-cli-footer > * {
            pointer-events: auto;
        }

        .boot-cli-enter {
            border: 1px solid #222;
            background: #111;
            color: #fff;
            border-radius: 8px;
            padding: 10px 16px;
            font: 600 13px 'IBM Plex Mono', monospace;
            cursor: pointer;
            opacity: 0.4;
            pointer-events: none;
            transition: opacity 0.2s ease, transform 0.15s ease;
        }

        .boot-cli-enter.ready {
            opacity: 1;
            pointer-events: auto;
        }

        .boot-cli-enter.ready:hover {
            transform: translateY(-1px);
            background: #000;
        }

        .boot-cli-hint-wrap {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
        }

        #bootCliHint {
            color: #555;
            font-size: 12px;
            letter-spacing: 0.02em;
        }

        .boot-linux-logo,
        .boot-github-logo,
        .boot-claude-logo,
        .boot-zylon-logo {
            width: 26px;
            height: 30px;
            flex: 0 0 auto;
            display: block;
            object-fit: contain;
            color: #8a8a8a;
        }

        .boot-github-logo,
        .boot-claude-logo,
        .boot-zylon-logo {
            width: 24px;
            height: 24px;
        }

        .boot-github-logo svg,
        .boot-claude-logo img,
        .boot-zylon-logo img {
            width: 100%;
            height: 100%;
            display: block;
            fill: currentColor;
            object-fit: contain;
        }

        .boot-hashcod-logo {
            display: inline-flex;
            align-items: center;
            flex: 0 0 auto;
            height: 14px;
            margin-left: 4px;
            line-height: 0;
            background: transparent;
            color: #8a8a8a;
        }

        .boot-hashcod-logo img {
            display: block;
            height: 14px;
            width: auto;
            max-width: min(180px, 50vw);
            object-fit: contain;
            background: transparent;
        }

        @media (max-width: 720px) {
            .boot-brand {
                top: auto;
                bottom: 88px;
                right: 22px;
                left: 22px;
                transform: none;
                justify-content: flex-end;
                animation: bootBrandInMobile 0.7s ease 0.15s both;
            }

            @keyframes bootBrandInMobile {
                from { opacity: 0; transform: translateY(8px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .boot-brand-name {
                white-space: normal;
            }
        }
    </style>
    <script src="/components/originkit/ui/blackhole-runtime.js"></script>
</head>
<body class="boot-locked">
    <div id="bootCliOverlay" class="boot-cli-overlay" role="dialog" aria-modal="true" aria-label="l8 codespace blackhole">
        <div class="boot-cli-window">
            <div class="boot-cli-stage">
                <div class="boot-cli-body" id="bootCliBody" hidden></div>
                <div class="boot-cli-visual" id="bootCliVisual">
                    <canvas id="bootBlackholeCanvas"></canvas>
                    <div class="boot-brand" aria-label="l8 codespace">
                        <img class="boot-brand-icon" src="/favicon.svg?v=3" alt="" width="64" height="64">
                        <div class="boot-brand-text">
                            <p class="boot-brand-name">l8 codespace</p>
                            <p class="boot-brand-tag">platform</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="boot-cli-footer">
                <div class="boot-cli-hint-wrap">
                    <span id="bootCliHint">Loading blackhole…</span>
                    <img class="boot-linux-logo" src="/linux-tux-gray.svg?v=2" alt="Linux" title="Linux" width="26" height="30">
                    <span class="boot-github-logo" title="GitHub" aria-label="GitHub" role="img">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96" aria-hidden="true">
                            <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
                        </svg>
                    </span>
                    <img class="boot-claude-logo" src="/claude-mark-gray.svg?v=2" alt="Claude" title="Claude" width="24" height="24">
                    <img class="boot-zylon-logo" src="/zylon-mark-gray.svg?v=1" alt="Zylon" title="Zylon" width="24" height="24">
                    <span class="boot-hashcod-logo" title="Created by Hashcod" aria-label="Created by Hashcod">
                        <img src="/hashcod-created-by-gray.svg?v=7" alt="Created by Hashcod" height="14">
                    </span>
                </div>
                <button type="button" class="boot-cli-enter" id="bootCliEnter">Enter platform ↵</button>
            </div>
        </div>
    </div>

    <!-- Bloqueo: registro / inicio de sesión (después de Enter) -->
    <div id="authOverlay" class="auth-overlay hidden" role="dialog" aria-modal="true" aria-label="Acceso l8 codespace">
        <div class="auth-card">
            <h1>l8 codespace</h1>
            <p class="auth-sub">Accede o crea una cuenta. La plataforma permanece oculta hasta autenticarte.</p>

            <div class="auth-tabs" role="tablist">
                <button type="button" class="auth-tab active" id="authTabLogin" data-tab="login">Iniciar sesión</button>
                <button type="button" class="auth-tab" id="authTabRegister" data-tab="register">Registrarse</button>
                <button type="button" class="auth-tab" id="authTabRecover" data-tab="recover">Recuperar</button>
            </div>

            <div class="auth-panel active" id="authPanelLogin">
                <label class="auth-label" for="authAesInput">Clave AES-256</label>
                <input class="auth-input" id="authAesInput" type="password" autocomplete="off" spellcheck="false" placeholder="Clave AES-256 de tu cuenta">
                <label class="auth-label" for="authIdentityInput">Clave identificador (L8ID)</label>
                <input class="auth-input" id="authIdentityInput" type="password" autocomplete="off" spellcheck="false" placeholder="Clave L8ID-… de tu cuenta">
                <button type="button" class="auth-btn" id="authLoginBtn">Entrar a la plataforma</button>
            </div>

            <div class="auth-panel" id="authPanelRegister">
                <label class="auth-label" for="authDilithiumInput">Dilithium-5 de registro (mensual)</label>
                <input class="auth-input" id="authDilithiumInput" type="password" autocomplete="off" spellcheck="false" placeholder="Clave Dilithium-5 del mes">
                <button type="button" class="auth-btn" id="authRegisterBtn">Crear cuenta</button>
            </div>

            <div class="auth-panel" id="authPanelRecover">
                <label class="auth-label" for="authRecoverInput">Clave L8REC o código de respaldo</label>
                <input class="auth-input" id="authRecoverInput" type="password" autocomplete="off" spellcheck="false" placeholder="L8REC-… o XXXX-XXXX-XXXX">
                <button type="button" class="auth-btn" id="authRecoverBtn">Recuperar y regenerar claves</button>
                <p class="auth-foot" style="margin-top:10px;">Si perdiste AES/L8ID pero guardaste el kit, aquí emites claves nuevas. Las anteriores quedan invalidadas.</p>
            </div>

            <div class="auth-keys-box" id="authKeysBox">
                <strong>Guarda todo el kit ahora</strong> — no se vuelve a mostrar.
                <div style="margin-top:8px;">AES-256</div>
                <code id="authKeyAesOut"></code>
                <div>Identificador L8ID</div>
                <code id="authKeyIdOut"></code>
                <div>Clave de recuperación L8REC</div>
                <code id="authKeyRecOut"></code>
                <div>Códigos de respaldo (1 uso c/u)</div>
                <code id="authKeyBackupOut"></code>
                <button type="button" class="auth-btn secondary" id="authCopyKeysBtn">Copiar kit completo</button>
                <button type="button" class="auth-btn" id="authEnterAfterRegisterBtn">Ya lo guardé — entrar</button>
            </div>

            <p class="auth-msg" id="authMsg"></p>
            <p class="auth-foot">Las identidades (hashes) se guardan en Supabase. Sin correo: el kit L8REC + códigos recupera la cuenta aunque Render se reinicie.</p>
        </div>
    </div>

    <div class="platform-shell">
    <div class="top-bar">
        <div class="left-controls">
            <label class="checkbox-label">
                <input type="checkbox" id="formatToggle" checked onchange="toggleFormat()">
                <span>Dar formato al texto</span>
            </label>
            <button type="button" class="icon-ubuntu-cli" title="Ubuntu CLI (Linux)" aria-label="Abrir Ubuntu CLI externa" onclick="openUbuntuCli()">
                <img src="/linux-tux-gray.svg?v=3" alt="" width="18" height="22" aria-hidden="true">
            </button>
            <button type="button" class="icon-claude-cli" title="Claude Code" aria-label="Abrir Claude Code externa" onclick="openClaudeCli()">
                <img src="/claude-mark-gray.svg?v=1" alt="" width="18" height="18" aria-hidden="true">
            </button>
            <button type="button" class="icon-zylon-cli" title="Zylon / PrivateGPT" aria-label="Abrir Zylon externa" onclick="openZylonCli()">
                <img src="/zylon-mark-gray.svg?v=1" alt="" width="18" height="18" aria-hidden="true">
            </button>
            <button type="button" class="icon-notepad" id="notepadOpenBtn" title="Bloc de notas" aria-label="Abrir bloc de notas" aria-expanded="false" aria-controls="notepadOverlay" onclick="toggleNotepadEditor()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true">
                    <path d="M 5 3 C 3.895 3 3 3.895 3 5 L 3 19 C 3 20.105 3.895 21 5 21 L 15 21 L 21 15 L 21 5 C 21 3.895 20.105 3 19 3 L 5 3 z M 5 5 L 19 5 L 19 14 L 14 14 L 14 19 L 5 19 L 5 5 z M 7 7 L 7 9 L 17 9 L 17 7 L 7 7 z M 7 11 L 7 13 L 12 13 L 12 11 L 7 11 z"></path>
                </svg>
            </button>
            <button type="button" class="icon-toolkit" id="toolkitOpenBtn" title="Toolkit" aria-label="Abrir toolkit" aria-expanded="false" aria-controls="toolkitOverlay" onclick="toggleToolkit()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true">
                    <path d="M 12 1.3203125 L 11.470703 1.6523438 L 3 6.9453125 L 3 21 L 7 21 L 17 21 L 21 21 L 21 6.9453125 L 12 1.3203125 z M 12 3.6777344 L 19 8.0546875 L 19 19 L 17 19 L 17 15 L 17 13 L 17 9 L 9 9 L 9 10 L 9 13 L 7 13 L 7 14 L 7 19 L 5 19 L 5 8.0546875 L 12 3.6777344 z M 11 11 L 15 11 L 15 13 L 13 13 L 11 13 L 11 11 z M 9 15 L 11 15 L 11 19 L 9 19 L 9 15 z M 13 15 L 15 15 L 15 19 L 13 19 L 13 15 z"></path>
                </svg>
            </button>
            <span class="hashcod-created-by" title="Created by Hashcod" aria-label="Created by Hashcod">
                <img src="/hashcod-created-by-gray.svg?v=7" alt="Created by Hashcod" height="14">
            </span>
        </div>
        <div class="top-bar-right">
            <button type="button" class="icon-gateway" title="Gateway · abrir y enviar (notas, terminal…)" aria-label="Gateway · abrir y enviar" onclick="openPlatformGateway()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" role="img" aria-hidden="true">
                    <path d="M 9.875 0.0625 C 9.617188 0.0976563 9.378906 0.230469 9.21875 0.4375 C 6.585938 3.582031 5 7.644531 5 12.0625 C 5 16.429688 6.542969 20.433594 9.125 23.5625 C 9.480469 23.992188 10.117188 24.058594 10.546875 23.703125 C 10.976563 23.347656 11.042969 22.710938 10.6875 22.28125 C 8.390625 19.496094 7 15.957031 7 12.0625 C 7 8.125 8.40625 4.515625 10.75 1.71875 C 11.027344 1.40625 11.082031 0.957031 10.886719 0.585938 C 10.691406 0.21875 10.289063 0.0078125 9.875 0.0625 Z M 39.8125 0.0625 C 39.453125 0.128906 39.160156 0.378906 39.042969 0.726563 C 38.925781 1.070313 39.003906 1.449219 39.25 1.71875 C 41.59375 4.515625 43 8.125 43 12.0625 C 43 15.957031 41.609375 19.496094 39.3125 22.28125 C 38.957031 22.710938 39.023438 23.347656 39.453125 23.703125 C 39.882813 24.058594 40.519531 23.992188 40.875 23.5625 C 43.457031 20.433594 45 16.429688 45 12.0625 C 45 7.644531 43.414063 3.582031 40.78125 0.4375 C 40.570313 0.171875 40.242188 0.03125 39.90625 0.0625 C 39.875 0.0625 39.84375 0.0625 39.8125 0.0625 Z M 15.6875 3.34375 C 15.429688 3.378906 15.191406 3.511719 15.03125 3.71875 C 13.140625 5.976563 12 8.890625 12 12.0625 C 12 15.234375 13.140625 18.148438 15.03125 20.40625 C 15.253906 20.707031 15.621094 20.855469 15.988281 20.800781 C 16.355469 20.742188 16.660156 20.488281 16.78125 20.136719 C 16.902344 19.785156 16.816406 19.394531 16.5625 19.125 C 14.960938 17.214844 14 14.753906 14 12.0625 C 14 9.371094 14.960938 6.914063 16.5625 5 C 16.839844 4.6875 16.894531 4.238281 16.699219 3.867188 C 16.503906 3.5 16.101563 3.289063 15.6875 3.34375 Z M 34 3.34375 C 33.640625 3.410156 33.347656 3.660156 33.230469 4.007813 C 33.113281 4.351563 33.191406 4.730469 33.4375 5 C 35.039063 6.914063 36 9.371094 36 12.0625 C 36 14.753906 35.039063 17.214844 33.4375 19.125 C 33.183594 19.394531 33.097656 19.785156 33.21875 20.136719 C 33.339844 20.488281 33.644531 20.742188 34.011719 20.800781 C 34.378906 20.855469 34.746094 20.707031 34.96875 20.40625 C 36.859375 18.148438 38 15.234375 38 12.0625 C 38 8.890625 36.859375 5.976563 34.96875 3.71875 C 34.757813 3.453125 34.429688 3.3125 34.09375 3.34375 C 34.0625 3.34375 34.03125 3.34375 34 3.34375 Z M 25 8 C 22.789063 8 21 9.789063 21 12 C 21 13.324219 21.632813 14.492188 22.625 15.21875 L 10.5 47.28125 C 10.113281 48.316406 10.636719 49.472656 11.671875 49.859375 C 12.707031 50.246094 13.863281 49.722656 14.25 48.6875 L 15.53125 45.34375 L 32.6875 40.5625 L 35.75 48.6875 C 36.136719 49.722656 37.292969 50.246094 38.328125 49.859375 C 39.363281 49.472656 39.886719 48.316406 39.5 47.28125 L 27.375 15.21875 C 28.367188 14.492188 29 13.324219 29 12 C 29 9.789063 27.210938 8 25 8 Z M 25 20.3125 L 27.5625 27.0625 L 21.59375 29.3125 Z M 28.96875 30.78125 L 30.5625 35.03125 L 24.1875 32.625 Z M 19.40625 35.09375 L 27.03125 37.96875 L 17.28125 40.6875 Z"></path>
                </svg>
            </button>
            <button type="button" class="icon-tokens" id="tokensMeterBtn" title="Consumo de tokens" aria-label="Ver consumo de tokens" aria-expanded="false" aria-controls="tokensPanel">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" role="img" aria-hidden="true"><path fill="currentColor" d="M 25 1 C 11.759318 1 1 11.759318 1 25 C 1 38.240682 11.759318 49 25 49 C 38.240682 49 49 38.240682 49 25 C 49 11.759318 38.240682 1 25 1 z M 25 3 C 25.674908 3 26.340665 3.0344009 27 3.09375 L 27 10.150391 C 26.343779 10.061616 25.67941 10 25 10 C 24.32059 10 23.656221 10.061616 23 10.150391 L 23 3.09375 C 23.659335 3.0344009 24.325092 3 25 3 z M 21 3.3691406 L 21 10.5625 C 18.526728 11.253462 16.303389 12.556571 14.515625 14.310547 L 8.2851562 10.699219 C 11.494966 6.9501434 15.942328 4.2971349 21 3.3691406 z M 29 3.3691406 C 34.075199 4.3003509 38.535748 6.968611 41.748047 10.738281 L 35.523438 14.347656 C 33.729128 12.57475 31.491005 11.258416 29 10.5625 L 29 3.3691406 z M 25 12 C 32.154545 12 38 17.845455 38 25 C 38 32.154545 32.154545 38 25 38 C 17.845455 38 12 32.154545 12 25 C 12 17.845455 17.845455 12 25 12 z M 7.0410156 12.291016 L 13.164062 15.839844 C 12.346687 16.891853 11.658077 18.047361 11.140625 19.292969 L 5.0351562 15.753906 C 5.6001328 14.534853 6.2717605 13.376539 7.0410156 12.291016 z M 42.988281 12.332031 C 43.754883 13.419078 44.424192 14.578638 44.986328 15.798828 L 38.876953 19.341797 C 38.363597 18.09385 37.67931 16.935832 36.865234 15.880859 L 42.988281 12.332031 z M 4.2695312 17.623047 L 10.501953 21.234375 C 10.185979 22.441056 10 23.698294 10 25 C 10 26.301706 10.185979 27.558944 10.501953 28.765625 L 4.2695312 32.376953 C 3.4499789 30.070945 3 27.588809 3 25 C 3 22.411191 3.4499789 19.929055 4.2695312 17.623047 z M 45.746094 17.669922 C 46.55516 19.962815 47 22.428571 47 25 C 47 27.571429 46.55516 30.037185 45.746094 32.330078 L 39.511719 28.714844 C 39.819154 27.523527 40 26.283406 40 25 C 40 23.716594 39.819154 22.476473 39.511719 21.285156 L 45.746094 17.669922 z M 38.876953 30.658203 L 44.986328 34.201172 C 44.424192 35.421362 43.754883 36.580922 42.988281 37.667969 L 36.865234 34.119141 C 37.67931 33.064168 38.363597 31.90615 38.876953 30.658203 z M 11.140625 30.707031 C 11.658077 31.952639 12.346687 33.108147 13.164062 34.160156 L 7.0410156 37.708984 C 6.2717605 36.623461 5.6001328 35.465147 5.0351562 34.246094 L 11.140625 30.707031 z M 35.523438 35.652344 L 41.748047 39.261719 C 38.535748 43.031389 34.075199 45.699649 29 46.630859 L 29 39.4375 C 31.491005 38.741584 33.729128 37.42525 35.523438 35.652344 z M 14.515625 35.689453 C 16.303389 37.443429 18.526728 38.746538 21 39.4375 L 21 46.630859 C 15.942328 45.702865 11.494966 43.049857 8.2851562 39.300781 L 14.515625 35.689453 z M 23 39.849609 C 23.656221 39.938384 24.32059 40 25 40 C 25.67941 40 26.343779 39.938384 27 39.849609 L 27 46.90625 C 26.340665 46.965599 25.674908 47 25 47 C 24.325092 47 23.659335 46.965599 23 46.90625 L 23 39.849609 z"/></svg>
            </button>
            <div class="tokens-panel" id="tokensPanel" role="dialog" aria-label="Consumo mensual de tokens">
                <h3>Tokens del mes</h3>
                <div class="tokens-period" id="tokensPeriodLabel">Periodo —</div>
                <div class="tokens-meter-track"><div class="tokens-meter-fill" id="tokensMeterFill"></div></div>
                <div class="tokens-stats">
                    <div>Restantes<strong id="tokensRemaining">—</strong></div>
                    <div>Usados<strong id="tokensUsed">—</strong></div>
                    <div>Comandos<strong id="tokensCommands">—</strong></div>
                    <div>Externas<strong id="tokensExternals">—</strong></div>
                    <div>Clones<strong id="tokensClones">—</strong></div>
                    <div>Notas<strong id="tokensNotepads">—</strong></div>
                </div>
                <div class="tokens-legend" id="tokensLegend">Cupo mensual 10.000 · Comando −5 · Ventana externa −25 · Clone GitHub −625 · Bloc de notas −1000</div>
                <div class="tokens-section-title">Meses anteriores</div>
                <ul class="tokens-history" id="tokensHistoryList"></ul>
                <p class="tokens-empty" id="tokensHistoryEmpty">Sin gastos de meses previos aún.</p>
                <div class="tokens-section-title">Gastos recientes</div>
                <ul class="tokens-ledger" id="tokensLedgerList"></ul>
                <p class="tokens-empty" id="tokensLedgerEmpty">Aún no hay movimientos guardados.</p>
                <p class="tokens-persist-note">El consumo se guarda en el servidor (y Supabase si está configurado) para no perderse al actualizar la plataforma.</p>
            </div>
        </div>
    </div>

    <div class="main-container">
        <!-- Bloque (=) de ejecuciones -->
        <div class="block-row block-execution">
            <div class="block-symbol">=</div>
            <div class="block-body" id="executionContent"></div>
        </div>

        <!-- Bloque (>) de introducción de comandos y su ventana desplegable -->
        <div class="function-drawer-wrapper">
            <div class="block-row block-prompt">
                <div class="block-symbol clickable-symbol" id="symbolPrompt" onclick="toggleFunctionDrawer()" title="Haz clic en (>) para abrir/cerrar la ventana de funciones">
                    &gt;
                </div>
                <div class="block-body block-input-container">
                    <input type="text" id="cmdInput" class="cmd-input" placeholder="Escribe un comando aquí y presiona Enter (ej: repos, clone langgenius/dify)..." autocomplete="off" onkeydown="handleCommandKey(event)">
                    <div class="cell-action-icon" title="Abrir / cerrar teclado" onclick="toggleVirtualKeyboard()">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">
                            <path fill="#000000" d="M 59.365234 16.408203 C 56.760813 16.392078 53.896992 17.062151 51.017578 18.564453 C 47.651255 20.320795 41.333597 25.163819 34.724609 29.666016 C 31.420115 31.917114 28.067565 34.071438 25.074219 35.673828 C 22.080872 37.276218 19.411811 38.296538 17.712891 38.382812 C 10.665432 38.740699 7.3381904 28.128744 12.916016 25.107422 A 1.0001 1.0001 0 1 0 11.962891 23.349609 C 4.4367151 27.426288 8.7539123 40.840974 17.814453 40.380859 C 20.142533 40.262634 22.914831 39.098454 26.017578 37.4375 C 29.120326 35.776546 32.518182 33.589136 35.851562 31.318359 C 42.518324 26.776806 49.030682 21.857548 51.943359 20.337891 C 57.919842 17.219726 63.438369 18.217666 66.199219 20.978516 C 67.46183 22.241127 67.634293 24.095157 67.431641 25.763672 C 67.270323 27.091857 66.946151 28.000574 66.794922 28.396484 L 10.085938 50.423828 A 1.0001 1.0001 0 0 0 9.5 51.671875 C 9.2934395 54.05751 9.0824611 56.796105 8.9726562 58.283203 C 8.9186562 59.012203 9.0982812 59.735516 9.4882812 60.353516 C 12.099281 64.489516 22.487859 80.941703 25.130859 85.095703 C 25.508859 85.689703 26.271344 85.900844 26.902344 85.589844 L 93.798828 52.035156 L 94.763672 49.841797 A 1.0001 1.0001 0 0 0 94.761719 48.582031 L 76.019531 25.554688 A 1.0001 1.0001 0 0 0 75.232422 25.185547 A 1.0001 1.0001 0 0 0 74.882812 25.253906 L 69.150391 27.480469 C 69.255904 27.031399 69.353136 26.53965 69.417969 26.005859 C 69.658816 24.022874 69.490669 21.441842 67.613281 19.564453 C 65.853706 17.804878 63.350929 16.695986 60.464844 16.457031 C 60.104083 16.427162 59.737295 16.410507 59.365234 16.408203 z M 74.927734 27.380859 L 92.412109 48.861328 L 26.425781 80.552734 L 11.839844 51.886719 L 67.835938 30.134766 A 1.0001 1.0001 0 0 0 68.046875 30.054688 A 1.0001 1.0001 0 0 0 68.052734 30.050781 L 74.927734 27.380859 z M 75.548828 32.59375 A 1.0001 1.0001 0 0 0 75.173828 32.667969 L 18.517578 56.037109 A 1.0001 1.0001 0 0 0 18.023438 57.445312 L 27.773438 75.097656 A 1.0001 1.0001 0 0 0 29.074219 75.519531 L 87.076172 48.283203 A 1.0001 1.0001 0 0 0 87.429688 46.751953 L 76.333984 32.966797 A 1.0001 1.0001 0 0 0 75.548828 32.59375 z M 75.244141 34.802734 L 77.669922 37.816406 L 74.488281 39.166016 L 72.113281 36.09375 L 75.244141 34.802734 z M 70.197266 36.884766 L 72.585938 39.972656 L 69.253906 41.386719 L 66.945312 38.224609 L 70.197266 36.884766 z M 65.042969 39.009766 L 67.363281 42.189453 L 63.447266 43.851562 L 61.113281 40.630859 L 65.042969 39.009766 z M 78.972656 39.435547 L 81.751953 42.888672 L 78.451172 44.291016 L 75.751953 40.800781 L 78.972656 39.435547 z M 59.212891 41.416016 L 61.558594 44.652344 L 58.216797 46.070312 L 56.017578 42.734375 L 59.212891 41.416016 z M 73.849609 41.609375 L 76.546875 45.097656 L 73.048828 46.582031 L 70.464844 43.044922 L 73.849609 41.609375 z M 54.132812 43.509766 L 56.34375 46.865234 L 52.916016 48.318359 L 50.685547 44.933594 L 54.132812 43.509766 z M 68.574219 43.847656 L 71.15625 47.384766 L 67.216797 49.056641 L 64.650391 45.511719 L 68.574219 43.847656 z M 83.041016 44.490234 L 85.074219 47.015625 L 81.759766 48.572266 L 79.714844 45.925781 L 82.837891 44.601562 A 1.0001 1.0001 0 0 0 83.041016 44.490234 z M 48.800781 45.708984 L 51.044922 49.113281 L 47.619141 50.566406 L 45.355469 47.130859 L 48.800781 45.708984 z M 62.761719 46.3125 L 65.328125 49.857422 L 61.720703 51.388672 L 59.333984 47.767578 L 62.761719 46.3125 z M 77.810547 46.734375 L 79.904297 49.443359 L 76.353516 51.111328 L 74.259766 48.242188 L 77.810547 46.734375 z M 43.472656 47.908203 L 45.748047 51.361328 L 41.925781 52.982422 L 39.669922 49.476562 L 43.472656 47.908203 z M 57.460938 48.5625 L 59.847656 52.183594 L 56.421875 53.636719 L 54.035156 50.015625 L 57.460938 48.5625 z M 72.369141 49.044922 L 74.509766 51.976562 L 70.646484 53.791016 L 68.421875 50.71875 L 72.369141 49.044922 z M 37.791016 50.251953 L 40.058594 53.775391 L 35.519531 55.701172 L 33.335938 52.087891 L 37.791016 50.251953 z M 52.164062 50.810547 L 54.550781 54.431641 L 51.125 55.884766 L 48.738281 52.263672 L 52.164062 50.810547 z M 20.154297 50.9375 A 1.0001 1.0001 0 0 0 19.791016 50.998047 L 16.921875 51.998047 A 1.0001 1.0001 0 1 0 17.580078 53.886719 L 20.449219 52.886719 A 1.0001 1.0001 0 0 0 20.154297 50.9375 z M 66.533203 51.519531 L 68.804688 54.65625 L 48.988281 63.960938 L 46.462891 60.037109 L 51.011719 58.107422 A 1.0001 1.0001 0 0 0 51.267578 57.998047 L 66.533203 51.519531 z M 31.466797 52.859375 L 33.658203 56.490234 L 28.759766 58.570312 L 26.650391 54.845703 L 31.466797 52.859375 z M 46.865234 53.058594 L 49.251953 56.679688 L 45.365234 58.330078 L 43.023438 54.689453 L 46.865234 53.058594 z M 41.154297 55.480469 L 43.496094 59.121094 L 38.791016 61.119141 L 36.5625 57.429688 L 41.154297 55.480469 z M 24.787109 55.615234 L 26.90625 59.355469 L 22.416016 61.261719 L 20.314453 57.458984 L 24.787109 55.615234 z M 34.703125 58.21875 L 36.931641 61.908203 L 31.869141 64.056641 L 29.751953 60.320312 L 34.703125 58.21875 z M 44.595703 60.828125 L 47.162109 64.818359 L 42.382812 67.0625 L 39.835938 62.847656 L 44.595703 60.828125 z M 27.898438 61.105469 L 30.015625 64.841797 L 25.460938 66.775391 L 23.386719 63.019531 L 27.898438 61.105469 z M 37.976562 63.638672 L 40.560547 67.917969 L 35.423828 70.330078 L 32.861328 65.808594 L 37.976562 63.638672 z M 31.007812 66.59375 L 33.609375 71.181641 L 29.072266 73.3125 L 26.433594 68.535156 L 31.007812 66.59375 z"/>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Ventana desplegable de funciones debajo de (>) -->
            <div class="function-drawer" id="functionDrawer">
                <div class="function-drawer-header" id="functionDrawerHeader">
                    <span>&gt;/ function to execute</span>
                </div>

                <!-- Barra Navegadora de Código por Carpetas en la Consola Negra -->
                <div class="repo-inspector-bar" id="repoInspectorBar">
                    <span style="color:#ffffff; font-size:12px; font-weight:600;">Estructura:</span>
                    <select id="repoFileSelector" class="repo-file-selector" onchange="loadSelectedRepoFile(this.value)">
                        <option value="">📁 Selecciona un archivo de código por carpeta...</option>
                    </select>
                    <span id="repoFilePathInfo" style="color:#888888; font-size:11px; font-family:monospace;"></span>
                </div>

                <div class="function-drawer-inner">
                    <textarea id="functionEditor" class="function-editor" placeholder="// Escribe las funciones aquí o inspecciona el código de repositorios guardados..." spellcheck="false" onkeydown="handleEditorKeyDown(event)"></textarea>
                    <button type="button" class="terminal-download-btn" id="terminalDownloadBtn" title="Descargar contenido de la terminal" aria-label="Descargar contenido de la terminal" onclick="downloadBlackTerminalContent()">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true">
                            <g fill="currentColor" fill-rule="nonzero">
                                <g transform="scale(10.66667,10.66667)">
                                    <path d="M11,2c-0.552,0 -1,0.448 -1,1v8h-3.5c-0.27614,0 -0.5,0.22386 -0.5,0.5c0.00002,0.1326 0.05271,0.25976 0.14648,0.35352c0.00999,0.01021 0.02042,0.01998 0.03125,0.0293l5.10547,4.81445l0.0332,0.03125c0.1851,0.17405 0.42951,0.27112 0.68359,0.27148c0.25408,-0.00036 0.49849,-0.09743 0.68359,-0.27148l0.01367,-0.01172c0.00328,-0.00388 0.00654,-0.00779 0.00976,-0.01172l5.10352,-4.8125c0.01013,-0.00872 0.0199,-0.01784 0.0293,-0.02734l0.00781,-0.00586c0.00197,-0.00194 0.00392,-0.00389 0.00586,-0.00586c0.09377,-0.09375 0.14646,-0.22092 0.14648,-0.35352c0,-0.27614 -0.22386,-0.5 -0.5,-0.5h-3.5v-8c0,-0.552 -0.448,-1 -1,-1h-1zM3,20c-0.36064,-0.0051 -0.69608,0.18438 -0.87789,0.49587c-0.18181,0.3115 -0.18181,0.69676 0,1.00825c0.18181,0.3115 0.51725,0.50097 0.87789,0.49587h18c0.36064,0.0051 0.69608,-0.18438 0.87789,-0.49587c0.18181,-0.3115 0.18181,-0.69676 0,-1.00825c-0.18181,-0.3115 -0.51725,-0.50097 -0.87789,-0.49587z"></path>
                                </g>
                            </g>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Teclado independiente (icono del comando). La terminal negra se abre solo con (>) -->
            <div class="virtual-keyboard-white" id="virtualKeyboard">
                <div class="vk-3panel-container">
                    <div class="vk-card-panel">
                        <div class="vk-card-header">
                            <span class="vk-card-title">Key window</span>
                            <div class="vk-pills">
                                <span class="vk-pill active">123</span>
                                <span class="vk-pill">fx</span>
                                <span class="vk-pill">αβ</span>
                            </div>
                        </div>
                        <div class="vk-card-body" id="keyWindowBody">
                            <div class="keys-grid-placeholder" style="flex: 1; border: 1px dashed #d0cdcf; border-radius: 8px; background: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #8c8983; font-size: 12px; font-family: 'IBM Plex Mono', monospace; min-height: 280px; padding: 12px; text-align: center; gap: 12px;">
                                <span>[ Espacio preparado para tus teclas personalizadas ]</span>
                                <button class="btn-upload-vector" onclick="triggerFileUpload()">
                                    <svg class="svg-icon-vector" style="fill:#ffffff;" viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
                                    <span>Subir Archivo (Dilithium 5)</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="vk-card-panel">
                        <div class="vk-card-header">
                            <span class="vk-card-title">Vector graphic</span>
                            <div class="vk-pills">
                                <span class="vk-pill active">SVG</span>
                                <span class="vk-pill">CAD</span>
                            </div>
                        </div>
                        <div class="vk-card-body vector-body">
                            <div class="vector-outer-frame">
                                <div class="vector-inner-frame">
                                    <svg class="vector-canvas" viewBox="0 0 300 200"></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="vk-card-panel">
                        <div class="vk-card-header">
                            <span class="vk-card-title">Equations window</span>
                            <div class="vk-pills">
                                <span class="vk-pill active">Math</span>
                                <span class="vk-pill">LaTeX</span>
                            </div>
                        </div>
                        <div class="vk-card-body equations-body">
                            <textarea id="equationsEditor" class="equations-editor" placeholder="// Ecuaciones y fórmulas matemáticas..." spellcheck="false"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let latestExecutionData = null;
        let hasExecutedCommand = false;
        let currentInspectedRepo = null;
        let currentInspectedUserRepo = null;
        let currentInspectedFile = null;
        let lastCommandText = '';
        let platformRestoreDone = false;
        let persistTimer = null;

        async function persistPlatformState(extra) {
            try {
                const payload = Object.assign({
                    last_command: lastCommandText || '',
                    has_executed: !!hasExecutedCommand,
                    inspected_repo: currentInspectedRepo || '',
                    inspected_user_repo: currentInspectedUserRepo || '',
                    inspected_file: currentInspectedFile || '',
                    execution_type: (latestExecutionData && (latestExecutionData.output || latestExecutionData).type) || ''
                }, extra || {});
                await fetch('/api/platform/state', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (e) {
                console.warn('No se pudo persistir estado en Supabase', e);
            }
        }

        function schedulePersistPlatformState(extra) {
            clearTimeout(persistTimer);
            persistTimer = setTimeout(() => persistPlatformState(extra), 400);
        }

        async function restorePlatformState() {
            if (platformRestoreDone) return;
            platformRestoreDone = true;
            try {
                const res = await fetch('/api/platform/state');
                const data = await res.json();
                if (!data || !data.ok || !data.state) return;
                const st = data.state;
                if (st.last_command) {
                    lastCommandText = st.last_command;
                    await submitCommand(st.last_command);
                }
                if (st.inspected_repo || st.inspected_user_repo) {
                    await openRepoCodeInspector(st.inspected_repo || '', st.inspected_user_repo || '');
                    if (st.inspected_file) {
                        const selector = document.getElementById('repoFileSelector');
                        if (selector) {
                            selector.value = st.inspected_file;
                            await loadSelectedRepoFile(st.inspected_file);
                        }
                    }
                }
            } catch (e) {
                console.warn('No se pudo restaurar estado desde Supabase', e);
            }
        }
        let currentRepoTree = [];
        const repoFileCache = new Map(); // key: repo::path -> content
        let repoFileAbort = null;
        let repoTreeCache = { repo: '', tree: null };

        const executionContainer = document.getElementById('executionContent');
        const formatToggle = document.getElementById('formatToggle');
        const cmdInput = document.getElementById('cmdInput');

        // ICONOS VECTORIALES REUTILIZABLES
        const SVG_GITHUB_BLACK = '<svg class="svg-icon-vector" style="fill:#000000; width:18px; height:18px;" viewBox="0 0 24 24"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1.0.07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>';
        const SVG_CODE_WINDOW_BLACK = '<svg class="svg-icon-vector" style="fill:#000000; width:16px; height:16px;" viewBox="0 0 32 32"><path d="M 4 5 L 4 27 L 28 27 L 28 5 Z M 6 7 L 26 7 L 26 9 L 6 9 Z M 6 11 L 26 11 L 26 25 L 6 25 Z M 16 13 L 14 23 L 16 23 L 18 13 Z M 11.1875 13.40625 L 8.1875 17.40625 L 7.75 18 L 8.1875 18.59375 L 11.1875 22.59375 L 12.8125 21.40625 L 10.25 18 L 12.8125 14.59375 Z M 20.8125 13.40625 L 19.1875 14.59375 L 21.75 18 L 19.1875 21.40625 L 20.8125 22.59375 L 23.8125 18.59375 L 24.25 18 L 23.8125 17.40625 Z"></path></svg>';
        const SVG_GATEWAY_BLACK = '<svg class="svg-icon-vector" style="fill:#000000; width:16px; height:16px;" viewBox="0 0 50 50"><path d="M 9.875 0.0625 C 9.617188 0.0976563 9.378906 0.230469 9.21875 0.4375 C 6.585938 3.582031 5 7.644531 5 12.0625 C 5 16.429688 6.542969 20.433594 9.125 23.5625 C 9.480469 23.992188 10.117188 24.058594 10.546875 23.703125 C 10.976563 23.347656 11.042969 22.710938 10.6875 22.28125 C 8.390625 19.496094 7 15.957031 7 12.0625 C 7 8.125 8.40625 4.515625 10.75 1.71875 C 11.027344 1.40625 11.082031 0.957031 10.886719 0.585938 C 10.691406 0.21875 10.289063 0.0078125 9.875 0.0625 Z M 39.8125 0.0625 C 39.453125 0.128906 39.160156 0.378906 39.042969 0.726563 C 38.925781 1.070313 39.003906 1.449219 39.25 1.71875 C 41.59375 4.515625 43 8.125 43 12.0625 C 43 15.957031 41.609375 19.496094 39.3125 22.28125 C 38.957031 22.710938 39.023438 23.347656 39.453125 23.703125 C 39.882813 24.058594 40.519531 23.992188 40.875 23.5625 C 43.457031 20.433594 45 16.429688 45 12.0625 C 45 7.644531 43.414063 3.582031 40.78125 0.4375 C 40.570313 0.171875 40.242188 0.03125 39.90625 0.0625 C 39.875 0.0625 39.84375 0.0625 39.8125 0.0625 Z M 15.6875 3.34375 C 15.429688 3.378906 15.191406 3.511719 15.03125 3.71875 C 13.140625 5.976563 12 8.890625 12 12.0625 C 12 15.234375 13.140625 18.148438 15.03125 20.40625 C 15.253906 20.707031 15.621094 20.855469 15.988281 20.800781 C 16.355469 20.742188 16.660156 20.488281 16.78125 20.136719 C 16.902344 19.785156 16.816406 19.394531 16.5625 19.125 C 14.960938 17.214844 14 14.753906 14 12.0625 C 14 9.371094 14.960938 6.914063 16.5625 5 C 16.839844 4.6875 16.894531 4.238281 16.699219 3.867188 C 16.503906 3.5 16.101563 3.289063 15.6875 3.34375 Z M 34 3.34375 C 33.640625 3.410156 33.347656 3.660156 33.230469 4.007813 C 33.113281 4.351563 33.191406 4.730469 33.4375 5 C 35.039063 6.914063 36 9.371094 36 12.0625 C 36 14.753906 35.039063 17.214844 33.4375 19.125 C 33.183594 19.394531 33.097656 19.785156 33.21875 20.136719 C 33.339844 20.488281 33.644531 20.742188 34.011719 20.800781 C 34.378906 20.855469 34.746094 20.707031 34.96875 20.40625 C 36.859375 18.148438 38 15.234375 38 12.0625 C 38 8.890625 36.859375 5.976563 34.96875 3.71875 C 34.757813 3.453125 34.429688 3.3125 34.09375 3.34375 C 34.0625 3.34375 34.03125 3.34375 34 3.34375 Z M 25 8 C 22.789063 8 21 9.789063 21 12 C 21 13.324219 21.632813 14.492188 22.625 15.21875 L 10.5 47.28125 C 10.113281 48.316406 10.636719 49.472656 11.671875 49.859375 C 12.707031 50.246094 13.863281 49.722656 14.25 48.6875 L 15.53125 45.34375 L 32.6875 40.5625 L 35.75 48.6875 C 36.136719 49.722656 37.292969 50.246094 38.328125 49.859375 C 39.363281 49.472656 39.886719 48.316406 39.5 47.28125 L 27.375 15.21875 C 28.367188 14.492188 29 13.324219 29 12 C 29 9.789063 27.210938 8 25 8 Z M 25 20.3125 L 27.5625 27.0625 L 21.59375 29.3125 Z M 28.96875 30.78125 L 30.5625 35.03125 L 24.1875 32.625 Z M 19.40625 35.09375 L 27.03125 37.96875 L 17.28125 40.6875 Z"></path></svg>';
        const SVG_CHECK_VECTOR = '<svg class="svg-icon-vector" style="fill:#137333; width:16px; height:16px;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
        const SVG_CROSS_VECTOR = '<svg class="svg-icon-vector" style="fill:#c5221f; width:16px; height:16px;" viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>';
        const SVG_EXT_LINK = '<svg class="svg-icon-vector" style="fill:#000000; width:13px; height:13px;" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>';
        const SVG_REFRESH_VECTOR = '<svg class="svg-icon-vector" style="fill:#000000; width:14px; height:14px;" viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>';

        function syntaxHighlight(json) {
            if (typeof json !== 'string') {
                json = JSON.stringify(json, undefined, formatToggle.checked ? 2 : undefined);
            }
            if (!formatToggle.checked) {
                return json;
            }
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            });
        }

        function fillRepoSelector(tree) {
            const selector = document.getElementById('repoFileSelector');
            if (!selector) return '';
            const list = Array.isArray(tree) ? tree : [];
            const frag = document.createDocumentFragment();
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = list.length
                ? ('Selecciona un archivo (' + list.length + ')...')
                : 'Sin archivos visibles';
            frag.appendChild(placeholder);

            // Lista plana (más compatible) + prefijo de carpeta
            let firstPath = '';
            for (let i = 0; i < list.length; i++) {
                const item = list[i];
                if (!item || !item.path) continue;
                if (item.type && item.type !== 'file') continue;
                const opt = document.createElement('option');
                opt.value = item.path;
                opt.textContent = '📄 ' + item.path + (item.size_formatted ? ' (' + item.size_formatted + ')' : '');
                frag.appendChild(opt);
                if (!firstPath) firstPath = item.path;
            }
            selector.innerHTML = '';
            selector.appendChild(frag);
            return firstPath;
        }

        async function fetchRepoTree(repo, userRepo) {
            const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
            const timer = ctrl ? setTimeout(() => ctrl.abort(), 90000) : null;
            try {
                let url = '/api/repo/tree?repo=' + encodeURIComponent(repo || '');
                if (userRepo) {
                    url += '&clone=' + encodeURIComponent(userRepo);
                }
                const res = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
                const text = await res.text();
                let data = null;
                try { data = JSON.parse(text); } catch (e) {
                    throw new Error('Respuesta inválida del servidor al leer estructura');
                }
                return data;
            } finally {
                if (timer) clearTimeout(timer);
            }
        }

        /** Limpia la terminal negra (editor + inspector) — comando servidor dil_fs */
        function clearBlackTerminal() {
            const editor = document.getElementById('functionEditor');
            const selector = document.getElementById('repoFileSelector');
            const pathInfo = document.getElementById('repoFilePathInfo');
            const headerTitle = document.getElementById('functionDrawerHeader');
            if (editor) {
                editor.value = '';
                editor.style.color = '#ffffff';
            }
            if (selector) {
                selector.innerHTML = '<option value="">📁 Selecciona un archivo de código por carpeta...</option>';
                selector.value = '';
            }
            if (pathInfo) pathInfo.textContent = '';
            if (headerTitle) {
                headerTitle.innerHTML = '&gt;/ function to execute';
            }
            currentInspectedRepo = '';
            currentInspectedUserRepo = '';
            currentInspectedFile = null;
            currentRepoTree = [];
            repoTreeCache = { repo: '', tree: [] };
            if (typeof repoFileCache !== 'undefined' && repoFileCache && typeof repoFileCache.clear === 'function') {
                repoFileCache.clear();
            }
            if (repoFileAbort) {
                try { repoFileAbort.abort(); } catch (e) {}
                repoFileAbort = null;
            }
            schedulePersistPlatformState();
        }

        async function openRepoCodeInspector(repoName, userRepo) {
            const drawer = document.getElementById('functionDrawer');
            if (drawer && !drawer.classList.contains('open')) {
                drawer.classList.add('open');
            }
            
            const localName = repoName || (userRepo ? String(userRepo).split('/').pop() : '');
            const remoteTarget = userRepo || (repoName && String(repoName).indexOf('/') !== -1 ? repoName : '');
            currentInspectedRepo = localName;
            currentInspectedUserRepo = remoteTarget || localName || '';
            currentInspectedFile = null;
            const toolbar = document.getElementById('repoInspectorBar');
            const selector = document.getElementById('repoFileSelector');
            const headerTitle = document.getElementById('functionDrawerHeader');
            const editor = document.getElementById('functionEditor');
            const pathInfo = document.getElementById('repoFilePathInfo');

            if (!selector || !editor) return;

            if (headerTitle) {
                headerTitle.innerHTML = `&gt;/ function to execute &bull; <span style="color:#ffffff;">Inspeccionando Repositorio: <strong>${localName || '…'}</strong></span>`;
            }
            if (toolbar) toolbar.style.display = 'flex';
            selector.innerHTML = '<option value="">Cargando estructura…</option>';
            if (pathInfo) pathInfo.textContent = '';
            editor.style.color = '#ffffff';
            editor.value = "// Cargando estructura de '" + (localName || remoteTarget || 'repo') + "'…";

            try {
                let data = null;
                if (repoTreeCache.repo === localName && Array.isArray(repoTreeCache.tree) && repoTreeCache.tree.length) {
                    data = { ok: true, tree: repoTreeCache.tree, repo: localName };
                } else {
                    // Un solo request: lee árbol; si falta en disco, clona en el mismo endpoint (sin /api/command)
                    data = await fetchRepoTree(localName, remoteTarget || undefined);
                }

                if (data && data.unlicensed) {
                    showUnlicensedPopup('This repository is unlicensed! Do not use it.', remoteTarget || localName);
                    selector.innerHTML = '<option value="">Repositorio sin licencia</option>';
                    editor.value = "// This repository is unlicensed! Do not use it.";
                    return;
                }
                
                if (!data || !data.ok) {
                    const detail = (data && data.clone && data.clone.raw_output)
                        ? data.clone.raw_output
                        : ((data && data.error) || 'No se pudo leer el repositorio');
                    selector.innerHTML = '<option value="">No se pudo cargar</option>';
                    editor.value = "// Error: " + detail;
                    return;
                }

                if (data.repo) currentInspectedRepo = data.repo;
                currentRepoTree = Array.isArray(data.tree) ? data.tree : [];
                repoTreeCache = { repo: currentInspectedRepo, tree: currentRepoTree };
                const firstPath = fillRepoSelector(currentRepoTree);

                if (firstPath) {
                    selector.value = firstPath;
                    loadSelectedRepoFile(firstPath);
                } else {
                    selector.innerHTML = '<option value="">Sin archivos visibles</option>';
                    editor.value = "// Repositorio vacío o sin archivos de código visibles.";
                }
                schedulePersistPlatformState();
            } catch (err) {
                console.error("Error al cargar repositorio:", err);
                const msg = (err && err.name === 'AbortError')
                    ? 'tiempo de espera agotado'
                    : ((err && err.message) ? err.message : 'conexión');
                selector.innerHTML = '<option value="">Error al cargar estructura</option>';
                editor.value = "// Error al cargar estructura: " + msg;
            }
        }

        async function loadSelectedRepoFile(filePath) {
            if (!filePath || !currentInspectedRepo) return;
            const editor = document.getElementById('functionEditor');
            const pathInfo = document.getElementById('repoFilePathInfo');
            const cacheKey = currentInspectedRepo + '::' + filePath;

            pathInfo.textContent = currentInspectedRepo + " / " + filePath;
            currentInspectedFile = filePath;

            if (repoFileCache.has(cacheKey)) {
                editor.value = repoFileCache.get(cacheKey);
                return;
            }

            editor.value = "// Cargando '" + filePath + "'…";

            if (repoFileAbort) {
                try { repoFileAbort.abort(); } catch (e) {}
            }
            repoFileAbort = (typeof AbortController !== 'undefined') ? new AbortController() : null;

            try {
                const res = await fetch(
                    '/api/repo/file?repo=' + encodeURIComponent(currentInspectedRepo) + '&path=' + encodeURIComponent(filePath),
                    repoFileAbort ? { signal: repoFileAbort.signal } : undefined
                );
                const data = await res.json();
                if (data.ok) {
                    repoFileCache.set(cacheKey, data.content);
                    // limitar memoria del cache
                    if (repoFileCache.size > 80) {
                        const first = repoFileCache.keys().next().value;
                        repoFileCache.delete(first);
                    }
                    if (currentInspectedFile === filePath) {
                        editor.value = data.content;
                    }
                } else if (currentInspectedFile === filePath) {
                    editor.value = "// Error: " + (data.error || "No se pudo leer el archivo");
                }
            } catch (err) {
                if (err && err.name === 'AbortError') return;
                console.error("Error al leer archivo:", err);
                if (currentInspectedFile === filePath) {
                    editor.value = "// Error de lectura.";
                }
            }
        }

        function terminalEscapeHtml(str) {
            return String(str || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function terminalSafeFilename(name, ext) {
            const base = String(name || 'terminal')
                .replace(/[\\/:*?"<>|]+/g, '_')
                .replace(/\s+/g, '_')
                .replace(/_+/g, '_')
                .replace(/^\.+/, '')
                .slice(0, 80) || 'terminal';
            const cleanExt = String(ext || '').replace(/^\./, '');
            if (!cleanExt) return base;
            if (new RegExp('\\.' + cleanExt + '$', 'i').test(base)) return base;
            return base + '.' + cleanExt;
        }

        function terminalGuessLanguage(filePath, content) {
            const path = String(filePath || '');
            const ext = (path.includes('.') ? path.split('.').pop() : '').toLowerCase();
            const map = {
                js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
                ts: 'typescript', tsx: 'typescript',
                py: 'python', rb: 'ruby', php: 'php', go: 'go', rs: 'rust',
                java: 'java', kt: 'kotlin', swift: 'swift', cs: 'csharp',
                c: 'c', h: 'c', cpp: 'cpp', hpp: 'cpp', cc: 'cpp',
                css: 'css', scss: 'scss', less: 'less',
                html: 'html', htm: 'html', xml: 'xml', svg: 'xml',
                json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml',
                sh: 'bash', bash: 'bash', zsh: 'bash', ps1: 'powershell',
                sql: 'sql', r: 'r', lua: 'lua', dart: 'dart',
                vue: 'vue', svelte: 'svelte', md: 'markdown', markdown: 'markdown',
                txt: 'text', conf: 'ini', ini: 'ini', env: 'bash'
            };
            if (map[ext]) return map[ext];
            const sample = String(content || '').slice(0, 4000);
            if (/^\s*<(!DOCTYPE|html|svg)\b/i.test(sample)) return 'html';
            if (/^\s*\{[\s\S]*\}\s*$/.test(sample.trim()) || /^\s*\[[\s\S]*\]\s*$/.test(sample.trim())) return 'json';
            if (/\b(function|const|let|var|=>|import\s+|export\s+)\b/.test(sample)) return 'javascript';
            if (/\b(def\s+\w+\s*\(|import\s+\w+|from\s+\w+\s+import)\b/.test(sample)) return 'python';
            if (/<\?php\b/.test(sample)) return 'php';
            return 'text';
        }

        function terminalIsCodeContent(content, filePath) {
            const path = String(filePath || currentInspectedFile || '');
            const ext = (path.includes('.') ? path.split('.').pop() : '').toLowerCase();
            const textExts = {
                md: true, markdown: true, txt: true, text: true, rst: true,
                log: true, csv: true, tsv: true, asciidoc: true, adoc: true
            };
            const codeExts = {
                js: true, mjs: true, cjs: true, jsx: true, ts: true, tsx: true,
                py: true, rb: true, php: true, go: true, rs: true, java: true,
                kt: true, swift: true, cs: true, c: true, h: true, cpp: true,
                hpp: true, cc: true, css: true, scss: true, less: true,
                html: true, htm: true, xml: true, svg: true, json: true,
                yaml: true, yml: true, toml: true, sh: true, bash: true,
                zsh: true, ps1: true, sql: true, r: true, lua: true, dart: true,
                vue: true, svelte: true, conf: true, ini: true, env: true,
                dockerfile: true, makefile: true
            };
            const base = path.split('/').pop() || '';
            if (/^(Dockerfile|Makefile|Gemfile|Procfile)$/i.test(base)) return true;
            if (textExts[ext]) return false;
            if (codeExts[ext]) return true;

            const text = String(content || '');
            if (!text.trim()) return false;
            const lines = text.split(/\r?\n/);
            const sampleLines = lines.slice(0, 80);
            let codeSignals = 0;
            sampleLines.forEach((line) => {
                if (/[{};]$/.test(line.trim())) codeSignals += 1;
                if (/^\s*(function|class|def|import|export|const|let|var|public|private|return|if\s*\(|for\s*\(|while\s*\()/.test(line)) codeSignals += 2;
                if (/^\s*#include\b|<\?php\b|#!\//.test(line)) codeSignals += 2;
                if (/^\s*\/\*|\*\/|\/\/|<!--/.test(line)) codeSignals += 1;
            });
            const avgLen = text.length / Math.max(lines.length, 1);
            if (codeSignals >= 4) return true;
            if (codeSignals >= 2 && avgLen < 90) return true;
            // Texto narrativo / markdown suelto
            if (/^#{1,6}\s+\S/m.test(text) && codeSignals < 2) return false;
            if (codeSignals === 0 && avgLen > 60) return false;
            return codeSignals > 0;
        }

        function terminalBuildCodeHtml(content, filePath) {
            const lang = terminalGuessLanguage(filePath, content);
            const title = terminalEscapeHtml(filePath || 'terminal-code');
            const body = terminalEscapeHtml(content);
            return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    background: #0a0a0a;
    color: #f2f2f2;
    font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }
  header {
    padding: 14px 18px;
    border-bottom: 1px solid #2a2a2a;
    font-size: 12px;
    color: #a8a8a8;
    letter-spacing: 0.02em;
  }
  header strong { color: #ffffff; font-weight: 600; }
  pre {
    margin: 0;
    padding: 18px;
    overflow: auto;
    white-space: pre;
    line-height: 1.55;
    font-size: 13px;
  }
  code { font-family: inherit; }
</style>
</head>
<body>
<header>l8 codespace · <strong>${title}</strong> · <span>${terminalEscapeHtml(lang)}</span></header>
<pre><code class="language-${terminalEscapeHtml(lang)}">${body}</code></pre>
</body>
</html>
`;
        }

        function terminalBuildMarkdown(content, filePath) {
            const text = String(content || '');
            const name = filePath || 'terminal-text';
            // Si ya parece markdown, conservar tal cual; si no, envolver con título
            if (/^#{1,6}\s+\S/m.test(text) || /^\s*[-*+]\s+\S/m.test(text) || /```/.test(text)) {
                return text.endsWith('\n') ? text : (text + '\n');
            }
            return '# ' + name + '\n\n' + text.replace(/\s+$/, '') + '\n';
        }

        function terminalTriggerDownload(filename, mime, body) {
            const blob = new Blob([body], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1500);
        }

        function downloadBlackTerminalContent() {
            const editor = document.getElementById('functionEditor');
            if (!editor) return;
            const content = editor.value || '';
            if (!String(content).trim()) {
                try { editor.focus(); } catch (e) {}
                return;
            }
            const filePath = currentInspectedFile || '';
            const baseName = filePath
                ? filePath.split('/').pop()
                : ('terminal-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'));
            const asCode = terminalIsCodeContent(content, filePath);

            if (asCode) {
                const html = terminalBuildCodeHtml(content, filePath || baseName);
                const outName = terminalSafeFilename(baseName.replace(/\.[^.]+$/, '') + '-code', 'html');
                terminalTriggerDownload(outName, 'text/html;charset=utf-8', html);
            } else {
                const md = terminalBuildMarkdown(content, filePath || baseName);
                const outName = terminalSafeFilename(baseName.replace(/\.[^.]+$/, '') || 'terminal-text', 'md');
                terminalTriggerDownload(outName, 'text/markdown;charset=utf-8', md);
            }
        }

        function triggerFileUpload() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();
                    if (data.ok) {
                        submitCommand('set_i code');
                    } else {
                        alert('Error al subir archivo: ' + (data.error || 'Desconocido'));
                    }
                } catch (err) {
                    console.error('Error al subir archivo:', err);
                }
            };
            fileInput.click();
        }

        function triggerCloneRepo() {
            const repo = prompt('Ingresa owner/repo o URL de GitHub (ej: facebook/react):');
            if (repo) {
                submitCommand('clone ' + repo.trim());
            }
        }

        function triggerGithubRepoSearch(event) {
            if (event) event.preventDefault();
            const input = document.getElementById('githubRepoSearch');
            const q = (input && input.value ? input.value.trim() : '');
            submitCommand(q ? ('repos ' + q) : 'repos');
        }

        function loadGithubReposPage(page) {
            const input = document.getElementById('githubRepoSearch');
            const q = (input && input.value ? input.value.trim() : '');
            const p = Math.max(1, parseInt(page, 10) || 1);
            submitCommand(q ? ('repos ' + q + ' page ' + p) : ('repos page ' + p));
        }

        function showUnlicensedPopup(message, repoName) {
            const existing = document.getElementById('unlicensedModal');
            if (existing) existing.remove();
            const msg = message || 'This repository is unlicensed! Do not use it.';
            const overlay = document.createElement('div');
            overlay.id = 'unlicensedModal';
            overlay.className = 'unlicensed-modal-overlay';
            overlay.innerHTML = `
                <div class="unlicensed-modal" role="alertdialog" aria-modal="true">
                    <div class="unlicensed-modal-title">${repoName ? ('Repo: ' + repoName) : 'License check'}</div>
                    <div class="unlicensed-modal-text">${msg}</div>
                    <button type="button" class="unlicensed-modal-btn" id="unlicensedModalClose">Cerrar</button>
                </div>
            `;
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.remove();
            });
            document.body.appendChild(overlay);
            const btn = document.getElementById('unlicensedModalClose');
            if (btn) btn.addEventListener('click', () => overlay.remove());
        }

        function gatewaySafeFilename(name, ext) {
            let base = String(name || 'archivo')
                .replace(/[^\w.\- ()\[\]]+/g, '_')
                .replace(/\s+/g, '-')
                .replace(/^[.\-]+|[.\-]+$/g, '');
            if (!base) base = 'archivo';
            const e = String(ext || '').replace(/^\./, '');
            if (e && !base.toLowerCase().endsWith('.' + e.toLowerCase())) {
                base += '.' + e;
            }
            return base.slice(0, 120);
        }

        function collectGatewayTerminalPayload() {
            const editor = document.getElementById('functionEditor');
            const content = editor ? String(editor.value || '') : '';
            if (!content.trim()) return null;
            const filePath = (typeof currentInspectedFile === 'string' && currentInspectedFile) ? currentInspectedFile : '';
            const baseName = filePath
                ? filePath.split('/').pop()
                : ('terminal-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'));
            const name = gatewaySafeFilename(baseName, filePath ? '' : 'txt');
            return {
                name: name,
                content: content,
                folder: 'terminal',
                source: 'terminal',
                label: 'Terminal · ' + name
            };
        }

        function collectGatewayNotepadPayload(preferSelection) {
            try {
                if (typeof notepadFlushActiveFromDom === 'function') notepadFlushActiveFromDom();
            } catch (e) {}
            const editor = document.getElementById('notepadEditor');
            const note = (typeof notepadActive === 'function') ? notepadActive() : null;
            let content = '';
            let nameHint = (note && note.title) ? note.title : 'nota';
            let usedSelection = false;

            if (preferSelection && editor) {
                try {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount && editor.contains(sel.anchorNode)) {
                        const selected = String(sel.toString() || '');
                        if (selected.trim()) {
                            content = selected;
                            usedSelection = true;
                            nameHint = nameHint + '-seleccion';
                        }
                    }
                } catch (e) {}
            }

            if (!content) {
                if (note && note.html && typeof notepadHtmlToMarkdown === 'function') {
                    content = '# ' + (note.title || 'nota') + '\n\n' + notepadHtmlToMarkdown(note.html || '');
                    return {
                        name: gatewaySafeFilename(nameHint, 'md'),
                        content: content,
                        folder: 'notepad',
                        source: 'notepad',
                        label: 'Bloc de notas · ' + (note.title || 'nota'),
                        selection: false
                    };
                }
                content = editor ? String(editor.innerText || '') : '';
            }

            if (!String(content).trim()) return null;
            const ext = usedSelection ? 'txt' : 'txt';
            return {
                name: gatewaySafeFilename(nameHint, ext),
                content: content,
                folder: 'notepad',
                source: 'notepad',
                label: 'Bloc de notas · ' + (note && note.title ? note.title : 'nota') + (usedSelection ? ' (selección)' : ''),
                selection: usedSelection
            };
        }

        function openPlatformGateway() {
            const existing = document.getElementById('gatewayModal');
            if (existing) existing.remove();

            const terminalPayload = collectGatewayTerminalPayload();
            const notepadPayload = collectGatewayNotepadPayload(true);
            const overlay = document.createElement('div');
            overlay.id = 'gatewayModal';
            overlay.className = 'unlicensed-modal-overlay';
            overlay.innerHTML = `
                <div class="gateway-modal" role="dialog" aria-modal="true" aria-labelledby="gatewayModalTitle" style="max-width:460px;">
                    <div class="gateway-modal-title" id="gatewayModalTitle">Gateway</div>
                    <div class="gateway-modal-brand">
                        <img src="/favicon.svg?v=3" alt="l8 codespace">
                        <span>l8 codespace</span>
                    </div>
                    <div class="gateway-modal-text">
                        Transporta contenido de la plataforma (no solo GitHub).
                        Elige qué enviar; se genera un código único para reclamarlo en <code>/gateway</code>.
                        Los repositorios siguen pudiendo enviarse desde el botón antena de cada repo.
                    </div>
                    <div class="gateway-source-list" id="gatewaySourceList">
                        <label class="gateway-source-item ${notepadPayload ? '' : 'disabled'}">
                            <input type="checkbox" id="gatewaySrcNotepad" ${notepadPayload ? 'checked' : 'disabled'}>
                            <span>
                                <strong>Bloc de notas</strong>
                                <span class="muted">${notepadPayload
                                    ? (notepadPayload.label + (notepadPayload.selection ? '' : ' · nota activa'))
                                    : 'Sin contenido en la nota activa'}</span>
                            </span>
                        </label>
                        <label class="gateway-source-item ${terminalPayload ? '' : 'disabled'}">
                            <input type="checkbox" id="gatewaySrcTerminal" ${terminalPayload ? 'checked' : 'disabled'}>
                            <span>
                                <strong>Terminal negra</strong>
                                <span class="muted">${terminalPayload
                                    ? terminalPayload.label
                                    : 'Sin texto en la terminal'}</span>
                            </span>
                        </label>
                    </div>
                    <div class="gateway-code-box" id="gatewayCodeBox">
                        <div class="gateway-code-label">Código de transferencia</div>
                        <div class="gateway-code-value" id="gatewayCodeValue">---- ----</div>
                    </div>
                    <div class="gateway-modal-actions">
                        <button type="button" class="gateway-modal-btn" id="gatewaySendBtn">Generar código</button>
                        <button type="button" class="gateway-modal-btn secondary" id="gatewayCopyBtn" style="display:none;">Copiar código</button>
                        <button type="button" class="gateway-modal-btn secondary" id="gatewayOpenReceiveBtn">Abrir /gateway</button>
                        <button type="button" class="gateway-modal-btn secondary" id="gatewayCloseBtn">Cerrar</button>
                    </div>
                    <div class="gateway-modal-status" id="gatewayStatus"></div>
                </div>
            `;
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.remove();
            });
            document.body.appendChild(overlay);

            const statusEl = document.getElementById('gatewayStatus');
            const sendBtn = document.getElementById('gatewaySendBtn');
            const copyBtn = document.getElementById('gatewayCopyBtn');
            const codeBox = document.getElementById('gatewayCodeBox');
            const codeValue = document.getElementById('gatewayCodeValue');
            let lastCode = '';

            document.getElementById('gatewayCloseBtn').addEventListener('click', () => overlay.remove());
            document.getElementById('gatewayOpenReceiveBtn').addEventListener('click', async () => {
                const url = lastCode ? ('/gateway?code=' + encodeURIComponent(lastCode)) : '/gateway';
                await openExternalWithTokens(url, 'l8-gateway', 'width=1100,height=720');
            });
            copyBtn.addEventListener('click', () => {
                if (!lastCode) return;
                navigator.clipboard.writeText(lastCode).then(() => {
                    statusEl.textContent = 'Código copiado: ' + lastCode;
                    statusEl.className = 'gateway-modal-status ok';
                }).catch(() => {
                    statusEl.textContent = 'No se pudo copiar. Selecciona el código manualmente.';
                    statusEl.className = 'gateway-modal-status err';
                });
            });

            if (!notepadPayload && !terminalPayload) {
                statusEl.textContent = 'No hay contenido listo. Escribe en el bloc de notas o en la terminal negra, o abre /gateway para recibir.';
                statusEl.className = 'gateway-modal-status';
                sendBtn.disabled = true;
            }

            const doSend = async () => {
                const wantNote = !!(document.getElementById('gatewaySrcNotepad') || {}).checked;
                const wantTerm = !!(document.getElementById('gatewaySrcTerminal') || {}).checked;
                const files = [];
                const sources = [];
                const labels = [];

                if (wantNote) {
                    const fresh = collectGatewayNotepadPayload(true) || notepadPayload;
                    if (fresh) {
                        files.push({
                            name: fresh.name,
                            content: fresh.content,
                            folder: fresh.folder || 'notepad'
                        });
                        sources.push('notepad');
                        labels.push(fresh.label || 'notepad');
                    }
                }
                if (wantTerm) {
                    const fresh = collectGatewayTerminalPayload() || terminalPayload;
                    if (fresh) {
                        files.push({
                            name: fresh.name,
                            content: fresh.content,
                            folder: fresh.folder || 'terminal'
                        });
                        sources.push('terminal');
                        labels.push(fresh.label || 'terminal');
                    }
                }

                if (!files.length) {
                    statusEl.textContent = 'Marca al menos una fuente con contenido (nota o terminal).';
                    statusEl.className = 'gateway-modal-status err';
                    return;
                }

                sendBtn.disabled = true;
                statusEl.textContent = 'Empaquetando contenido de la plataforma y generando código…';
                statusEl.className = 'gateway-modal-status';
                try {
                    const res = await fetch('/api/gateway/share', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            kind: 'platform',
                            sources: sources,
                            label: labels.join(' + '),
                            files: files
                        })
                    });
                    const data = await res.json();
                    if (!data.ok) {
                        statusEl.textContent = data.error || 'No se pudo enviar por el gateway.';
                        statusEl.className = 'gateway-modal-status err';
                        sendBtn.disabled = false;
                        return;
                    }
                    lastCode = data.code || (data.transfer && data.transfer.code) || '';
                    codeValue.textContent = lastCode;
                    codeBox.classList.add('visible');
                    copyBtn.style.display = 'inline-block';
                    sendBtn.textContent = 'Generar otro código';
                    statusEl.textContent = data.message || ('Código listo: ' + lastCode);
                    statusEl.className = 'gateway-modal-status ok';
                    sendBtn.disabled = false;
                } catch (err) {
                    statusEl.textContent = 'Error de red al hablar con el gateway.';
                    statusEl.className = 'gateway-modal-status err';
                    sendBtn.disabled = false;
                }
            };

            sendBtn.addEventListener('click', doSend);
        }

        function openGatewaySend(repoName, userRepo) {
            const existing = document.getElementById('gatewayModal');
            if (existing) existing.remove();
            const full = userRepo || repoName || '';
            const safeFull = String(full).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
            const overlay = document.createElement('div');
            overlay.id = 'gatewayModal';
            overlay.className = 'unlicensed-modal-overlay';
            overlay.innerHTML = `
                <div class="gateway-modal" role="dialog" aria-modal="true" aria-labelledby="gatewayModalTitle">
                    <div class="gateway-modal-title" id="gatewayModalTitle">Gateway</div>
                    <div class="gateway-modal-brand">
                        <img src="/favicon.svg?v=3" alt="l8 codespace">
                        <span>l8 codespace</span>
                    </div>
                    <div class="gateway-modal-text">
                        Compartir <code>${safeFull}</code> como carpeta.
                        Se generará un código único (ej. <code>JSLA-SAKA</code>) guardado en la nube (Supabase).
                        En el otro dispositivo abre <code>/gateway</code> e ingresa ese código para obtenerlo.
                    </div>
                    <div class="gateway-code-box" id="gatewayCodeBox">
                        <div class="gateway-code-label">Código de transferencia</div>
                        <div class="gateway-code-value" id="gatewayCodeValue">---- ----</div>
                    </div>
                    <div class="gateway-modal-actions">
                        <button type="button" class="gateway-modal-btn" id="gatewaySendBtn">Generar código</button>
                        <button type="button" class="gateway-modal-btn secondary" id="gatewayCopyBtn" style="display:none;">Copiar código</button>
                        <button type="button" class="gateway-modal-btn secondary" id="gatewayOpenReceiveBtn">Abrir /gateway</button>
                        <button type="button" class="gateway-modal-btn secondary" id="gatewayCloseBtn">Cerrar</button>
                    </div>
                    <div class="gateway-modal-status" id="gatewayStatus"></div>
                </div>
            `;
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.remove();
            });
            document.body.appendChild(overlay);

            const statusEl = document.getElementById('gatewayStatus');
            const sendBtn = document.getElementById('gatewaySendBtn');
            const copyBtn = document.getElementById('gatewayCopyBtn');
            const codeBox = document.getElementById('gatewayCodeBox');
            const codeValue = document.getElementById('gatewayCodeValue');
            let lastCode = '';

            document.getElementById('gatewayCloseBtn').addEventListener('click', () => overlay.remove());
            document.getElementById('gatewayOpenReceiveBtn').addEventListener('click', async () => {
                const url = lastCode ? ('/gateway?code=' + encodeURIComponent(lastCode)) : '/gateway';
                await openExternalWithTokens(url, 'l8-gateway', 'width=1100,height=720');
            });
            copyBtn.addEventListener('click', () => {
                if (!lastCode) return;
                navigator.clipboard.writeText(lastCode).then(() => {
                    statusEl.textContent = 'Código copiado: ' + lastCode;
                    statusEl.className = 'gateway-modal-status ok';
                }).catch(() => {
                    statusEl.textContent = 'No se pudo copiar. Selecciona el código manualmente.';
                    statusEl.className = 'gateway-modal-status err';
                });
            });

            const doSend = async () => {
                sendBtn.disabled = true;
                statusEl.textContent = 'Empaquetando carpeta y generando código único…';
                statusEl.className = 'gateway-modal-status';
                try {
                    const res = await fetch('/api/gateway/share', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ repo: full })
                    });
                    const data = await res.json();
                    if (!data.ok) {
                        statusEl.textContent = data.error || 'No se pudo compartir el repositorio.';
                        statusEl.className = 'gateway-modal-status err';
                        if (data.unlicensed) {
                            showUnlicensedPopup(data.error || 'This repository is unlicensed! Do not use it.', full);
                        }
                        sendBtn.disabled = false;
                        return;
                    }
                    lastCode = data.code || (data.transfer && data.transfer.code) || '';
                    codeValue.textContent = lastCode;
                    codeBox.classList.add('visible');
                    copyBtn.style.display = 'inline-block';
                    sendBtn.textContent = 'Generar otro código';
                    statusEl.textContent = data.message || ('Código listo en la nube: ' + lastCode + '. Úsalo en /gateway desde cualquier dispositivo.');
                    statusEl.className = 'gateway-modal-status ok';
                    sendBtn.disabled = false;
                } catch (err) {
                    statusEl.textContent = 'Error de red al hablar con el gateway.';
                    statusEl.className = 'gateway-modal-status err';
                    sendBtn.disabled = false;
                }
            };

            sendBtn.addEventListener('click', doSend);
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Clave pública SSH copiada al portapapeles con éxito!');
            }).catch(err => {
                console.error('Error al copiar:', err);
            });
        }

        function render() {
            if (!hasExecutedCommand || !latestExecutionData) {
                executionContainer.textContent = '';
                return;
            }

            if (latestExecutionData.isError || latestExecutionData.error) {
                const errorMsg = latestExecutionData.error || "Your command does not exist....";
                executionContainer.innerHTML = '<span style="color: #ff0000; font-weight: 600;">' + errorMsg + '</span>';
                return;
            }

            const dataToDisplay = latestExecutionData.output !== undefined ? latestExecutionData.output : latestExecutionData;

            if (!dataToDisplay || dataToDisplay.type === "EMPTY_CELL" || (dataToDisplay.execution === null && dataToDisplay.browserState)) {
                executionContainer.textContent = '';
                return;
            }

            if (dataToDisplay.type === "CLEAR_BLACK_TERMINAL") {
                clearBlackTerminal();
                executionContainer.textContent = '';
                return;
            }

            if (dataToDisplay && dataToDisplay.type === "PRS_CODE_LAUNCH") {
                const url = dataToDisplay.open_url || '/prs-code';
                // Solo ventana externa — no montar la app en la celda (=) de la plataforma
                markExternalLaunchOnly(dataToDisplay.product || 'PRS Code', url);
                setTimeout(() => openPrsCode(url), 80);
                return;
            }


            if (dataToDisplay && dataToDisplay.type === "MACOS_INSIDE_LAUNCH") {
                const url = dataToDisplay.open_url || '/macos';
                markExternalLaunchOnly(dataToDisplay.product || 'macOS inside', url);
                setTimeout(() => openMacosInside(url), 80);
                return;
            }


            if (dataToDisplay && dataToDisplay.type === "CHROMEOS_PLAY_LAUNCH") {
                const url = dataToDisplay.open_url || '/chromeos';
                markExternalLaunchOnly(dataToDisplay.product || 'ChromeOS play', url);
                setTimeout(() => openChromeosPlay(url), 80);
                return;
            }


            // RENDERIZADO PARA EL CATÁLOGO GLOBAL DE GITHUB (repos / clone / save)
            if (dataToDisplay && (dataToDisplay.type === "REPOS_CATALOG" || dataToDisplay.type === "REPO_CLONE_RESULT")) {
                const repos = dataToDisplay.repos || (dataToDisplay.all_repos || []);
                const cloneResult = dataToDisplay.result;
                const githubTotal = dataToDisplay.github_total || 0;
                const savedTotal = dataToDisplay.saved_total || repos.length;
                const page = dataToDisplay.page || 1;
                const defaultQueries = ['is:public', 'is:public stars:>50'];
                let queryVal = (dataToDisplay.query && !defaultQueries.includes(dataToDisplay.query)) ? dataToDisplay.query : '';
                // No mostrar el fragmento técnico de filtros de licencia en la barra
                queryVal = queryVal.replace(/\s*\(license:mit[\s\S]*?\)\s*/gi, '').trim();
                const escHtml = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
                const escAttr = (s) => encodeURIComponent(String(s ?? ''));
                const warn = dataToDisplay.unlicensed_warning || (cloneResult && cloneResult.unlicensed ? {
                    show: true,
                    message: 'This repository is unlicensed! Do not use it.',
                    user_repo: cloneResult.user_repo || ''
                } : null);
                if (warn && warn.show) {
                    setTimeout(() => showUnlicensedPopup(warn.message, warn.user_repo || ''), 30);
                }

                let rowsHtml = '';
                if (repos.length === 0) {
                    rowsHtml = `
                        <tr>
                            <td colspan="6" style="text-align:center; padding:24px; color:#888;">
                                ${dataToDisplay.github_error ? ('Error GitHub: ' + escHtml(dataToDisplay.github_error)) : 'Sin resultados con licencia MIT / Apache / BSD. Si el repo no tiene licencia verás una alerta en rojo.'}
                            </td>
                        </tr>`;
                } else {
                    repos.forEach(r => {
                        const full = r.user_repo || r.name;
                        const cloned = !!r.cloned;
                        const licRaw = (r.license || 'Unknown').toString().trim() || 'Unknown';
                        const licUpper = licRaw.toUpperCase();
                        const licLabel = (licUpper === 'NONE' || licUpper === 'NOASSERTION' || licUpper === 'UNKNOWN') ? 'None' : licRaw;
                        const statusBadge = cloned
                            ? `<span class="mime-tag" style="background:#e6f4ea;color:#137333;">Clonado</span>`
                            : `<span class="mime-tag" style="background:#eceae4;color:#444;">GitHub</span>`;
                        const licenseBadge = `<span class="license-badge" title="Licencia SPDX del repositorio"><span class="dot"></span>${escHtml(licLabel)}</span>`;
                        // Gateway (izquierda) + icono código + Guardar / GitHub / Pull
                        const gatewayBtn = `<button class="action-btn-link action-code-btn action-gateway-btn" style="border:none; background:transparent; cursor:pointer;" onclick="openGatewaySend(decodeURIComponent('${escAttr(r.name)}'), decodeURIComponent('${escAttr(full)}'))" title="Compartir carpeta con código gateway">
                                    ${SVG_GATEWAY_BLACK}
                               </button>`;
                        const codeBtn = `<button class="action-btn-link action-code-btn" style="border:none; background:transparent; cursor:pointer;" onclick="openRepoCodeInspector(decodeURIComponent('${escAttr(r.name)}'), decodeURIComponent('${escAttr(full)}'))" title="Ver todo el código en la terminal negra">
                                    ${SVG_CODE_WINDOW_BLACK}
                               </button>`;
                        const actions = cloned
                            ? `${gatewayBtn}${codeBtn}
                               <button class="action-btn-link" style="border:none; background:transparent; cursor:pointer;" onclick="submitCommand('clone ' + decodeURIComponent('${escAttr(full)}'))">
                                    ${SVG_REFRESH_VECTOR}<span>Git Pull</span>
                               </button>`
                            : `${gatewayBtn}${codeBtn}
                               <button class="action-btn-link" style="border:none; background:transparent; cursor:pointer;" onclick="submitCommand('save ' + decodeURIComponent('${escAttr(full)}'))">
                                    ${SVG_GITHUB_BLACK}<span>Guardar</span>
                               </button>
                               <button class="action-btn-link" style="border:none; background:transparent; cursor:pointer;" onclick="submitCommand('clone ' + decodeURIComponent('${escAttr(full)}'))">
                                    ${SVG_REFRESH_VECTOR}<span>Clonar</span>
                               </button>`;
                        rowsHtml += `
                            <tr>
                                <td>
                                    <div class="file-name-cell">
                                        ${SVG_GITHUB_BLACK}
                                        <div style="display:flex;flex-direction:column;gap:4px;min-width:0;">
                                            <span>${escHtml(full)}</span>
                                            ${statusBadge}
                                        </div>
                                    </div>
                                </td>
                                <td>${licenseBadge}</td>
                                <td><span class="mime-tag">${escHtml(r.branch || 'main')}</span></td>
                                <td style="color:#666; font-size:11px; font-family:monospace;">${escHtml(r.last_commit || '')}</td>
                                <td>${escHtml(r.size_formatted || '—')}</td>
                                <td>
                                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                                        ${actions}
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                }

                let cloneBanner = '';
                if (cloneResult) {
                    const alertBg = cloneResult.ok ? '#e6f4ea' : '#fce8e6';
                    const alertColor = cloneResult.ok ? '#137333' : '#c5221f';
                    const iconHeader = cloneResult.ok ? SVG_CHECK_VECTOR : SVG_CROSS_VECTOR;
                    cloneBanner = `
                        <div style="background:${alertBg}; color:${alertColor}; padding:12px 16px; border-radius:6px; font-size:12px; display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                ${iconHeader}
                                <strong>${cloneResult.ok ? 'Repositorio Procesado Exitosamente (' + escHtml(cloneResult.action) + ')' : 'Error al Procesar Repositorio'}</strong>
                            </div>
                            <pre style="white-space:pre-wrap; font-family:monospace; font-size:11px; margin-top:4px;">${escHtml(cloneResult.raw_output || '')}</pre>
                        </div>
                    `;
                }

                const reposHtml = `
                    <div class="catalog-card">
                        ${cloneBanner}
                        <div class="catalog-header-bar">
                            <div class="catalog-metrics">
                                <div class="metric-item">
                                    ${SVG_GITHUB_BLACK}
                                    <span>Conexión SSH:</span>
                                    <span class="metric-badge-black">GitHub SSH Active</span>
                                </div>
                                <div class="metric-item">
                                    <span>En esta página:</span>
                                    <span class="metric-badge-black">${repos.length}</span>
                                </div>
                                <div class="metric-item">
                                    <span>Guardados:</span>
                                    <span class="metric-badge-black">${savedTotal}</span>
                                </div>
                                <div class="metric-item">
                                    <span>GitHub match:</span>
                                    <span class="metric-badge-black">${githubTotal > 0 ? githubTotal.toLocaleString() : '—'}</span>
                                </div>
                            </div>
                            <button class="btn-upload-vector" onclick="triggerCloneRepo()">
                                <svg class="svg-icon-vector" style="fill:#ffffff; width:14px; height:14px;" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                                <span>Clonar Nuevo Repositorio</span>
                            </button>
                        </div>
                        <form onsubmit="triggerGithubRepoSearch(event)" style="display:flex; gap:8px; margin:10px 0 14px; flex-wrap:wrap; align-items:center;">
                            <input id="githubRepoSearch" type="text" value="${escHtml(queryVal)}" placeholder="Buscar repos MIT/Apache/BSD (ej: facebook/react)" style="flex:1; min-width:220px; padding:8px 12px; border:1px solid #d0cdc4; border-radius:6px; font-size:12px; font-family:inherit; background:#fff;" />
                            <button type="submit" class="btn-upload-vector" style="padding:8px 14px;">Buscar GitHub</button>
                            <button type="button" class="action-btn-link" style="border:1px solid #d0cdc4; background:#fff; padding:8px 12px; border-radius:6px; cursor:pointer;" onclick="loadGithubReposPage(${Math.max(1, page - 1)})">← Ant.</button>
                            <span style="font-size:11px; color:#666;">Pág. ${page}</span>
                            <button type="button" class="action-btn-link" style="border:1px solid #d0cdc4; background:#fff; padding:8px 12px; border-radius:6px; cursor:pointer;" onclick="loadGithubReposPage(${page + 1})">Sig. →</button>
                        </form>
                        <div class="catalog-table-wrapper">
                            <table class="catalog-table-vector">
                                <thead>
                                    <tr>
                                        <th>Repositorio</th>
                                        <th>Licencia</th>
                                        <th>Rama Active</th>
                                        <th>Descripción / Commit</th>
                                        <th>Tamaño</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rowsHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
                executionContainer.innerHTML = `<div style="width:100%;">${reposHtml}</div>`;
                return;
            }

            // RENDERIZADO PARA EL COMANDO supabase
            if (dataToDisplay && dataToDisplay.type === "SUPABASE_STATUS") {
                const connected = !!dataToDisplay.connected;
                const url = dataToDisplay.url || '—';
                const msg = dataToDisplay.message || dataToDisplay.error || '';
                const auth = dataToDisplay.auth_health || {};
                const supabaseHtml = `
                    <div class="ssh-card-container">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <strong style="font-size:13px; color:#141414;">Conexión Supabase</strong>
                            </div>
                            <span class="metric-badge-black">
                                <svg class="svg-icon-vector" style="fill:${connected ? '#34c759' : '#f5a623'}; width:10px; height:10px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
                                <span>${connected ? 'CONECTADO' : 'NO CONECTADO'}</span>
                            </span>
                        </div>
                        <div style="font-size:12px; display:flex; flex-direction:column; gap:8px; margin-top:8px;">
                            <div><strong>URL:</strong> <code>${url}</code></div>
                            <div><strong>Publishable key:</strong> ${dataToDisplay.has_publishable ? 'configurada' : 'faltante'}</div>
                            <div><strong>Secret key:</strong> ${dataToDisplay.has_secret ? 'configurada' : 'faltante'}</div>
                            <div><strong>Storage bucket:</strong> ${dataToDisplay.storage_bucket || 'l8-storage'} · ${dataToDisplay.storage_ready ? 'listo' : 'pendiente'}</div>
                            <div><strong>DB (Postgres):</strong> ${dataToDisplay.db_ready ? 'lista' : 'opcional — ejecuta supabase/schema.sql'}</div>
                            <div><strong>Sesión persistente:</strong> ${dataToDisplay.session_persisted ? 'sí' : 'aún vacía (usa un comando y recarga)'}</div>
                            <div style="background:#eceae4; padding:8px 12px; border-radius:6px; color:#444;">
                                ${msg}${auth.name ? ' · Auth: ' + auth.name + ' ' + (auth.version || '') : ''}
                            </div>
                            <div style="font-size:11px; color:#666;">Fuente de verdad remota: repos, archivos (set_i code), gateway y último comando se guardan en Supabase para sobrevivir al reload en Render.</div>
                        </div>
                    </div>
                `;
                executionContainer.innerHTML = `<div style="width:100%;">${supabaseHtml}</div>`;
                return;
            }

            // RENDERIZADO PARA EL COMANDO ssh_key (CONEXIÓN SSH GITHUB)
            if (dataToDisplay && dataToDisplay.type === "SSH_KEY_DISPLAY") {
                const pubKey = dataToDisplay.public_key || '';
                const sshOut = dataToDisplay.github_test_output || '';
                const isConnected = sshOut.includes('successfully authenticated') || sshOut.includes('Hi ');

                const sshHtml = `
                    <div class="ssh-card-container">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <svg class="svg-icon-vector" style="fill:#000000; width:20px; height:20px;" viewBox="0 0 24 24"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
                                <strong style="font-size:13px; color:#141414;">Clave Pública SSH Ed25519 del Servidor</strong>
                            </div>
                            <span class="metric-badge-black">
                                <svg class="svg-icon-vector" style="fill:${isConnected ? '#34c759' : '#f5a623'}; width:10px; height:10px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
                                <span>${isConnected ? 'CONECTADO CON GITHUB' : 'LISTO PARA AÑADIR A GITHUB'}</span>
                            </span>
                        </div>
                        <div class="ssh-key-box" id="sshPubKeyBox">${pubKey}</div>
                        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                            <button class="btn-upload-vector" onclick="copyToClipboard('${pubKey}')">
                                <svg class="svg-icon-vector" style="fill:#ffffff; width:14px; height:14px;" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                                <span>Copiar Clave Pública</span>
                            </button>
                            <a class="action-btn-link" href="https://github.com/settings/ssh/new" target="_blank">
                                <span>Añadir en GitHub Settings</span>
                                ${SVG_EXT_LINK}
                            </a>
                        </div>
                        <div style="font-size:11px; background:#eceae4; padding:8px 12px; border-radius:6px; color:#444;">
                            <strong>Prueba de Conexión GitHub SSH:</strong> <code>${sshOut}</code>
                        </div>
                    </div>
                `;
                executionContainer.innerHTML = `<div style="width:100%;">${sshHtml}</div>`;
                return;
            }

            // RENDERIZADO VECTORIAL ELEGANTE PARA EL COMANDO set_I code (SUPER BASE DE DATOS GLOBAL)
            if (dataToDisplay && dataToDisplay.type === "GLOBAL_FILES_CATALOG") {
                const files = dataToDisplay.files || [];
                const totalStorage = dataToDisplay.total_storage_formatted || "0 B";

                let rowsHtml = '';
                if (files.length === 0) {
                    rowsHtml = `
                        <tr>
                            <td colspan="6" style="text-align:center; padding:24px; color:#888;">
                                <svg style="width:32px; height:32px; fill:#000000; opacity:0.3; margin-bottom:8px; display:block; margin-left:auto; margin-right:auto;" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                                No hay archivos almacenados aún en la Super Base de Datos.<br>Haz clic en <strong>'Subir Nuevo Archivo'</strong> para almacenar uno.
                            </td>
                        </tr>`;
                } else {
                    files.forEach(f => {
                        const dHash = f.dilithium5_hash ? (f.dilithium5_hash.substring(0, 22) + '...') : 'dilithium5_...';
                        
                        let fileVectorIcon = '<svg class="svg-icon-vector" style="fill:#000000;" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>';
                        
                        if (f.filename.endsWith('.zip') || f.filename.endsWith('.rar') || f.filename.endsWith('.7z')) {
                            fileVectorIcon = '<svg class="svg-icon-vector" style="fill:#000000;" viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 6h-2v2h2v-2zm0-4h-2v2h2V8z"/></svg>';
                        } else if (f.mime_type.includes('image')) {
                            fileVectorIcon = '<svg class="svg-icon-vector" style="fill:#000000;" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
                        }

                        rowsHtml += `
                            <tr>
                                <td>
                                    <div class="file-name-cell">
                                        ${fileVectorIcon}
                                        <span>${f.filename}</span>
                                    </div>
                                </td>
                                <td title="${f.dilithium5_hash}">
                                    <div class="hash-badge-vector">
                                        <svg class="svg-icon-vector" style="width:12px; height:12px; fill:#34c759;" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                                        <span>${dHash}</span>
                                    </div>
                                </td>
                                <td><span class="mime-tag">${f.mime_type}</span></td>
                                <td style="font-weight:500;">${f.size_formatted}</td>
                                <td style="color:#666666; font-size:11px;">${f.upload_date}</td>
                                <td>
                                    <a class="action-btn-link" href="${f.url}" target="_blank" download="${f.filename}">
                                        <svg class="svg-icon-vector" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                                        <span>Descargar / Ver</span>
                                    </a>
                                </td>
                            </tr>
                        `;
                    });
                }

                const catalogHtml = `
                    <div class="catalog-card">
                        <div class="catalog-header-bar">
                            <div class="catalog-metrics">
                                <div class="metric-item">
                                    <svg class="svg-icon-vector" style="fill:#000000;" viewBox="0 0 24 24"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
                                    <span>Firma:</span>
                                    <span class="metric-badge-black">Dilithium 5 (Post-Quantum)</span>
                                </div>
                                <div class="metric-item">
                                    <svg class="svg-icon-vector" style="fill:#000000;" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                                    <span>Archivos:</span>
                                    <span class="metric-badge-black">${files.length}</span>
                                </div>
                                <div class="metric-item">
                                    <svg class="svg-icon-vector" style="fill:#000000;" viewBox="0 0 24 24"><path d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z"/></svg>
                                    <span>Almacenamiento:</span>
                                    <span class="metric-badge-black">${totalStorage}</span>
                                </div>
                            </div>
                            <button class="btn-upload-vector" onclick="triggerFileUpload()">
                                <svg class="svg-icon-vector" style="fill:#ffffff; width:14px; height:14px;" viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
                                <span>Subir Nuevo Archivo</span>
                            </button>
                        </div>
                        <div class="catalog-table-wrapper">
                            <table class="catalog-table-vector">
                                <thead>
                                    <tr>
                                        <th>Archivo</th>
                                        <th>Firma Post-Cuántica (Dilithium 5)</th>
                                        <th>Tipo MIME</th>
                                        <th>Tamaño</th>
                                        <th>Fecha de Subida</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rowsHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
                executionContainer.innerHTML = `<div style="width:100%;">${catalogHtml}</div>`;
                return;
            }

            if (dataToDisplay && dataToDisplay.type === "COMMAND_VERTICAL_LIST" && Array.isArray(dataToDisplay.rows)) {
                const htmlRows = dataToDisplay.rows.map(r => 
                    `<div class="vertical-cmd-row">` +
                        `<span class="vertical-cmd-name">${r.command}</span>` +
                        `<span class="vertical-cmd-sep">-</span>` +
                        `<span class="vertical-cmd-desc">${r.description}</span>` +
                    `</div>`
                ).join('');
                executionContainer.innerHTML = `<div class="vertical-cmd-table">${htmlRows}</div>`;
                return;
            }

            if (formatToggle.checked) {
                document.body.classList.remove('raw-mode');
                executionContainer.innerHTML = syntaxHighlight(dataToDisplay);
            } else {
                document.body.classList.add('raw-mode');
                executionContainer.textContent = JSON.stringify(dataToDisplay);
            }
        }

        function toggleFormat() {
            render();
        }


        let latestTokensStatus = null;

        function ensureTokensGuestId() {
            const key = 'l8_tokens_guest';
            try {
                let id = localStorage.getItem(key) || '';
                id = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
                if (!id || id.length < 8) {
                    const rand = (window.crypto && crypto.getRandomValues)
                        ? Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('')
                        : String(Math.random()).slice(2) + String(Date.now());
                    id = 'guest_' + rand.slice(0, 16);
                    localStorage.setItem(key, id);
                }
                return id;
            } catch (e) {
                return '';
            }
        }

        function authHeaders(extra) {
            const headers = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
            try {
                const tok = (typeof window.l8GetAuthToken === 'function') ? window.l8GetAuthToken() : '';
                if (tok) headers['Authorization'] = 'Bearer ' + tok;
            } catch (e) {}
            const guest = ensureTokensGuestId();
            if (guest) headers['X-L8-Tokens-Guest'] = guest;
            return headers;
        }

        function formatTokenCount(n) {
            const v = Number(n || 0);
            return v.toLocaleString('es-ES');
        }

        function tokenKindLabel(kind) {
            const k = String(kind || '').toLowerCase();
            if (k === 'clone') return 'Clone';
            if (k === 'external') return 'Externa';
            if (k === 'notepad' || k === 'notepads' || k === 'notes') return 'Notas';
            return 'Comando';
        }

        function renderTokensHistory(status) {
            const list = document.getElementById('tokensHistoryList');
            const empty = document.getElementById('tokensHistoryEmpty');
            if (!list) return;
            const history = Array.isArray(status && status.history) ? status.history : [];
            list.innerHTML = '';
            if (!history.length) {
                if (empty) empty.style.display = 'block';
                return;
            }
            if (empty) empty.style.display = 'none';
            history.slice(0, 8).forEach((row) => {
                const li = document.createElement('li');
                const left = document.createElement('span');
                left.innerHTML = '<strong>' + String(row.period || '—') + '</strong><br><span class="muted">' +
                    formatTokenCount(row.commands) + ' cmd · ' +
                    formatTokenCount(row.externals) + ' ext · ' +
                    formatTokenCount(row.clones) + ' clone · ' +
                    formatTokenCount(row.notepads) + ' notas</span>';
                const right = document.createElement('span');
                right.textContent = formatTokenCount(row.used) + ' / ' + formatTokenCount(row.allowance || status.allowance);
                li.appendChild(left);
                li.appendChild(right);
                list.appendChild(li);
            });
        }

        function renderTokensLedger(status) {
            const list = document.getElementById('tokensLedgerList');
            const empty = document.getElementById('tokensLedgerEmpty');
            if (!list) return;
            const ledger = Array.isArray(status && status.ledger) ? status.ledger : [];
            list.innerHTML = '';
            if (!ledger.length) {
                if (empty) empty.style.display = 'block';
                return;
            }
            if (empty) empty.style.display = 'none';
            ledger.slice(0, 12).forEach((row) => {
                const li = document.createElement('li');
                const left = document.createElement('span');
                const when = row.created_at ? String(row.created_at).replace('T', ' ').slice(0, 16) : (row.period || '');
                const detail = row.detail ? String(row.detail).slice(0, 42) : tokenKindLabel(row.kind);
                left.innerHTML = '<strong>−' + formatTokenCount(row.cost) + '</strong> ' + tokenKindLabel(row.kind) +
                    '<br><span class="muted">' + when + (detail ? ' · ' + detail.replace(/</g, '&lt;') : '') + '</span>';
                const right = document.createElement('span');
                right.className = 'muted';
                right.textContent = row.period || '';
                li.appendChild(left);
                li.appendChild(right);
                list.appendChild(li);
            });
        }

        function applyTokensStatus(status) {
            if (!status || !status.ok) return;
            latestTokensStatus = status;
            const rem = document.getElementById('tokensRemaining');
            const used = document.getElementById('tokensUsed');
            const cmds = document.getElementById('tokensCommands');
            const exts = document.getElementById('tokensExternals');
            const clones = document.getElementById('tokensClones');
            const notepads = document.getElementById('tokensNotepads');
            const period = document.getElementById('tokensPeriodLabel');
            const fill = document.getElementById('tokensMeterFill');
            const btn = document.getElementById('tokensMeterBtn');
            const legend = document.getElementById('tokensLegend');
            if (rem) rem.textContent = formatTokenCount(status.remaining);
            if (used) used.textContent = formatTokenCount(status.used) + ' / ' + formatTokenCount(status.allowance);
            if (cmds) cmds.textContent = formatTokenCount(status.commands);
            if (exts) exts.textContent = formatTokenCount(status.externals);
            if (clones) clones.textContent = formatTokenCount(status.clones);
            if (notepads) notepads.textContent = formatTokenCount(status.notepads);
            if (period) period.textContent = 'Periodo ' + (status.period || '—') + ' · cupo mensual (guardado)';
            const pct = Math.max(0, Math.min(100, Number(status.percent_used || 0)));
            if (fill) {
                fill.style.width = pct + '%';
                fill.classList.toggle('warn', pct >= 70 && pct < 90);
                fill.classList.toggle('danger', pct >= 90);
            }
            if (btn) {
                btn.classList.toggle('low', pct >= 70 && pct < 100);
                btn.classList.toggle('exhausted', !!status.exhausted || (status.remaining || 0) <= 0);
                btn.title = 'Tokens: ' + formatTokenCount(status.remaining) + ' restantes';
            }
            if (legend && status.costs) {
                legend.textContent = 'Cupo mensual ' + formatTokenCount(status.allowance) +
                    ' · Comando −' + status.costs.command +
                    ' · Ventana externa −' + status.costs.external +
                    ' · Clone GitHub −' + status.costs.clone +
                    ' · Bloc de notas −' + (status.costs.notepad || 1000);
            }
            renderTokensHistory(status);
            renderTokensLedger(status);
        }

        async function refreshTokensStatus(sync) {
            try {
                const q = sync ? '?sync=1' : '';
                const res = await fetch('/api/tokens/status' + q, { headers: authHeaders() });
                const data = await res.json();
                applyTokensStatus(data);
                return data;
            } catch (e) {
                return null;
            }
        }

        async function consumeTokens(kind, detail) {
            try {
                const res = await fetch('/api/tokens/consume', {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({ kind: kind, detail: detail || kind })
                });
                const data = await res.json();
                if (data && data.status) applyTokensStatus(data.status);
                else if (data && data.ok === false && data.status) applyTokensStatus(data.status);
                return data;
            } catch (e) {
                return { ok: false, error: e.message || String(e) };
            }
        }

        function toggleTokensPanel(force) {
            const panel = document.getElementById('tokensPanel');
            const btn = document.getElementById('tokensMeterBtn');
            if (!panel || !btn) return;
            const open = typeof force === 'boolean' ? force : !panel.classList.contains('open');
            panel.classList.toggle('open', open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) refreshTokensStatus(true);
        }

        async function openExternalWithTokens(url, windowName, features) {
            const charge = await consumeTokens('external', url || windowName || 'external');
            if (!charge || !charge.ok) {
                const msg = (charge && charge.error) ? charge.error : 'Tokens insuficientes para abrir la ventana externa (−25).';
                if (executionContainer) {
                    executionContainer.innerHTML = '<span style="color:#c5221f; font-weight:600; font-family:\'IBM Plex Mono\', monospace;">' +
                        String(msg).replace(/&/g,'&amp;').replace(/</g,'&lt;') + '</span>';
                }
                toggleTokensPanel(true);
                return null;
            }

            // Solo ventana externa: nunca navegar la plataforma servidor.
            // No poner noopener/noreferrer en features — en varios navegadores hace que
            // window.open devuelva null aunque la ventana sí abrió, y el fallback
            // antiguo (location.href) cargaba la app también aquí.
            const target = windowName || '_blank';
            const feat = String(features || 'width=1100,height=720')
                .split(',')
                .map((s) => s.trim())
                .filter((s) => {
                    const k = s.toLowerCase();
                    return k && k !== 'noopener' && k !== 'noreferrer';
                })
                .join(',');
            let win = null;
            try {
                win = window.open(url, target, feat || 'width=1100,height=720');
            } catch (e) {
                win = null;
            }
            if (win) {
                try { win.opener = null; } catch (e) {}
                try { win.focus(); } catch (e) {}
                return win;
            }

            const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
            if (executionContainer) {
                executionContainer.innerHTML =
                    '<div style="padding:12px 14px; font-family:\'IBM Plex Mono\', monospace; font-size:12px; color:#111; line-height:1.45;">' +
                    '<div style="font-weight:600; margin-bottom:6px;">Ventana externa bloqueada por el navegador</div>' +
                    '<div style="color:#444; margin-bottom:10px;">La plataforma no se abre aquí a propósito. Permite ventanas emergentes o ábrela solo de forma externa:</div>' +
                    '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" style="color:#0b57d0;">Abrir solo en ventana externa</a>' +
                    '</div>';
            }
            return null;
        }

        function markExternalLaunchOnly(label, url) {
            const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
            if (!executionContainer) return;
            executionContainer.innerHTML =
                '<div style="padding:10px 12px; font-family:\'IBM Plex Mono\', monospace; font-size:12px; color:#333;">' +
                '<span style="font-weight:600; color:#111;">' + esc(label || 'Ventana externa') + '</span>' +
                ' · abierta solo de forma externa' +
                (url ? ' · <a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" style="color:#0b57d0;">reabrir</a>' : '') +
                '</div>';
        }


        async function openUbuntuCli() {
            await openExternalWithTokens('/ubuntu', 'l8-ubuntu-cli', 'width=1100,height=720');
        }

        async function openClaudeCli() {
            await openExternalWithTokens('/claude', 'l8-claude-cli', 'width=1100,height=720');
        }

        async function openZylonCli() {
            await openExternalWithTokens('/zylon', 'l8-zylon-cli', 'width=1100,height=720');
        }


        async function openPrsCode(url) {
            await openExternalWithTokens(url || '/prs-code', 'l8-prs-code', 'width=1180,height=780');
        }


        async function openMacosInside(url) {
            await openExternalWithTokens(url || '/macos', 'l8-macos-inside', 'width=1180,height=780');
        }


        async function openChromeosPlay(url) {
            await openExternalWithTokens(url || '/chromeos', 'l8-chromeos-play', 'width=1180,height=780');
        }

        async function submitCommand(cmd) {
            if (!cmd) return;
            try {
                hasExecutedCommand = true;
                lastCommandText = cmd;
                executionContainer.innerHTML = `
                    <div style="padding:14px; background:#faf9f6; border:1px solid #e6e3dd; border-radius:8px; font-weight:600; color:#000000; display:flex; align-items:center; gap:10px; font-family:'IBM Plex Mono', monospace;">
                        <svg style="animation: spin 1s linear infinite; width:20px; height:20px; fill:#000000;" viewBox="0 0 24 24"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8C6.25 13.93 6 12.99 6 12c0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.45.87.7 1.81.7 2.8c0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/></svg>
                        <span>Procesando comando en el servidor... Por favor espera unos segundos...</span>
                    </div>
                `;
                const res = await fetch('/api/command', {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({ command: cmd })
                });
                const result = await res.json();
                if (result && result.tokens) applyTokensStatus(result.tokens);
                latestExecutionData = result;
                render();
                schedulePersistPlatformState();
            } catch (e) {
                console.error("Error al enviar comando:", e);
            }
        }

        let activeInputTarget = document.getElementById('cmdInput');

        document.addEventListener('DOMContentLoaded', () => {
            const inputCmd = document.getElementById('cmdInput');
            const editorFunc = document.getElementById('functionEditor');
            const editorEq = document.getElementById('equationsEditor');
            const tokensBtn = document.getElementById('tokensMeterBtn');
            const tokensPanel = document.getElementById('tokensPanel');

            if (tokensBtn) {
                tokensBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleTokensPanel();
                });
            }
            document.addEventListener('click', (e) => {
                if (!tokensPanel || !tokensPanel.classList.contains('open')) return;
                if (tokensPanel.contains(e.target) || (tokensBtn && tokensBtn.contains(e.target))) return;
                toggleTokensPanel(false);
            });
            refreshTokensStatus(true);

            if (inputCmd) {
                inputCmd.addEventListener('focus', () => { activeInputTarget = inputCmd; });
                inputCmd.addEventListener('click', () => { activeInputTarget = inputCmd; });
            }
            if (editorFunc) {
                editorFunc.addEventListener('focus', () => { activeInputTarget = editorFunc; });
                editorFunc.addEventListener('click', () => { activeInputTarget = editorFunc; });
            }
            if (editorEq) {
                editorEq.addEventListener('focus', () => { activeInputTarget = editorEq; });
                editorEq.addEventListener('click', () => { activeInputTarget = editorEq; });
            }
        });

        function toggleVirtualKeyboard() {
            // Solo teclado — la terminal negra se activa con (>)
            const vk = document.getElementById('virtualKeyboard');
            if (!vk) return;
            vk.classList.toggle('active');
            if (vk.classList.contains('active')) {
                if (!activeInputTarget) activeInputTarget = document.getElementById('cmdInput');
                try { activeInputTarget.focus(); } catch (e) {}
            }
        }

        function toggleFunctionDrawer() {
            const drawer = document.getElementById('functionDrawer');
            if (!drawer) return;
            drawer.classList.toggle('open');
            if (drawer.classList.contains('open')) {
                const funcEdit = document.getElementById('functionEditor');
                if (funcEdit) {
                    funcEdit.focus();
                    activeInputTarget = funcEdit;
                }
            }
        }

        function handleEditorKeyDown(event) {
            if (event.key === 'Tab') {
                event.preventDefault();
                const editor = event.target;
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                editor.value = editor.value.substring(0, start) + "    " + editor.value.substring(end);
                editor.selectionStart = editor.selectionEnd = start + 4;
            }
        }

        function triggerCommandSubmit() {
            const command = cmdInput.value.trim();
            if (command) {
                submitCommand(command);
                cmdInput.value = '';
            }
        }

        function handleCommandKey(event) {
            if (event.key === 'Enter') {
                triggerCommandSubmit();
            }
        }

        function connectSSE() {
            const eventSource = new EventSource('/api/stream');

            eventSource.onmessage = function(event) {
                try {
                    const payload = JSON.parse(event.data);
                    if (hasExecutedCommand && payload.execution) {
                        latestExecutionData = payload.execution;
                        render();
                    }
                } catch (e) {
                    console.error("Error SSE:", e);
                }
            };

            eventSource.onerror = function() {
                eventSource.close();
                setTimeout(connectSSE, 2000);
            };
        }

        /* ===== Bloc de notas único (editor en plataforma) ===== */
        const NOTEPAD_STORE_KEY = 'l8_notepad_notes_v1';
        let notepadState = { notes: [], activeId: null, dirty: false, saveTimer: null, findIndex: 0 };

        function notepadUid() {
            if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
            return 'note_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        }

        function notepadNow() {
            return new Date().toISOString();
        }

        function notepadLoadStore() {
            try {
                const raw = localStorage.getItem(NOTEPAD_STORE_KEY);
                const data = raw ? JSON.parse(raw) : null;
                if (data && Array.isArray(data.notes)) {
                    notepadState.notes = data.notes;
                    notepadState.activeId = data.activeId || (data.notes[0] && data.notes[0].id) || null;
                    return;
                }
            } catch (e) {}
            const id = notepadUid();
            notepadState.notes = [{
                id: id,
                title: 'Nota 1',
                html: '',
                createdAt: notepadNow(),
                updatedAt: notepadNow()
            }];
            notepadState.activeId = id;
            notepadPersist(false);
        }

        function notepadPersist(flash) {
            try {
                localStorage.setItem(NOTEPAD_STORE_KEY, JSON.stringify({
                    version: 1,
                    activeId: notepadState.activeId,
                    notes: notepadState.notes,
                    updatedAt: notepadNow()
                }));
                notepadState.dirty = false;
                if (flash !== false) notepadSetStatusRight('guardado · ' + new Date().toLocaleTimeString('es-ES'));
            } catch (e) {
                notepadSetStatusRight('no se pudo guardar en este navegador');
            }
        }

        function notepadActive() {
            return notepadState.notes.find((n) => n.id === notepadState.activeId) || null;
        }

        function notepadSetStatusRight(text) {
            const el = document.getElementById('notepadStatusRight');
            if (el) el.textContent = text || '';
        }

        function notepadUpdateCounts() {
            const editor = document.getElementById('notepadEditor');
            const left = document.getElementById('notepadStatusLeft');
            if (!editor || !left) return;
            const text = (editor.innerText || '').replace(/\u00a0/g, ' ');
            const trimmed = text.trim();
            const words = trimmed ? trimmed.split(/\s+/).length : 0;
            const chars = text.length;
            left.textContent = words.toLocaleString('es-ES') + ' palabras · ' + chars.toLocaleString('es-ES') + ' caracteres';
        }

        function notepadRenderList() {
            const list = document.getElementById('notepadList');
            if (!list) return;
            list.innerHTML = '';
            notepadState.notes
                .slice()
                .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
                .forEach((note) => {
                    const li = document.createElement('li');
                    li.className = note.id === notepadState.activeId ? 'active' : '';
                    li.dataset.id = note.id;
                    const name = document.createElement('span');
                    name.className = 'note-name';
                    name.textContent = note.title || 'Sin título';
                    const meta = document.createElement('span');
                    meta.className = 'note-meta';
                    meta.textContent = note.updatedAt ? String(note.updatedAt).replace('T', ' ').slice(0, 16) : '';
                    li.appendChild(name);
                    li.appendChild(meta);
                    li.addEventListener('click', () => notepadSelect(note.id));
                    list.appendChild(li);
                });
        }

        function notepadFlushActiveFromDom() {
            const note = notepadActive();
            const editor = document.getElementById('notepadEditor');
            const title = document.getElementById('notepadTitle');
            if (!note || !editor) return;
            note.html = editor.innerHTML;
            note.title = (title && title.value.trim()) ? title.value.trim() : (note.title || 'Sin título');
            note.updatedAt = notepadNow();
        }

        function notepadSelect(id, force) {
            if (!force && id === notepadState.activeId) return;
            notepadFlushActiveFromDom();
            notepadPersist(false);
            const note = notepadState.notes.find((n) => n.id === id);
            if (!note) return;
            notepadState.activeId = id;
            const editor = document.getElementById('notepadEditor');
            const title = document.getElementById('notepadTitle');
            if (editor) editor.innerHTML = note.html || '';
            if (title) title.value = note.title || '';
            notepadRenderList();
            notepadUpdateCounts();
            notepadPersist(false);
            notepadSetStatusRight('nota activa');
            if (editor) {
                try { editor.focus(); } catch (e) {}
            }
        }

        function notepadCreate() {
            notepadFlushActiveFromDom();
            const id = notepadUid();
            const n = notepadState.notes.length + 1;
            notepadState.notes.unshift({
                id: id,
                title: 'Nota ' + n,
                html: '',
                createdAt: notepadNow(),
                updatedAt: notepadNow()
            });
            notepadState.activeId = id;
            const editor = document.getElementById('notepadEditor');
            const title = document.getElementById('notepadTitle');
            if (editor) editor.innerHTML = '';
            if (title) title.value = 'Nota ' + n;
            notepadRenderList();
            notepadUpdateCounts();
            notepadPersist(true);
            if (editor) try { editor.focus(); } catch (e) {}
        }

        function notepadDeleteActive() {
            if (notepadState.notes.length <= 1) {
                const note = notepadActive();
                const editor = document.getElementById('notepadEditor');
                const title = document.getElementById('notepadTitle');
                if (note) {
                    note.html = '';
                    note.title = 'Nota 1';
                    note.updatedAt = notepadNow();
                }
                if (editor) editor.innerHTML = '';
                if (title) title.value = 'Nota 1';
                notepadRenderList();
                notepadUpdateCounts();
                notepadPersist(true);
                notepadSetStatusRight('nota vaciada');
                return;
            }
            const id = notepadState.activeId;
            notepadState.notes = notepadState.notes.filter((n) => n.id !== id);
            notepadState.activeId = notepadState.notes[0].id;
            notepadSelect(notepadState.activeId, true);
            notepadPersist(true);
            notepadSetStatusRight('nota eliminada');
        }

        function notepadExec(cmd, value) {
            const editor = document.getElementById('notepadEditor');
            if (!editor) return;
            editor.focus();
            try {
                if (cmd === 'formatBlock') {
                    document.execCommand('formatBlock', false, value || 'p');
                } else {
                    document.execCommand(cmd, false, value || null);
                }
            } catch (e) {}
            notepadMarkDirty();
        }

        function notepadMarkDirty() {
            notepadState.dirty = true;
            notepadSetStatusRight('sin guardar…');
            notepadUpdateCounts();
            if (notepadState.saveTimer) clearTimeout(notepadState.saveTimer);
            notepadState.saveTimer = setTimeout(() => {
                notepadFlushActiveFromDom();
                notepadRenderList();
                notepadPersist(true);
            }, 650);
        }

        function notepadHtmlToMarkdown(html) {
            const tmp = document.createElement('div');
            tmp.innerHTML = html || '';
            const walk = (node) => {
                if (node.nodeType === 3) return node.nodeValue || '';
                if (node.nodeType !== 1) return '';
                const tag = node.tagName.toLowerCase();
                const inner = Array.from(node.childNodes).map(walk).join('');
                if (tag === 'br') return '\n';
                if (tag === 'strong' || tag === 'b') return '**' + inner + '**';
                if (tag === 'em' || tag === 'i') return '*' + inner + '*';
                if (tag === 'u') return inner;
                if (tag === 's' || tag === 'strike') return '~~' + inner + '~~';
                if (tag === 'h1') return '# ' + inner.trim() + '\n\n';
                if (tag === 'h2') return '## ' + inner.trim() + '\n\n';
                if (tag === 'h3') return '### ' + inner.trim() + '\n\n';
                if (tag === 'pre' || tag === 'code') return '```\n' + (node.innerText || inner).trim() + '\n```\n\n';
                if (tag === 'li') return '- ' + inner.trim() + '\n';
                if (tag === 'p' || tag === 'div') return inner.trim() + '\n\n';
                return inner;
            };
            return walk(tmp).replace(/\n{3,}/g, '\n\n').trim() + '\n';
        }

        function notepadSafeName(title, ext) {
            const base = String(title || 'nota')
                .replace(/[\\/:*?"<>|]+/g, '_')
                .replace(/\s+/g, '_')
                .slice(0, 60) || 'nota';
            return base + '.' + ext;
        }

        function notepadDownload(kind) {
            notepadFlushActiveFromDom();
            const note = notepadActive();
            if (!note) return;
            const title = note.title || 'nota';
            let body = '';
            let mime = 'text/plain;charset=utf-8';
            let ext = 'txt';
            if (kind === 'html') {
                ext = 'html';
                mime = 'text/html;charset=utf-8';
                body = '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>' +
                    String(title).replace(/</g, '&lt;') +
                    '</title><style>body{font-family:IBM Plex Mono,ui-monospace,monospace;max-width:820px;margin:32px auto;padding:0 16px;line-height:1.55;color:#111;background:#fff}pre{background:#f4f4f4;padding:12px;overflow:auto}</style></head><body><h1>' +
                    String(title).replace(/</g, '&lt;') + '</h1>' + (note.html || '') + '</body></html>';
            } else if (kind === 'md') {
                ext = 'md';
                mime = 'text/markdown;charset=utf-8';
                body = '# ' + title + '\n\n' + notepadHtmlToMarkdown(note.html || '');
            } else {
                const editor = document.getElementById('notepadEditor');
                body = (editor ? editor.innerText : '') || '';
            }
            const blob = new Blob([body], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = notepadSafeName(title, ext);
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1200);
            notepadSetStatusRight('descargado · .' + ext);
        }

        function notepadFindNext() {
            const input = document.getElementById('notepadFindInput');
            const editor = document.getElementById('notepadEditor');
            if (!input || !editor) return;
            const q = String(input.value || '');
            if (!q) return;
            const text = editor.innerText || '';
            const from = notepadState.findIndex || 0;
            let idx = text.toLowerCase().indexOf(q.toLowerCase(), from);
            if (idx < 0 && from > 0) idx = text.toLowerCase().indexOf(q.toLowerCase(), 0);
            if (idx < 0) {
                notepadSetStatusRight('sin coincidencias');
                return;
            }
            notepadState.findIndex = idx + q.length;
            try {
                const sel = window.getSelection();
                const range = document.createRange();
                // fallback highlight via window.find when available
                if (window.find) {
                    sel.removeAllRanges();
                    window.find(q, false, false, true, false, false, false);
                }
            } catch (e) {}
            notepadSetStatusRight('encontrado');
        }

        let notepadOpenBusy = false;

        async function toggleNotepadEditor(force) {
            const overlay = document.getElementById('notepadOverlay');
            const btn = document.getElementById('notepadOpenBtn');
            if (!overlay || notepadOpenBusy) return;
            const currentlyOpen = overlay.classList.contains('open');
            const open = typeof force === 'boolean' ? force : !currentlyOpen;

            if (open && !currentlyOpen) {
                notepadOpenBusy = true;
                if (btn) btn.disabled = true;
                try {
                    const charge = await consumeTokens('notepad', 'bloc de notas');
                    if (!charge || !charge.ok) {
                        const msg = (charge && charge.error)
                            ? charge.error
                            : 'Tokens insuficientes para abrir el bloc de notas (−1000).';
                        if (typeof executionContainer !== 'undefined' && executionContainer) {
                            executionContainer.innerHTML = '<span style="color:#c5221f; font-weight:600; font-family:\'IBM Plex Mono\', monospace;">' +
                                String(msg).replace(/&/g,'&amp;').replace(/</g,'&lt;') + '</span>';
                        }
                        if (typeof toggleTokensPanel === 'function') toggleTokensPanel(true);
                        return;
                    }
                } finally {
                    notepadOpenBusy = false;
                    if (btn) btn.disabled = false;
                }
            }

            overlay.classList.toggle('open', open);
            overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
            if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) {
                if (!notepadState.notes.length) notepadLoadStore();
                notepadSelect(notepadState.activeId || (notepadState.notes[0] && notepadState.notes[0].id), true);
                const editor = document.getElementById('notepadEditor');
                setTimeout(() => { try { editor && editor.focus(); } catch (e) {} }, 30);
            } else {
                notepadFlushActiveFromDom();
                notepadPersist(true);
            }
        }

        /* ===== Chat IA (inserta contenido puro en la selección) ===== */
        let notepadAiProviders = [];
        let notepadAiBusy = false;

        function notepadAiHeaders() {
            const headers = { 'Content-Type': 'application/json' };
            try {
                const tok = (typeof window.l8GetAuthToken === 'function') ? window.l8GetAuthToken() : '';
                if (tok) headers['Authorization'] = 'Bearer ' + tok;
            } catch (e) {}
            try {
                const guest = localStorage.getItem('l8_tokens_guest') || '';
                if (guest) headers['X-L8-Tokens-Guest'] = guest;
            } catch (e) {}
            return headers;
        }

        function notepadAiSelectedProvider() {
            const sel = document.getElementById('notepadAiModel');
            return sel ? sel.value : 'gpt-5.6';
        }

        function notepadAiSetConnStatus(text, kind) {
            const el = document.getElementById('notepadAiConnStatus');
            if (!el) return;
            el.textContent = text || '';
            el.classList.toggle('err', kind === 'err');
            el.classList.toggle('ok', kind === 'ok');
        }

        function notepadAiSetRunStatus(text, kind) {
            const el = document.getElementById('notepadAiRunStatus');
            if (!el) return;
            el.textContent = text || '';
            el.classList.toggle('err', kind === 'err');
            el.classList.toggle('ok', kind === 'ok');
        }

        function notepadAiUpdateConnUi() {
            const id = notepadAiSelectedProvider();
            const row = notepadAiProviders.find((p) => p.id === id);
            const loginBox = document.getElementById('notepadAiLoginBox');
            if (!row) {
                notepadAiSetConnStatus('modelo no disponible', 'err');
                return;
            }
            if (row.connected) {
                notepadAiSetConnStatus(row.label + ' · conectado' + (row.oauth_ready ? ' (OAuth)' : ''), 'ok');
                if (loginBox) loginBox.classList.remove('open');
            } else if (row.oauth_ready) {
                notepadAiSetConnStatus(row.label + ' · inicia sesión OAuth', 'err');
            } else if (row.configured) {
                notepadAiSetConnStatus(row.label + ' · usa token / API key', 'err');
                if (loginBox) loginBox.classList.add('open');
            } else {
                notepadAiSetConnStatus(row.label + ' · configura OAuth en el servidor o pega token', 'err');
                if (loginBox) loginBox.classList.add('open');
            }
        }

        async function notepadAiRefreshStatus() {
            try {
                const res = await fetch('/api/ai/status', { headers: notepadAiHeaders() });
                const data = await res.json();
                if (data && data.ok && Array.isArray(data.providers)) {
                    notepadAiProviders = data.providers;
                    notepadAiUpdateConnUi();
                    return data;
                }
            } catch (e) {}
            notepadAiSetConnStatus('no se pudo leer estado IA', 'err');
            return null;
        }

        function toggleNotepadAiPanel(force) {
            const panel = document.getElementById('notepadAiPanel');
            const btn = document.getElementById('notepadAiToggleBtn');
            if (!panel) return;
            const open = typeof force === 'boolean' ? force : !panel.classList.contains('open');
            panel.classList.toggle('open', open);
            if (btn) {
                btn.classList.toggle('active', open);
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            }
            if (open) notepadAiRefreshStatus();
        }

        function notepadGetSelectionContext() {
            const editor = document.getElementById('notepadEditor');
            if (!editor) return '';
            try {
                const sel = window.getSelection();
                if (sel && sel.rangeCount && editor.contains(sel.anchorNode)) {
                    const selected = String(sel.toString() || '');
                    if (selected.trim()) return selected;
                }
            } catch (e) {}
            const text = editor.innerText || '';
            return text.slice(0, 1200);
        }

        function notepadInsertAtSelection(content) {
            const editor = document.getElementById('notepadEditor');
            if (!editor) return false;
            editor.focus();
            const text = String(content || '');
            let ok = false;
            try {
                ok = document.execCommand('insertText', false, text);
            } catch (e) {
                ok = false;
            }
            if (!ok) {
                try {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount && editor.contains(sel.anchorNode)) {
                        const range = sel.getRangeAt(0);
                        range.deleteContents();
                        range.insertNode(document.createTextNode(text));
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
                        ok = true;
                    } else {
                        editor.appendChild(document.createTextNode(text));
                        ok = true;
                    }
                } catch (e) {
                    editor.textContent = (editor.textContent || '') + text;
                    ok = true;
                }
            }
            notepadMarkDirty();
            notepadUpdateCounts();
            return ok;
        }

        async function notepadAiStartOauth() {
            const provider = notepadAiSelectedProvider();
            notepadAiSetRunStatus('abriendo OAuth…');
            try {
                const res = await fetch('/api/ai/oauth/start', {
                    method: 'POST',
                    headers: notepadAiHeaders(),
                    body: JSON.stringify({ provider: provider })
                });
                const data = await res.json();
                if (data && data.ok && data.authorize_url) {
                    const w = window.open(data.authorize_url, 'l8-ai-oauth', 'width=560,height=720');
                    if (!w) {
                        notepadAiSetRunStatus('permite ventanas emergentes para OAuth', 'err');
                        const box = document.getElementById('notepadAiLoginBox');
                        if (box) box.classList.add('open');
                        return;
                    }
                    notepadAiSetRunStatus('completa el inicio de sesión en la ventana OAuth…');
                    return;
                }
                if (data && data.allow_token_login) {
                    const box = document.getElementById('notepadAiLoginBox');
                    if (box) box.classList.add('open');
                }
                notepadAiSetRunStatus((data && data.error) || 'OAuth no disponible', 'err');
            } catch (e) {
                notepadAiSetRunStatus(e.message || String(e), 'err');
            }
        }

        async function notepadAiSaveToken() {
            const provider = notepadAiSelectedProvider();
            const input = document.getElementById('notepadAiTokenInput');
            const token = input ? input.value.trim() : '';
            if (!token) {
                notepadAiSetRunStatus('pega un access token o API key', 'err');
                return;
            }
            try {
                const res = await fetch('/api/ai/login', {
                    method: 'POST',
                    headers: notepadAiHeaders(),
                    body: JSON.stringify({
                        provider: provider,
                        token: token,
                        kind: /^sk-|^AIza|^sk-ant-|^manus/i.test(token) ? 'api_key' : 'access_token'
                    })
                });
                const data = await res.json();
                if (data && data.ok) {
                    if (input) input.value = '';
                    await notepadAiRefreshStatus();
                    notepadAiSetRunStatus('sesión guardada en servidor', 'ok');
                } else {
                    notepadAiSetRunStatus((data && data.error) || 'no se pudo guardar', 'err');
                }
            } catch (e) {
                notepadAiSetRunStatus(e.message || String(e), 'err');
            }
        }

        async function notepadAiLogout() {
            const provider = notepadAiSelectedProvider();
            try {
                await fetch('/api/ai/logout', {
                    method: 'POST',
                    headers: notepadAiHeaders(),
                    body: JSON.stringify({ provider: provider })
                });
                await notepadAiRefreshStatus();
                notepadAiSetRunStatus('sesión cerrada', 'ok');
            } catch (e) {
                notepadAiSetRunStatus(e.message || String(e), 'err');
            }
        }

        async function notepadAiSend() {
            if (notepadAiBusy) return;
            const promptEl = document.getElementById('notepadAiPrompt');
            const prompt = promptEl ? promptEl.value.trim() : '';
            if (!prompt) {
                notepadAiSetRunStatus('escribe qué contenido quieres insertar', 'err');
                return;
            }
            const provider = notepadAiSelectedProvider();
            notepadAiBusy = true;
            const sendBtn = document.getElementById('notepadAiSendBtn');
            if (sendBtn) sendBtn.disabled = true;
            notepadAiSetRunStatus('generando con ' + provider + '…');
            try {
                const res = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: notepadAiHeaders(),
                    body: JSON.stringify({
                        provider: provider,
                        prompt: prompt,
                        context: notepadGetSelectionContext()
                    })
                });
                const data = await res.json();
                if (data && data.ok && typeof data.content === 'string') {
                    notepadInsertAtSelection(data.content);
                    if (promptEl) promptEl.value = '';
                    notepadAiSetRunStatus('insertado · ' + (data.label || provider), 'ok');
                } else {
                    if (data && data.code === 'not_authenticated') {
                        const box = document.getElementById('notepadAiLoginBox');
                        if (box) box.classList.add('open');
                    }
                    notepadAiSetRunStatus((data && data.error) || 'falló la generación', 'err');
                }
            } catch (e) {
                notepadAiSetRunStatus(e.message || String(e), 'err');
            } finally {
                notepadAiBusy = false;
                if (sendBtn) sendBtn.disabled = false;
            }
        }

        function initNotepadAiChat() {
            const model = document.getElementById('notepadAiModel');
            const oauthBtn = document.getElementById('notepadAiOauthBtn');
            const logoutBtn = document.getElementById('notepadAiLogoutBtn');
            const tokenBtn = document.getElementById('notepadAiTokenBtn');
            const sendBtn = document.getElementById('notepadAiSendBtn');
            const prompt = document.getElementById('notepadAiPrompt');
            if (model) model.addEventListener('change', () => notepadAiUpdateConnUi());
            if (oauthBtn) oauthBtn.addEventListener('click', () => notepadAiStartOauth());
            if (logoutBtn) logoutBtn.addEventListener('click', () => notepadAiLogout());
            if (tokenBtn) tokenBtn.addEventListener('click', () => notepadAiSaveToken());
            if (sendBtn) sendBtn.addEventListener('click', () => notepadAiSend());
            if (prompt) {
                prompt.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        notepadAiSend();
                    }
                });
            }
            window.addEventListener('message', (ev) => {
                const data = ev && ev.data;
                if (!data || data.type !== 'l8-ai-oauth') return;
                notepadAiRefreshStatus();
                notepadAiSetRunStatus(data.ok ? 'OAuth completado' : 'OAuth falló', data.ok ? 'ok' : 'err');
            });
        }

        let notepadOcgBusy = false;
        let notepadOcgLoadPromise = null;
        let notepadOcgCatalogReady = false;

        function notepadOcgSetStatus(text, kind) {
            const el = document.getElementById('notepadOcgStatus');
            if (!el) return;
            el.textContent = text || '';
            el.classList.toggle('err', kind === 'err');
            el.classList.toggle('ok', kind === 'ok');
        }

        function notepadOcgLoadScript(src) {
            return new Promise((resolve, reject) => {
                const existing = document.querySelector('script[data-ocg-src="' + src + '"]');
                if (existing) {
                    if (existing.getAttribute('data-loaded') === '1') {
                        resolve();
                        return;
                    }
                    existing.addEventListener('load', () => resolve(), { once: true });
                    existing.addEventListener('error', () => reject(new Error('No se pudo cargar ' + src)), { once: true });
                    return;
                }
                const s = document.createElement('script');
                s.src = src;
                s.async = false;
                s.setAttribute('data-ocg-src', src);
                s.onload = () => {
                    s.setAttribute('data-loaded', '1');
                    resolve();
                };
                s.onerror = () => reject(new Error('No se pudo cargar ' + src));
                document.head.appendChild(s);
            });
        }

        function notepadOcgEnsureLoaded() {
            if (window.OCG_GEN && window.OCG_CATALOG) {
                return Promise.resolve();
            }
            if (notepadOcgLoadPromise) return notepadOcgLoadPromise;
            notepadOcgLoadPromise = notepadOcgLoadScript('/opencryptg/data/catalog.js?v=ocg-10100-1')
                .then(() => notepadOcgLoadScript('/opencryptg/data/generators.js?v=ocg-10100-1'))
                .then(() => {
                    if (!window.OCG_GEN || !window.OCG_CATALOG) {
                        throw new Error('Inventario OpenCriptG no disponible');
                    }
                })
                .catch((err) => {
                    notepadOcgLoadPromise = null;
                    throw err;
                });
            return notepadOcgLoadPromise;
        }

        function notepadOcgTypeLabel(type) {
            if (!type) return '';
            const variant = type.hashcodVariant ? (type.hashcodVariant + ' · ') : '';
            return variant + (type.originalLabel || type.label || type.id);
        }

        function notepadOcgPopulateCategories() {
            const catSel = document.getElementById('notepadOcgCategory');
            if (!catSel || !window.OCG_CATALOG) return;
            const prev = catSel.value;
            catSel.innerHTML = '';
            const all = document.createElement('option');
            all.value = '__all__';
            all.textContent = 'Todas las categorías (10.100)';
            catSel.appendChild(all);
            (window.OCG_CATALOG || []).forEach((cat) => {
                const opt = document.createElement('option');
                opt.value = cat.id;
                const n = (cat.types || []).length;
                opt.textContent = (cat.label || cat.id) + ' (' + n + ')';
                catSel.appendChild(opt);
            });
            if (prev && [...catSel.options].some((o) => o.value === prev)) {
                catSel.value = prev;
            }
        }

        function notepadOcgFilteredTypes() {
            const catSel = document.getElementById('notepadOcgCategory');
            const filterEl = document.getElementById('notepadOcgFilter');
            const catId = catSel ? catSel.value : '__all__';
            const q = (filterEl ? filterEl.value : '').trim().toLowerCase();
            const out = [];
            (window.OCG_CATALOG || []).forEach((cat) => {
                if (catId !== '__all__' && cat.id !== catId) return;
                (cat.types || []).forEach((type) => {
                    const hay = [
                        type.id,
                        type.label,
                        type.originalLabel,
                        type.hashcodVariant,
                        type.badge,
                        type.engine,
                        cat.label
                    ].join(' ').toLowerCase();
                    if (q && hay.indexOf(q) === -1) return;
                    out.push({ cat: cat, type: type });
                });
            });
            return out;
        }

        function notepadOcgPopulateTypes() {
            const typeSel = document.getElementById('notepadOcgType');
            if (!typeSel) return;
            const prev = typeSel.value;
            const rows = notepadOcgFilteredTypes();
            const maxOpts = 800;
            typeSel.innerHTML = '';
            const shown = rows.slice(0, maxOpts);
            shown.forEach((row) => {
                const opt = document.createElement('option');
                opt.value = row.type.id;
                opt.textContent = notepadOcgTypeLabel(row.type);
                opt.title = (row.cat.label || '') + ' · ' + (row.type.engine || '');
                typeSel.appendChild(opt);
            });
            if (!shown.length) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'Sin coincidencias';
                typeSel.appendChild(opt);
            } else if (prev && [...typeSel.options].some((o) => o.value === prev)) {
                typeSel.value = prev;
            }
            const extra = rows.length > maxOpts ? (' · mostrando ' + maxOpts + ' de ' + rows.length) : '';
            notepadOcgSetStatus('inventario OpenCriptG · ' + rows.length + ' tipos filtrados' + extra + ' · códigos únicos');
        }

        async function toggleNotepadOcgPanel(force) {
            const panel = document.getElementById('notepadOcgPanel');
            const btn = document.getElementById('notepadOcgToggleBtn');
            if (!panel) return;
            const open = typeof force === 'boolean' ? force : !panel.classList.contains('open');
            panel.classList.toggle('open', open);
            if (btn) {
                btn.classList.toggle('active', open);
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            }
            if (open) {
                toggleNotepadAiPanel(false);
                notepadOcgSetStatus('cargando inventario OpenCriptG (10.100)…');
                try {
                    await notepadOcgEnsureLoaded();
                    if (!notepadOcgCatalogReady) {
                        notepadOcgPopulateCategories();
                        notepadOcgCatalogReady = true;
                    }
                    notepadOcgPopulateTypes();
                    try {
                        const res = await fetch('/api/opencrypt/status');
                        const data = await res.json();
                        if (data && data.ok) {
                            notepadOcgSetStatus(
                                'inventario 10.100 tipos · ledger únicos: ' + (data.ledger_count || 0),
                                'ok'
                            );
                        }
                    } catch (e) {}
                } catch (e) {
                    notepadOcgSetStatus(e.message || String(e), 'err');
                }
            }
        }

        async function notepadOcgClaim(codes) {
            const res = await fetch('/api/opencrypt/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codes: codes })
            });
            const data = await res.json();
            if (!data || !data.ok) {
                throw new Error((data && data.error) || 'No se pudo registrar unicidad');
            }
            return data;
        }

        async function notepadOcgGenerateUnique(typeId, label, qty) {
            const accepted = [];
            const maxAttempts = Math.max(20, qty * 8);
            let attempts = 0;
            while (accepted.length < qty && attempts < maxAttempts) {
                const batch = [];
                const need = qty - accepted.length;
                for (let i = 0; i < need; i++) {
                    attempts++;
                    const raw = await window.OCG_GEN.generate(typeId);
                    const code = String(raw == null ? '' : raw);
                    if (!code) continue;
                    batch.push({ type_id: typeId, label: label, code: code });
                }
                if (!batch.length) continue;
                const claim = await notepadOcgClaim(batch);
                (claim.accepted || []).forEach((row) => accepted.push(row));
            }
            if (accepted.length < qty) {
                throw new Error('No se pudieron obtener ' + qty + ' códigos únicos (colisiones o generador)');
            }
            return accepted;
        }

        async function notepadOcgGenerateAndInsert() {
            if (notepadOcgBusy) return;
            const typeSel = document.getElementById('notepadOcgType');
            const qtyEl = document.getElementById('notepadOcgQty');
            const typeId = typeSel ? typeSel.value : '';
            let qty = qtyEl ? parseInt(qtyEl.value, 10) : 1;
            if (!typeId) {
                notepadOcgSetStatus('elige un tipo del inventario', 'err');
                return;
            }
            if (!Number.isFinite(qty) || qty < 1) qty = 1;
            if (qty > 25) qty = 25;
            if (qtyEl) qtyEl.value = String(qty);

            notepadOcgBusy = true;
            const btn = document.getElementById('notepadOcgGenerateBtn');
            if (btn) btn.disabled = true;
            notepadOcgSetStatus('generando códigos únicos…');
            try {
                await notepadOcgEnsureLoaded();
                let label = typeId;
                const opt = typeSel && typeSel.selectedOptions && typeSel.selectedOptions[0];
                if (opt) label = opt.textContent || typeId;
                const rows = await notepadOcgGenerateUnique(typeId, label, qty);
                const block = rows.map((row, idx) => {
                    const head = '[' + (idx + 1) + '/' + rows.length + '] ' + (row.label || row.type_id);
                    return head + '\n' + row.code;
                }).join('\n\n');
                notepadInsertAtSelection(block + (block.endsWith('\n') ? '' : '\n'));
                notepadOcgSetStatus(
                    'insertados ' + rows.length + ' código(s) únicos · ledger ' + (rows[0] ? '' : '') + 'ok',
                    'ok'
                );
                try {
                    const st = await fetch('/api/opencrypt/status').then((r) => r.json());
                    if (st && st.ok) {
                        notepadOcgSetStatus(
                            'insertados ' + rows.length + ' · ledger únicos: ' + (st.ledger_count || 0),
                            'ok'
                        );
                    }
                } catch (e) {}
            } catch (e) {
                notepadOcgSetStatus(e.message || String(e), 'err');
            } finally {
                notepadOcgBusy = false;
                if (btn) btn.disabled = false;
            }
        }

        function initNotepadOcgTool() {
            const cat = document.getElementById('notepadOcgCategory');
            const filter = document.getElementById('notepadOcgFilter');
            const genBtn = document.getElementById('notepadOcgGenerateBtn');
            if (cat) cat.addEventListener('change', () => notepadOcgPopulateTypes());
            if (filter) {
                let t = null;
                filter.addEventListener('input', () => {
                    clearTimeout(t);
                    t = setTimeout(() => notepadOcgPopulateTypes(), 120);
                });
            }
            if (genBtn) genBtn.addEventListener('click', () => notepadOcgGenerateAndInsert());
        }

        function initNotepadEditor() {
            if (window.__l8NotepadReady) return;
            const overlay = document.getElementById('notepadOverlay');
            const editor = document.getElementById('notepadEditor');
            const title = document.getElementById('notepadTitle');
            const closeBtn = document.getElementById('notepadCloseBtn');
            if (!overlay || !editor) return;
            window.__l8NotepadReady = true;
            notepadLoadStore();
            initNotepadAiChat();
            initNotepadOcgTool();

            if (closeBtn) closeBtn.addEventListener('click', () => toggleNotepadEditor(false));
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) toggleNotepadEditor(false);
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && overlay.classList.contains('open')) {
                    toggleNotepadEditor(false);
                }
            });

            editor.addEventListener('input', () => notepadMarkDirty());
            if (title) {
                title.addEventListener('input', () => {
                    const note = notepadActive();
                    if (note) note.title = title.value;
                    notepadMarkDirty();
                    notepadRenderList();
                });
            }

            overlay.querySelectorAll('[data-cmd]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    notepadExec(btn.getAttribute('data-cmd'), btn.getAttribute('data-value'));
                });
            });

            overlay.querySelectorAll('[data-action]').forEach((btn) => {
                btn.addEventListener('click', async () => {
                    const action = btn.getAttribute('data-action');
                    if (action === 'new') notepadCreate();
                    else if (action === 'delete') notepadDeleteActive();
                    else if (action === 'ai-toggle') {
                        toggleNotepadOcgPanel(false);
                        toggleNotepadAiPanel();
                    }
                    else if (action === 'ocg-toggle') toggleNotepadOcgPanel();
                    else if (action === 'save') {
                        notepadFlushActiveFromDom();
                        notepadRenderList();
                        notepadPersist(true);
                    } else if (action === 'copy') {
                        try {
                            await navigator.clipboard.writeText(editor.innerText || '');
                            notepadSetStatusRight('copiado');
                        } catch (e) {
                            notepadSetStatusRight('no se pudo copiar');
                        }
                    } else if (action === 'download-md') notepadDownload('md');
                    else if (action === 'download-html') notepadDownload('html');
                    else if (action === 'download-txt') notepadDownload('txt');
                    else if (action === 'find') {
                        const bar = document.getElementById('notepadFindBar');
                        if (bar) {
                            bar.classList.add('open');
                            const input = document.getElementById('notepadFindInput');
                            if (input) input.focus();
                        }
                    } else if (action === 'find-next') notepadFindNext();
                    else if (action === 'find-close') {
                        const bar = document.getElementById('notepadFindBar');
                        if (bar) bar.classList.remove('open');
                    }
                });
            });

            const findInput = document.getElementById('notepadFindInput');
            if (findInput) {
                findInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        notepadFindNext();
                    }
                });
            }
        }

        document.addEventListener('DOMContentLoaded', initNotepadEditor);



        /* ===== Toolkit tool: Ingeniería (agency-agents/engineering) ===== */
        const TOOLKIT_ENGINEERING_BASE = '/toolkit/agency-agents/engineering';
        let toolkitEngineeringIndex = null;
        let toolkitEngineeringMarkedReady = null;
        let toolkitEngineeringActiveId = '';

        function toolkitEngineeringIconHtml() {
            return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 50 50\" aria-hidden=\"true\"><path d=\"M 13.132812 2.984375 L 12.5 3.3496094 L 8.5 5.6582031 L 7.8671875 6.0234375 L 8.0214844 6.7363281 L 16.021484 43.685547 L 16.3125 45.025391 L 17.498047 44.341797 L 21.498047 42.03125 L 21.677734 41.927734 L 21.802734 41.761719 L 23.894531 38.943359 L 28.132812 46.285156 L 28.632812 47.150391 L 29.498047 46.650391 L 37.498047 42.03125 L 38.365234 41.53125 L 37.865234 40.666016 L 33.626953 33.324219 L 37.113281 32.921875 L 37.318359 32.896484 L 37.498047 32.792969 L 41.498047 30.484375 L 42.685547 29.798828 L 41.669922 28.878906 L 13.669922 3.4746094 L 13.132812 2.984375 z M 12.966797 4.5234375 L 40.578125 29.574219 L 37.033203 31.619141 L 9.421875 6.5703125 L 12.966797 4.5234375 z M 9.4101562 7.234375 L 36.423828 31.742188 L 31.970703 32.257812 A 0.250025 0.250025 0 0 0 31.945312 32.261719 L 26.970703 32.833984 A 0.250025 0.250025 0 0 0 26.783203 33.207031 L 32.658203 43.382812 L 29.091797 45.443359 L 24.216797 36.998047 L 24.203125 36.976562 L 23.216797 35.267578 A 0.250025 0.250025 0 0 0 22.986328 35.142578 A 0.250025 0.250025 0 0 0 22.798828 35.242188 L 17.128906 42.882812 L 9.4101562 7.234375 z M 31.865234 32.773438 L 36.658203 41.074219 L 33.091797 43.132812 L 27.408203 33.289062 L 31.865234 32.773438 z M 22.974609 35.847656 L 23.701172 37.105469 L 20.830078 40.974609 L 17.919922 42.654297 L 22.974609 35.847656 z\"></path></svg>";
        }

        function toolkitEnsureMarked() {
            if (window.marked && typeof window.marked.parse === 'function') {
                return Promise.resolve(window.marked);
            }
            if (toolkitEngineeringMarkedReady) return toolkitEngineeringMarkedReady;
            toolkitEngineeringMarkedReady = new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = '/toolkit/vendor/marked.min.js?v=15.0.7';
                s.async = true;
                s.onload = () => {
                    if (window.marked && typeof window.marked.parse === 'function') resolve(window.marked);
                    else reject(new Error('marked no disponible'));
                };
                s.onerror = () => reject(new Error('No se pudo cargar el render markdown'));
                document.head.appendChild(s);
            }).catch((err) => {
                toolkitEngineeringMarkedReady = null;
                throw err;
            });
            return toolkitEngineeringMarkedReady;
        }

        function toolkitStripFrontmatter(md) {
            const text = String(md || '');
            if (!text.startsWith('---')) return { meta: {}, body: text };
            const end = text.indexOf('\n---', 3);
            if (end === -1) return { meta: {}, body: text };
            const fm = text.slice(3, end);
            const body = text.slice(end + 4).replace(/^\s+/, '');
            const meta = {};
            fm.split(/\r?\n/).forEach((line) => {
                const i = line.indexOf(':');
                if (i === -1) return;
                const k = line.slice(0, i).trim();
                const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
                if (k) meta[k] = v;
            });
            return { meta: meta, body: body };
        }

        async function toolkitLoadEngineeringIndex() {
            if (toolkitEngineeringIndex) return toolkitEngineeringIndex;
            const res = await fetch(TOOLKIT_ENGINEERING_BASE + '/index.json');
            if (!res.ok) throw new Error('No se pudo cargar el índice de ingeniería');
            toolkitEngineeringIndex = await res.json();
            return toolkitEngineeringIndex;
        }

        function toolkitRenderEngineeringList(filter) {
            const list = document.getElementById('toolkitEngineeringList');
            if (!list || !toolkitEngineeringIndex) return;
            const q = String(filter || '').trim().toLowerCase();
            const agents = Array.isArray(toolkitEngineeringIndex.agents) ? toolkitEngineeringIndex.agents : [];
            const filtered = agents.filter((a) => {
                if (!q) return true;
                const hay = [a.title, a.description, a.file, a.id, a.vibe].join(' ').toLowerCase();
                return hay.indexOf(q) !== -1;
            });

            let html = '<input type="search" class="toolkit-agent-filter" id="toolkitEngineeringFilter" placeholder="Filtrar agentes…" autocomplete="off" value="' +
                String(filter || '').replace(/"/g, '&quot;') + '">';
            if (!filtered.length) {
                html += '<div class="toolkit-empty">Sin coincidencias.</div>';
            } else {
                filtered.forEach((a) => {
                    const active = a.id === toolkitEngineeringActiveId ? ' active' : '';
                    html += '<button type="button" class="toolkit-agent-item' + active + '" data-agent="' +
                        String(a.id).replace(/"/g, '&quot;') + '">' +
                        (a.emoji ? '<span class="emoji">' + String(a.emoji) + '</span>' : '') +
                        '<strong>' + String(a.title || a.id).replace(/</g, '&lt;') + '</strong>' +
                        (a.description ? '<span class="desc">' + String(a.description).replace(/</g, '&lt;') + '</span>' : '') +
                        '</button>';
                });
            }
            list.innerHTML = html;

            const filterEl = document.getElementById('toolkitEngineeringFilter');
            if (filterEl) {
                filterEl.addEventListener('input', () => toolkitRenderEngineeringList(filterEl.value));
                try {
                    filterEl.focus();
                    const len = filterEl.value.length;
                    filterEl.setSelectionRange(len, len);
                } catch (e) {}
            }
            list.querySelectorAll('[data-agent]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    toolkitOpenEngineeringAgent(btn.getAttribute('data-agent'));
                });
            });
        }

        async function toolkitOpenEngineeringAgent(agentId) {
            const view = document.getElementById('toolkitEngineeringView');
            const sub = document.getElementById('toolkitEngineeringSub');
            if (!view) return;
            const agents = (toolkitEngineeringIndex && toolkitEngineeringIndex.agents) || [];
            const agent = agents.find((a) => a.id === agentId) || agents.find((a) => a.file === agentId);
            if (!agent) {
                view.innerHTML = '<div class="md-status err">Agente no encontrado.</div>';
                return;
            }
            toolkitEngineeringActiveId = agent.id;
            toolkitRenderEngineeringList((document.getElementById('toolkitEngineeringFilter') || {}).value || '');
            view.innerHTML = '<div class="md-status">Cargando markdown…</div>';
            if (sub) {
                sub.textContent = 'Engineering · ' + (agent.title || agent.id) + ' · vista markdown';
            }
            try {
                const [mdRes, markedLib] = await Promise.all([
                    fetch(TOOLKIT_ENGINEERING_BASE + '/' + encodeURIComponent(agent.file)),
                    toolkitEnsureMarked()
                ]);
                if (!mdRes.ok) throw new Error('No se pudo leer ' + agent.file);
                const raw = await mdRes.text();
                const parsed = toolkitStripFrontmatter(raw);
                const metaBits = [];
                if (parsed.meta.name || agent.title) metaBits.push('<span><strong>Agente</strong> · ' + String(parsed.meta.name || agent.title).replace(/</g, '&lt;') + '</span>');
                if (parsed.meta.vibe || agent.vibe) metaBits.push('<span><strong>Vibe</strong> · ' + String(parsed.meta.vibe || agent.vibe).replace(/</g, '&lt;') + '</span>');
                metaBits.push('<span><strong>Fuente</strong> · agency-agents/engineering</span>');
                const html = markedLib.parse(parsed.body || raw, { async: false });
                view.innerHTML = '<div class="toolkit-md-meta">' + metaBits.join('') + '</div><article class="toolkit-md">' + html + '</article>';
                toolkitLogUse('platform', 'engineering', 'Ingeniería · ' + (agent.title || agent.id));
                toolkitCurateFile('platform', {
                    name: agent.file,
                    kind: 'md',
                    meta: { agentId: agent.id, title: agent.title }
                });
            } catch (e) {
                view.innerHTML = '<div class="md-status err">' + String(e.message || e).replace(/</g, '&lt;') + '</div>';
            }
        }

        async function openToolkitEngineering() {
            const overlay = document.getElementById('toolkitEngineeringOverlay');
            if (!overlay) return;
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
            const view = document.getElementById('toolkitEngineeringView');
            if (view) view.innerHTML = '<div class="md-status">Cargando foro de ingeniería…</div>';
            try {
                await toolkitEnsureMarked();
                const index = await toolkitLoadEngineeringIndex();
                const sub = document.getElementById('toolkitEngineeringSub');
                if (sub) {
                    sub.textContent = 'Agency Agents · Engineering · ' + (index.count || 0) + ' agentes · vista markdown';
                }
                toolkitRenderEngineeringList('');
                if (!toolkitEngineeringActiveId && index.agents && index.agents[0]) {
                    await toolkitOpenEngineeringAgent(index.agents[0].id);
                } else if (toolkitEngineeringActiveId) {
                    await toolkitOpenEngineeringAgent(toolkitEngineeringActiveId);
                } else if (view) {
                    view.innerHTML = '<div class="md-status">Elige un agente del foro para verlo en markdown.</div>';
                }
                toolkitLogUse('platform', 'engineering', 'Abrir Ingeniería');
            } catch (e) {
                if (view) view.innerHTML = '<div class="md-status err">' + String(e.message || e).replace(/</g, '&lt;') + '</div>';
            }
        }

        function closeToolkitEngineering() {
            const overlay = document.getElementById('toolkitEngineeringOverlay');
            if (!overlay) return;
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
        }

        function initToolkitEngineering() {
            const overlay = document.getElementById('toolkitEngineeringOverlay');
            const closeBtn = document.getElementById('toolkitEngineeringCloseBtn');
            if (closeBtn) closeBtn.addEventListener('click', () => closeToolkitEngineering());
            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) closeToolkitEngineering();
                });
            }
            document.addEventListener('keydown', (e) => {
                if (e.key !== 'Escape') return;
                if (overlay && overlay.classList.contains('open')) {
                    closeToolkitEngineering();
                    e.stopPropagation();
                }
            }, true);
        }

        /* ===== Toolkit (fichas) ===== */
        const TOOLKIT_STORE_KEY = 'l8_toolkit_v1';
        const TOOLKIT_SLOT_COUNT = 6;

        /** Plantillas de fichas. tools[] se irá llenando cuando indiques las herramientas. */
        const TOOLKIT_FICHAS_DEFAULT = [
            {
                id: 'platform',
                title: 'l8 codespace',
                icon: '/favicon.svg?v=3',
                tools: [
                    {
                        id: 'engineering',
                        title: 'Ingeniería',
                        iconHtml: toolkitEngineeringIconHtml(),
                        onClick: function () { openToolkitEngineering(); }
                    }
                ]
            },
            {
                id: 'workspace',
                title: 'workspace',
                icon: '/favicon.svg?v=3',
                tools: []
            }
        ];

        let toolkitFichas = TOOLKIT_FICHAS_DEFAULT.map((f) => Object.assign({}, f, { tools: (f.tools || []).slice() }));
        let toolkitStore = { history: {}, files: {}, removedIds: [] };

        function toolkitNow() {
            return new Date().toISOString();
        }

        function toolkitFormatWhen(iso) {
            if (!iso) return '—';
            try {
                const d = new Date(iso);
                if (Number.isNaN(d.getTime())) return String(iso);
                const pad = (n) => String(n).padStart(2, '0');
                return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
                    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
            } catch (e) {
                return String(iso);
            }
        }

        function toolkitRebuildFichas() {
            const removed = new Set(
                Array.isArray(toolkitStore.removedIds)
                    ? toolkitStore.removedIds.map(String)
                    : []
            );
            toolkitFichas = TOOLKIT_FICHAS_DEFAULT
                .filter((f) => !removed.has(String(f.id)))
                .map((f) => Object.assign({}, f, { tools: (f.tools || []).slice() }));
            if (window.l8Toolkit) window.l8Toolkit.fichas = toolkitFichas;
        }

        function toolkitLoadStore() {
            try {
                const raw = localStorage.getItem(TOOLKIT_STORE_KEY);
                if (!raw) {
                    toolkitStore = { history: {}, files: {}, removedIds: [] };
                    toolkitRebuildFichas();
                    return;
                }
                const data = JSON.parse(raw);
                toolkitStore = {
                    history: (data && typeof data.history === 'object' && data.history) ? data.history : {},
                    files: (data && typeof data.files === 'object' && data.files) ? data.files : {},
                    removedIds: Array.isArray(data && data.removedIds) ? data.removedIds.map(String) : []
                };
            } catch (e) {
                toolkitStore = { history: {}, files: {}, removedIds: [] };
            }
            toolkitRebuildFichas();
        }

        function toolkitPersist() {
            try {
                localStorage.setItem(TOOLKIT_STORE_KEY, JSON.stringify(toolkitStore));
            } catch (e) {}
        }

        function toolkitFileIconSvg(kind) {
            const k = String(kind || '').toLowerCase();
            if (k === 'md' || k === 'markdown') {
                return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3V5zm2 2v10h14V7H5zm2 2h2.2l1.3 3.2L12 9h2v6h-1.6V11l-1.5 3.4h-.8L8.6 11V15H7V9zm8 0h1.5l2 3.2V9H20v6h-1.5l-2-3.2V15H15V9z"/></svg>';
            }
            if (k === 'html' || k === 'htm') {
                return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/></svg>';
            }
            if (k === 'zip' || k === 'pack') {
                return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2h5l5 5v15H8V2zm2 2v2h2V4h-2zm0 4v2h2V8h-2zm0 4v2h2v-2h-2zm3-8.5V8h4.5L13 3.5z"/></svg>';
            }
            if (k === 'json' || k === 'js' || k === 'ts' || k === 'code') {
                return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 7L4 12l4.5 5 1.4-1.3L6.7 12l3.2-3.7L8.5 7zm7 0l-1.4 1.3L17.3 12l-3.2 3.7 1.4 1.3L20 12l-4.5-5z"/></svg>';
            }
            return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h8l4 4v16H6V2zm2 2v16h10V8h-4V4H8zm6 0v2h2l-2-2z"/></svg>';
        }

        function toolkitTrashSvg() {
            return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M 10 2 L 9 3 L 4 3 L 4 5 L 7 5 L 17 5 L 20 5 L 20 3 L 15 3 L 14 2 L 10 2 z M 5 7 L 5 20 C 5 21.1 5.9 22 7 22 L 17 22 C 18.1 22 19 21.1 19 20 L 19 7 L 5 7 z"></path></svg>';
        }

        function toolkitLogUse(fichaId, toolId, label) {
            const fid = String(fichaId || (toolkitFichas[0] && toolkitFichas[0].id) || 'platform');
            if (!toolkitStore.history[fid]) toolkitStore.history[fid] = [];
            toolkitStore.history[fid].unshift({
                id: 'h_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                toolId: String(toolId || 'toolkit'),
                label: String(label || toolId || 'Uso'),
                at: toolkitNow()
            });
            if (toolkitStore.history[fid].length > 80) {
                toolkitStore.history[fid] = toolkitStore.history[fid].slice(0, 80);
            }
            toolkitPersist();
            const board = document.getElementById('toolkitBoard');
            if (board && document.getElementById('toolkitOverlay') && document.getElementById('toolkitOverlay').classList.contains('open')) {
                toolkitRenderBoard();
            }
        }

        function toolkitCurateFile(fichaId, file) {
            const fid = String(fichaId || (toolkitFichas[0] && toolkitFichas[0].id) || 'platform');
            if (!file || !file.name) return false;
            if (!toolkitStore.files[fid]) toolkitStore.files[fid] = [];
            toolkitStore.files[fid].unshift({
                id: 'f_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                name: String(file.name).slice(0, 120),
                kind: String(file.kind || file.ext || 'txt').slice(0, 24),
                at: toolkitNow(),
                meta: file.meta || null
            });
            if (toolkitStore.files[fid].length > 60) {
                toolkitStore.files[fid] = toolkitStore.files[fid].slice(0, 60);
            }
            toolkitPersist();
            if (document.getElementById('toolkitOverlay') && document.getElementById('toolkitOverlay').classList.contains('open')) {
                toolkitRenderBoard();
            }
            return true;
        }

        function toolkitRemoveFicha(fichaId) {
            const fid = String(fichaId || '');
            if (!fid) return false;
            const exists = toolkitFichas.some((f) => f.id === fid);
            if (!exists) return false;
            if (!Array.isArray(toolkitStore.removedIds)) toolkitStore.removedIds = [];
            if (toolkitStore.removedIds.indexOf(fid) === -1) toolkitStore.removedIds.push(fid);
            if (toolkitStore.history && toolkitStore.history[fid]) delete toolkitStore.history[fid];
            if (toolkitStore.files && toolkitStore.files[fid]) delete toolkitStore.files[fid];
            toolkitPersist();
            toolkitRebuildFichas();
            toolkitRenderBoard();
            return true;
        }

        function toolkitRenderFicha(ficha) {
            const history = toolkitStore.history[ficha.id] || [];
            const files = toolkitStore.files[ficha.id] || [];
            const tools = Array.isArray(ficha.tools) ? ficha.tools : [];

            let historyHtml;
            if (!history.length) {
                historyHtml = '<div class="toolkit-empty">Sin usos aún. El historial aparecerá aquí con fecha al usar las herramientas de esta ficha.</div>';
            } else {
                historyHtml = '<ul class="toolkit-history-list">' + history.slice(0, 24).map((row) => {
                    return '<li><strong>' + String(row.label || row.toolId || 'Uso').replace(/</g, '&lt;') +
                        '</strong><span class="when">' + toolkitFormatWhen(row.at) + '</span></li>';
                }).join('') + '</ul>';
            }

            let filesHtml;
            if (!files.length) {
                filesHtml = '<div class="toolkit-empty">Sin archivos curados. Aquí se listarán con el icono del tipo de archivo.</div>';
            } else {
                filesHtml = '<div class="toolkit-files-list">' + files.slice(0, 24).map((file) => {
                    return '<div class="toolkit-file" title="' + String(file.name).replace(/"/g, '&quot;') + '">' +
                        '<span class="file-ico">' + toolkitFileIconSvg(file.kind) + '</span>' +
                        '<span class="file-name">' + String(file.name).replace(/</g, '&lt;') + '</span></div>';
                }).join('') + '</div>';
            }

            let toolsHtml = '';
            tools.forEach((tool) => {
                const title = String(tool.title || tool.id || 'Herramienta').replace(/"/g, '&quot;');
                const icon = tool.iconHtml
                    ? tool.iconHtml
                    : (tool.icon
                        ? '<img src="' + String(tool.icon).replace(/"/g, '&quot;') + '" alt="">'
                        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"/></svg>');
                toolsHtml += '<button type="button" class="toolkit-tool-btn" data-ficha="' + ficha.id +
                    '" data-tool="' + String(tool.id || '').replace(/"/g, '&quot;') +
                    '" title="' + title + '" aria-label="' + title + '">' + icon + '</button>';
            });
            const emptySlots = Math.max(TOOLKIT_SLOT_COUNT - tools.length, tools.length ? 1 : TOOLKIT_SLOT_COUNT);
            for (let i = 0; i < emptySlots; i++) {
                toolsHtml += '<span class="toolkit-tool-slot" title="Herramienta pendiente" aria-hidden="true"></span>';
            }

            const deleteBtn =
                '<button type="button" class="toolkit-ficha-delete" data-ficha-delete="' + ficha.id +
                '" title="Eliminar tablilla" aria-label="Eliminar tablilla ' +
                String(ficha.title || ficha.id).replace(/"/g, '&quot;') + '">' +
                toolkitTrashSvg() + '</button>';

            return (
                '<article class="toolkit-ficha" data-ficha-id="' + ficha.id + '" aria-label="Ficha ' +
                String(ficha.title).replace(/"/g, '&quot;') + '">' +
                deleteBtn +
                '<div class="toolkit-ficha-icon">' +
                '<img src="' + String(ficha.icon || '/favicon.svg?v=3').replace(/"/g, '&quot;') +
                '" alt="" class="platform">' +
                '<div class="ficha-mark">' + String(ficha.title || ficha.id).replace(/</g, '&lt;') + '</div>' +
                '</div>' +
                '<section class="toolkit-ficha-history">' +
                '<div class="toolkit-pane-head">Historial de uso</div>' +
                '<div class="toolkit-pane-body">' + historyHtml + '</div></section>' +
                '<section class="toolkit-ficha-files">' +
                '<div class="toolkit-pane-head">Archivos curados</div>' +
                '<div class="toolkit-pane-body">' + filesHtml + '</div></section>' +
                '<section class="toolkit-ficha-tools" aria-label="Herramientas">' + toolsHtml + '</section>' +
                '</article>'
            );
        }

        function toolkitRenderBoard() {
            const board = document.getElementById('toolkitBoard');
            if (!board) return;
            if (!toolkitFichas.length) {
                board.innerHTML = '<div class="toolkit-board-empty">No hay tablillas. Las nuevas fichas aparecerán aquí cuando las agregues.</div>';
                return;
            }
            board.innerHTML = toolkitFichas.map(toolkitRenderFicha).join('');
            board.querySelectorAll('.toolkit-tool-btn').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const fichaId = btn.getAttribute('data-ficha');
                    const toolId = btn.getAttribute('data-tool');
                    const ficha = toolkitFichas.find((f) => f.id === fichaId);
                    const tool = ficha && (ficha.tools || []).find((t) => t.id === toolId);
                    toolkitLogUse(fichaId, toolId, (tool && (tool.title || tool.id)) || toolId);
                    if (tool && typeof tool.onClick === 'function') {
                        try { tool.onClick(); } catch (e) {}
                    }
                });
            });
            board.querySelectorAll('[data-ficha-delete]').forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const fichaId = btn.getAttribute('data-ficha-delete');
                    const ficha = toolkitFichas.find((f) => f.id === fichaId);
                    const name = (ficha && ficha.title) || fichaId || 'tablilla';
                    if (!window.confirm('¿Eliminar la tablilla «' + name + '»?')) return;
                    toolkitRemoveFicha(fichaId);
                });
            });
        }

        function toggleToolkit(force) {
            const overlay = document.getElementById('toolkitOverlay');
            const btn = document.getElementById('toolkitOpenBtn');
            if (!overlay) return;
            const open = typeof force === 'boolean' ? force : !overlay.classList.contains('open');
            overlay.classList.toggle('open', open);
            overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
            if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) {
                toolkitLoadStore();
                if (toolkitFichas.length) {
                    toolkitLogUse(toolkitFichas[0].id, 'toolkit-open', 'Abrir toolkit');
                } else {
                    toolkitRenderBoard();
                }
            }
        }

        function initToolkit() {
            if (window.__l8ToolkitReady) return;
            window.__l8ToolkitReady = true;
            toolkitLoadStore();
            const overlay = document.getElementById('toolkitOverlay');
            const closeBtn = document.getElementById('toolkitCloseBtn');
            if (closeBtn) closeBtn.addEventListener('click', () => toggleToolkit(false));
            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) toggleToolkit(false);
                });
            }
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) {
                    toggleToolkit(false);
                }
            });
            window.l8Toolkit = {
                open: () => toggleToolkit(true),
                close: () => toggleToolkit(false),
                logUse: toolkitLogUse,
                curateFile: toolkitCurateFile,
                removeFicha: toolkitRemoveFicha,
                fichas: toolkitFichas,
                render: toolkitRenderBoard,
                openEngineering: openToolkitEngineering
            };
        }

        document.addEventListener('DOMContentLoaded', initToolkit);

        connectSSE();
    </script>



    <div class="toolkit-agent-overlay" id="toolkitEngineeringOverlay" aria-hidden="true">
        <div class="toolkit-agent-shell" role="dialog" aria-modal="true" aria-labelledby="toolkitEngineeringBrand">
            <div class="toolkit-agent-top">
                <div class="toolkit-agent-brand" id="toolkitEngineeringBrand">= / ingeniería</div>
                <div class="toolkit-agent-sub" id="toolkitEngineeringSub">Agency Agents · Engineering · vista markdown</div>
                <button type="button" class="toolkit-agent-close" id="toolkitEngineeringCloseBtn" title="Cerrar">Cerrar</button>
            </div>
            <div class="toolkit-agent-main">
                <aside class="toolkit-agent-list" id="toolkitEngineeringList" aria-label="Agentes de ingeniería"></aside>
                <div class="toolkit-agent-view" id="toolkitEngineeringView">
                    <div class="md-status">Elige un agente del foro para verlo en markdown.</div>
                </div>
            </div>
        </div>
    </div>

    <div class="toolkit-overlay" id="toolkitOverlay" aria-hidden="true">
        <div class="toolkit-shell" role="dialog" aria-modal="true" aria-labelledby="toolkitBrandLabel">
            <div class="toolkit-top">
                <div class="toolkit-brand" id="toolkitBrandLabel">= / toolkit</div>
                <div class="toolkit-sub">Fichas de herramientas · historial · archivos curados</div>
                <button type="button" class="toolkit-close" id="toolkitCloseBtn" title="Cerrar">Cerrar</button>
            </div>
            <div class="toolkit-board" id="toolkitBoard" aria-live="polite"></div>
        </div>
    </div>

    <div class="notepad-overlay" id="notepadOverlay" aria-hidden="true">
        <div class="notepad-shell" role="dialog" aria-modal="true" aria-labelledby="notepadBrandLabel">
            <div class="notepad-top">
                <div class="notepad-brand" id="notepadBrandLabel">= / notepad</div>
                <input type="text" class="notepad-title" id="notepadTitle" maxlength="120" placeholder="Título de la nota" autocomplete="off">
                <button type="button" class="notepad-close" id="notepadCloseBtn" title="Cerrar">Cerrar</button>
            </div>
            <div class="notepad-toolbar" id="notepadToolbar">
                <button type="button" class="notepad-tool" data-cmd="undo" title="Deshacer">↩</button>
                <button type="button" class="notepad-tool" data-cmd="redo" title="Rehacer">↪</button>
                <span class="notepad-tool-sep" aria-hidden="true"></span>
                <button type="button" class="notepad-tool" data-cmd="bold" title="Negrita"><strong>B</strong></button>
                <button type="button" class="notepad-tool" data-cmd="italic" title="Cursiva"><em>I</em></button>
                <button type="button" class="notepad-tool" data-cmd="underline" title="Subrayado"><u>U</u></button>
                <button type="button" class="notepad-tool" data-cmd="strikeThrough" title="Tachado"><s>S</s></button>
                <span class="notepad-tool-sep" aria-hidden="true"></span>
                <button type="button" class="notepad-tool" data-cmd="formatBlock" data-value="h2" title="Título">H</button>
                <button type="button" class="notepad-tool" data-cmd="insertUnorderedList" title="Lista">• List</button>
                <button type="button" class="notepad-tool" data-cmd="insertOrderedList" title="Lista numerada">1. List</button>
                <button type="button" class="notepad-tool" data-cmd="formatBlock" data-value="pre" title="Código">Code</button>
                <button type="button" class="notepad-tool" data-cmd="removeFormat" title="Quitar formato">Clear</button>
                <span class="notepad-tool-sep" aria-hidden="true"></span>
                <button type="button" class="notepad-tool iconic" id="notepadAiToggleBtn" data-action="ai-toggle" title="Chat IA" aria-label="Abrir chat IA" aria-expanded="false" aria-controls="notepadAiPanel">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M 2 2 L 2 18 L 10 18 L 10 16 L 10 13 L 7 13 L 7 16 L 4 16 L 4 13 L 7 13 L 7 10 L 4 10 L 4 7 L 7 7 L 7 4 L 10 4 L 10 6 L 13 6 L 13 4 L 16 4 L 16 6 L 18 6 L 18 4 L 18 3 L 18 2 L 2 2 z M 7 7 L 7 10 L 10 10 L 10 7 L 7 7 z M 12 8 L 12 9 L 12 15 L 15.341797 15 L 14.113281 18.505859 C 12.858545 19.357587 12 20.695357 12 22.236328 L 12 24 L 24 24 L 24 22.236328 C 24 20.695357 23.141455 19.357587 21.886719 18.505859 L 20.658203 15 L 24 15 L 24 8 L 12 8 z M 14 10 L 15 10 L 15 12 L 17 12 L 17 10 L 19 10 L 19 12 L 21 12 L 21 10 L 22 10 L 22 13 L 19.958984 13 L 16.041016 13 L 14 13 L 14 10 z M 17.458984 15 L 18.541016 15 L 20.189453 19.712891 L 20.552734 19.894531 C 21.36554 20.300934 21.8476 21.108372 21.933594 22 L 14.066406 22 C 14.152396 21.108372 14.63446 20.300934 15.447266 19.894531 L 15.810547 19.712891 L 17.458984 15 z"></path>
                    </svg>
                </button>
                <button type="button" class="notepad-tool iconic" id="notepadOcgToggleBtn" data-action="ocg-toggle" title="OpenCriptG · códigos únicos" aria-label="Generar códigos OpenCriptG" aria-expanded="false" aria-controls="notepadOcgPanel">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M 19 5.1171875 C 17.871654 5.1171875 16.743646 5.6343119 16.068359 6.6699219 L 11.060547 14.349609 A 1.500316 1.500316 0 1 0 13.574219 15.988281 L 18.580078 8.3085938 C 18.807506 7.9598138 19.190541 7.9598137 19.417969 8.3085938 L 28.941406 22.917969 L 9.0566406 22.917969 L 10.923828 20.052734 A 1.50015 1.50015 0 1 0 8.4121094 18.414062 L 5.4746094 22.919922 C 3.5713222 22.934182 2 24.511682 2 26.417969 L 2 26.460938 C 2 30.34721 3.3543537 33.933489 5.6132812 36.75 A 1.50015 1.50015 0 1 0 7.953125 34.873047 C 6.1040525 32.567558 5 29.652664 5 26.460938 L 5 26.417969 C 5 26.122924 5.2049548 25.917969 5.5 25.917969 L 6.2128906 25.917969 A 1.50015 1.50015 0 0 0 6.2871094 25.919922 L 31.710938 25.919922 A 1.50015 1.50015 0 0 0 31.748047 25.917969 L 34.765625 25.917969 A 1.50015 1.50015 0 0 0 34.871094 25.919922 L 42.509766 25.919922 C 42.799091 25.924788 43 26.126481 43 26.417969 L 43 26.460938 C 43 33.91126 36.992315 39.917969 29.542969 39.917969 L 18.457031 39.917969 C 16.129034 39.917969 13.952836 39.332156 12.046875 38.296875 A 1.50015 1.50015 0 1 0 10.613281 40.931641 C 12.94532 42.198359 15.623029 42.917969 18.457031 42.917969 L 29.542969 42.917969 C 38.613623 42.917969 46 35.532614 46 26.460938 L 46 26.417969 C 46 24.503014 44.414955 22.917969 42.5 22.917969 L 42.404297 22.917969 L 31.669922 10.25 L 31.669922 10.248047 C 31.173823 9.6631287 30.525278 9.2838775 29.832031 9.1152344 C 29.138785 8.9465912 28.401249 8.9895793 27.730469 9.25 A 1.50015 1.50015 0 1 0 28.816406 12.046875 C 29.004234 11.973955 29.223168 12.004995 29.380859 12.189453 L 38.472656 22.917969 L 32.523438 22.917969 L 21.931641 6.6699219 C 21.256354 5.6343119 20.128346 5.1171875 19 5.1171875 z"></path>
                    </svg>
                </button>
                <span class="notepad-tool-sep" aria-hidden="true"></span>
                <button type="button" class="notepad-tool" data-action="find" title="Buscar">Buscar</button>
                <button type="button" class="notepad-tool" data-action="copy" title="Copiar">Copiar</button>
                <button type="button" class="notepad-tool" data-action="download-md" title="Descargar Markdown">.md</button>
                <button type="button" class="notepad-tool" data-action="download-html" title="Descargar HTML">.html</button>
                <button type="button" class="notepad-tool" data-action="download-txt" title="Descargar texto">.txt</button>
                <button type="button" class="notepad-tool" data-action="save" title="Guardar">Guardar</button>
                <div class="notepad-ai-panel" id="notepadAiPanel" aria-label="Chat IA del bloc de notas">
                    <div class="notepad-ai-row">
                        <select class="notepad-ai-select" id="notepadAiModel" title="Modelo IA" aria-label="Modelo IA">
                            <option value="gpt-5.6">GPT 5.6</option>
                            <option value="gemini-3.6">Gemini 3.6</option>
                            <option value="claude-fable-5">Claude Fable 5</option>
                            <option value="manus">Manus</option>
                        </select>
                        <button type="button" class="notepad-tool" id="notepadAiOauthBtn" title="Iniciar sesión OAuth">Iniciar sesión</button>
                        <button type="button" class="notepad-tool" id="notepadAiLogoutBtn" title="Cerrar sesión del modelo">Salir</button>
                        <span class="notepad-ai-status" id="notepadAiConnStatus">elige modelo e inicia sesión</span>
                    </div>
                    <div class="notepad-ai-login" id="notepadAiLoginBox">
                        <input type="password" class="notepad-ai-input" id="notepadAiTokenInput" placeholder="Access token / API key (solo servidor)" autocomplete="off">
                        <button type="button" class="notepad-tool" id="notepadAiTokenBtn">Guardar token</button>
                    </div>
                    <div class="notepad-ai-row">
                        <input type="text" class="notepad-ai-input" id="notepadAiPrompt" placeholder="Pide el contenido (sin saludos: se inserta en la selección)…" autocomplete="off">
                        <button type="button" class="notepad-tool" id="notepadAiSendBtn">Insertar</button>
                    </div>
                    <div class="notepad-ai-status" id="notepadAiRunStatus"></div>
                </div>
                <div class="notepad-ocg-panel" id="notepadOcgPanel" aria-label="Generador OpenCriptG">
                    <div class="notepad-ocg-row">
                        <select class="notepad-ocg-select" id="notepadOcgCategory" title="Categoría" aria-label="Categoría OpenCriptG"></select>
                        <input type="text" class="notepad-ocg-input filter" id="notepadOcgFilter" placeholder="Filtrar tipo (10.100)…" autocomplete="off">
                        <input type="number" class="notepad-ocg-input" id="notepadOcgQty" min="1" max="25" value="1" title="Cantidad" aria-label="Cantidad de códigos">
                        <button type="button" class="notepad-tool" id="notepadOcgGenerateBtn" title="Generar e insertar en la nota">Generar e insertar</button>
                    </div>
                    <div class="notepad-ocg-row">
                        <select class="notepad-ocg-select type" id="notepadOcgType" title="Tipo criptográfico" aria-label="Tipo criptográfico OpenCriptG"></select>
                    </div>
                    <div class="notepad-ocg-status" id="notepadOcgStatus">inventario OpenCriptG · 10.100 tipos · códigos únicos</div>
                </div>
                <div class="notepad-find" id="notepadFindBar">
                    <input type="text" id="notepadFindInput" placeholder="Buscar en la nota…" autocomplete="off">
                    <button type="button" class="notepad-tool" data-action="find-next">Siguiente</button>
                    <button type="button" class="notepad-tool" data-action="find-close">Cerrar</button>
                </div>
            </div>
            <div class="notepad-main">
                <aside class="notepad-sidebar">
                    <div class="notepad-sidebar-head">
                        <button type="button" class="notepad-tool" data-action="new" title="Nueva nota">+ Nueva</button>
                        <button type="button" class="notepad-tool" data-action="delete" title="Eliminar nota">Eliminar</button>
                    </div>
                    <ul class="notepad-list" id="notepadList"></ul>
                </aside>
                <div class="notepad-editor-wrap">
                    <div class="notepad-editor" id="notepadEditor" contenteditable="true" spellcheck="true" data-placeholder="Escribe aquí… bloc de notas único de l8 codespace." role="textbox" aria-multiline="true"></div>
                </div>
            </div>
            <div class="notepad-status">
                <span id="notepadStatusLeft">0 palabras · 0 caracteres</span>
                <span id="notepadStatusRight">listo</span>
            </div>
        </div>
    </div>

    </div><!-- /.platform-shell -->

    <script>
        /* ===== AUTH GATE (registro / login) ===== */
        (function authGate() {
            const AUTH_TOKEN_KEY = 'l8_auth_token';
            const AUTH_ACCOUNT_KEY = 'l8_auth_account';
            const overlay = document.getElementById('authOverlay');
            const msgEl = document.getElementById('authMsg');
            const keysBox = document.getElementById('authKeysBox');
            let pendingSessionToken = '';
            let pendingKeysText = '';

            function setMsg(text, ok) {
                if (!msgEl) return;
                msgEl.textContent = text || '';
                msgEl.classList.toggle('ok', !!ok);
            }

            function getToken() {
                try { return sessionStorage.getItem(AUTH_TOKEN_KEY) || ''; } catch (e) { return ''; }
            }

            function saveSession(token, accountId) {
                try {
                    sessionStorage.setItem(AUTH_TOKEN_KEY, token || '');
                    if (accountId) sessionStorage.setItem(AUTH_ACCOUNT_KEY, accountId);
                } catch (e) {}
            }

            function clearSession() {
                try {
                    sessionStorage.removeItem(AUTH_TOKEN_KEY);
                    sessionStorage.removeItem(AUTH_ACCOUNT_KEY);
                } catch (e) {}
            }

            function unlockPlatform() {
                if (overlay) overlay.classList.add('hidden');
                document.body.classList.remove('boot-locked');
                document.body.classList.remove('auth-locked');
                if (typeof restorePlatformState === 'function') {
                    restorePlatformState();
                }
            }

            function showAuthGate() {
                document.body.classList.add('auth-locked');
                document.body.classList.remove('boot-locked');
                if (overlay) overlay.classList.remove('hidden');
                setMsg('');
            }

            window.l8ShowAuthGate = showAuthGate;
            window.l8UnlockPlatform = unlockPlatform;
            window.l8GetAuthToken = getToken;

            async function checkSession() {
                const token = getToken();
                if (!token) return false;
                try {
                    const res = await fetch('/api/auth/session', {
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    const data = await res.json();
                    return !!(data && data.ok && data.authenticated);
                } catch (e) {
                    return false;
                }
            }

            window.l8CheckAuthSession = checkSession;

            function switchTab(name) {
                const tabs = {
                    login: document.getElementById('authTabLogin'),
                    register: document.getElementById('authTabRegister'),
                    recover: document.getElementById('authTabRecover')
                };
                const panels = {
                    login: document.getElementById('authPanelLogin'),
                    register: document.getElementById('authPanelRegister'),
                    recover: document.getElementById('authPanelRecover')
                };
                Object.keys(tabs).forEach((k) => {
                    if (tabs[k]) tabs[k].classList.toggle('active', k === name);
                    if (panels[k]) panels[k].classList.toggle('active', k === name);
                });
                setMsg('');
            }

            function showKeyKit(data) {
                const aes = (data.keys && data.keys.aes256) || '';
                const identity = (data.keys && data.keys.identity) || '';
                const recovery = (data.keys && data.keys.recovery) || '';
                const backups = Array.isArray(data.keys && data.keys.backup_codes) ? data.keys.backup_codes : [];
                pendingSessionToken = data.session_token || '';
                pendingKeysText = [
                    'AES-256:', aes, '',
                    'L8ID:', identity, '',
                    'L8REC (recuperación):', recovery, '',
                    'Códigos de respaldo:', backups.join('\n')
                ].join('\n');
                const aesOut = document.getElementById('authKeyAesOut');
                const idOut = document.getElementById('authKeyIdOut');
                const recOut = document.getElementById('authKeyRecOut');
                const bakOut = document.getElementById('authKeyBackupOut');
                if (aesOut) aesOut.textContent = aes;
                if (idOut) idOut.textContent = identity;
                if (recOut) recOut.textContent = recovery;
                if (bakOut) bakOut.textContent = backups.join('\n');
                if (keysBox) keysBox.classList.add('visible');
            }

            document.getElementById('authTabLogin')?.addEventListener('click', () => switchTab('login'));
            document.getElementById('authTabRegister')?.addEventListener('click', () => switchTab('register'));
            document.getElementById('authTabRecover')?.addEventListener('click', () => switchTab('recover'));

            document.getElementById('authLoginBtn')?.addEventListener('click', async () => {
                const aes = (document.getElementById('authAesInput')?.value || '').trim();
                const identity = (document.getElementById('authIdentityInput')?.value || '').trim();
                const btn = document.getElementById('authLoginBtn');
                if (!aes || !identity) {
                    setMsg('Introduce las 2 claves de tu cuenta.');
                    return;
                }
                if (btn) btn.disabled = true;
                setMsg('Verificando…');
                try {
                    const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ aes256: aes, identity: identity })
                    });
                    const data = await res.json();
                    if (!data || !data.ok) {
                        setMsg((data && data.error) || 'Acceso denegado.');
                        return;
                    }
                    saveSession(data.session_token, data.account_id);
                    setMsg('Acceso concedido.', true);
                    unlockPlatform();
                } catch (e) {
                    setMsg('Error de red al iniciar sesión.');
                } finally {
                    if (btn) btn.disabled = false;
                }
            });

            document.getElementById('authRegisterBtn')?.addEventListener('click', async () => {
                const dil = (document.getElementById('authDilithiumInput')?.value || '').trim();
                const btn = document.getElementById('authRegisterBtn');
                if (!dil) {
                    setMsg('Introduce la Dilithium-5 de registro del mes.');
                    return;
                }
                if (btn) btn.disabled = true;
                setMsg('Creando cuenta…');
                try {
                    const res = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ dilithium5: dil })
                    });
                    const data = await res.json();
                    if (!data || !data.ok) {
                        setMsg((data && data.error) || 'No se pudo registrar.');
                        return;
                    }
                    showKeyKit(data);
                    if (document.getElementById('authDilithiumInput')) {
                        document.getElementById('authDilithiumInput').value = '';
                    }
                    setMsg(formatPersistMsg(data, data.warning || 'Cuenta creada. Guarda el kit completo.'), true);
                } catch (e) {
                    setMsg('Error de red al registrar.');
                } finally {
                    if (btn) btn.disabled = false;
                }
            });

            function formatPersistMsg(data, base) {
                const p = data && data.persisted;
                if (!p) return base;
                const bits = [];
                if (p.storage) bits.push('Storage');
                if (p.db) bits.push('DB');
                if (!bits.length) {
                    return base + ' (aviso: aún no se reflejó en Supabase; revisa schema.sql / keys)';
                }
                return base + ' · Supabase: ' + bits.join('+');
            }

            document.getElementById('authRecoverBtn')?.addEventListener('click', async () => {
                const material = (document.getElementById('authRecoverInput')?.value || '').trim();
                const btn = document.getElementById('authRecoverBtn');
                if (!material) {
                    setMsg('Introduce L8REC o un código de respaldo.');
                    return;
                }
                if (btn) btn.disabled = true;
                setMsg('Recuperando cuenta…');
                try {
                    const res = await fetch('/api/auth/recover', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ recovery: material })
                    });
                    const data = await res.json();
                    if (!data || !data.ok) {
                        setMsg((data && data.error) || 'No se pudo recuperar.');
                        return;
                    }
                    showKeyKit(data);
                    if (document.getElementById('authRecoverInput')) {
                        document.getElementById('authRecoverInput').value = '';
                    }
                    setMsg(formatPersistMsg(data, data.warning || 'Claves regeneradas. Guarda el nuevo kit.'), true);
                } catch (e) {
                    setMsg('Error de red al recuperar.');
                } finally {
                    if (btn) btn.disabled = false;
                }
            });

            document.getElementById('authCopyKeysBtn')?.addEventListener('click', async () => {
                if (!pendingKeysText) return;
                try {
                    await navigator.clipboard.writeText(pendingKeysText);
                    setMsg('Kit copiado al portapapeles.', true);
                } catch (e) {
                    setMsg('No se pudo copiar automáticamente. Selecciónalo y copia manualmente.');
                }
            });

            document.getElementById('authEnterAfterRegisterBtn')?.addEventListener('click', () => {
                if (!pendingSessionToken) {
                    setMsg('Primero crea o recupera la cuenta y guarda el kit.');
                    return;
                }
                saveSession(pendingSessionToken, '');
                unlockPlatform();
            });

            // Enter en inputs
            ['authAesInput', 'authIdentityInput'].forEach((id) => {
                document.getElementById(id)?.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') document.getElementById('authLoginBtn')?.click();
                });
            });
            document.getElementById('authDilithiumInput')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') document.getElementById('authRegisterBtn')?.click();
            });
            document.getElementById('authRecoverInput')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') document.getElementById('authRecoverBtn')?.click();
            });
        })();

        /* ===== BOOT: blackhole visual only (CLI hidden) ===== */
        (function bootBlackholeVisual() {
            const overlay = document.getElementById('bootCliOverlay');
            const hintEl = document.getElementById('bootCliHint');
            const enterBtn = document.getElementById('bootCliEnter');
            if (!overlay || !enterBtn) return;

            const COMMAND = 'bunx --bun originkit@latest add blackhole';
            let finished = false;
            let blackholeInstance = null;

            function presentBlackholeVisual() {
                const canvas = document.getElementById('bootBlackholeCanvas');
                if (!canvas || !window.OriginkitBlackHole) return;
                if (blackholeInstance && blackholeInstance.stop) blackholeInstance.stop();
                const wide = window.innerWidth > 720;
                blackholeInstance = window.OriginkitBlackHole.create(canvas, {
                    showCenter: true,
                    // sit left on desktop so brand fits cleanly on the right
                    centre: { radius: 8, x: wide ? 38 : 50, y: wide ? 54 : 46 },
                    background: '#ffffff',
                    outerRadius: wide ? 78 : 82,
                    particleCount: 2400,
                    particleSize: 1.9,
                    trail: 82,
                    tilt: 70,
                    tiltSideway: 12,
                    orbitSpeed: 1.15,
                    pullSpeed: 0.06,
                    armCount: 9,
                    colors: ['#111111', '#1a1a1a', '#2e2e2e', '#3d3d3d', '#555555', '#6a6a6a', '#888888', '#222222']
                });
                setTimeout(() => blackholeInstance && blackholeInstance.resize && blackholeInstance.resize(), 30);
            }

            function markReady() {
                finished = true;
                enterBtn.classList.add('ready');
                hintEl.textContent = 'Press Enter to open l8 codespace';
            }

            async function enterPlatform() {
                if (!finished) return;
                if (blackholeInstance && blackholeInstance.stop) blackholeInstance.stop();
                overlay.classList.add('hidden');
                try { sessionStorage.setItem('l8_boot_cli_done', '1'); } catch (e) {}

                // Tras Enter: auth gate. Plataforma oculta hasta login/registro.
                const ok = (typeof window.l8CheckAuthSession === 'function')
                    ? await window.l8CheckAuthSession()
                    : false;
                if (ok) {
                    if (typeof window.l8UnlockPlatform === 'function') window.l8UnlockPlatform();
                    else {
                        document.body.classList.remove('boot-locked');
                        document.body.classList.remove('auth-locked');
                        if (typeof restorePlatformState === 'function') restorePlatformState();
                    }
                    return;
                }
                if (typeof window.l8ShowAuthGate === 'function') {
                    window.l8ShowAuthGate();
                } else {
                    document.body.classList.add('auth-locked');
                }
            }

            enterBtn.addEventListener('click', enterPlatform);
            window.addEventListener('keydown', (e) => {
                if (!finished || overlay.classList.contains('hidden')) return;
                if (e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    enterPlatform();
                }
            });

            // Show drawing immediately; install runs quietly in the background.
            presentBlackholeVisual();
            hintEl.textContent = 'blackhole…';
            setTimeout(markReady, 700);

            fetch('/api/cli/blackhole', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: COMMAND })
            }).catch(function () { /* visual already running */ });
        })();
    </script>
</body>
</html>
