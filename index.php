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
        }

        .icon-globe,
        .icon-gateway,
        .icon-ubuntu-cli {
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
        .icon-ubuntu-cli {
            cursor: pointer;
        }

        .icon-globe svg,
        .icon-gateway svg,
        .icon-ubuntu-cli svg {
            height: 20px;
            width: 20px;
            max-width: 20px;
            max-height: 20px;
            display: block;
            fill: currentColor;
        }

        .icon-gateway:hover,
        .icon-ubuntu-cli:hover {
            opacity: 0.75;
        }

        .icon-ubuntu-cli {
            margin-left: 4px;
        }

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
            width: 22px;
            height: 22px;
            min-width: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0.85;
            transition: opacity 0.2s ease, transform 0.15s ease;
        }

        .cell-action-icon:hover {
            opacity: 1;
            transform: scale(1.08);
        }

        .cell-action-icon svg {
            width: 22px;
            height: 22px;
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
        }

        .function-editor::placeholder {
            color: #888888;
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
            margin-top: 16px;
            background: transparent;
            user-select: none;
            animation: fadeInDrawer 0.25s ease-out;
        }

        .virtual-keyboard-white.active {
            display: block;
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
        body.boot-locked .platform-shell {
            visibility: hidden;
            pointer-events: none;
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

        .boot-linux-logo {
            width: 22px;
            height: 26px;
            flex: 0 0 auto;
            display: block;
            color: #8a8a8a;
        }

        .boot-linux-logo svg {
            width: 100%;
            height: 100%;
            display: block;
            fill: currentColor;
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
                    <span class="boot-linux-logo" title="Linux" aria-label="Linux" role="img">
                        <!-- Tux (Linux mascot) — gray -->
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 76" aria-hidden="true">
                            <path d="M32 2c-6.2 0-11.4 4.3-13.2 10.2-1.1 3.5-1 7.2.2 10.7-3.9 2.4-6.5 6.7-6.5 11.6 0 2.1.5 4.1 1.4 5.9-3.3 2.6-5.4 6.7-5.4 11.3 0 5.8 3.3 10.8 8.1 13.2-.3 1.2-.5 2.5-.5 3.8 0 7.6 7 13.8 15.9 13.8s15.9-6.2 15.9-13.8c0-1.3-.2-2.6-.5-3.8 4.8-2.4 8.1-7.4 8.1-13.2 0-4.6-2.1-8.7-5.4-11.3.9-1.8 1.4-3.8 1.4-5.9 0-4.9-2.6-9.2-6.5-11.6 1.2-3.5 1.3-7.2.2-10.7C43.4 6.3 38.2 2 32 2zm0 4c4.5 0 8.2 3 9.5 7.2.8 2.6.7 5.3-.2 7.8-2.8-1.2-5.9-1.9-9.3-1.9s-6.5.7-9.3 1.9c-.9-2.5-1-5.2-.2-7.8C23.8 9 27.5 6 32 6zm0 11c3.4 0 6.5.8 9.3 2.2.4 1.3.6 2.7.6 4.1 0 1.9-.5 3.7-1.4 5.3-2.5-1.5-5.4-2.4-8.5-2.4s-6 .9-8.5 2.4c-.9-1.6-1.4-3.4-1.4-5.3 0-1.4.2-2.8.6-4.1C25.5 17.8 28.6 17 32 17zm-11.2 13.6c2.1-1.4 4.6-2.2 7.3-2.4.1 1.4.6 2.7 1.4 3.8-2.9.7-5.4 2.4-7.1 4.8-.8-1.9-1.3-4-1.6-6.2zm22.4 0c-.3 2.2-.8 4.3-1.6 6.2-1.7-2.4-4.2-4.1-7.1-4.8.8-1.1 1.3-2.4 1.4-3.8 2.7.2 5.2 1 7.3 2.4zM32 33c2.8 0 5.3 1 7.3 2.7-.2 1.3-.5 2.6-.9 3.8-1.9-1.2-4.1-1.9-6.4-1.9s-4.5.7-6.4 1.9c-.4-1.2-.7-2.5-.9-3.8C26.7 34 29.2 33 32 33zm-12.8 6.2c1.9-2.3 4.7-3.8 7.9-4.1.3 1.3.8 2.5 1.5 3.5-3.5 1.2-6.3 3.8-7.8 7.1-.8-2-.1-4.5-1.6-6.5zm25.6 0c-1.5 2-2.4 4.5-1.6 6.5-1.5-3.3-4.3-5.9-7.8-7.1.7-1 1.2-2.2 1.5-3.5 3.2.3 6 1.8 7.9 4.1zM32 40c2.1 0 4 .6 5.7 1.7-.5 2.1-1.3 4.1-2.3 5.9-1.1-.5-2.2-.8-3.4-.8s-2.3.3-3.4.8c-1-1.8-1.8-3.8-2.3-5.9C28 40.6 29.9 40 32 40zm-8.6 4.1c.8-.9 1.7-1.7 2.8-2.3.5 1.8 1.2 3.5 2.1 5.1-2.3.9-4.1 2.7-5 5-.7-2.5-.7-5.3.1-7.8zm17.2 0c.8 2.5.8 5.3.1 7.8-.9-2.3-2.7-4.1-5-5 .9-1.6 1.6-3.3 2.1-5.1 1.1.6 2 1.4 2.8 2.3zM32 49c1.3 0 2.5.3 3.6.8-.5 1.3-1.1 2.5-1.8 3.6-.6-.2-1.2-.3-1.8-.3s-1.2.1-1.8.3c-.7-1.1-1.3-2.3-1.8-3.6 1.1-.5 2.3-.8 3.6-.8zm-5.2 5.8c1.5-.6 3.2-.9 5-.9s3.5.3 5 .9c-.2 2.8-1.7 5.3-4 6.8v2.8c0 .6-.5 1.1-1.1 1.1h-.8c-.6 0-1.1-.5-1.1-1.1V61.6c-2.3-1.5-3.8-4-4-6.8z"/>
                            <ellipse cx="26.5" cy="14.5" rx="2.2" ry="2.8" fill="#5a5a5a"/>
                            <ellipse cx="37.5" cy="14.5" rx="2.2" ry="2.8" fill="#5a5a5a"/>
                            <path d="M28 20.5c1.2 1.4 2.4 2.1 4 2.1s2.8-.7 4-2.1c.3-.4-.1-.9-.5-.7-1.1.5-2.3.8-3.5.8s-2.4-.3-3.5-.8c-.4-.2-.8.3-.5.7z" fill="#5a5a5a"/>
                        </svg>
                    </span>
                </div>
                <button type="button" class="boot-cli-enter" id="bootCliEnter">Enter platform ↵</button>
            </div>
        </div>
    </div>

    <div class="platform-shell">
    <div class="top-bar">
        <div class="left-controls">
            <label class="checkbox-label">
                <input type="checkbox" id="formatToggle" checked onchange="toggleFormat()">
                <span>Dar formato al texto</span>
            </label>
            <button type="button" class="icon-ubuntu-cli" title="Ubuntu CLI (boxcutter/ubuntu)" aria-label="Abrir Ubuntu CLI externa" onclick="openUbuntuCli()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" role="img" aria-hidden="true">
                    <path d="M 5 4 A 1.0001 1.0001 0 0 0 4 5 L 4 15 A 1.0001 1.0001 0 0 0 5 16 L 45 16 A 1.0001 1.0001 0 0 0 46 15 L 46 5 A 1.0001 1.0001 0 0 0 45 4 L 5 4 z M 6 6 L 44 6 L 44 14 L 6 14 L 6 6 z M 10 9 A 1 1 0 0 0 9 10 A 1 1 0 0 0 10 11 A 1 1 0 0 0 11 10 A 1 1 0 0 0 10 9 z M 14 9 A 1 1 0 0 0 13 10 A 1 1 0 0 0 14 11 A 1 1 0 0 0 15 10 A 1 1 0 0 0 14 9 z M 18 9 A 1 1 0 0 0 17 10 A 1 1 0 0 0 18 11 A 1 1 0 0 0 19 10 A 1 1 0 0 0 18 9 z M 4 19 L 4 45 A 1.0001 1.0001 0 0 0 5 46 L 45 46 A 1.0001 1.0001 0 0 0 46 45 L 46 19 L 44 19 L 44 44 L 6 44 L 6 19 L 4 19 z M 10 19 A 1.0001 1.0001 0 0 0 9 20 L 9 40 A 1.0001 1.0001 0 0 0 10 41 L 23 41 A 1.0001 1.0001 0 0 0 24 40 L 24 20 A 1.0001 1.0001 0 0 0 23 19 L 10 19 z M 27 19 L 27 21 L 41 21 L 41 19 L 27 19 z M 11 21 L 22 21 L 22 39 L 11 39 L 11 21 z M 27 24 L 27 26 L 41 26 L 41 24 L 27 24 z M 27 29 L 27 31 L 41 31 L 41 29 L 27 29 z M 27 34 L 27 36 L 41 36 L 41 34 L 27 34 z M 27 39 L 27 41 L 41 41 L 41 39 L 27 39 z"></path>
                </svg>
            </button>
        </div>
        <div class="top-bar-right">
            <button type="button" class="icon-gateway" title="Gateway l8 codespace" aria-label="Gateway l8 codespace" onclick="openPlatformGateway()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" role="img" aria-hidden="true">
                    <path d="M 9.875 0.0625 C 9.617188 0.0976563 9.378906 0.230469 9.21875 0.4375 C 6.585938 3.582031 5 7.644531 5 12.0625 C 5 16.429688 6.542969 20.433594 9.125 23.5625 C 9.480469 23.992188 10.117188 24.058594 10.546875 23.703125 C 10.976563 23.347656 11.042969 22.710938 10.6875 22.28125 C 8.390625 19.496094 7 15.957031 7 12.0625 C 7 8.125 8.40625 4.515625 10.75 1.71875 C 11.027344 1.40625 11.082031 0.957031 10.886719 0.585938 C 10.691406 0.21875 10.289063 0.0078125 9.875 0.0625 Z M 39.8125 0.0625 C 39.453125 0.128906 39.160156 0.378906 39.042969 0.726563 C 38.925781 1.070313 39.003906 1.449219 39.25 1.71875 C 41.59375 4.515625 43 8.125 43 12.0625 C 43 15.957031 41.609375 19.496094 39.3125 22.28125 C 38.957031 22.710938 39.023438 23.347656 39.453125 23.703125 C 39.882813 24.058594 40.519531 23.992188 40.875 23.5625 C 43.457031 20.433594 45 16.429688 45 12.0625 C 45 7.644531 43.414063 3.582031 40.78125 0.4375 C 40.570313 0.171875 40.242188 0.03125 39.90625 0.0625 C 39.875 0.0625 39.84375 0.0625 39.8125 0.0625 Z M 15.6875 3.34375 C 15.429688 3.378906 15.191406 3.511719 15.03125 3.71875 C 13.140625 5.976563 12 8.890625 12 12.0625 C 12 15.234375 13.140625 18.148438 15.03125 20.40625 C 15.253906 20.707031 15.621094 20.855469 15.988281 20.800781 C 16.355469 20.742188 16.660156 20.488281 16.78125 20.136719 C 16.902344 19.785156 16.816406 19.394531 16.5625 19.125 C 14.960938 17.214844 14 14.753906 14 12.0625 C 14 9.371094 14.960938 6.914063 16.5625 5 C 16.839844 4.6875 16.894531 4.238281 16.699219 3.867188 C 16.503906 3.5 16.101563 3.289063 15.6875 3.34375 Z M 34 3.34375 C 33.640625 3.410156 33.347656 3.660156 33.230469 4.007813 C 33.113281 4.351563 33.191406 4.730469 33.4375 5 C 35.039063 6.914063 36 9.371094 36 12.0625 C 36 14.753906 35.039063 17.214844 33.4375 19.125 C 33.183594 19.394531 33.097656 19.785156 33.21875 20.136719 C 33.339844 20.488281 33.644531 20.742188 34.011719 20.800781 C 34.378906 20.855469 34.746094 20.707031 34.96875 20.40625 C 36.859375 18.148438 38 15.234375 38 12.0625 C 38 8.890625 36.859375 5.976563 34.96875 3.71875 C 34.757813 3.453125 34.429688 3.3125 34.09375 3.34375 C 34.0625 3.34375 34.03125 3.34375 34 3.34375 Z M 25 8 C 22.789063 8 21 9.789063 21 12 C 21 13.324219 21.632813 14.492188 22.625 15.21875 L 10.5 47.28125 C 10.113281 48.316406 10.636719 49.472656 11.671875 49.859375 C 12.707031 50.246094 13.863281 49.722656 14.25 48.6875 L 15.53125 45.34375 L 32.6875 40.5625 L 35.75 48.6875 C 36.136719 49.722656 37.292969 50.246094 38.328125 49.859375 C 39.363281 49.472656 39.886719 48.316406 39.5 47.28125 L 27.375 15.21875 C 28.367188 14.492188 29 13.324219 29 12 C 29 9.789063 27.210938 8 25 8 Z M 25 20.3125 L 27.5625 27.0625 L 21.59375 29.3125 Z M 28.96875 30.78125 L 30.5625 35.03125 L 24.1875 32.625 Z M 19.40625 35.09375 L 27.03125 37.96875 L 17.28125 40.6875 Z"></path>
                </svg>
            </button>
            <div class="icon-globe" title="l8 codespace" aria-label="l8 codespace">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" role="img" aria-hidden="true">
                    <path fill="currentColor" d="M22.4,27.1L22.4,27.1L22.4,27.1 M27,27.8L27,27.8L27,27.8 M21,24.7c-0.3,0-0.5,0.1-0.7,0.3l-2.6,2.4c-0.4,0.4-0.7,1-0.7,1.6 v2.2c0,0.6,0.2,1.2,0.7,1.6l0.5,0.5c0.2,0.2,0.5,0.3,0.8,0.3c0.3,0,0.6-0.1,0.8-0.3l0.8-0.8c0.2-0.2,0.5-0.3,0.8-0.3h0.9 c0.3,0,0.6,0.1,0.8,0.3l1.2,1.3c0.2,0.2,0.5,0.3,0.8,0.3h0.7c0.4,0,0.8-0.2,0.9-0.6l1.4-2.8c0.1-0.2,0.1-0.5,0.1-0.8L26.7,26 c-0.1-0.5-0.6-0.7-1-0.7c-0.2,0-0.5,0.1-0.7,0.3c-0.2,0.2-0.4,0.3-0.7,0.3c-0.1,0-0.3,0-0.4-0.1l-2.5-1C21.2,24.7,21.1,24.7,21,24.7 L21,24.7z"></path>
                    <path fill="currentColor" d="M25,38v-0.3c0-0.4,0.2-0.7,0.5-0.9l2.6-1.7c0.4-0.3,0.9-0.2,1.2,0.2l0.5,0.7c0.4,0.5,0.2,1.3-0.4,1.6l-3.1,1.3 C25.7,39.2,25,38.7,25,38z"></path>
                    <path fill="currentColor" d="M30,34.4v-1.8c0-0.5,0.5-0.8,0.9-0.5l0.9,0.9c0.2,0.2,0.2,0.7,0,0.9l-0.9,0.9C30.6,35.2,30,34.9,30,34.4z"></path>
                    <path fill="currentColor" d="M42.5,24h-1.4c-0.2,0-0.4,0-0.6,0.1l-2.7,1.2c-0.2,0.1-0.4,0.3-0.6,0.5l-0.6,0.8c-0.4,0.5-0.4,1.2,0,1.7l0.8,1.2 c0.4,0.5,0.3,1.3-0.1,1.8l-1,1.2c-0.2,0.3-0.3,0.6-0.3,0.9v5C41.2,33,42.5,29,42.5,24L42.5,24z"></path>
                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M32.7,7.7c5.8,3.1,9.8,9.3,9.8,16.3c0,10.2-8.3,18.5-18.5,18.5c-5.4,0-10.3-2.3-13.7-6.1"></path>
                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6.3,29.3c-0.5-1.7-0.8-3.5-0.8-5.3C5.5,13.8,13.8,5.5,24,5.5c0.5,0,1,0,1.5,0.1"></path>
                    <path fill="currentColor" d="M41.8,19L39,13.2c0-0.9-2.3-2.6-2.3-2.6c-0.7-0.7-1.5-1.3-2.3-1.9L33,9.9c-0.2,0.2-0.5,0.3-0.7,0.3c-0.2,0-0.4-0.1-0.6-0.2 l-0.9-0.8C30.6,9.1,30.4,9,30.1,9H28c-0.6,0-1,0.4-1,1v1c0,0.6,0.4,1,1,1h0.5c0.3,0,0.6,0.1,0.8,0.3l2.5,2.9 c0.2,0.2,0.2,0.4,0.2,0.6l0,2.5c0,0.2,0,0.3,0.1,0.5l1.5,2.6c0.2,0.3,0.5,0.5,0.9,0.5H35c0.6,0,1,0.4,1,1s0.4,1,1,1h0 c0.3,0,0.5-0.1,0.7-0.3l1.5-1.4c0.2-0.2,0.4-0.3,0.7-0.3l2.5-0.1C42.3,20.9,42.1,19.9,41.8,19z"></path>
                    <path fill="currentColor" d="M20.6,5.8l-7.9,3.5l-6,8.2c-0.4,1.1-0.7,2.2-0.9,3.3l1.3,1.3c0.1,0.1,0.1,0.1,0.2,0.2l1.5,3C8.9,25.8,9.2,26,9.6,26h0.5 c0.5,0,0.9-0.4,0.9-0.9v-2.7c0-0.2,0.1-0.5,0.3-0.6L12,21c0,0,0.1-0.1,0.3-0.1s0.3,0.1,0.4,0.6c0.1,1,0.6,3.7,0.6,3.7 c0.1,0.4,0.4,0.8,0.9,0.8c0.5,0,0.9-0.4,0.9-0.9v-7.2c0-0.5,0.4-0.9,0.9-0.9h0.7c0.2,0,0.5-0.1,0.6-0.3l1-1c0.4-0.4,0.3-1-0.1-1.4 l-0.4-0.3c-0.4-0.3-0.5-0.9-0.2-1.3l0.4-0.5c0.2-0.2,0.4-0.3,0.7-0.3c0.4,0,0.7,0.2,0.9,0.6l0.3,0.8c0.1,0.4,0.5,0.6,0.9,0.6h0.4 c0.5,0,0.9-0.4,0.9-0.9v-2.4c0-0.1,0-0.2,0.1-0.3l1.9-4.8C22.8,5.5,21.7,5.6,20.6,5.8z"></path>
                </svg>
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
                    <div class="cell-action-icon" title="Activar/Desactivar Teclado y Entorno Gráfico" onclick="toggleVirtualKeyboard()">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="#000000" />
                            <circle cx="82" cy="18" r="4.5" fill="#000000" />
                            <circle cx="88" cy="28" r="2.5" fill="#000000" />
                            <circle cx="78" cy="38" r="2" fill="#ffffff" />
                            <circle cx="79" cy="74" r="2.5" fill="#000000" />
                            <circle cx="28" cy="54" r="3" fill="#000000" />
                            <circle cx="34" cy="80" r="2.5" fill="#000000" />
                            <rect x="36" y="24" width="28" height="34" rx="3" fill="#ffffff" />
                            <path d="M 36 50 L 36 58 C 36 61 41 61 44 61 L 58 61 C 55 56 46 55 42 50 Z" fill="#ffffff" />
                            <line x1="41" y1="30" x2="57" y2="30" stroke="#000000" stroke-width="2.5" stroke-linecap="round" />
                            <line x1="41" y1="36" x2="60" y2="36" stroke="#000000" stroke-width="2.5" stroke-linecap="round" />
                            <line x1="41" y1="42" x2="55" y2="42" stroke="#000000" stroke-width="2.5" stroke-linecap="round" />
                            <line x1="41" y1="48" x2="60" y2="48" stroke="#000000" stroke-width="2.5" stroke-linecap="round" />
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
                </div>

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

        async function openRepoCodeInspector(repoName, userRepo) {
            const drawer = document.getElementById('functionDrawer');
            if (!drawer.classList.contains('open')) {
                drawer.classList.add('open');
            }
            
            const localName = repoName || (userRepo ? String(userRepo).split('/').pop() : '');
            const remoteTarget = userRepo || repoName;
            currentInspectedRepo = localName;
            currentInspectedUserRepo = remoteTarget || '';
            currentInspectedFile = null;
            const toolbar = document.getElementById('repoInspectorBar');
            const selector = document.getElementById('repoFileSelector');
            const headerTitle = document.getElementById('functionDrawerHeader');
            const editor = document.getElementById('functionEditor');
            const pathInfo = document.getElementById('repoFilePathInfo');

            headerTitle.innerHTML = `&gt;/ function to execute &bull; <span style="color:#ffffff;">Inspeccionando Repositorio: <strong>${localName}</strong></span>`;
            toolbar.style.display = 'flex';
            selector.innerHTML = '<option value="">⏳ Cargando estructura de carpetas...</option>';
            pathInfo.textContent = '';
            editor.style.color = '#ffffff';
            editor.value = "// Cargando código completo del repositorio '" + localName + "' por carpetas...";

            try {
                let res = await fetch('/api/repo/tree?repo=' + encodeURIComponent(localName));
                let data = await res.json();

                // Si no está clonado localmente, clonar primero y reintentar
                if (!data.ok && remoteTarget) {
                    editor.value = "// Clonando '" + remoteTarget + "' para inspeccionar el código en la terminal negra...";
                    const cloneRes = await fetch('/api/command', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: 'clone ' + remoteTarget })
                    });
                    const cloneData = await cloneRes.json();
                    const cloneOut = cloneData.output || cloneData;
                    if (cloneOut.result && cloneOut.result.unlicensed) {
                        showUnlicensedPopup('This repository is unlicensed! Do not use it.', remoteTarget);
                        editor.value = "// This repository is unlicensed! Do not use it.";
                        return;
                    }
                    if (!cloneOut.result || !cloneOut.result.ok) {
                        editor.value = "// Error al clonar: " + ((cloneOut.result && cloneOut.result.raw_output) || cloneOut.error || 'falló');
                        return;
                    }
                    currentInspectedRepo = cloneOut.result.repo_name || localName;
                    res = await fetch('/api/repo/tree?repo=' + encodeURIComponent(currentInspectedRepo));
                    data = await res.json();
                }
                
                if (!data.ok) {
                    editor.value = "// Error: " + (data.error || "No se pudo leer el repositorio");
                    return;
                }

                currentRepoTree = data.tree || [];
                selector.innerHTML = '<option value="">📁 Selecciona un archivo por carpeta...</option>';

                currentRepoTree.forEach(item => {
                    if (item.type === 'file') {
                        const opt = document.createElement('option');
                        opt.value = item.path;
                        opt.textContent = "📄 " + item.path + " (" + item.size_formatted + ")";
                        selector.appendChild(opt);
                    }
                });

                if (selector.options.length > 1) {
                    selector.selectedIndex = 1;
                    await loadSelectedRepoFile(selector.value);
                } else {
                    editor.value = "// Repositorio vacío o sin archivos de código visibles.";
                }
                schedulePersistPlatformState();
            } catch (err) {
                console.error("Error al cargar repositorio:", err);
                editor.value = "// Error al conectar con el servidor.";
            }
        }

        async function loadSelectedRepoFile(filePath) {
            if (!filePath || !currentInspectedRepo) return;
            const editor = document.getElementById('functionEditor');
            const pathInfo = document.getElementById('repoFilePathInfo');
            
            pathInfo.textContent = currentInspectedRepo + " / " + filePath;
            editor.value = "// Cargando código de '" + filePath + "'...";
            currentInspectedFile = filePath;

            try {
                const res = await fetch('/api/repo/file?repo=' + encodeURIComponent(currentInspectedRepo) + '&path=' + encodeURIComponent(filePath));
                const data = await res.json();
                if (data.ok) {
                    editor.value = data.content;
                    schedulePersistPlatformState();
                } else {
                    editor.value = "// Error: " + (data.error || "No se pudo leer el archivo");
                }
            } catch (err) {
                console.error("Error al leer archivo:", err);
                editor.value = "// Error de lectura.";
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

        function openPlatformGateway() {
            window.open('/gateway', '_blank', 'noopener');
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
            document.getElementById('gatewayOpenReceiveBtn').addEventListener('click', () => {
                const url = lastCode ? ('/gateway?code=' + encodeURIComponent(lastCode)) : '/gateway';
                window.open(url, '_blank', 'noopener');
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

        function openUbuntuCli() {
            const url = '/ubuntu';
            const features = 'noopener,noreferrer,width=1100,height=720';
            const win = window.open(url, 'l8-ubuntu-cli', features);
            if (!win) {
                // fallback si el popup está bloqueado
                window.location.href = url;
            } else {
                try { win.focus(); } catch (e) {}
            }
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
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: cmd })
                });
                const result = await res.json();
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
            const drawer = document.getElementById('functionDrawer');
            const vk = document.getElementById('virtualKeyboard');
            
            if (!drawer.classList.contains('open')) {
                drawer.classList.add('open');
            }
            
            vk.classList.toggle('active');
            if (vk.classList.contains('active')) {
                if (!activeInputTarget) activeInputTarget = document.getElementById('cmdInput');
                activeInputTarget.focus();
            }
        }

        function toggleFunctionDrawer() {
            const drawer = document.getElementById('functionDrawer');
            drawer.classList.toggle('open');
            if (drawer.classList.contains('open')) {
                const funcEdit = document.getElementById('functionEditor');
                funcEdit.focus();
                activeInputTarget = funcEdit;
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

        connectSSE();
    </script>
    </div><!-- /.platform-shell -->

    <script>
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

            function enterPlatform() {
                if (!finished) return;
                if (blackholeInstance && blackholeInstance.stop) blackholeInstance.stop();
                overlay.classList.add('hidden');
                document.body.classList.remove('boot-locked');
                try { sessionStorage.setItem('l8_boot_cli_done', '1'); } catch (e) {}
                // Restaurar catálogo / último comando / inspector desde Supabase
                if (typeof restorePlatformState === 'function') {
                    restorePlatformState();
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
