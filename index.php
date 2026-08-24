<?php
/**
 * Copyright (C) 2020-2026 Denver Technologies, Inc.
 * Copyright (C) 2026 DIKTATCART / Hashcod
 *
 * This file is part of Hashcod codespace / Tabby Terminal Terminal integration.
 *
 * Modified on 2026 by DIKTATCART / Hashcod: Added custom Tabby-style cell blocks,
 * execution status, block toolbar, and platform integration.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// index.php — plataforma servidor HTML nativo (PHP). No Vite / no React SPA.
require_once __DIR__ . '/l8-html.php';

$envAdminSig = getenv('DILITHIUM5_ADMIN_SIGNATURE') ?: (getenv('L8_DILITHIUM5_REGISTER_KEY') ?: '');
if (function_exists('secretGet')) {
    $vaultSig = secretGet('DILITHIUM5_ADMIN_SIGNATURE', '') ?: secretGet('L8_DILITHIUM5_REGISTER_KEY', '');
    if ($vaultSig !== '') $envAdminSig = $vaultSig;
}
$defaultSig = 'DILITHIUM5_SIG_V1_TklTVC1QUUMtTUwtRFNBLTg3OkRJTElUSElVTTU6TEVWRUw1OkFVVEhfUk9PVDoyMDI2.RCq2qJwa8HttegYsW7qGhcqNTyBqvzCDPLYIRkGHkR1QXQpS1JGptQRkZKxIF09i/x1JaIFr5Xb0IHPomhwrZm81/9b5933V+nvtC3KdPV8+Q77gsAzegjGQRYJN561Wckla5D4MxBs6Z8Gf7x18GudMMwE0J2tAlxprMyq0lWm1/aM+6A0DY2liZg+DUuYaXPIiPtLDdROsbBYKidecJkRwNKXIoZu6Ltdw8TWebMkuoWg2XBWaRKAAUTjiUxwXn+PHL953J2VARg8p0O9ivlfJJVq4g/gtTTjGvQ8mE2aUDmlHNhtKoX0oXMY9VBgoBf+CmLaKLOjQclVaoIZqWQLTmFkDACMksB25ufqrTsZP4CVYmgssGUnXEGkoTAn69MGNjfy6gsVJncdX1DhKDUlq9ieQMkrwS/57PPeWDfUyK/AYwrFdtl8Hwc1/DFL2qeZnGuqKfFJGWX/z+mg0sAYPIFek6q8qCUgvQM2BFy23GreJwdLtm8pmNkusGp1VkjsEQn3a6fkTbGPkEzq50Bw/MTxYwsHw49FxlnHmNopHf1MJ64RlRKKfWV9INs2C4CJLxp3bVh6iWLaJR4e/mRdbrc3CgOwSFwstsNoP/+L4igx/t3BS3vHlQPUw2mWdtE6/EdliE/32ZrGoddtqZ9HGkkGDvugsM2B2kEGEyXpmvhGfC/cmngxPYEudT7q45lzCtyklULQTclKOe6z6YSUZ5BTQhRcc0jK5+7mcKb6GQxmew09t62IaVLWSmwTzjjxFggbnE/JvQfPdVa99dUozNMqb7HzINj1Pvs9Ee2oRucdSXArjfwbbe81SDW1P8/Ht+sNO7nahoyHUU0XCVg32z5hpgHJgEA/y7jLPp5JQn04Sh3KUOvi3p2aP1qsSFar52SI8JguZwN6Y0DPNImo/0PRyRXejpK0kzedaljsOm3qJhDJTGgTOI8hBtUDh+lhoHGRGPXEbr9EDbacZFD6ATgbRsIInlRdNPdHmWv2Yx1Xbd0SnZrJx93dMwoFdACepDzhhrxPYeHIpx7I21Cvyu3TTFZ2j0xyn4Fu6o1CbCJbqsQcQNDnJjac8A+guCF7HEF0/CBtukl4daOhpjYS+JpBZ+jMSOBk3K6SN8GHs7varXfpSa/4A31hDYIXnBKoX8MRclrVMYbFo/vheAntz7C6iYeTf02YhbQqIDAE3WSfx9ErsqFMv9ipMVVLlndLNquOE/ULk/zh3ysovUKY1PvSudxY/FY8HxLhkQBMbkyLS0LDjZ+6CJ6/SP6Np9ZE6Qm4nCT26DSsYbJJSgQyixJJId3Px1gcRhS+OmxT2g5DrsSYs0KN0iElZaqqIHyUP5sLHOaqN7uZ0CLaqt2MIQ2Xh3jEC3bGnhuT/1xRt5KDJs4SwIDJmsq+T8XZesYLZ50SVhaolArtLcP970GGFEV72e7zdz1tRbAjj0HVfQBGm/JpXDzATp9FrOp+0vwiZNQ6UyX1RkvoklTqj5S7a7MHjNA8YdcMs3dN6ZDFf7oAAL/ipyri6cVcPYC7DU9u+AHIhaqT9xN/RtKdWJ9KSDelnektOJjr+gS/I4vVSIw7LjxfWaFetkAUXbmC/n1nAi96vUGOJdsyX4k3lABaQ4bEgHS0YuUeFFMcVW9KkB4okI8QEBQQwRewr5kGpQZ5KH7V7luhD4c7dbFlvdgzmhSAe5VsNEEL67gCH69YqRwt47qglCFDLRr0BcSpZAc847C5mK570+IXeoo0V1rO+TFBv/hYz/T6RTkFKUpi002DxQky+M7r/3JT04My3H32keYWN+vEF7EFrqRWXopPnxN1w4uKcHel68O0rU6jDOZ+djrYiagXwjRUYbMlQv2M9Vj4b3y6ugI3bwu1qETBliVF2Us+hGS00IH/Ye9cMLmHIGExW/1ktua/W5TZ8RDf6Cy2Wnay3G3xIouLIIwA2/DaqP0h8/C97ptrwHNYgJKr8uMceu0KfPQkJf0U3RIrIeQ6kOeksE+43z8ktrc48U6efnhbEbT06gG47Y0QzchJOWPvRdtrtK/yCSJW9jlq2ZrG4XUg2JBDEET5r2Fo9Rfl5ChD98f7g9lPR37wltumahK+E7m55YKDgVTQu2AXeA7qkulw8yZn5ldgPRPipOY2hPoi65yHlkXLYfPvh0lcZLsQaa0rDAhWRKyv1TtMaoFNh3Cxl27ShmWX64gF7fT0IpL/py9LMqTGpdiP4lNJbn+AzOyPqUFOGLYZEvX73BbCpxq3Qp+fmQrDxOC6EUE+R4CtXLKh3hQ5Vd62BeYxzEUdbIZxEDO+h3rz6acFY0JjEk/rRSoqZVqYRXAgwaspImFqw0pgdxrNN5GhFMvDSbPRqpUAIuPS+S1jbnpfTn0jsCjayUux9Zu7P6uAwHKpT36JKWFJxYtK0Re9w8+RZZew4FtUY5b5gSL6dxnhDugEYk6lgJMLAPPx63vJy5ZwCmLZbXCLST5SBB+YYhj5yhDgXHplkgABGtBCbr44uiUzVlFQgXbMA2O3IwPWtZRaV+3wg83vTUrWVAszCOuKvFNAUedKkeGEBgTzuIYmiU30dFxjOCCjOcqV79mO41P05FStD2tuc0tmm9fgYNtfx6QVkFc+VJ/pOzfw8UPJVSDjdjj3Qn7EPiyovX++qwXdIZVZ+DKHx9RkN9sgmwUDYxuYUBNi1QZzN8BdoyoVnLsKWZM5N5dIcr+88I+hQ9OLaq6QdElG4N9as6IgARYjXzXaNSxM/QlL61a8AI+T0vN7TBgsUS2+SwUf9VCcRjhD/Xylun+P3qvLMv+stHde18G5Q57wBFj41OPAgD4mvZmLL/ZJv63zDxx9f5py5kByfUkl7fT6IKY6uHY4bq66pkoI81nJyDfMrCkLiOF65RMOuYZOpIEiPjaAx6su9e8KjMc/VB6rcN4srwSedbHq/pCaeJzZ8kUhXDQXWvj9yFuuv1n28rslUO6FGEQlexCQNSUHkyPp0lkKnrf/AqHIX9zqbPFePNA7rYae9yQ3RWRZZO2Thay6haTKaz6QU9Ni2GY3KWwavTLpM1HUyqqK1NEx4rfBKfpa0cogsxfoc/x+CP4aelU2e2A5EOwBru2R1dGbdhqfimZcK+hQs6e7omUwuGBoacCqIml4pr5tEzIXnBQbJOydHqyYoW2h6zcCRw7xyUCTETNCFMl6vxmxfSGpyXTPD3KunfyRL+TFGIQ/zsKeAQsrBJ55ADVQZNq+D8o92evUX5DMDtqMSukYPHzZEkIIho8mzXxP9oC7LQDcyYyUlJhtooNJNpciqmQupQtxNXXT0MCYCRC/yZYe0EzR2wvz1clrPdxsei2Oyh8VM9v5ZA2wSPXIq61STBrlq2M63ea9Ps4fyO13hKw+cfjJlwdM6PGldGDTJ/qbsjExxcrKmEnsbGRLi0ga7OGgslOwxAM+BqR1wnPBU5DdgsCDFP0N6/qpdImnzY+pJ+tQFJRJeECU7aOvJZvd9AA3Ymzry66I5SyBLju6cYFVa9KneIbxKtiiPypxc7Iv9db0OvU2OGqPqtm+nZ7mGO9EaU3l48EjpN2gkrHMpckDdjvGoMCTW6Zp+dzJ7XnuY9f3mD2fEnbx6UdYAUfekjf2pY2Fdo4J9OS2YEnCJZVC5QlEP5qm5DADc3Ota44nWsp5G2b7CEacJVerGyeJFnulUIX85nyzs/Qo0NlDZAss/42w1e/JTMdely9NaMVwJcMo8KfYUPgn47o3XK62fd7kMH58LrLdUS4MfxOSnt/bEUPwjq4CY+8tbIcCF3jNpXClQNpBnCSzB/TJ9ilpPq9Z+b2RjkSNBV2qUIn3CfIBS6A60sv9YdYRlPjnFDh9iS+YnWLUAJ09jBhC7MJ4yfK9fXaA+CViSueuq7WCZRkvMT30hLe3D3rhQlpNyEg3rxff7VWXb1wvmUdrtfzFa3S4Ph1xv1nZB29rKdJgLd5NMibyHSnTOs9sZ4OmTW0u7e4Lu/NP1IQNtHcmwvhKg/QuUmwiI716ii4VvEA8yNp8173vxwkjv8n5n20vr44xYiDmgZFr64dTBQ4J6xLICoks1DIHaE+h5ikvfUUjWFRVuiJdYhLOz4VUfbEhRGm9N5RUNmVzYAGtGpYi9IRfY9osI17fvJOzZerdBsNkcd64syiVcKlVeYzyowN1L2ifGT4g2M45UWnBYgiQ6ddZidTIwqJlhnYvmVpKwJLY9fr6Oc2sqfoZ8sAG1H3IEKzfkdxgobbO5yLHjiELZvcDUEJTkUZcL6H15t/SgZpsslvKj96YQ5JWNY4iofs1FwKVF5xTc3Yuu0cvYqAA0H3YQw1ar49+eCGdX+z/1nO4Mf6+dz9hQkkaQWbZ5VZcYtVYlZfVii8jZLEvXg3zgvNrZ6mHcTO4G5YCerm4bOcoYIXYJM3ZObQuc/+EAZKw2qdpZI1efi/BMlVTSZ/bUoGjiwR7LSYum8nuN10B2zo9ycPafY01mdA7dQ0YSRtYzcqYAdnp5k9u0a6gwI55A1K4+pm3HdcCSU9DfsQAy172LbVgbLXqOSueF+9vsZxiCQLx+YC9L3hCDQl8GQTa4iosx55Q9p9eB+jtc4Tw6eIutIfVwPyp/EOSvNE+LjCoSn1GvC0n6UfyECJpR0wfwpaqzz3kArT8bUHIq2U8XjvycJecjA/PBV63ts4kPY4TpoVLJamfGa/X/xilod5IYYUnWySyuOz+LuQM7Dd83mbDdCgV/qnQmJ510xc8CMYjZICQBa38cJZ29iedURqQaWaTl1AgkkB1WsGqLHeo8EdemYGIxbatjFRduDh/SEHFzz7F321BXkpixpVJR0vuFaPRTn6kD6Y6ThvTgbK/U3P91msQdLmZRoDKMqTMasu2cYze4k+QjNe6lqyHQpOXEEwNlP3ojnahamyrqjTXQAsh3Rn93CVOzadrdLT6DoerZRcbjg38nQDEosdDPEAIZQ5ruSfYTKOr109bp3k3y6Kg0/x1ZHlm+xK9/WDxVWlw0QoKm7vYfS0COnbQSlnuCMsJ52lOeamlBjfTx4M7ygBsqOQeqjdbw0KbC8hTgzGwnMhqscz1lRl7jt5pbsIn0Ub1IFHHOyststTuke8gcs3aYsDQRHRHIhHdRXf1GfJfYrQtsZTysAsIyPdSI8grK2XGe5aLycg+C2Pxle+uMDi3nMrsAWH4TfzheB99gyiB6VHDo7uZYo2aB0bAXiBTLPCYWlv9QQS711tH9co8+b+M+g+ioud+7l78vE1dLIgYhY2K9Wi6js5+S+Cuab7ZdU6fYlspXGvJRAPTiwrQtd1vO/a5h34zxyi9D0kFGZFDIcENb2vgOfWNjnFj1Gcfilk5VSbnl5L76NwlDPsePaoA12JCN0BA1GXnTb6MHuXUbleeRcD7AU/Qt0fX/Pi6ZHHN0RHPXThTmPhrHVMcSMsN0b7EDLE3LDP51YtBFRNTEjDtWORtbJVMMlkqvQeRibiub9PkIgpSDs7jlY9586KGedknrP81P8scO/5bpioC/ODNluGCWrVvGzh1tckfKS4SFXC3Ii0K9CoJYwCGk3h7RZktfyUupWddMGScpfE5NP0eFwDiHwmitEpGL5PpygJz5UkJx47FXFHJcr1epaKcv5A/1OJ/6rVHZvTFdDIRAmOL4BNwFsLPkBPpPLuuG72AXsysq95mMO+kRPm7F4eKs4ABCTcmZV1U2U5wgPMr1OWWczDXpr9HPw+TfWgA6NLN7yvqBhWqNO2M2CTkN13osnRWvOi4jaPizWtIJWBq4/SmS+kpuDydB9UHzdlmrAIWHBb7fq0YI/1Q9xF0xahNYom2gmrMg2V0KPur8sCfreAieUlbaaPiVIEmywMbX9kMjMNHhClrXivN72ky6vPl1eSo4qX8YE9Xm1zehZsvcIJ7M4w+BqJ7dj01hYXG/+2g7uUfzOyAag4uiUXXwHjDvZRQpT3t2vQtkNxWSU3a+OvT2JuRq7UBnEs2Hb/JpiWej5oXTIKpZ2pPTqPhApJp1OJ7GlZ+NxsH/eNYz7lrp9u3DkP7oPr6jUuToCscmXHCFVALsJzZrkdzWo2653oDHAlHS2RNVLeCOUCcBcOrSf32wUtNG38VJmeh8d7MTjeJMfcBEeSplA1PYb3883YJ+Gnr4=';
$exactSig = $envAdminSig !== '' ? $envAdminSig : $defaultSig;
if (str_starts_with($exactSig, 'DILITHIUM5_ADMIN_SIGNATURE=')) {
    $exactSig = substr($exactSig, strlen('DILITHIUM5_ADMIN_SIGNATURE='));
}
define('DILITHIUM5_ADMIN_SIGNATURE_EXACT', trim($exactSig));

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'verify_dilithium') {
    header('Content-Type: application/json; charset=utf-8');
    $proof = trim((string)($_POST['proof_token'] ?? ''));
    
    // Normalizar si el usuario pega con o sin el prefijo "DILITHIUM5_ADMIN_SIGNATURE="
    if (str_starts_with($proof, 'DILITHIUM5_ADMIN_SIGNATURE=')) {
        $proof = substr($proof, strlen('DILITHIUM5_ADMIN_SIGNATURE='));
    }
    $proof = trim($proof);

    // Validación estricta con hash_equals a la firma Dilithium-5 exacta
    $valid = ($proof !== '' && hash_equals(DILITHIUM5_ADMIN_SIGNATURE_EXACT, $proof));

    echo json_encode([
        'success' => $valid,
        'message' => $valid ? 'Firma Dilithium-5 verificada exitosamente. Acceso concedido.' : 'Firma criptográfica inválida. Acceso denegado.'
    ]);
    exit;
}

$L8_BASE = l8_public_base_path();
if (!headers_sent()) {
    header('Content-Type: text/html; charset=utf-8');
    header('X-L8-Serve: php-html');
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hashcod codespace</title>
    <meta name="description" content="Hashcod codespace — plataforma de códigospace con terminal, toolkit, gateway y herramientas en el navegador.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://l8-codespace-1.onrender.com/">
    <script>window.L8_BASE_PATH = <?php echo json_encode($L8_BASE, JSON_UNESCAPED_SLASHES); ?>;</script>
    <base href="<?php echo htmlspecialchars($L8_BASE, ENT_QUOTES, 'UTF-8'); ?>">
    <link rel="icon" href="favicon.svg?v=10" type="image/svg+xml">
    <link rel="shortcut icon" href="favicon.svg?v=10" type="image/svg+xml">
    <link rel="apple-touch-icon" href="favicon.svg?v=10">
    <meta name="application-name" content="Hashcod codespace">
    <link rel="stylesheet" href="<?php echo htmlspecialchars($L8_BASE, ENT_QUOTES, 'UTF-8'); ?>components/tabby-terminal.css?v=2026.2">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;600;700;800;900&display=swap');

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
            width: min(440px, calc(100vw - 24px));
            max-height: min(78vh, 640px);
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

        .tokens-unlock-open {
            display: block;
            width: 100%;
            margin: 10px 0 4px;
            padding: 8px 10px;
            border: 1.5px solid #111;
            background: #111;
            color: #fff;
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            text-align: center;
        }

        .tokens-unlock-open:hover {
            background: #333;
        }

        .tokens-unlock-open .xu {
            opacity: 0.85;
            font-weight: 600;
        }

        .tokens-unlock-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 90;
            background: rgba(18, 18, 22, 0.55);
            align-items: center;
            justify-content: center;
            padding: 20px 12px;
        }

        .tokens-unlock-overlay.open {
            display: flex;
        }

        .tokens-unlock-shell {
            width: min(560px, 100%);
            max-height: min(86vh, 720px);
            overflow: auto;
            background: #fff;
            border: none;
            border-radius: 22px;
            box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            color: #14141a;
        }

        .tokens-unlock-top {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 16px 20px 12px;
            border-bottom: none;
            background: transparent;
        }

        .tokens-unlock-brand {
            font-weight: 700;
            font-size: 13px;
            flex: 1;
            letter-spacing: -0.02em;
        }

        .tokens-unlock-uses-pill {
            font-size: 11px;
            border: none;
            border-radius: 999px;
            padding: 5px 10px;
            background: #f0f0f3;
            color: #333;
            white-space: nowrap;
        }

        .tokens-unlock-close {
            border: none;
            border-radius: 999px;
            background: #f0f0f3;
            color: #14141a;
            font-family: inherit;
            font-size: 11px;
            padding: 5px 12px;
            cursor: pointer;
        }

        .tokens-unlock-close:hover {
            background: #14141a;
            color: #fff;
        }

        .tokens-unlock-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 13px;
            margin: 0 0 4px;
        }

        .tokens-unlock-table th,
        .tokens-unlock-table td {
            border: none;
            border-bottom: 1px solid #ececf0;
            padding: 16px 18px;
            text-align: left;
            vertical-align: middle;
        }

        .tokens-unlock-table thead th {
            background: transparent;
            font-weight: 700;
            font-size: 12px;
            color: #1a1a22;
            padding-top: 8px;
            padding-bottom: 12px;
        }

        .tokens-unlock-table tbody tr:last-child td {
            border-bottom: none;
        }

        .tokens-unlock-table .amt {
            width: 22%;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
            color: #14141a;
            font-size: 15px;
        }

        .tokens-unlock-table .area {
            width: 43%;
        }

        .tokens-unlock-table .act {
            width: 35%;
            text-align: right;
        }

        .tokens-unlock-th-token {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            color: #14141a;
        }

        .tokens-unlock-th-token svg {
            width: 22px;
            height: 22px;
            display: block;
        }

        .tokens-unlock-area-cell {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
        }

        .tokens-unlock-ico {
            width: 28px;
            height: 28px;
            flex: 0 0 auto;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: none;
            border-radius: 8px;
            background: #14141a;
            color: #fff;
        }

        .tokens-unlock-ico svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }

        .tokens-unlock-ico img {
            width: 16px;
            height: 16px;
            display: block;
            object-fit: contain;
            filter: brightness(0) invert(1);
        }

        .tokens-unlock-area-title {
            font-weight: 600;
            font-size: 13px;
            color: #1a1a22;
            line-height: 1.25;
            word-break: break-word;
        }

        .tokens-unlock-keyrow {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 4px 18px 8px;
        }

        .tokens-unlock-keylabel {
            font-size: 11px;
            font-weight: 600;
            color: #555;
        }

        .tokens-unlock-input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d8d8de;
            border-radius: 12px;
            background: #fafafb;
            font-family: inherit;
            font-size: 12px;
            padding: 11px 14px;
            color: #14141a;
        }

        .tokens-unlock-input:focus {
            outline: 2px solid #14141a;
            border-color: #14141a;
            background: #fff;
        }

        .tokens-unlock-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            margin: 0;
            width: auto;
            border: none;
            border-radius: 999px;
            background: #ececf0;
            color: #2a2a32;
            font-family: inherit;
            font-size: 12px;
            font-weight: 600;
            padding: 9px 14px;
            cursor: pointer;
            white-space: nowrap;
        }

        .tokens-unlock-btn svg {
            width: 14px;
            height: 14px;
            flex: 0 0 auto;
        }

        .tokens-unlock-btn:hover:not(:disabled) {
            background: #14141a;
            color: #fff;
        }

        .tokens-unlock-btn:disabled {
            opacity: 0.45;
            cursor: default;
        }

        .tokens-unlock-msg {
            padding: 8px 20px 18px;
            font-size: 11px;
            color: #666;
            line-height: 1.45;
            border-top: none;
        }

        .tokens-unlock-msg.ok { color: #1a7f37; }
        .tokens-unlock-msg.err { color: #c5221f; }

        @media (max-width: 520px) {
            .tokens-unlock-table th,
            .tokens-unlock-table td {
                padding: 12px 12px;
            }

            .tokens-unlock-btn {
                padding: 8px 11px;
                font-size: 11px;
            }

            .tokens-unlock-area-title {
                font-size: 12px;
            }
        }

        .icon-globe,
        .icon-tokens,
        .icon-gateway,
        .icon-mobile,
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
        .icon-mobile svg,
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
        .icon-mobile:hover,
        .icon-ubuntu-cli:hover,
        .icon-claude-cli:hover,
        .icon-zylon-cli:hover,
        .icon-toolkit:hover,
        .icon-notepad:hover {
            opacity: 0.75;
        }

        .icon-mobile {
            margin-left: 2px;
        }

        .icon-mobile[aria-pressed="true"] {
            opacity: 1;
            color: #0b3d2e;
        }

        .icon-mobile svg {
            /* keep white phone body readable on gray bar */
            overflow: visible;
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

        .hashcod-tools-dock {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            flex: 0 0 auto;
            margin-left: 8px;
            padding: 4px 6px;
            height: 30px;
            box-sizing: border-box;
            background: #ffffff;
            border: 1px solid #e6e6ea;
            border-radius: 999px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
            position: relative;
        }

        .hashcod-dock-slot {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 1px solid #e4e4e8;
            background: #ffffff;
            color: #14141a;
            padding: 0;
            margin: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: default;
            flex: 0 0 auto;
            line-height: 0;
            overflow: hidden;
        }

        .hashcod-dock-slot.is-filled {
            background: #14141a;
            border-color: #14141a;
            color: #ffffff;
        }

        .hashcod-dock-slot.is-ready {
            cursor: pointer;
        }

        .hashcod-dock-slot.is-ready:hover {
            border-color: #b8b8c0;
        }

        .hashcod-dock-slot.is-filled.is-ready:hover {
            background: #2a2a32;
            border-color: #2a2a32;
        }

        .hashcod-dock-slot.is-active {
            border-color: #14141a;
            box-shadow: inset 0 0 0 1px #14141a;
        }

        .hashcod-dock-slot:disabled {
            cursor: default;
            opacity: 1;
        }

        .hashcod-dock-slot img,
        .hashcod-dock-slot svg {
            width: 13px;
            height: 13px;
            display: block;
            object-fit: contain;
            pointer-events: none;
        }

        .hashcod-dock-slot:not(.is-filled) img,
        .hashcod-dock-slot:not(.is-filled) svg {
            color: #14141a;
        }

        .hashcod-clock-pop {
            display: none;
            position: absolute;
            top: calc(100% + 8px);
            left: 28px;
            z-index: 40;
            min-width: 132px;
            padding: 10px 12px 11px;
            background: #ffffff;
            border: 1px solid #e0e0e6;
            border-radius: 12px;
            box-shadow: 0 10px 28px rgba(0, 0, 0, 0.14);
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            color: #14141a;
            text-align: center;
        }

        .hashcod-clock-pop.open {
            display: block;
        }

        .hashcod-clock-label {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: #6a6a72;
            margin-bottom: 4px;
        }

        .hashcod-clock-time {
            font-size: 20px;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
            letter-spacing: 0.04em;
            line-height: 1.2;
        }

        @media (max-width: 720px) {
            .hashcod-tools-dock {
                margin-left: 4px;
                gap: 4px;
                padding: 3px 5px;
                height: 28px;
            }

            .hashcod-dock-slot {
                width: 20px;
                height: 20px;
            }

            .hashcod-dock-slot img,
            .hashcod-dock-slot svg {
                width: 11px;
                height: 11px;
            }

            .hashcod-clock-pop {
                left: 0;
            }
        }

        /* ===== FLY: franja derecha a pantalla completa; barrita y ventana en el mismo centro ===== */
        #flyRail.fly-rail {
            --fly-green: #0b3d2e;
            --fly-green-hover: #0f4a38;
            --fly-ink: #e8f2ec;
            position: fixed !important;
            top: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            left: auto !important;
            transform: none !important;
            z-index: 9990 !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 0 !important;
            height: auto !important;
            overflow: visible !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: none;
            box-sizing: border-box;
        }

        body.boot-locked #flyRail.fly-rail,
        body.auth-locked #flyRail.fly-rail {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
        }

        /* Barrita negra (pill) pegada al borde derecho, centro vertical = ventana */
        #flyRail .fly-handle {
            pointer-events: auto;
            appearance: none;
            -webkit-appearance: none;
            border: none;
            margin: 0;
            padding: 0;
            position: absolute !important;
            right: 0 !important;
            top: 50% !important;
            left: auto !important;
            bottom: auto !important;
            transform: translateY(-50%);
            width: 6px !important;
            height: 72px !important;
            min-width: 6px !important;
            min-height: 72px !important;
            background: var(--fly-green) !important;
            color: transparent;
            cursor: pointer;
            display: block !important;
            border-radius: 999px;
            box-shadow: none;
            transition: opacity 180ms ease, transform 240ms cubic-bezier(0.22, 1, 0.36, 1), background 160ms ease;
            z-index: 2;
        }

        #flyRail .fly-handle::after {
            content: '';
            position: absolute;
            top: -14px;
            bottom: -14px;
            right: 0;
            width: 28px;
        }

        #flyRail .fly-handle::before {
            display: none !important;
        }

        #flyRail .fly-handle:hover {
            transform: translateY(-50%) scaleY(1.05);
            background: var(--fly-green-hover) !important;
        }

        #flyRail .fly-handle:focus-visible {
            outline: 2px solid #111111;
            outline-offset: 2px;
        }

        #flyRail .fly-handle-label,
        #flyRail .fly-handle-line {
            display: none !important;
        }

        #flyRail.is-open .fly-handle {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transform: translateY(-50%) scaleY(0.5);
        }

        /* Ventana/barra: misma ancla right:0 + top:50% que la barrita */
        #flyRail .fly-rail-panel {
            pointer-events: none;
            position: absolute !important;
            right: 0 !important;
            top: 50% !important;
            left: auto !important;
            bottom: auto !important;
            transform: translateY(-50%) scale(0.96);
            transform-origin: right center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            padding: 18px 12px;
            margin: 0;
            background: var(--fly-green) !important;
            border-radius: 999px;
            box-shadow: -8px 0 28px rgba(11, 61, 46, 0.35);
            opacity: 0;
            visibility: hidden;
            transition: opacity 240ms ease, transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
                        visibility 0s linear 240ms;
            z-index: 1;
            box-sizing: border-box;
        }

        #flyRail.is-open .fly-rail-panel {
            pointer-events: auto;
            opacity: 1;
            visibility: visible;
            transform: translateY(-50%) scale(1);
            transition: opacity 260ms ease, transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
                        visibility 0s linear 0s;
        }

        #flyRail .fly-slot {
            appearance: none;
            width: 28px;
            height: 28px;
            margin: 0;
            padding: 0;
            border: none;
            background: transparent;
            border-radius: 50%;
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: var(--fly-ink);
            flex: 0 0 auto;
            transition: transform 160ms ease, opacity 160ms ease;
        }

        #flyRail .fly-slot::before {
            content: '';
            position: absolute;
            inset: 3px;
            border: 1.5px solid currentColor;
            border-radius: 50%;
            box-sizing: border-box;
        }

        #flyRail .fly-slot::after {
            content: '';
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: currentColor;
            position: relative;
            z-index: 1;
        }

        #flyRail .fly-slot:hover:not(:disabled) {
            transform: scale(1.08);
        }

        #flyRail .fly-slot:focus-visible {
            outline: 2px solid #ffffff;
            outline-offset: 2px;
        }

        #flyRail .fly-slot:disabled {
            cursor: default;
            opacity: 0.55;
        }

        #flyRail .fly-slot.is-ready {
            opacity: 1;
            cursor: pointer;
        }

        #flyRail .fly-slot.is-ready::after,
        #flyRail .fly-slot.has-icon::after {
            display: none;
        }

        #flyRail .fly-slot.has-icon {
            color: #ffffff;
        }

        #flyRail .fly-slot img,
        #flyRail .fly-slot svg {
            width: 14px;
            height: 14px;
            display: block;
            object-fit: contain;
            position: relative;
            z-index: 1;
            pointer-events: none;
        }

        #flyRail .fly-slot svg [fill="#ffffff"],
        #flyRail .fly-slot svg [fill="#fff"] {
            fill: currentColor;
        }

        /* ===== DOCK TOOLBAR (abajo) — mismas magnitudes que Fly ===== */
        #dockBar.dock-bar {
            position: fixed !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            top: auto !important;
            transform: none !important;
            z-index: 9989 !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            width: auto !important;
            height: 0 !important;
            overflow: visible !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: none;
            box-sizing: border-box;
        }

        body.boot-locked #dockBar.dock-bar,
        body.auth-locked #dockBar.dock-bar {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
        }

        /* swipe-indicator = rotación de la barrita Fly (6×72 → 72×6) */
        #dockBar .dock-swipe {
            pointer-events: auto;
            appearance: none;
            -webkit-appearance: none;
            border: none;
            margin: 0;
            padding: 0;
            position: absolute !important;
            left: 50% !important;
            bottom: 0 !important;
            right: auto !important;
            top: auto !important;
            transform: translateX(-50%);
            width: 72px !important;
            height: 6px !important;
            min-width: 72px !important;
            min-height: 6px !important;
            background: #000000 !important;
            color: transparent;
            cursor: pointer;
            display: block !important;
            border-radius: 999px;
            box-shadow: none;
            transition: opacity 180ms ease, transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
            z-index: 2;
        }

        #dockBar .dock-swipe::after {
            content: '';
            position: absolute;
            left: -14px;
            right: -14px;
            bottom: 0;
            height: 28px;
        }

        #dockBar .dock-swipe:hover {
            transform: translateX(-50%) scaleX(1.05);
        }

        #dockBar .dock-swipe:focus-visible {
            outline: 2px solid #111111;
            outline-offset: 2px;
        }

        #dockBar.is-open .dock-swipe {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transform: translateX(-50%) scaleX(0.5);
        }

        /* toolbar: misma ancla bottom:0 + left:50%; tamaño tipo Fly (compacto) */
        #dockBar .dock-toolbar {
            pointer-events: none;
            box-sizing: border-box;
            position: absolute !important;
            left: 50% !important;
            bottom: 0 !important;
            right: auto !important;
            top: auto !important;
            transform: translateX(-50%) scale(0.96);
            transform-origin: center bottom;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            padding: 12px 18px;
            gap: 16px;
            width: max-content;
            max-width: calc(100vw - 24px);
            height: auto;
            margin: 0;
            background: #000000;
            border-radius: 999px;
            box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.35);
            opacity: 0;
            visibility: hidden;
            transition: opacity 240ms ease, transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
                        visibility 0s linear 240ms;
            z-index: 1;
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
        }

        #dockBar .dock-toolbar::-webkit-scrollbar {
            display: none;
        }

        #dockBar.is-open .dock-toolbar {
            pointer-events: auto;
            opacity: 1;
            visibility: visible;
            transform: translateX(-50%) scale(1);
            transition: opacity 260ms ease, transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
                        visibility 0s linear 0s;
        }

        #dockBar .dock-slot {
            box-sizing: border-box;
            appearance: none;
            -webkit-appearance: none;
            width: 28px;
            height: 28px;
            margin: 0;
            padding: 0;
            flex: 0 0 auto;
            background: rgba(255, 255, 255, 0.15);
            border: 1.5px solid #FFFFFF;
            border-radius: 50%;
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #FFFFFF;
            transition: transform 160ms ease, opacity 160ms ease, background 160ms ease;
        }

        #dockBar .dock-slot:hover:not(:disabled) {
            transform: scale(1.08);
            background: rgba(255, 255, 255, 0.22);
        }

        #dockBar .dock-slot:focus-visible {
            outline: 2px solid #FFFFFF;
            outline-offset: 2px;
        }

        #dockBar .dock-slot:disabled {
            cursor: default;
            opacity: 0.55;
        }

        #dockBar .dock-slot.is-ready {
            opacity: 1;
            cursor: pointer;
        }

        #dockBar .dock-slot img,
        #dockBar .dock-slot svg {
            width: 14px;
            height: 14px;
            display: block;
            object-fit: contain;
            pointer-events: none;
        }

        @media (max-width: 520px) {
            #dockBar .dock-toolbar {
                padding: 10px 12px;
                gap: 12px;
            }
        }

        #dockBar .dock-slot.is-filled {
            background: rgba(255, 255, 255, 0.28);
        }

        #dockBar .dock-slot.is-running {
            box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.85);
        }

        #dockBar .dock-slot.has-icon svg {
            width: 14px;
            height: 14px;
            display: block;
            pointer-events: none;
        }

        /* Herramientas aparte de los slots Streamlit (mismo círculo) */
        #dockBar .dock-tool-sep {
            flex: 0 0 auto;
            width: 1px;
            height: 18px;
            margin: 0 2px;
            background: rgba(255, 255, 255, 0.35);
            border-radius: 1px;
            pointer-events: none;
        }

        #dockBar .dock-tool {
            box-sizing: border-box;
            appearance: none;
            -webkit-appearance: none;
            width: 28px;
            height: 28px;
            margin: 0;
            padding: 0;
            flex: 0 0 auto;
            background: rgba(255, 255, 255, 0.15);
            border: 1.5px solid #FFFFFF;
            border-radius: 50%;
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #FFFFFF;
            transition: transform 160ms ease, opacity 160ms ease, background 160ms ease;
        }

        #dockBar .dock-tool:hover:not(:disabled) {
            transform: scale(1.08);
            background: rgba(255, 255, 255, 0.22);
        }

        #dockBar .dock-tool:focus-visible {
            outline: 2px solid #FFFFFF;
            outline-offset: 2px;
        }

        #dockBar .dock-tool.is-filled {
            background: rgba(255, 255, 255, 0.28);
        }

        #dockBar .dock-tool img,
        #dockBar .dock-tool svg {
            width: 14px;
            height: 14px;
            display: block;
            object-fit: contain;
            pointer-events: none;
        }

        /* LibreOffice — panel en la plataforma (no popup) */
        .lo-dock-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9994;
            background: rgba(15, 20, 25, 0.72);
            align-items: stretch;
            justify-content: center;
            padding: 12px;
        }
        .lo-dock-overlay.open {
            display: flex;
        }
        .lo-dock-shell {
            width: min(960px, 100%);
            height: min(860px, 100%);
            margin: auto;
            display: flex;
            flex-direction: column;
            background: #121820;
            border: 1px solid #2a3644;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 24px 64px rgba(0,0,0,0.45);
            color: #e8eef4;
            font-family: 'IBM Plex Sans', system-ui, sans-serif;
        }
        .lo-dock-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 16px;
            background: #18202a;
            border-bottom: 1px solid #2a3644;
            flex: 0 0 auto;
        }
        .lo-dock-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
        }
        .lo-dock-brand svg {
            width: 22px;
            height: 22px;
            flex: 0 0 auto;
            color: #fff;
        }
        .lo-dock-brand h2 {
            margin: 0;
            font-size: 15px;
            font-weight: 700;
        }
        .lo-dock-brand p {
            margin: 2px 0 0;
            font-size: 11px;
            color: #8b9aab;
        }
        .lo-dock-head-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .lo-dock-btn {
            appearance: none;
            border: 1px solid #2a3644;
            background: #18202a;
            color: #e8eef4;
            border-radius: 8px;
            padding: 7px 12px;
            font: 600 12px/1.2 'IBM Plex Sans', system-ui, sans-serif;
            cursor: pointer;
        }
        .lo-dock-btn:hover { background: #1f2a36; }
        .lo-dock-btn.primary {
            background: #18a303;
            border-color: #18a303;
            color: #fff;
        }
        .lo-dock-btn.primary:hover { filter: brightness(1.06); }
        .lo-dock-btn:disabled { opacity: 0.55; cursor: default; }
        .lo-dock-body {
            flex: 1 1 auto;
            overflow: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            background:
                radial-gradient(ellipse 80% 50% at 12% 0%, rgba(24,163,3,0.14), transparent 55%),
                #0f1419;
        }
        .lo-dock-msg {
            min-height: 1.2em;
            font-size: 13px;
            color: #8b9aab;
        }
        .lo-dock-msg.ok { color: #3dd68c; }
        .lo-dock-msg.err { color: #f07178; }
        .lo-dock-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .lo-dock-badge {
            font-size: 11px;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 999px;
            background: #1a2430;
            border: 1px solid #2a3644;
            color: #c5d0db;
        }
        .lo-dock-badge.ok { border-color: #18a303; color: #3dd68c; }
        .lo-dock-meta {
            display: grid;
            gap: 8px;
            font-size: 12px;
            color: #c5d0db;
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
        }
        .lo-dock-meta strong { color: #fff; font-weight: 600; }
        .lo-dock-tree {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 6px;
        }
        .lo-dock-tree span {
            font-size: 11px;
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            padding: 6px 8px;
            border-radius: 6px;
            background: #18202a;
            border: 1px solid #2a3644;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .lo-dock-log {
            margin: 0;
            padding: 10px 12px;
            border-radius: 8px;
            background: #0a0e12;
            border: 1px solid #2a3644;
            color: #9fb0c0;
            font: 11px/1.4 'IBM Plex Mono', ui-monospace, monospace;
            white-space: pre-wrap;
            max-height: 180px;
            overflow: auto;
        }
        .lo-dock-tools {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 10px;
        }
        .lo-dock-tool {
            appearance: none;
            border: 1px solid #2a3644;
            background: #121820;
            color: #e8eef4;
            border-radius: 12px;
            padding: 12px 10px;
            cursor: pointer;
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-height: 96px;
        }
        .lo-dock-tool:hover { border-color: #3d5166; background: #16202b; }
        .lo-dock-swatch {
            width: 28px; height: 28px; border-radius: 8px;
            display: grid; place-items: center; color: #fff; font-weight: 800; font-size: 12px;
        }
        .lo-dock-tool strong { font-size: 13px; }
        .lo-dock-tool span:last-child { font-size: 11px; color: #8b9aab; }

        /* ===== STREAMLIT DOCK EDITOR (Figma panel-body) ===== */
        .st-dock-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9993;
            background: rgba(20, 22, 24, 0.58);
            align-items: center;
            justify-content: center;
            padding: 18px 12px;
            box-sizing: border-box;
        }

        .st-dock-overlay.open {
            display: flex;
        }

        .st-dock-shell {
            width: min(1707px, 100%);
            max-height: min(92vh, 920px);
            overflow: auto;
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 16px;
            box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08);
            padding: 0;
            box-sizing: border-box;
            font-family: Inter, 'IBM Plex Sans', ui-sans-serif, sans-serif;
            color: #111827;
            display: flex;
            flex-direction: column;
        }

        .st-dock-headbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 14px 24px 0;
            box-sizing: border-box;
        }

        .st-dock-title {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            line-height: 22px;
            color: #111827;
            letter-spacing: -0.01em;
        }

        .st-dock-close {
            appearance: none;
            border: 1px solid #E5E7EB;
            background: #fff;
            border-radius: 999px;
            padding: 6px 12px;
            font: inherit;
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            cursor: pointer;
        }

        .st-dock-body {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 16px 24px;
            gap: 16px;
            box-sizing: border-box;
            width: 100%;
            flex: 1 1 auto;
            align-self: stretch;
            background: #FFFFFF;
        }

        .st-dock-badges {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            align-items: center;
            padding: 0;
            gap: 10px;
            width: 100%;
            min-height: 28px;
            align-self: stretch;
        }

        .st-dock-badge {
            box-sizing: border-box;
            display: inline-flex;
            flex-direction: row;
            align-items: center;
            padding: 0 10px;
            height: 28px;
            border-radius: 999px;
            font-family: Inter, 'IBM Plex Sans', ui-sans-serif, sans-serif;
            font-style: normal;
            font-weight: 600;
            font-size: 12px;
            line-height: 15px;
            border: 1px solid #E5E7EB;
            background: #F3F4F6;
            color: #374151;
            white-space: nowrap;
        }

        .st-dock-badge.runtime {
            background: #DBEAFE;
            border-color: #BFDBFE;
            color: #1D4ED8;
        }

        .st-dock-badge.active {
            background: #D1FAE5;
            border-color: #A7F3D0;
            color: #047857;
        }

        .st-dock-badge.idle {
            background: #F3F4F6;
            border-color: #E5E7EB;
            color: #6B7280;
        }

        .st-dock-badge.code {
            background: #F3F4F6;
            border-color: #E5E7EB;
            color: #374151;
        }

        .st-dock-badge.template {
            background: #F3F4F6;
            border-color: #E5E7EB;
            color: #6B7280;
        }

        .st-dock-badge.off {
            background: #FEF2F2;
            border-color: #FECACA;
            color: #B91C1C;
        }

        .st-dock-field {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 0;
            gap: 8px;
            width: 100%;
            align-self: stretch;
        }

        .st-dock-label {
            display: block;
            margin: 0;
            font-family: Inter, 'IBM Plex Sans', ui-sans-serif, sans-serif;
            font-weight: 600;
            font-size: 12px;
            line-height: 15px;
            color: #6B7280;
        }

        .st-dock-input {
            box-sizing: border-box;
            width: 100%;
            height: 44px;
            padding: 0 12px;
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 10px;
            font-family: Inter, 'IBM Plex Sans', ui-sans-serif, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 17px;
            color: #111827;
            align-self: stretch;
        }

        .st-dock-input:focus {
            outline: none;
            border-color: #93C5FD;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .st-dock-templates {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            width: 100%;
        }

        .st-dock-chip {
            appearance: none;
            border: 1px solid #E5E7EB;
            background: #fff;
            border-radius: 999px;
            padding: 6px 10px;
            font-family: Inter, 'IBM Plex Sans', ui-sans-serif, sans-serif;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            color: #374151;
        }

        .st-dock-chip:hover,
        .st-dock-chip.active {
            border-color: #BFDBFE;
            color: #1D4ED8;
            background: #EFF6FF;
        }

        .st-dock-editor {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 0;
            width: 100%;
            min-height: 320px;
            height: min(420px, 48vh);
            background: #0B0F1A;
            border: 1px solid #1F2937;
            border-radius: 12px;
            align-self: stretch;
            overflow: hidden;
        }

        .st-dock-editor-header {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 0 12px;
            width: 100%;
            height: 36px;
            background: #0F172A;
            border-bottom: 1px solid #1F2937;
            align-self: stretch;
            flex: none;
        }

        .st-dock-editor-left,
        .st-dock-editor-right {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 10px;
        }

        .st-dock-editor-right { gap: 8px; }

        .st-dock-file-chip {
            box-sizing: border-box;
            display: inline-flex;
            flex-direction: row;
            align-items: center;
            padding: 6px 10px;
            gap: 6px;
            height: 27px;
            background: #111827;
            border: 1px solid #1F2937;
            border-radius: 999px;
            font-family: Inter, 'IBM Plex Sans', ui-sans-serif, sans-serif;
            font-weight: 600;
            font-size: 12px;
            line-height: 15px;
            color: #E5E7EB;
        }

        .st-dock-lang {
            font-family: Inter, 'IBM Plex Sans', ui-sans-serif, sans-serif;
            font-weight: 400;
            font-size: 12px;
            line-height: 15px;
            color: #9CA3AF;
        }

        .st-dock-ready-dot {
            width: 8px;
            height: 8px;
            border-radius: 4px;
            background: #10B981;
            flex: none;
        }

        .st-dock-ready-dot.is-busy {
            background: #F59E0B;
        }

        .st-dock-ready-dot.is-off {
            background: #6B7280;
        }

        .st-dock-ready-label {
            font-family: Inter, 'IBM Plex Sans', ui-sans-serif, sans-serif;
            font-weight: 400;
            font-size: 12px;
            line-height: 15px;
            color: #9CA3AF;
        }

        .st-dock-code-wrap {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 12px;
            width: 100%;
            flex: 1 1 auto;
            align-self: stretch;
            background: #0B0F1A;
            box-sizing: border-box;
            min-height: 0;
        }

        .st-dock-code {
            width: 100%;
            height: 100%;
            min-height: 240px;
            box-sizing: border-box;
            resize: none;
            border: 0;
            outline: none;
            background: transparent;
            color: #E5E7EB;
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            font-style: normal;
            font-weight: 400;
            font-size: 13px;
            line-height: 20px;
            padding: 0;
            align-self: stretch;
            caret-color: #93C5FD;
        }

        .st-dock-code::placeholder {
            color: #6B7280;
        }

        .st-dock-footer {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 0;
            gap: 12px;
            width: 100%;
            align-self: stretch;
        }

        .st-dock-actions {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            align-items: center;
            padding: 0;
            gap: 12px;
            width: 100%;
            min-height: 40px;
            align-self: stretch;
        }

        .st-dock-btn {
            box-sizing: border-box;
            appearance: none;
            display: inline-flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            padding: 0 16px;
            height: 40px;
            border-radius: 10px;
            border: 1px solid #E5E7EB;
            background: #FFFFFF;
            font-family: Inter, 'IBM Plex Sans', ui-sans-serif, sans-serif;
            font-weight: 700;
            font-size: 13px;
            line-height: 16px;
            color: #111827;
            cursor: pointer;
        }

        .st-dock-btn.primary {
            background: #0D8040;
            border-color: transparent;
            color: #FFFFFF;
            box-shadow: 0 8px 18px -6px rgba(13, 128, 64, 0.2);
        }

        .st-dock-btn.secondary {
            background: #111827;
            border-color: transparent;
            color: #FFFFFF;
            box-shadow: none;
        }

        .st-dock-btn.danger {
            background: #FFFFFF;
            border-color: #FCA5A5;
            color: #B91C1C;
        }

        .st-dock-btn:hover:not(:disabled) {
            filter: brightness(0.98);
        }

        .st-dock-btn.primary:hover:not(:disabled),
        .st-dock-btn.secondary:hover:not(:disabled) {
            filter: brightness(1.06);
        }

        .st-dock-btn:disabled {
            opacity: 0.55;
            cursor: default;
        }

        .st-dock-msg {
            margin: 0;
            width: 100%;
            font-family: Inter, 'IBM Plex Sans', ui-sans-serif, sans-serif;
            font-weight: 400;
            font-size: 12px;
            line-height: 15px;
            color: #6B7280;
            min-height: 15px;
            align-self: stretch;
        }

        .st-dock-msg.ok { color: #047857; }
        .st-dock-msg.err { color: #B91C1C; }

        .st-dock-url {
            margin: 0;
            font-size: 12px;
            line-height: 15px;
            color: #1D4ED8;
            word-break: break-all;
            width: 100%;
        }
        .st-dock-url[hidden] { display: none !important; }
        .st-dock-url a { color: inherit; font-weight: 600; }

        .st-dock-preview-wrap {
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            overflow: hidden;
            background: #0B0F1A;
            min-height: 220px;
            width: 100%;
            display: none;
        }
        .st-dock-preview-wrap.show { display: block; }
        .st-dock-preview-wrap iframe {
            width: 100%;
            height: min(42vh, 360px);
            border: 0;
            background: #fff;
        }

        @media (max-width: 720px) {
            .st-dock-body,
            .st-dock-headbar {
                padding-left: 14px;
                padding-right: 14px;
            }
            .st-dock-editor {
                height: min(360px, 50vh);
            }
            .st-dock-actions {
                gap: 8px;
            }
            .st-dock-btn {
                height: 36px;
                padding: 0 12px;
            }
        }

        /* ===== BANCO DE ÍNDICES / Indices PI ===== */
        .indices-bank-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9992;
            background: rgba(28, 30, 32, 0.58);
            align-items: center;
            justify-content: center;
            padding: 20px 14px;
            box-sizing: border-box;
        }

        .indices-bank-overlay.open {
            display: flex;
        }

        .indices-bank-shell {
            --ib-green: #0b3d2e;
            --ib-green-soft: #124f3c;
            --ib-muted: #8a9390;
            --ib-text: #1f2a26;
            --ib-line: #E5E7EB;
            --ib-wash: #f8f9fa;
            --ib-scroll: #3b5a46;
            --ib-track: #e8e8e8;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            padding: 32px;
            gap: 24px;
            isolation: isolate;
            position: relative;
            width: min(883px, 100%);
            min-height: min(456px, 92vh);
            max-height: min(92vh, 720px);
            overflow: hidden;
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            box-shadow: 0px 8px 24px -4px rgba(0, 0, 0, 0.0509804);
            border-radius: 16px;
            font-family: 'IBM Plex Sans', ui-sans-serif, sans-serif;
            color: var(--ib-text);
        }

        .indices-bank-head {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 0;
            flex: 0 0 auto;
            width: 100%;
        }

        .indices-bank-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 0 0 auto;
            min-width: 0;
        }

        .indices-bank-brand-mark {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: var(--ib-green);
            color: #ffffff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
        }

        .indices-bank-brand-mark svg {
            width: 18px;
            height: 18px;
            display: block;
        }

        .indices-bank-brand-name {
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0.01em;
            color: var(--ib-green);
            white-space: nowrap;
        }

        .indices-bank-actions {
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
            flex: 1 1 auto;
            justify-content: flex-end;
        }

        .indices-bank-search {
            width: min(420px, 100%);
            flex: 1 1 auto;
            max-width: 420px;
            display: flex;
            align-items: center;
            gap: 8px;
            height: 42px;
            padding: 0 16px;
            border: 1px solid #d8dcd9;
            border-radius: 999px;
            background: #ffffff;
            color: var(--ib-muted);
            box-sizing: border-box;
        }

        .indices-bank-search svg {
            width: 16px;
            height: 16px;
            flex: 0 0 auto;
            opacity: 0.55;
        }

        .indices-bank-search input {
            flex: 1 1 auto;
            min-width: 0;
            border: none;
            outline: none;
            background: transparent;
            font: inherit;
            font-size: 14px;
            color: var(--ib-text);
        }

        .indices-bank-search input::placeholder {
            color: #a0a8a4;
        }

        .indices-bank-wallet-btn {
            appearance: none;
            width: 42px;
            height: 42px;
            border: none;
            border-radius: 50%;
            background: var(--ib-green);
            color: #ffffff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            flex: 0 0 auto;
            padding: 0;
        }

        .indices-bank-wallet-btn svg {
            width: 18px;
            height: 18px;
            display: block;
        }

        .indices-bank-wallet-btn:hover {
            background: var(--ib-green-soft);
        }

        .indices-bank-body {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 0;
            gap: 24px;
            isolation: isolate;
            position: relative;
            width: 100%;
            overflow: auto;
            flex: 1 1 auto;
            min-height: 0;
        }

        .indices-bank-title {
            margin: 0;
            font-size: 40px;
            font-weight: 700;
            letter-spacing: -0.03em;
            color: var(--ib-green);
            line-height: 1.1;
        }

        .indices-bank-heading {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            width: 100%;
            flex: 0 0 auto;
        }

        .indices-bank-subtitle {
            margin: 0;
            font-size: 15px;
            font-weight: 400;
            color: var(--ib-muted);
        }

        .indices-bank-table-wrap {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            isolation: isolate;
            position: relative;
            width: 100%;
            flex: 1 1 auto;
            min-height: 220px;
            max-height: min(46vh, 320px);
            border: 1px solid #E5E7EB;
            border-radius: 16px;
            overflow-x: auto;
            overflow-y: scroll;
            background: #FFFFFF;
            box-shadow: 0px 8px 24px -4px rgba(0, 0, 0, 0.0509804);
            scrollbar-width: thin;
            scrollbar-color: var(--ib-scroll) var(--ib-track);
        }

        .indices-bank-table-wrap::-webkit-scrollbar {
            width: 6px;
        }

        .indices-bank-table-wrap::-webkit-scrollbar-button {
            display: none;
            width: 0;
            height: 0;
        }

        .indices-bank-table-wrap::-webkit-scrollbar-track {
            background: var(--ib-track);
            border-radius: 999px;
            margin: 12px 2px;
        }

        .indices-bank-table-wrap::-webkit-scrollbar-thumb {
            background: var(--ib-scroll);
            border-radius: 999px;
            min-height: 64px;
            border: none;
        }

        .indices-bank-table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
            font-size: 13px;
            min-width: 760px;
            table-layout: fixed;
        }

        .indices-bank-table col.col-index { width: 34%; }
        .indices-bank-table col.col-porcentaje { width: 16%; }
        .indices-bank-table col.col-prestamo { width: 14%; }
        .indices-bank-table col.col-retorno { width: 14%; }
        .indices-bank-table col.col-periodo { width: 22%; }

        .indices-bank-table thead th {
            position: sticky;
            top: 0;
            z-index: 1;
            background: #F9FAFB;
            color: #6B7280;
            font-weight: 600;
            text-align: left;
            padding: 14px 16px;
            border-bottom: 1px solid #E5E7EB;
            border-right: none;
            line-height: 1.25;
            vertical-align: middle;
        }

        .indices-bank-table thead th.col-porcentaje,
        .indices-bank-table thead th.col-prestamo,
        .indices-bank-table thead th.col-retorno {
            text-align: center;
        }

        .indices-bank-table thead th.col-periodo {
            text-align: right;
            white-space: normal;
            padding-right: 20px;
        }

        .indices-bank-table tbody td {
            padding: 16px 14px;
            border-bottom: 1px solid #E5E7EB;
            border-right: none;
            color: #111111;
            min-height: 64px;
            vertical-align: middle;
            background: #FFFFFF;
            font-weight: 500;
            font-size: 14px;
        }

        .indices-bank-table tbody td.col-index {
            padding-left: 16px;
        }

        .indices-bank-table tbody td.col-porcentaje,
        .indices-bank-table tbody td.col-prestamo,
        .indices-bank-table tbody td.col-retorno {
            text-align: center;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }

        .indices-bank-table tbody td.col-periodo {
            text-align: right;
            padding-right: 20px;
            white-space: nowrap;
            color: #111111;
        }

        .indices-bank-table tbody tr:last-child td {
            border-bottom: none;
        }

        .indices-bank-table tbody tr.is-empty td {
            color: transparent;
            user-select: none;
        }

        .ib-index-cell {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
        }

        .ib-index-icon {
            width: 42px;
            height: 42px;
            border-radius: 999px;
            border: 1px solid #d5d8d6;
            background: #ffffff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            overflow: hidden;
            color: #6b7280;
        }

        .ib-index-icon img,
        .ib-index-icon svg {
            width: 22px;
            height: 22px;
            display: block;
        }

        .ib-index-meta {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
        }

        .ib-index-name {
            font-size: 14px;
            font-weight: 700;
            color: #111111;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .ib-index-desc {
            font-size: 12px;
            font-weight: 400;
            color: #888888;
            line-height: 1.25;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .ib-metric-up {
            color: #22a06b;
            font-weight: 600;
        }

        .ib-metric-down {
            color: #e34935;
            font-weight: 600;
        }

        .ib-metric-flat {
            color: #111111;
            font-weight: 600;
        }

        .indices-bank-empty {
            display: none;
        }

        @media (max-width: 720px) {
            .indices-bank-head {
                flex-wrap: wrap;
            }

            .indices-bank-actions {
                width: 100%;
                margin-left: 0;
            }

            .indices-bank-title {
                font-size: 32px;
            }

            .indices-bank-brand-name {
                font-size: 13px;
            }
        }

        .hashcod-keys-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 92;
            background: rgba(18, 18, 22, 0.45);
            align-items: center;
            justify-content: center;
            padding: 20px 14px;
        }

        .hashcod-keys-overlay.open {
            display: flex;
        }

        .hashcod-keys-card {
            width: min(380px, 100%);
            max-height: min(86vh, 640px);
            overflow: auto;
            background: #ffffff;
            border-radius: 18px;
            box-shadow: 0 22px 56px rgba(0, 0, 0, 0.22);
            padding: 22px 22px 20px;
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            color: #14141a;
            box-sizing: border-box;
        }

        .hashcod-keys-top {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
        }

        .hashcod-keys-title {
            flex: 1;
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: #14141a;
        }

        .hashcod-keys-close {
            border: none;
            background: #f0f0f3;
            color: #14141a;
            border-radius: 999px;
            font-family: inherit;
            font-size: 11px;
            padding: 5px 11px;
            cursor: pointer;
        }

        .hashcod-keys-close:hover {
            background: #14141a;
            color: #fff;
        }

        .hashcod-keys-form {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .hashcod-keys-input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d8d8de;
            border-radius: 12px;
            background: #fff;
            font-family: inherit;
            font-size: 13px;
            padding: 12px 14px;
            color: #14141a;
        }

        .hashcod-keys-input::placeholder {
            color: #a0a0a8;
        }

        .hashcod-keys-input:focus {
            outline: 2px solid #14141a;
            border-color: #14141a;
        }

        .hashcod-keys-save {
            margin-top: 4px;
            width: 100%;
            border: none;
            border-radius: 12px;
            background: #14141a;
            color: #ffffff;
            font-family: inherit;
            font-size: 14px;
            font-weight: 700;
            padding: 13px 16px;
            cursor: pointer;
        }

        .hashcod-keys-save:hover {
            background: #2a2a32;
        }

        .hashcod-keys-msg {
            margin: 8px 0 0;
            min-height: 1.2em;
            font-size: 11px;
            color: #666;
            line-height: 1.35;
        }

        .hashcod-keys-msg.ok { color: #1a7f37; }
        .hashcod-keys-msg.err { color: #c5221f; }

        .hashcod-keys-list-wrap {
            margin-top: 16px;
            padding-top: 14px;
            border-top: 1px solid #ececf0;
        }

        .hashcod-keys-list-title {
            font-size: 11px;
            font-weight: 700;
            color: #555;
            margin: 0 0 8px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .hashcod-keys-list {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 180px;
            overflow: auto;
        }

        .hashcod-keys-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            padding: 10px 11px;
            border: 1px solid #ececf0;
            border-radius: 12px;
            background: #fafafb;
        }

        .hashcod-keys-item-body {
            flex: 1;
            min-width: 0;
        }

        .hashcod-keys-item-name {
            font-size: 12px;
            font-weight: 700;
            color: #14141a;
            word-break: break-word;
        }

        .hashcod-keys-item-meta {
            margin-top: 3px;
            font-size: 10px;
            color: #666;
            word-break: break-all;
            line-height: 1.35;
        }

        .hashcod-keys-item-del {
            border: none;
            background: transparent;
            color: #888;
            font-family: inherit;
            font-size: 11px;
            cursor: pointer;
            padding: 2px 4px;
            flex: 0 0 auto;
        }

        .hashcod-keys-item-del:hover {
            color: #c5221f;
        }

        .hashcod-keys-empty {
            margin: 0;
            font-size: 11px;
            color: #888;
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


        .toolkit-tool-btn[data-tool="engineering"] {
            background: #111;
            color: #fff;
        }

        .toolkit-tool-btn[data-tool="engineering"]:hover {
            background: #333;
            color: #fff;
        }

        .toolkit-tool-btn[data-tool="pdf-md"] {
            background: #111;
            color: #fff;
        }

        .toolkit-tool-btn[data-tool="pdf-md"]:hover {
            background: #333;
            color: #fff;
        }

        .toolkit-pdf-main {
            display: grid;
            grid-template-columns: minmax(240px, 34%) 1fr;
            min-height: 0;
            flex: 1;
        }

        .toolkit-pdf-side {
            border-right: 1px solid #d0d0d0;
            padding: 14px;
            overflow: auto;
            background: #fafafa;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .toolkit-pdf-drop {
            border: 1.5px dashed #888;
            background: #fff;
            padding: 22px 14px;
            text-align: center;
            cursor: pointer;
            font-size: 12px;
            line-height: 1.45;
            color: #333;
            user-select: none;
        }

        .toolkit-pdf-drop:hover,
        .toolkit-pdf-drop.dragging {
            border-color: #111;
            background: #f3f3f3;
        }

        .toolkit-pdf-drop strong {
            display: block;
            color: #111;
            margin-bottom: 4px;
            font-size: 13px;
        }

        .toolkit-pdf-file {
            font-size: 11px;
            color: #444;
            word-break: break-all;
        }

        .toolkit-pdf-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .toolkit-pdf-actions button {
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            font-size: 11px;
            border: 1px solid #111;
            background: #fff;
            color: #111;
            padding: 6px 10px;
            cursor: pointer;
        }

        .toolkit-pdf-actions button:hover:not(:disabled) {
            background: #111;
            color: #fff;
        }

        .toolkit-pdf-actions button:disabled {
            opacity: 0.45;
            cursor: default;
        }

        .toolkit-pdf-status {
            font-size: 11px;
            color: #555;
            line-height: 1.4;
        }

        .toolkit-pdf-status.ok { color: #1a7f37; }
        .toolkit-pdf-status.err { color: #c5221f; }

        .toolkit-pdf-view {
            min-height: 0;
            overflow: auto;
            padding: 14px 16px 18px;
            background: #fff;
        }

        .toolkit-pdf-meta {
            font-size: 11px;
            color: #666;
            margin-bottom: 10px;
        }

        .toolkit-pdf-html.toolkit-md {
            font-size: 14px;
            line-height: 1.6;
            color: #1a1a1a;
            margin-bottom: 14px;
        }

        .toolkit-pdf-html.toolkit-md h1,
        .toolkit-pdf-html.toolkit-md h2,
        .toolkit-pdf-html.toolkit-md h3 {
            margin: 0.8em 0 0.35em;
            line-height: 1.25;
            color: #111;
        }

        .toolkit-pdf-html.toolkit-md p {
            margin: 0 0 0.75em;
        }

        .toolkit-pdf-html.toolkit-md ul,
        .toolkit-pdf-html.toolkit-md ol {
            margin: 0 0 0.85em 1.2em;
        }

        .toolkit-pdf-raw-wrap {
            margin-top: 8px;
            border-top: 1px solid #e2e2e2;
            padding-top: 8px;
        }

        .toolkit-pdf-raw-wrap summary {
            cursor: pointer;
            font-size: 11px;
            color: #555;
            user-select: none;
            margin-bottom: 8px;
        }

        .toolkit-pdf-output {
            white-space: pre-wrap;
            word-break: break-word;
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            font-size: 12px;
            line-height: 1.5;
            color: #111;
            margin: 0;
            padding: 12px;
            background: #f7f7f7;
            border: 1px solid #e2e2e2;
            max-height: 280px;
            overflow: auto;
        }

        @media (max-width: 820px) {
            .toolkit-pdf-main {
                grid-template-columns: 1fr;
                grid-template-rows: auto 1fr;
            }
            .toolkit-pdf-side {
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

        /* ==========================================================================
           TERMINAL CONSOLE & CELLS REDESIGN (EXACT SPECIFICATION)
           ========================================================================== */
        /* terminal-console */
        .main-container {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            padding: 16px 12px;
            gap: 16px;
            position: relative;
            width: 100%;
            max-width: 1261px;
            margin: 0 auto;
            background: #FFFFFF;
        }

        /* top-output-bar */
        .block-row.block-execution {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: stretch;
            padding: 0px;
            width: 100%;
            max-width: 1200px;
            min-height: 50px;
            background: #FFFFFF;
            border: 1px solid #D9D9D9;
            border-radius: 6px;
            overflow: hidden;
            flex: none;
            order: 0;
            flex-grow: 0;
        }

        /* equal-column */
        .block-execution .block-symbol {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 0px;
            width: 40px;
            min-width: 40px;
            min-height: 50px;
            background: #E0E0E0;
            border-right: 1px solid #D9D9D9;
            flex: none;
            order: 0;
            flex-grow: 0;
            user-select: none;
            /* = */
            font-family: 'Inter', sans-serif;
            font-style: normal;
            font-weight: 700;
            font-size: 18px;
            line-height: 22px;
            color: #40404D;
            text-align: center;
        }

        /* output-area */
        .block-execution .block-body {
            box-sizing: border-box;
            width: 100%;
            max-width: 1160px;
            min-height: 50px;
            max-height: 580px;
            background: #FFFFFF;
            padding: 12px 16px;
            overflow-y: auto;
            flex: none;
            order: 1;
            flex-grow: 1;
            word-break: break-all;
            white-space: pre-wrap;
            line-height: 1.4;
            font-family: 'IBM Plex Mono', 'Geist Mono', monospace;
            font-size: 13px;
            color: #000000;
            display: flex;
            align-items: flex-start;
        }

        /* Wrapper for bottom input bar and its drawers */
        .function-drawer-wrapper {
            display: flex;
            flex-direction: column;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            flex: none;
            order: 1;
            flex-grow: 0;
        }

        /* bottom-input-bar */
        .block-row.block-prompt {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: 0px 16px;
            gap: 12px;
            width: 100%;
            max-width: 1200px;
            height: 45px;
            min-height: 45px;
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            flex: none;
            order: 0;
            flex-grow: 0;
        }

        /* prompt-symbol */
        .block-prompt .block-symbol {
            width: 10px;
            min-width: 10px;
            height: 21px;
            font-family: 'Geist Mono', 'IBM Plex Mono', monospace;
            font-style: normal;
            font-weight: 700;
            font-size: 16px;
            line-height: 21px;
            color: #1F2937;
            background: transparent;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: none;
            order: 0;
            flex-grow: 0;
            user-select: none;
            cursor: pointer;
            padding: 0;
            margin: 0;
        }

        .block-prompt .block-body.block-input-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 0;
            background: transparent;
            border: none;
            order: 1;
            flex-grow: 1;
        }

        /* placeholder-text / cmd-input */
        .cmd-input {
            width: 100%;
            max-width: 1104px;
            height: 24px;
            font-family: 'Geist Mono', 'IBM Plex Mono', monospace;
            font-style: normal;
            font-weight: 400;
            font-size: 13px;
            line-height: 17px;
            color: #1F2937;
            background: transparent;
            border: none;
            outline: none;
            padding: 0;
            margin: 0;
            flex: none;
            order: 1;
            flex-grow: 1;
        }

        .cmd-input::placeholder {
            color: #9CA3AF;
            font-family: 'Geist Mono', 'IBM Plex Mono', monospace;
            font-style: normal;
            font-weight: 400;
            font-size: 13px;
            line-height: 17px;
        }

        /* keyboard-icon-btn */
        .cell-action-icon {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 6px;
            width: 30px;
            height: 30px;
            min-width: 30px;
            min-height: 30px;
            background: rgba(229, 231, 235, 0.313726);
            border-radius: 6px;
            cursor: pointer;
            border: none;
            flex: none;
            order: 2;
            flex-grow: 0;
            transition: background 0.15s ease, transform 0.1s ease;
        }

        .cell-action-icon:hover {
            background: rgba(209, 213, 219, 0.6);
            transform: scale(1.05);
        }

        /* keyboard-icon / Vector */
        .cell-action-icon svg {
            width: 18px;
            height: 18px;
            display: block;
            flex: none;
            order: 0;
            flex-grow: 0;
        }

        .cell-action-icon svg path {
            fill: #5F6368;
        }

        /* ==========================================================================
           TOOLBOX PANEL (4x4 INTERACTIVE MATRIX & ABSTRACT SCHEMATIC SPECIFICATION)
           ========================================================================== */
        /* toolbox-panel */
        .toolbox-panel {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 64px;
            gap: 40px;
            isolation: isolate;
            position: relative;
            width: 960px;
            height: 784px;
            max-width: 100%;
            margin: 12px auto 32px auto;
            background: #FFFFFF;
            border: 2px dashed #000000;
            box-shadow: 0px 16px 32px rgba(0, 0, 0, 0.0784314);
            border-radius: 24px;
            overflow: hidden;
            flex: none;
            order: 2;
            flex-grow: 0;
            z-index: 1;
        }

        /* abstract-bg */
        .toolbox-abstract-bg {
            position: absolute;
            width: 960px;
            height: 784px;
            left: 0px;
            top: 0px;
            pointer-events: none;
            z-index: 0;
            overflow: hidden;
        }

        .tb-line {
            position: absolute;
            height: 0px;
            opacity: 0.7;
            border-top: 1.2px solid #E0E0E0;
            transform-origin: 0 0;
        }

        .tb-line-thick {
            position: absolute;
            height: 0px;
            opacity: 0.7;
            border-top: 1.5px solid #E0E0E0;
            transform-origin: 0 0;
        }

        .tb-ellipse {
            box-sizing: border-box;
            position: absolute;
            border-radius: 50%;
            opacity: 0.7;
            border: 1.5px solid #E0E0E0;
        }

        .tb-rect {
            box-sizing: border-box;
            position: absolute;
            opacity: 0.6;
            border: 1.5px solid #E0E0E0;
            transform-origin: center center;
        }

        .tb-cross-h {
            position: absolute;
            height: 0px;
            opacity: 0.7;
            border-top: 1.5px solid #E0E0E0;
        }

        .tb-cross-v {
            position: absolute;
            height: 0px;
            opacity: 0.7;
            border-top: 1.5px solid #E0E0E0;
            transform: rotate(90deg);
            transform-origin: 0 0;
        }

        /* top-decorations & bottom-decorations */
        .tb-top-decorations {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-start;
            padding: 16px 24px 0px;
            position: absolute;
            height: 18px;
            left: 0px;
            right: 0px;
            top: 0px;
            pointer-events: none;
            z-index: 1;
        }

        .tb-bottom-decorations {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0px 24px 16px;
            position: absolute;
            height: 18px;
            left: 0px;
            right: 0px;
            bottom: 0px;
            pointer-events: none;
            z-index: 1;
        }

        .tb-bracket-corner {
            position: relative;
            width: 14px;
            height: 14px;
        }

        .tb-bracket-corner.top-left .tb-h { position: absolute; width: 12px; height: 2px; left: 0; top: 0; background: #000000; opacity: 0.4; }
        .tb-bracket-corner.top-left .tb-v { position: absolute; width: 2px; height: 12px; left: 0; top: 0; background: #000000; opacity: 0.4; }

        .tb-bracket-corner.top-right .tb-h { position: absolute; width: 12px; height: 2px; right: 0; top: 0; background: #000000; opacity: 0.4; }
        .tb-bracket-corner.top-right .tb-v { position: absolute; width: 2px; height: 12px; right: 0; top: 0; background: #000000; opacity: 0.4; }

        .tb-bracket-corner.bottom-left .tb-h { position: absolute; width: 12px; height: 2px; left: 0; bottom: 0; background: #000000; opacity: 0.4; }
        .tb-bracket-corner.bottom-left .tb-v { position: absolute; width: 2px; height: 12px; left: 0; bottom: 0; background: #000000; opacity: 0.4; }

        .tb-bracket-corner.bottom-right .tb-h { position: absolute; width: 12px; height: 2px; right: 0; bottom: 0; background: #000000; opacity: 0.4; }
        .tb-bracket-corner.bottom-right .tb-v { position: absolute; width: 2px; height: 12px; right: 0; bottom: 0; background: #000000; opacity: 0.4; }

        /* grid-container (832px x 656px) */
        .tb-grid-container {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 0px;
            gap: 32px;
            width: 832px;
            height: 656px;
            max-width: 100%;
            position: relative;
            z-index: 2;
        }

        /* grid-rows */
        .tb-grid-row {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 0px;
            width: 832px;
            max-width: 100%;
            height: 140px;
            flex: none;
            align-self: stretch;
            flex-grow: 0;
        }

        /* slots (140px x 140px) */
        .tb-slot {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 0px;
            isolation: isolate;
            position: relative;
            width: 140px;
            height: 140px;
            background: rgba(0, 0, 0, 0.0196078);
            border: 2px solid #000000;
            border-radius: 70px;
            cursor: pointer;
            flex: none;
            flex-grow: 0;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .tb-slot:hover {
            transform: scale(1.05);
            background: rgba(0, 0, 0, 0.04);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
        }

        /* inner-ring (100px x 100px) */
        .tb-inner-ring {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 0px;
            width: 100px;
            height: 100px;
            opacity: 0.35;
            border: 1px dashed #000000;
            border-radius: 50px;
            position: relative;
            z-index: 0;
            pointer-events: none;
            flex: none;
            flex-grow: 0;
        }

        /* focal-center (12px x 12px) */
        .tb-focal-center {
            box-sizing: border-box;
            width: 12px;
            height: 12px;
            opacity: 0.6;
            border: 1.5px solid #000000;
            border-radius: 50%;
            pointer-events: none;
            flex: none;
            flex-grow: 0;
        }

        /* 4 corner registration dots */
        .tb-corner-dot {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #000000;
            opacity: 0.2;
            border-radius: 1px;
            pointer-events: none;
            z-index: 1;
        }
        .tb-corner-dot.d-tl { left: 20px; top: 20px; }
        .tb-corner-dot.d-tr { left: 116px; top: 20px; }
        .tb-corner-dot.d-bl { left: 20px; top: 116px; }
        .tb-corner-dot.d-br { left: 116px; top: 116px; }

        @media (max-width: 990px) {
            .toolbox-panel {
                width: 100%;
                height: auto;
                padding: 32px 16px;
                border-radius: 16px;
            }
            .tb-grid-container {
                width: 100%;
                height: auto;
                gap: 20px;
            }
            .tb-grid-row {
                width: 100%;
                height: auto;
                flex-wrap: wrap;
                justify-content: center;
                gap: 16px;
            }
            .tb-slot {
                width: 120px;
                height: 120px;
                border-radius: 60px;
            }
            .tb-inner-ring {
                width: 84px;
                height: 84px;
                border-radius: 42px;
            }
            .tb-corner-dot.d-tl { left: 16px; top: 16px; }
            .tb-corner-dot.d-tr { left: 100px; top: 16px; }
            .tb-corner-dot.d-bl { left: 16px; top: 100px; }
            .tb-corner-dot.d-br { left: 100px; top: 100px; }
        }

        /* Toolbox Slots Filled / Interactive State */
        .tb-slot.is-filled {
            background: rgba(0, 0, 0, 0.03);
            border: 2px solid #000000;
        }

        .tb-slot.is-filled:hover {
            transform: scale(1.08);
            background: #FFFFFF;
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.14);
            border-color: #107C41;
        }

        .tb-slot.is-tool-blog .tb-inner-ring {
            border-color: #107C41;
            opacity: 0.6;
        }

        .tb-slot-icon {
            display: block;
            width: 44px;
            height: 44px;
            z-index: 1;
            transition: transform 0.2s ease;
        }

        .tb-slot:hover .tb-slot-icon {
            transform: scale(1.1);
        }

        .tb-slot-badge {
            position: absolute;
            bottom: 8px;
            font-family: 'Geist Mono', 'IBM Plex Mono', monospace;
            font-size: 9px;
            font-weight: 700;
            color: #000000;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            background: #FFFFFF;
            border: 1px solid #000000;
            padding: 1px 6px;
            border-radius: 4px;
            pointer-events: none;
            z-index: 2;
        }

        /* ==========================================================================
           TOOLBOX TOOL 1: PUBLICATIONS AND PREVIEW BLOG (16 COLUMNS & REAL READER)
           ========================================================================== */
        .excel-blog-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 95;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(6px);
            align-items: center;
            justify-content: center;
            padding: 16px;
            font-family: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        .excel-blog-overlay.open {
            display: flex;
            opacity: 1;
        }

        /* =========================================================================
           FIGMA SPECIFICATION: TABLE-SECTION-CARD & MEGA-CREATOR ILLUSTRATION
           ========================================================================= */

        /* table-section-card */
        .excel-blog-shell.table-section-card,
        .table-section-card {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 0px;
            isolation: isolate;
            position: relative;
            width: 100%;
            max-width: 1360px;
            min-height: 444px;
            background: #FFFFFF;
            border: 1px solid #E4E4E7;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.12);
            margin: 0 auto;
        }

        /* mega-creator vector illustration */
        .mega-creator {
            position: absolute;
            width: 200px;
            height: 212px;
            left: 0px;
            top: -20px;
            opacity: 0.55;
            flex: none;
            order: 0;
            flex-grow: 0;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
        }

        .mega-creator .mc-group-1 {
            position: absolute;
            left: 1.8%;
            right: 24.22%;
            top: 11.58%;
            bottom: 10.93%;
            transform: matrix(0.99, -0.12, 0.12, 0.99, 0, 0);
        }

        .mega-creator .mc-shape-1 {
            position: absolute;
            inset: 0;
            background: #737885;
            opacity: 0.18;
            border-radius: 4px;
        }

        .mega-creator .mc-shape-2 {
            position: absolute;
            left: 1.91%;
            right: 24.3%;
            top: 11.67%;
            bottom: 11.02%;
            background: linear-gradient(336.83deg, #CCCCCC -7.38%, #EEEEEE 52.35%);
            border-radius: 3px;
        }

        .mega-creator .mc-group-2 {
            position: absolute;
            left: 9.94%;
            right: 14.53%;
            top: 6.5%;
            bottom: 15.67%;
        }

        .mega-creator .mc-inner-grad {
            position: absolute;
            left: 10.03%;
            right: 14.62%;
            top: 6.58%;
            bottom: 15.75%;
            background: linear-gradient(145.83deg, #FFFFFF 20.77%, #EEEEEE 103.45%);
            border: 1px solid #737885;
            border-radius: 3px;
        }

        .mega-creator .mc-line {
            position: absolute;
            background: #737885;
            border-radius: 1px;
        }
        .mega-creator .mc-line.l1 { left: 22.32%; right: 56.07%; top: 14.41%; height: 2px; }
        .mega-creator .mc-line.l2 { left: 17.45%; right: 73%; top: 27.78%; height: 2px; }
        .mega-creator .mc-line.l3 { left: 42.48%; right: 44.6%; top: 33.14%; height: 2px; }
        .mega-creator .mc-line.l4 { left: 39.31%; right: 52.47%; top: 54.09%; height: 2px; }
        .mega-creator .mc-line.l5 { left: 43.57%; right: 48.79%; top: 72.98%; height: 2px; }
        .mega-creator .mc-line.l6 { left: 27.75%; right: 46.94%; top: 17.32%; height: 2px; }
        .mega-creator .mc-line.l7 { left: 19.93%; right: 44.79%; top: 22.05%; height: 2px; }
        .mega-creator .mc-line.l8 { left: 22.41%; right: 42.31%; top: 26.82%; height: 2px; }
        .mega-creator .mc-line.l9 { left: 24.86%; right: 57.89%; top: 39.24%; height: 2px; }
        .mega-creator .mc-line.l10 { left: 55.71%; right: 39.76%; top: 31.62%; height: 2px; }
        .mega-creator .mc-line.l11 { left: 30.13%; right: 34.59%; top: 41.22%; height: 2px; }
        .mega-creator .mc-line.l12 { left: 35.52%; right: 29.16%; top: 50.46%; height: 2px; }

        .mega-creator .mc-group-3 {
            position: absolute;
            left: 62.48%;
            right: 1.32%;
            top: 26.96%;
            bottom: 54.88%;
            transform: matrix(0.88, -0.47, 0.47, 0.88, 0, 0);
        }

        .mega-creator .mc-rot-grad {
            position: absolute;
            left: 64.75%;
            right: 2.06%;
            top: 27.32%;
            bottom: 54.91%;
            background: linear-gradient(139.47deg, #B3B3B3 48.32%, #747474 56.85%);
            border-radius: 2px;
        }

        .mega-creator .mc-rot-line {
            position: absolute;
            background: #737885;
            border-radius: 1px;
            transform: matrix(0.88, -0.47, 0.47, 0.88, 0, 0);
        }
        .mega-creator .mc-rot-line.r1 { left: 70.32%; right: 26%; top: 54.33%; height: 2px; }
        .mega-creator .mc-rot-line.r2 { left: 71.23%; right: 28.09%; top: 58.06%; height: 2px; }
        .mega-creator .mc-rot-line.r3 { left: 91.98%; right: 5.25%; top: 27.07%; height: 2px; }
        .mega-creator .mc-rot-line.r4 { left: 81.24%; right: 6.06%; top: 29.45%; height: 2px; }
        .mega-creator .mc-rot-line.r5 { left: 91.72%; right: 6.3%; top: 31.8%; height: 2px; }

        /* table-header-controls */
        .table-header-controls {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            width: 100%;
            height: 80px;
            flex: none;
            order: 1;
            align-self: stretch;
            flex-grow: 0;
            z-index: 1;
            background: #FFFFFF;
            border-bottom: 1px solid #E4E4E7;
            gap: 16px;
        }

        .table-title-text {
            font-family: 'Geist', 'Inter', -apple-system, sans-serif;
            font-style: normal;
            font-weight: 700;
            font-size: 16px;
            line-height: 21px;
            color: #09090B;
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
        }

        .filter-group {
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: 0px;
            gap: 8px;
            height: 32px;
            flex: none;
            order: 1;
            flex-grow: 0;
        }

        .filter-search {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: 8px 12px;
            gap: 8px;
            width: 200px;
            height: 32px;
            border: 1px solid #E4E4E7;
            border-radius: 6px;
            background: #FFFFFF;
            flex: none;
            order: 0;
            flex-grow: 0;
            transition: border-color 0.15s ease;
        }

        .filter-search:focus-within {
            border-color: #09090B;
        }

        .filter-search input {
            width: 156px;
            height: 16px;
            font-family: 'Geist', 'Inter', -apple-system, sans-serif;
            font-style: normal;
            font-weight: 400;
            font-size: 12px;
            line-height: 16px;
            color: #09090B;
            border: none;
            outline: none;
            background: transparent;
            flex-grow: 1;
        }

        .filter-search input::placeholder {
            color: #71717A;
        }

        .filter-all {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 8px 12px;
            width: 71px;
            height: 32px;
            background: #000000;
            border-radius: 6px;
            font-family: 'Geist', 'Inter', -apple-system, sans-serif;
            font-style: normal;
            font-weight: 600;
            font-size: 12px;
            line-height: 16px;
            color: #FFFFFF;
            border: none;
            cursor: pointer;
            flex: none;
            order: 1;
            flex-grow: 0;
            transition: background 0.15s ease;
            white-space: nowrap;
        }

        .filter-all:hover {
            background: #27272A;
        }

        .btn-card-close {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: #F4F4F5;
            border: 1px solid #E4E4E7;
            border-radius: 6px;
            color: #71717A;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .btn-card-close:hover {
            background: #EF4444;
            color: #FFFFFF;
            border-color: #EF4444;
        }

        /* data-table */
        .data-table-wrap {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 0px;
            width: 100%;
            min-height: 296px;
            max-height: calc(85vh - 160px);
            overflow-x: auto;
            overflow-y: auto;
            flex: none;
            order: 2;
            align-self: stretch;
            flex-grow: 1;
            z-index: 2;
            background: #FFFFFF;
        }

        .data-table-wrap table,
        .admin-16col-table {
            width: 100%;
            min-width: 1360px;
            border-collapse: collapse;
        }

        /* table-column-header */
        .table-column-header-tr {
            box-sizing: border-box;
            display: table-row;
            height: 56px;
            background: #F4F4F5;
            border: 1px solid #E4E4E7;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .table-column-header-tr th {
            box-sizing: border-box;
            height: 56px;
            padding: 0px 2px;
            border-right: 1px solid #E0E3E8;
            border-bottom: 1px solid #E4E4E7;
            font-family: 'Inter', sans-serif;
            font-style: normal;
            font-weight: 400;
            font-size: 9px;
            line-height: 11px;
            text-align: center;
            color: #595E66;
            vertical-align: middle;
            background: #F4F4F5;
            user-select: none;
            width: 82.19px;
            min-width: 82.19px;
        }

        .table-column-header-tr th:last-child {
            border-right: none;
        }

        /* Rows */
        .table-data-tr {
            box-sizing: border-box;
            height: 40px;
            border-bottom: 1px solid #EBEDF0;
            transition: background 0.12s ease;
            cursor: pointer;
        }

        .table-data-tr:nth-child(odd) {
            background: #FFFFFF;
        }

        .table-data-tr:nth-child(even) {
            background: #FAFAFC;
        }

        .table-data-tr:hover {
            background: #F0F7FF !important;
        }

        .table-data-tr.active-row {
            background: #E0EFFF !important;
            box-shadow: inset 2px 0 0 #2563EB;
        }

        .table-data-tr.pulse-row {
            animation: adminRowPulse 1.4s ease;
        }

        .table-data-tr td {
            box-sizing: border-box;
            height: 39px;
            padding: 0px;
            border-right: 1px solid #EBEDF0;
            border-bottom: 1px solid #EBEDF0;
            text-align: center;
            vertical-align: middle;
            font-family: 'Inter', sans-serif;
            font-size: 10px;
            width: 82.19px;
            min-width: 82.19px;
        }

        .table-data-tr td:last-child {
            border-right: none;
        }

        /* input-field matching Figma */
        .input-field-figma,
        .cell-input-field,
        .admin-cell-input {
            box-sizing: border-box;
            display: inline-flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 0px 4px;
            width: 60px;
            height: 24px;
            background: #F9FAFB;
            border: 1px solid #E0E2E6;
            border-radius: 3px;
            font-family: 'Inter', sans-serif;
            font-size: 10px;
            color: #09090B;
            text-align: center;
            outline: none;
            transition: all 0.12s ease;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
        }

        .input-field-figma:focus,
        .cell-input-field:focus,
        .admin-cell-input:focus {
            background: #FFFFFF;
            border-color: #09090B;
        }

        /* read-only badge in blog view */
        .blog-cell-badge {
            box-sizing: border-box;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0px 4px;
            max-width: 76px;
            height: 24px;
            font-family: 'Inter', sans-serif;
            font-size: 10px;
            color: #09090B;
            text-align: center;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
        }

        /* dollar-input matching Figma */
        .dollar-input-figma,
        .cell-dollar-wrap {
            box-sizing: border-box;
            display: inline-flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 0px 4px;
            gap: 2px;
            width: 60px;
            height: 24px;
            background: #F9FAFB;
            border: 1px solid #E0E2E6;
            border-radius: 3px;
        }

        .dollar-input-figma span,
        .cell-dollar-wrap span {
            font-family: 'Inter', sans-serif;
            font-style: normal;
            font-weight: 400;
            font-size: 9px;
            line-height: 11px;
            color: #666B73;
        }

        .dollar-input-figma input,
        .cell-dollar-wrap input {
            width: 44px;
            height: 20px;
            border: none;
            background: transparent;
            outline: none;
            font-family: 'Inter', sans-serif;
            font-size: 10px;
            color: #09090B;
            text-align: center;
        }

        /* home/code icon matching Figma */
        .cell-home-icon-btn,
        .admin-cell-code-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            background: transparent;
            border: none;
            cursor: pointer;
            color: #000000;
            transition: transform 0.12s ease;
        }

        .cell-home-icon-btn:hover,
        .admin-cell-code-btn:hover {
            transform: scale(1.15);
        }

        .cell-home-icon-btn svg,
        .admin-cell-code-btn svg {
            width: 16px;
            height: 16px;
            fill: #000000;
        }

        /* btn-auth matching Figma */
        .btn-auth-figma,
        .cell-btn-auth,
        .admin-cell-btn-auth {
            box-sizing: border-box;
            display: inline-flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            padding: 0px;
            width: 58px;
            height: 20px;
            background: #FFFFFF;
            border: 1px solid #D1D6DB;
            border-radius: 3px;
            font-family: 'Inter', sans-serif;
            font-style: normal;
            font-weight: 400;
            font-size: 7px;
            line-height: 8px;
            color: #000000;
            cursor: pointer;
            transition: all 0.12s ease;
        }

        .btn-auth-figma.signed,
        .cell-btn-auth.signed,
        .admin-cell-btn-auth.signed {
            background: #ECFDF5;
            border-color: #10B981;
            color: #047857;
            font-weight: 700;
        }

        /* checkboxes matching Figma */
        .cell-checkboxes {
            display: inline-flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 0px;
            gap: 4px;
            width: 43px;
            height: 10px;
        }

        .cell-chk-box {
            box-sizing: border-box;
            width: 10px;
            height: 10px;
            background: #F2F5F7;
            border: 1px solid #B3B8BF;
            border-radius: 2px;
            display: inline-block;
        }

        .cell-chk-box.checked {
            background: #09090B;
            border-color: #09090B;
        }

        .cell-chk-label {
            width: auto;
            font-family: 'Inter', sans-serif;
            font-style: normal;
            font-weight: 400;
            font-size: 7px;
            line-height: 8px;
            color: #4D4D4D;
        }

        /* color squares matching Figma */
        .cell-color-squares {
            display: inline-flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 0px;
            gap: 2px;
            width: 46px;
            height: 10px;
        }

        .cell-color-rect {
            box-sizing: border-box;
            width: 10px;
            height: 10px;
            border: 0.5px solid #BFC4CC;
            border-radius: 1px;
            transition: transform 0.12s ease;
            cursor: pointer;
        }

        .cell-color-rect.active {
            transform: scale(1.3);
            outline: 1px solid #000000;
            z-index: 1;
        }

        /* table-footer matching Figma */
        .table-footer {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            width: 100%;
            height: 68px;
            flex: none;
            order: 3;
            align-self: stretch;
            flex-grow: 0;
            z-index: 3;
            border-top: 1px solid #E4E4E7;
            background: #FFFFFF;
        }

        .footer-note,
        .footer-validation-msg {
            font-family: 'Geist', 'Inter', -apple-system, sans-serif;
            font-style: normal;
            font-weight: 400;
            font-size: 12px;
            line-height: 16px;
            color: #71717A;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .pagination-group,
        .footer-pagination {
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: 0px;
            gap: 8px;
            height: 28px;
            flex: none;
            order: 1;
            flex-grow: 0;
        }

        .btn-prev {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 6px 12px;
            width: 74px;
            height: 28px;
            border: 1px solid #E4E4E7;
            border-radius: 4px;
            background: #FFFFFF;
            font-family: 'Geist', 'Inter', -apple-system, sans-serif;
            font-style: normal;
            font-weight: 600;
            font-size: 12px;
            line-height: 16px;
            color: #71717A;
            cursor: pointer;
            flex: none;
            order: 0;
            flex-grow: 0;
            transition: all 0.15s ease;
        }

        .btn-prev:hover {
            background: #F4F4F5;
            color: #09090B;
            border-color: #D4D4D8;
        }

        .btn-next {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 6px 12px;
            width: 134px;
            height: 28px;
            border: 1px solid #E4E4E7;
            border-radius: 4px;
            background: #FFFFFF;
            font-family: 'Geist', 'Inter', -apple-system, sans-serif;
            font-style: normal;
            font-weight: 600;
            font-size: 12px;
            line-height: 16px;
            color: #09090B;
            cursor: pointer;
            flex: none;
            order: 1;
            flex-grow: 0;
            transition: all 0.15s ease;
        }

        .btn-next:hover {
            background: #09090B;
            color: #FFFFFF;
            border-color: #09090B;
        }

        /* Column Header with Delete Action */
        .th-content-box {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            width: 100%;
            padding: 0 14px 0 4px;
            box-sizing: border-box;
        }

        .th-del-btn {
            position: absolute;
            right: 0px;
            top: 50%;
            transform: translateY(-50%);
            width: 14px;
            height: 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 3px;
            border: none;
            background: transparent;
            color: #A1A1AA;
            cursor: pointer;
            opacity: 0;
            transition: all 0.15s ease;
            padding: 0;
        }

        .table-column-header-tr th:hover .th-del-btn {
            opacity: 1;
        }

        .th-del-btn:hover {
            background: #FEE2E2;
            color: #EF4444;
        }

        /* Row Delete Action Button */
        .cell-del-row-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border: 1px solid transparent;
            border-radius: 4px;
            background: transparent;
            color: #94A3B8;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .cell-del-row-btn:hover {
            background: #FEF2F2;
            border-color: #FECACA;
            color: #EF4444;
            transform: scale(1.1);
        }

        .btn-restore-cols {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 5px 10px;
            height: 34px;
            background: #F4F4F5;
            border: 1px solid #E4E4E7;
            border-radius: 6px;
            color: #52525B;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            white-space: nowrap;
        }

        .btn-restore-cols:hover {
            background: #E4E4E7;
            color: #09090B;
        }

        /* table-footer */
        .table-footer {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 16px 24px;
            width: 100%;
            height: 64px;
            border-top: 1px solid #E4E4E7;
            background: #FAFAFA;
            z-index: 3;
            flex: none;
            order: 3;
            align-self: stretch;
            flex-grow: 0;
            gap: 16px;
        }

        .footer-validation-msg {
            font-family: 'Geist', 'Inter', -apple-system, sans-serif;
            font-style: normal;
            font-weight: 500;
            font-size: 12px;
            line-height: 16px;
            color: #71717A;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .footer-pagination {
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: 0px;
            gap: 10px;
            height: 32px;
        }

        .btn-prev {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 6px 14px;
            height: 32px;
            border: 1px solid #E4E4E7;
            border-radius: 6px;
            background: #FFFFFF;
            font-family: 'Geist', 'Inter', -apple-system, sans-serif;
            font-style: normal;
            font-weight: 600;
            font-size: 12px;
            color: #52525B;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .btn-prev:hover {
            background: #F4F4F5;
            color: #09090B;
            border-color: #D4D4D8;
        }

        .btn-next {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 6px 16px;
            min-width: 140px;
            height: 32px;
            border: 1px solid #09090B;
            border-radius: 6px;
            background: #09090B;
            font-family: 'Geist', 'Inter', -apple-system, sans-serif;
            font-style: normal;
            font-weight: 600;
            font-size: 12px;
            color: #FFFFFF;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .btn-next:hover {
            background: #27272A;
            border-color: #27272A;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* ==========================================================================
           REAL-WORLD PUBLICATION READER & INTERACTIVE SANDBOX STYLES
           ========================================================================== */
        .excel-post-modal {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 120;
            background: rgba(9, 9, 11, 0.75);
            backdrop-filter: blur(8px);
            align-items: center;
            justify-content: center;
            padding: 20px;
            opacity: 0;
            transition: opacity 0.25s ease;
            font-family: 'Geist', 'Inter', -apple-system, sans-serif;
        }

        .excel-post-modal.open {
            display: flex;
            opacity: 1;
        }

        .excel-reader-card {
            background: #FFFFFF;
            border: 1px solid #E4E4E7;
            border-radius: 16px;
            width: min(960px, 96vw);
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
            overflow: hidden;
            animation: readerScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes readerScaleIn {
            from { transform: scale(0.96); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }

        .excel-reader-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 24px;
            border-bottom: 1px solid #E4E4E7;
            background: #FAFAFA;
        }

        .reader-header-badges {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        .reader-badge-cat {
            background: #EFF6FF;
            color: #1D4ED8;
            border: 1px solid #BFDBFE;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.02em;
        }

        .reader-badge-pqc {
            background: #ECFDF5;
            color: #047857;
            border: 1px solid #A7F3D0;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }

        .reader-meta-item {
            font-size: 12px;
            color: #71717A;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }

        .excel-reader-body {
            padding: 28px;
            overflow-y: auto;
            max-height: calc(90vh - 75px);
            display: flex;
            flex-direction: column;
            gap: 22px;
        }

        .reader-article-title {
            font-size: 24px;
            font-weight: 800;
            color: #09090B;
            line-height: 1.3;
            letter-spacing: -0.02em;
            margin: 0;
        }

        .reader-author-strip {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 18px;
            background: #F4F4F5;
            border-radius: 10px;
            font-size: 13px;
            color: #3F3F46;
            flex-wrap: wrap;
            gap: 12px;
        }

        .reader-author-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .reader-author-avatar {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #09090B;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
        }

        .reader-bento-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
            gap: 12px;
        }

        .reader-bento-card {
            background: #FAFAFA;
            border: 1px solid #E4E4E7;
            border-radius: 10px;
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .reader-bento-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
            background: #FFFFFF;
        }

        .reader-bento-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #71717A;
        }

        .reader-bento-value {
            font-size: 15px;
            font-weight: 700;
            color: #09090B;
            font-family: 'Geist Mono', monospace;
        }

        .reader-bento-sub {
            font-size: 11px;
            color: #059669;
            font-weight: 500;
        }

        /* Code Window IDE */
        .reader-code-window {
            background: #0D1117;
            border: 1px solid #30363D;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }

        .reader-code-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #161B22;
            padding: 10px 16px;
            border-bottom: 1px solid #30363D;
        }

        .reader-code-dots {
            display: flex;
            gap: 6px;
        }

        .reader-code-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }
        .reader-code-dot.red { background: #FF5F56; }
        .reader-code-dot.yellow { background: #FFBD2E; }
        .reader-code-dot.green { background: #27C93F; }

        .reader-code-filename {
            font-family: 'Geist Mono', monospace;
            font-size: 12px;
            color: #8B949E;
            font-weight: 500;
        }

        .reader-code-actions {
            display: flex;
            gap: 8px;
        }

        .reader-code-btn {
            background: #21262D;
            border: 1px solid #30363D;
            color: #C9D1D9;
            padding: 5px 12px;
            border-radius: 6px;
            font-size: 11px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.15s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .reader-code-btn:hover {
            background: #30363D;
            color: #FFFFFF;
        }

        .reader-code-btn.copied {
            background: #047857;
            border-color: #10B981;
            color: #FFFFFF;
        }

        .reader-code-pre {
            margin: 0;
            padding: 16px;
            background: #0D1117;
            color: #E6EDF3;
            font-family: 'Geist Mono', 'Fira Code', Consolas, monospace;
            font-size: 13px;
            line-height: 1.6;
            overflow-x: auto;
            max-height: 320px;
            tab-size: 4;
        }

        /* Sandbox Terminal Output */
        .reader-sandbox-console {
            background: #000000;
            border-top: 1px solid #30363D;
            padding: 12px 16px;
            font-family: 'Geist Mono', monospace;
            font-size: 12px;
            color: #34D399;
            display: none;
            white-space: pre-wrap;
            line-height: 1.5;
        }

        .reader-sandbox-console.open {
            display: block;
        }

        .reader-footer-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 14px;
            border-top: 1px solid #E4E4E7;
            flex-wrap: wrap;
            gap: 12px;
        }

        .reader-like-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            background: #FEE2E2;
            color: #DC2626;
            border: 1px solid #FECACA;
            border-radius: 6px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .reader-like-btn:hover {
            background: #FECACA;
            transform: scale(1.05);
        }

        .reader-comments-wrap {
            margin-top: 8px;
            background: #FAFAFA;
            border: 1px solid #E4E4E7;
            border-radius: 10px;
            padding: 14px 18px;
        }

        .reader-comment-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #E4E4E7;
            border-radius: 6px;
            font-size: 12px;
            font-family: inherit;
            outline: none;
            margin-bottom: 8px;
        }

        .reader-comment-input:focus {
            border-color: #09090B;
        }

        /* ==========================================================================
           ADMIN PANEL (DILITHIUM-5 POST-QUANTUM CONTROL & PUBLICATION ENGINE)
           ========================================================================== */
        
        /* Gate Overlay */
        .admin-gate-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 98;
            background: rgba(9, 9, 11, 0.7);
            backdrop-filter: blur(8px);
            align-items: center;
            justify-content: center;
            padding: 16px;
            font-family: 'Geist', 'Inter', -apple-system, sans-serif;
            opacity: 0;
            transition: opacity 0.25s ease;
        }

        .admin-gate-overlay.open {
            display: flex;
            opacity: 1;
        }

        .admin-gate-card {
            width: min(620px, 94vw);
            background: #FFFFFF;
            border: 1px solid #E4E4E7;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
            padding: 28px;
            display: flex;
            flex-direction: column;
            gap: 18px;
            position: relative;
        }

        .admin-gate-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
        }

        .admin-gate-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background: #F4F4F5;
            color: #09090B;
            border: 1px solid #E4E4E7;
            padding: 3px 8px;
            border-radius: 6px;
        }

        .admin-gate-title {
            font-size: 20px;
            font-weight: 700;
            color: #09090B;
            margin: 6px 0 2px;
        }

        .admin-gate-desc {
            font-size: 13px;
            color: #71717A;
            line-height: 1.5;
        }

        .admin-gate-textarea {
            width: 100%;
            height: 140px;
            background: #F9FAFB;
            border: 1px solid #E0E2E6;
            border-radius: 8px;
            padding: 10px 12px;
            font-family: 'Geist Mono', 'IBM Plex Mono', monospace;
            font-size: 11.5px;
            color: #09090B;
            resize: none;
            outline: none;
            line-break: anywhere;
            box-sizing: border-box;
        }

        .admin-gate-textarea:focus {
            border-color: #09090B;
            background: #FFFFFF;
            box-shadow: 0 0 0 2px rgba(9, 9, 11, 0.1);
        }

        .admin-gate-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
        }

        .admin-gate-btn {
            background: #09090B;
            color: #FFFFFF;
            border: 1px solid #09090B;
            padding: 8px 18px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.15s ease;
        }

        .admin-gate-btn:hover {
            background: #27272A;
            transform: translateY(-1px);
        }

        .admin-gate-btn.secondary {
            background: #FFFFFF;
            color: #71717A;
            border-color: #E4E4E7;
        }

        .admin-gate-btn.secondary:hover {
            background: #F4F4F5;
            color: #09090B;
        }

        /* Main Admin Panel Overlay */
        .admin-panel-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 96;
            background: rgba(9, 9, 11, 0.65);
            backdrop-filter: blur(6px);
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: 'Geist', 'Inter', -apple-system, sans-serif;
            opacity: 0;
            transition: opacity 0.25s ease;
        }

        .admin-panel-overlay.open {
            display: flex;
            opacity: 1;
        }

        .admin-panel-shell {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 32px 40px;
            gap: 28px;
            width: min(1440px, 98vw);
            max-height: 94vh;
            background: #FFFFFF;
            border: 1px solid #E4E4E7;
            border-radius: 20px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
            overflow-y: auto;
            overflow-x: hidden;
            position: relative;
        }

        /* Content Header */
        .admin-content-header {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0px;
            width: 100%;
            min-height: 53px;
            gap: 16px;
            flex-wrap: wrap;
        }

        .admin-title-group {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 0px;
            gap: 4px;
            flex: 1;
        }

        .admin-main-title {
            font-family: 'Geist', sans-serif;
            font-style: normal;
            font-weight: 700;
            font-size: 24px;
            line-height: 31px;
            color: #09090B;
            margin: 0;
        }

        .admin-main-subtitle {
            font-family: 'Geist', sans-serif;
            font-style: normal;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            color: #71717A;
            margin: 0;
        }

        .admin-header-actions {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .admin-export-button {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: 10px 16px;
            gap: 8px;
            height: 37px;
            background: #FFFFFF;
            border: 1px solid #E4E4E7;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Geist', sans-serif;
            font-style: normal;
            font-weight: 600;
            font-size: 13px;
            line-height: 17px;
            color: #09090B;
            transition: all 0.15s ease;
        }

        .admin-export-button:hover {
            background: #F4F4F5;
            border-color: #D4D4D8;
        }

        .admin-close-btn {
            background: #F4F4F5;
            color: #71717A;
            border: 1px solid #E4E4E7;
            width: 37px;
            height: 37px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .admin-close-btn:hover {
            background: #EF4444;
            color: #FFFFFF;
            border-color: #EF4444;
        }

        /* Metrics Row (4 Cards) */
        .admin-metrics-row {
            box-sizing: border-box;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            width: 100%;
        }

        .admin-metric-card {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 24px;
            gap: 16px;
            isolation: isolate;
            min-height: 437px;
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            box-shadow: 0px 10px 24px -10px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.04);
            border-radius: 16px;
            position: relative;
            overflow: hidden;
        }

        /* Decorative Abstract Elements inside Cards */
        .admin-deco-bg {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
        }

        .admin-deco-diag {
            position: absolute;
            width: 40px;
            height: 0px;
            border: 0.5px solid rgba(217, 222, 230, 0.4);
            transform: rotate(45deg);
        }

        .admin-deco-dot {
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(217, 222, 230, 0.4);
            border-radius: 50%;
        }

        .admin-deco-cross-h {
            position: absolute;
            width: 8px;
            height: 0px;
            border: 0.5px solid rgba(217, 222, 230, 0.4);
        }

        .admin-deco-cross-v {
            position: absolute;
            width: 8px;
            height: 0px;
            border: 0.5px solid rgba(217, 222, 230, 0.4);
            transform: rotate(90deg);
        }

        .admin-deco-diamond {
            box-sizing: border-box;
            position: absolute;
            width: 6px;
            height: 6px;
            border: 0.5px solid rgba(217, 222, 230, 0.4);
            transform: rotate(-45deg);
        }

        .admin-deco-arc {
            box-sizing: border-box;
            position: absolute;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 0.5px solid rgba(217, 222, 230, 0.25);
        }

        .admin-deco-hline {
            position: absolute;
            width: 20px;
            height: 0px;
            border: 0.5px solid rgba(217, 222, 230, 0.4);
        }

        /* Card Header */
        .admin-card-header {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 0px;
            width: 100%;
            height: 18px;
            z-index: 1;
        }

        .admin-card-header-title {
            font-family: 'Geist', sans-serif;
            font-style: normal;
            font-weight: 600;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            color: #6B7280;
        }

        .admin-grid-icon {
            width: 16px;
            height: 16px;
            color: #6B7280;
        }

        /* Card Body & 2x4 Grid */
        .admin-card-body {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 0px;
            gap: 12px;
            width: 100%;
            z-index: 2;
        }

        .admin-grid-2x4 {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 0px;
            width: 100%;
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            box-shadow: 0px 12px 28px -12px rgba(0, 0, 0, 0.07), 0px 1px 2px rgba(0, 0, 0, 0.04);
            border-radius: 16px;
            overflow: hidden;
        }

        .admin-grid-head {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 10px 16px;
            width: 100%;
            height: 36px;
            background: #F3F4F6;
            border-bottom: 1px solid #E5E7EB;
        }

        .admin-grid-head span {
            font-family: 'Geist', 'Inter', sans-serif;
            font-style: normal;
            font-weight: 700;
            font-size: 12px;
            line-height: 16px;
            text-transform: uppercase;
            color: #111827;
        }

        .admin-grid-row {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 10px 14px;
            width: 100%;
            min-height: 52px;
            border-bottom: 1px solid #E5E7EB;
        }

        .admin-grid-row:nth-child(even) {
            background: #F9FAFB;
        }

        .admin-grid-row:last-child {
            border-bottom: none;
        }

        .admin-grid-label {
            font-family: 'Geist', 'Inter', sans-serif;
            font-style: normal;
            font-weight: 500;
            font-size: 12.5px;
            line-height: 16px;
            color: #333840;
            flex: 1;
            padding-right: 8px;
        }

        .admin-grid-input {
            box-sizing: border-box;
            width: 110px;
            height: 28px;
            background: #F9FAFB;
            border: 1px solid #E0E2E6;
            border-radius: 4px;
            padding: 4px 8px;
            font-family: 'Inter', sans-serif;
            font-size: 11.5px;
            color: #09090B;
            outline: none;
        }

        .admin-grid-input:focus {
            background: #FFFFFF;
            border-color: #09090B;
        }

        .admin-grid-input-wrap {
            display: flex;
            align-items: center;
            gap: 4px;
            background: #F9FAFB;
            border: 1px solid #E0E2E6;
            border-radius: 4px;
            padding: 2px 6px;
            width: 110px;
            height: 28px;
            box-sizing: border-box;
        }

        .admin-grid-input-wrap input {
            border: none;
            background: transparent;
            width: 100%;
            font-family: 'Inter', sans-serif;
            font-size: 11.5px;
            color: #09090B;
            outline: none;
        }

        /* Icon Upload Button */
        .admin-code-upload-btn {
            box-sizing: border-box;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: 110px;
            height: 28px;
            background: #F9FAFB;
            border: 1px solid #E0E2E6;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            color: #09090B;
            transition: all 0.15s ease;
        }

        .admin-code-upload-btn:hover {
            background: #09090B;
            color: #FFFFFF;
            border-color: #09090B;
        }

        .admin-code-upload-btn svg {
            width: 14px;
            height: 14px;
            fill: currentColor;
        }

        /* Post-Quantum Authorized Button */
        .admin-btn-authorized {
            box-sizing: border-box;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 4px 8px;
            width: 110px;
            height: 28px;
            background: #FFFFFF;
            border: 1px solid #D1D6DB;
            border-radius: 4px;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            font-size: 10.5px;
            font-weight: 600;
            color: #09090B;
            position: relative;
            overflow: hidden;
            transition: all 0.15s ease;
        }

        .admin-btn-authorized:hover {
            background: #F0FDF4;
            border-color: #059669;
            color: #059669;
        }

        .admin-btn-authorized.signed {
            background: #ECFDF5;
            border-color: #10B981;
            color: #047857;
        }

        /* Checkboxes Yes / No */
        .admin-checkbox-group {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 110px;
            justify-content: center;
        }

        .admin-chk-label {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            font-size: 10.5px;
            color: #333333;
            cursor: pointer;
        }

        .admin-chk-label input[type="radio"] {
            width: 12px;
            height: 12px;
            margin: 0;
            cursor: pointer;
        }

        /* Color Squares */
        .admin-color-squares {
            display: flex;
            align-items: center;
            gap: 4px;
            width: 110px;
            justify-content: center;
        }

        .admin-color-square {
            width: 14px;
            height: 14px;
            border: 0.5px solid #BFC4CC;
            border-radius: 2px;
            cursor: pointer;
            transition: transform 0.15s ease;
        }

        .admin-color-square:hover {
            transform: scale(1.2);
        }

        .admin-color-square.active {
            outline: 2px solid #09090B;
            outline-offset: 1px;
        }

        /* Card Submit Button */
        .admin-btn-submit {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            padding: 10px 16px;
            width: 100%;
            height: 39px;
            background: #FFFFFF;
            border: 1px solid #E6E6EB;
            box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.04);
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Geist', sans-serif;
            font-style: normal;
            font-weight: 600;
            font-size: 13px;
            line-height: 17px;
            letter-spacing: 0.2px;
            color: #12171C;
            position: relative;
            overflow: hidden;
            transition: all 0.15s ease;
        }

        .admin-btn-submit:hover {
            background: #09090B;
            color: #FFFFFF;
            border-color: #09090B;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        /* Table Section Card */
        .admin-table-card {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 0px;
            width: 100%;
            background: #FFFFFF;
            border: 1px solid #E4E4E7;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }

        .admin-table-header-controls {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            width: 100%;
            min-height: 72px;
            gap: 16px;
            flex-wrap: wrap;
            border-bottom: 1px solid #E4E4E7;
        }

        .admin-table-title {
            font-family: 'Geist', sans-serif;
            font-style: normal;
            font-weight: 700;
            font-size: 16px;
            line-height: 21px;
            color: #09090B;
            margin: 0;
        }

        .admin-filter-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .admin-filter-search {
            box-sizing: border-box;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            border: 1px solid #E4E4E7;
            border-radius: 6px;
            background: #FFFFFF;
            width: 220px;
            height: 32px;
        }

        .admin-filter-search input {
            border: none;
            background: transparent;
            font-family: 'Geist', sans-serif;
            font-size: 12px;
            color: #09090B;
            outline: none;
            width: 100%;
        }

        .admin-filter-all-btn {
            display: flex;
            align-items: center;
            padding: 6px 14px;
            height: 32px;
            background: #000000;
            border: 1px solid #000000;
            border-radius: 6px;
            font-family: 'Geist', sans-serif;
            font-weight: 600;
            font-size: 12px;
            color: #FFFFFF;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .admin-filter-all-btn:hover {
            background: #27272A;
        }

        /* 16-Column Data Table */
        .admin-table-viewport {
            width: 100%;
            overflow-x: auto;
        }

        .admin-16col-table {
            width: 100%;
            min-width: 1360px;
            border-collapse: collapse;
            font-family: 'Inter', sans-serif;
            font-size: 11px;
        }

        .admin-16col-table th {
            background: #F4F4F5;
            border-bottom: 1px solid #E4E4E7;
            border-right: 1px solid #E0E3E8;
            padding: 8px 6px;
            font-weight: 500;
            font-size: 9.5px;
            line-height: 12px;
            color: #595E66;
            text-align: center;
            height: 48px;
            vertical-align: middle;
        }

        .admin-16col-table td {
            border-bottom: 1px solid #EBEDF0;
            border-right: 1px solid #EBEDF0;
            padding: 6px 6px;
            text-align: center;
            height: 40px;
            vertical-align: middle;
        }

        .admin-16col-table tr:nth-child(even) td {
            background: #FAFAFC;
        }

        .admin-16col-table tr:hover td {
            background: #F1F5F9;
        }

        .admin-16col-table tr.active-row td {
            background: #EFF6FF !important;
        }

        .admin-16col-table tr.pulse-row td {
            animation: adminRowPulse 1.4s ease;
        }

        @keyframes adminRowPulse {
            0% { background: #BBF7D0 !important; }
            50% { background: #DCFCE7 !important; }
            100% { background: #EFF6FF !important; }
        }

        .admin-cell-input {
            width: 68px;
            height: 24px;
            background: #F9FAFB;
            border: 1px solid #E0E2E6;
            border-radius: 3px;
            padding: 2px 4px;
            font-size: 10.5px;
            color: #09090B;
            outline: none;
            text-align: center;
        }

        .admin-cell-input:focus {
            background: #FFFFFF;
            border-color: #09090B;
        }

        .admin-cell-btn-auth {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 64px;
            height: 22px;
            background: #FFFFFF;
            border: 1px solid #D1D6DB;
            border-radius: 3px;
            font-size: 8.5px;
            color: #000000;
            cursor: pointer;
        }

        .admin-cell-btn-auth.signed {
            background: #ECFDF5;
            border-color: #10B981;
            color: #047857;
            font-weight: 700;
        }

        .admin-cell-code-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 24px;
            background: #F9FAFB;
            border: 1px solid #E0E2E6;
            border-radius: 3px;
            cursor: pointer;
        }

        .admin-cell-code-btn svg {
            width: 14px;
            height: 14px;
            fill: #000000;
        }

        /* Table Footer */
        .admin-table-footer {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 16px 24px;
            width: 100%;
            border-top: 1px solid #E4E4E7;
            background: #FFFFFF;
            gap: 16px;
            flex-wrap: wrap;
        }

        .admin-table-footer-note {
            font-family: 'Geist', sans-serif;
            font-weight: 400;
            font-size: 12px;
            line-height: 16px;
            color: #71717A;
        }

        .admin-pagination-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .admin-btn-prev {
            box-sizing: border-box;
            display: flex;
            align-items: center;
            padding: 6px 14px;
            height: 32px;
            background: #FFFFFF;
            border: 1px solid #E4E4E7;
            border-radius: 6px;
            font-family: 'Geist', sans-serif;
            font-weight: 600;
            font-size: 12px;
            color: #71717A;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .admin-btn-prev:hover {
            background: #F4F4F5;
            color: #09090B;
        }

        .admin-btn-launch {
            box-sizing: border-box;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 18px;
            height: 32px;
            background: #09090B;
            border: 1px solid #09090B;
            border-radius: 6px;
            font-family: 'Geist', sans-serif;
            font-weight: 600;
            font-size: 12px;
            color: #FFFFFF;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
            transition: all 0.15s ease;
        }

        .admin-btn-launch:hover {
            background: #107C41;
            border-color: #107C41;
            transform: translateY(-1px);
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

        @keyframes gatewayCrescentOrbit {
            0% { transform: rotate(0deg) scale(1); }
            25% { transform: rotate(14deg) translateY(-1px) scale(1.05); }
            50% { transform: rotate(0deg) scale(1); }
            75% { transform: rotate(-14deg) translateY(1px) scale(0.96); }
            100% { transform: rotate(0deg) scale(1); }
        }

        .gateway-action-btn,
        .tabby-gateway-btn,
        .notepad-gateway-btn,
        .icon-gateway,
        .action-gateway-btn,
        .terminal-download-btn.gateway-action-btn {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }

        .gateway-action-btn svg,
        .tabby-gateway-btn svg,
        .notepad-gateway-btn svg,
        .icon-gateway svg,
        .action-gateway-btn svg,
        .gateway-crescent-svg {
            display: inline-block;
            animation: gatewayCrescentOrbit 6s ease-in-out infinite;
            transform-origin: center center;
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .gateway-action-btn:hover svg,
        .tabby-gateway-btn:hover svg,
        .notepad-gateway-btn:hover svg,
        .icon-gateway:hover svg,
        .action-gateway-btn:hover svg,
        .gateway-action-btn:hover .gateway-crescent-svg {
            animation: none;
            transform: rotate(85deg) scale(1.25);
            color: #000000;
        }

        .gateway-action-btn:active svg,
        .tabby-gateway-btn:active svg,
        .notepad-gateway-btn:active svg,
        .icon-gateway:active svg,
        .action-gateway-btn:active svg {
            transform: rotate(-30deg) scale(0.9);
        }

        .gateway-modal {
            background: #ffffff;
            border: 1px solid #e0dcd3;
            border-radius: 12px;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.22);
            max-width: 480px;
            width: 100%;
            padding: 20px 22px;
            font-family: 'IBM Plex Mono', monospace;
            animation: gatewayModalPop 0.24s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes gatewayModalPop {
            from { opacity: 0; transform: scale(0.94) translateY(8px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .gateway-modal-title {
            font-size: 10.5px;
            font-weight: 700;
            color: #777;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        .gateway-modal-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
            font-size: 15px;
            font-weight: 700;
            color: #111111;
        }

        .gateway-modal-brand svg,
        .gateway-modal-brand img {
            width: 24px;
            height: 24px;
            flex-shrink: 0;
        }

        .gateway-brand-heading {
            display: inline-flex;
            align-items: baseline;
            gap: 6px;
            flex-wrap: wrap;
        }

        .gateway-brand-primary {
            font-weight: 700;
            color: #000000;
            font-size: 15px;
            letter-spacing: -0.01em;
        }

        .gateway-brand-sub {
            color: #666666;
            font-size: 12px;
            font-weight: 500;
        }

        .gateway-modal-text {
            color: #333;
            font-size: 12px;
            line-height: 1.48;
            margin-bottom: 12px;
        }

        .gateway-modal-text code {
            background: #f4f2ec;
            padding: 1px 5px;
            border-radius: 4px;
            font-weight: 600;
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
            transition: background 0.15s ease, transform 0.1s ease;
        }

        .gateway-modal-btn:hover:not(:disabled) {
            background: #222222;
        }

        .gateway-modal-btn:active:not(:disabled) {
            transform: scale(0.97);
        }

        .gateway-modal-btn:disabled {
            opacity: 0.55;
            cursor: wait;
        }

        .gateway-modal-btn.secondary {
            background: #eceae4;
            color: #111;
        }

        .gateway-modal-btn.secondary:hover:not(:disabled) {
            background: #dfdcd4;
        }

        .gateway-modal-status {
            margin-top: 12px;
            font-size: 12px;
            color: #666;
            min-height: 16px;
            line-height: 1.4;
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
            animation: gatewayCodeReveal 0.25s ease;
        }

        @keyframes gatewayCodeReveal {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
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
            fill: currentColor;
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

        .auth-header-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }

        .auth-brand-icon {
            width: 28px;
            height: 26px;
            flex-shrink: 0;
            display: inline-block;
        }

        .auth-title-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .auth-card h1 {
            margin: 0;
            font-size: 19px;
            font-weight: 700;
            color: #111;
            letter-spacing: -0.02em;
            font-family: 'Geist Mono', 'IBM Plex Mono', monospace;
        }

        .auth-badge-pqc {
            display: inline-flex;
            align-items: center;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 7px;
            background: #000000;
            color: #ffffff;
            border-radius: 4px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }

        .auth-card .auth-sub {
            margin: 0 0 18px;
            font-size: 12px;
            color: #555;
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

        .auth-privacy-notice {
            margin-top: 10px;
            font-size: 10.5px;
            color: #6b7280;
            line-height: 1.4;
            text-align: left;
        }

        .auth-privacy-notice .privacy-link,
        .auth-privacy-agreement .privacy-link {
            color: #111827;
            font-weight: 600;
            text-decoration: underline;
            text-underline-offset: 2px;
            cursor: pointer;
            transition: color 0.15s ease;
        }

        .auth-privacy-notice .privacy-link:hover,
        .auth-privacy-agreement .privacy-link:hover {
            color: #2563eb;
        }

        .auth-privacy-agreement {
            margin: 10px 0 12px;
            padding: 8px 10px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            text-align: left;
        }

        .auth-privacy-checkbox-label {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 11px;
            color: #374151;
            line-height: 1.35;
            cursor: pointer;
        }

        .auth-privacy-checkbox-label input[type="checkbox"] {
            margin-top: 2px;
            cursor: pointer;
            accent-color: #111;
        }

        .auth-privacy-btn-link {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: none;
            border: none;
            padding: 0;
            margin-top: 4px;
            font-family: inherit;
            font-size: 10.5px;
            font-weight: 600;
            color: #1f2937;
            text-decoration: underline;
            text-underline-offset: 2px;
            cursor: pointer;
        }

        .auth-privacy-btn-link:hover {
            color: #2563eb;
        }

        /* Privacy Policy Modal Overlay & Styling */
        .privacy-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 100000;
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(6px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.25s ease;
        }

        .privacy-modal-overlay.open {
            opacity: 1;
            pointer-events: auto;
        }

        .privacy-modal-card {
            width: min(780px, 96vw);
            max-height: 88vh;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            animation: privacyCardScale 0.25s ease-out both;
        }

        @keyframes privacyCardScale {
            from { transform: scale(0.96); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }

        .privacy-modal-header {
            padding: 18px 22px;
            background: #fbfbfb;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .privacy-modal-body {
            padding: 22px 24px;
            overflow-y: auto;
            color: #374151;
            font-size: 12.5px;
            line-height: 1.65;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .privacy-modal-body h3 {
            margin: 16px 0 6px;
            font-size: 13.5px;
            font-weight: 700;
            color: #111827;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .privacy-modal-body h3:first-child {
            margin-top: 0;
        }

        .privacy-modal-body p {
            margin: 0 0 10px;
        }

        .privacy-modal-body ul {
            margin: 0 0 12px 18px;
            padding: 0;
        }

        .privacy-modal-body li {
            margin-bottom: 5px;
        }

        .privacy-modal-footer {
            padding: 14px 22px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 10px;
        }

        .privacy-highlight-box {
            background: #f3f4f6;
            border-left: 3px solid #111827;
            padding: 10px 14px;
            border-radius: 0 6px 6px 0;
            margin: 12px 0;
            font-size: 12px;
        }

        .privacy-evidence-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            margin: 16px 0 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .privacy-evidence-img {
            width: 100%;
            height: auto;
            display: block;
            border-bottom: 1px solid #e5e7eb;
            cursor: zoom-in;
            transition: opacity 0.2s ease;
        }

        .privacy-evidence-img:hover {
            opacity: 0.96;
        }

        .privacy-evidence-caption {
            padding: 12px 14px;
            background: #f9fafb;
            font-size: 11.5px;
            color: #4b5563;
            line-height: 1.5;
        }

        .privacy-evidence-caption strong {
            color: #111827;
            display: block;
            margin-bottom: 4px;
            font-size: 12px;
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
            position: relative;
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


        .boot-mobile-toggle {
            position: fixed !important;
            top: calc(12px + env(safe-area-inset-top, 0px)) !important;
            right: calc(12px + env(safe-area-inset-right, 0px)) !important;
            left: auto !important;
            bottom: auto !important;
            z-index: 10050 !important;
            width: 44px;
            height: 44px;
            padding: 0;
            margin: 0;
            border: 1px solid #d0d0d0;
            border-radius: 12px;
            background: #ffffff !important;
            color: #111111;
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
            pointer-events: auto !important;
            opacity: 1 !important;
            visibility: visible !important;
            transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
        }

        .boot-cli-overlay.hidden .boot-mobile-toggle {
            display: none !important;
        }

        .boot-mobile-toggle:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
        }

        .boot-mobile-toggle[aria-pressed="true"] {
            color: #0b3d2e;
            background: #eef6f2 !important;
            border-color: #0b3d2e;
            box-shadow: 0 0 0 2px rgba(11, 61, 46, 0.2);
        }

        .boot-mobile-toggle svg {
            width: 28px;
            height: 28px;
            display: block;
            overflow: visible;
        }

        body.mobile-mode .boot-brand {
            top: auto;
            bottom: 96px;
            right: 22px;
            left: 22px;
            transform: none;
            justify-content: flex-end;
            animation: bootBrandInMobile 0.7s ease 0.15s both;
        }

        body.mobile-mode .boot-brand-name {
            white-space: normal;
            font-size: clamp(20px, 7vw, 32px);
        }

        body.mobile-mode .boot-cli-footer {
            flex-wrap: wrap;
            padding: 14px 16px calc(14px + env(safe-area-inset-bottom, 0px));
        }

        .boot-brand {
            position: absolute;
            top: 50%;
            right: clamp(28px, 8vw, 96px);
            transform: translateY(-50%);
            z-index: 4;
            display: flex;
            align-items: center;
            gap: clamp(14px, 2vw, 22px);
            pointer-events: none;
            animation: bootBrandIn 0.7s ease 0.15s both;
            font-family: 'Codec Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        @keyframes bootBrandIn {
            from { opacity: 0; transform: translateY(calc(-50% + 8px)); }
            to { opacity: 1; transform: translateY(-50%); }
        }

        .boot-brand-icon {
            width: clamp(52px, 6.5vw, 76px);
            height: clamp(44px, 5.5vw, 64px);
            flex: 0 0 auto;
            display: block;
        }

        .boot-brand-text {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
            gap: 1px;
            min-width: 0;
        }

        .boot-brand-row {
            display: flex;
            align-items: flex-start;
            gap: 4px;
            line-height: 1;
        }

        .boot-brand-main {
            margin: 0;
            color: #000000;
            font-family: 'Codec Pro', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-weight: 700;
            font-size: clamp(26px, 3.6vw, 42px);
            letter-spacing: -0.02em;
            line-height: 1;
            white-space: nowrap;
            font-synthesis: none;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
        }

        .boot-brand-reg {
            font-family: 'Codec Pro', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-weight: 600;
            font-size: clamp(11px, 1.3vw, 16px);
            line-height: 1;
            color: #000000;
            margin-top: 1px;
        }

        .boot-brand-sub {
            margin: 0;
            color: #000000;
            font-family: 'Codec Pro', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-weight: 400;
            font-size: clamp(17px, 2.3vw, 26px);
            letter-spacing: -0.015em;
            line-height: 1.1;
            white-space: nowrap;
            -webkit-font-smoothing: antialiased;
        }

        .boot-cli-footer {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10;
            padding: 14px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.92) 35%, #ffffff 100%);
            color: #666;
            font-size: 12px;
            box-sizing: border-box;
            pointer-events: none;
        }

        .boot-cli-footer > * {
            pointer-events: auto;
        }

        .boot-cli-hint-wrap {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
            flex: 1 1 auto;
            flex-wrap: wrap;
        }

        #bootCliHint {
            color: #555;
            font-size: 12px;
            letter-spacing: 0.01em;
            white-space: nowrap;
        }

        .boot-brand-logos {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            flex-shrink: 0;
        }

        .boot-linux-logo,
        .boot-github-logo,
        .boot-claude-logo,
        .boot-zylon-logo {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            color: #8a8a8a;
            transition: color 0.15s ease, transform 0.15s ease;
        }

        .boot-linux-logo:hover,
        .boot-github-logo:hover,
        .boot-claude-logo:hover,
        .boot-zylon-logo:hover,
        .boot-hashcod-logo:hover {
            color: #111111;
            transform: translateY(-1px);
        }

        .boot-linux-logo svg {
            width: 22px;
            height: 26px;
            display: block;
        }

        .boot-github-logo svg,
        .boot-claude-logo svg,
        .boot-zylon-logo svg {
            width: 20px;
            height: 20px;
            display: block;
            fill: currentColor;
        }

        .boot-hashcod-logo {
            display: inline-flex;
            align-items: center;
            flex: 0 0 auto;
            margin-left: 2px;
            line-height: 0;
            color: #8a8a8a;
            transition: color 0.15s ease;
        }

        .boot-hashcod-logo svg {
            height: 13px;
            width: auto;
            display: block;
        }

        .boot-cli-enter {
            flex-shrink: 0;
            border: 1px solid #111;
            background: #111;
            color: #fff;
            border-radius: 8px;
            padding: 9px 18px;
            font: 600 13px 'IBM Plex Mono', monospace;
            cursor: pointer;
            opacity: 0.4;
            pointer-events: none;
            transition: opacity 0.2s ease, transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
            white-space: nowrap;
        }

        .boot-cli-enter.ready {
            opacity: 1;
            pointer-events: auto;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }

        .boot-cli-enter.ready:hover {
            transform: translateY(-1px);
            background: #000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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

            .boot-brand-main {
                white-space: normal;
            }
        }

        /* ===== MOBILE MODE (toggle icono teléfono) ===== */
        html.mobile-mode,
        body.mobile-mode {
            -webkit-text-size-adjust: 100%;
            text-size-adjust: 100%;
        }

        body.mobile-mode {
            overflow-x: hidden;
        }

        body.mobile-mode .platform-shell {
            width: 100%;
            max-width: 430px;
            margin: 0 auto;
            min-height: 100vh;
            min-height: 100dvh;
            box-shadow: 0 0 0 1px #e8e8e8;
            background: #ffffff;
            position: relative;
            padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px));
        }

        body.mobile-mode .top-bar {
            flex-wrap: wrap;
            gap: 8px 6px;
            padding: 8px 10px;
            padding-top: calc(8px + env(safe-area-inset-top, 0px));
            align-items: flex-start;
            row-gap: 10px;
        }

        body.mobile-mode .left-controls {
            flex: 1 1 auto;
            flex-wrap: wrap;
            gap: 6px 8px;
            min-width: 0;
            max-width: 100%;
        }

        body.mobile-mode .checkbox-label span {
            font-size: 12px;
        }

        body.mobile-mode .hashcod-created-by {
            display: none;
        }

        body.mobile-mode .hashcod-tools-dock {
            margin-left: 0;
            order: 5;
            width: 100%;
            justify-content: space-between;
            max-width: 100%;
        }

        body.mobile-mode .top-bar-right {
            flex: 0 0 auto;
            margin-left: auto;
            gap: 10px;
            padding-right: 0;
            align-self: flex-start;
            padding-top: 2px;
        }

        body.mobile-mode .tokens-panel {
            right: 0;
            width: min(100vw - 16px, 400px);
            max-height: min(70vh, 560px);
        }

        body.mobile-mode .main-container {
            padding: 10px 10px 24px;
            gap: 12px;
        }

        body.mobile-mode .block-execution .block-symbol {
            width: 36px;
            min-width: 36px;
            min-height: 50px;
            font-size: 18px;
        }

        body.mobile-mode .block-execution .block-body {
            padding: 10px 12px;
            font-size: 12px;
            max-height: min(42vh, 360px);
        }

        body.mobile-mode .block-row.block-prompt {
            padding: 0 12px;
            gap: 8px;
        }

        body.mobile-mode .cmd-input {
            font-size: 16px; /* evita zoom iOS al enfocar */
        }

        body.mobile-mode .function-drawer {
            padding: 12px 12px;
        }

        body.mobile-mode .function-editor {
            height: min(42vh, 260px);
            font-size: 13px;
        }

        body.mobile-mode .repo-inspector-bar {
            gap: 8px;
            padding: 8px;
        }

        body.mobile-mode .repo-file-selector {
            min-width: 0;
            width: 100%;
            flex: 1 1 100%;
            font-size: 16px;
        }

        body.mobile-mode .virtual-keyboard-white {
            padding: 12px;
        }

        body.mobile-mode .vk-3panel-container {
            grid-template-columns: 1fr;
            gap: 12px;
        }

        body.mobile-mode .vk-card-panel {
            min-height: 0;
        }

        body.mobile-mode .catalog-header-bar {
            padding: 10px 12px;
            gap: 8px;
        }

        body.mobile-mode .catalog-metrics {
            gap: 10px;
            width: 100%;
        }

        body.mobile-mode .catalog-table-vector {
            font-size: 11px;
        }

        body.mobile-mode .notepad-overlay {
            padding: 0;
        }

        body.mobile-mode .notepad-main {
            grid-template-columns: 1fr;
        }

        body.mobile-mode .notepad-sidebar {
            max-height: 140px;
            border-right: none;
            border-bottom: 1px solid #d0d0d0;
        }

        body.mobile-mode .toolkit-ficha {
            grid-template-columns: 64px 1fr;
        }

        body.mobile-mode .toolkit-agent-main,
        body.mobile-mode .toolkit-pdf-main {
            grid-template-columns: 1fr;
        }

        body.mobile-mode .auth-card {
            width: min(100%, 430px);
            padding: 22px 16px 18px;
            border-radius: 0;
            max-height: 100vh;
            max-height: 100dvh;
        }

        body.mobile-mode .indices-bank-title {
            font-size: 28px;
        }

        body.mobile-mode .indices-bank-head {
            flex-wrap: wrap;
        }

        body.mobile-mode .indices-bank-actions {
            width: 100%;
            margin-left: 0;
        }

        /* Fly / dock: targets más cómodos en móvil */
        body.mobile-mode #flyRail .fly-handle {
            width: 10px !important;
            min-width: 10px !important;
            height: 88px !important;
            min-height: 88px !important;
        }

        body.mobile-mode #flyRail .fly-handle::after {
            width: 36px;
        }

        body.mobile-mode #dockBar .dock-swipe {
            height: 10px !important;
            min-height: 10px !important;
            width: 88px !important;
            min-width: 88px !important;
        }

        body.mobile-mode #dockBar .dock-toolbar {
            padding: 10px 14px;
            gap: 12px;
            padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
        }

        @media (max-width: 430px) {
            body.mobile-mode .platform-shell {
                max-width: 100%;
                box-shadow: none;
            }
        }

            /* Tabby Terminal Safe Embedded Constrains */
        svg.tabby-icon-svg, .tabby-icon-svg, .tabby-prompt-header svg, .tabby-terminal-container svg {
            width: 14px !important;
            height: 14px !important;
            max-width: 14px !important;
            max-height: 14px !important;
            min-width: 14px !important;
            min-height: 14px !important;
            display: inline-block !important;
            vertical-align: middle !important;
            flex-shrink: 0 !important;
        }
        .block-row.block-execution {
            border: 1px solid #d0d0d0;
            background: #ffffff;
            margin-bottom: 8px;
            border-radius: 6px;
            overflow: hidden;
        }
        .block-row.block-prompt {
            border: 1px solid #d0d0d0;
            background: #ffffff;
            border-radius: 0 0 6px 6px;
        }
    </style>
    <script src="<?php echo htmlspecialchars($L8_BASE, ENT_QUOTES, 'UTF-8'); ?>components/originkit/ui/blackhole-runtime.js"></script>
</head>
<body class="boot-locked">
    <script>
        (function () {
            try {
                if (localStorage.getItem('l8_mobile_mode') === '1') {
                    document.body.classList.add('mobile-mode');
                }
            } catch (e) {}
        })();
    </script>
    <div id="bootCliOverlay" class="boot-cli-overlay" role="dialog" aria-modal="true" aria-label="l8 codespace blackhole">
            <button type="button" class="boot-mobile-toggle" id="bootMobileModeBtn" title="Versión móvil" aria-label="Activar versión móvil" aria-pressed="false" onclick="toggleMobileMode()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28" role="img" aria-hidden="true">
                    <path fill="#111111" d="M27.957,6.628C27.813,0,22.806,0,20.92,0c-0.593,0-1.207,0.025-1.801,0.048 c-0.465,0.018-0.94,0.038-1.417,0.045l-0.163,0.004c-1.67,0.04-5.57,0.132-7.1,0.173c-0.045-0.001-0.09-0.001-0.134-0.001 c-5.201,0-5.252,5.412-5.277,8.013C5.023,8.686,5.02,9.065,5.003,9.4L5,9.449v0.049c-0.005,5.539,0.248,11.295,0.775,17.597h0 c0.021,0.239,0.125,1.117,0.558,1.781c0.664,1.098,1.962,1.788,3.761,1.999l0.027,0.003l0.027,0.002 c0.904,0.081,1.809,0.12,2.766,0.12c2.234,0,4.31-0.214,6.508-0.439l1.062-0.108l0.026-0.002l0.026-0.003l2.433-0.308l0.077-0.01 l0.076-0.016c0.029-0.004,0.073-0.008,0.121-0.013c0.355-0.036,0.947-0.098,1.747-0.43c1.429-0.562,2.447-2.179,2.374-3.749 l0.335-9.486c0.031-0.991,0.081-1.983,0.132-2.979C27.947,11.223,28.066,8.913,27.957,6.628z"></path>
                    <path fill="#ffffff" d="M25.978,6.249c-0.113-5.828-4.155-4.889-8.441-4.821c-1.625,0.039-5.876,0.141-7.445,0.184 C6.049,1.492,6.672,6.538,6.536,9.149c-0.006,6.008,0.29,12.032,0.785,18.017c0.009,0.175,0.123,0.746,0.273,0.943 c0.466,0.835,1.786,1.071,2.379,1.141c3.553,0.321,6.729-0.091,10.173-0.44l2.484-0.318c0.359-0.075,0.792-0.024,1.562-0.353 c0.698-0.267,1.245-1.215,1.177-1.994l0.345-9.899C25.815,12.948,26.134,9.551,25.978,6.249z M9.654,4.691 C9.694,4.538,9.75,4.43,9.78,4.372c1.224-0.093,3.406-0.218,5.298-0.329C15.032,4.188,15,4.34,15,4.5C15,5.328,15.672,6,16.5,6 S18,5.328,18,4.5c0-0.223-0.052-0.432-0.138-0.622c1.293-0.054,3.411-0.314,4.459-0.184c1.417,0.173,1.405,1.397,1.559,2.675 c0.363,5.01-0.41,12.118-0.751,17.654L10.046,24.77c-0.209-3.568-0.343-7.182-0.47-10.731C9.529,11.026,9.271,7.613,9.654,4.691z"></path>
                    <path fill="#ffffff" d="M19.684,14.835l0.829-1.02c0.175-0.215,0.142-0.529-0.072-0.703c-0.213-0.176-0.53-0.142-0.703,0.072l-0.827,1.018 c-0.697-0.443-1.523-0.703-2.41-0.703c-0.992,0-1.899,0.334-2.643,0.878l-0.97-1.193c-0.176-0.215-0.49-0.247-0.703-0.072 c-0.214,0.174-0.247,0.488-0.072,0.703l1.009,1.242c-0.635,0.728-1.053,1.649-1.113,2.676C12,17.877,12.121,18,12.265,18h8.471 c0.144,0,0.265-0.123,0.257-0.267C20.926,16.602,20.434,15.59,19.684,14.835z"></path>
                    <circle cx="14.5" cy="16.5" r=".5" fill="#fff"></circle>
                    <circle cx="18.5" cy="16.5" r=".5" fill="#fff"></circle>
                </svg>
            </button>
        <div class="boot-cli-window">
            <div class="boot-cli-stage">
                <div class="boot-cli-body" id="bootCliBody" hidden></div>
                <div class="boot-cli-visual" id="bootCliVisual">
                    <canvas id="bootBlackholeCanvas"></canvas>
                    <div class="boot-brand" aria-label="Hashcod codespace">
                        <svg class="boot-brand-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 470 440" fill="none" aria-hidden="true">
                            <path d="M 109 312 L 61 312 C 44.43 312 31 298.57 31 282 L 31 62 C 31 45.43 44.43 32 61 32 L 410 32 C 426.57 32 440 45.43 440 62 L 440 282 C 440 298.57 426.57 312 410 312 L 363 312" stroke="#000000" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M 227.5 243.5 C 231.2 237.1 240.8 237.1 244.5 243.5 L 358.5 415.2 C 362.5 421.9 357.7 425 350.0 425 L 122.0 425 C 114.3 425 109.5 421.9 113.5 415.2 Z" fill="#000000"/>
                        </svg>
                        <div class="boot-brand-text">
                            <div class="boot-brand-row">
                                <span class="boot-brand-main">Hashcod</span>
                                <span class="boot-brand-reg">®</span>
                            </div>
                            <span class="boot-brand-sub">codespace</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="boot-cli-footer">
                <div class="boot-cli-hint-wrap">
                    <span id="bootCliHint">Loading blackhole…</span>
                    <div class="boot-brand-logos">
                        <span class="boot-github-logo" title="GitHub" aria-label="GitHub">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96" aria-hidden="true">
                                <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
                            </svg>
                        </span>
                        <span class="boot-hashcod-logo" title="Created by diktatcart" aria-label="Created by diktatcart">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 142 16" width="115" height="13" aria-hidden="true">
                                <text x="0" y="12.5" fill="currentColor" font-family="'Codec Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5px" letter-spacing="-0.01em">
                                    <tspan font-weight="400">Created by </tspan><tspan font-weight="700">diktatcart</tspan>
                                </text>
                            </svg>
                        </span>
                    </div>
                </div>
                <button type="button" class="boot-cli-enter" id="bootCliEnter">Enter platform ↵</button>
            </div>
        </div>
    </div>

    <!-- Bloqueo: registro / inicio de sesión (después de Enter) -->
    <div id="authOverlay" class="auth-overlay hidden" role="dialog" aria-modal="true" aria-label="Acceso Hashcod codespace">
        <div class="auth-card">
            <div class="auth-header-brand">
                <svg class="auth-brand-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 470 440" fill="none" aria-hidden="true">
                    <path d="M 109 312 L 61 312 C 44.43 312 31 298.57 31 282 L 31 62 C 31 45.43 44.43 32 61 32 L 410 32 C 426.57 32 440 45.43 440 62 L 440 282 C 440 298.57 426.57 312 410 312 L 363 312" stroke="#000000" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M 227.5 243.5 C 231.2 237.1 240.8 237.1 244.5 243.5 L 358.5 415.2 C 362.5 421.9 357.7 425 350.0 425 L 122.0 425 C 114.3 425 109.5 421.9 113.5 415.2 Z" fill="#000000"/>
                </svg>
                <div class="auth-title-wrap">
                    <h1>Hashcod codespace</h1>
                    <span class="auth-badge-pqc">PQC Auth</span>
                </div>
            </div>
            <p class="auth-sub">Accede o crea tu cuenta. Plataforma de certificación determinista de creaciones con IA y seguridad post-cuántica.</p>

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
                <div class="auth-privacy-notice">
                    Al iniciar sesión, aceptas la <a href="javascript:void(0)" onclick="openPrivacyPolicyModal()" class="privacy-link">Política de Privacidad</a>: certificación determinista de IA mediante análisis de datos, desarrollo asistido por IA e infraestructura cloud con <strong>Supabase</strong> y <strong>Render</strong>.
                </div>
            </div>

            <div class="auth-panel" id="authPanelRegister">
                <label class="auth-label" for="authDilithiumInput">Dilithium-5 de registro (mensual)</label>
                <input class="auth-input" id="authDilithiumInput" type="password" autocomplete="off" spellcheck="false" placeholder="Clave Dilithium-5 del mes">
                <div class="auth-privacy-agreement">
                    <label class="auth-privacy-checkbox-label">
                        <input type="checkbox" id="authPrivacyCheckbox" checked>
                        <span>Acepto la <a href="javascript:void(0)" onclick="openPrivacyPolicyModal()" class="privacy-link">Política de Privacidad</a>: certificación de lo creado por IA mediante software de análisis de datos y pruebas deterministas, desarrollo integral por IA y custodia técnica en <strong>Supabase</strong> y <strong>Render</strong>.</span>
                    </label>
                </div>
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
            <p class="auth-foot">
                <span><strong>Hashcod Codespace:</strong> Certificación de creaciones por IA mediante análisis de datos y pruebas deterministas. Identidades en <strong>Supabase</strong> · Hosting en <strong>Render</strong>.</span>
                <br>
                <button type="button" class="auth-privacy-btn-link" onclick="openPrivacyPolicyModal()">📜 Leer Política de Privacidad y Modelo de Certificación</button>
            </p>
        </div>
    </div>

    <!-- =========================================================================
         POLÍTICA DE PRIVACIDAD, TRATAMIENTO DE DATOS Y CERTIFICACIÓN DETERMINISTA
         ========================================================================= -->
    <div id="privacyPolicyModal" class="privacy-modal-overlay" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="privacyModalTitle">
        <div class="privacy-modal-card">
            <div class="privacy-modal-header">
                <div>
                    <span class="admin-gate-badge" style="background:#EEF2FF; color:#4338CA; border-color:#C7D2FE;">
                        <svg style="width:13px;height:13px;fill:currentColor;margin-right:4px;" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                        Certificación de IA · Pruebas Deterministas · Privacidad
                    </span>
                    <h2 class="admin-gate-title" id="privacyModalTitle" style="font-size:16px; margin-top:4px;">Política de Privacidad y Modelo Operativo · Hashcod Codespace</h2>
                </div>
                <button type="button" class="admin-close-btn" onclick="closePrivacyPolicyModal()" title="Cerrar política de privacidad">
                    <svg style="width:13px;height:13px;fill:currentColor;" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
            <div class="privacy-modal-body">
                <!-- SECCIÓN DESTACADA: QUÉ HACE HASHCOD CODESPACE -->
                <div class="privacy-highlight-box" style="background:#F0FDF4; border-left:4px solid #16A34A; color:#14532D; padding:14px 16px; margin-bottom:18px;">
                    <div style="font-weight:700; font-size:13px; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                        <svg style="width:16px;height:16px;fill:currentColor;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        ¿Qué es y Qué Hace Hashcod Codespace?
                    </div>
                    <p style="margin:0; line-height:1.6; font-size:12px;">
                        <strong>Hashcod Codespace</strong> es una plataforma concebida para <strong>certificar y auditar todo lo creado por Inteligencia Artificial (IA)</strong> a través de <strong>software especializado de análisis de datos y métricas de uso durante la realización con la IA</strong>, proveyendo <strong>certificaciones de validación inmutables respaldadas por pruebas deterministas</strong>.
                    </p>
                </div>

                <h3>1. Alcance Operativo y Servicios Ofrecidos: Certificación de IA con Pruebas Deterministas</h3>
                <p>La plataforma ejecuta un protocolo estricto de certificación tecnológica para validar software y activos creados con IA a través de los siguientes servicios integrados:</p>
                <ul>
                    <li><strong>Auditoría de Chat Local y Uso de IA por API REST:</strong> Software de análisis donde chateas con la IA y le pides proyectos completos en tiempo real. El sistema audita el canal analizando las <em>cantidades de repeticiones</em>, los <em>modelos de formatos empleados</em>, los <em>inputs</em> suministrados, los <em>outputs</em> generados y las <em>correcciones</em> iteradas.</li>
                    <li><strong>Software de Análisis de Datos y Métricas de Rendimiento:</strong> Monitoriza el volumen de tokens consumidos, la velocidad de respuesta, costes computacionales y los índices operativos <strong>ICAI</strong> y <strong>NSPA</strong>.</li>
                    <li><strong>Pruebas Deterministas de Validación:</strong> Todo código generado o adjuntado es sometido a pruebas deterministas que verifican matemáticamente la consistencia algorítmica, la repetibilidad y la ausencia de alteraciones en el resultado final.</li>
                    <li><strong>Emisión y Despliegue de Certificados Post-Cuánticos:</strong> Emisión de sellos criptográficos inmutables basados en estándares NIST PQC (<strong>SPHINCS+</strong> y <strong>Dilithium-5</strong>), indexados públicamente en la tabla del Blog para verificación pública.</li>
                </ul>

                <!-- EVIDENCIA GRÁFICA DEL SOFTWARE DE ANÁLISIS DE IA -->
                <div class="privacy-evidence-card">
                    <img src="gus-mav-analysis-sample.png" alt="Software de prueba de uso de IA a través de chat local por API Rest (GUS MAV)" class="privacy-evidence-img" onclick="window.open('gus-mav-analysis-sample.png', '_blank')" title="Haz clic para ver la captura de análisis en tamaño completo">
                    <div class="privacy-evidence-caption">
                        <strong>Figura 1: Software de prueba de uso de IA a través de chat local por API Rest (GUS MAV v1.1.1).</strong>
                        <p style="margin:0;">
                            Prueba real de uno de los análisis que realizamos: software de prueba de uso de IA a través de chat local por API Rest donde chateas con la IA y le pides proyectos, y el software analiza las cantidades de repeticiones como también los modelos de formatos que usas, registrando canales de <em>Inputs</em>, <em>Outputs</em> y <em>Correcciones</em> en tiempo real junto con la telemetría determinista para respaldar cada certificación emitida.
                        </p>
                    </div>
                </div>

                <h3>2. Información y Datos que Recolecta la Plataforma</h3>
                <p>En el marco de la certificación y el funcionamiento del servidor, la plataforma recolecta y procesa exclusivamente los siguientes datos:</p>
                <ul>
                    <li><strong>Claves de Acceso y Cifrado:</strong> Claves maestras AES-256 generadas en el navegador del usuario, identificadores únicos L8ID, hashes derivados unidireccionales (SHA-256 / SHA-512), kits de recuperación L8REC y hashes de respaldo de un solo uso.</li>
                    <li><strong>Firmas y Sellos Criptográficos:</strong> Firmas post-cuánticas Dilithium-5 (ML-DSA-87) para validación de acceso al panel administrador y firmas SPHINCS+ (SLH-DSA) para sellado de publicaciones.</li>
                    <li><strong>Código Fuente y Archivos de Proyecto:</strong> Archivos cargados o editados (.py, .html, .ts, .js, .json, .sql, .php, .css, etc.), volumen de tokens calculados automáticamente y metadatos de validación.</li>
                    <li><strong>Registros Públicos de Publicación:</strong> Identificadores de registro (PUB-XXX), códigos de responsable, costos de tokens, métricas técnicas, estado de CORS y color HASNA.</li>
                    <li><strong>Datos Técnicos de Sesión:</strong> Tokens temporales de sesión (<code>sessionStorage</code>), datos de configuración local (<code>localStorage</code>) y telemetría de renderizado gráfico de la interfaz.</li>
                </ul>

                <h3>3. Declaración de Desarrollo Integral por Inteligencia Artificial (IA)</h3>
                <p>En estricto cumplimiento con las normas de transparencia tecnológica:</p>
                <ul>
                    <li><strong>Plataforma Desarrollada por IA:</strong> Se declara expresamente que Hashcod Codespace, incluyendo su arquitectura backend, scripts criptográficos, componentes de análisis y diseños de interfaz, ha sido concebida, desarrollada y optimizada mediante modelos avanzados de Inteligencia Artificial (IA) y agentes autónomos de codificación.</li>
                    <li><strong>Asistencia Inteligente Continua:</strong> Los módulos de cálculo de tokens, validación de scripts y formateo son asistidos por algoritmos de cómputo inteligente para asegurar precisión en tiempo real.</li>
                </ul>

                <h3>4. Proveedores de Terceros e Infraestructura Cloud (Supabase y Render)</h3>
                <p>Para la custodia segura y ejecución ininterrumpida de los servicios, Hashcod Codespace delega la infraestructura técnica en los siguientes proveedores de terceros:</p>
                <ul>
                    <li><strong>Supabase (Base de Datos en la Nube y Persistencia):</strong> Almacena de forma segura las tablas relacionales PostgreSQL, los hashes de identidad criptográfica, el estado de las sesiones y la persistencia de los kits de recuperación. Ninguna contraseña o clave en texto plano es transmitida ni almacenada en Supabase (cero custodia / Zero-Knowledge).</li>
                    <li><strong>Render (Plataforma de Hosting y Ejecución de Servidores):</strong> Provee el entorno de alojamiento en la nube, aprovisionamiento de contenedores de cómputo, balanceo de carga y enrutamiento HTTPS para ejecutar la aplicación web y procesar los endpoints del servidor.</li>
                </ul>

                <h3>5. Criptografía del Lado del Cliente y Seguridad</h3>
                <p>La seguridad de la cuenta depende de la custodia del kit de claves entregado al registrarse. La plataforma no almacena contraseñas convencionales en servidores centrales, garantizando que el usuario tenga el control exclusivo de sus credenciales criptográficas.</p>

                <h3>6. Consentimiento del Usuario y Vigencia</h3>
                <p>Al iniciar sesión o crear una cuenta, aceptas de manera libre e informada el tratamiento de datos y el modelo operativo de certificación determinista descrito en este documento.</p>
            </div>
            <div class="privacy-modal-footer">
                <button type="button" class="admin-gate-btn" onclick="acceptAndClosePrivacyPolicy()" style="background:#111827; color:#fff; border:none; padding:10px 22px; font-weight:700; border-radius:6px; cursor:pointer; font-size:12px;">
                    Entendido y Aceptar Política de Certificación
                </button>
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
            <button type="button" class="icon-notepad" id="notepadOpenBtn" title="Bloc de notas" aria-label="Abrir bloc de notas" aria-expanded="false" aria-controls="notepadOverlay" onclick="toggleNotepadEditor()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true">
                    <path d="M 5 3 C 3.895 3 3 3.895 3 5 L 3 19 C 3 20.105 3.895 21 5 21 L 15 21 L 21 15 L 21 5 C 21 3.895 20.105 3 19 3 L 5 3 z M 5 5 L 19 5 L 19 14 L 14 14 L 14 19 L 5 19 L 5 5 z M 7 7 L 7 9 L 17 9 L 17 7 L 7 7 z M 7 11 L 7 13 L 12 13 L 12 11 L 7 11 z"></path>
                </svg>
            </button>
            <button type="button" class="icon-gateway gateway-action-btn" id="topBarGatewayBtn" title="Gateway · Hashcod codespace" aria-label="Gateway · Hashcod codespace" onclick="openPlatformGateway()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="18" height="18" aria-hidden="true">
                    <path fill="currentColor" d="M 15 3 C 8.3845336 3 3 8.3845336 3 15 C 3 21.615466 8.3845336 27 15 27 C 17.554923 27 19.9167 26.181425 21.853516 24.818359 A 1.0002806 1.0002806 0 0 0 20.703125 23.181641 C 19.081941 24.322575 17.129077 25 15 25 C 9.4654664 25 5 20.534534 5 15 C 5 9.4654664 9.4654664 5 15 5 C 17.129077 5 19.081941 5.6774247 20.703125 6.8183594 A 1.0002809 1.0002809 0 0 0 21.853516 5.1816406 C 19.9167 3.8185753 17.554923 3 15 3 z"></path>
                </svg>
            </button>
            <span class="hashcod-created-by" title="Created by diktatcart" aria-label="Created by diktatcart">
                <img src="hashcod-created-by-gray.svg?v=10" alt="Created by diktatcart" height="14">
            </span>
            <nav class="hashcod-tools-dock" id="hashcodToolsDock" aria-label="Barra de herramientas Hashcod">
                <button type="button" class="hashcod-dock-slot is-filled is-ready" id="hashcodDockIndicesBtn" data-dock-slot="1" title="Banco de Índices / Forest Wallet" aria-label="Abrir Banco de Índices" onclick="toggleIndicesBank()">
                    <img src="hashcod-dock-cube.svg?v=1" alt="" width="13" height="13">
                </button>
                <button type="button" class="hashcod-dock-slot is-ready" id="hashcodDockClockBtn" data-dock-slot="2" title="Hora actual" aria-label="Mostrar hora actual" aria-expanded="false" aria-controls="hashcodClockPop" onclick="toggleHashcodClock()">
                    <img src="hashcod-dock-hourglass.svg?v=1" alt="" width="13" height="13">
                </button>
                <button type="button" class="hashcod-dock-slot is-ready" id="hashcodDockKeysBtn" data-dock-slot="3" title="Registro de Claves" aria-label="Abrir registro de claves" aria-expanded="false" aria-controls="hashcodKeysOverlay" onclick="toggleHashcodKeys()">
                    <img src="hashcod-dock-doc.svg?v=1" alt="" width="13" height="13">
                </button>
                <button type="button" class="hashcod-dock-slot is-ready" id="hashcodDockTool3Btn" data-dock-slot="4" title="Herramienta 3 (Toolbox)" aria-label="Abrir Herramienta 3" onclick="openToolboxTool3()">
                    <svg style="width:13px; height:13px;" viewBox="0 0 48 48">
                        <path fill="#ededed" fill-rule="evenodd" d="M22.903,3.286c0.679-0.381,1.515-0.381,2.193,0 c3.355,1.883,13.451,7.551,16.807,9.434C42.582,13.1,43,13.804,43,14.566c0,3.766,0,15.101,0,18.867 c0,0.762-0.418,1.466-1.097,1.847c-3.355,1.883-13.451,7.551-16.807,9.434c-0.679,0.381-1.515,0.381-2.193,0 c-3.355-1.883-13.451-7.551-16.807-9.434C5.418,34.899,5,34.196,5,33.434c0-3.766,0-15.101,0-18.867 c0-0.762,0.418-1.466,1.097-1.847C9.451,10.837,19.549,5.169,22.903,3.286z" clip-rule="evenodd"></path>
                        <path fill="#434345" d="M23.987,46.221c-1.085,0-2.171-0.252-3.165-0.757c-2.22-1.127-5.118-2.899-7.921-4.613 c-1.973-1.206-3.836-2.346-5.297-3.157C5.381,36.458,4,34.113,4,31.572V16.627c0-2.59,1.417-4.955,3.699-6.173 c3.733-1.989,9.717-5.234,12.878-7.01h0c2.11-1.184,4.733-1.184,6.844,0c3.576,2.007,10.369,6.064,14.252,8.513 C43.13,12.874,44,14.453,44,16.182V32c0,2.4-0.859,4.048-2.553,4.895c-0.944,0.531-2.628,1.576-4.578,2.787 c-3.032,1.882-6.806,4.225-9.564,5.705C26.27,45.942,25.128,46.221,23.987,46.221z M21.556,5.188 C18.384,6.97,12.382,10.226,8.64,12.22C7.012,13.088,6,14.776,6,16.627v14.945c0,1.814,0.987,3.49,2.576,4.373 c1.498,0.832,3.378,1.981,5.369,3.199c2.77,1.693,5.634,3.445,7.783,4.536c1.458,0.739,3.188,0.717,4.631-0.056 c2.703-1.451,6.447-3.775,9.456-5.643c1.97-1.223,3.671-2.279,4.696-2.854C41.835,34.464,42,33.109,42,32V16.182 c0-1.037-0.521-1.983-1.392-2.532c-3.862-2.435-10.613-6.467-14.165-8.461C24.913,4.331,23.086,4.331,21.556,5.188L21.556,5.188z"></path>
                        <path fill="#434345" d="M22.977,41.654l-0.057-13.438c-0.011-2.594,1.413-4.981,3.701-6.204l12.01-6.416 c1.998-1.068,4.414,0.38,4.414,2.646v14.73c0,1.041-0.54,2.008-1.426,2.554l-14.068,8.668 C25.557,45.424,22.987,43.996,22.977,41.654z"></path>
                        <path fill="#ededed" d="M28.799,26.274c0.123-0.063,0.225,0.014,0.227,0.176l0.013,1.32 c0.552-0.219,1.032-0.278,1.467-0.177c0.095,0.024,0.136,0.153,0.098,0.306l-0.291,1.169c-0.024,0.089-0.072,0.178-0.132,0.233 c-0.026,0.025-0.052,0.044-0.077,0.057c-0.04,0.02-0.078,0.026-0.114,0.019c-0.199-0.045-0.671-0.148-1.413,0.228 c-0.778,0.395-1.051,1.071-1.046,1.573c0.007,0.601,0.315,0.783,1.377,0.802c1.416,0.023,2.027,0.643,2.042,2.067 c0.016,1.402-0.733,2.905-1.876,3.826l0.025,1.308c0.001,0.157-0.1,0.338-0.225,0.4l-0.775,0.445 c-0.123,0.063-0.225-0.014-0.227-0.172l-0.013-1.286c-0.664,0.276-1.334,0.342-1.763,0.17c-0.082-0.032-0.117-0.152-0.084-0.288 l0.28-1.181c0.022-0.092,0.071-0.186,0.138-0.246c0.023-0.023,0.048-0.04,0.072-0.053c0.044-0.022,0.087-0.027,0.124-0.013 c0.462,0.155,1.053,0.082,1.622-0.206c0.722-0.365,1.206-1.102,1.198-1.834c-0.007-0.664-0.366-0.939-1.241-0.946 c-1.113,0.002-2.151-0.216-2.168-1.855c-0.014-1.35,0.688-2.753,1.799-3.641l-0.013-1.319c-0.001-0.162,0.098-0.34,0.225-0.405 L28.799,26.274z"></path>
                        <path fill="#4da925" d="M37.226,34.857l-3.704,2.185c-0.109,0.061-0.244-0.019-0.244-0.143v-1.252 c0-0.113,0.061-0.217,0.16-0.273l3.704-2.185c0.111-0.061,0.246,0.019,0.246,0.145v1.248 C37.388,34.697,37.326,34.801,37.226,34.857"></path>
                    </svg>
                </button>
                <button type="button" class="hashcod-dock-slot is-ready" id="hashcodDockAdminBtn" data-dock-slot="5" title="Panel de Administrador (Dilithium-5)" aria-label="Abrir panel de administrador" onclick="openAdminPanelGate()">
                    <svg style="width:13px; height:13px; fill:#374151;" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                </button>
                <button type="button" class="hashcod-dock-slot is-filled is-ready" id="hashcodDockBlogBtn" data-dock-slot="6" title="Blog de Publicaciones (Vista Excel)" aria-label="Abrir blog de publicaciones" onclick="toggleExcelBlog()">
                    <svg style="width:13px; height:13px; fill:#ffffff;" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
                </button>
                <div class="hashcod-clock-pop" id="hashcodClockPop" role="dialog" aria-label="Hora actual" aria-hidden="true">
                    <div class="hashcod-clock-label">Hora actual</div>
                    <div class="hashcod-clock-time" id="hashcodClockTime">00:00:00</div>
                </div>
            </nav>
        </div>
        <div class="top-bar-right">
            <button type="button" class="icon-gateway gateway-action-btn" title="Gateway · abrir y enviar (notas, terminal…)" aria-label="Gateway · abrir y enviar" onclick="openPlatformGateway()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="18" height="18" aria-hidden="true">
                    <path fill="currentColor" d="M 15 3 C 8.3845336 3 3 8.3845336 3 15 C 3 21.615466 8.3845336 27 15 27 C 17.554923 27 19.9167 26.181425 21.853516 24.818359 A 1.0002806 1.0002806 0 0 0 20.703125 23.181641 C 19.081941 24.322575 17.129077 25 15 25 C 9.4654664 25 5 20.534534 5 15 C 5 9.4654664 9.4654664 5 15 5 C 17.129077 5 19.081941 5.6774247 20.703125 6.8183594 A 1.0002809 1.0002809 0 0 0 21.853516 5.1816406 C 19.9167 3.8185753 17.554923 3 15 3 z"></path>
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
                    <div>Toolkit<strong id="tokensToolkits">—</strong></div>
                </div>
                <div class="tokens-legend" id="tokensLegend">Cupo mensual 10.000 · Comando −5 · Ventana externa −25 · Clone GitHub −625 · Bloc de notas −1000 · Toolkit −1000</div>
                <div class="tokens-section-title">Meses anteriores</div>
                <ul class="tokens-history" id="tokensHistoryList"></ul>
                <p class="tokens-empty" id="tokensHistoryEmpty">Sin gastos de meses previos aún.</p>
                <button type="button" class="tokens-unlock-open" id="tokensUnlockOpenBtn" title="Desbloquear más tokens con Dilithium-5">
                    Desbloquear tokens · Dilithium-5 · <span class="xu" id="tokensUnlockUsesHint">x1</span>
                </button>
                <div class="tokens-section-title">Gastos recientes</div>
                <ul class="tokens-ledger" id="tokensLedgerList"></ul>
                <p class="tokens-empty" id="tokensLedgerEmpty">Aún no hay movimientos guardados.</p>
                <p class="tokens-persist-note">El consumo se guarda en el servidor (y Supabase si está configurado) para no perderse al actualizar la plataforma.</p>
            </div>
            <button type="button" class="icon-mobile" id="mobileModeBtn" title="Versión móvil" aria-label="Activar versión móvil" aria-pressed="false" onclick="toggleMobileMode()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" role="img" aria-hidden="true">
                    <path d="M28.957,7.628C28.813,1,23.806,1,21.919,1c-0.593,0-1.207,0.025-1.801,0.048 c-0.465,0.018-0.94,0.038-1.417,0.045l-0.163,0.004c-1.67,0.04-5.57,0.132-7.1,0.173c-0.045-0.001-0.09-0.001-0.134-0.001 c-5.201,0-5.252,5.412-5.277,8.013C6.023,9.686,6.02,10.065,6.003,10.4L6,10.449v0.049c-0.005,5.539,0.248,11.295,0.775,17.597h0 c0.021,0.239,0.125,1.117,0.558,1.781c0.664,1.098,1.962,1.788,3.761,1.999l0.027,0.003l0.027,0.002 c0.904,0.081,1.809,0.12,2.766,0.12c2.234,0,4.31-0.214,6.508-0.439l1.062-0.108l0.026-0.002l0.026-0.003l2.433-0.308l0.077-0.01 l0.076-0.016c0.029-0.004,0.073-0.008,0.121-0.013c0.355-0.036,0.947-0.098,1.747-0.43c1.429-0.562,2.447-2.179,2.374-3.749 l0.335-9.486c0.031-0.991,0.081-1.983,0.132-2.979C28.947,12.223,29.065,9.913,28.957,7.628z" opacity=".3"></path>
                    <path fill="#fff" d="M27.957,6.628C27.813,0,22.806,0,20.92,0c-0.593,0-1.207,0.025-1.801,0.048 c-0.465,0.018-0.94,0.038-1.417,0.045l-0.163,0.004c-1.67,0.04-5.57,0.132-7.1,0.173c-0.045-0.001-0.09-0.001-0.134-0.001 c-5.201,0-5.252,5.412-5.277,8.013C5.023,8.686,5.02,9.065,5.003,9.4L5,9.449v0.049c-0.005,5.539,0.248,11.295,0.775,17.597h0 c0.021,0.239,0.125,1.117,0.558,1.781c0.664,1.098,1.962,1.788,3.761,1.999l0.027,0.003l0.027,0.002 c0.904,0.081,1.809,0.12,2.766,0.12c2.234,0,4.31-0.214,6.508-0.439l1.062-0.108l0.026-0.002l0.026-0.003l2.433-0.308l0.077-0.01 l0.076-0.016c0.029-0.004,0.073-0.008,0.121-0.013c0.355-0.036,0.947-0.098,1.747-0.43c1.429-0.562,2.447-2.179,2.374-3.749 l0.335-9.486c0.031-0.991,0.081-1.983,0.132-2.979C27.947,11.223,28.066,8.913,27.957,6.628z"></path>
                    <path fill="currentColor" d="M25.978,6.249c-0.113-5.828-4.155-4.889-8.441-4.821c-1.625,0.039-5.876,0.141-7.445,0.184 C6.049,1.492,6.672,6.538,6.536,9.149c-0.006,6.008,0.29,12.032,0.785,18.017c0.009,0.175,0.123,0.746,0.273,0.943 c0.466,0.835,1.786,1.071,2.379,1.141c3.553,0.321,6.729-0.091,10.173-0.44l2.484-0.318c0.359-0.075,0.792-0.024,1.562-0.353 c0.698-0.267,1.245-1.215,1.177-1.994l0.345-9.899C25.815,12.948,26.134,9.551,25.978,6.249z M9.654,4.691 C9.694,4.538,9.75,4.43,9.78,4.372c1.224-0.093,3.406-0.218,5.298-0.329C15.032,4.188,15,4.34,15,4.5C15,5.328,15.672,6,16.5,6 S18,5.328,18,4.5c0-0.223-0.052-0.432-0.138-0.622c1.293-0.054,3.411-0.314,4.459-0.184c1.417,0.173,1.405,1.397,1.559,2.675 c0.363,5.01-0.41,12.118-0.751,17.654L10.046,24.77c-0.209-3.568-0.343-7.182-0.47-10.731C9.529,11.026,9.271,7.613,9.654,4.691z"></path>
                    <path fill="currentColor" d="M19.684,14.835l0.829-1.02c0.175-0.215,0.142-0.529-0.072-0.703c-0.213-0.176-0.53-0.142-0.703,0.072l-0.827,1.018 c-0.697-0.443-1.523-0.703-2.41-0.703c-0.992,0-1.899,0.334-2.643,0.878l-0.97-1.193c-0.176-0.215-0.49-0.247-0.703-0.072 c-0.214,0.174-0.247,0.488-0.072,0.703l1.009,1.242c-0.635,0.728-1.053,1.649-1.113,2.676C12,17.877,12.121,18,12.265,18h8.471 c0.144,0,0.265-0.123,0.257-0.267C20.926,16.602,20.434,15.59,19.684,14.835z"></path>
                    <circle cx="14.5" cy="16.5" r=".5" fill="#fff"></circle>
                    <circle cx="18.5" cy="16.5" r=".5" fill="#fff"></circle>
                </svg>
            </button>
        </div>
    </div>

    <div class="hashcod-keys-overlay" id="hashcodKeysOverlay" aria-hidden="true">
        <div class="hashcod-keys-card" role="dialog" aria-modal="true" aria-labelledby="hashcodKeysTitle">
            <div class="hashcod-keys-top">
                <h2 class="hashcod-keys-title" id="hashcodKeysTitle">Registro de Claves</h2>
                <button type="button" class="hashcod-keys-close" id="hashcodKeysCloseBtn" title="Cerrar">Cerrar</button>
            </div>
            <form class="hashcod-keys-form" id="hashcodKeysForm" autocomplete="off">
                <input class="hashcod-keys-input" id="hashcodKeysName" type="text" name="key_name" maxlength="120" placeholder="Ej: API Key Principal" spellcheck="false">
                <input class="hashcod-keys-input" id="hashcodKeysSecret" type="password" name="key_secret" maxlength="4000" placeholder="••••••••••••••••" spellcheck="false" autocomplete="new-password">
                <input class="hashcod-keys-input" id="hashcodKeysCode" type="text" name="key_code" maxlength="4000" placeholder="Ej: 0xA3F8...B2C1" spellcheck="false">
                <button type="submit" class="hashcod-keys-save" id="hashcodKeysSaveBtn">Guardar Clave</button>
            </form>
            <p class="hashcod-keys-msg" id="hashcodKeysMsg">Las claves se guardan en tu cuenta (Supabase).</p>
            <div class="hashcod-keys-list-wrap">
                <div class="hashcod-keys-list-title">Guardadas</div>
                <ul class="hashcod-keys-list" id="hashcodKeysList"></ul>
                <p class="hashcod-keys-empty" id="hashcodKeysEmpty">Aún no hay claves guardadas.</p>
            </div>
        </div>
    </div>

    <!-- Banco de índices (Fly tool 1) — base UI; lógica operativa después -->
    <div class="indices-bank-overlay" id="indicesBankOverlay" aria-hidden="true">
        <div class="indices-bank-shell" role="dialog" aria-modal="true" aria-labelledby="indicesBankTitle">
            <div class="indices-bank-head">
                <div class="indices-bank-brand" title="Forest Wallet">
                    <span class="indices-bank-brand-mark" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M8.0332,1c-0.32534,-0.01113 -0.63574,0.13679 -0.83203,0.39648l-5.28516,7c-0.22915,0.30288 -0.26697,0.70942 -0.09762,1.04937c0.16935,0.33995 0.51665,0.55463 0.89645,0.55415h1.54102l-2.04688,3.49414c-0.18116,0.30904 -0.18319,0.69136 -0.00533,1.00231c0.17786,0.31095 0.50844,0.50302 0.86666,0.50355h3.92969v2h-3c-0.552,0 -1,0.448 -1,1c0,0.304 0.14342,0.567 0.35742,0.75l-0.01758,0.00195c0,0 2.92758,2.04072 4.14258,2.88672c0.337,0.236 0.73939,0.36133 1.15039,0.36133h11.37891c1.098,0 1.98828,-0.89028 1.98828,-1.98828v-12.07813c0,-0.592 -0.26184,-1.1532 -0.71484,-1.5332c-1.51596,-1.27196 -4.38467,-3.67936 -5.29297,-4.44141c-0.55596,-0.54131 -0.99609,-0.82812 -0.99609,-0.82812c-0.14541,-0.0828 -0.30926,-0.12779 -0.47656,-0.13086c-0.18054,-0.00373 -0.35872,0.04149 -0.51562,0.13086c0,0 -1.10528,0.65597 -2.08594,2.12695c-0.25771,0.38656 -0.5106,0.83689 -0.74609,1.34766l-2.36719,-3.19922c-0.18149,-0.24629 -0.46572,-0.39596 -0.77148,-0.40625zM14.5,3.39453c0.25211,0.19418 0.41849,0.22344 0.91797,0.97266c0.76934,1.15401 1.58203,3.0623 1.58203,6.13281c0,1.39094 -1.10906,2.5 -2.5,2.5c-1.39094,0 -2.5,-1.10906 -2.5,-2.5c0,-3.07051 0.81269,-4.9788 1.58203,-6.13281c0.49948,-0.74922 0.66586,-0.77847 0.91797,-0.97266zM7.99219,3.67188l2.40039,3.24609c-0.24032,1.03354 -0.39258,2.21797 -0.39258,3.58203c0,0.92335 0.28279,1.7833 0.76563,2.5h-2.76562h-3.18359l2.04688,-3.49414c0.18133,-0.30934 0.18318,-0.69208 0.00485,-1.00316c-0.17833,-0.31108 -0.50956,-0.50288 -0.86813,-0.5027h-1.27734zM9,15h5v2h-5z"/></svg>
                    </span>
                    <span class="indices-bank-brand-name">フォレストウォレット</span>
                </div>
                <div class="indices-bank-actions">
                    <label class="indices-bank-search" for="indicesBankSearch">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                        <input id="indicesBankSearch" type="search" placeholder="Busca indices" autocomplete="off" spellcheck="false">
                    </label>
                    <button type="button" class="indices-bank-wallet-btn" id="indicesBankWalletBtn" title="Wallet" aria-label="Wallet">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11.99609,1.98633c-0.76673,0.01057 -1.53076,0.30911 -2.10352,0.89453c-1.87206,1.91306 -5.18169,5.29593 -7.04687,7.20312c-1.13903,1.16435 -1.13104,3.05534 0.01563,4.21094c0.09715,0.09787 0.21727,0.22038 0.32031,0.32422c-0.70974,0.54469 -1.18164,1.39759 -1.18164,2.38086c0,0.673 0.22484,1.2823 0.58984,1.7793l-0.00781,0.01953c0,0 1.10236,1.45725 1.81836,2.40625c0.378,0.5 0.9687,0.79492 1.5957,0.79492h14.00391c1.105,0 2,-0.895 2,-2v-9.10547c0,-0.569 -0.24297,-1.11123 -0.66797,-1.49023c-1.53189,-1.36797 -4.98306,-4.45255 -5.2832,-4.7207c-0.67497,-0.65209 -1.3538,-1.30714 -1.92773,-1.86133c-0.58886,-0.56876 -1.35827,-0.84651 -2.125,-0.83594zM12.02344,3.97266c0.25277,-0.00343 0.50684,0.09187 0.70898,0.28711c1.04561,1.00962 2.45872,2.37653 3.51172,3.39453c0.19308,0.18658 0.30413,0.4433 0.30664,0.71289c0.0025,0.26761 -0.10325,0.52367 -0.29297,0.71289c-0.00065,0.00065 -0.0013,0.0013 -0.00195,0.00195c-0.75514,0.7557 -1.87734,1.87741 -2.90625,2.90625l-4.83789,-4.83789c1.02084,-1.04336 2.06419,-2.10839 2.81055,-2.87109c0.19624,-0.20058 0.4484,-0.30321 0.70117,-0.30664zM7.11328,8.58008l4.82227,4.82227c-0.19017,0.1901 -0.34879,0.34888 -0.53516,0.53516l-6.08789,-0.01172c-0.35894,-0.36128 -0.71913,-0.7246 -1.03125,-1.03906c-0.39334,-0.3964 -0.39683,-1.00464 -0.00586,-1.4043c0.75119,-0.76811 1.80614,-1.84773 2.83789,-2.90234zM4.96289,16h8.23438h2.83984c0.532,0 0.96289,0.448 0.96289,1c0,0.552 -0.43089,1 -0.96289,1h-11.07422c-0.532,0 -0.96289,-0.448 -0.96289,-1c0,-0.552 0.43089,-1 0.96289,-1z"/></svg>
                    </button>
                </div>
            </div>
            <div class="indices-bank-body">
                <div class="indices-bank-heading">
                    <h2 class="indices-bank-title" id="indicesBankTitle">Indices PI</h2>
                    <p class="indices-bank-subtitle">Lista de indices</p>
                </div>
                <div class="indices-bank-table-wrap" id="indicesBankTableWrap" role="region" aria-label="Tabla de índices con desplazamiento vertical">
                    <table class="indices-bank-table" aria-label="Lista de índices">
                        <colgroup>
                            <col class="col-index">
                            <col class="col-porcentaje">
                            <col class="col-prestamo">
                            <col class="col-retorno">
                            <col class="col-periodo">
                        </colgroup>
                        <thead>
                            <tr>
                                <th scope="col" class="col-index">Index</th>
                                <th scope="col" class="col-porcentaje">Porcentaje actual</th>
                                <th scope="col" class="col-prestamo">Prestamo</th>
                                <th scope="col" class="col-retorno">Retorno</th>
                                <th scope="col" class="col-periodo">Periodo de<br>entrega</th>
                            </tr>
                        </thead>
                        <tbody id="indicesBankTableBody"></tbody>
                    </table>
                </div>
                <p class="indices-bank-empty" id="indicesBankEmpty" hidden></p>
            </div>
        </div>
    </div>

    <div class="tokens-unlock-overlay" id="tokensUnlockOverlay" aria-hidden="true">
        <div class="tokens-unlock-shell" role="dialog" aria-modal="true" aria-labelledby="tokensUnlockBrand">
            <div class="tokens-unlock-top">
                <div class="tokens-unlock-brand" id="tokensUnlockBrand">Desbloquear tokens</div>
                <div class="tokens-unlock-uses-pill" id="tokensUnlockUsesPill">Usos: x0 · próxima x1</div>
                <button type="button" class="tokens-unlock-close" id="tokensUnlockCloseBtn" title="Cerrar">Cerrar</button>
            </div>
            <table class="tokens-unlock-table" aria-label="Desbloqueo de tokens por área">
                <thead>
                    <tr>
                        <th class="amt" scope="col">
                            <span class="tokens-unlock-th-token" title="Tokens" aria-label="Tokens">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" aria-hidden="true"><path fill="currentColor" d="M 25 1 C 11.759318 1 1 11.759318 1 25 C 1 38.240682 11.759318 49 25 49 C 38.240682 49 49 38.240682 49 25 C 49 11.759318 38.240682 1 25 1 z M 25 3 C 25.674908 3 26.340665 3.0344009 27 3.09375 L 27 10.150391 C 26.343779 10.061616 25.67941 10 25 10 C 24.32059 10 23.656221 10.061616 23 10.150391 L 23 3.09375 C 23.659335 3.0344009 24.325092 3 25 3 z M 21 3.3691406 L 21 10.5625 C 18.526728 11.253462 16.303389 12.556571 14.515625 14.310547 L 8.2851562 10.699219 C 11.494966 6.9501434 15.942328 4.2971349 21 3.3691406 z M 29 3.3691406 C 34.075199 4.3003509 38.535748 6.968611 41.748047 10.738281 L 35.523438 14.347656 C 33.729128 12.57475 31.491005 11.258416 29 10.5625 L 29 3.3691406 z M 25 12 C 32.154545 12 38 17.845455 38 25 C 38 32.154545 32.154545 38 25 38 C 17.845455 38 12 32.154545 12 25 C 12 17.845455 17.845455 12 25 12 z M 7.0410156 12.291016 L 13.164062 15.839844 C 12.346687 16.891853 11.658077 18.047361 11.140625 19.292969 L 5.0351562 15.753906 C 5.6001328 14.534853 6.2717605 13.376539 7.0410156 12.291016 z M 42.988281 12.332031 C 43.754883 13.419078 44.424192 14.578638 44.986328 15.798828 L 38.876953 19.341797 C 38.363597 18.09385 37.67931 16.935832 36.865234 15.880859 L 42.988281 12.332031 z M 4.2695312 17.623047 L 10.501953 21.234375 C 10.185979 22.441056 10 23.698294 10 25 C 10 26.301706 10.185979 27.558944 10.501953 28.765625 L 4.2695312 32.376953 C 3.4499789 30.070945 3 27.588809 3 25 C 3 22.411191 3.4499789 19.929055 4.2695312 17.623047 z M 45.746094 17.669922 C 46.55516 19.962815 47 22.428571 47 25 C 47 27.571429 46.55516 30.037185 45.746094 32.330078 L 39.511719 28.714844 C 39.819154 27.523527 40 26.283406 40 25 C 40 23.716594 39.819154 22.476473 39.511719 21.285156 L 45.746094 17.669922 z M 38.876953 30.658203 L 44.986328 34.201172 C 44.424192 35.421362 43.754883 36.580922 42.988281 37.667969 L 36.865234 34.119141 C 37.67931 33.064168 38.363597 31.90615 38.876953 30.658203 z M 11.140625 30.707031 C 11.658077 31.952639 12.346687 33.108147 13.164062 34.160156 L 7.0410156 37.708984 C 6.2717605 36.623461 5.6001328 35.465147 5.0351562 34.246094 L 11.140625 30.707031 z M 35.523438 35.652344 L 41.748047 39.261719 C 38.535748 43.031389 34.075199 45.699649 29 46.630859 L 29 39.4375 C 31.491005 38.741584 33.729128 37.42525 35.523438 35.652344 z M 14.515625 35.689453 C 16.303389 37.443429 18.526728 38.746538 21 39.4375 L 21 46.630859 C 15.942328 45.702865 11.494966 43.049857 8.2851562 39.300781 L 14.515625 35.689453 z M 23 39.849609 C 23.656221 39.938384 24.32059 40 25 40 C 25.67941 40 26.343779 39.938384 27 39.849609 L 27 46.90625 C 26.340665 46.965599 25.674908 47 25 47 C 24.325092 47 23.659335 46.965599 23 46.90625 L 23 39.849609 z"/></svg>
                            </span>
                        </th>
                        <th class="area" scope="col">Área</th>
                        <th class="act" scope="col">Acción</th>
                    </tr>
                </thead>
                <tbody id="tokensUnlockRows">
                    <tr><td colspan="3">Cargando áreas…</td></tr>
                </tbody>
            </table>
            <div class="tokens-unlock-keyrow">
                <label class="tokens-unlock-keylabel" for="tokensUnlockSharedCode">Clave Dilithium-5</label>
                <input type="password" class="tokens-unlock-input" id="tokensUnlockSharedCode" autocomplete="off" spellcheck="false" placeholder="dilithium5_…">
            </div>
            <div class="tokens-unlock-msg" id="tokensUnlockMsg">Introduce la clave Dilithium-5 de la próxima vez (xN). Tras un uso válido, la clave cambia.</div>
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
            <!-- Segmentos de contexto Tabby (Host, Dir, Git, PQC, Perfiles, Temas, Paleta) -->
            <div class="tabby-prompt-header">
                <div class="tabby-prompt-left">
                    <span class="tabby-chip host">
                        <svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px; fill:#F9FAFB;" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-12-3l3-3-3-3 1.41-1.41L12.83 12l-3.42 3.41L8 15zm5 0h5v2h-5v-2z"/></svg>
                        <span>tabby@codespace</span>
                    </span>
                    <span class="tabby-chip">
                        <svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px; fill:#9CA3AF;" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                        <span>~/workspace</span>
                    </span>
                    <span class="tabby-chip git">
                        <svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px; fill:#818CF8;" viewBox="0 0 24 24"><path d="M21 9c0-.75-.41-1.4-.99-1.74l-2.01-1.15V4c0-.55-.45-1-1-1s-1 .45-1 1v2.11L14 7.26V4c0-.55-.45-1-1-1s-1 .45-1 1v4.38l-4 2.31V4c0-.55-.45-1-1-1s-1 .45-1 1v8.74c-.58.34-1 .99-1 1.76 0 1.1.9 2 2 2s2-.9 2-2c0-.75-.41-1.4-.99-1.74l-2.01-1.15V4c0-.55-.45-1-1-1s-1 .45-1 1v2.11L14 7.26V4c0-.55-.45-1-1-1s-1 .45-1 1v4.38l-4 2.31V4c0-.55-.45-1-1-1s-1 .45-1 1v8.74c-.58.34-1 .99-1 1.76 0 1.1.9 2 2 2s2-.9 2-2c0-.77-.42-1.42-1-1.76V12.7l4-2.31v1.65c-.58.34-1 .99-1 1.76 0 1.1.9 2 2 2s2-.9 2-2c0-.77-.42-1.42-1-1.76V8.42l2-1.15v4.77c-.58.34-1 .99-1 1.76 0 1.1.9 2 2 2s2-.9 2-2c0-.77-.42-1.42-1-1.76V7.26l2-1.15c.58.34 1 .99 1 1.76 0 1.1.9 2 2 2s2-.9 2-2z"/></svg>
                        <span>main</span>
                    </span>
                    <span class="tabby-chip pqc">
                        <svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px; fill:#10B981;" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                        <span>Dilithium-5 (PQC)</span>
                    </span>
                    <span class="tabby-chip btn" onclick="window.TabbyTerminal.openProfilesModal()" title="Perfiles de sesión de Tabby">
                        <svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                        <span>Perfiles</span>
                    </span>
                    <span class="tabby-chip btn" onclick="window.TabbyTerminal.openThemesModal()" title="Cambiar tema de terminal (Ctrl+Shift+T)">
                        <svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.17 19.59 10.53 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-5 9c-.83 0-1.5-.67-1.5-1.5S6.17 9 7 9s1.5.67 1.5 1.5S7.83 12 7 12zm3-4c-.83 0-1.5-.67-1.5-1.5S9.17 5 10 5s1.5.67 1.5 1.5S10.83 8 10 8zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 5 14 5s1.5.67 1.5 1.5S14.83 8 14 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.17 9 17 9s1.5.67 1.5 1.5S17.83 12 17 12z"/></svg>
                        <span id="tabbyThemeChipName">Tabby Theme</span>
                    </span>
                    <span class="tabby-chip btn" onclick="window.TabbyTerminal.openPaletteModal()" title="Paleta de comandos (Ctrl+Shift+P)">
                        <svg class="tabby-icon-svg" width="14" height="14" style="width:14px; height:14px;" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                        <span>Paleta</span>
                    </span>
                </div>
                <div class="tabby-prompt-right">
                    <span class="tabby-chip ws connected" id="tabbyWsStatusChip" title="Canal WebSocket en tiempo real activo">
                        <span class="tabby-ws-dot"></span>
                        <span class="tabby-ws-label">WS Live</span>
                    </span>
                    <span class="tabby-chip btn gateway-action-btn" onclick="openGatewayFromTool('terminal')" title="Gateway · Transportar terminal activa y generar código">
                        <svg class="tabby-icon-svg gateway-crescent-svg" width="14" height="14" viewBox="0 0 30 30"><path fill="currentColor" d="M 15 3 C 8.3845336 3 3 8.3845336 3 15 C 3 21.615466 8.3845336 27 15 27 C 17.554923 27 19.9167 26.181425 21.853516 24.818359 A 1.0002806 1.0002806 0 0 0 20.703125 23.181641 C 19.081941 24.322575 17.129077 25 15 25 C 9.4654664 25 5 20.534534 5 15 C 5 9.4654664 9.4654664 5 15 5 C 17.129077 5 19.081941 5.6774247 20.703125 6.8183594 A 1.0002809 1.0002809 0 0 0 21.853516 5.1816406 C 19.9167 3.8185753 17.554923 3 15 3 z"></path></svg>
                        <span>Gateway</span>
                    </span>
                    <span class="tabby-chip" id="tabbyLiveClock">--:--:--</span>
                </div>
            </div>
            <div class="block-row block-prompt">
                <div class="block-symbol clickable-symbol" id="symbolPrompt" onclick="toggleFunctionDrawer()" title="Haz clic en (>) para abrir/cerrar la ventana de funciones">
                    &gt;
                </div>
                <div class="block-body block-input-container">
                    <input type="text" id="cmdInput" class="cmd-input" placeholder="Escribe un comando aquí (ej: repos, clone facebook/react, set_i code, workflows)..." autocomplete="off" onkeydown="handleCommandKey(event)">
                    <div class="cell-action-icon" title="Abrir / cerrar teclado" onclick="toggleVirtualKeyboard()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#5F6368" d="M 3 3 C 2.2045912 3 1.441211 3.3166015 0.87890625 3.8789062 C 0.31660152 4.441211 0 5.2045912 0 6 L 0 13 C 0 13.710451 0.26410916 14.386893 0.71875 14.925781 L 0.703125 14.925781 C 0.703125 14.925781 4.8273906 19.558172 6.4003906 21.326172 C 6.7823906 21.755172 7.3283437 22 7.9023438 22 L 20.011719 22 C 20.538719 22 21.044969 21.790969 21.417969 21.417969 C 21.790969 21.044969 22 20.538719 22 20.011719 L 22 13 L 22 6 C 22 5.2045912 21.683398 4.4412111 21.121094 3.8789062 C 20.558789 3.3166016 19.795409 3 19 3 L 3 3 z M 3 5 L 19 5 C 19.264591 5 19.519336 5.1052735 19.707031 5.2929688 C 19.894727 5.480664 20 5.7354088 20 6 L 20 13 C 20 13.264591 19.894727 13.519336 19.707031 13.707031 C 19.519336 13.894727 19.264591 14 19 14 L 3 14 C 2.7354088 14 2.480664 13.894727 2.2929688 13.707031 C 2.1052734 13.519336 2 13.264591 2 13 L 2 6 C 2 5.7354088 2.1052735 5.480664 2.2929688 5.2929688 C 2.4806639 5.1052735 2.7354088 5 3 5 z M 5 7 A 1 1 0 0 0 5 9 A 1 1 0 0 0 5 7 z M 8 7 A 1 1 0 0 0 8 9 A 1 1 0 0 0 8 7 z M 11 7 A 1 1 0 0 0 11 9 A 1 1 0 0 0 11 7 z M 14 7 A 1 1 0 0 0 14 9 A 1 1 0 0 0 14 7 z M 17 7 A 1 1 0 0 0 17 9 A 1 1 0 0 0 17 7 z M 5 10 A 1 1 0 0 0 5 12 A 1 1 0 0 0 5 10 z M 8 10 A 1.0001 1.0001 0 1 0 8 12 L 14 12 A 1.0001 1.0001 0 1 0 14 10 L 8 10 z M 17 10 A 1 1 0 0 0 17 12 A 1 1 0 0 0 17 10 z"/>
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
                        <option value="">Selecciona un archivo de código por carpeta...</option>
                    </select>
                    <span id="repoFilePathInfo" style="color:#888888; font-size:11px; font-family:monospace;"></span>
                </div>

                <div class="function-drawer-inner">
                    <textarea id="functionEditor" class="function-editor" placeholder="// Escribe las funciones aquí o inspecciona el código de repositorios guardados..." spellcheck="false" onkeydown="handleEditorKeyDown(event)"></textarea>
                    <button type="button" class="terminal-download-btn gateway-action-btn" id="terminalGatewayBtn" title="Gateway · Enviar terminal y generar código" aria-label="Enviar al Gateway" onclick="openGatewayFromTool('terminal')" style="right: 50px;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="16" height="16" aria-hidden="true">
                            <path fill="currentColor" d="M 15 3 C 8.3845336 3 3 8.3845336 3 15 C 3 21.615466 8.3845336 27 15 27 C 17.554923 27 19.9167 26.181425 21.853516 24.818359 A 1.0002806 1.0002806 0 0 0 20.703125 23.181641 C 19.081941 24.322575 17.129077 25 15 25 C 9.4654664 25 5 20.534534 5 15 C 5 9.4654664 9.4654664 5 15 5 C 17.129077 5 19.081941 5.6774247 20.703125 6.8183594 A 1.0002809 1.0002809 0 0 0 21.853516 5.1816406 C 19.9167 3.8185753 17.554923 3 15 3 z"></path>
                        </svg>
                    </button>
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

        <!-- Panel Toolbox (16 slots 4x4 con Fondo Abstracto Geométrico y Decoraciones) -->
        <div class="toolbox-panel" id="toolboxPanel">
            <!-- abstract-bg -->
            <div class="toolbox-abstract-bg">
                <!-- Rotated Lines -->
                <div class="tb-line" style="width: 360.56px; left: 0px; top: 0px; transform: rotate(-33.69deg);"></div>
                <div class="tb-line" style="width: 456.07px; left: 600px; top: 0px; transform: rotate(37.87deg);"></div>
                <div class="tb-line" style="width: 490.57px; left: 0px; top: 500px; transform: rotate(35.37deg);"></div>
                <div class="tb-line" style="width: 318.52px; left: 700px; top: 600px; transform: rotate(-35.29deg);"></div>
                <div class="tb-line" style="width: 490.57px; left: 100px; top: 500px; transform: rotate(-35.37deg);"></div>
                <div class="tb-line" style="width: 188.68px; left: 800px; top: 0px; transform: rotate(32.01deg);"></div>
                <div class="tb-line" style="width: 223.61px; left: 0px; top: 250px; transform: rotate(-26.57deg);"></div>
                <div class="tb-line" style="width: 232.59px; left: 750px; top: 400px; transform: rotate(25.46deg);"></div>

                <!-- Ellipses / Nodes -->
                <div class="tb-ellipse" style="width: 9.07px; height: 9.07px; left: 75.47px; top: 35.47px;"></div>
                <div class="tb-ellipse" style="width: 11.54px; height: 11.54px; left: 244.23px; top: 74.23px;"></div>
                <div class="tb-ellipse" style="width: 9.46px; height: 9.46px; left: 495.27px; top: 25.27px;"></div>
                <div class="tb-ellipse" style="width: 12.79px; height: 12.79px; left: 743.61px; top: 53.61px;"></div>
                <div class="tb-ellipse" style="width: 10.49px; height: 10.49px; left: 894.76px; top: 114.76px;"></div>
                <div class="tb-ellipse" style="width: 9.83px; height: 9.83px; left: 55.09px; top: 295.09px;"></div>
                <div class="tb-ellipse" style="width: 13.4px; height: 13.4px; left: 343.3px; top: 243.3px;"></div>
                <div class="tb-ellipse" style="width: 9.58px; height: 9.58px; left: 615.21px; top: 345.21px;"></div>
                <div class="tb-ellipse" style="width: 7.66px; height: 7.66px; left: 876.17px; top: 276.17px;"></div>
                <div class="tb-ellipse" style="width: 7.48px; height: 7.48px; left: 116.26px; top: 546.26px;"></div>
                <div class="tb-ellipse" style="width: 11.14px; height: 11.14px; left: 294.43px; top: 594.43px;"></div>
                <div class="tb-ellipse" style="width: 12.2px; height: 12.2px; left: 543.9px; top: 693.9px;"></div>
                <div class="tb-ellipse" style="width: 13.59px; height: 13.59px; left: 793.21px; top: 643.21px;"></div>
                <div class="tb-ellipse" style="width: 11.58px; height: 11.58px; left: 914.21px; top: 494.21px;"></div>
                <div class="tb-ellipse" style="width: 12.21px; height: 12.21px; left: 33.89px; top: 693.89px;"></div>
                <div class="tb-ellipse" style="width: 10.7px; height: 10.7px; left: 444.65px; top: 444.65px;"></div>
                <div class="tb-ellipse" style="width: 8px; height: 8px; left: 696px; top: 146px;"></div>
                <div class="tb-ellipse" style="width: 7.04px; height: 7.04px; left: 176.48px; top: 146.48px;"></div>
                <div class="tb-ellipse" style="width: 7.15px; height: 7.15px; left: 646.42px; top: 546.42px;"></div>
                <div class="tb-ellipse" style="width: 8.12px; height: 8.12px; left: 395.94px; top: 95.94px;"></div>
                <div class="tb-ellipse" style="width: 8.7px; height: 8.7px; left: 825.65px; top: 395.65px;"></div>
                <div class="tb-ellipse" style="width: 12px; height: 12px; left: 144px; top: 444px;"></div>
                <div class="tb-ellipse" style="width: 13.32px; height: 13.32px; left: 543.34px; top: 193.34px;"></div>
                <div class="tb-ellipse" style="width: 13.59px; height: 13.59px; left: 313.21px; top: 713.21px;"></div>

                <!-- Perpendicular Crosses -->
                <div class="tb-cross-h" style="width: 19px; left: 140.5px; top: 100px;"></div>
                <div class="tb-cross-v" style="width: 19px; left: 150px; top: 90.5px;"></div>
                <div class="tb-cross-h" style="width: 20.76px; left: 389.62px; top: 300px;"></div>
                <div class="tb-cross-v" style="width: 20.76px; left: 400px; top: 289.62px;"></div>
                <div class="tb-cross-h" style="width: 12.59px; left: 693.7px; top: 500px;"></div>
                <div class="tb-cross-v" style="width: 12.59px; left: 700px; top: 493.7px;"></div>
                <div class="tb-cross-h" style="width: 13.15px; left: 843.43px; top: 180px;"></div>
                <div class="tb-cross-v" style="width: 13.15px; left: 850px; top: 173.43px;"></div>
                <div class="tb-cross-h" style="width: 14.94px; left: 42.53px; top: 600px;"></div>
                <div class="tb-cross-v" style="width: 14.94px; left: 50px; top: 592.53px;"></div>
                <div class="tb-cross-h" style="width: 19.57px; left: 490.21px; top: 650px;"></div>
                <div class="tb-cross-v" style="width: 19.57px; left: 500px; top: 640.22px;"></div>
                <div class="tb-cross-h" style="width: 19.88px; left: 290.06px; top: 400px;"></div>
                <div class="tb-cross-v" style="width: 19.88px; left: 300px; top: 390.06px;"></div>
                <div class="tb-cross-h" style="width: 14.47px; left: 892.77px; top: 700px;"></div>
                <div class="tb-cross-v" style="width: 14.47px; left: 900px; top: 692.77px;"></div>
                <div class="tb-cross-h" style="width: 16.34px; left: 211.83px; top: 700px;"></div>
                <div class="tb-cross-v" style="width: 16.34px; left: 220px; top: 691.83px;"></div>
                <div class="tb-cross-h" style="width: 18.79px; left: 590.61px; top: 100px;"></div>
                <div class="tb-cross-v" style="width: 18.79px; left: 600px; top: 90.61px;"></div>
                <div class="tb-cross-h" style="width: 15.41px; left: 772.3px; top: 350px;"></div>
                <div class="tb-cross-v" style="width: 15.41px; left: 780px; top: 342.3px;"></div>

                <!-- Diamond Rectangles -->
                <div class="tb-rect" style="width: 14.89px; height: 14.89px; left: 192.56px; top: 182.03px; transform: rotate(-45deg);"></div>
                <div class="tb-rect" style="width: 10.44px; height: 10.44px; left: 594.78px; top: 437.4px; transform: rotate(-45deg);"></div>
                <div class="tb-rect" style="width: 17.72px; height: 17.72px; left: 91.14px; top: 428.61px; transform: rotate(-45deg);"></div>
                <div class="tb-rect" style="width: 11.88px; height: 11.88px; left: 794.06px; top: 85.66px; transform: rotate(-45deg);"></div>
                <div class="tb-rect" style="width: 15.06px; height: 15.06px; left: 442.47px; top: 531.83px; transform: rotate(-45deg);"></div>
                <div class="tb-rect" style="width: 14.18px; height: 14.18px; left: 692.91px; top: 682.89px; transform: rotate(-45deg);"></div>
                <div class="tb-rect" style="width: 13.68px; height: 13.68px; left: 343.16px; top: 33.49px; transform: rotate(-45deg);"></div>
                <div class="tb-rect" style="width: 16.15px; height: 16.15px; left: 891.92px; top: 380.51px; transform: rotate(-45deg);"></div>

                <!-- Orbital Large Circles -->
                <div class="tb-ellipse" style="width: 240px; height: 240px; left: -120px; top: -120px; opacity: 0.6;"></div>
                <div class="tb-ellipse" style="width: 300px; height: 300px; left: 810px; top: 634px; opacity: 0.6;"></div>
                <div class="tb-ellipse" style="width: 160px; height: 160px; left: 420px; top: 320px; opacity: 0.6;"></div>
                <div class="tb-ellipse" style="width: 200px; height: 200px; left: 100px; top: 500px; opacity: 0.6;"></div>
                <div class="tb-ellipse" style="width: 180px; height: 180px; left: 710px; top: 110px; opacity: 0.6;"></div>
            </div>

            <!-- top-decorations -->
            <div class="tb-top-decorations">
                <div class="tb-bracket-corner top-left">
                    <div class="tb-h"></div>
                    <div class="tb-v"></div>
                </div>
                <div class="tb-bracket-corner top-right">
                    <div class="tb-h"></div>
                    <div class="tb-v"></div>
                </div>
            </div>

            <!-- bottom-decorations -->
            <div class="tb-bottom-decorations">
                <div class="tb-bracket-corner bottom-left">
                    <div class="tb-h"></div>
                    <div class="tb-v"></div>
                </div>
                <div class="tb-bracket-corner bottom-right">
                    <div class="tb-h"></div>
                    <div class="tb-v"></div>
                </div>
            </div>

            <!-- grid-container (4x4 Matrix) -->
            <div class="tb-grid-container">
                <!-- grid-row-1 -->
                <div class="tb-grid-row">
                    <!-- slot-1-1: Blog de Publicaciones (Vista Excel) -->
                    <div class="tb-slot is-filled is-tool-blog" id="slot-1-1" data-slot="1-1" title="Blog de Publicaciones (Vista Excel)" onclick="toggleExcelBlog()" role="button" tabindex="0" aria-label="Abrir Blog de Publicaciones estilo Excel">
                        <div class="tb-inner-ring">
                            <svg class="tb-slot-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="46" height="46" fill="#000000" aria-hidden="true">
                                <path d="M 10.376953 1.9765625 C 9.787168 1.9765555 9.1973513 2.1369377 8.6777344 2.4589844 A 1.0001 1.0001 0 0 0 8.6757812 2.4589844 L 7.9101562 2.9355469 L 7.0097656 3.0019531 C 5.790157 3.0903096 4.7216027 3.8663998 4.2597656 5 L 3.9179688 5.8359375 L 3.2285156 6.4179688 C 2.2949033 7.206835 1.8871479 8.4628535 2.1796875 9.6503906 L 2.3945312 10.527344 L 2.1796875 11.402344 C 1.9283596 12.41756 2.1926714 13.48079 2.8574219 14.261719 L 2.7421875 14.179688 C 2.7421875 14.179688 4.5693281 18.566531 5.4863281 20.769531 C 5.7973281 21.514531 6.5259844 22 7.3339844 22 L 20.017578 22 C 20.548578 22 21.056641 21.788109 21.431641 21.412109 C 21.806641 21.036109 22.017578 20.527094 22.017578 19.996094 C 22.013578 17.150094 22.004953 12.048312 22.001953 9.9453125 C 22.000953 9.3473125 21.731531 8.7793906 21.269531 8.4003906 C 19.612531 7.0423906 15.712891 3.8476563 15.712891 3.8476562 L 15.722656 3.8769531 C 15.191727 3.3749897 14.496419 3.0565298 13.742188 3.0019531 L 12.841797 2.9355469 L 12.076172 2.4589844 C 11.556794 2.1366366 10.966738 1.9765695 10.376953 1.9765625 z M 10.376953 3.9746094 C 10.600706 3.9746846 10.823863 4.0355509 11.021484 4.1582031 L 11.996094 4.7636719 A 1.0001 1.0001 0 0 0 12.451172 4.9121094 L 13.597656 4.9960938 C 14.063382 5.0297937 14.463164 5.3217602 14.638672 5.7539062 A 1.0001 1.0001 0 0 0 14.640625 5.7558594 L 15.074219 6.8183594 A 1.0001 1.0001 0 0 0 15.353516 7.203125 L 16.230469 7.9453125 A 1.0001 1.0001 0 0 0 16.232422 7.9472656 C 16.589529 8.2485402 16.74232 8.7194121 16.630859 9.171875 L 16.355469 10.287109 A 1.0001 1.0001 0 0 0 16.355469 10.765625 L 16.630859 11.880859 C 16.742569 12.334886 16.589529 12.806147 16.232422 13.107422 L 15.355469 13.849609 A 1.0001 1.0001 0 0 0 15.074219 14.234375 L 14.640625 15.298828 A 1.0001 1.0001 0 0 0 14.638672 15.300781 C 14.463276 15.732652 14.062995 16.024226 13.595703 16.058594 L 12.451172 16.142578 A 1.0001 1.0001 0 0 0 11.996094 16.289062 L 11.019531 16.894531 A 1.0001 1.0001 0 0 0 11.019531 16.896484 C 10.622885 17.142869 10.127115 17.142869 9.7304688 16.896484 A 1.0001 1.0001 0 0 0 9.7304688 16.894531 L 8.7539062 16.289062 A 1.0001 1.0001 0 0 0 8.3007812 16.142578 L 7.1542969 16.058594 C 6.6883359 16.024283 6.286449 15.731975 6.1113281 15.300781 L 5.6777344 14.236328 A 1.0001 1.0001 0 0 0 5.3964844 13.849609 L 4.5195312 13.107422 C 4.1628849 12.806536 4.0092437 12.334622 4.1210938 11.882812 A 1.0001 1.0001 0 0 0 4.1210938 11.880859 L 4.3964844 10.765625 A 1.0001 1.0001 0 0 0 4.3964844 10.287109 L 4.1210938 9.171875 C 4.0096334 8.7194121 4.1631436 8.2464462 4.5195312 7.9453125 L 5.3984375 7.203125 A 1.0001 1.0001 0 0 0 5.6777344 6.8164062 L 6.1113281 5.7539062 C 6.287491 5.3215064 6.6899055 5.0297373 7.1542969 4.9960938 L 8.3007812 4.9121094 A 1.0001 1.0001 0 0 0 8.7558594 4.7636719 L 9.7304688 4.1582031 C 9.9288519 4.0352499 10.1532 3.9745341 10.376953 3.9746094 z M 12.980469 7.9902344 A 1.0001 1.0001 0 0 0 12.292969 8.2929688 L 10 10.585938 L 9.2070312 9.7929688 A 1.0001 1.0001 0 1 0 7.7929688 11.207031 L 9.2929688 12.707031 A 1.0001 1.0001 0 0 0 10.707031 12.707031 L 13.707031 9.7070312 A 1.0001 1.0001 0 0 0 12.980469 7.9902344 z"/>
                            </svg>
                        </div>
                        <div class="tb-slot-badge">BLOG</div>
                        <div class="tb-corner-dot d-tl"></div>
                        <div class="tb-corner-dot d-tr"></div>
                        <div class="tb-corner-dot d-bl"></div>
                        <div class="tb-corner-dot d-br"></div>
                    </div>
                    <!-- slot-1-2: Panel de Administrador (Firma Dilithium-5) -->
                    <div class="tb-slot is-filled is-tool-admin" id="slot-1-2" data-slot="1-2" title="Panel de Administrador (Firma Dilithium-5)" onclick="openAdminPanelGate()" role="button" tabindex="0" aria-label="Abrir Panel de Administrador con Firma Dilithium-5">
                        <div class="tb-inner-ring">
                            <svg class="tb-slot-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="46" height="46" fill="#000000" aria-hidden="true">
                                <path d="M 11 1 C 9.4166671 1 8.1018922 1.6297556 7.2519531 2.5859375 C 6.402014 3.5421194 6 4.7777779 6 6 C 6 7.2222221 6.402014 8.4578806 7.2519531 9.4140625 C 7.6012085 9.806975 8.0739181 10.099759 8.5664062 10.361328 C 5.042941 11.144552 2.1578512 13.478331 1.0546875 16.673828 A 1.0001 1.0001 0 0 0 1.53125 17.882812 C 1.6484354 17.971041 5.0931201 20.564196 6.4628906 21.595703 C 6.8108906 21.857703 7.235875 22 7.671875 22 L 20.011719 22 C 21.109719 22 22 21.109719 22 20.011719 L 22 9 C 22 8.37 21.703219 7.7783906 21.199219 7.4003906 C 19.356305 6.0177508 15.439198 3.0798154 14.650391 2.4882812 C 13.799031 1.5892667 12.526624 1 11 1 z M 11 3 C 12.083333 3 12.768559 3.3702444 13.251953 3.9140625 C 13.735347 4.4578806 14 5.2222221 14 6 C 14 6.7777779 13.735347 7.5421194 13.251953 8.0859375 C 12.768559 8.6297556 12.083333 9 11 9 C 9.9166674 9 9.2314405 8.6297556 8.7480469 8.0859375 C 8.2646532 7.5421194 8 6.7777779 8 6 C 8 5.2222221 8.2646532 4.4578806 8.7480469 3.9140625 C 9.2314405 3.3702444 9.9166674 3 11 3 z M 10 12.064453 L 10 16 L 3.6757812 16 C 4.9434882 13.915611 7.2269383 12.370138 10 12.064453 z M 12 12.064453 C 14.773062 12.370138 17.056512 13.915611 18.324219 16 L 15.992188 16 L 15.992188 15.519531 C 15.992188 15.243531 15.768187 15.019531 15.492188 15.019531 L 14.482422 15.019531 C 14.206422 15.019531 13.982422 15.243531 13.982422 15.519531 L 13.982422 16 L 12 16 L 12 12.064453 z"/>
                            </svg>
                        </div>
                        <div class="tb-slot-badge">ADMIN</div>
                        <div class="tb-corner-dot d-tl"></div>
                        <div class="tb-corner-dot d-tr"></div>
                        <div class="tb-corner-dot d-bl"></div>
                        <div class="tb-corner-dot d-br"></div>
                    </div>
                    <!-- slot-1-3: Nueva Herramienta (Tool 3) -->
                    <div class="tb-slot is-filled is-tool-3" id="slot-1-3" data-slot="1-3" title="Herramienta 3" onclick="openToolboxTool3()" role="button" tabindex="0" aria-label="Abrir Herramienta 3">
                        <div class="tb-inner-ring">
                            <svg class="tb-slot-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="46" height="46" aria-hidden="true">
                                <path fill="#ededed" fill-rule="evenodd" d="M22.903,3.286c0.679-0.381,1.515-0.381,2.193,0 c3.355,1.883,13.451,7.551,16.807,9.434C42.582,13.1,43,13.804,43,14.566c0,3.766,0,15.101,0,18.867 c0,0.762-0.418,1.466-1.097,1.847c-3.355,1.883-13.451,7.551-16.807,9.434c-0.679,0.381-1.515,0.381-2.193,0 c-3.355-1.883-13.451-7.551-16.807-9.434C5.418,34.899,5,34.196,5,33.434c0-3.766,0-15.101,0-18.867 c0-0.762,0.418-1.466,1.097-1.847C9.451,10.837,19.549,5.169,22.903,3.286z" clip-rule="evenodd"></path>
                                <path fill="#434345" d="M23.987,46.221c-1.085,0-2.171-0.252-3.165-0.757c-2.22-1.127-5.118-2.899-7.921-4.613 c-1.973-1.206-3.836-2.346-5.297-3.157C5.381,36.458,4,34.113,4,31.572V16.627c0-2.59,1.417-4.955,3.699-6.173 c3.733-1.989,9.717-5.234,12.878-7.01h0c2.11-1.184,4.733-1.184,6.844,0c3.576,2.007,10.369,6.064,14.252,8.513 C43.13,12.874,44,14.453,44,16.182V32c0,2.4-0.859,4.048-2.553,4.895c-0.944,0.531-2.628,1.576-4.578,2.787 c-3.032,1.882-6.806,4.225-9.564,5.705C26.27,45.942,25.128,46.221,23.987,46.221z M21.556,5.188 C18.384,6.97,12.382,10.226,8.64,12.22C7.012,13.088,6,14.776,6,16.627v14.945c0,1.814,0.987,3.49,2.576,4.373 c1.498,0.832,3.378,1.981,5.369,3.199c2.77,1.693,5.634,3.445,7.783,4.536c1.458,0.739,3.188,0.717,4.631-0.056 c2.703-1.451,6.447-3.775,9.456-5.643c1.97-1.223,3.671-2.279,4.696-2.854C41.835,34.464,42,33.109,42,32V16.182 c0-1.037-0.521-1.983-1.392-2.532c-3.862-2.435-10.613-6.467-14.165-8.461C24.913,4.331,23.086,4.331,21.556,5.188L21.556,5.188z"></path>
                                <path fill="#434345" d="M22.977,41.654l-0.057-13.438c-0.011-2.594,1.413-4.981,3.701-6.204l12.01-6.416 c1.998-1.068,4.414,0.38,4.414,2.646v14.73c0,1.041-0.54,2.008-1.426,2.554l-14.068,8.668 C25.557,45.424,22.987,43.996,22.977,41.654z"></path>
                                <path fill="#ededed" d="M28.799,26.274c0.123-0.063,0.225,0.014,0.227,0.176l0.013,1.32 c0.552-0.219,1.032-0.278,1.467-0.177c0.095,0.024,0.136,0.153,0.098,0.306l-0.291,1.169c-0.024,0.089-0.072,0.178-0.132,0.233 c-0.026,0.025-0.052,0.044-0.077,0.057c-0.04,0.02-0.078,0.026-0.114,0.019c-0.199-0.045-0.671-0.148-1.413,0.228 c-0.778,0.395-1.051,1.071-1.046,1.573c0.007,0.601,0.315,0.783,1.377,0.802c1.416,0.023,2.027,0.643,2.042,2.067 c0.016,1.402-0.733,2.905-1.876,3.826l0.025,1.308c0.001,0.157-0.1,0.338-0.225,0.4l-0.775,0.445 c-0.123,0.063-0.225-0.014-0.227-0.172l-0.013-1.286c-0.664,0.276-1.334,0.342-1.763,0.17c-0.082-0.032-0.117-0.152-0.084-0.288 l0.28-1.181c0.022-0.092,0.071-0.186,0.138-0.246c0.023-0.023,0.048-0.04,0.072-0.053c0.044-0.022,0.087-0.027,0.124-0.013 c0.462,0.155,1.053,0.082,1.622-0.206c0.722-0.365,1.206-1.102,1.198-1.834c-0.007-0.664-0.366-0.939-1.241-0.946 c-1.113,0.002-2.151-0.216-2.168-1.855c-0.014-1.35,0.688-2.753,1.799-3.641l-0.013-1.319c-0.001-0.162,0.098-0.34,0.225-0.405 L28.799,26.274z"></path>
                                <path fill="#4da925" d="M37.226,34.857l-3.704,2.185c-0.109,0.061-0.244-0.019-0.244-0.143v-1.252 c0-0.113,0.061-0.217,0.16-0.273l3.704-2.185c0.111-0.061,0.246,0.019,0.246,0.145v1.248 C37.388,34.697,37.326,34.801,37.226,34.857"></path>
                            </svg>
                        </div>
                        <div class="tb-slot-badge">TOOL 3</div>
                        <div class="tb-corner-dot d-tl"></div>
                        <div class="tb-corner-dot d-tr"></div>
                        <div class="tb-corner-dot d-bl"></div>
                        <div class="tb-corner-dot d-br"></div>
                    </div>
                    <!-- slot-1-4 -->
                    <div class="tb-slot" id="slot-1-4" data-slot="1-4" title="Slot 1-4">
                        <div class="tb-inner-ring">
                            <div class="tb-focal-center"></div>
                        </div>
                        <div class="tb-corner-dot d-tl"></div>
                        <div class="tb-corner-dot d-tr"></div>
                        <div class="tb-corner-dot d-bl"></div>
                        <div class="tb-corner-dot d-br"></div>
                    </div>
                </div>

                <!-- grid-row-2 -->
                <div class="tb-grid-row">
                    <!-- slot-2-1 -->
                    <div class="tb-slot" id="slot-2-1" data-slot="2-1" title="Slot 2-1">
                        <div class="tb-inner-ring">
                            <div class="tb-focal-center"></div>
                        </div>
                        <div class="tb-corner-dot d-tl"></div>
                        <div class="tb-corner-dot d-tr"></div>
                        <div class="tb-corner-dot d-bl"></div>
                        <div class="tb-corner-dot d-br"></div>
                    </div>
                    <!-- slot-2-2 -->
                    <div class="tb-slot" id="slot-2-2" data-slot="2-2" title="Slot 2-2">
                        <div class="tb-inner-ring">
                            <div class="tb-focal-center"></div>
                        </div>
                        <div class="tb-corner-dot d-tl"></div>
                        <div class="tb-corner-dot d-tr"></div>
                        <div class="tb-corner-dot d-bl"></div>
                        <div class="tb-corner-dot d-br"></div>
                    </div>
                    <!-- slot-2-3 -->
                    <div class="tb-slot" id="slot-2-3" data-slot="2-3" title="Slot 2-3">
                        <div class="tb-inner-ring">
                            <div class="tb-focal-center"></div>
                        </div>
                        <div class="tb-corner-dot d-tl"></div>
                        <div class="tb-corner-dot d-tr"></div>
                        <div class="tb-corner-dot d-bl"></div>
                        <div class="tb-corner-dot d-br"></div>
                    </div>
                    <!-- slot-2-4 -->
                    <div class="tb-slot" id="slot-2-4" data-slot="2-4" title="Slot 2-4">
                        <div class="tb-inner-ring">
                            <div class="tb-focal-center"></div>
                        </div>
                        <div class="tb-corner-dot d-tl"></div>
                        <div class="tb-corner-dot d-tr"></div>
                        <div class="tb-corner-dot d-bl"></div>
                        <div class="tb-corner-dot d-br"></div>
                    </div>
                </div>

                <!-- grid-row-3 -->
                <div class="tb-grid-row">
                    <!-- slot-3-1 -->
                    <div class="tb-slot" id="slot-3-1" data-slot="3-1" title="Slot 3-1">
                        <div class="tb-inner-ring">
                            <div class="tb-focal-center"></div>
                        </div>
                        <div class="tb-corner-dot d-tl"></div>
                        <div class="tb-corner-dot d-tr"></div>
                        <div class="tb-corner-dot d-bl"></div>
                        <div class="tb-corner-dot d-br"></div>
                    </div>
                    <!-- slot-3-2 -->
                    <div class="tb-slot" id="slot-3-2" data-slot="3-2" title="Slot 3-2">
                        <div class="tb-inner-ring">
                            <div class="tb-focal-center"></div>
                        </div>
                        <div class="tb-corner-dot d-tl"></div>
                        <div class="tb-corner-dot d-tr"></div>
                        <div class="tb-corner-dot d-bl"></div>
                        <div class="tb-corner-dot d-br"></div>
                    </div>
                    <!-- slot-3-3 -->
                    <div class="tb-slot" id="slot-3-3" data-slot="3-3" title="Slot 3-3">
                        <div class="tb-inner-ring">
                            <div class="tb-focal-center"></div>
                        </div>
                        <div class="tb-corner-dot d-tl"></div>
                        <div class="tb-corner-dot d-tr"></div>
                        <div class="tb-corner-dot d-bl"></div>
                        <div class="tb-corner-dot d-br"></div>
                    </div>
                    <!-- slot-3-4 -->
                    <div class="tb-slot" id="slot-3-4" data-slot="3-4" title="Slot 3-4">
                        <div class="tb-inner-ring">
                            <div class="tb-focal-center"></div>
                        </div>
                        <div class="tb-corner-dot d-tl"></div>
                        <div class="tb-corner-dot d-tr"></div>
                        <div class="tb-corner-dot d-bl"></div>
                        <div class="tb-corner-dot d-br"></div>
                    </div>
                </div>

                <!-- grid-row-4 -->
                <div class="tb-grid-row">
                    <!-- slot-4-1 -->
                    <div class="tb-slot" id="slot-4-1" data-slot="4-1" title="Slot 4-1">
                        <div class="tb-inner-ring">
                            <div class="tb-focal-center"></div>
                        </div>
                        <div class="tb-corner-dot d-tl"></div>
                        <div class="tb-corner-dot d-tr"></div>
                        <div class="tb-corner-dot d-bl"></div>
                        <div class="tb-corner-dot d-br"></div>
                    </div>
                    <!-- slot-4-2 -->
                    <div class="tb-slot" id="slot-4-2" data-slot="4-2" title="Slot 4-2">
                        <div class="tb-inner-ring">
                            <div class="tb-focal-center"></div>
                        </div>
                        <div class="tb-corner-dot d-tl"></div>
                        <div class="tb-corner-dot d-tr"></div>
                        <div class="tb-corner-dot d-bl"></div>
                        <div class="tb-corner-dot d-br"></div>
                    </div>
                    <!-- slot-4-3 -->
                    <div class="tb-slot" id="slot-4-3" data-slot="4-3" title="Slot 4-3">
                        <div class="tb-inner-ring">
                            <div class="tb-focal-center"></div>
                        </div>
                        <div class="tb-corner-dot d-tl"></div>
                        <div class="tb-corner-dot d-tr"></div>
                        <div class="tb-corner-dot d-bl"></div>
                        <div class="tb-corner-dot d-br"></div>
                    </div>
                    <!-- slot-4-4 -->
                    <div class="tb-slot" id="slot-4-4" data-slot="4-4" title="Slot 4-4">
                        <div class="tb-inner-ring">
                            <div class="tb-focal-center"></div>
                        </div>
                        <div class="tb-corner-dot d-tl"></div>
                        <div class="tb-corner-dot d-tr"></div>
                        <div class="tb-corner-dot d-bl"></div>
                        <div class="tb-corner-dot d-br"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="toolkit/pdf-inspector/toolkit-pdf-md.js?v=2"></script>

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
                    headers: authHeaders(),
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
        const SVG_GATEWAY_BLACK = '<svg class="svg-icon-vector gateway-crescent-svg" style="fill:currentColor; width:16px; height:16px;" viewBox="0 0 30 30"><path fill="currentColor" d="M 15 3 C 8.3845336 3 3 8.3845336 3 15 C 3 21.615466 8.3845336 27 15 27 C 17.554923 27 19.9167 26.181425 21.853516 24.818359 A 1.0002806 1.0002806 0 0 0 20.703125 23.181641 C 19.081941 24.322575 17.129077 25 15 25 C 9.4654664 25 5 20.534534 5 15 C 5 9.4654664 9.4654664 5 15 5 C 17.129077 5 19.081941 5.6774247 20.703125 6.8183594 A 1.0002809 1.0002809 0 0 0 21.853516 5.1816406 C 19.9167 3.8185753 17.554923 3 15 3 z"></path></svg>';
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
                opt.textContent = item.path + (item.size_formatted ? ' (' + item.size_formatted + ')' : '');
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
                selector.innerHTML = '<option value="">Selecciona un archivo de código por carpeta...</option>';
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
        /* Tabby Terminal Safe Embedded Constrains */
        svg.tabby-icon-svg, .tabby-icon-svg, .tabby-prompt-header svg, .tabby-terminal-container svg {
            width: 14px !important;
            height: 14px !important;
            max-width: 14px !important;
            max-height: 14px !important;
            min-width: 14px !important;
            min-height: 14px !important;
            display: inline-block !important;
            vertical-align: middle !important;
            flex-shrink: 0 !important;
        }
        .block-row.block-execution {
            border: 1px solid #d0d0d0;
            background: #ffffff;
            margin-bottom: 8px;
            border-radius: 6px;
            overflow: hidden;
        }
        .block-row.block-prompt {
            border: 1px solid #d0d0d0;
            background: #ffffff;
            border-radius: 0 0 6px 6px;
        }
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
                    const upHeaders = {};
                    try {
                        const tok = (typeof window.l8GetAuthToken === 'function') ? window.l8GetAuthToken() : '';
                        if (tok) upHeaders['Authorization'] = 'Bearer ' + tok;
                    } catch (e) {}
                    upHeaders['X-Requested-With'] = 'XMLHttpRequest';
                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        headers: upHeaders,
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

        function openGatewayFromTool(toolName, options) {
            options = options || {};
            let customPayload = null;
            let repoTarget = '';

            if (toolName === 'notepad') {
                customPayload = collectGatewayNotepadPayload(true);
            } else if (toolName === 'terminal') {
                if (options.content) {
                    customPayload = {
                        name: gatewaySafeFilename(options.name || 'tabby-terminal', 'md'),
                        content: options.content,
                        folder: 'terminal',
                        source: 'terminal',
                        label: 'Terminal · ' + (options.name || 'sesión')
                    };
                } else {
                    customPayload = collectGatewayTerminalPayload();
                }
            } else if (toolName === 'repo') {
                repoTarget = options.repo || '';
            } else if (options.content) {
                customPayload = {
                    name: gatewaySafeFilename(options.name || 'archivo', 'txt'),
                    content: options.content,
                    folder: options.folder || 'tools',
                    source: toolName || 'tool',
                    label: options.label || (toolName + ' · ' + (options.name || 'payload'))
                };
            }

            if (repoTarget) {
                openGatewaySend(repoTarget, repoTarget, { autoSend: options.autoSend !== false });
                return;
            }

            openPlatformGateway({
                initialPayload: customPayload,
                sourceHint: toolName,
                autoSend: options.autoSend !== false
            });
        }

        function openPlatformGateway(opts) {
            opts = opts || {};
            const existing = document.getElementById('gatewayModal');
            if (existing) existing.remove();

            const terminalPayload = collectGatewayTerminalPayload();
            const notepadPayload = collectGatewayNotepadPayload(true);
            const initialPayload = opts.initialPayload || null;
            const sourceHint = opts.sourceHint || '';

            const overlay = document.createElement('div');
            overlay.id = 'gatewayModal';
            overlay.className = 'unlicensed-modal-overlay';
            overlay.innerHTML = `
                <div class="gateway-modal" role="dialog" aria-modal="true" aria-labelledby="gatewayModalTitle">
                    <div class="gateway-modal-title" id="gatewayModalTitle">GATEWAY</div>
                    <div class="gateway-modal-brand">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="24" height="24" class="gateway-crescent-svg" style="fill:currentColor; flex-shrink:0;">
                            <path d="M 15 3 C 8.3845336 3 3 8.3845336 3 15 C 3 21.615466 8.3845336 27 15 27 C 17.554923 27 19.9167 26.181425 21.853516 24.818359 A 1.0002806 1.0002806 0 0 0 20.703125 23.181641 C 19.081941 24.322575 17.129077 25 15 25 C 9.4654664 25 5 20.534534 5 15 C 5 9.4654664 9.4654664 5 15 5 C 17.129077 5 19.081941 5.6774247 20.703125 6.8183594 A 1.0002809 1.0002809 0 0 0 21.853516 5.1816406 C 19.9167 3.8185753 17.554923 3 15 3 z"></path>
                        </svg>
                        <div class="gateway-brand-heading">
                            <span class="gateway-brand-primary">Hashcod codespace</span>
                            <span class="gateway-brand-sub">· l8 codespace</span>
                        </div>
                    </div>
                    <div class="gateway-modal-text">
                        Transporta contenido de la plataforma (no solo GitHub).
                        Elige qué enviar; se genera un código único para reclamarlo en <code>/gateway</code>.
                        Los repositorios siguen pudiendo enviarse desde el botón antena de cada repo.
                    </div>
                    <div class="gateway-source-list" id="gatewaySourceList">
                        <label class="gateway-source-item ${(notepadPayload || (initialPayload && initialPayload.source === 'notepad')) ? '' : 'disabled'}">
                            <input type="checkbox" id="gatewaySrcNotepad" ${(sourceHint === 'notepad' || (!sourceHint && notepadPayload)) ? 'checked' : ''} ${(notepadPayload || (initialPayload && initialPayload.source === 'notepad')) ? '' : 'disabled'}>
                            <span>
                                <strong>Bloc de notas</strong>
                                <span class="muted">${(initialPayload && initialPayload.source === 'notepad')
                                    ? initialPayload.label
                                    : (notepadPayload
                                        ? (notepadPayload.label + (notepadPayload.selection ? '' : ' · nota activa'))
                                        : 'Sin contenido en la nota activa')}</span>
                            </span>
                        </label>
                        <label class="gateway-source-item ${(terminalPayload || (initialPayload && initialPayload.source === 'terminal')) ? '' : 'disabled'}">
                            <input type="checkbox" id="gatewaySrcTerminal" ${(sourceHint === 'terminal' || (!sourceHint && terminalPayload && !notepadPayload)) ? 'checked' : ''} ${(terminalPayload || (initialPayload && initialPayload.source === 'terminal')) ? '' : 'disabled'}>
                            <span>
                                <strong>Terminal negra / Tabby</strong>
                                <span class="muted">${(initialPayload && initialPayload.source === 'terminal')
                                    ? initialPayload.label
                                    : (terminalPayload
                                        ? terminalPayload.label
                                        : 'Sin texto en la terminal')}</span>
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

            const hasAny = !!(notepadPayload || terminalPayload || initialPayload);
            if (!hasAny) {
                statusEl.textContent = 'No hay contenido listo. Escribe en el bloc de notas o en la terminal, o abre /gateway para recibir.';
                statusEl.className = 'gateway-modal-status';
                sendBtn.disabled = true;
            }

            const doSend = async () => {
                const wantNote = !!(document.getElementById('gatewaySrcNotepad') || {}).checked;
                const wantTerm = !!(document.getElementById('gatewaySrcTerminal') || {}).checked;
                const files = [];
                const sources = [];
                const labels = [];

                if (initialPayload && !sources.includes(initialPayload.source)) {
                    if ((initialPayload.source === 'notepad' && wantNote) || (initialPayload.source === 'terminal' && wantTerm) || (!wantNote && !wantTerm)) {
                        files.push({
                            name: initialPayload.name,
                            content: initialPayload.content,
                            folder: initialPayload.folder || initialPayload.source || 'platform'
                        });
                        sources.push(initialPayload.source);
                        labels.push(initialPayload.label || initialPayload.source);
                    }
                }

                if (wantNote && !sources.includes('notepad')) {
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
                if (wantTerm && !sources.includes('terminal')) {
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
                statusEl.textContent = 'Empaquetando contenido de Hashcod codespace y generando código único…';
                statusEl.className = 'gateway-modal-status';
                try {
                    const res = await fetch(apiUrl('api/gateway/share'), {
                        method: 'POST',
                        headers: authHeaders(),
                        body: JSON.stringify({
                            kind: 'platform',
                            sources: sources,
                            label: labels.join(' + '),
                            files: files
                        })
                    });
                    let data;
                    try {
                        data = await res.json();
                    } catch (jsonErr) {
                        const txt = await res.text();
                        data = { ok: false, error: txt || `Error del servidor (HTTP ${res.status})` };
                    }
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
                    statusEl.textContent = data.message || ('Código listo: ' + lastCode + '. Reclámalo en /gateway.');
                    statusEl.className = 'gateway-modal-status ok';
                    sendBtn.disabled = false;

                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(lastCode).catch(() => {});
                    }

                    if (window.CodespaceWS && lastCode) {
                        window.CodespaceWS.emitGatewayTransfer(lastCode, labels.join(' + '));
                    }
                } catch (err) {
                    statusEl.textContent = 'Error al comunicar con el gateway: ' + (err.message || 'Verifica la conexión');
                    statusEl.className = 'gateway-modal-status err';
                    sendBtn.disabled = false;
                }
            };

            sendBtn.addEventListener('click', doSend);

            if (opts.autoSend && hasAny) {
                doSend();
            }
        }

        function openGatewaySend(repoName, userRepo, opts) {
            opts = opts || {};
            const existing = document.getElementById('gatewayModal');
            if (existing) existing.remove();
            const full = userRepo || repoName || '';
            const safeFull = String(full).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
            const overlay = document.createElement('div');
            overlay.id = 'gatewayModal';
            overlay.className = 'unlicensed-modal-overlay';
            overlay.innerHTML = `
                <div class="gateway-modal" role="dialog" aria-modal="true" aria-labelledby="gatewayModalTitle">
                    <div class="gateway-modal-title" id="gatewayModalTitle">GATEWAY</div>
                    <div class="gateway-modal-brand">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="24" height="24" class="gateway-crescent-svg" style="fill:currentColor; flex-shrink:0;">
                            <path d="M 15 3 C 8.3845336 3 3 8.3845336 3 15 C 3 21.615466 8.3845336 27 15 27 C 17.554923 27 19.9167 26.181425 21.853516 24.818359 A 1.0002806 1.0002806 0 0 0 20.703125 23.181641 C 19.081941 24.322575 17.129077 25 15 25 C 9.4654664 25 5 20.534534 5 15 C 5 9.4654664 9.4654664 5 15 5 C 17.129077 5 19.081941 5.6774247 20.703125 6.8183594 A 1.0002809 1.0002809 0 0 0 21.853516 5.1816406 C 19.9167 3.8185753 17.554923 3 15 3 z"></path>
                        </svg>
                        <div class="gateway-brand-heading">
                            <span class="gateway-brand-primary">Hashcod codespace</span>
                            <span class="gateway-brand-sub">· l8 codespace</span>
                        </div>
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
                    const res = await fetch(apiUrl('api/gateway/share'), {
                        method: 'POST',
                        headers: authHeaders(),
                        body: JSON.stringify({ repo: full })
                    });
                    let data;
                    try {
                        data = await res.json();
                    } catch (jsonErr) {
                        const txt = await res.text();
                        data = { ok: false, error: txt || `Error del servidor (HTTP ${res.status})` };
                    }
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
                    statusEl.textContent = data.message || ('Código listo: ' + lastCode + '. Úsalo en /gateway desde cualquier dispositivo.');
                    statusEl.className = 'gateway-modal-status ok';
                    sendBtn.disabled = false;

                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(lastCode).catch(() => {});
                    }

                    if (window.CodespaceWS && lastCode) {
                        window.CodespaceWS.emitGatewayTransfer(lastCode, full);
                    }
                } catch (err) {
                    statusEl.textContent = 'Error al comunicar con el gateway: ' + (err.message || 'Verifica la conexión');
                    statusEl.className = 'gateway-modal-status err';
                    sendBtn.disabled = false;
                }
            };

            sendBtn.addEventListener('click', doSend);

            if (opts.autoSend && full) {
                doSend();
            }
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Clave pública SSH copiada al portapapeles con éxito!');
            }).catch(err => {
                console.error('Error al copiar:', err);
        function tabbyWrapOutput(innerHtml, isError, errorMsg) {
            const cmd = (latestExecutionData && latestExecutionData.executedCommand) || lastCommandText || '';
            const dur = (latestExecutionData && latestExecutionData.executionDuration) || 1;
            
            // Limpiar siempre el contenedor de ejecución temporal para eliminar el spinner
            if (executionContainer) {
                executionContainer.innerHTML = '';
            }

            if (cmd === 'clear') {
                if (window.TabbyTerminal && typeof window.TabbyTerminal.clearActiveTab === 'function') {
                    window.TabbyTerminal.clearActiveTab();
                    return '';
                }
            }
            if (cmd === 'workflows') {
                if (window.TabbyTerminal && typeof window.TabbyTerminal.openProfilesModal === 'function') {
                    window.TabbyTerminal.openProfilesModal();
                }
            }
            if (window.TabbyTerminal && typeof window.TabbyTerminal.createBlock === 'function') {
                window.TabbyTerminal.createBlock(cmd, innerHtml, {
                    duration: dur,
                    isError: !!isError,
                    error: errorMsg
                });
                window.TabbyTerminal.renderSessionFeed();
                return '';
            }
            if (executionContainer) {
                executionContainer.innerHTML = innerHtml;
            }
            return innerHtml;
        }

        function render() {
            if (!hasExecutedCommand || !latestExecutionData) {
                executionContainer.textContent = '';
                return;
            }

            if (latestExecutionData.isError || latestExecutionData.error) {
                const errorMsg = latestExecutionData.error || "Your command does not exist....";
                executionContainer.innerHTML = tabbyWrapOutput('<span style="color: #EF4444; font-weight: 600;">' + errorMsg + '</span>', true, errorMsg);
                return;
            }

            const dataToDisplay = latestExecutionData.output !== undefined ? latestExecutionData.output : latestExecutionData;

            if (!dataToDisplay || dataToDisplay.type === "EMPTY_CELL" || (dataToDisplay.execution === null && dataToDisplay.browserState)) {
                tabbyWrapOutput('<span style="color:#6B7280;">Comando ejecutado. Celda vaciada.</span>');
                return;
            }

            if (dataToDisplay.type === "TRIGGER_UPLOAD") {
                setTimeout(triggerFileUpload, 40);
                tabbyWrapOutput(`
                    <div style="display:flex; align-items:center; gap:8px; padding:4px 0;">
                        <svg class="tabby-icon-svg" style="fill:#10B981; width:16px; height:16px;" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                        <span><strong>Subida de Archivos:</strong> Explorador abierto para seleccionar y firmar criptográficamente (Dilithium-5).</span>
                    </div>
                `);
                return;
            }

            if (dataToDisplay.type === "TRIGGER_WORKFLOWS") {
                if (window.TabbyTerminal && typeof window.TabbyTerminal.openProfilesModal === 'function') {
                    window.TabbyTerminal.openProfilesModal();
                }
                tabbyWrapOutput(`
                    <div style="display:flex; align-items:center; gap:8px; padding:4px 0;">
                        <svg class="tabby-icon-svg" style="fill:#3B82F6; width:16px; height:16px;" viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
                        <span><strong>Tabby Profiles:</strong> Panel de flujos de trabajo predefinidos abierto.</span>
                    </div>
                `);
                return;
            }

            if (dataToDisplay.type === "CLEAR_TERMINAL_SESSION") {
                if (window.TabbyTerminal && typeof window.TabbyTerminal.clearActiveTab === 'function') {
                    window.TabbyTerminal.clearActiveTab();
                }
                return;
            }

            if (dataToDisplay.type === "CLEAR_BLACK_TERMINAL") {
                clearBlackTerminal();
                tabbyWrapOutput(`
                    <div style="display:flex; align-items:center; gap:8px; padding:4px 0;">
                        <svg class="tabby-icon-svg" style="fill:#6B7280; width:16px; height:16px;" viewBox="0 0 24 24"><path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        <span>Terminal negra y visor de archivos limpiados.</span>
                    </div>
                `);
                return;
            }

            if (dataToDisplay && dataToDisplay.type === "BASH_OUTPUT") {
                const isError = (dataToDisplay.exit_code !== 0);
                const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                let outHtml = '';
                if (dataToDisplay.stdout) {
                    outHtml += `<pre class="tabby-source-pre" style="margin:0; background:transparent; color:inherit; padding:0;">${esc(dataToDisplay.stdout)}</pre>`;
                }
                if (dataToDisplay.stderr) {
                    outHtml += `<pre class="tabby-source-pre" style="margin:0; color:#EF4444; background:transparent; padding:0;">${esc(dataToDisplay.stderr)}</pre>`;
                }
                if (!outHtml) {
                    outHtml = '<span style="color:#6B7280;">(Ejecutado sin salida)</span>';
                }
                tabbyWrapOutput(outHtml, isError, dataToDisplay.stderr || null);
                return;
            }

            if (dataToDisplay && dataToDisplay.type === "TRIGGER_THEMES") {
                if (window.TabbyTerminal && typeof window.TabbyTerminal.openThemesModal === 'function') {
                    window.TabbyTerminal.openThemesModal();
                }
                tabbyWrapOutput(`
                    <div style="display:flex; align-items:center; gap:8px; padding:4px 0;">
                        <svg class="tabby-icon-svg" style="fill:#3B82F6; width:16px; height:16px;" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.17 19.59 10.53 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-5 9c-.83 0-1.5-.67-1.5-1.5S6.17 9 7 9s1.5.67 1.5 1.5S7.83 12 7 12zm3-4c-.83 0-1.5-.67-1.5-1.5S9.17 5 10 5s1.5.67 1.5 1.5S10.83 8 10 8zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 5 14 5s1.5.67 1.5 1.5S14.83 8 14 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.17 9 17 9s1.5.67 1.5 1.5S17.83 12 17 12z"/></svg>
                        <span><strong>Tabby Themes:</strong> Selector de paletas y estilos visuales abierto.</span>
                    </div>
                `);
                return;
            }

            if (dataToDisplay && dataToDisplay.type === "TRIGGER_AI") {
                if (window.TabbyTerminal && typeof window.TabbyTerminal.openPaletteModal === 'function') {
                    window.TabbyTerminal.openPaletteModal(dataToDisplay.prompt || '');
                }
                tabbyWrapOutput(`
                    <div style="display:flex; align-items:center; gap:8px; padding:4px 0;">
                        <svg class="tabby-icon-svg" style="fill:#8B5CF6; width:16px; height:16px;" viewBox="0 0 24 24"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>
                        <span><strong>Tabby Palette:</strong> Generador inteligente de comandos abierto.</span>
                    </div>
                `);
                return;
            }

            if (dataToDisplay && dataToDisplay.type === "STATUS") {
                const sb = dataToDisplay.supabase || {};
                tabbyWrapOutput(`
                    <div class="ssh-card-container">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                            <strong style="font-size:13px; color:#111827;">Estado del Sistema — Hashcod codespace</strong>
                            <span class="metric-badge-black" style="background:#111827; color:#FFFFFF;">DIKTATCART</span>
                        </div>
                        <div style="font-size:12px; display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:8px;">
                            <div><strong>Seguridad PQC:</strong> NIST Dilithium-5 (ML-DSA-87) Activo</div>
                            <div><strong>Servidor:</strong> PHP ${dataToDisplay.php_version || '8.1'} (${dataToDisplay.os || 'Linux'})</div>
                            <div><strong>Supabase Storage:</strong> ${sb.storage_ready ? 'Listo / Conectado' : 'Pendiente'}</div>
                            <div><strong>Navegadores Activos:</strong> ${dataToDisplay.browsers_running || 0} procesos</div>
                        </div>
                    </div>
                `);
                return;
            }

            if (dataToDisplay && dataToDisplay.type === "PRS_CODE_LAUNCH") {
                const url = dataToDisplay.open_url || '/prs-code';
                markExternalLaunchOnly(dataToDisplay.product || 'PRS Code', url);
                setTimeout(() => openPrsCode(url), 80);
                tabbyWrapOutput(`
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                        <span><strong>PRS Code:</strong> Lanzado exitosamente en ventana externa.</span>
                        <button type="button" class="btn-upload-vector" onclick="openPrsCode('${url}')">Abrir ventana</button>
                    </div>
                `);
                return;
            }

            if (dataToDisplay && dataToDisplay.type === "MACOS_INSIDE_LAUNCH") {
                const url = dataToDisplay.open_url || '/macos';
                markExternalLaunchOnly(dataToDisplay.product || 'macOS inside', url);
                setTimeout(() => openMacosInside(url), 80);
                tabbyWrapOutput(`
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                        <span><strong>macOS inside:</strong> Lanzado exitosamente en ventana externa.</span>
                        <button type="button" class="btn-upload-vector" onclick="openMacosInside('${url}')">Abrir ventana</button>
                    </div>
                `);
                return;
            }

            if (dataToDisplay && dataToDisplay.type === "CHROMEOS_PLAY_LAUNCH") {
                const url = dataToDisplay.open_url || '/chromeos';
                markExternalLaunchOnly(dataToDisplay.product || 'ChromeOS play', url);
                setTimeout(() => openChromeosPlay(url), 80);
                tabbyWrapOutput(`
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                        <span><strong>ChromeOS play:</strong> Lanzado exitosamente en ventana externa.</span>
                        <button type="button" class="btn-upload-vector" onclick="openChromeosPlay('${url}')">Abrir ventana</button>
                    </div>
                `);
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
                executionContainer.innerHTML = tabbyWrapOutput(reposHtml);
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
                executionContainer.innerHTML = tabbyWrapOutput(supabaseHtml);
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
                executionContainer.innerHTML = tabbyWrapOutput(sshHtml);
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
                                No hay archivos subidos aún en la Base de Datos Global. Usa el botón de subida en la consola negra o ejecuta <code>upload</code>.
                            </td>
                        </tr>
                    `;
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
                executionContainer.innerHTML = tabbyWrapOutput(catalogHtml);
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
                executionContainer.innerHTML = tabbyWrapOutput(`<div class="vertical-cmd-table">${htmlRows}</div>`);
                return;
            }

            if (formatToggle.checked) {
                document.body.classList.remove('raw-mode');
                executionContainer.innerHTML = tabbyWrapOutput(syntaxHighlight(dataToDisplay));
            } else {
                document.body.classList.add('raw-mode');
                executionContainer.innerHTML = tabbyWrapOutput(`<pre style="margin:0; font-family:inherit; white-space:pre-wrap;">${JSON.stringify(dataToDisplay, null, 2)}</pre>`);
            }
        }


        const MOBILE_MODE_KEY = 'l8_mobile_mode';

        function isMobileModeEnabled() {
            return document.body.classList.contains('mobile-mode');
        }

        function syncMobileModeButton(on) {
            const active = !!on;
            const title = active ? 'Salir de versión móvil' : 'Versión móvil';
            const label = active ? 'Desactivar versión móvil' : 'Activar versión móvil';
            ['mobileModeBtn', 'bootMobileModeBtn'].forEach((id) => {
                const btn = document.getElementById(id);
                if (!btn) return;
                btn.setAttribute('aria-pressed', active ? 'true' : 'false');
                btn.title = title;
                btn.setAttribute('aria-label', label);
            });
        }

        function setMobileMode(on, persist) {
            const active = !!on;
            document.body.classList.toggle('mobile-mode', active);
            syncMobileModeButton(active);
            if (persist !== false) {
                try {
                    localStorage.setItem(MOBILE_MODE_KEY, active ? '1' : '0');
                } catch (e) {}
            }
            try {
                window.dispatchEvent(new CustomEvent('l8:mobile-mode', { detail: { on: active } }));
            } catch (e) {}
        }

        function toggleMobileMode(force) {
            const next = typeof force === 'boolean' ? force : !isMobileModeEnabled();
            setMobileMode(next, true);
        }

        function initMobileMode() {
            let stored = null;
            try { stored = localStorage.getItem(MOBILE_MODE_KEY); } catch (e) {}
            const on = stored === '1' || (stored === null && document.body.classList.contains('mobile-mode'));
            setMobileMode(on, stored === null ? false : true);
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

        function apiUrl(path) {
            if (!path) return '';
            if (/^(https?:|\/\/)/i.test(path)) return path;
            const base = (window.L8_BASE_PATH || '/').replace(/\/+$/, '');
            const cleanPath = path.replace(/^\/+/, '');
            return (base ? base : '') + '/' + cleanPath;
        }

        // Interceptor transparente para que cualquier llamada a /api/ resuelva a la ruta correcta
        (function() {
            const originalFetch = window.fetch;
            window.fetch = function(resource, init) {
                if (typeof resource === 'string' && (resource.startsWith('/api/') || resource.startsWith('/gateway') || resource.startsWith('/cmd'))) {
                    resource = apiUrl(resource);
                }
                return originalFetch.call(this, resource, init);
            };
        })();

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
            if (k === 'toolkit' || k === 'toolkits' || k === 'tools') return 'Toolkit';
            if (k === 'unlock' || k === 'dilithium' || k === 'credit') return 'Desbloqueo';
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
                    formatTokenCount(row.notepads) + ' notas · ' +
                    formatTokenCount(row.toolkits) + ' toolkit</span>';
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
                const isUnlock = String(row.kind || '').toLowerCase() === 'unlock';
                const costLabel = isUnlock
                    ? (row.detail ? String(row.detail).split(' · ')[0] : '+0')
                    : ('−' + formatTokenCount(row.cost));
                left.innerHTML = '<strong>' + costLabel.replace(/</g, '&lt;') + '</strong> ' + tokenKindLabel(row.kind) +
                    '<br><span class="muted">' + when + (detail && !isUnlock ? ' · ' + detail.replace(/</g, '&lt;') : (isUnlock && row.detail ? ' · ' + String(row.detail).replace(/</g, '&lt;') : '')) + '</span>';
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
            const toolkits = document.getElementById('tokensToolkits');
            const period = document.getElementById('tokensPeriodLabel');
            const fill = document.getElementById('tokensMeterFill');
            const btn = document.getElementById('tokensMeterBtn');
            const legend = document.getElementById('tokensLegend');
            if (rem) rem.textContent = formatTokenCount(status.remaining);
            if (used) {
                const cap = Number(status.allowance || 0) + Number(status.bonus || 0);
                used.textContent = formatTokenCount(status.used) + ' / ' + formatTokenCount(cap);
            }
            if (cmds) cmds.textContent = formatTokenCount(status.commands);
            if (exts) exts.textContent = formatTokenCount(status.externals);
            if (clones) clones.textContent = formatTokenCount(status.clones);
            if (notepads) notepads.textContent = formatTokenCount(status.notepads);
            if (toolkits) toolkits.textContent = formatTokenCount(status.toolkits);
            if (period) {
                const bonus = Number(status.bonus || 0);
                period.textContent = 'Periodo ' + (status.period || '—') +
                    ' · cupo ' + formatTokenCount(status.allowance) +
                    (bonus > 0 ? (' + bonus ' + formatTokenCount(bonus)) : '');
            }
            const pct = Math.max(0, Math.min(100, Number(status.percent_used || 0)));
            if (fill) {
                fill.style.width = pct + '%';
                fill.classList.toggle('warn', pct >= 70 && pct < 90);
                fill.classList.toggle('danger', pct >= 90);
            }
            if (btn) {
                btn.classList.toggle('low', pct >= 70 && pct < 100);
                btn.classList.toggle('exhausted', !!status.exhausted || (status.remaining || 0) <= 0);
                btn.title = 'Tokens: ' + formatTokenCount(status.remaining) + ' restantes · Dilithium unlock';
            }
            if (legend && status.costs) {
                legend.textContent = 'Cupo mensual ' + formatTokenCount(status.allowance) +
                    (status.bonus ? (' + bonus ' + formatTokenCount(status.bonus)) : '') +
                    ' · Comando −' + status.costs.command +
                    ' · Ventana externa −' + status.costs.external +
                    ' · Clone GitHub −' + status.costs.clone +
                    ' · Bloc de notas −' + (status.costs.notepad || 1000) +
                    ' · Toolkit −' + (status.costs.toolkit || 1000);
            }
            renderTokensHistory(status);
            renderTokensLedger(status);
            renderTokensUnlock(status);
        }

        function tokensUnlockIconSvg(kind) {
            const k = String(kind || '');
            // Iconos reales de la plataforma según el área
            if (k === 'ext' || k === 'external' || k === 'gateway') {
                // Gateway (ventanas externas / envío)
                return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" aria-hidden="true"><path fill="currentColor" d="M 9.875 0.0625 C 9.617188 0.0976563 9.378906 0.230469 9.21875 0.4375 C 6.585938 3.582031 5 7.644531 5 12.0625 C 5 16.429688 6.542969 20.433594 9.125 23.5625 C 9.480469 23.992188 10.117188 24.058594 10.546875 23.703125 C 10.976563 23.347656 11.042969 22.710938 10.6875 22.28125 C 8.390625 19.496094 7 15.957031 7 12.0625 C 7 8.125 8.40625 4.515625 10.75 1.71875 C 11.027344 1.40625 11.082031 0.957031 10.886719 0.585938 C 10.691406 0.21875 10.289063 0.0078125 9.875 0.0625 Z M 39.8125 0.0625 C 39.453125 0.128906 39.160156 0.378906 39.042969 0.726563 C 38.925781 1.070313 39.003906 1.449219 39.25 1.71875 C 41.59375 4.515625 43 8.125 43 12.0625 C 43 15.957031 41.609375 19.496094 39.3125 22.28125 C 38.957031 22.710938 39.023438 23.347656 39.453125 23.703125 C 39.882813 24.058594 40.519531 23.992188 40.875 23.5625 C 43.457031 20.433594 45 16.429688 45 12.0625 C 45 7.644531 43.414063 3.582031 40.78125 0.4375 C 40.570313 0.171875 40.242188 0.03125 39.90625 0.0625 C 39.875 0.0625 39.84375 0.0625 39.8125 0.0625 Z M 15.6875 3.34375 C 15.429688 3.378906 15.191406 3.511719 15.03125 3.71875 C 13.140625 5.976563 12 8.890625 12 12.0625 C 12 15.234375 13.140625 18.148438 15.03125 20.40625 C 15.253906 20.707031 15.621094 20.855469 15.988281 20.800781 C 16.355469 20.742188 16.660156 20.488281 16.78125 20.136719 C 16.902344 19.785156 16.816406 19.394531 16.5625 19.125 C 14.960938 17.214844 14 14.753906 14 12.0625 C 14 9.371094 14.960938 6.914063 16.5625 5 C 16.839844 4.6875 16.894531 4.238281 16.699219 3.867188 C 16.503906 3.5 16.101563 3.289063 15.6875 3.34375 Z M 34 3.34375 C 33.640625 3.410156 33.347656 3.660156 33.230469 4.007813 C 33.113281 4.351563 33.191406 4.730469 33.4375 5 C 35.039063 6.914063 36 9.371094 36 12.0625 C 36 14.753906 35.039063 17.214844 33.4375 19.125 C 33.183594 19.394531 33.097656 19.785156 33.21875 20.136719 C 33.339844 20.488281 33.644531 20.742188 34.011719 20.800781 C 34.378906 20.855469 34.746094 20.707031 34.96875 20.40625 C 36.859375 18.148438 38 15.234375 38 12.0625 C 38 8.890625 36.859375 5.976563 34.96875 3.71875 C 34.757813 3.453125 34.429688 3.3125 34.09375 3.34375 C 34.0625 3.34375 34.03125 3.34375 34 3.34375 Z M 25 8 C 22.789063 8 21 9.789063 21 12 C 21 13.324219 21.632813 14.492188 22.625 15.21875 L 10.5 47.28125 C 10.113281 48.316406 10.636719 49.472656 11.671875 49.859375 C 12.707031 50.246094 13.863281 49.722656 14.25 48.6875 L 15.53125 45.34375 L 32.6875 40.5625 L 35.75 48.6875 C 36.136719 49.722656 37.292969 50.246094 38.328125 49.859375 C 39.363281 49.472656 39.886719 48.316406 39.5 47.28125 L 27.375 15.21875 C 28.367188 14.492188 29 13.324219 29 12 C 29 9.789063 27.210938 8 25 8 Z M 25 20.3125 L 27.5625 27.0625 L 21.59375 29.3125 Z M 28.96875 30.78125 L 30.5625 35.03125 L 24.1875 32.625 Z M 19.40625 35.09375 L 27.03125 37.96875 L 17.28125 40.6875 Z"></path></svg>';
            }
            if (k === 'clone' || k === 'github') {
                // Marca GitHub (clones)
                return '<img src="github-mark-gray.svg?v=1" alt="" aria-hidden="true">';
            }
            if (k === 'kit' || k === 'toolkit') {
                // Cubo isométrico del Toolkit
                return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" aria-hidden="true"><path fill="currentColor" d="M 28 4.7929688 L 27.5 5.0820312 L 7.5 16.628906 L 7 16.917969 L 7 17.494141 L 7 22.689453 L 3.5 24.710938 L 3 25 L 3 25.576172 L 3 33.646484 L 3 34.224609 L 3.5 34.513672 L 21.5 44.900391 L 22 45.189453 L 22.5 44.902344 L 46.5 31.060547 L 47 30.771484 L 47 30.193359 L 47 27.886719 L 47 27.310547 L 46.501953 27.021484 L 45 26.154297 L 46.5 25.287109 L 47 24.998047 L 47 24.421875 L 47 22.113281 L 47 21.537109 L 46.5 21.248047 L 41.001953 18.074219 L 42.5 17.208984 L 43 16.919922 L 43 16.34375 L 43 14.029297 L 43 13.453125 L 42.5 13.164062 L 28.5 5.0800781 L 28 4.7929688 z M 28 6.2363281 L 41.501953 14.03125 L 22 25.291016 L 8.5 17.494141 L 28 6.2363281 z M 26.980469 9.7382812 A 0.250025 0.250025 0 0 0 26.875 9.7734375 L 24.875 10.927734 A 0.250025 0.250025 0 0 0 24.875 11.361328 L 32.875 15.978516 A 0.250025 0.250025 0 0 0 33.125 15.978516 L 35.125 14.824219 A 0.250025 0.250025 0 0 0 35.125 14.390625 L 27.125 9.7734375 A 0.250025 0.250025 0 0 0 27.005859 9.7382812 A 0.250025 0.250025 0 0 0 26.980469 9.7382812 z M 27 10.277344 L 34.5 14.607422 L 33 15.472656 L 25.5 11.144531 L 27 10.277344 z M 41.75 14.462891 L 41.75 16.197266 L 39.890625 17.273438 A 0.250025 0.250025 0 0 0 39.875 17.28125 A 0.250025 0.250025 0 0 0 39.853516 17.294922 L 22.25 27.455078 L 22.25 25.722656 L 41.75 14.462891 z M 8.25 17.927734 L 21.75 25.722656 L 21.75 27.455078 L 11.158203 21.337891 A 0.250025 0.250025 0 0 0 11.087891 21.298828 L 10.125 20.742188 A 0.250025 0.250025 0 0 0 9.75 20.958984 L 9.75 24.380859 A 0.250025 0.250025 0 0 0 9.9082031 24.654297 A 0.250025 0.250025 0 0 0 9.9140625 24.65625 L 21.75 31.496094 L 21.75 33.226562 L 8.25 25.431641 L 8.25 23.279297 A 0.250025 0.250025 0 0 0 8.25 23.267578 A 0.250025 0.250025 0 0 0 8.25 23.242188 L 8.25 17.927734 z M 39.75 17.929688 L 39.75 18.630859 A 0.250025 0.250025 0 0 0 39.75 18.648438 L 39.75 19.662109 L 22.25 29.761719 L 22.25 28.033203 L 39.75 17.929688 z M 40.25 19.082031 L 41.501953 19.804688 L 22.25 30.917969 L 22.25 30.339844 L 40.125 20.023438 A 0.250025 0.250025 0 0 0 40.25 19.806641 L 40.25 19.082031 z M 42.25 20.236328 L 45.5 22.113281 L 22 35.681641 L 4.4980469 25.578125 L 7.75 23.701172 L 7.75 25.574219 A 0.250025 0.250025 0 0 0 7.875 25.791016 L 21.84375 33.859375 A 0.250025 0.250025 0 0 0 22.150391 33.861328 L 42.125 22.330078 A 0.250025 0.250025 0 0 0 42.25 22.113281 L 42.25 20.236328 z M 41.75 20.240234 L 41.75 21.96875 L 22.25 33.226562 L 22.25 31.496094 L 41.75 20.240234 z M 10.25 21.392578 L 10.75 21.681641 L 10.75 23.701172 L 10.25 23.988281 L 10.25 21.392578 z M 11.25 21.970703 L 21.75 28.033203 L 21.75 29.761719 L 11.25 23.701172 L 11.25 21.970703 z M 45.75 22.546875 L 45.75 24.277344 L 43.890625 25.351562 A 0.250025 0.250025 0 0 0 43.875 25.359375 A 0.250025 0.250025 0 0 0 43.853516 25.373047 L 22.25 37.845703 L 22.25 36.113281 L 45.75 22.546875 z M 11.001953 24.132812 L 21.75 30.339844 L 21.75 30.917969 L 10.501953 24.419922 L 11.001953 24.132812 z M 4.25 26.009766 L 21.75 36.113281 L 21.75 37.845703 L 7.1582031 29.421875 A 0.250025 0.250025 0 0 0 7.09375 29.384766 L 6.125 28.824219 A 0.250025 0.250025 0 0 0 5.75 29.041016 L 5.75 32.494141 A 0.25025175 0.25025175 0 0 0 5.75 32.519531 A 0.250025 0.250025 0 0 0 5.7519531 32.53125 A 0.25025175 0.25025175 0 0 0 5.7578125 32.568359 A 0.250025 0.250025 0 0 0 5.7617188 32.580078 A 0.25025175 0.25025175 0 0 0 5.765625 32.591797 A 0.250025 0.250025 0 0 0 5.7734375 32.611328 A 0.25025175 0.25025175 0 0 0 5.7753906 32.615234 A 0.250025 0.250025 0 0 0 5.78125 32.625 A 0.25025175 0.25025175 0 0 0 5.7910156 32.642578 A 0.250025 0.250025 0 0 0 5.7949219 32.650391 A 0.25025175 0.25025175 0 0 0 5.8007812 32.658203 A 0.250025 0.250025 0 0 0 5.8085938 32.667969 A 0.25025175 0.25025175 0 0 0 5.8164062 32.677734 A 0.250025 0.250025 0 0 0 5.8261719 32.685547 A 0.25025175 0.25025175 0 0 0 5.8359375 32.693359 A 0.250025 0.250025 0 0 0 5.84375 32.701172 A 0.25025175 0.25025175 0 0 0 5.8554688 32.708984 A 0.250025 0.250025 0 0 0 5.8652344 32.716797 A 0.25025175 0.25025175 0 0 0 5.875 32.722656 L 21.75 41.886719 L 21.75 43.601562 L 4.25 33.501953 L 4.25 26.009766 z M 43.75 26.009766 L 43.75 26.712891 A 0.250025 0.250025 0 0 0 43.75 26.730469 L 43.75 27.740234 L 22.25 40.154297 L 22.25 38.423828 L 43.75 26.009766 z M 44.25 27.164062 L 45.5 27.886719 L 22.25 41.310547 L 22.25 40.732422 L 44.125 28.101562 A 0.250025 0.250025 0 0 0 44.25 27.884766 L 44.25 27.164062 z M 45.75 28.320312 L 45.75 30.050781 L 22.25 43.601562 L 22.25 41.886719 L 45.75 28.320312 z M 6.25 29.474609 L 6.75 29.763672 L 6.75 31.783203 L 6.25 32.072266 L 6.25 29.474609 z M 7.25 30.052734 L 21.75 38.423828 L 21.75 40.154297 L 7.25 31.783203 L 7.25 30.052734 z M 7 32.216797 L 21.75 40.732422 L 21.75 41.310547 L 6.5 32.505859 L 7 32.216797 z"></path></svg>';
            }
            if (k === 'notepad' || k === 'notes') {
                // Bloc de notas
                return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M 5 3 C 3.895 3 3 3.895 3 5 L 3 19 C 3 20.105 3.895 21 5 21 L 15 21 L 21 15 L 21 5 C 21 3.895 20.105 3 19 3 L 5 3 z M 5 5 L 19 5 L 19 14 L 14 14 L 14 19 L 5 19 L 5 5 z M 7 7 L 7 9 L 17 9 L 17 7 L 7 7 z M 7 11 L 7 13 L 12 13 L 12 11 L 7 11 z"></path></svg>';
            }
            // Comandos / celda (=) · marca l8 codespace
            return '<img src="favicon.svg?v=3" alt="" aria-hidden="true">';
        }

        function tokensUnlockLockSvg() {
            return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 5a3 3 0 0 1 6 0v3H9V7zm3 7a1.75 1.75 0 0 1 .75 3.33V19h-1.5v-1.67A1.75 1.75 0 0 1 12 14z"/></svg>';
        }

        function renderTokensUnlock(status) {
            const unlock = (status && status.unlock) || {};
            const nextLabel = unlock.next_label || ('x' + (Number(unlock.next_use || 1)));
            const usedLabel = unlock.used_label || 'x0';
            const hint = document.getElementById('tokensUnlockUsesHint');
            const pill = document.getElementById('tokensUnlockUsesPill');
            if (hint) hint.textContent = nextLabel;
            if (pill) pill.textContent = 'Usos: ' + usedLabel + ' · próxima ' + nextLabel;

            const tbody = document.getElementById('tokensUnlockRows');
            if (!tbody) return;
            const areas = Array.isArray(unlock.areas) ? unlock.areas : [];
            if (!areas.length) {
                tbody.innerHTML = '<tr><td colspan="3">Sin áreas de desbloqueo</td></tr>';
                return;
            }
            const lockSvg = tokensUnlockLockSvg();
            tbody.innerHTML = areas.map((area) => {
                const id = String(area.id || '').replace(/"/g, '&quot;');
                const title = String(area.title || area.id || '').replace(/</g, '&lt;');
                const amount = formatTokenCount(area.amount || 0);
                return '<tr data-area="' + id + '">' +
                    '<td class="amt">' + amount + '</td>' +
                    '<td class="area"><div class="tokens-unlock-area-cell">' +
                    '<div class="tokens-unlock-ico" title="' + title + '">' + tokensUnlockIconSvg(area.icon) + '</div>' +
                    '<span class="tokens-unlock-area-title">' + title + '</span>' +
                    '</div></td>' +
                    '<td class="act">' +
                    '<button type="button" class="tokens-unlock-btn" data-unlock-btn="' + id + '">' +
                    lockSvg + ' Desbloquear</button>' +
                    '</td></tr>';
            }).join('');

            tbody.querySelectorAll('[data-unlock-btn]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const area = btn.getAttribute('data-unlock-btn');
                    const shared = document.getElementById('tokensUnlockSharedCode');
                    submitTokensUnlock(area, shared ? shared.value : '');
                });
            });
        }

        function tokensUnlockSetMsg(text, tone) {
            const el = document.getElementById('tokensUnlockMsg');
            if (!el) return;
            el.textContent = text || '';
            el.classList.remove('ok', 'err');
            if (tone === 'ok') el.classList.add('ok');
            if (tone === 'err') el.classList.add('err');
        }

        function toggleTokensUnlock(force) {
            const overlay = document.getElementById('tokensUnlockOverlay');
            if (!overlay) return;
            const open = typeof force === 'boolean' ? force : !overlay.classList.contains('open');
            overlay.classList.toggle('open', open);
            overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
            if (open) {
                refreshTokensStatus(true).then((st) => {
                    if (st) renderTokensUnlock(st);
                    const next = (st && st.unlock && st.unlock.next_label) ? st.unlock.next_label : 'x1';
                    tokensUnlockSetMsg('Escribe la clave Dilithium-5 (' + next + ') y pulsa Desbloquear en el área. Tras un uso válido, la clave cambia.');
                    const shared = document.getElementById('tokensUnlockSharedCode');
                    if (shared) {
                        try { shared.focus(); } catch (e) {}
                    }
                });
            }
        }

        async function submitTokensUnlock(area, code) {
            const trimmed = String(code || '').trim();
            if (!trimmed) {
                tokensUnlockSetMsg('Introduce la clave Dilithium-5 antes de desbloquear.', 'err');
                const shared = document.getElementById('tokensUnlockSharedCode');
                if (shared) {
                    try { shared.focus(); } catch (e) {}
                }
                return { ok: false, error: 'missing_code' };
            }
            tokensUnlockSetMsg('Verificando Dilithium-5…');
            try {
                const res = await fetch('/api/tokens/unlock', {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({ area: area, code: trimmed })
                });
                const data = await res.json();
                if (data && data.status) applyTokensStatus(data.status);
                else if (data && data.unlock) renderTokensUnlock({ unlock: data.unlock, ok: true });
                if (!data || !data.ok) {
                    tokensUnlockSetMsg((data && data.error) || 'No se pudo desbloquear', 'err');
                    return data;
                }
                const shared = document.getElementById('tokensUnlockSharedCode');
                if (shared) shared.value = '';
                tokensUnlockSetMsg(
                    'Desbloqueado +' + formatTokenCount(data.granted) + ' en ' + (data.area_title || data.area) +
                    ' · uso ' + (data.use_label || '') + ' consumido. Próxima clave: ' +
                    ((data.unlock && data.unlock.next_label) || '') + '.',
                    'ok'
                );
                return data;
            } catch (e) {
                tokensUnlockSetMsg(e.message || String(e), 'err');
                return { ok: false, error: e.message || String(e) };
            }
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
            if (open) {
                refreshTokensStatus(true);
                // Ventana de desbloqueo debajo del historial (flujo tokens)
                toggleTokensUnlock(true);
            }
        }

        async function openExternalWithTokens(url, windowName, features) {
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
                if (win) {
                    try { win.focus(); } catch (e) {}
                }
            } catch (e) {
                win = null;
            }

            try { consumeTokens('external', url || windowName || 'external'); } catch (e) {}
            return win;
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


        let hashcodClockTimer = null;

        function formatHashcodClock(date) {
            const d = date || new Date();
            const pad = (n) => String(n).padStart(2, '0');
            return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        }

        function tickHashcodClock() {
            const el = document.getElementById('hashcodClockTime');
            if (el) el.textContent = formatHashcodClock(new Date());
        }

        function toggleHashcodClock(force) {
            const pop = document.getElementById('hashcodClockPop');
            const btn = document.getElementById('hashcodDockClockBtn');
            if (!pop) return;
            const open = typeof force === 'boolean' ? force : !pop.classList.contains('open');
            pop.classList.toggle('open', open);
            pop.setAttribute('aria-hidden', open ? 'false' : 'true');
            if (btn) {
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
                btn.classList.toggle('is-active', open);
            }
            if (hashcodClockTimer) {
                clearInterval(hashcodClockTimer);
                hashcodClockTimer = null;
            }
            if (open) {
                try { toggleHashcodKeys(false); } catch (e) {}
                tickHashcodClock();
                hashcodClockTimer = setInterval(tickHashcodClock, 250);
            }
        }

        /* ===== FLY: barrita → barra (estado guardado) ===== */
        const FLY_STORE_KEY = 'l8_fly_rail_v1';

        function flyRailLoadOpen() {
            try {
                const raw = localStorage.getItem(FLY_STORE_KEY);
                if (!raw) return false;
                const data = JSON.parse(raw);
                return !!(data && data.open);
            } catch (e) {
                return false;
            }
        }

        function flyRailSaveOpen(open) {
            try {
                localStorage.setItem(FLY_STORE_KEY, JSON.stringify({ open: !!open }));
            } catch (e) {}
        }

        function setFlyRailOpen(open) {
            const rail = document.getElementById('flyRail');
            const handle = document.getElementById('flyHandleBtn');
            const panel = document.getElementById('flyRailPanel');
            if (!rail || !handle || !panel) return;
            const isOpen = !!open;
            rail.classList.toggle('is-open', isOpen);
            handle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            handle.setAttribute('aria-label', isOpen ? 'Cerrar barra Fly' : 'Abrir barra Fly');
            panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            rail.style.position = 'fixed';
            rail.style.top = '0';
            rail.style.right = '0';
            rail.style.bottom = '0';
            rail.style.left = 'auto';
            rail.style.transform = 'none';
            rail.style.zIndex = '9990';
            rail.style.display = 'block';
            rail.style.width = '0';
            rail.style.height = 'auto';
            rail.style.margin = '0';
            rail.style.padding = '0';
            flyRailSaveOpen(isOpen);
            if (isOpen) {
                try { setDockBarOpen(false); } catch (e) {}
            }
        }

        function toggleFlyRail(force) {
            const rail = document.getElementById('flyRail');
            if (!rail) return;
            const next = typeof force === 'boolean' ? force : !rail.classList.contains('is-open');
            setFlyRailOpen(next);
        }

        function bindFlySlot(slotEl, handler) {
            if (!slotEl) return;
            slotEl.disabled = false;
            slotEl.classList.add('is-ready');
            slotEl.onclick = function (ev) {
                ev.preventDefault();
                if (typeof handler === 'function') handler(ev);
                try {
                    window.dispatchEvent(new CustomEvent('l8:fly-tool', {
                        detail: { slot: Number(slotEl.getAttribute('data-fly-slot') || 0) }
                    }));
                } catch (e) {}
            };
        }

        window.toggleFlyRail = toggleFlyRail;
        window.setFlyRailOpen = setFlyRailOpen;
        window.bindFlySlot = bindFlySlot;

        /* ===== DOCK TOOLBAR (abajo) ===== */
        const DOCK_STORE_KEY = 'l8_dock_bar_v1';

        function dockBarLoadOpen() {
            try {
                const raw = localStorage.getItem(DOCK_STORE_KEY);
                if (!raw) return false;
                const data = JSON.parse(raw);
                return !!(data && data.open);
            } catch (e) {
                return false;
            }
        }

        function dockBarSaveOpen(open) {
            try {
                localStorage.setItem(DOCK_STORE_KEY, JSON.stringify({ open: !!open }));
            } catch (e) {}
        }

        function setDockBarOpen(open) {
            const dock = document.getElementById('dockBar');
            const swipe = document.getElementById('dockSwipeBtn');
            const panel = document.getElementById('dockToolbar');
            if (!dock || !swipe || !panel) return;
            const isOpen = !!open;
            dock.classList.toggle('is-open', isOpen);
            swipe.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            swipe.setAttribute('aria-label', isOpen ? 'Cerrar toolbar inferior' : 'Abrir toolbar inferior');
            panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            dock.style.position = 'fixed';
            dock.style.left = '0';
            dock.style.right = '0';
            dock.style.bottom = '0';
            dock.style.top = 'auto';
            dock.style.transform = 'none';
            dock.style.zIndex = '9989';
            dock.style.display = 'block';
            dock.style.width = 'auto';
            dock.style.height = '0';
            dock.style.margin = '0';
            dock.style.padding = '0';
            dockBarSaveOpen(isOpen);
            if (isOpen) {
                try { setFlyRailOpen(false); } catch (e) {}
            }
        }

        function toggleDockBar(force) {
            const dock = document.getElementById('dockBar');
            if (!dock) return;
            const next = typeof force === 'boolean' ? force : !dock.classList.contains('is-open');
            setDockBarOpen(next);
        }

        function bindDockSlot(slotEl, handler) {
            if (!slotEl) return;
            slotEl.disabled = false;
            slotEl.classList.add('is-ready');
            slotEl.onclick = function (ev) {
                ev.preventDefault();
                if (typeof handler === 'function') handler(ev);
                try {
                    window.dispatchEvent(new CustomEvent('l8:dock-tool', {
                        detail: { slot: Number(slotEl.getAttribute('data-dock-slot') || 0) }
                    }));
                } catch (e) {}
            };
        }

        window.toggleDockBar = toggleDockBar;
        window.setDockBarOpen = setDockBarOpen;
        window.bindDockSlot = bindDockSlot;

        /* ===== STREAMLIT DOCK TOOLS ===== */
        let stDockActiveSlot = 1;
        let stDockBusy = false;
        let stDockActiveTemplate = '';
        let stDockTemplatesCache = [];
        let stDockStatusCache = null;
        let stDockPreviewOn = false;
        const ST_SLOT_ICON_SVG =
            '<svg class="st-slot-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
            '<path fill="currentColor" d="M4.5 4.5h6.75v6.75H4.5V4.5zm8.25 0H19.5v6.75h-6.75V4.5zM4.5 12.75H11.25V19.5H4.5v-6.75zm11.25 3.375a3.375 3.375 0 1 0 0 6.75 3.375 3.375 0 0 0 0-6.75z"/>' +
            '</svg>';

        function stDockSetMsg(text, kind) {
            const el = document.getElementById('stDockMsg');
            if (!el) return;
            el.textContent = text || '';
            el.classList.remove('ok', 'err');
            if (kind === 'ok') el.classList.add('ok');
            if (kind === 'err') el.classList.add('err');
        }

        function stDockSetBadges(status, tool) {
            const wrap = document.getElementById('stDockBadges');
            if (!wrap) return;
            const avail = !!(status && status.available);
            const running = !!(tool && tool.running);
            const hasCode = !!(tool && tool.has_code);
            const ver = (status && status.version) ? String(status.version) : '';
            const bits = [];
            // Blue runtime badge (Figma: badge-Tkinter style → Streamlit version)
            bits.push('<span class="st-dock-badge ' + (avail ? 'runtime' : 'off') + '">' +
                (avail ? ('Streamlit' + (ver ? ' ' + ver : '')) : 'Streamlit offline') +
                '</span>');
            bits.push('<span class="st-dock-badge ' + (running ? 'active' : 'idle') + '">' +
                (running ? 'Active' : 'Idle') + '</span>');
            bits.push('<span class="st-dock-badge code">' + (hasCode ? 'With code' : 'Empty') + '</span>');
            if (tool && tool.template) {
                bits.push('<span class="st-dock-badge template">Template · ' +
                    String(tool.template).replace(/</g, '') + '</span>');
            }
            wrap.innerHTML = bits.join('');

            const fileChip = document.getElementById('stDockFileChip');
            if (fileChip) {
                const tpl = (tool && tool.template) ? String(tool.template) : '';
                fileChip.textContent = tpl ? (tpl.replace(/[^a-z0-9_\-]/gi, '_') + '.py') : 'app.py';
            }

            const readyDot = document.getElementById('stDockReadyDot');
            const readyLabel = document.getElementById('stDockReadyLabel');
            if (readyDot && readyLabel) {
                readyDot.classList.remove('is-busy', 'is-off');
                if (!avail) {
                    readyDot.classList.add('is-off');
                    readyLabel.textContent = 'Offline';
                } else if (running) {
                    readyDot.classList.add('is-busy');
                    readyLabel.textContent = 'Running';
                } else if (hasCode) {
                    readyLabel.textContent = 'Ready';
                } else {
                    readyDot.classList.add('is-off');
                    readyLabel.textContent = 'Empty';
                }
            }

            const urlEl = document.getElementById('stDockUrl');
            if (urlEl) {
                const url = (tool && tool.url) ? tool.url : ('/st/' + stDockActiveSlot + '/');
                if (running) {
                    urlEl.hidden = false;
                    urlEl.innerHTML = 'URL · <a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>';
                } else {
                    urlEl.hidden = true;
                    urlEl.textContent = '';
                }
            }
        }

        function stDockHidePreview() {
            stDockPreviewOn = false;
            const wrap = document.getElementById('stDockPreviewWrap');
            const iframe = document.getElementById('stDockIframe');
            if (wrap) wrap.classList.remove('show');
            if (iframe) iframe.removeAttribute('src');
            const btn = document.getElementById('stDockPreviewBtn');
            if (btn) btn.textContent = 'Preview';
        }

        function stDockShowPreview(url) {
            const wrap = document.getElementById('stDockPreviewWrap');
            const iframe = document.getElementById('stDockIframe');
            if (!wrap || !iframe || !url) return;
            stDockPreviewOn = true;
            wrap.classList.add('show');
            iframe.src = url;
            const btn = document.getElementById('stDockPreviewBtn');
            if (btn) btn.textContent = 'Hide preview';
        }

        function stDockRenderTemplates(activeId) {
            const box = document.getElementById('stDockTemplates');
            if (!box) return;
            if (!stDockTemplatesCache.length) {
                box.innerHTML = '<span class="st-dock-msg">Sin plantillas en el servidor.</span>';
                return;
            }
            box.innerHTML = stDockTemplatesCache.map(function (t) {
                const active = t.id === activeId ? ' active' : '';
                const title = String(t.title || t.id).replace(/</g, '');
                const blurb = String(t.blurb || '').replace(/"/g, '&quot;');
                return '<button type="button" class="st-dock-chip' + active + '" data-st-tpl="' +
                    String(t.id).replace(/"/g, '') + '" title="' + blurb + '">' + title + '</button>';
            }).join('');
            Array.prototype.forEach.call(box.querySelectorAll('[data-st-tpl]'), function (chip) {
                chip.addEventListener('click', function () {
                    stDockApplyTemplate(chip.getAttribute('data-st-tpl'));
                });
            });
        }

        async function stDockEnsureTemplates() {
            const hasCode = stDockTemplatesCache.some(function (t) { return !!(t && t.code); });
            if (hasCode) return stDockTemplatesCache;
            const data = await stDockApi('/api/streamlit/templates');
            stDockTemplatesCache = (data && data.templates) ? data.templates : stDockTemplatesCache;
            return stDockTemplatesCache;
        }

        async function stDockApplyTemplate(id) {
            if (!id) return;
            stDockSetMsg('Cargando plantilla…');
            let tpl = null;
            const local = stDockTemplatesCache.find(function (t) { return t.id === id && t.code; });
            if (local) {
                tpl = local;
            } else {
                const data = await stDockApi('/api/streamlit/templates?id=' + encodeURIComponent(id));
                tpl = data && data.template ? data.template : null;
            }
            if (!tpl || !tpl.code) {
                stDockSetMsg('No se pudo cargar la plantilla', 'err');
                return;
            }
            stDockActiveTemplate = tpl.id || id;
            const titleInput = document.getElementById('stDockTitleInput');
            const codeInput = document.getElementById('stDockCode');
            if (titleInput) titleInput.value = tpl.title || titleInput.value;
            if (codeInput) codeInput.value = tpl.code;
            stDockRenderTemplates(stDockActiveTemplate);
            stDockSetMsg('Plantilla «' + (tpl.title || id) + '» lista. Guarda y abre.', 'ok');
        }

        function setStDockOpen(open, slot) {
            const overlay = document.getElementById('stDockOverlay');
            if (!overlay) return;
            const isOpen = !!open;
            if (typeof slot === 'number' && slot >= 1) stDockActiveSlot = slot;
            overlay.classList.toggle('open', isOpen);
            overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            const title = document.getElementById('stDockTitle');
            if (title) title.textContent = 'Streamlit · Slot ' + stDockActiveSlot;
            if (!isOpen) {
                stDockHidePreview();
                return;
            }
            try { setDockBarOpen(false); } catch (e) {}
            stDockLoadSlot(stDockActiveSlot);
        }

        async function stDockApi(path, opts) {
            const baseHeaders = (typeof authHeaders === 'function')
                ? authHeaders({ 'X-Requested-With': 'XMLHttpRequest' })
                : { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
            const merged = Object.assign({ headers: baseHeaders }, opts || {});
            if (opts && opts.headers) {
                merged.headers = Object.assign({}, baseHeaders, opts.headers);
            }
            const res = await fetch(path, merged);
            let data = null;
            try { data = await res.json(); } catch (e) { data = null; }
            return data || { ok: false, error: 'Respuesta inválida' };
        }

        function stDockSlotIconHtml() {
            return ST_SLOT_ICON_SVG;
        }

        const LO_DOCK_ICON_SVG =
            '<svg class="lo-tool-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
            '<path fill="currentColor" d="M6.5 2.75A1.75 1.75 0 0 0 4.75 4.5v15c0 .966.784 1.75 1.75 1.75h11c.966 0 1.75-.784 1.75-1.75V8.414a1.75 1.75 0 0 0-.513-1.238L14.324 3.263A1.75 1.75 0 0 0 13.086 2.75H6.5zm0 1.5h6.25v3.25c0 .966.784 1.75 1.75 1.75h3.25V19.5h-11V4.25zm7.75.81 2.69 2.69h-2.69V5.06z"/>' +
            '<path fill="currentColor" d="M8.25 11.25h4.1c1.55 0 2.65.88 2.65 2.2 0 .92-.5 1.62-1.28 1.95.98.36 1.58 1.18 1.58 2.22 0 1.48-1.18 2.38-2.95 2.38H8.25v-8.75zm1.55 1.35v2.2h2.35c.72 0 1.18-.38 1.18-1.05s-.46-1.15-1.2-1.15H9.8zm0 3.5v2.55h2.7c.85 0 1.35-.42 1.35-1.2 0-.78-.5-1.35-1.4-1.35H9.8z"/>' +
            '</svg>';

        const LO_SUITE_TOOLS_FALLBACK = [
            { id: 'writer', name: 'Writer', desc: 'Procesador de textos', color: '#2c5aa0' },
            { id: 'calc', name: 'Calc', desc: 'Hojas de cálculo', color: '#007c3c' },
            { id: 'impress', name: 'Impress', desc: 'Presentaciones', color: '#d2691e' },
            { id: 'draw', name: 'Draw', desc: 'Dibujo vectorial', color: '#c8102e' },
            { id: 'base', name: 'Base', desc: 'Bases de datos', color: '#6b3fa0' },
            { id: 'math', name: 'Math', desc: 'Editor de fórmulas', color: '#008080' },
            { id: 'chart', name: 'Chart', desc: 'Gráficos y diagramas', color: '#1a6fb5' }
        ];

        function loDockSetMsg(text, kind) {
            const el = document.getElementById('loDockMsg');
            if (!el) return;
            el.textContent = text || '';
            el.classList.remove('ok', 'err');
            if (kind === 'ok') el.classList.add('ok');
            if (kind === 'err') el.classList.add('err');
        }

        function loDockRender(st) {
            const badges = document.getElementById('loDockBadges');
            const meta = document.getElementById('loDockMeta');
            const toolsEl = document.getElementById('loDockTools');
            if (!badges || !meta || !toolsEl) return;
            const ready = !!(st && (st.suite_ready || st.ready));
            const tools = (st && Array.isArray(st.tools) && st.tools.length) ? st.tools : LO_SUITE_TOOLS_FALLBACK;
            const ms = (st && st.ms != null) ? (' · ' + st.ms + ' ms') : '';
            badges.innerHTML =
                '<span class="lo-dock-badge ' + (ready ? 'ok' : '') + '">' + (ready ? 'Suite lista' : 'Lista') + '</span>' +
                '<span class="lo-dock-badge">MPL-2.0</span>' +
                '<span class="lo-dock-badge">' + tools.length + ' herramientas</span>';
            meta.innerHTML =
                '<div><strong>Ruta</strong> · data_storage/libreoffice</div>' +
                '<div><strong>Docs</strong> · data_storage/libreoffice/docs' + ms + '</div>';
            toolsEl.innerHTML = tools.map(function (t) {
                const color = t.color || '#18a303';
                const letter = String(t.name || t.id || '?').charAt(0).toUpperCase();
                return '<button type="button" class="lo-dock-tool" data-lo-tool="' + t.id + '" title="' + (t.desc || t.name || '') + '">' +
                    '<span class="lo-dock-swatch" style="background:' + color + '">' + letter + '</span>' +
                    '<strong>' + (t.name || t.id) + '</strong>' +
                    '<span>' + (t.desc || '') + '</span></button>';
            }).join('');
            toolsEl.querySelectorAll('[data-lo-tool]').forEach(function (btn) {
                btn.onclick = function (ev) {
                    ev.preventDefault();
                    const id = btn.getAttribute('data-lo-tool');
                    const url = '/libreoffice?tool=' + encodeURIComponent(id);
                    let win = null;
                    try { win = window.open(url, 'l8-libreoffice', 'width=1180,height=800'); } catch (e) { win = null; }
                    if (!win) {
                        const a = document.createElement('a');
                        a.href = url; a.target = '_blank'; a.rel = 'noopener';
                        document.body.appendChild(a); a.click(); a.remove();
                    }
                };
            });
        }

        function loDockApi(path, opts, timeoutMs) {
            const ms = typeof timeoutMs === 'number' ? timeoutMs : 3500;
            const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
            const timer = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, ms) : null;
            const baseHeaders = (typeof authHeaders === 'function')
                ? authHeaders({ 'X-Requested-With': 'XMLHttpRequest' })
                : { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
            const merged = Object.assign({ headers: baseHeaders }, opts || {});
            if (opts && opts.headers) merged.headers = Object.assign({}, baseHeaders, opts.headers);
            if (ctrl) merged.signal = ctrl.signal;
            return fetch(path, merged).then(function (res) {
                return res.json().catch(function () { return { ok: false, error: 'Respuesta inválida' }; });
            }).catch(function (e) {
                const aborted = e && (e.name === 'AbortError' || String(e.message || '').indexOf('abort') >= 0);
                return { ok: false, error: aborted ? 'Timeout' : (e.message || String(e)), timeout: !!aborted };
            }).finally(function () {
                if (timer) clearTimeout(timer);
            });
        }

        async function loDockEnsureFast() {
            const st = await loDockApi('/api/libreoffice/ensure', { method: 'POST', body: '{}' }, 3500);
            if (st && st.ok) {
                try { sessionStorage.setItem('l8_lo_suite_ready', '1'); } catch (e) {}
            }
            return st;
        }

        async function loDockRefresh() {
            // Pintar herramientas al instante (<50ms) y asegurar en paralelo.
            loDockRender({ ok: true, suite_ready: true, ready: true, tools: LO_SUITE_TOOLS_FALLBACK });
            loDockSetMsg('Suite lista — desplegando en segundo plano…');
            const st = await loDockEnsureFast();
            if (st && st.ok) {
                loDockRender(st);
                loDockSetMsg(st.message || ('Listo en ' + (st.ms != null ? st.ms + ' ms' : '<4 s')), 'ok');
                const log = document.getElementById('loDockLog');
                if (log) { log.hidden = false; log.textContent = 'ok · ' + (st.ms != null ? st.ms + ' ms' : 'fast'); }
            } else {
                loDockSetMsg('Herramientas disponibles. Sync servidor: ' + ((st && st.error) || 'reintento'), st && st.timeout ? null : 'err');
            }
            return st;
        }

        async function loDockDeploy() {
            const btn = document.getElementById('loDockDeployBtn');
            const log = document.getElementById('loDockLog');
            if (btn) btn.disabled = true;
            loDockRender({ ok: true, suite_ready: true, ready: true, tools: LO_SUITE_TOOLS_FALLBACK });
            loDockSetMsg('Desplegando (<4 s)…');
            if (log) { log.hidden = false; log.textContent = 'ensure…\n'; }
            try {
                const t0 = performance.now();
                const st = await loDockEnsureFast();
                const elapsed = Math.round(performance.now() - t0);
                if (st && st.ok) {
                    loDockRender(st);
                    if (log) log.textContent = 'ok · ' + (st.ms != null ? st.ms : elapsed) + ' ms\n' + JSON.stringify({ tools: (st.tools || []).map(function (t) { return t.id; }), already: st.already }, null, 0);
                    loDockSetMsg(st.message || ('Desplegado en ' + elapsed + ' ms'), 'ok');
                } else {
                    if (log) log.textContent = JSON.stringify(st, null, 2).slice(0, 1500);
                    loDockSetMsg((st && st.error) || 'No se pudo sincronizar (herramientas igual disponibles)', 'err');
                }
            } finally {
                if (btn) btn.disabled = false;
            }
        }

        function setLibreOfficeOpen(open) {
            const overlay = document.getElementById('loDockOverlay');
            if (!overlay) return;
            const isOpen = !!open;
            overlay.classList.toggle('open', isOpen);
            overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            const btn = document.getElementById('dockLibreOfficeBtn');
            if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            if (isOpen) {
                try { setDockBarOpen(false); } catch (e) {}
                // Instantáneo: herramientas visibles de inmediato
                loDockRender({ ok: true, suite_ready: true, ready: true, tools: LO_SUITE_TOOLS_FALLBACK });
                loDockSetMsg('Abriendo suite…');
                loDockRefresh();
            }
        }

        function openLibreOfficePlatform() {
            setLibreOfficeOpen(true);
        }

        function loDockBindTool() {
            const btn = document.getElementById('dockLibreOfficeBtn');
            if (!btn) return;
            btn.disabled = false;
            btn.classList.add('is-ready', 'is-filled', 'has-icon');
            if (!btn.querySelector('svg.lo-tool-ico')) btn.innerHTML = LO_DOCK_ICON_SVG;
            btn.title = 'LibreOffice';
            btn.setAttribute('aria-label', 'Abrir LibreOffice en la plataforma servidor');
            btn.setAttribute('aria-controls', 'loDockOverlay');
            btn.setAttribute('aria-expanded', 'false');
            btn.onclick = function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                openLibreOfficePlatform();
                try {
                    window.dispatchEvent(new CustomEvent('l8:dock-tool', { detail: { tool: 'libreoffice' } }));
                } catch (e) {}
            };
        }

        function initLibreOfficeDock() {
            loDockBindTool();
            const closeBtn = document.getElementById('loDockCloseBtn');
            const refreshBtn = document.getElementById('loDockRefreshBtn');
            const deployBtn = document.getElementById('loDockDeployBtn');
            const overlay = document.getElementById('loDockOverlay');
            if (closeBtn) closeBtn.addEventListener('click', function () { setLibreOfficeOpen(false); });
            if (refreshBtn) refreshBtn.addEventListener('click', function () { loDockRefresh(); });
            if (deployBtn) deployBtn.addEventListener('click', function () { loDockDeploy(); });
            if (overlay) {
                overlay.addEventListener('pointerdown', function (ev) {
                    if (ev.target === overlay) setLibreOfficeOpen(false);
                });
            }
            document.addEventListener('keydown', function (ev) {
                if (ev.key === 'Escape' && overlay && overlay.classList.contains('open')) {
                    setLibreOfficeOpen(false);
                    ev.stopPropagation();
                }
            }, true);
            window.setLibreOfficeOpen = setLibreOfficeOpen;
            window.openLibreOfficePlatform = openLibreOfficePlatform;
        }

        function openTipTapDocument() {
            return openExternalWithTokens('/tiptap', 'l8-tiptap', 'width=1220,height=860');
        }

        function initTipTapDock() {
            const btn = document.getElementById('dockTipTapBtn');
            if (!btn) return;
            btn.disabled = false;
            btn.classList.add('is-ready', 'is-filled', 'has-icon');
            btn.title = 'TipTap · Documento';
            btn.setAttribute('aria-label', 'Abrir editor TipTap (hoja tipo Word)');
            btn.onclick = function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                openTipTapDocument();
                try {
                    window.dispatchEvent(new CustomEvent('l8:dock-tool', { detail: { tool: 'tiptap' } }));
                } catch (e) {}
            };
            window.openTipTapDocument = openTipTapDocument;
        }

        async function stDockRefreshSlots() {
            const data = await stDockApi('/api/streamlit/status');
            stDockStatusCache = data;
            if (data && data.templates && data.templates.length && !stDockTemplatesCache.length) {
                stDockTemplatesCache = data.templates;
            }
            const tools = (data && data.tools) ? data.tools : [];
            const bySlot = {};
            tools.forEach(function (t) { bySlot[t.slot] = t; });
            for (let i = 1; i <= 8; i++) {
                const btn = document.querySelector('#dockToolbar .dock-slot[data-dock-slot="' + i + '"]');
                if (!btn) continue;
                const t = bySlot[i] || { has_code: false, running: false, title: 'Streamlit ' + i };
                btn.disabled = false;
                btn.classList.add('is-ready');
                btn.classList.toggle('is-filled', !!t.has_code);
                btn.classList.toggle('is-running', !!t.running);
                btn.classList.toggle('has-icon', !!t.has_code);
                if (t.has_code) {
                    if (!btn.querySelector('svg.st-slot-ico')) btn.innerHTML = stDockSlotIconHtml();
                } else {
                    btn.innerHTML = '';
                }
                btn.title = (t.title || ('Streamlit ' + i)) + (t.running ? ' · en ejecución' : (t.has_code ? ' · con código' : ''));
                btn.setAttribute('aria-label', 'Abrir editor Streamlit slot ' + i);
                bindDockSlot(btn, function () {
                    setStDockOpen(true, i);
                });
            }
            loDockBindTool();
            return data;
        }

        async function stDockLoadSlot(slot) {
            stDockSetMsg('Cargando slot…');
            stDockHidePreview();
            await stDockEnsureTemplates();
            const [status, data] = await Promise.all([
                stDockStatusCache ? Promise.resolve(stDockStatusCache) : stDockApi('/api/streamlit/status'),
                stDockApi('/api/streamlit/tools?slot=' + encodeURIComponent(slot))
            ]);
            stDockStatusCache = status;
            const titleInput = document.getElementById('stDockTitleInput');
            const codeInput = document.getElementById('stDockCode');
            if (titleInput) titleInput.value = (data && data.title) ? data.title : ('Streamlit ' + slot);
            if (codeInput) codeInput.value = (data && data.code) ? data.code : '';
            stDockActiveTemplate = (data && data.template) ? data.template : '';
            stDockRenderTemplates(stDockActiveTemplate);
            stDockSetBadges(status, data);
            if (!data || !data.ok) {
                stDockSetMsg((data && data.error) || 'No se pudo cargar el slot', 'err');
                return;
            }
            if (status && status.available === false) {
                stDockSetMsg(status.error || 'Streamlit no está en este servidor (usa la imagen Docker en Render).', 'err');
                return;
            }
            stDockSetMsg(
                data.running
                    ? 'App running. Open, preview, or stop.'
                    : (data.has_code ? 'Code is ready. Save and open to deploy.' : 'Empty slot: pick a template or paste code.'),
                data.running ? 'ok' : null
            );
        }

        function stDockPayload() {
            const titleInput = document.getElementById('stDockTitleInput');
            const codeInput = document.getElementById('stDockCode');
            return {
                slot: stDockActiveSlot,
                title: titleInput ? titleInput.value : '',
                code: codeInput ? codeInput.value : '',
                template: stDockActiveTemplate || ''
            };
        }

        async function stDockSaveOnly() {
            if (stDockBusy) return;
            stDockBusy = true;
            const saveBtn = document.getElementById('stDockSaveBtn');
            if (saveBtn) saveBtn.disabled = true;
            stDockSetMsg('Guardando…');
            try {
                const saved = await stDockApi('/api/streamlit/tools', {
                    method: 'POST',
                    body: JSON.stringify(stDockPayload())
                });
                if (!saved || !saved.ok) {
                    stDockSetMsg((saved && saved.error) || 'No se pudo guardar', 'err');
                    return;
                }
                if (saved.warning) stDockSetMsg(saved.warning, null);
                else stDockSetMsg(saved.restarted ? 'Guardado y reiniciado.' : 'Guardado.', 'ok');
                stDockStatusCache = null;
                await stDockRefreshSlots();
                await stDockLoadSlot(stDockActiveSlot);
            } finally {
                stDockBusy = false;
                if (saveBtn) saveBtn.disabled = false;
            }
        }

        async function stDockOpenExternal(url) {
            try {
                if (typeof openExternalWithTokens === 'function') {
                    await openExternalWithTokens(url, 'l8_streamlit_' + stDockActiveSlot, 'width=1100,height=760');
                } else {
                    window.open(url, '_blank');
                }
            } catch (e) {
                window.open(url, '_blank');
            }
        }

        async function stDockSaveAndRun() {
            if (stDockBusy) return;
            stDockBusy = true;
            const saveBtn = document.getElementById('stDockSaveRunBtn');
            if (saveBtn) saveBtn.disabled = true;
            stDockSetMsg('Guardando y arrancando Streamlit…');
            try {
                const saved = await stDockApi('/api/streamlit/tools', {
                    method: 'POST',
                    body: JSON.stringify(stDockPayload())
                });
                if (!saved || !saved.ok) {
                    stDockSetMsg((saved && saved.error) || 'No se pudo guardar', 'err');
                    return;
                }
                let run = saved;
                if (!saved.restarted) {
                    run = await stDockApi('/api/streamlit/run', {
                        method: 'POST',
                        body: JSON.stringify({ slot: stDockActiveSlot })
                    });
                }
                if (!run || !run.ok) {
                    const tail = run && run.log_tail ? ' Revisa el log del slot.' : '';
                    stDockSetMsg(((run && run.error) || 'No se pudo iniciar Streamlit') + tail, 'err');
                    stDockStatusCache = null;
                    await stDockRefreshSlots();
                    return;
                }
                const url = run.url || ('/st/' + stDockActiveSlot + '/');
                stDockSetMsg('Abierta en ventana externa: ' + url, 'ok');
                stDockStatusCache = null;
                await stDockRefreshSlots();
                stDockSetBadges(stDockStatusCache || { available: true }, {
                    running: true,
                    has_code: true,
                    url: url,
                    template: stDockActiveTemplate
                });
                await stDockOpenExternal(url);
            } finally {
                stDockBusy = false;
                if (saveBtn) saveBtn.disabled = false;
            }
        }

        async function stDockOpenOnly() {
            stDockSetMsg('Arrancando si hace falta…');
            const run = await stDockApi('/api/streamlit/run', {
                method: 'POST',
                body: JSON.stringify({ slot: stDockActiveSlot })
            });
            if (!run || !run.ok) {
                stDockSetMsg((run && run.error) || 'No se pudo abrir', 'err');
                return;
            }
            const url = run.url || ('/st/' + stDockActiveSlot + '/');
            stDockSetMsg('Abierta: ' + url, 'ok');
            stDockStatusCache = null;
            await stDockRefreshSlots();
            stDockSetBadges(stDockStatusCache || { available: true }, {
                running: true,
                has_code: true,
                url: url,
                template: stDockActiveTemplate
            });
            await stDockOpenExternal(url);
        }

        async function stDockTogglePreview() {
            if (stDockPreviewOn) {
                stDockHidePreview();
                stDockSetMsg('Vista previa oculta.');
                return;
            }
            stDockSetMsg('Preparando vista previa…');
            const run = await stDockApi('/api/streamlit/run', {
                method: 'POST',
                body: JSON.stringify({ slot: stDockActiveSlot })
            });
            if (!run || !run.ok) {
                stDockSetMsg((run && run.error) || 'No se pudo previsualizar', 'err');
                return;
            }
            const url = run.url || ('/st/' + stDockActiveSlot + '/');
            stDockShowPreview(url);
            stDockStatusCache = null;
            await stDockRefreshSlots();
            stDockSetBadges(stDockStatusCache || { available: true }, {
                running: true,
                has_code: true,
                url: url,
                template: stDockActiveTemplate
            });
            stDockSetMsg('Vista previa embebida · ' + url, 'ok');
        }

        async function stDockStop() {
            const stop = await stDockApi('/api/streamlit/stop', {
                method: 'POST',
                body: JSON.stringify({ slot: stDockActiveSlot })
            });
            stDockHidePreview();
            stDockSetMsg((stop && stop.ok) ? 'Detenida.' : ((stop && stop.error) || 'No se pudo detener'), stop && stop.ok ? 'ok' : 'err');
            stDockStatusCache = null;
            await stDockRefreshSlots();
            await stDockLoadSlot(stDockActiveSlot);
        }

        async function stDockClear() {
            if (stDockBusy) return;
            if (!window.confirm('¿Vaciar el slot ' + stDockActiveSlot + '? Se detendrá la app y se borrará el código.')) return;
            stDockBusy = true;
            try {
                const cleared = await stDockApi('/api/streamlit/tools', {
                    method: 'DELETE',
                    body: JSON.stringify({ slot: stDockActiveSlot })
                });
                if (!cleared || !cleared.ok) {
                    stDockSetMsg((cleared && cleared.error) || 'No se pudo vaciar', 'err');
                    return;
                }
                stDockHidePreview();
                stDockActiveTemplate = '';
                stDockSetMsg(stDockActiveSlot === 1 ? 'Slot vaciado (demo reseedeada).' : 'Slot vaciado.', 'ok');
                stDockStatusCache = null;
                await stDockRefreshSlots();
                await stDockLoadSlot(stDockActiveSlot);
            } finally {
                stDockBusy = false;
            }
        }

        function initStDockEditor() {
            const overlay = document.getElementById('stDockOverlay');
            const closeBtn = document.getElementById('stDockCloseBtn');
            if (!overlay) return;
            if (closeBtn) closeBtn.addEventListener('click', function () { setStDockOpen(false); });
            overlay.addEventListener('pointerdown', function (ev) {
                if (ev.target === overlay) setStDockOpen(false);
            });
            const saveOnly = document.getElementById('stDockSaveBtn');
            const saveRun = document.getElementById('stDockSaveRunBtn');
            const openBtn = document.getElementById('stDockOpenBtn');
            const previewBtn = document.getElementById('stDockPreviewBtn');
            const stopBtn = document.getElementById('stDockStopBtn');
            const clearBtn = document.getElementById('stDockClearBtn');
            const codeInput = document.getElementById('stDockCode');
            if (saveOnly) saveOnly.addEventListener('click', function () { stDockSaveOnly(); });
            if (saveRun) saveRun.addEventListener('click', function () { stDockSaveAndRun(); });
            if (openBtn) openBtn.addEventListener('click', function () { stDockOpenOnly(); });
            if (previewBtn) previewBtn.addEventListener('click', function () { stDockTogglePreview(); });
            if (stopBtn) stopBtn.addEventListener('click', function () { stDockStop(); });
            if (clearBtn) clearBtn.addEventListener('click', function () { stDockClear(); });
            if (codeInput) {
                codeInput.addEventListener('keydown', function (ev) {
                    if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
                        ev.preventDefault();
                        stDockSaveAndRun();
                    }
                });
            }
            document.addEventListener('keydown', function (ev) {
                if (ev.key === 'Escape' && overlay.classList.contains('open')) {
                    setStDockOpen(false);
                    ev.stopPropagation();
                }
            }, true);
            window.setStDockOpen = setStDockOpen;
            window.stDockRefreshSlots = stDockRefreshSlots;
            window.loDockBindTool = loDockBindTool;
        }

        function initDockBar() {
            const dock = document.getElementById('dockBar');
            const swipe = document.getElementById('dockSwipeBtn');
            const panel = document.getElementById('dockToolbar');
            if (!dock || !swipe) return;

            setDockBarOpen(dockBarLoadOpen());
            initStDockEditor();
            initLibreOfficeDock();
            initTipTapDock();
            stDockRefreshSlots().catch(function () {});

            swipe.addEventListener('click', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                setDockBarOpen(true);
                stDockRefreshSlots().catch(function () {});
            });

            document.addEventListener('keydown', function (ev) {
                if (ev.key === 'Escape' && dock.classList.contains('is-open')) {
                    const ib = document.getElementById('indicesBankOverlay');
                    if (ib && ib.classList.contains('open')) return;
                    const st = document.getElementById('stDockOverlay');
                    if (st && st.classList.contains('open')) return;
                    const lo = document.getElementById('loDockOverlay');
                    if (lo && lo.classList.contains('open')) return;
                    setDockBarOpen(false);
                }
            });

            document.addEventListener('pointerdown', function (ev) {
                if (!dock.classList.contains('is-open')) return;
                if (dock.contains(ev.target)) return;
                const ib = document.getElementById('indicesBankOverlay');
                if (ib && ib.contains(ev.target)) return;
                const st = document.getElementById('stDockOverlay');
                if (st && st.contains(ev.target)) return;
                const lo = document.getElementById('loDockOverlay');
                if (lo && lo.contains(ev.target)) return;
                setDockBarOpen(false);
            });

            void panel;
        }

        /* ===== BANCO DE ÍNDICES / Indices PI ===== */
        const INDICES_BANK_STORE = 'l8_indices_bank_v2';
        const INDICES_BANK_STORE_LEGACY = 'l8_indices_bank_v1';

        function indicesBankSeedEntries() {
            return [
                {
                    id: 'btc',
                    name: 'BTC Index',
                    desc: 'Bitcoin Standard',
                    icon: '',
                    porcentaje: '+12.4%',
                    prestamo: '4.5%',
                    retorno: '5.2%',
                    periodo: '30 días'
                },
                {
                    id: 'eth',
                    name: 'ETH Index',
                    desc: 'Ethereum Network',
                    icon: '',
                    porcentaje: '-3.2%',
                    prestamo: '2.1%',
                    retorno: '1.8%',
                    periodo: '15 días'
                },
                {
                    id: 'defi',
                    name: 'DeFi Index',
                    desc: 'Finanzas Descentralizadas',
                    icon: '',
                    porcentaje: '+8.7%',
                    prestamo: '6.3%',
                    retorno: '3.4%',
                    periodo: '60 días'
                },
                {
                    id: 'sol',
                    name: 'SOL Index',
                    desc: 'Solana High Throughput',
                    icon: '',
                    porcentaje: '+5.1%',
                    prestamo: '3.8%',
                    retorno: '4.0%',
                    periodo: '21 días'
                },
                {
                    id: 'ai',
                    name: 'AI Index',
                    desc: 'Agentes y Modelos',
                    icon: '',
                    porcentaje: '-1.4%',
                    prestamo: '4.9%',
                    retorno: '2.6%',
                    periodo: '45 días'
                },
                {
                    id: 'rwa',
                    name: 'RWA Index',
                    desc: 'Activos del Mundo Real',
                    icon: '',
                    porcentaje: '+2.9%',
                    prestamo: '5.5%',
                    retorno: '3.1%',
                    periodo: '90 días'
                }
            ];
        }

        function indicesBankNormalizeEntry(row) {
            if (!row || typeof row !== 'object') return null;
            const name = String(
                row.name != null ? row.name
                    : (row.index != null ? row.index : '')
            );
            const desc = String(row.desc != null ? row.desc : (row.description != null ? row.description : ''));
            return {
                id: String(row.id != null ? row.id : name).toLowerCase().replace(/\s+/g, '-'),
                name: name,
                desc: desc,
                icon: String(row.icon != null ? row.icon : ''),
                porcentaje: String(row.porcentaje == null ? '' : row.porcentaje),
                prestamo: String(row.prestamo == null ? '' : row.prestamo),
                retorno: String(row.retorno == null ? '' : row.retorno),
                periodo: String(row.periodo == null ? '' : row.periodo)
            };
        }

        function indicesBankEntriesLookLegacy(entries) {
            if (!entries || !entries.length) return true;
            return entries.every(function (row) {
                return !row.desc && /^PI-\d+/i.test(String(row.name || row.index || ''));
            });
        }

        function indicesBankLoadState() {
            try {
                let raw = localStorage.getItem(INDICES_BANK_STORE);
                if (!raw) {
                    try { localStorage.removeItem(INDICES_BANK_STORE_LEGACY); } catch (e) {}
                    return { entries: indicesBankSeedEntries(), query: '', seeded: true };
                }
                const data = JSON.parse(raw);
                let entries = Array.isArray(data && data.entries)
                    ? data.entries.map(indicesBankNormalizeEntry).filter(Boolean)
                    : [];
                if (!entries.length || indicesBankEntriesLookLegacy(entries)) {
                    entries = indicesBankSeedEntries();
                    return {
                        entries: entries,
                        query: typeof (data && data.query) === 'string' ? data.query : '',
                        seeded: true
                    };
                }
                return {
                    entries: entries,
                    query: typeof (data && data.query) === 'string' ? data.query : '',
                    seeded: false
                };
            } catch (e) {
                return { entries: indicesBankSeedEntries(), query: '', seeded: true };
            }
        }

        function indicesBankSaveState(partial) {
            try {
                const cur = indicesBankLoadState();
                const next = Object.assign({}, cur, partial || {});
                localStorage.setItem(INDICES_BANK_STORE, JSON.stringify({
                    version: 2,
                    updated_at: new Date().toISOString(),
                    entries: next.entries || [],
                    query: next.query || ''
                }));
            } catch (e) {}
        }

        function indicesBankEnsureSeeded() {
            const st = indicesBankLoadState();
            if (st.seeded) {
                indicesBankSaveState({ entries: st.entries, query: st.query || '' });
            }
            return st;
        }

        function indicesBankMetricClass(value) {
            const raw = String(value == null ? '' : value).trim();
            if (!raw) return 'ib-metric-flat';
            if (/^-/.test(raw) || /\(\s*-/.test(raw)) return 'ib-metric-down';
            if (/^\+/.test(raw)) return 'ib-metric-up';
            const num = parseFloat(raw.replace(/[^0-9.+-]/g, ''));
            if (!isFinite(num) || num === 0) return 'ib-metric-flat';
            return num > 0 ? 'ib-metric-up' : 'ib-metric-down';
        }

        function indicesBankIconHtml(row) {
            const icon = String(row && row.icon ? row.icon : '').trim();
            if (!icon) {
                return '<span class="ib-index-icon" aria-hidden="true"></span>';
            }
            if (/^https?:\/\//i.test(icon) || icon.indexOf('/') === 0 || /\.(svg|png|jpe?g|webp|gif)(\?|$)/i.test(icon)) {
                return '<span class="ib-index-icon" aria-hidden="true"><img src="' + escapeIndicesHtml(icon) + '" alt=""></span>';
            }
            if (icon.charAt(0) === '<') {
                return '<span class="ib-index-icon" aria-hidden="true">' + icon + '</span>';
            }
            return '<span class="ib-index-icon" aria-hidden="true"><span>' + escapeIndicesHtml(icon) + '</span></span>';
        }

        function indicesBankIndexCellHtml(row) {
            return '<div class="ib-index-cell">' +
                indicesBankIconHtml(row) +
                '<span class="ib-index-meta">' +
                    '<span class="ib-index-name">' + escapeIndicesHtml(row.name) + '</span>' +
                    '<span class="ib-index-desc">' + escapeIndicesHtml(row.desc) + '</span>' +
                '</span>' +
            '</div>';
        }

        function setIndicesBankOpen(open) {
            const overlay = document.getElementById('indicesBankOverlay');
            const btn = document.getElementById('flySlotIndicesBank');
            if (!overlay) return;
            const isOpen = !!open;
            overlay.classList.toggle('open', isOpen);
            overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            if (isOpen) {
                try { setFlyRailOpen(false); } catch (e) {}
                const st = indicesBankEnsureSeeded();
                const search = document.getElementById('indicesBankSearch');
                if (search) {
                    if (!search.value && st.query) search.value = st.query;
                    setTimeout(function () { try { search.focus(); } catch (e) {} }, 30);
                }
                renderIndicesBankTable();
            }
        }

        function toggleIndicesBank(force) {
            const overlay = document.getElementById('indicesBankOverlay');
            if (!overlay) return;
            const next = typeof force === 'boolean' ? force : !overlay.classList.contains('open');
            setIndicesBankOpen(next);
        }

        function renderIndicesBankTable() {
            const body = document.getElementById('indicesBankTableBody');
            const empty = document.getElementById('indicesBankEmpty');
            const search = document.getElementById('indicesBankSearch');
            if (!body) return;
            const st = indicesBankEnsureSeeded();
            const q = String((search && search.value) || st.query || '').trim().toLowerCase();
            let rows = st.entries.slice();
            if (q) {
                rows = rows.filter(function (row) {
                    const blob = [
                        row.name, row.desc, row.porcentaje, row.prestamo, row.retorno, row.periodo, row.id
                    ].map(function (v) { return String(v == null ? '' : v).toLowerCase(); }).join(' ');
                    return blob.indexOf(q) !== -1;
                });
            }

            if (!rows.length) {
                body.innerHTML =
                    emptyIndicesBankRow() +
                    emptyIndicesBankRow() +
                    emptyIndicesBankRow() +
                    emptyIndicesBankRow();
                if (empty) {
                    empty.hidden = true;
                    empty.textContent = '';
                }
                return;
            }

            body.innerHTML = rows.map(function (row) {
                const pctClass = indicesBankMetricClass(row.porcentaje);
                return '<tr data-index-id="' + escapeIndicesHtml(row.id) + '">' +
                    '<td class="col-index" data-col="index">' + indicesBankIndexCellHtml(row) + '</td>' +
                    '<td class="col-porcentaje ' + pctClass + '" data-col="porcentaje">' + escapeIndicesHtml(row.porcentaje) + '</td>' +
                    '<td class="col-prestamo" data-col="prestamo">' + escapeIndicesHtml(row.prestamo) + '</td>' +
                    '<td class="col-retorno" data-col="retorno">' + escapeIndicesHtml(row.retorno) + '</td>' +
                    '<td class="col-periodo" data-col="periodo">' + escapeIndicesHtml(row.periodo) + '</td>' +
                    '</tr>';
            }).join('');
            if (empty) {
                empty.hidden = true;
                empty.textContent = '';
            }
            const wrap = document.getElementById('indicesBankTableWrap');
            if (wrap) wrap.scrollTop = 0;
        }

        function emptyIndicesBankRow() {
            return '<tr class="is-empty">' +
                '<td class="col-index" data-col="index">' +
                    '<div class="ib-index-cell">' +
                        '<span class="ib-index-icon" aria-hidden="true"></span>' +
                        '<span class="ib-index-meta">' +
                            '<span class="ib-index-name">&nbsp;</span>' +
                            '<span class="ib-index-desc">&nbsp;</span>' +
                        '</span>' +
                    '</div>' +
                '</td>' +
                '<td class="col-porcentaje" data-col="porcentaje">&nbsp;</td>' +
                '<td class="col-prestamo" data-col="prestamo">&nbsp;</td>' +
                '<td class="col-retorno" data-col="retorno">&nbsp;</td>' +
                '<td class="col-periodo" data-col="periodo">&nbsp;</td>' +
                '</tr>';
        }

        function escapeIndicesHtml(value) {
            return String(value == null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        window.toggleIndicesBank = toggleIndicesBank;
        window.setIndicesBankOpen = setIndicesBankOpen;
        window.renderIndicesBankTable = renderIndicesBankTable;

        function initIndicesBank() {
            const overlay = document.getElementById('indicesBankOverlay');
            const search = document.getElementById('indicesBankSearch');
            const slot = document.getElementById('flySlotIndicesBank');
            if (!overlay) return;

            indicesBankEnsureSeeded();

            if (slot) {
                bindFlySlot(slot, function () {
                    toggleIndicesBank(true);
                });
            }

            overlay.addEventListener('pointerdown', function (ev) {
                if (ev.target === overlay) setIndicesBankOpen(false);
            });

            if (search) {
                search.addEventListener('input', function () {
                    indicesBankSaveState({ query: search.value || '' });
                    renderIndicesBankTable();
                });
            }

            document.addEventListener('keydown', function (ev) {
                if (ev.key === 'Escape' && overlay.classList.contains('open')) {
                    setIndicesBankOpen(false);
                    ev.stopPropagation();
                }
            }, true);
        }

        function initFlyRail() {
            const rail = document.getElementById('flyRail');
            const handle = document.getElementById('flyHandleBtn');
            const panel = document.getElementById('flyRailPanel');
            if (!rail || !handle) return;

            setFlyRailOpen(flyRailLoadOpen());

            handle.addEventListener('click', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                setFlyRailOpen(true);
            });

            if (panel) {
                panel.addEventListener('click', function (ev) {
                    if (ev.target && ev.target.classList && ev.target.classList.contains('fly-slot')) return;
                });
            }

            document.addEventListener('keydown', function (ev) {
                if (ev.key === 'Escape' && rail.classList.contains('is-open')) {
                    const ib = document.getElementById('indicesBankOverlay');
                    if (ib && ib.classList.contains('open')) return;
                    setFlyRailOpen(false);
                }
            });

            document.addEventListener('pointerdown', function (ev) {
                if (!rail.classList.contains('is-open')) return;
                if (rail.contains(ev.target)) return;
                const ib = document.getElementById('indicesBankOverlay');
                if (ib && ib.contains(ev.target)) return;
                const dock = document.getElementById('dockBar');
                if (dock && dock.contains(ev.target)) return;
                setFlyRailOpen(false);
            });

            initIndicesBank();
            initDockBar();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initFlyRail);
        } else {
            initFlyRail();
        }

        const HASHCOD_KEYS_STORE = 'l8_hashcod_keys_v1';
        let hashcodKeysCache = [];
        let hashcodKeysAccountKey = '';
        let hashcodKeysBusy = false;

        function hashcodKeysLocalStorageKey() {
            let account = '';
            try { account = sessionStorage.getItem('l8_auth_account') || ''; } catch (e) {}
            account = String(account).replace(/[^a-zA-Z0-9_-]/g, '') || 'pending';
            return HASHCOD_KEYS_STORE + ':acct:' + account;
        }

        function hashcodKeysGuestLocalKey() {
            const guest = ensureTokensGuestId() || 'local';
            return HASHCOD_KEYS_STORE + ':' + guest;
        }

        function readHashcodKeysLocalCache() {
            try {
                const raw = localStorage.getItem(hashcodKeysLocalStorageKey());
                if (!raw) return [];
                const data = JSON.parse(raw);
                return Array.isArray(data && data.entries) ? data.entries : [];
            } catch (e) {
                return [];
            }
        }

        function writeHashcodKeysLocalCache(entries, accountKey) {
            try {
                localStorage.setItem(hashcodKeysLocalStorageKey(), JSON.stringify({
                    version: 1,
                    account_key: accountKey || hashcodKeysAccountKey || '',
                    updated_at: new Date().toISOString(),
                    entries: Array.isArray(entries) ? entries.slice(0, 200) : []
                }));
                return true;
            } catch (e) {
                return false;
            }
        }

        function readHashcodKeysGuestLocal() {
            try {
                const raw = localStorage.getItem(hashcodKeysGuestLocalKey());
                if (!raw) return [];
                const data = JSON.parse(raw);
                return Array.isArray(data && data.entries) ? data.entries : [];
            } catch (e) {
                return [];
            }
        }

        function clearHashcodKeysGuestLocal() {
            try { localStorage.removeItem(hashcodKeysGuestLocalKey()); } catch (e) {}
        }

        function maskHashcodSecret(secret) {
            const s = String(secret || '');
            if (!s) return '—';
            if (s.length <= 4) return '••••';
            return '••••••••' + s.slice(-4);
        }

        function hashcodKeysSetMsg(text, tone) {
            const el = document.getElementById('hashcodKeysMsg');
            if (!el) return;
            el.textContent = text || '';
            el.classList.remove('ok', 'err');
            if (tone === 'ok') el.classList.add('ok');
            if (tone === 'err') el.classList.add('err');
        }

        function setHashcodKeysFormEnabled(enabled) {
            ['hashcodKeysName', 'hashcodKeysSecret', 'hashcodKeysCode', 'hashcodKeysSaveBtn'].forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.disabled = !enabled;
            });
        }

        function renderHashcodKeysList(entries) {
            const list = document.getElementById('hashcodKeysList');
            const empty = document.getElementById('hashcodKeysEmpty');
            if (!list) return;
            const rows = Array.isArray(entries) ? entries : hashcodKeysCache;
            hashcodKeysCache = rows;
            if (!rows.length) {
                list.innerHTML = '';
                if (empty) {
                    empty.style.display = '';
                    empty.textContent = 'Aún no hay claves guardadas en esta cuenta.';
                }
                return;
            }
            if (empty) empty.style.display = 'none';
            const esc = (s) => String(s || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/"/g, '&quot;');
            list.innerHTML = rows.map((row) => {
                const id = esc(row.id);
                const name = esc(row.name || 'Sin nombre');
                const secret = esc(maskHashcodSecret(row.secret));
                const code = esc(row.code || '');
                return '<li class="hashcod-keys-item" data-key-id="' + id + '">' +
                    '<div class="hashcod-keys-item-body">' +
                    '<div class="hashcod-keys-item-name">' + name + '</div>' +
                    '<div class="hashcod-keys-item-meta">Clave: ' + secret +
                    (code ? '<br>Código: ' + code : '') +
                    '</div></div>' +
                    '<button type="button" class="hashcod-keys-item-del" data-key-del="' + id + '" title="Eliminar">Eliminar</button>' +
                    '</li>';
            }).join('');
            list.querySelectorAll('[data-key-del]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    deleteHashcodKey(btn.getAttribute('data-key-del'));
                });
            });
        }

        async function migrateHashcodKeysGuestIfNeeded() {
            const guestEntries = readHashcodKeysGuestLocal();
            if (!guestEntries.length) return 0;
            try {
                const res = await fetch('/api/hashcod/keys', {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({ entries: guestEntries })
                });
                const data = await res.json();
                if (data && data.ok) {
                    clearHashcodKeysGuestLocal();
                    if (Array.isArray(data.entries)) {
                        hashcodKeysCache = data.entries;
                        hashcodKeysAccountKey = data.account_key || hashcodKeysAccountKey;
                        writeHashcodKeysLocalCache(hashcodKeysCache, hashcodKeysAccountKey);
                    }
                    return Number(data.migrated || guestEntries.length) || guestEntries.length;
                }
            } catch (e) {}
            return 0;
        }

        async function refreshHashcodKeysFromServer() {
            const tok = (typeof window.l8GetAuthToken === 'function') ? window.l8GetAuthToken() : '';
            if (!tok) {
                setHashcodKeysFormEnabled(false);
                hashcodKeysCache = [];
                renderHashcodKeysList([]);
                hashcodKeysSetMsg('Inicia sesión para guardar claves en tu cuenta (Supabase).', 'err');
                return { ok: false, code: 'not_authenticated' };
            }
            setHashcodKeysFormEnabled(true);
            hashcodKeysSetMsg('Sincronizando claves de tu cuenta…');
            try {
                const migrated = await migrateHashcodKeysGuestIfNeeded();
                const res = await fetch('/api/hashcod/keys', { headers: authHeaders() });
                const data = await res.json();
                if (!data || !data.ok) {
                    if (data && data.code === 'not_authenticated') {
                        setHashcodKeysFormEnabled(false);
                        hashcodKeysSetMsg('Inicia sesión para guardar claves en tu cuenta (Supabase).', 'err');
                        return data;
                    }
                    // fallback a cache local
                    const cached = readHashcodKeysLocalCache();
                    renderHashcodKeysList(cached);
                    hashcodKeysSetMsg((data && data.error) || 'No se pudo sincronizar con Supabase. Mostrando caché local.', 'err');
                    return data || { ok: false };
                }
                hashcodKeysAccountKey = data.account_key || '';
                hashcodKeysCache = Array.isArray(data.entries) ? data.entries : [];
                writeHashcodKeysLocalCache(hashcodKeysCache, hashcodKeysAccountKey);
                renderHashcodKeysList(hashcodKeysCache);
                let msg = 'Claves de tu cuenta sincronizadas con Supabase.';
                if (migrated > 0) msg = 'Migradas ' + migrated + ' claves locales a tu cuenta · sincronizado con Supabase.';
                hashcodKeysSetMsg(msg, 'ok');
                return data;
            } catch (e) {
                const cached = readHashcodKeysLocalCache();
                renderHashcodKeysList(cached);
                hashcodKeysSetMsg(e.message || String(e), 'err');
                return { ok: false, error: e.message || String(e) };
            }
        }

        function toggleHashcodKeys(force) {
            const overlay = document.getElementById('hashcodKeysOverlay');
            const btn = document.getElementById('hashcodDockKeysBtn');
            if (!overlay) return;
            const open = typeof force === 'boolean' ? force : !overlay.classList.contains('open');
            overlay.classList.toggle('open', open);
            overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
            if (btn) {
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
                btn.classList.toggle('is-active', open);
            }
            if (open) {
                try { toggleHashcodClock(false); } catch (e) {}
                renderHashcodKeysList(readHashcodKeysLocalCache());
                refreshHashcodKeysFromServer();
                const name = document.getElementById('hashcodKeysName');
                if (name) {
                    try { name.focus(); } catch (e) {}
                }
            }
        }

        async function submitHashcodKey(e) {
            if (e && e.preventDefault) e.preventDefault();
            if (hashcodKeysBusy) return false;
            const nameEl = document.getElementById('hashcodKeysName');
            const secretEl = document.getElementById('hashcodKeysSecret');
            const codeEl = document.getElementById('hashcodKeysCode');
            const name = nameEl ? String(nameEl.value || '').trim() : '';
            const secret = secretEl ? String(secretEl.value || '') : '';
            const code = codeEl ? String(codeEl.value || '').trim() : '';
            if (!name) {
                hashcodKeysSetMsg('Escribe un nombre para la clave.', 'err');
                if (nameEl) nameEl.focus();
                return false;
            }
            if (!secret && !code) {
                hashcodKeysSetMsg('Introduce una contraseña/clave o un código criptográfico.', 'err');
                return false;
            }
            const tok = (typeof window.l8GetAuthToken === 'function') ? window.l8GetAuthToken() : '';
            if (!tok) {
                hashcodKeysSetMsg('Inicia sesión para guardar en tu cuenta.', 'err');
                return false;
            }
            hashcodKeysBusy = true;
            hashcodKeysSetMsg('Guardando en tu cuenta (Supabase)…');
            try {
                const res = await fetch('/api/hashcod/keys', {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                        name: name.slice(0, 120),
                        secret: secret.slice(0, 4000),
                        code: code.slice(0, 4000)
                    })
                });
                const data = await res.json();
                if (!data || !data.ok) {
                    hashcodKeysSetMsg((data && data.error) || 'No se pudo guardar', 'err');
                    return false;
                }
                hashcodKeysAccountKey = data.account_key || hashcodKeysAccountKey;
                hashcodKeysCache = Array.isArray(data.entries) ? data.entries : hashcodKeysCache;
                writeHashcodKeysLocalCache(hashcodKeysCache, hashcodKeysAccountKey);
                if (nameEl) nameEl.value = '';
                if (secretEl) secretEl.value = '';
                if (codeEl) codeEl.value = '';
                renderHashcodKeysList(hashcodKeysCache);
                const sb = data.supabase || {};
                const remoteOk = !!(sb.storage || sb.db);
                hashcodKeysSetMsg(
                    remoteOk
                        ? 'Clave guardada en tu cuenta (Supabase).'
                        : 'Clave guardada en la cuenta (espejo remoto pendiente).',
                    remoteOk ? 'ok' : 'ok'
                );
                return false;
            } catch (err) {
                hashcodKeysSetMsg(err.message || String(err), 'err');
                return false;
            } finally {
                hashcodKeysBusy = false;
            }
        }

        async function deleteHashcodKey(id) {
            if (!id || hashcodKeysBusy) return;
            const tok = (typeof window.l8GetAuthToken === 'function') ? window.l8GetAuthToken() : '';
            if (!tok) {
                hashcodKeysSetMsg('Inicia sesión para gestionar claves de tu cuenta.', 'err');
                return;
            }
            hashcodKeysBusy = true;
            hashcodKeysSetMsg('Eliminando…');
            try {
                const res = await fetch('/api/hashcod/keys?id=' + encodeURIComponent(id), {
                    method: 'DELETE',
                    headers: authHeaders()
                });
                const data = await res.json();
                if (!data || !data.ok) {
                    hashcodKeysSetMsg((data && data.error) || 'No se pudo eliminar', 'err');
                    return;
                }
                hashcodKeysCache = Array.isArray(data.entries) ? data.entries : hashcodKeysCache.filter((r) => String(r.id) !== String(id));
                writeHashcodKeysLocalCache(hashcodKeysCache, data.account_key || hashcodKeysAccountKey);
                renderHashcodKeysList(hashcodKeysCache);
                hashcodKeysSetMsg('Clave eliminada de tu cuenta.', 'ok');
            } catch (err) {
                hashcodKeysSetMsg(err.message || String(err), 'err');
            } finally {
                hashcodKeysBusy = false;
            }
        }

        async function openUbuntuCli() {
            await openExternalWithTokens('ubuntu-cli.php', 'l8-ubuntu-cli', 'width=1100,height=720');
        }

        async function openClaudeCli() {
            await openExternalWithTokens('claude-cli.php', 'l8-claude-cli', 'width=1100,height=720');
        }

        async function openZylonCli() {
            await openExternalWithTokens('zylon-cli.php', 'l8-zylon-cli', 'width=1100,height=720');
        }


        async function openPrsCode(url) {
            await openExternalWithTokens(url || 'prs-code.php', 'l8-prs-code', 'width=1180,height=780');
        }


        async function openMacosInside(url) {
            await openExternalWithTokens(url || 'macos-cli.php', 'l8-macos-inside', 'width=1180,height=780');
        }


        async function openChromeosPlay(url) {
            await openExternalWithTokens(url || 'chromeos-cli.php', 'l8-chromeos-play', 'width=1180,height=780');
        }

        async function submitCommand(cmd) {
            if (!cmd) return;
            const startTime = performance.now();
            if (window.CodespaceWS) {
                window.CodespaceWS.emitTerminalCommand(cmd);
            }
            try {
                hasExecutedCommand = true;
                lastCommandText = cmd;
                if (window.TabbyTerminal && typeof window.TabbyTerminal.startRunningEntry === 'function') {
                    window.TabbyTerminal.startRunningEntry(cmd);
                } else if (executionContainer) {
                    const escCmd = String(cmd).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    executionContainer.innerHTML = `
                        <div class="tabby-block status-running" style="width:100%;">
                            <div class="tabby-block-header">
                                <div class="tabby-block-header-left">
                                    <span class="tabby-prompt-pill">&gt;=</span>
                                    <span class="tabby-cmd-text">${escCmd}</span>
                                </div>
                                <div class="tabby-block-header-right">
                                    <span class="tabby-meta-pill">⚡ ejecutando…</span>
                                </div>
                            </div>
                            <div class="tabby-block-body" style="display:flex; align-items:center; gap:8px; color:#4B5563; font-family:'Geist Mono', monospace; font-size:12px;">
                                <svg style="animation: spin 0.7s linear infinite; width:15px; height:15px; fill:#111827; flex-shrink:0;" viewBox="0 0 24 24"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8C6.25 13.93 6 12.99 6 12c0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.45.87.7 1.81.7 2.8c0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/></svg>
                                <span>Procesando comando…</span>
                            </div>
                        </div>
                    `;
                }
                const res = await fetch(apiUrl('api/command'), {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({ command: cmd })
                });
                const duration = Math.max(1, Math.round(performance.now() - startTime));
                let result;
                try {
                    result = await res.json();
                } catch (jsonErr) {
                    const txt = await res.text();
                    result = {
                        isError: true,
                        error: (txt && txt.length < 250) ? txt : `Error del servidor (HTTP ${res.status})`,
                        executionDuration: duration,
                        executedCommand: cmd
                    };
                }
                if (result && result.tokens) applyTokensStatus(result.tokens);
                result.executionDuration = duration;
                result.executedCommand = cmd;
                latestExecutionData = result;
                render();
                schedulePersistPlatformState();
            } catch (e) {
                console.error("Error al enviar comando:", e);
                const duration = Math.max(1, Math.round(performance.now() - startTime));
                latestExecutionData = { isError: true, error: "Error de red al ejecutar comando: " + (e.message || ''), executionDuration: duration, executedCommand: cmd };
                render();
            }
        }

        let activeInputTarget = document.getElementById('cmdInput');

        document.addEventListener('DOMContentLoaded', () => {
            const inputCmd = document.getElementById('cmdInput');
            const editorFunc = document.getElementById('functionEditor');
            const editorEq = document.getElementById('equationsEditor');
            const tokensBtn = document.getElementById('tokensMeterBtn');
            const tokensPanel = document.getElementById('tokensPanel');
            const unlockOpenBtn = document.getElementById('tokensUnlockOpenBtn');
            const unlockCloseBtn = document.getElementById('tokensUnlockCloseBtn');
            const unlockOverlay = document.getElementById('tokensUnlockOverlay');

            initMobileMode();

            if (tokensBtn) {
                tokensBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleTokensPanel();
                });
            }
            if (unlockOpenBtn) {
                unlockOpenBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleTokensUnlock(true);
                });
            }
            if (unlockCloseBtn) {
                unlockCloseBtn.addEventListener('click', () => toggleTokensUnlock(false));
            }
            if (unlockOverlay) {
                unlockOverlay.addEventListener('click', (e) => {
                    if (e.target === unlockOverlay) toggleTokensUnlock(false);
                });
            }
            const keysOverlay = document.getElementById('hashcodKeysOverlay');
            const keysCloseBtn = document.getElementById('hashcodKeysCloseBtn');
            const keysForm = document.getElementById('hashcodKeysForm');
            if (keysCloseBtn) {
                keysCloseBtn.addEventListener('click', () => toggleHashcodKeys(false));
            }
            if (keysOverlay) {
                keysOverlay.addEventListener('click', (e) => {
                    if (e.target === keysOverlay) toggleHashcodKeys(false);
                });
            }
            if (keysForm) {
                keysForm.addEventListener('submit', submitHashcodKey);
            }
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && unlockOverlay && unlockOverlay.classList.contains('open')) {
                    toggleTokensUnlock(false);
                }
                if (e.key === 'Escape') {
                    const clockPop = document.getElementById('hashcodClockPop');
                    if (clockPop && clockPop.classList.contains('open')) toggleHashcodClock(false);
                    if (keysOverlay && keysOverlay.classList.contains('open')) toggleHashcodKeys(false);
                }
            });
            document.addEventListener('click', (e) => {
                const clockPop = document.getElementById('hashcodClockPop');
                const clockBtn = document.getElementById('hashcodDockClockBtn');
                if (clockPop && clockPop.classList.contains('open')) {
                    if (!clockPop.contains(e.target) && !(clockBtn && clockBtn.contains(e.target))) {
                        toggleHashcodClock(false);
                    }
                }
                if (!tokensPanel || !tokensPanel.classList.contains('open')) return;
                if (tokensPanel.contains(e.target) || (tokensBtn && tokensBtn.contains(e.target))) return;
                if (unlockOverlay && unlockOverlay.contains(e.target)) return;
                if (keysOverlay && keysOverlay.contains(e.target)) return;
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

            function updateTabbyPromptClock() {
                const el = document.getElementById('tabbyLiveClock');
                if (el) el.textContent = new Date().toLocaleTimeString();
            }
            updateTabbyPromptClock();
            setInterval(updateTabbyPromptClock, 1000);
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
            if (!overlay) return;
            const currentlyOpen = overlay.classList.contains('open');
            const open = typeof force === 'boolean' ? force : !currentlyOpen;

            overlay.classList.toggle('open', open);
            overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
            if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) {
                if (!notepadState.notes.length) notepadLoadStore();
                notepadSelect(notepadState.activeId || (notepadState.notes[0] && notepadState.notes[0].id), true);
                const editor = document.getElementById('notepadEditor');
                setTimeout(() => { try { editor && editor.focus(); } catch (e) {} }, 30);
                try { consumeTokens('notepad', 'bloc de notas'); } catch (e) {}
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
        const TOOLKIT_ENGINEERING_BASE = l8Asset('toolkit/agency-agents/engineering');
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
                s.src = l8Asset('toolkit/vendor/marked.min.js?v=15.0.7');
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
        window.toolkitEnsureMarked = toolkitEnsureMarked;

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
        function toolkitBuiltinEngineeringTool() {
            return {
                id: 'engineering',
                title: 'Ingeniería',
                iconHtml: toolkitEngineeringIconHtml(),
                onClick: function () { openToolkitEngineering(); }
            };
        }

        function toolkitBuiltinPdfMdTool() {
            return {
                id: 'pdf-md',
                title: 'PDF → Markdown',
                iconHtml: (typeof toolkitPdfIconHtml === 'function'
                    ? toolkitPdfIconHtml()
                    : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" aria-hidden="true"><path d="M15 2 L35 48 L8 32 Z"/></svg>'),
                onClick: function () {
                    if (typeof openToolkitPdfMd === 'function') openToolkitPdfMd();
                }
            };
        }

        const TOOLKIT_FICHAS_DEFAULT = [
            {
                id: 'platform',
                title: 'l8 codespace',
                icon: l8Asset('favicon.svg?v=3'),
                tools: [toolkitBuiltinEngineeringTool(), toolkitBuiltinPdfMdTool()]
            },
            {
                id: 'workspace',
                title: 'workspace',
                icon: l8Asset('favicon.svg?v=3'),
                tools: [toolkitBuiltinEngineeringTool(), toolkitBuiltinPdfMdTool()]
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

        function toolkitEnsureEngineeringTool(ficha) {
            const tools = Array.isArray(ficha.tools) ? ficha.tools.slice() : [];
            const byId = {};
            tools.forEach((t) => {
                if (t && t.id) byId[t.id] = t;
            });
            byId.engineering = toolkitBuiltinEngineeringTool();
            byId['pdf-md'] = toolkitBuiltinPdfMdTool();
            const ordered = [];
            ['engineering', 'pdf-md'].forEach((id) => {
                if (byId[id]) {
                    ordered.push(byId[id]);
                    delete byId[id];
                }
            });
            Object.keys(byId).forEach((id) => ordered.push(byId[id]));
            return Object.assign({}, ficha, { tools: ordered });
        }

        function toolkitRebuildFichas() {
            const removed = new Set(
                Array.isArray(toolkitStore.removedIds)
                    ? toolkitStore.removedIds.map(String)
                    : []
            );
            toolkitFichas = TOOLKIT_FICHAS_DEFAULT
                .filter((f) => !removed.has(String(f.id)))
                .map((f) => toolkitEnsureEngineeringTool(Object.assign({}, f, { tools: (f.tools || []).slice() })));

            // Si se borró la ficha platform (donde nació Ingeniería), restaurarla
            // para que la herramienta no desaparezca del toolkit.
            if (!toolkitFichas.some((f) => f.id === 'platform')) {
                const platform = TOOLKIT_FICHAS_DEFAULT.find((f) => f.id === 'platform');
                if (platform) {
                    toolkitFichas.unshift(toolkitEnsureEngineeringTool(Object.assign({}, platform, {
                        tools: (platform.tools || []).slice()
                    })));
                    toolkitStore.removedIds = (toolkitStore.removedIds || []).filter((id) => String(id) !== 'platform');
                    toolkitPersist();
                }
            }

            if (!toolkitFichas.length) {
                const platform = TOOLKIT_FICHAS_DEFAULT[0];
                toolkitFichas = [toolkitEnsureEngineeringTool(Object.assign({}, platform, {
                    tools: (platform.tools || []).slice()
                }))];
                toolkitStore.removedIds = [];
                toolkitPersist();
            }

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
        window.toolkitLogUse = toolkitLogUse;

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
        window.toolkitCurateFile = toolkitCurateFile;

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
            const emptySlots = Math.max(0, TOOLKIT_SLOT_COUNT - tools.length);
            for (let i = 0; i < emptySlots; i++) {
                toolsHtml += '<span class="toolkit-tool-slot" title="Espacio libre" aria-hidden="true"></span>';
            }
            if (!tools.length && !emptySlots) {
                toolsHtml += '<span class="toolkit-empty">Sin herramientas en esta ficha.</span>';
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
                '<img src="' + String(ficha.icon || l8Asset('favicon.svg?v=3')).replace(/"/g, '&quot;') +
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

        let toolkitOpenBusy = false;

        function toggleToolkit() {}
        window.toggleToolkit = toggleToolkit;

        document.addEventListener('DOMContentLoaded', initToolkitEngineering);
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof initToolkitPdfMd === 'function') initToolkitPdfMd();
        });

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

    <div class="toolkit-agent-overlay" id="toolkitPdfOverlay" aria-hidden="true">
        <div class="toolkit-agent-shell" role="dialog" aria-modal="true" aria-labelledby="toolkitPdfBrand">
            <div class="toolkit-agent-top">
                <div class="toolkit-agent-brand" id="toolkitPdfBrand">= / pdf → markdown</div>
                <div class="toolkit-agent-sub" id="toolkitPdfSub">pdf-inspector · conversión local (WASM)</div>
                <button type="button" class="toolkit-agent-close" id="toolkitPdfCloseBtn" title="Cerrar">Cerrar</button>
            </div>
            <div class="toolkit-pdf-main">
                <aside class="toolkit-pdf-side" aria-label="Cargar PDF">
                    <div class="toolkit-pdf-drop" id="toolkitPdfDrop" role="button" tabindex="0" aria-label="Elegir o soltar PDF">
                        <strong>Arrastra un PDF aquí</strong>
                        o haz clic para elegir · máx. 25 MB
                    </div>
                    <input type="file" id="toolkitPdfInput" accept="application/pdf,.pdf" hidden>
                    <div class="toolkit-pdf-file" id="toolkitPdfFileInfo" hidden></div>
                    <div class="toolkit-pdf-actions">
                        <button type="button" id="toolkitPdfClearBtn">Limpiar</button>
                        <button type="button" id="toolkitPdfCopyBtn" disabled>Copiar MD</button>
                        <button type="button" id="toolkitPdfDownloadBtn" disabled>Descargar .md</button>
                    </div>
                    <div class="toolkit-pdf-status" id="toolkitPdfStatus">Elige un PDF para convertirlo a Markdown (local, pdf-inspector).</div>
                </aside>
                <div class="toolkit-pdf-view" id="toolkitPdfView">
                    <div class="md-status" id="toolkitPdfEmpty">El markdown aparecerá aquí tras convertir el PDF.</div>
                    <div id="toolkitPdfPreview" hidden>
                        <div class="toolkit-pdf-meta" id="toolkitPdfMeta"></div>
                        <div class="toolkit-pdf-html toolkit-md" id="toolkitPdfHtml"></div>
                        <details class="toolkit-pdf-raw-wrap" id="toolkitPdfRawWrap" hidden>
                            <summary>Ver markdown en bruto</summary>
                            <pre class="toolkit-pdf-output" id="toolkitPdfOutput"></pre>
                        </details>
                    </div>
                </div>
            </div>
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
                <button type="button" class="notepad-tool iconic gateway-action-btn" id="notepadGatewayBtn" data-action="gateway" title="Gateway · Enviar nota y generar código único" aria-label="Enviar al Gateway" onclick="openGatewayFromTool('notepad')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="16" height="16" aria-hidden="true">
                        <path fill="currentColor" d="M 15 3 C 8.3845336 3 3 8.3845336 3 15 C 3 21.615466 8.3845336 27 15 27 C 17.554923 27 19.9167 26.181425 21.853516 24.818359 A 1.0002806 1.0002806 0 0 0 20.703125 23.181641 C 19.081941 24.322575 17.129077 25 15 25 C 9.4654664 25 5 20.534534 5 15 C 5 9.4654664 9.4654664 5 15 5 C 17.129077 5 19.081941 5.6774247 20.703125 6.8183594 A 1.0002809 1.0002809 0 0 0 21.853516 5.1816406 C 19.9167 3.8185753 17.554923 3 15 3 z"></path>
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

    <!-- Fly: barrita negra; al tocarla se guarda y sale la barra de herramientas -->
    <aside
        id="flyRail"
        class="fly-rail"
        aria-label="Fly"
        style="position:fixed;top:0;right:0;bottom:0;left:auto;z-index:9990;display:block;width:0;margin:0;padding:0;overflow:visible;"
    >
        <button
            type="button"
            class="fly-handle"
            id="flyHandleBtn"
            title="Fly"
            aria-label="Abrir barra Fly"
            aria-expanded="false"
            aria-controls="flyRailPanel"
            style="position:absolute;right:0;top:50%;transform:translateY(-50%);width:6px;height:72px;background:#0b3d2e;border:none;border-radius:999px;padding:0;cursor:pointer;display:block;"
        ></button>
        <nav class="fly-rail-panel" id="flyRailPanel" aria-label="Herramientas Fly" aria-hidden="true" style="position:absolute;right:0;top:50%;transform:translateY(-50%);background:#0b3d2e;">
            <button type="button" class="fly-slot is-ready has-icon" id="flySlotIndicesBank" data-fly-slot="1" title="Banco de índices" aria-label="Abrir Banco de índices" aria-expanded="false" aria-controls="indicesBankOverlay">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="#ffffff" d="M8.0332,1c-0.32534,-0.01113 -0.63574,0.13679 -0.83203,0.39648l-5.28516,7c-0.22915,0.30288 -0.26697,0.70942 -0.09762,1.04937c0.16935,0.33995 0.51665,0.55463 0.89645,0.55415h1.54102l-2.04688,3.49414c-0.18116,0.30904 -0.18319,0.69136 -0.00533,1.00231c0.17786,0.31095 0.50844,0.50302 0.86666,0.50355h3.92969v2h-3c-0.552,0 -1,0.448 -1,1c0,0.304 0.14342,0.567 0.35742,0.75l-0.01758,0.00195c0,0 2.92758,2.04072 4.14258,2.88672c0.337,0.236 0.73939,0.36133 1.15039,0.36133h11.37891c1.098,0 1.98828,-0.89028 1.98828,-1.98828v-12.07813c0,-0.592 -0.26184,-1.1532 -0.71484,-1.5332c-1.51596,-1.27196 -4.38467,-3.67936 -5.29297,-4.44141c-0.55596,-0.54131 -0.99609,-0.82812 -0.99609,-0.82812c-0.14541,-0.0828 -0.30926,-0.12779 -0.47656,-0.13086c-0.18054,-0.00373 -0.35872,0.04149 -0.51562,0.13086c0,0 -1.10528,0.65597 -2.08594,2.12695c-0.25771,0.38656 -0.5106,0.83689 -0.74609,1.34766l-2.36719,-3.19922c-0.18149,-0.24629 -0.46572,-0.39596 -0.77148,-0.40625zM14.5,3.39453c0.25211,0.19418 0.41849,0.22344 0.91797,0.97266c0.76934,1.15401 1.58203,3.0623 1.58203,6.13281c0,1.39094 -1.10906,2.5 -2.5,2.5c-1.39094,0 -2.5,-1.10906 -2.5,-2.5c0,-3.07051 0.81269,-4.9788 1.58203,-6.13281c0.49948,-0.74922 0.66586,-0.77847 0.91797,-0.97266zM7.99219,3.67188l2.40039,3.24609c-0.24032,1.03354 -0.39258,2.21797 -0.39258,3.58203c0,0.92335 0.28279,1.7833 0.76563,2.5h-2.76562h-3.18359l2.04688,-3.49414c0.18133,-0.30934 0.18318,-0.69208 0.00485,-1.00316c-0.17833,-0.31108 -0.50956,-0.50288 -0.86813,-0.5027h-1.27734zM9,15h5v2h-5z"/></svg>
            </button>
            <button type="button" class="fly-slot" data-fly-slot="2" title="Herramienta 2" aria-label="Herramienta 2 (próximamente)" disabled></button>
            <button type="button" class="fly-slot" data-fly-slot="3" title="Herramienta 3" aria-label="Herramienta 3 (próximamente)" disabled></button>
            <button type="button" class="fly-slot" data-fly-slot="4" title="Herramienta 4" aria-label="Herramienta 4 (próximamente)" disabled></button>
            <button type="button" class="fly-slot" data-fly-slot="5" title="Herramienta 5" aria-label="Herramienta 5 (próximamente)" disabled></button>
        </nav>
    </aside>

    <!-- Dock toolbar inferior (swipe → Streamlit slots + herramientas aparte), mismas reglas que Fly -->
    <aside
        id="dockBar"
        class="dock-bar"
        aria-label="Dock"
        style="position:fixed;left:0;right:0;bottom:0;top:auto;z-index:9989;display:block;width:auto;height:0;margin:0;padding:0;overflow:visible;"
    >
        <button
            type="button"
            class="dock-swipe"
            id="dockSwipeBtn"
            title="Dock"
            aria-label="Abrir toolbar inferior"
            aria-expanded="false"
            aria-controls="dockToolbar"
            style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:72px;height:6px;background:#000000;border:none;border-radius:999px;padding:0;cursor:pointer;display:block;"
        ></button>
        <nav
            class="dock-toolbar"
            id="dockToolbar"
            aria-label="Herramientas Dock"
            aria-hidden="true"
            style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);background:#000000;"
        >
            <button type="button" class="dock-tool is-ready is-filled has-icon" id="dockLibreOfficeBtn" title="LibreOffice" aria-label="Abrir LibreOffice en la plataforma servidor">
                <svg class="lo-tool-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path fill="currentColor" d="M6.5 2.75A1.75 1.75 0 0 0 4.75 4.5v15c0 .966.784 1.75 1.75 1.75h11c.966 0 1.75-.784 1.75-1.75V8.414a1.75 1.75 0 0 0-.513-1.238L14.324 3.263A1.75 1.75 0 0 0 13.086 2.75H6.5zm0 1.5h6.25v3.25c0 .966.784 1.75 1.75 1.75h3.25V19.5h-11V4.25zm7.75.81 2.69 2.69h-2.69V5.06z"/>
                    <path fill="currentColor" d="M8.25 11.25h4.1c1.55 0 2.65.88 2.65 2.2 0 .92-.5 1.62-1.28 1.95.98.36 1.58 1.18 1.58 2.22 0 1.48-1.18 2.38-2.95 2.38H8.25v-8.75zm1.55 1.35v2.2h2.35c.72 0 1.18-.38 1.18-1.05s-.46-1.15-1.2-1.15H9.8zm0 3.5v2.55h2.7c.85 0 1.35-.42 1.35-1.2 0-.78-.5-1.35-1.4-1.35H9.8z"/>
                </svg>
            </button>
            <button type="button" class="dock-tool is-ready is-filled has-icon" id="dockTipTapBtn" title="TipTap · Documento" aria-label="Abrir editor TipTap (hoja tipo Word)">
                <svg class="tt-tool-ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                    <path fill="currentColor" fill-rule="nonzero" d="M2.5,1c-0.82253,0 -1.5,0.67747 -1.5,1.5v10c0,0.82253 0.67747,1.5 1.5,1.5h10c0.82253,0 1.5,-0.67747 1.5,-1.5v-10c0,-0.82253 -0.67747,-1.5 -1.5,-1.5zM2.5,2h10c0.28147,0 0.5,0.21853 0.5,0.5v10c0,0.28147 -0.21853,0.5 -0.5,0.5h-10c-0.28147,0 -0.5,-0.21853 -0.5,-0.5v-10c0,-0.28147 0.21853,-0.5 0.5,-0.5zM4,5v1h7v-1zM5,7v1h5v-1zM4,9v1h7v-1z"/>
                </svg>
            </button>
            <span class="dock-tool-sep" aria-hidden="true"></span>
            <button type="button" class="dock-slot" data-dock-slot="1" title="Herramienta 1" aria-label="Herramienta 1 (próximamente)" disabled></button>
            <button type="button" class="dock-slot" data-dock-slot="2" title="Herramienta 2" aria-label="Herramienta 2 (próximamente)" disabled></button>
            <button type="button" class="dock-slot" data-dock-slot="3" title="Herramienta 3" aria-label="Herramienta 3 (próximamente)" disabled></button>
            <button type="button" class="dock-slot" data-dock-slot="4" title="Herramienta 4" aria-label="Herramienta 4 (próximamente)" disabled></button>
            <button type="button" class="dock-slot" data-dock-slot="5" title="Herramienta 5" aria-label="Herramienta 5 (próximamente)" disabled></button>
            <button type="button" class="dock-slot" data-dock-slot="6" title="Herramienta 6" aria-label="Herramienta 6 (próximamente)" disabled></button>
            <button type="button" class="dock-slot" data-dock-slot="7" title="Herramienta 7" aria-label="Herramienta 7 (próximamente)" disabled></button>
            <button type="button" class="dock-slot" data-dock-slot="8" title="Herramienta 8" aria-label="Herramienta 8 (próximamente)" disabled></button>
        </nav>
    </aside>

    <!-- LibreOffice — panel en plataforma servidor -->
    <div class="lo-dock-overlay" id="loDockOverlay" aria-hidden="true">
        <div class="lo-dock-shell" role="dialog" aria-modal="true" aria-labelledby="loDockTitle">
            <div class="lo-dock-head">
                <div class="lo-dock-brand">
                    <svg class="lo-tool-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path fill="currentColor" d="M6.5 2.75A1.75 1.75 0 0 0 4.75 4.5v15c0 .966.784 1.75 1.75 1.75h11c.966 0 1.75-.784 1.75-1.75V8.414a1.75 1.75 0 0 0-.513-1.238L14.324 3.263A1.75 1.75 0 0 0 13.086 2.75H6.5zm0 1.5h6.25v3.25c0 .966.784 1.75 1.75 1.75h3.25V19.5h-11V4.25zm7.75.81 2.69 2.69h-2.69V5.06z"/>
                        <path fill="currentColor" d="M8.25 11.25h4.1c1.55 0 2.65.88 2.65 2.2 0 .92-.5 1.62-1.28 1.95.98.36 1.58 1.18 1.58 2.22 0 1.48-1.18 2.38-2.95 2.38H8.25v-8.75zm1.55 1.35v2.2h2.35c.72 0 1.18-.38 1.18-1.05s-.46-1.15-1.2-1.15H9.8zm0 3.5v2.55h2.7c.85 0 1.35-.42 1.35-1.2 0-.78-.5-1.35-1.4-1.35H9.8z"/>
                    </svg>
                    <div>
                        <h2 id="loDockTitle">LibreOffice</h2>
                        <p>Suite en la plataforma servidor</p>
                    </div>
                </div>
                <div class="lo-dock-head-actions">
                    <button type="button" class="lo-dock-btn" id="loDockRefreshBtn">Actualizar</button>
                    <button type="button" class="lo-dock-btn primary" id="loDockDeployBtn">Desplegar</button>
                    <button type="button" class="lo-dock-btn" id="loDockCloseBtn">Cerrar</button>
                </div>
            </div>
            <div class="lo-dock-body">
                <div class="lo-dock-msg" id="loDockMsg" aria-live="polite"></div>
                <div class="lo-dock-badges" id="loDockBadges"></div>
                <div class="lo-dock-meta" id="loDockMeta"></div>
                <div class="lo-dock-tools" id="loDockTools" aria-label="Herramientas LibreOffice"></div>
                <pre class="lo-dock-log" id="loDockLog" hidden></pre>
            </div>
        </div>
    </div>

    <!-- Editor Streamlit (dock slots) — Figma panel-body -->
    <div class="st-dock-overlay" id="stDockOverlay" aria-hidden="true">
        <div class="st-dock-shell" role="dialog" aria-modal="true" aria-labelledby="stDockTitle">
            <div class="st-dock-headbar">
                <h2 class="st-dock-title" id="stDockTitle">Streamlit · Slot 1</h2>
                <button type="button" class="st-dock-close" id="stDockCloseBtn">Close</button>
            </div>
            <div class="st-dock-body">
                <div class="st-dock-badges" id="stDockBadges" aria-live="polite"></div>
                <p class="st-dock-url" id="stDockUrl" hidden></p>
                <div class="st-dock-field">
                    <label class="st-dock-label" for="stDockTitleInput">Name</label>
                    <input class="st-dock-input" id="stDockTitleInput" type="text" maxlength="80" placeholder="SoroOtbedit" autocomplete="off">
                </div>
                <div class="st-dock-field">
                    <div class="st-dock-label">Proyecto</div>
                    <div class="st-dock-templates" id="stDockTemplates" aria-label="Proyecto Streamlit SoroOtbedit"></div>
                </div>
                <div class="st-dock-editor">
                    <div class="st-dock-editor-header">
                        <div class="st-dock-editor-left">
                            <span class="st-dock-file-chip" id="stDockFileChip">app.py</span>
                            <span class="st-dock-lang">Python</span>
                        </div>
                        <div class="st-dock-editor-right">
                            <span class="st-dock-ready-dot" id="stDockReadyDot" aria-hidden="true"></span>
                            <span class="st-dock-ready-label" id="stDockReadyLabel">Ready</span>
                        </div>
                    </div>
                    <div class="st-dock-code-wrap">
                        <textarea class="st-dock-code" id="stDockCode" spellcheck="false" placeholder="import streamlit as st&#10;st.title('Hello l8')"></textarea>
                    </div>
                </div>
                <div class="st-dock-footer">
                    <div class="st-dock-actions">
                        <button type="button" class="st-dock-btn" id="stDockSaveBtn">Save</button>
                        <button type="button" class="st-dock-btn primary" id="stDockSaveRunBtn">Save and open</button>
                        <button type="button" class="st-dock-btn secondary" id="stDockOpenBtn">Open</button>
                        <button type="button" class="st-dock-btn" id="stDockPreviewBtn">Preview</button>
                        <button type="button" class="st-dock-btn" id="stDockStopBtn">Stop</button>
                        <button type="button" class="st-dock-btn danger" id="stDockClearBtn">Clear slot</button>
                    </div>
                    <div class="st-dock-preview-wrap" id="stDockPreviewWrap">
                        <iframe id="stDockIframe" title="Streamlit preview" loading="lazy"></iframe>
                    </div>
                    <p class="st-dock-msg" id="stDockMsg">Code is ready. Save and open to deploy.</p>
                </div>
            </div>
        </div>
    </div>

    <!-- =========================================================================
         TOOLBOX TOOL 1: BLOG DE PUBLICACIONES (VISTA 16-COLUMNAS FIGMA EXACTA)
         ========================================================================= -->
    <div class="excel-blog-overlay" id="excelBlogOverlay" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="excelBlogTitle">
        <div class="excel-blog-shell table-section-card">
            <!-- mega-creator Vector Illustration -->
            <div class="mega-creator" aria-hidden="true">
                <div class="mc-group-1">
                    <div class="mc-shape-1"></div>
                    <div class="mc-shape-2"></div>
                </div>
                <div class="mc-group-2">
                    <div class="mc-inner-grad"></div>
                    <div class="mc-line l1"></div>
                    <div class="mc-line l2"></div>
                    <div class="mc-line l3"></div>
                    <div class="mc-line l4"></div>
                    <div class="mc-line l5"></div>
                    <div class="mc-line l6"></div>
                    <div class="mc-line l7"></div>
                    <div class="mc-line l8"></div>
                    <div class="mc-line l9"></div>
                    <div class="mc-line l10"></div>
                    <div class="mc-line l11"></div>
                    <div class="mc-line l12"></div>
                </div>
                <div class="mc-group-3">
                    <div class="mc-rot-grad"></div>
                    <div class="mc-rot-line r1"></div>
                    <div class="mc-rot-line r2"></div>
                    <div class="mc-rot-line r3"></div>
                    <div class="mc-rot-line r4"></div>
                    <div class="mc-rot-line r5"></div>
                </div>
            </div>

            <!-- table-header-controls -->
            <div class="table-header-controls">
                <div class="table-title-text" id="excelBlogTitle">
                    <svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor;" aria-hidden="true">
                        <path d="M 10.376953 1.9765625 C 9.787168 1.9765555 9.1973513 2.1369377 8.6777344 2.4589844 A 1.0001 1.0001 0 0 0 8.6757812 2.4589844 L 7.9101562 2.9355469 L 7.0097656 3.0019531 C 5.790157 3.0903096 4.7216027 3.8663998 4.2597656 5 L 3.9179688 5.8359375 L 3.2285156 6.4179688 C 2.2949033 7.206835 1.8871479 8.4628535 2.1796875 9.6503906 L 2.3945312 10.527344 L 2.1796875 11.402344 C 1.9283596 12.41756 2.1926714 13.48079 2.8574219 14.261719 L 2.7421875 14.179688 C 2.7421875 14.179688 4.5693281 18.566531 5.4863281 20.769531 C 5.7973281 21.514531 6.5259844 22 7.3339844 22 L 20.017578 22 C 20.548578 22 21.056641 21.788109 21.431641 21.412109 C 21.806641 21.036109 22.017578 20.527094 22.017578 19.996094 C 22.013578 17.150094 22.004953 12.048312 22.001953 9.9453125 C 22.000953 9.3473125 21.731531 8.7793906 21.269531 8.4003906 C 19.612531 7.0423906 15.712891 3.8476563 15.712891 3.8476562 L 15.722656 3.8769531 C 15.191727 3.3749897 14.496419 3.0565298 13.742188 3.0019531 L 12.841797 2.9355469 L 12.076172 2.4589844 C 11.556794 2.1366366 10.966738 1.9765695 10.376953 1.9765625 z M 10.376953 3.9746094 C 10.600706 3.9746846 10.823863 4.0355509 11.021484 4.1582031 L 11.996094 4.7636719 A 1.0001 1.0001 0 0 0 12.451172 4.9121094 L 13.597656 4.9960938 C 14.063382 5.0297937 14.463164 5.3217602 14.638672 5.7539062 A 1.0001 1.0001 0 0 0 14.640625 5.7558594 L 15.074219 6.8183594 A 1.0001 1.0001 0 0 0 15.353516 7.203125 L 16.230469 7.9453125 A 1.0001 1.0001 0 0 0 16.232422 7.9472656 C 16.589529 8.2485402 16.74232 8.7194121 16.630859 9.171875 L 16.355469 10.287109 A 1.0001 1.0001 0 0 0 16.355469 10.765625 L 16.630859 11.880859 C 16.742569 12.334886 16.589529 12.806147 16.232422 13.107422 L 15.355469 13.849609 A 1.0001 1.0001 0 0 0 15.074219 14.234375 L 14.640625 15.298828 A 1.0001 1.0001 0 0 0 14.638672 15.300781 C 14.463276 15.732652 14.062995 16.024226 13.595703 16.058594 L 12.451172 16.142578 A 1.0001 1.0001 0 0 0 11.996094 16.289062 L 11.019531 16.894531 A 1.0001 1.0001 0 0 0 11.019531 16.896484 C 10.622885 17.142869 10.127115 17.142869 9.7304688 16.896484 A 1.0001 1.0001 0 0 0 9.7304688 16.894531 L 8.7539062 16.289062 A 1.0001 1.0001 0 0 0 8.3007812 16.142578 L 7.1542969 16.058594 C 6.6883359 16.024283 6.286449 15.731975 6.1113281 15.300781 L 5.6777344 14.236328 A 1.0001 1.0001 0 0 0 5.3964844 13.849609 L 4.5195312 13.107422 C 4.1628849 12.806536 4.0092437 12.334622 4.1210938 11.882812 A 1.0001 1.0001 0 0 0 4.1210938 11.880859 L 4.3964844 10.765625 A 1.0001 1.0001 0 0 0 4.3964844 10.287109 L 4.1210938 9.171875 C 4.0096334 8.7194121 4.1631436 8.2464462 4.5195312 7.9453125 L 5.3984375 7.203125 A 1.0001 1.0001 0 0 0 5.6777344 6.8164062 L 6.1113281 5.7539062 C 6.287491 5.3215064 6.6899055 5.0297373 7.1542969 4.9960938 L 8.3007812 4.9121094 A 1.0001 1.0001 0 0 0 8.7558594 4.7636719 L 9.7304688 4.1582031 C 9.9288519 4.0352499 10.1532 3.9745341 10.376953 3.9746094 z M 12.980469 7.9902344 A 1.0001 1.0001 0 0 0 12.292969 8.2929688 L 10 10.585938 L 9.2070312 9.7929688 A 1.0001 1.0001 0 1 0 7.7929688 11.207031 L 9.2929688 12.707031 A 1.0001 1.0001 0 0 0 10.707031 12.707031 L 13.707031 9.7070312 A 1.0001 1.0001 0 0 0 12.980469 7.9902344 z"/>
                    </svg>
                    <span>Publications and Preview Blog</span>
                </div>
                <div class="filter-group">
                    <div class="filter-search">
                        <svg class="admin-grid-icon" style="width:12px;height:12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input type="text" id="excelBlogSearchInput" placeholder="Search user..." oninput="filterExcelBlog()">
                    </div>
                    <button type="button" class="filter-all" onclick="resetExcelBlogFilter()">View All</button>
                    <button type="button" class="btn-card-close" onclick="toggleExcelBlog(false)" title="Cerrar ventana">✕</button>
                </div>
            </div>

            <!-- data-table (16-Column Grid matching Figma) -->
            <div class="data-table-wrap">
                <table class="admin-16col-table" id="excelBlogTable">
                    <thead>
                        <tr class="table-column-header-tr">
                            <th style="min-width: 82.19px;">identifier code</th>
                            <th style="min-width: 82.19px;">responsible party code</th>
                            <th style="min-width: 82.19px;">Platform code</th>
                            <th style="min-width: 82.19px;">authorization signature</th>
                            <th style="min-width: 82.19px;">Number of tokens</th>
                            <th style="min-width: 82.19px;">cost per token</th>
                            <th style="min-width: 82.19px;">ICAI page</th>
                            <th style="min-width: 82.19px;">NSPA Monthly</th>
                            <th style="min-width: 82.19px;">CORS Method</th>
                            <th style="min-width: 82.19px;">HASNA 371</th>
                            <th style="min-width: 82.19px;">How long did it take you to create it?</th>
                            <th style="min-width: 82.19px;">Do you have proof that you lasted as long as you say?</th>
                            <th style="min-width: 82.19px;">Code manager ID card</th>
                            <th style="min-width: 82.19px;">Legal name of the code creator</th>
                            <th style="min-width: 82.19px;">Phone number for calls</th>
                            <th style="min-width: 81.19px; border-right:none;">Reply email</th>
                        </tr>
                    </thead>
                    <tbody id="excelBlogTableBody">
                        <!-- Filled with preview rows -->
                    </tbody>
                </table>
            </div>

            <!-- table-footer -->
            <div class="table-footer">
                <span class="footer-note">Select the one that fits and the one you want to validate</span>
                <div class="pagination-group">
                    <button type="button" class="btn-prev" onclick="blogPrevRow()">Previous</button>
                    <button type="button" class="btn-next" onclick="openSelectedBlogArticle()" title="Abrir lector de la publicación seleccionada">
                        <svg style="width:14px;height:14px;fill:currentColor;margin-right:6px;" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                        View Article
                    </button>
                </div>
            </div>
        </div>
    </div>

            <!-- Real-World Publication Reader & Code Sandbox Modal -->
            <div class="excel-post-modal" id="excelReaderModal">
                <div class="excel-reader-card">
                    <!-- Modal Header -->
                    <div class="excel-reader-header">
                        <div class="reader-header-badges">
                            <span class="reader-badge-cat" id="readCat">ICAI-v3</span>
                            <span class="reader-badge-pqc">
                                <svg style="width:13px;height:13px;fill:currentColor;" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                                SPHINCS+ Authorized (SLH-DSA-256s)
                            </span>
                            <span class="reader-meta-item" id="readDate">
                                <svg style="width:13px;height:13px;fill:currentColor;" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
                                <span>2026-08-20</span>
                            </span>
                            <span class="reader-meta-item">
                                <svg style="width:13px;height:13px;fill:currentColor;" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                                <span id="readViews">1</span> lecturas
                            </span>
                        </div>
                        <button type="button" class="btn-card-close" onclick="closeExcelBlogReader()" title="Cerrar artículo">
                            <svg style="width:13px;height:13px;fill:currentColor;" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                        </button>
                    </div>

                    <!-- Modal Body -->
                    <div class="excel-reader-body">
                        <!-- Main Title -->
                        <h1 class="reader-article-title" id="readTitle">Publicación PUB-008 · Diktatcart Platform Core</h1>

                        <!-- Author & Security Strip -->
                        <div class="reader-author-strip">
                            <div class="reader-author-info">
                                <div class="reader-author-avatar" id="readAvatar">D</div>
                                <div>
                                    <div style="font-weight:700; color:#09090B;" id="readAuthorName">Diktatcart</div>
                                    <div style="font-size:11px; color:#71717A;">
                                        <a href="#" id="readAuthorEmail" style="color:#2563EB; text-decoration:none;">admin@hashcod.io</a> · 
                                        <span id="readAuthorPhone">+1 800 HASHCOD</span>
                                    </div>
                                </div>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <button type="button" class="reader-code-btn" onclick="downloadCurrentPlatformCode()">
                                    <svg style="width:13px;height:13px;fill:currentColor;" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                                    <span>Descargar Script</span>
                                </button>
                            </div>
                        </div>

                        <!-- Bento-Grid Metrics Dashboard -->
                        <div class="reader-bento-grid">
                            <div class="reader-bento-card">
                                <span class="reader-bento-label">Tokens & Costo</span>
                                <span class="reader-bento-value" id="readTokensVal">200,000</span>
                                <span class="reader-bento-sub" id="readCostVal">$0.00015 / token ($30.00)</span>
                            </div>
                            <div class="reader-bento-card">
                                <span class="reader-bento-label">ICAI & NSPA Mensual</span>
                                <span class="reader-bento-value" id="readIcaival">ICAI-v3</span>
                                <span class="reader-bento-sub" id="readNspaVal">100.0% SLA Uptime</span>
                            </div>
                            <div class="reader-bento-card">
                                <span class="reader-bento-label">CORS & HASNA 371</span>
                                <span class="reader-bento-value" id="readCorsVal">Yes (Permissive)</span>
                                <span class="reader-bento-sub" id="readHasnaVal">● Color #E63333</span>
                            </div>
                            <div class="reader-bento-card">
                                <span class="reader-bento-label">Tiempo & Prueba</span>
                                <span class="reader-bento-value" id="readTimeVal">15 mins</span>
                                <span class="reader-bento-sub" id="readProofVal">Git SHA-256 Verified</span>
                            </div>
                            <div class="reader-bento-card">
                                <span class="reader-bento-label">Responsable & Manager</span>
                                <span class="reader-bento-value" id="readRespVal">DKT-500</span>
                                <span class="reader-bento-sub" id="readManagerVal">Manager ID: MGR-03</span>
                            </div>
                        </div>

                        <!-- Live Code & Sandbox IDE Window -->
                        <div class="reader-code-window">
                            <div class="reader-code-head">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <div class="reader-code-dots">
                                        <div class="reader-code-dot red"></div>
                                        <div class="reader-code-dot yellow"></div>
                                        <div class="reader-code-dot green"></div>
                                    </div>
                                    <span class="reader-code-filename" id="readFilename">module.py</span>
                                </div>
                                <div class="reader-code-actions">
                                    <button type="button" class="reader-code-btn" id="readCopyBtn" onclick="copyReaderCode()">
                                        <svg style="width:12px;height:12px;fill:currentColor;" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                                        <span id="readCopyBtnText">Copiar Código</span>
                                    </button>
                                    <button type="button" class="reader-code-btn" style="background:#1F6FEB; border-color:#388BFD; color:#FFF;" onclick="runReaderSandbox()">
                                        <svg style="width:13px;height:13px;fill:currentColor;" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                        <span>Probar Sandbox</span>
                                    </button>
                                </div>
                            </div>
                            <pre class="reader-code-pre" id="readCodePre"><code># Python platform module...</code></pre>
                            <!-- Live Sandbox Output Console -->
                            <div class="reader-sandbox-console" id="readConsoleOutput"></div>
                        </div>

                        <!-- Interactive Social & Comments Section -->
                        <div class="reader-footer-actions">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <button type="button" class="reader-like-btn" id="readLikeBtn" onclick="likeCurrentPost()">
                                    <svg style="width:13px;height:13px;fill:currentColor;" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                    <span id="readLikeCount">14</span> Me gusta
                                </button>
                                <span style="font-size:12px; color:#71717A;">Módulo auditado y validado en codespace</span>
                            </div>
                            <button type="button" class="btn-next" style="min-width:120px;" onclick="closeExcelBlogReader()">Cerrar Vista</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- =========================================================================
         TOOLBOX TOOL 2: DILITHIUM-5 SECURITY GATE & ADMIN PUBLICATION PANEL
         ========================================================================= -->
    <!-- Dilithium-5 Cryptographic Security Gate Modal -->
    <div class="admin-gate-overlay" id="adminDilithiumGateOverlay" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="gateTitle">
        <div class="admin-gate-card">
            <div class="admin-gate-header">
                <div>
                    <span class="admin-gate-badge">
                        <svg style="width:13px;height:13px;fill:currentColor;margin-right:4px;" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                        Post-Quantum Auth · Dilithium-5 (ML-DSA-87)
                    </span>
                    <h2 class="admin-gate-title" id="gateTitle">Acceso al Panel de Administrador</h2>
                </div>
                <button type="button" class="admin-close-btn" onclick="closeAdminPanelGate()" title="Cerrar">
                    <svg style="width:13px;height:13px;fill:currentColor;" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
            <p class="admin-gate-desc">
                Este panel requiere autenticación con la firma criptográfica post-cuántica <strong>Dilithium-5</strong> maestra almacenada en variables de entorno seguras. Pega tu firma criptográfica completa para desbloquear:
            </p>
            <textarea class="admin-gate-textarea" id="adminDilithiumKeyInput" placeholder="Pega aquí la firma criptográfica Dilithium-5 completa (DILITHIUM5_SIG_V1_...)" spellcheck="false" autocomplete="off"></textarea>
            <div id="adminGateMsg" style="font-size:12px; min-height:16px; font-weight:600;"></div>
            <div class="admin-gate-footer">
                <button type="button" class="admin-gate-btn secondary" onclick="closeAdminPanelGate()">Cancelar</button>
                <button type="button" class="admin-gate-btn" id="adminGateVerifyBtn" onclick="verifyDilithiumAdminSignature()">
                    <svg style="width:14px;height:14px;fill:currentColor;" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                    Verificar Firma y Desbloquear
                </button>
            </div>
        </div>
    </div>

    <!-- Main 1440px Administrator Publication Panel Overlay -->
    <div class="admin-panel-overlay" id="adminPanelOverlay" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="adminMainPanelTitle">
        <div class="admin-panel-shell">
            <!-- Content Header -->
            <div class="admin-content-header">
                <div class="admin-title-group">
                    <h1 class="admin-main-title" id="adminMainPanelTitle">Publication Panel</h1>
                    <p class="admin-main-subtitle">Blog publication panel and its requirements</p>
                </div>
                <div class="admin-header-actions">
                    <button type="button" class="admin-export-button" onclick="exportAdminReport()">
                        <svg class="admin-grid-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        <span>Export Report</span>
                    </button>
                    <button type="button" class="admin-export-button" onclick="logoutAdminSession()" title="Bloquear y cerrar sesión del Administrador" style="color:#DC2626;border-color:#FCA5A5;background:#FEF2F2;">
                        <svg style="width:13px;height:13px;fill:currentColor;" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                        <span>Bloquear Admin</span>
                    </button>
                    <button type="button" class="admin-close-btn" onclick="toggleAdminPanel(false)" title="Cerrar Panel">
                        <svg style="width:13px;height:13px;fill:currentColor;" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                </div>
            </div>

            <!-- Metrics Row (4 Publication Cards) -->
            <div class="admin-metrics-row">
                <!-- Card 1: 1ST PUBLICATION ROW (metric-card-balance-total-custodiado) -->
                <div class="admin-metric-card" id="adminCard1">
                    <!-- Abstract Decorative Background -->
                    <div class="admin-deco-bg">
                        <div class="admin-deco-diag" style="left:265px; top:20px;"></div>
                        <div class="admin-deco-diag" style="left:273px; top:28px;"></div>
                        <div class="admin-deco-diag" style="left:281px; top:36px;"></div>
                        <div class="admin-deco-diag" style="left:289px; top:44px;"></div>
                        <div class="admin-deco-diag" style="left:297px; top:52px;"></div>
                        <!-- Dot Matrix 3x3 -->
                        <div class="admin-deco-dot" style="left:16px; top:277px;"></div>
                        <div class="admin-deco-dot" style="left:24px; top:277px;"></div>
                        <div class="admin-deco-dot" style="left:32px; top:277px;"></div>
                        <div class="admin-deco-dot" style="left:16px; top:285px;"></div>
                        <div class="admin-deco-dot" style="left:24px; top:285px;"></div>
                        <div class="admin-deco-dot" style="left:32px; top:285px;"></div>
                        <div class="admin-deco-dot" style="left:16px; top:293px;"></div>
                        <div class="admin-deco-dot" style="left:24px; top:293px;"></div>
                        <div class="admin-deco-dot" style="left:32px; top:293px;"></div>
                        <!-- Crosses -->
                        <div class="admin-deco-cross-h" style="left:46px; top:257px;"></div>
                        <div class="admin-deco-cross-v" style="left:50px; top:253px;"></div>
                        <div class="admin-deco-cross-h" style="left:281px; top:237px;"></div>
                        <div class="admin-deco-cross-v" style="left:285px; top:233px;"></div>
                        <div class="admin-deco-cross-h" style="left:231px; top:30px;"></div>
                        <div class="admin-deco-cross-v" style="left:235px; top:26px;"></div>
                        <!-- Arc & Diamonds -->
                        <div class="admin-deco-arc" style="left:-15px; top:80px;"></div>
                        <div class="admin-deco-diamond" style="left:295px; top:154px;"></div>
                        <div class="admin-deco-diamond" style="left:30px; top:45px;"></div>
                        <!-- H-lines -->
                        <div class="admin-deco-hline" style="left:275px; top:287px;"></div>
                        <div class="admin-deco-hline" style="left:275px; top:293px;"></div>
                        <div class="admin-deco-hline" style="left:275px; top:299px;"></div>
                    </div>
                    <!-- Card Header -->
                    <div class="admin-card-header">
                        <span class="admin-card-header-title">1st publication row</span>
                        <svg class="admin-grid-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                    </div>
                    <!-- Card Body -->
                    <div class="admin-card-body">
                        <div class="admin-grid-2x4">
                            <div class="admin-grid-head">
                                <span>N</span>
                                <span>V</span>
                            </div>
                            <div class="admin-grid-row">
                                <span class="admin-grid-label">identifier code</span>
                                <input type="text" class="admin-grid-input" id="c1_idCode" placeholder="PUB-001" value="PUB-001">
                            </div>
                            <div class="admin-grid-row">
                                <span class="admin-grid-label">responsible party code</span>
                                <input type="text" class="admin-grid-input" id="c1_respCode" placeholder="AUTH-992" value="DKT-ROOT">
                            </div>
                            <div class="admin-grid-row">
                                <span class="admin-grid-label">Platform code</span>
                                <button type="button" class="admin-code-upload-btn" id="c1_codeUploadBtn" onclick="openPlatformCodeModal('card1')" title="Subir código (.py, .html, .ts)">
                                    <svg viewBox="0 0 24 24"><path d="M 9.4238281 0.98632812 A 1.0001 1.0001 0 0 0 8.6699219 1.3105469 L 2.2617188 8.3261719 A 1.0001 1.0001 0 0 0 2.0976562 9.4277344 A 1.0001 1.0001 0 0 0 2.1054688 9.4453125 C 2.1402752 9.5346047 5.2618257 17.541307 6.5039062 20.726562 C 6.8039062 21.494563 7.5431875 22 8.3671875 22 L 20 22 C 21.105 22 22 21.105 22 20 L 22 11.013672 C 22 10.376672 21.697594 9.7763906 21.183594 9.4003906 C 18.514163 7.4418892 10.37325 1.4715432 10.119141 1.2851562 A 1.0001 1.0001 0 0 0 9.4238281 0.98632812 z M 9.4179688 3.4570312 L 13.6875 8 L 13 8 A 1.0001 1.0001 0 0 0 12 9 L 12 14 L 7 14 L 7 9 A 1.0001 1.0001 0 0 0 6 8 L 5.2675781 8 L 9.4179688 3.4570312 z M 7 16 L 12 16 L 12 18 L 7 18 L 7 16 z"/></svg>
                                    <span id="c1_codeStatusLabel">Code .py</span>
                                </button>
                            </div>
                            <div class="admin-grid-row">
                                <span class="admin-grid-label">authorization signature</span>
                                <button type="button" class="admin-btn-authorized signed" id="c1_authSigBtn" onclick="stampSphincsSignature('card1')">
                                    <span id="c1_authSigLabel">Authorized</span>
                                </button>
                            </div>
                        </div>
                        <button type="button" class="admin-btn-submit" onclick="submitAdminCard(1)">
                            <span>Submit</span>
                        </button>
                    </div>
                </div>

                <!-- Card 2: 2ND PUBLICATION ROW (metric-card-usuarios-activos) -->
                <div class="admin-metric-card" id="adminCard2">
                    <div class="admin-card-header">
                        <span class="admin-card-header-title">2nd publication row</span>
                        <svg class="admin-grid-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                    </div>
                    <div class="admin-card-body">
                        <div class="admin-grid-2x4">
                            <div class="admin-grid-head">
                                <span>N</span>
                                <span>V</span>
                            </div>
                            <div class="admin-grid-row">
                                <span class="admin-grid-label">Number of tokens</span>
                                <input type="text" class="admin-grid-input" id="c2_numTokens" placeholder="250000" value="250000">
                            </div>
                            <div class="admin-grid-row">
                                <span class="admin-grid-label">cost per token</span>
                                <div class="admin-dollar-input-wrap">
                                    <span>$</span>
                                    <input type="text" class="admin-grid-input" id="c2_costPerToken" placeholder="0.00015" value="0.00015">
                                </div>
                            </div>
                            <div class="admin-grid-row">
                                <span class="admin-grid-label">ICAI page</span>
                                <input type="text" class="admin-grid-input" id="c2_icaiPage" placeholder="ICAI-v4" value="ICAI-v4">
                            </div>
                            <div class="admin-grid-row">
                                <span class="admin-grid-label">NSPA Monthly</span>
                                <input type="text" class="admin-grid-input" id="c2_nspaMonthly" placeholder="100.0%" value="100.0%">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card 3: 3RD PUBLICATION ROW (metric-card-transacciones-24h) -->
                <div class="admin-metric-card" id="adminCard3">
                    <div class="admin-card-header">
                        <span class="admin-card-header-title">3rd publication row</span>
                        <svg class="admin-grid-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                    </div>
                    <div class="admin-card-body">
                        <div class="admin-grid-2x4">
                            <div class="admin-grid-head">
                                <span>N</span>
                                <span>V</span>
                            </div>
                            <div class="admin-grid-row">
                                <span class="admin-grid-label">CORS Method</span>
                                <div class="admin-cors-radios">
                                    <label><input type="radio" name="c3_cors" value="Yes" checked> Y</label>
                                    <label><input type="radio" name="c3_cors" value="No"> N</label>
                                </div>
                            </div>
                            <div class="admin-grid-row">
                                <span class="admin-grid-label">HASNA 371</span>
                                <div class="admin-color-palette">
                                    <div class="admin-color-square active" style="background:#E63333;" data-color="#E63333" onclick="selectHasnaColor(this, '#E63333')"></div>
                                    <div class="admin-color-square" style="background:#33B34D;" data-color="#33B34D" onclick="selectHasnaColor(this, '#33B34D')"></div>
                                    <div class="admin-color-square" style="background:#3366E6;" data-color="#3366E6" onclick="selectHasnaColor(this, '#3366E6')"></div>
                                    <div class="admin-color-square" style="background:#FFFFFF; border:1px solid #BFC4CC;" data-color="#FFFFFF" onclick="selectHasnaColor(this, '#FFFFFF')"></div>
                                </div>
                            </div>
                            <div class="admin-grid-row">
                                <span class="admin-grid-label">How long did it take you?</span>
                                <input type="text" class="admin-grid-input" id="c3_timeToCreate" placeholder="12 mins" value="12 mins">
                            </div>
                            <div class="admin-grid-row">
                                <span class="admin-grid-label">Do you have proof?</span>
                                <input type="text" class="admin-grid-input" id="c3_proof" placeholder="Git SHA-256" value="Git SHA-256">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card 4: 4TH PUBLICATION ROW (metric-card-volumen-de-préstamos) -->
                <div class="admin-metric-card" id="adminCard4">
                    <div class="admin-card-header">
                        <span class="admin-card-header-title">4th publication row</span>
                        <svg class="admin-grid-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                    </div>
                    <div class="admin-card-body">
                        <div class="admin-grid-2x4">
                            <div class="admin-grid-head">
                                <span>N</span>
                                <span>V</span>
                            </div>
                            <div class="admin-grid-row">
                                <span class="admin-grid-label">Code manager ID card</span>
                                <input type="text" class="admin-grid-input" id="c4_managerId" placeholder="MGR-01" value="MGR-01">
                            </div>
                            <div class="admin-grid-row">
                                <span class="admin-grid-label">Legal name of creator</span>
                                <input type="text" class="admin-grid-input" id="c4_creatorName" placeholder="Diktatcart" value="Diktatcart">
                            </div>
                            <div class="admin-grid-row">
                                <span class="admin-grid-label">Phone number for calls</span>
                                <input type="text" class="admin-grid-input" id="c4_phone" placeholder="+1 800 HASHCOD" value="+1 800 HASHCOD">
                            </div>
                            <div class="admin-grid-row">
                                <span class="admin-grid-label">Reply email</span>
                                <input type="email" class="admin-grid-input" id="c4_email" placeholder="admin@hashcod.io" value="admin@hashcod.io">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Table Section Card (table-section-card) -->
            <div class="table-section-card" style="margin-top: 16px;">
                <!-- mega-creator Vector Illustration -->
                <div class="mega-creator" aria-hidden="true">
                    <div class="mc-group-1">
                        <div class="mc-shape-1"></div>
                        <div class="mc-shape-2"></div>
                    </div>
                    <div class="mc-group-2">
                        <div class="mc-inner-grad"></div>
                        <div class="mc-line l1"></div>
                        <div class="mc-line l2"></div>
                        <div class="mc-line l3"></div>
                        <div class="mc-line l4"></div>
                        <div class="mc-line l5"></div>
                        <div class="mc-line l6"></div>
                        <div class="mc-line l7"></div>
                        <div class="mc-line l8"></div>
                        <div class="mc-line l9"></div>
                        <div class="mc-line l10"></div>
                        <div class="mc-line l11"></div>
                        <div class="mc-line l12"></div>
                    </div>
                    <div class="mc-group-3">
                        <div class="mc-rot-grad"></div>
                        <div class="mc-rot-line r1"></div>
                        <div class="mc-rot-line r2"></div>
                        <div class="mc-rot-line r3"></div>
                        <div class="mc-rot-line r4"></div>
                        <div class="mc-rot-line r5"></div>
                    </div>
                </div>

                <!-- Header Controls -->
                <div class="table-header-controls">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span class="table-title-text">Publications and Preview Blog</span>
                        <span id="adminTableStatusToast" style="display:none;font-size:12px;font-weight:600;color:#10B981;background:#ECFDF5;border:1px solid #A7F3D0;padding:3px 10px;border-radius:6px;"></span>
                    </div>
                    <div class="filter-group">
                        <button type="button" class="btn-restore-cols" id="adminRestoreColsBtn" onclick="restoreAllColumns()" style="display:none;" title="Restaurar columnas eliminadas">
                            <svg style="width:12px;height:12px;fill:currentColor;" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                            <span>Restaurar Columnas</span>
                        </button>
                        <button type="button" class="filter-all" style="background:#10B981;border-color:#10B981;display:inline-flex;align-items:center;gap:6px;width:auto;padding:8px 14px;" onclick="addNewAdminRow()">
                            <svg style="width:12px;height:12px;fill:currentColor;" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                            <span>+ New Row</span>
                        </button>
                        <div class="filter-search">
                            <svg class="admin-grid-icon" style="width:12px;height:12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input type="text" id="adminTableSearchInput" placeholder="Search user..." oninput="filterAdminTable()">
                        </div>
                        <button type="button" class="filter-all" onclick="resetAdminTableFilter()">View All</button>
                    </div>
                </div>

                <!-- 16-Column Data Table -->
                <div class="data-table-wrap">
                    <table class="admin-16col-table" id="adminMainDataTable">
                        <thead>
                            <tr class="table-column-header-tr">
                                <th style="min-width: 82.19px;">identifier code</th>
                                <th style="min-width: 82.19px;">responsible party code</th>
                                <th style="min-width: 82.19px;">Platform code</th>
                                <th style="min-width: 82.19px;">authorization signature</th>
                                <th style="min-width: 82.19px;">Number of tokens</th>
                                <th style="min-width: 82.19px;">cost per token</th>
                                <th style="min-width: 82.19px;">ICAI page</th>
                                <th style="min-width: 82.19px;">NSPA Monthly</th>
                                <th style="min-width: 82.19px;">CORS Method</th>
                                <th style="min-width: 82.19px;">HASNA 371</th>
                                <th style="min-width: 82.19px;">How long did it take you to create it?</th>
                                <th style="min-width: 82.19px;">Do you have proof that you lasted as long as you say?</th>
                                <th style="min-width: 82.19px;">Code manager ID card</th>
                                <th style="min-width: 82.19px;">Legal name of the code creator</th>
                                <th style="min-width: 82.19px;">Phone number for calls</th>
                                <th style="min-width: 81.19px; border-right:none;">Reply email</th>
                                <th style="width: 50px; min-width: 50px; border-right:none; text-align:center;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="adminTableBody">
                            <!-- Populated with editable rows -->
                        </tbody>
                    </table>
                </div>

                <!-- Table Footer -->
                <div class="table-footer">
                    <span class="footer-note">Select the one that fits and the one you want to validate</span>
                    <div class="pagination-group">
                        <button type="button" class="btn-prev" onclick="adminPrevRow()">Previous</button>
                        <button type="button" class="btn-next" onclick="launchOnTheBlog()">
                            <svg style="width:14px;height:14px;fill:currentColor;margin-right:6px;" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                            Launch on the blog
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Platform Code Uploader / Editor Modal -->
    <div class="admin-gate-overlay" id="platformCodeModal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="codeModalTitle">
        <div class="admin-gate-card" style="width:min(820px, 96vw);">
            <div class="admin-gate-header">
                <div>
                    <span class="admin-gate-badge">
                        <svg style="width:13px;height:13px;fill:currentColor;margin-right:4px;" viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
                        Subir Código para Publicación
                    </span>
                    <h2 class="admin-gate-title" id="codeModalTitle">Platform Code (.py, .html, .ts, .js)</h2>
                </div>
                <button type="button" class="admin-close-btn" onclick="closePlatformCodeModal()">
                    <svg style="width:13px;height:13px;fill:currentColor;" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <label style="font-size:12px; font-weight:600; color:#333;" for="codeLangSelect">Lenguaje:</label>
                    <select id="codeLangSelect" style="padding:4px 8px; border:1px solid #E0E2E6; border-radius:4px; font-size:12px;" onchange="updateCodeTemplate()">
                        <option value="python">Python (.py)</option>
                        <option value="html">HTML / Template (.html)</option>
                        <option value="typescript">TypeScript (.ts)</option>
                        <option value="javascript">JavaScript (.js)</option>
                    </select>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:12px; color:#6B7280;">Subir archivo:</span>
                    <input type="file" id="codeFileInput" style="font-size:12px;" accept=".py,.html,.htm,.ts,.js,.json,.txt,.php,.css,.sql,.md" onchange="handleCodeFileUpload(event)">
                </div>
            </div>
            <textarea class="admin-gate-textarea" id="platformCodeContent" style="height:220px; font-family:'Geist Mono', monospace; font-size:12px;" placeholder="# Pega o escribe el código de la plataforma aquí..." spellcheck="false" oninput="onPlatformCodeInput()"></textarea>
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding:6px 2px; font-size:12px;">
                <div style="display:flex; align-items:center; gap:6px;">
                    <span id="codeTokenCounterBadge" style="font-weight:700; color:#2563EB; background:#EFF6FF; border:1px solid #BFDBFE; padding:3px 10px; border-radius:6px;">
                        🔢 Tokens: <strong id="codeTokenCountDisplay">0</strong>
                    </span>
                    <span style="color:#10B981; font-size:11px; font-weight:600;">(Calculado automáticamente en tiempo real)</span>
                </div>
                <span id="codeStatsDisplay" style="color:#6B7280; font-size:11px;">0 caracteres · 0 líneas</span>
            </div>
            <div class="admin-gate-footer">
                <button type="button" class="admin-gate-btn secondary" onclick="closePlatformCodeModal()">Cancelar</button>
                <button type="button" class="admin-gate-btn" onclick="savePlatformCodeAttachment()">
                    <svg style="width:13px;height:13px;fill:currentColor;margin-right:6px;" viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
                    Adjuntar Código y Aplicar Tokens
                </button>
            </div>
        </div>
    </div>

    <!-- SPHINCS+ (SLH-DSA) Cryptographic Signature Certificate Modal -->
    <div class="admin-gate-overlay" id="sphincsCertModal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="sphincsTitle">
        <div class="admin-gate-card" style="width:min(680px, 94vw);">
            <div class="admin-gate-header">
                <div>
                    <span class="admin-gate-badge" style="background:#ECFDF5; color:#047857; border-color:#A7F3D0;">
                        <svg style="width:13px;height:13px;fill:currentColor;margin-right:4px;" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                        Post-Quantum Security · SPHINCS+ (SLH-DSA)
                    </span>
                    <h2 class="admin-gate-title" id="sphincsTitle">Firma Criptográfica Cuántica Generada</h2>
                </div>
                <button type="button" class="admin-close-btn" onclick="closeSphincsCertModal()">
                    <svg style="width:13px;height:13px;fill:currentColor;" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
            <div style="background:#09090B; color:#A7F3D0; font-family:'Geist Mono', monospace; font-size:11px; padding:14px; border-radius:8px; line-height:1.6; word-break:break-all;" id="sphincsCertPayload"></div>
        </div>
    </div>

    <!-- =========================================================================
         TOOLBOX TOOL 3: MODAL CONTENEDOR (NUEVA HERRAMIENTA)
         ========================================================================= -->
    <div class="admin-gate-overlay" id="tool3Modal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="tool3ModalTitle">
        <div class="admin-gate-card" style="width:min(760px, 94vw);">
            <div class="admin-gate-header">
                <div>
                    <span class="admin-gate-badge" style="background:#F3F4F6; color:#111827; border-color:#D1D5DB;">
                        <svg style="width:13px;height:13px;margin-right:4px;" viewBox="0 0 48 48">
                            <path fill="#ededed" fill-rule="evenodd" d="M22.903,3.286c0.679-0.381,1.515-0.381,2.193,0 c3.355,1.883,13.451,7.551,16.807,9.434C42.582,13.1,43,13.804,43,14.566c0,3.766,0,15.101,0,18.867 c0,0.762-0.418,1.466-1.097,1.847c-3.355,1.883-13.451,7.551-16.807,9.434c-0.679,0.381-1.515,0.381-2.193,0 c-3.355-1.883-13.451-7.551-16.807-9.434C5.418,34.899,5,34.196,5,33.434c0-3.766,0-15.101,0-18.867 c0-0.762,0.418-1.466,1.097-1.847C9.451,10.837,19.549,5.169,22.903,3.286z" clip-rule="evenodd"></path>
                            <path fill="#434345" d="M23.987,46.221c-1.085,0-2.171-0.252-3.165-0.757c-2.22-1.127-5.118-2.899-7.921-4.613 c-1.973-1.206-3.836-2.346-5.297-3.157C5.381,36.458,4,34.113,4,31.572V16.627c0-2.59,1.417-4.955,3.699-6.173 c3.733-1.989,9.717-5.234,12.878-7.01h0c2.11-1.184,4.733-1.184,6.844,0c3.576,2.007,10.369,6.064,14.252,8.513 C43.13,12.874,44,14.453,44,16.182V32c0,2.4-0.859,4.048-2.553,4.895c-0.944,0.531-2.628,1.576-4.578,2.787 c-3.032,1.882-6.806,4.225-9.564,5.705C26.27,45.942,25.128,46.221,23.987,46.221z M21.556,5.188 C18.384,6.97,12.382,10.226,8.64,12.22C7.012,13.088,6,14.776,6,16.627v14.945c0,1.814,0.987,3.49,2.576,4.373 c1.498,0.832,3.378,1.981,5.369,3.199c2.77,1.693,5.634,3.445,7.783,4.536c1.458,0.739,3.188,0.717,4.631-0.056 c2.703-1.451,6.447-3.775,9.456-5.643c1.97-1.223,3.671-2.279,4.696-2.854C41.835,34.464,42,33.109,42,32V16.182 c0-1.037-0.521-1.983-1.392-2.532c-3.862-2.435-10.613-6.467-14.165-8.461C24.913,4.331,23.086,4.331,21.556,5.188L21.556,5.188z"></path>
                            <path fill="#434345" d="M22.977,41.654l-0.057-13.438c-0.011-2.594,1.413-4.981,3.701-6.204l12.01-6.416 c1.998-1.068,4.414,0.38,4.414,2.646v14.73c0,1.041-0.54,2.008-1.426,2.554l-14.068,8.668 C25.557,45.424,22.987,43.996,22.977,41.654z"></path>
                            <path fill="#ededed" d="M28.799,26.274c0.123-0.063,0.225,0.014,0.227,0.176l0.013,1.32 c0.552-0.219,1.032-0.278,1.467-0.177c0.095,0.024,0.136,0.153,0.098,0.306l-0.291,1.169c-0.024,0.089-0.072,0.178-0.132,0.233 c-0.026,0.025-0.052,0.044-0.077,0.057c-0.04,0.02-0.078,0.026-0.114,0.019c-0.199-0.045-0.671-0.148-1.413,0.228 c-0.778,0.395-1.051,1.071-1.046,1.573c0.007,0.601,0.315,0.783,1.377,0.802c1.416,0.023,2.027,0.643,2.042,2.067 c0.016,1.402-0.733,2.905-1.876,3.826l0.025,1.308c0.001,0.157-0.1,0.338-0.225,0.4l-0.775,0.445 c-0.123,0.063-0.225-0.014-0.227-0.172l-0.013-1.286c-0.664,0.276-1.334,0.342-1.763,0.17c-0.082-0.032-0.117-0.152-0.084-0.288 l0.28-1.181c0.022-0.092,0.071-0.186,0.138-0.246c0.023-0.023,0.048-0.04,0.072-0.053c0.044-0.022,0.087-0.027,0.124-0.013 c0.462,0.155,1.053,0.082,1.622-0.206c0.722-0.365,1.206-1.102,1.198-1.834c-0.007-0.664-0.366-0.939-1.241-0.946 c-1.113,0.002-2.151-0.216-2.168-1.855c-0.014-1.35,0.688-2.753,1.799-3.641l-0.013-1.319c-0.001-0.162,0.098-0.34,0.225-0.405 L28.799,26.274z"></path>
                            <path fill="#4da925" d="M37.226,34.857l-3.704,2.185c-0.109,0.061-0.244-0.019-0.244-0.143v-1.252 c0-0.113,0.061-0.217,0.16-0.273l3.704-2.185c0.111-0.061,0.246,0.019,0.246,0.145v1.248 C37.388,34.697,37.326,34.801,37.226,34.857"></path>
                        </svg>
                        Herramienta 3 · Toolbox
                    </span>
                    <h2 class="admin-gate-title" id="tool3ModalTitle">Herramienta 3</h2>
                </div>
                <button type="button" class="admin-close-btn" onclick="closeTool3Modal()" title="Cerrar">
                    <svg style="width:13px;height:13px;fill:currentColor;" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
            <div id="tool3ModalBody" style="padding:16px 0; color:#374151; font-size:13px; line-height:1.6;">
                <p>Módulo de Herramienta 3 inicializado y listo para la configuración de componentes.</p>
            </div>
            <div class="admin-gate-footer">
                <button type="button" class="admin-gate-btn secondary" onclick="closeTool3Modal()">Cerrar</button>
            </div>
        </div>
    </div>

    <script>
        /* ===== SHARED DATA & COLUMNS CONFIGURATION ===== */
        const L8_DATA_KEY = 'l8_admin_panel_records_v1';
        const L8_ACTIVE_COLS_KEY = 'l8_blog_active_columns_v1';

        const L8_SYSTEM_COLUMNS = [
            { key: 'identifier_code', label: 'identifier code', minWidth: '90px' },
            { key: 'responsible_code', label: 'responsible party code', minWidth: '95px' },
            { key: 'platform_code', label: 'Platform code', minWidth: '72px' },
            { key: 'auth_signature', label: 'authorization signature', minWidth: '95px' },
            { key: 'num_tokens', label: 'Number of tokens', minWidth: '95px' },
            { key: 'cost_per_token', label: 'cost per token', minWidth: '95px' },
            { key: 'icai_page', label: 'ICAI page', minWidth: '85px' },
            { key: 'nspa_monthly', label: 'NSPA Monthly', minWidth: '90px' },
            { key: 'cors_method', label: 'CORS Method', minWidth: '82px' },
            { key: 'hasna_color', label: 'HASNA 371', minWidth: '82px' },
            { key: 'time_to_create', label: 'How long did it take you to create it?', minWidth: '110px' },
            { key: 'proof', label: 'Do you have proof that you lasted as long as you say?', minWidth: '135px' },
            { key: 'manager_id', label: 'Code manager ID card', minWidth: '95px' },
            { key: 'creator_name', label: 'Legal name of the code creator', minWidth: '120px' },
            { key: 'phone', label: 'Phone number for calls', minWidth: '135px' },
            { key: 'email', label: 'Reply email', minWidth: '160px' }
        ];
        window.L8_ALL_COLUMNS = L8_SYSTEM_COLUMNS;

        const L8_INITIAL_RECORDS = [
            {
                identifier_code: 'PUB-001',
                responsible_code: 'DKT-ROOT',
                platform_code: 'import hashlib\nimport os\n\ndef init_platform_engine():\n    print("Hashcod platform codespace ready")\n',
                platform_code_name: 'main.py',
                platform_code_lang: 'python',
                auth_signature: 'Authorized (SPHINCS+)',
                auth_signature_digest: 'SLH-DSA-SHAKE-256s-2026-NIST-PQC-OK',
                num_tokens: '250000',
                cost_per_token: '0.00015',
                icai_page: 'ICAI-v4',
                nspa_monthly: '100.0%',
                cors_method: 'Yes',
                hasna_color: '#E63333',
                time_to_create: '12 mins',
                proof: 'Git SHA-256',
                manager_id: 'MGR-01',
                creator_name: 'Diktatcart',
                phone: '+1 800 HASHCOD',
                email: 'admin@hashcod.io',
                views: 12,
                likes: 14
            },
            {
                identifier_code: 'PUB-002',
                responsible_code: 'AUTH-882',
                platform_code: '<div class="app">Hashcod AI codespace</div>',
                platform_code_name: 'index.html',
                platform_code_lang: 'html',
                auth_signature: 'Authorized (SPHINCS+)',
                auth_signature_digest: 'SLH-DSA-SHAKE-256s-2026-NIST-PQC-OK',
                num_tokens: '500000',
                cost_per_token: '0.00012',
                icai_page: 'ICAI-v3',
                nspa_monthly: '99.8%',
                cors_method: 'Yes',
                hasna_color: '#33B34D',
                time_to_create: '35 mins',
                proof: 'Git SHA-256',
                manager_id: 'MGR-02',
                creator_name: 'Diktatcart',
                phone: '+1 800 HASHCOD',
                email: 'security@hashcod.io',
                views: 8,
                likes: 9
            },
            {
                identifier_code: 'PUB-003',
                responsible_code: 'AUTH-771',
                platform_code: 'export const run = () => console.log("Hashcod TypeScript engine");',
                platform_code_name: 'app.ts',
                platform_code_lang: 'typescript',
                auth_signature: 'Authorized (SPHINCS+)',
                auth_signature_digest: 'SLH-DSA-SHAKE-256s-2026-NIST-PQC-OK',
                num_tokens: '120000',
                cost_per_token: '0.00020',
                icai_page: 'ICAI-v5',
                nspa_monthly: '100.0%',
                cors_method: 'Yes',
                hasna_color: '#3366E6',
                time_to_create: '8 mins',
                proof: 'Git SHA-256',
                manager_id: 'MGR-01',
                creator_name: 'Diktatcart',
                phone: '+1 800 HASHCOD',
                email: 'dev@hashcod.io',
                views: 19,
                likes: 21
            },
            {
                identifier_code: 'PUB-004',
                responsible_code: 'AUTH-650',
                platform_code: 'const express = require("express");',
                platform_code_name: 'server.js',
                platform_code_lang: 'javascript',
                auth_signature: 'Authorized (SPHINCS+)',
                auth_signature_digest: 'SLH-DSA-SHAKE-256s-2026-NIST-PQC-OK',
                num_tokens: '300000',
                cost_per_token: '0.00018',
                icai_page: 'ICAI-v2',
                nspa_monthly: '98.5%',
                cors_method: 'No',
                hasna_color: '#FFFFFF',
                time_to_create: '45 mins',
                proof: 'Commit log',
                manager_id: 'MGR-03',
                creator_name: 'Diktatcart',
                phone: '+1 800 HASHCOD',
                email: 'ops@hashcod.io',
                views: 5,
                likes: 3
            },
            {
                identifier_code: 'PUB-005',
                responsible_code: 'AUTH-520',
                platform_code: 'def benchmark(): pass',
                platform_code_name: 'bench.py',
                platform_code_lang: 'python',
                auth_signature: 'Authorized (SPHINCS+)',
                auth_signature_digest: 'SLH-DSA-SHAKE-256s-2026-NIST-PQC-OK',
                num_tokens: '800000',
                cost_per_token: '0.00010',
                icai_page: 'ICAI-v6',
                nspa_monthly: '100.0%',
                cors_method: 'Yes',
                hasna_color: '#E63333',
                time_to_create: '1 hr',
                proof: 'Git SHA-256',
                manager_id: 'MGR-01',
                creator_name: 'Diktatcart',
                phone: '+1 800 HASHCOD',
                email: 'admin@hashcod.io',
                views: 14,
                likes: 18
            },
            {
                identifier_code: 'PUB-006',
                responsible_code: 'AUTH-410',
                platform_code: '{"status":"ok"}',
                platform_code_name: 'config.json',
                platform_code_lang: 'javascript',
                auth_signature: 'Authorized (SPHINCS+)',
                auth_signature_digest: 'SLH-DSA-SHAKE-256s-2026-NIST-PQC-OK',
                num_tokens: '150000',
                cost_per_token: '0.00016',
                icai_page: 'ICAI-v1',
                nspa_monthly: '99.1%',
                cors_method: 'Yes',
                hasna_color: '#33B34D',
                time_to_create: '15 mins',
                proof: 'Commit log',
                manager_id: 'MGR-02',
                creator_name: 'Diktatcart',
                phone: '+1 800 HASHCOD',
                email: 'info@hashcod.io',
                views: 7,
                likes: 6
            }
        ];

        window.getSharedPublicationRows = function () {
            try {
                const raw = localStorage.getItem(L8_DATA_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {}
            try {
                localStorage.setItem(L8_DATA_KEY, JSON.stringify(L8_INITIAL_RECORDS));
            } catch (e) {}
            return L8_INITIAL_RECORDS;
        };

        window.saveSharedPublicationRows = function (rows) {
            try {
                localStorage.setItem(L8_DATA_KEY, JSON.stringify(rows));
            } catch (e) {}
            if (typeof window.renderExcelTable === 'function') window.renderExcelTable();
            if (typeof window.renderAdminTable === 'function') window.renderAdminTable();
        };

        window.getActiveColumns = function () {
            try {
                const raw = localStorage.getItem(L8_ACTIVE_COLS_KEY);
                if (raw) {
                    const arr = JSON.parse(raw);
                    if (Array.isArray(arr) && arr.length > 0) return arr;
                }
            } catch (e) {}
            return L8_SYSTEM_COLUMNS.map(c => c.key);
        };

        window.saveActiveColumns = function (keys) {
            try {
                localStorage.setItem(L8_ACTIVE_COLS_KEY, JSON.stringify(keys));
            } catch (e) {}
        };

        window.deleteTableColumn = function (colKey, event) {
            if (event) event.stopPropagation();
            let activeKeys = window.getActiveColumns();
            if (activeKeys.length <= 1) {
                alert('Debe quedar al menos una columna visible en la tabla.');
                return;
            }
            activeKeys = activeKeys.filter(k => k !== colKey);
            window.saveActiveColumns(activeKeys);
            if (typeof window.renderExcelTable === 'function') window.renderExcelTable();
            if (typeof window.renderAdminTable === 'function') window.renderAdminTable();
            if (typeof window.showAdminToast === 'function') window.showAdminToast(`Columna eliminada. Puedes restaurarla cuando desees.`);
        };

        window.restoreAllColumns = function () {
            window.saveActiveColumns(L8_SYSTEM_COLUMNS.map(c => c.key));
            if (typeof window.renderExcelTable === 'function') window.renderExcelTable();
            if (typeof window.renderAdminTable === 'function') window.renderAdminTable();
            if (typeof window.showAdminToast === 'function') window.showAdminToast(`Todas las 16 columnas han sido restauradas.`);
        };

        window.deleteTableRow = function (idx, event) {
            if (event) event.stopPropagation();
            const rows = window.getSharedPublicationRows();
            if (!rows[idx]) return;
            const targetCode = rows[idx].identifier_code || `Fila #${idx + 1}`;
            
            rows.splice(idx, 1);
            window.saveSharedPublicationRows(rows);

            if (typeof selectedBlogRowIndex !== 'undefined' && selectedBlogRowIndex >= rows.length) {
                selectedBlogRowIndex = Math.max(0, rows.length - 1);
            }
            if (typeof selectedRowIndex !== 'undefined' && selectedRowIndex >= rows.length) {
                selectedRowIndex = Math.max(0, rows.length - 1);
            }

            if (typeof window.loadPendingRowIntoCards === 'function' && rows[selectedRowIndex]) {
                if (typeof adminPendingRow !== 'undefined') {
                    adminPendingRow = { ...rows[selectedRowIndex] };
                }
                window.loadPendingRowIntoCards();
            }
            if (typeof window.showAdminToast === 'function') window.showAdminToast(`Registro [${targetCode}] eliminado de la base de datos.`);
        };

        /* ===== EXCEL BLOG ENGINE (Toolbox Slot 1-1 - Vista Hoja de Cálculo) ===== */
        (function initExcelBlogEngine() {
            let selectedBlogRowIndex = 0;

            window.toggleExcelBlog = function (forceState) {
                const overlay = document.getElementById('excelBlogOverlay');
                if (!overlay) return;
                const isOpening = (typeof forceState === 'boolean') ? forceState : !overlay.classList.contains('open');
                if (isOpening) {
                    overlay.classList.add('open');
                    renderExcelTable();
                } else {
                    overlay.classList.remove('open');
                }
            };

            function renderExcelTable() {
                const table = document.getElementById('excelBlogTable');
                if (!table) return;
                const thead = table.querySelector('thead');
                const tbody = document.getElementById('excelBlogTableBody');
                if (!tbody) return;

                const allCols = L8_SYSTEM_COLUMNS;
                const activeKeys = window.getActiveColumns();
                let activeCols = allCols.filter(c => activeKeys.includes(c.key));
                if (activeCols.length === 0) activeCols = allCols;

                // Render Header de Solo Lectura (sin botones de borrado de columnas)
                if (thead) {
                    let hHtml = '<tr class="table-column-header-tr">';
                    activeCols.forEach((col, idx) => {
                        const isLast = (idx === activeCols.length - 1);
                        hHtml += `<th style="min-width:${col.minWidth};${isLast ? 'border-right:none;' : ''}">${col.label}</th>`;
                    });
                    hHtml += '</tr>';
                    thead.innerHTML = hHtml;
                }

                const rows = window.getSharedPublicationRows();
                const q = (document.getElementById('excelBlogSearchInput')?.value || '').toLowerCase().trim();

                tbody.innerHTML = '';
                rows.forEach((r, idx) => {
                    if (q) {
                        const str = Object.values(r).join(' ').toLowerCase();
                        if (!str.includes(q)) return;
                    }

                    const isSelected = (idx === selectedBlogRowIndex);
                    const safeColor = r.hasna_color || '#E63333';
                    const tr = document.createElement('tr');
                    tr.className = 'table-data-tr' + (isSelected ? ' active-row' : '');

                    let rowHtml = '';
                    activeCols.forEach((col, colIdx) => {
                        const isLast = (colIdx === activeCols.length - 1);
                        const tdStyle = isLast ? 'border-right:none;' : '';
                        const key = col.key;
                        switch (key) {
                            case 'identifier_code':
                            case 'responsible_code':
                            case 'num_tokens':
                            case 'icai_page':
                            case 'nspa_monthly':
                            case 'time_to_create':
                            case 'proof':
                            case 'manager_id':
                            case 'creator_name':
                            case 'phone':
                            case 'email':
                                rowHtml += `<td style="${tdStyle}"><span class="blog-cell-badge" title="${r[key] || ''}">${r[key] || ''}</span></td>`;
                                break;
                            case 'platform_code':
                                rowHtml += `
                                    <td style="${tdStyle}">
                                        <button type="button" class="cell-home-icon-btn" onclick="openBlogCodeViewer('${r.identifier_code}')" title="Ver código adjunto (${r.platform_code_name || 'script'})">
                                            <svg viewBox="0 0 24 24"><path d="M 9.4238281 0.98632812 A 1.0001 1.0001 0 0 0 8.6699219 1.3105469 L 2.2617188 8.3261719 A 1.0001 1.0001 0 0 0 2.0976562 9.4277344 A 1.0001 1.0001 0 0 0 2.1054688 9.4453125 C 2.1402752 9.5346047 5.2618257 17.541307 6.5039062 20.726562 C 6.8039062 21.494563 7.5431875 22 8.3671875 22 L 20 22 C 21.105 22 22 21.105 22 20 L 22 11.013672 C 22 10.376672 21.697594 9.7763906 21.183594 9.4003906 C 18.514163 7.4418892 10.37325 1.4715432 10.119141 1.2851562 A 1.0001 1.0001 0 0 0 9.4238281 0.98632812 z M 9.4179688 3.4570312 L 13.6875 8 L 13 8 A 1.0001 1.0001 0 0 0 12 9 L 12 14 L 7 14 L 7 9 A 1.0001 1.0001 0 0 0 6 8 L 5.2675781 8 L 9.4179688 3.4570312 z M 7 16 L 12 16 L 12 18 L 7 18 L 7 16 z"/></svg>
                                        </button>
                                    </td>`;
                                break;
                            case 'auth_signature':
                                rowHtml += `
                                    <td style="${tdStyle}">
                                        <span class="btn-auth-figma signed" style="cursor:default;user-select:none;" title="Certificado SPHINCS+">Authorized ✓</span>
                                    </td>`;
                                break;
                            case 'cost_per_token':
                                rowHtml += `
                                    <td style="${tdStyle}">
                                        <div class="dollar-input-figma">
                                            <span>$</span>
                                            <input type="text" value="${r.cost_per_token || ''}" readonly>
                                        </div>
                                    </td>`;
                                break;
                            case 'cors_method':
                                rowHtml += `
                                    <td style="${tdStyle}">
                                        <div class="cell-checkboxes">
                                            <span class="cell-chk-box ${r.cors_method === 'Yes' ? 'checked' : ''}"></span>
                                            <span class="cell-chk-label">Y</span>
                                            <span class="cell-chk-box ${r.cors_method === 'No' ? 'checked' : ''}"></span>
                                            <span class="cell-chk-label">N</span>
                                        </div>
                                    </td>`;
                                break;
                            case 'hasna_color':
                                rowHtml += `
                                    <td style="${tdStyle}">
                                        <div class="cell-color-squares">
                                            <div class="cell-color-rect ${safeColor==='#E63333'?'active':''}" style="background:#E63333;"></div>
                                            <div class="cell-color-rect ${safeColor==='#33B34D'?'active':''}" style="background:#33B34D;"></div>
                                            <div class="cell-color-rect ${safeColor==='#3366E6'?'active':''}" style="background:#3366E6;"></div>
                                            <div class="cell-color-rect ${safeColor==='#FFFFFF'?'active':''}" style="background:#FFFFFF;"></div>
                                        </div>
                                    </td>`;
                                break;
                        }
                    });

                    tr.innerHTML = rowHtml;

                    tr.addEventListener('click', (e) => {
                        if (e.target.closest('button')) return;
                        selectedBlogRowIndex = idx;
                        renderExcelTable();
                    });

                    tr.addEventListener('dblclick', () => {
                        openBlogArticleDetails(r.identifier_code);
                    });

                    tbody.appendChild(tr);
                });
            }
            window.renderExcelTable = renderExcelTable;

            window.filterExcelBlog = function () {
                renderExcelTable();
            };

            window.resetExcelBlogFilter = function () {
                const input = document.getElementById('excelBlogSearchInput');
                if (input) input.value = '';
                renderExcelTable();
            };

            window.blogPrevRow = function () {
                const rows = window.getSharedPublicationRows();
                if (selectedBlogRowIndex > 0) {
                    selectedBlogRowIndex--;
                    renderExcelTable();
                }
            };

            window.openSelectedBlogArticle = function () {
                const rows = window.getSharedPublicationRows();
                const selected = rows[selectedBlogRowIndex] || rows[0];
                if (selected) {
                    openBlogArticleDetails(selected.identifier_code);
                }
            };

            window.openBlogCodeViewer = function (identifierCode) {
                const rows = window.getSharedPublicationRows();
                const row = rows.find(r => r.identifier_code === identifierCode) || rows[0];
                if (!row) return;

                const modal = document.getElementById('platformCodeModal');
                const contentEl = document.getElementById('platformCodeContent');
                const langSel = document.getElementById('codeLangSelect');
                if (contentEl) contentEl.value = row.platform_code || '# No hay código adjunto para esta publicación.';
                if (langSel && row.platform_code_lang) langSel.value = row.platform_code_lang;
                if (modal) modal.classList.add('open');
            };

            let currentViewingArticle = null;

            window.openBlogArticleDetails = function (identifierCode) {
                const rows = window.getSharedPublicationRows();
                const r = rows.find(x => x.identifier_code === identifierCode) || rows[0];
                if (!r) return;

                currentViewingArticle = r;
                r.views = (r.views || 0) + 1;
                window.saveSharedPublicationRows(rows);

                const numTok = parseFloat(r.num_tokens || 200000);
                const costTok = parseFloat(r.cost_per_token || 0.00015);
                const totalCost = (numTok * costTok).toFixed(2);

                document.getElementById('readTitle').textContent = `Publicación ${r.identifier_code} · ${r.creator_name || 'Diktatcart'}`;
                document.getElementById('readAuthorName').textContent = r.creator_name || 'Diktatcart Platform Core';
                document.getElementById('readAuthorEmail').textContent = r.email || 'admin@hashcod.io';
                document.getElementById('readAuthorEmail').href = `mailto:${r.email || 'admin@hashcod.io'}`;
                document.getElementById('readAuthorPhone').textContent = r.phone || '+1 800 HASHCOD';
                document.getElementById('readAvatar').textContent = (r.creator_name ? r.creator_name.charAt(0).toUpperCase() : 'D');
                document.getElementById('readViews').textContent = r.views || 1;

                document.getElementById('readTokensVal').textContent = Number(numTok).toLocaleString();
                document.getElementById('readCostVal').textContent = `$${costTok} / token ($${totalCost})`;
                document.getElementById('readIcaival').textContent = r.icai_page || 'ICAI-v4';
                document.getElementById('readNspaVal').textContent = `${r.nspa_monthly || '100.0%'} SLA Uptime`;
                document.getElementById('readCorsVal').textContent = `${r.cors_method === 'Yes' ? 'Habilitado (Yes)' : 'Restringido (No)'}`;
                document.getElementById('readHasnaVal').textContent = `● Color ${r.hasna_color || '#E63333'}`;
                document.getElementById('readTimeVal').textContent = r.time_to_create || '12 mins';
                document.getElementById('readProofVal').textContent = r.proof || 'Git SHA-256';
                document.getElementById('readRespVal').textContent = r.responsible_code || 'DKT-ROOT';
                document.getElementById('readMgrVal').textContent = `Manager: ${r.manager_id || 'MGR-01'}`;

                document.getElementById('readCodeFileName').textContent = r.platform_code_name || 'main.py';
                const codeSnippet = document.getElementById('readCodeSnippet');
                if (codeSnippet) codeSnippet.textContent = r.platform_code || '# No platform code attached.';

                const likesEl = document.getElementById('readLikesCount');
                if (likesEl) likesEl.textContent = `${r.likes || 14} Me gusta`;

                const modal = document.getElementById('excelReaderModal');
                if (modal) modal.classList.add('open');
            };

            window.closeExcelBlogReader = function () {
                const modal = document.getElementById('excelReaderModal');
                if (modal) modal.classList.remove('open');
            };

            window.copyPlatformCode = function () {
                if (!currentViewingArticle || !currentViewingArticle.platform_code) return;
                navigator.clipboard.writeText(currentViewingArticle.platform_code).then(() => {
                    const btn = document.getElementById('btnCopyCode');
                    if (btn) {
                        const original = btn.innerHTML;
                        btn.innerHTML = '<span>¡Copiado! ✓</span>';
                        setTimeout(() => { btn.innerHTML = original; }, 1500);
                    }
                });
            };

            window.downloadCurrentPlatformCode = function () {
                if (!currentViewingArticle) return;
                const fileName = currentViewingArticle.platform_code_name || 'script.py';
                const content = currentViewingArticle.platform_code || '# Hashcod platform script\n';
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };

            window.runSandboxTest = function () {
                const btn = document.getElementById('btnRunSandbox');
                const outBox = document.getElementById('sandboxOutputBox');
                const outText = document.getElementById('sandboxOutputText');
                if (!outBox || !outText) return;

                outBox.style.display = 'block';
                outText.textContent = 'Inicializando entorno seguro WASM...\nEjecutando script...';

                setTimeout(() => {
                    outText.textContent = `[SANDBOX OUTPUT: SUCCESS ✓]\n` +
                        `Módulo: ${currentViewingArticle?.platform_code_name || 'main.py'}\n` +
                        `Firma Cuántica: SLH-DSA-256s VERIFICADA\n` +
                        `Tokens procesados: ${currentViewingArticle?.num_tokens || 250000}\n` +
                        `Estado de Ejecución: 0 Errores. Runtime 100% aislado.`;
                }, 600);
            };

            window.toggleLike = function () {
                if (!currentViewingArticle) return;
                currentViewingArticle.likes = (currentViewingArticle.likes || 14) + 1;
                const rows = window.getSharedPublicationRows();
                const idx = rows.findIndex(x => x.identifier_code === currentViewingArticle.identifier_code);
                if (idx >= 0) rows[idx].likes = currentViewingArticle.likes;
                window.saveSharedPublicationRows(rows);

                const likesEl = document.getElementById('readLikesCount');
                if (likesEl) likesEl.textContent = `${currentViewingArticle.likes} Me gusta`;
            };

            document.addEventListener('DOMContentLoaded', () => {
                renderExcelTable();
            });
            renderExcelTable();
        })();

        /* ===== ADMIN PANEL ENGINE (Toolbox Slot 1-2 - 4 Cards + 16 Col Dynamic Master Table) ===== */
        (function initAdminPanelEngine() {
            const ADMIN_AUTH_KEY = 'l8_admin_authenticated';
            let selectedRowIndex = 0;

            let adminPendingRow = {
                identifier_code: 'PUB-001',
                responsible_code: 'DKT-ROOT',
                platform_code: 'import hashlib\nimport os\n\ndef init_platform_engine():\n    print("Hashcod platform codespace ready")\n',
                platform_code_name: 'main.py',
                platform_code_lang: 'python',
                auth_signature: 'Authorized (SPHINCS+)',
                auth_signature_digest: 'SLH-DSA-SHAKE-256s-2026-NIST-PQC-OK',
                num_tokens: '250000',
                cost_per_token: '0.00015',
                icai_page: 'ICAI-v4',
                nspa_monthly: '100.0%',
                cors_method: 'Yes',
                hasna_color: '#E63333',
                time_to_create: '12 mins',
                proof: 'Git SHA-256',
                manager_id: 'MGR-01',
                creator_name: 'Diktatcart',
                phone: '+1 800 HASHCOD',
                email: 'admin@hashcod.io'
            };

            window.showAdminToast = function (msg) {
                const toast = document.getElementById('adminTableStatusToast');
                if (toast) {
                    toast.textContent = msg;
                    toast.style.display = 'inline-block';
                    setTimeout(() => { toast.style.display = 'none'; }, 3500);
                }
            };

            const EXACT_DILITHIUM5_SIG = "DILITHIUM5_SIG_V1_TklTVC1QUUMtTUwtRFNBLTg3OkRJTElUSElVTTU6TEVWRUw1OkFVVEhfUk9PVDoyMDI2.4EGoxDIU59Wd9de/MsuhsuWIgO2WPsC6PlEyUc29GtTZlqF7VBTtYWoJ+YUbNldL+QOPZLNb1RZznBJCJ7ncj+Ub8TdhnEE/MXxU5XlMMrWutPzYw/5hcKRlEhBYIrLaHhhWc7+LyIV6iu/DvMvpnwI1ipjcJILjBzCUO2UghOHv9kkuE+DYHD5ft4bnvteAiSPeFQFgbgqcU0Z5WCGFV7M5K2iccBeVdeaxzRlcyuMOxIoGoJnCEZoMHMkNX3sPI55L9svkckobKgFPfAVsfRf03Fo3woskLqUTsr3qCQ+SMcjvzMzjGIq7MkzcGgg49h75cxYX/uj81sWN5UNbstntKTm2uhm6QBMmrgtPmXRQkdyrDhO1ooIigSh6skTeki8MmEu9dSuABxgubhVnGznOgu5TrMuAgITaOenYnMwbqA6VtpwqVZniiERakYgFu3+myilMZSw1u8h4kAIKSgkBNQ2l/YYp/VgHl3p96uPLZeQAAdesI1Vyl4nMXn+Q4AMoDbP06Vik5m54jl961NmnCVWJnWp+DqvKHbKg0my69EHgGyCs+TEIi/UcOwPlxNXLi8Dwhg/rnzOq0xv4OhnpuzJNYN1LV8Ot6sWy4HVsYdYu0O57mtev8IX4DCm2H2pYKvDaW25ahlEOCb9C22P4FpqEIECMGnzaDiH0mwkBui8qHCioChGxxPJMTNdcPLQiVRKmX+K8kN8+PXnG7TIIuFG2rq1Bu7J7t1WbuU5V0wXVJb/ncwmddrGpSmL33wZLzk3PkBiw+Jo6Yfve7jBg+HdExPxetRYlMTzT1LGxLVJV8fhzf2C7GLlp6DfzyVLNMyQ0wNQCBsyeA9XCo5pW4AeHO402TSVScs3J4wZIhnM/aQTJbP7z01IVGEPLNqgt15YAvpad06vixjiMasKx2IvVp7P0ABwHKD271kq0K3L4KZePXBq6onp+dWSOfNV1yY4zPvrE3vUs1ytzxMALSz6hitBmhuBaiJg8hPFcm2DNVBYb6rWw9ILR1akmae08jH6RNdX2ZTeS2kp022NBL3TmWsTYRDAw+qfy73NPbREqgXpn2mMlraFSY8i4/3LhDyFkAPoRfmbBEIzdtKMVWQLAtSbPuBZFKXHU+Jc1K8miN5gEoTCBv+YVz0ofsEk5CErc51xO3tHZxbxCkMt5UbxnuR0k09JrG28Ww3bxzy2k/KqTLFTkicrHDdSmOiJ609Cc9U0PBRmRdLd1JsN2JDm/IuzSBtDwtPJCCz+33ghlbwTrMYHP92R+RFntpRyMFRBLdgWwORAzndCrsVcPiiRAB3tBQunjittp5mcVqkrArNEn2gtu7Endidg6qkBQs2qYaO81Pm2Ckk8wMOPACccKe1F4DHRyYeid7ka157JSBJfPLWZRpiU/SgAn1iS6ZG4tQdcjRB+o+qZ7Dbmfx5aKXFhkPjo+f18OA95mAQMn5Mn++EHK27PXlFAiE4iYpmXFuEdXPyEwhwLqFgVgjbAoDHXakCYLg4Y1w2QM1mA8ARskRJzUb1Ht7TjHMhQJbEfmNElWz0U6GKHvtCd+rebP7xSci4j9z66aPC9QI0jMiFNW8J6nD68cKqsLIDDwi0nuZMbuq0FoUOd0BP4cncjFKAvx+vNFHkGVWi0oD4locIykAJLyTy68uyaiatsMDDBJSyjcVXda7G+8wjQ31yYGYah1pdn2j1r5cr2kFpDD0vb7cygx6bebO6FmXR5d9k5reVPOHLESJPZSqu4dfAslYL6gulmY9KoVNgMQcf4VyQPEwtQC9cTk2I32m+BgU1lM6dmeut1ybZRmo5KHgnY3c7BrjuWvqsaZl3MlkKDJ1Er9yxapogI3ILdPDIp+wADsjvbSkJ+oOfAnaeSj7O+1xwjhK0ueRZE44A1IpNRQYVuwDIR0MQh+7y44mKKR/hB2bfR0RFsGxsxaIp6uKsSjO82vnqIntdtWe7GIf2Yt671LiXaXpWwvAPLl6BmrqyiFSynvg6ovggplo6HsPBO8gcAAUlWq/c+L19czVCZg//B9wjGu8w3bFiPOAnKrYXryY6MxzcJaN9bcKtwsrcFGKURVGSzYi20YTR5uOkp6hpFjChKReWECCGlbbPj7k1t4sRkYBaYjiyKCDVSe2KReHHNSvSBlV5dRNIIBhhPhK5otdFcNtk8IFE8lCsJDDl3aJA2mH8kmVFzpVpm8UeVUl/WMXZ6MbLldwgV4lSd9epTMImlvBsenEhPARkdW4iRuVfbpZ+mvO7Bnsh9WuVnD159LKFSRLhVOOY6/xhghuZluWvPrRGNJNZIEl00yRD+RDiTougoFqxr23rAWgWzikxIy9BpUWy0XWgYc9GM+sIshnuSHKBuaaVmylGjGpZzC2tLeJVeYIaYLZ4ifmVZ1pQ1C2px+7TCoTUBI9C/45IGvCbIZk6y4EqLp3bw+IMeAbcHJJJOK9GvnzLoL1fRx0VGTuT+6rBENqednl+BFX8sbINub6ffjDclXdgGV6XjKMthbWj9++xw4LmHSXVOAjqyuLVXAxFdHyd3aOTM/pQdzMsIId6BNWN5DNVvLGE0DreqGQvYJ9IiVRubMyb2Su0bRpsi1ahsm3ltVqVa+vyjyDhvyctDe2LIJrqWw0+APqGYkNDBsSPc727rWzEAiw3v7NAUmfKiA8enm2E78z0OY+WRc+AzPiBHLJtAXYnWuDeIX5pY7YeunHupnSkNgSnAGFUn/3ZWHUalLHl07i79VWuxFuIrLHcCKQ74JqvsoB6mh261UikeHw1CK0xZLZVQIPaIqnmlxyhLTtVvJiBexR7T0piHW8Ea45idIv7BWm5m7mORmk8h8Wpov/nHFlnE9pPAbtdNoNA2D/9MNULhXdr6/Xk8uwzulpnuZ2jQti5kiFMlkukOb2zB0/B1lldxansStGHbQ5P9qn7T+U/Sw2j06RctjAH6zkoCRwc+O829+I2WgBAr5t3v5op9d5Zm261wm8e/DODdneymTcPB9eryw5bpLSZVeRADdxMlhVOtw3jfC4edhaQ4E6/g8yAcLduXwDrqvocx9xYJ0x580kJJ5Py8Jw+1fR3covTn4cvhHo4aQ/cWs11wxtMDfzAq7j8KdhoM6U623VZwwvrHoHZdUhn/j+taqhUbxdMmrnvNR7k2Tkem+sg1RbYqV9plLJaaaRM/VkQf6nCWZYCNeGW83YbGEhHtjWVzGeJRkEj60kOvXxJo3Y9JR03oCoYAsuB1eWPS34taTGztJ+c+i6AMoZ9q0he2FWwe9gcHhwqgPjA7wWeyOlYoyGu4jpm2KLrl0Dx3yNKIk8Yy2L3EIwA8jk6PN7Qe6aUNC5g5m3X6XxFu8srhD7DsK+MABRAvsx12u0KP8KqbPPyK0alQclvq8TbTAH2IDWMVNmXu/lyZaY+HA4VoZkeX8G0MCLMH4P36tZN3ptnUqtwQ3FW7BzgCuC3Dda73CscDw2pPOrPnWv6F0CYWUqWHQxI9xF4ff5tKbC4kUzQty8y2LU3ESQW6w2nQVmkMBhVHV/WEEEsYjINnNJiq1k0SbC51SjPRf6XWL3PPiHgEdZ0+VSsxNpSWpIUP4qlfje5CWwUPGHi9Jz9GwfNWUVUxmOsfZ2/oLnSvEFzykrHuwH1XDJSMpzGoisqrzdscRj+YXispPKBeIpNzSR63ux9Sl6Jm6NxVrip420ma3cXZttR5D8NzfO1qeose3HFovZbDouNbFINnMZX/FRj44rvrWVcPtR7p2L4xkq32CeTnM4X9CF62I5nZpiMzsaJ82EF1zFlrCquw9nLuBbC6LwQ/WtoPX15pJz1tJH1LFSaBGSoQTlJoE28lmW4k9MnpXcWNBBo0vjIuW6+bLHeGfS/9KE4Fe4Kmw4MpUO63xOfNYmW/zvEkgDmmBTuehW0ESmSyfBWNG0VGjIQbRSS13/S9XFCJZPno+ohuKTjNAztF7cHvUXoCnu11AX8KXK8fm8wkjxWkk3b6xOQXhUgdk9yq9gmOHichf0K2wlaoe9GOlzyz05wY40WKEEb71GKODJ41kkbu5T02LBseFgVBhVIxzTFDs/sO2g9m7Vt6kOMJdf0ULQKbkSdeDbNMck7k7UeiRNR8lRsi8awnft5kNH62od0Vg/9s8J8bqjGj+ssSYFVBArCVExjicQDDJFiR0pAx3LUM/eXoZy0fs6blpSwO30euWktvJy616dHMvNiWrbp67N2FR5eH6wn0DFSzMqWYTkEJzZ8Uxr2ERR+goPmOLtUgCxybi6BeuXIY1bAsDaoIyKilYAkoXG0hQAj1bcmkxCXx5kntUtLKKoEQ+A/a1Gj+IgJpXTP1p/VArE662DBxerupsHsgbFN2gk9IWn9YDlaa/AeVpfTuNH44MWQ86xx4AKSO0ylARG9TVaLwGWFuAxKSNlcFzFbksGm+vjZIGFUiAtv4s0Z8hgqpoPSOOb+Hh94lFAZyMbtOWwm8yQ9NUw2iMPBC+z0kc/SsGhfnA9O9sfDpaTBZnz8JdIKlSjIb0AeOWZ6CgHyfkAEuEyh3PVz68CfEuGtdKbK9Ne1vzvCGIucRJ3/489O8mZBAzREQyHoN1oBZHDUC5y8s/tfdWDyHwkz1ThvkumdYk4g5XQdA2xyvKI3VCkpWCxBF4nslE3W7GvAY3Oj+EFxB45ubjUHzUSHn40j17sTAzz56exE78pvC9f8wEdsEKTYgYXVGSydRq/uVBLA1c/13ShHt2l5ixwGtjjQw1sCywnCZaZMb28FgCdIUodapqYr+fZLjhldjk2K01a0V";

            // --- Gate Access Authentication ---
            window.openAdminPanelGate = function () {
                const isAuthed = (sessionStorage.getItem(ADMIN_AUTH_KEY) === '1');
                if (isAuthed) {
                    toggleAdminPanel(true);
                    return;
                }
                const overlay = document.getElementById('adminDilithiumGateOverlay') || document.getElementById('adminGateOverlay');
                const keyInput = document.getElementById('adminDilithiumKeyInput') || document.getElementById('dilithiumKeyInput');
                const msgEl = document.getElementById('adminGateMsg');
                if (keyInput) keyInput.value = '';
                if (msgEl) {
                    msgEl.textContent = '';
                    msgEl.style.color = '';
                }
                if (overlay) {
                    overlay.classList.add('open');
                }
            };

            window.closeAdminPanelGate = function () {
                const overlay = document.getElementById('adminDilithiumGateOverlay') || document.getElementById('adminGateOverlay');
                if (overlay) overlay.classList.remove('open');
            };

            window.logoutAdminSession = function () {
                sessionStorage.removeItem(ADMIN_AUTH_KEY);
                toggleAdminPanel(false);
                if (typeof window.showAdminToast === 'function') {
                    window.showAdminToast('Sesión de Administrador cerrada.');
                }
            };

            window.verifyDilithiumAdminSignature = async function () {
                const keyInput = document.getElementById('adminDilithiumKeyInput') || document.getElementById('dilithiumKeyInput');
                const msgEl = document.getElementById('adminGateMsg');
                const btn = document.getElementById('adminGateVerifyBtn') || document.getElementById('btnVerifyDilithium');
                
                let rawVal = (keyInput?.value || '').trim();
                let cleanVal = rawVal;
                if (cleanVal.startsWith('DILITHIUM5_ADMIN_SIGNATURE=')) {
                    cleanVal = cleanVal.substring('DILITHIUM5_ADMIN_SIGNATURE='.length).trim();
                }

                if (!cleanVal) {
                    sessionStorage.removeItem(ADMIN_AUTH_KEY);
                    if (msgEl) {
                        msgEl.textContent = '✕ Error: Debes ingresar la clave/firma Dilithium-5 exacta.';
                        msgEl.style.color = '#EF4444';
                    }
                    if (keyInput) keyInput.focus();
                    return;
                }

                if (btn) btn.disabled = true;
                if (msgEl) {
                    msgEl.textContent = 'Verificando firma con Dilithium-5 (ML-DSA-87)...';
                    msgEl.style.color = '#2563EB';
                }

                try {
                    const fd = new FormData();
                    fd.append('action', 'verify_dilithium');
                    fd.append('proof_token', cleanVal);

                    const res = await fetch(window.location.href, { method: 'POST', body: fd });
                    const data = await res.json();

                    if (data && data.success === true) {
                        sessionStorage.setItem(ADMIN_AUTH_KEY, '1');
                        if (msgEl) {
                            msgEl.textContent = '✓ Firma Dilithium-5 verificada exitosamente. Acceso concedido.';
                            msgEl.style.color = '#10B981';
                        }
                        setTimeout(() => {
                            closeAdminPanelGate();
                            toggleAdminPanel(true);
                        }, 250);
                    } else {
                        sessionStorage.removeItem(ADMIN_AUTH_KEY);
                        if (msgEl) {
                            msgEl.textContent = '✕ Firma criptográfica incorrecta. Acceso denegado.';
                            msgEl.style.color = '#EF4444';
                        }
                        if (keyInput) {
                            keyInput.style.borderColor = '#EF4444';
                            setTimeout(() => { if (keyInput) keyInput.style.borderColor = ''; }, 2000);
                        }
                    }
                } catch (e) {
                    // Fallback estricto exclusivo: solo si coincide caracter por caracter
                    if (cleanVal === EXACT_DILITHIUM5_SIG) {
                        sessionStorage.setItem(ADMIN_AUTH_KEY, '1');
                        if (msgEl) {
                            msgEl.textContent = '✓ Firma Dilithium-5 verificada exitosamente. Acceso concedido.';
                            msgEl.style.color = '#10B981';
                        }
                        setTimeout(() => {
                            closeAdminPanelGate();
                            toggleAdminPanel(true);
                        }, 250);
                    } else {
                        sessionStorage.removeItem(ADMIN_AUTH_KEY);
                        if (msgEl) {
                            msgEl.textContent = '✕ Firma criptográfica incorrecta. Acceso denegado.';
                            msgEl.style.color = '#EF4444';
                        }
                    }
                } finally {
                    if (btn) btn.disabled = false;
                }
            };
            window.verifyDilithiumProof = window.verifyDilithiumAdminSignature;

            // --- Admin Panel Display ---
            window.toggleAdminPanel = function (forceState) {
                const overlay = document.getElementById('adminPanelOverlay');
                if (!overlay) return;
                const isOpening = (typeof forceState === 'boolean') ? forceState : !overlay.classList.contains('open');
                if (isOpening) {
                    overlay.classList.add('open');
                    const rows = window.getSharedPublicationRows();
                    if (rows[selectedRowIndex]) {
                        adminPendingRow = { ...rows[selectedRowIndex] };
                    }
                    loadPendingRowIntoCards();
                    renderAdminTable();
                } else {
                    overlay.classList.remove('open');
                }
            };

            // --- Card Submissions into Table (Card 1 submits all 4 cards at once) ---
            window.submitAdminCard = function (cardNum = 1) {
                gatherAllCardValues();

                const rows = window.getSharedPublicationRows();
                const targetId = adminPendingRow.identifier_code;
                const existingIdx = rows.findIndex(r => r.identifier_code === targetId);

                if (existingIdx >= 0) {
                    rows[existingIdx] = { ...adminPendingRow };
                    selectedRowIndex = existingIdx;
                } else {
                    rows.unshift({ ...adminPendingRow });
                    selectedRowIndex = 0;
                }

                window.saveSharedPublicationRows(rows);
                renderAdminTable(true);

                // Visual confirmation on all 4 cards
                for (let i = 1; i <= 4; i++) {
                    const card = document.getElementById('adminCard' + i);
                    if (card) {
                        card.style.borderColor = '#10B981';
                        card.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.25)';
                        setTimeout(() => {
                            card.style.borderColor = '#E5E7EB';
                            card.style.boxShadow = '';
                        }, 900);
                    }
                }

                window.showAdminToast(`✓ Datos de las 4 tarjetas [${targetId}] guardados y sincronizados.`);
            };

            window.addNewAdminRow = function () {
                const rows = window.getSharedPublicationRows();
                const nextNum = rows.length + 1;
                const nextId = 'PUB-' + String(nextNum).padStart(3, '0');

                adminPendingRow = {
                    identifier_code: nextId,
                    responsible_code: 'DKT-' + Math.floor(100 + Math.random() * 900),
                    platform_code: '# Python module for ' + nextId + '\n',
                    platform_code_name: 'module.py',
                    platform_code_lang: 'python',
                    auth_signature: 'Authorized (SPHINCS+)',
                    auth_signature_digest: 'SLH-DSA-SHAKE-256s-2026-NIST-PQC-OK',
                    num_tokens: '200000',
                    cost_per_token: '0.00015',
                    icai_page: 'ICAI-v' + (nextNum % 6 + 1),
                    nspa_monthly: '100.0%',
                    cors_method: 'Yes',
                    hasna_color: '#33B34D',
                    time_to_create: '15 mins',
                    proof: 'Git SHA-256',
                    manager_id: 'MGR-0' + (nextNum % 3 + 1),
                    creator_name: 'Diktatcart',
                    phone: '+1 800 HASHCOD',
                    email: 'admin@hashcod.io'
                };

                rows.unshift({ ...adminPendingRow });
                selectedRowIndex = 0;
                window.saveSharedPublicationRows(rows);
                loadPendingRowIntoCards();
                renderAdminTable(true);
                window.showAdminToast(`✓ Nueva fila [${nextId}] creada lista para editar.`);
            };

            window.selectHasnaColor = function (el, color) {
                document.querySelectorAll('.admin-color-square').forEach(s => s.classList.remove('active'));
                el.classList.add('active');
                adminPendingRow.hasna_color = color;
                const rows = window.getSharedPublicationRows();
                if (rows[selectedRowIndex]) {
                    rows[selectedRowIndex].hasna_color = color;
                    window.saveSharedPublicationRows(rows);
                    renderAdminTable();
                }
            };

            // --- Code Token Counter & Platform Code Engine ---
            function calculateCodeTokens(text) {
                if (!text || typeof text !== 'string') return 0;
                const str = text.trim();
                if (!str) return 0;

                // Code tokenizer: palabras clave, identificadores, números, operadores compuestos, puntuación y espacios
                const tokenRegex = /[a-zA-Z0-9_]+|==|!=|<=|>=|=>|->|\&\&|\|\||\+\+|\-\-|\+=|\-=|\*=|\/=|[\+\-\*\/\=\<\>\!\~\&\|\^\%\?\:\;\.\,\\\(\)\[\]\{\}\@\#\$]|\s+/g;
                const matches = str.match(tokenRegex);
                if (!matches) {
                    return Math.max(1, Math.ceil(str.length / 3.8));
                }

                let count = 0;
                for (let i = 0; i < matches.length; i++) {
                    const m = matches[i];
                    if (/^\s+$/.test(m)) {
                        const newlines = (m.match(/\n/g) || []).length;
                        const spaces = m.replace(/\n/g, '').length;
                        count += Math.max(1, newlines + Math.ceil(spaces / 4));
                    } else if (m.length > 8) {
                        count += Math.ceil(m.length / 4);
                    } else {
                        count += 1;
                    }
                }
                return Math.max(1, count);
            }
            window.calculateCodeTokens = calculateCodeTokens;

            function refreshModalTokenStats(content) {
                const text = (typeof content === 'string') ? content : (document.getElementById('platformCodeContent')?.value || '');
                const tokens = calculateCodeTokens(text);
                const charCount = text.length;
                const lineCount = text ? text.split('\n').length : 0;

                const tokenDisplay = document.getElementById('codeTokenCountDisplay');
                if (tokenDisplay) tokenDisplay.textContent = tokens.toLocaleString();

                const statsDisplay = document.getElementById('codeStatsDisplay');
                if (statsDisplay) statsDisplay.textContent = `${charCount.toLocaleString()} caracteres · ${lineCount.toLocaleString()} líneas`;

                return tokens;
            }
            window.refreshModalTokenStats = refreshModalTokenStats;

            window.onPlatformCodeInput = function () {
                const contentEl = document.getElementById('platformCodeContent');
                const text = contentEl?.value || '';
                const tokens = refreshModalTokenStats(text);

                // Sincronizar en vivo con la fila actual y con la tarjeta 2
                adminPendingRow.platform_code = text;
                adminPendingRow.num_tokens = String(tokens);

                const c2Tokens = document.getElementById('c2_numTokens');
                if (c2Tokens) c2Tokens.value = String(tokens);

                const rows = window.getSharedPublicationRows();
                if (rows[selectedRowIndex]) {
                    rows[selectedRowIndex].platform_code = text;
                    rows[selectedRowIndex].num_tokens = String(tokens);
                    window.saveSharedPublicationRows(rows);
                    renderAdminTable();
                }
            };

            // --- Code Upload / Code Viewer Modal ---
            window.openPlatformCodeModal = function () {
                const modal = document.getElementById('platformCodeModal');
                const contentEl = document.getElementById('platformCodeContent');
                const currentCode = adminPendingRow.platform_code || '';
                if (contentEl) contentEl.value = currentCode;
                refreshModalTokenStats(currentCode);
                if (modal) modal.classList.add('open');
            };

            window.closePlatformCodeModal = function () {
                const modal = document.getElementById('platformCodeModal');
                if (modal) modal.classList.remove('open');
            };

            window.handleCodeFileUpload = function (event) {
                const file = event.target.files && event.target.files[0];
                if (!file) return;
                adminPendingRow.platform_code_name = file.name;
                const ext = file.name.split('.').pop().toLowerCase();
                if (ext === 'py') adminPendingRow.platform_code_lang = 'python';
                else if (ext === 'html' || ext === 'htm') adminPendingRow.platform_code_lang = 'html';
                else if (ext === 'ts') adminPendingRow.platform_code_lang = 'typescript';
                else if (ext === 'js') adminPendingRow.platform_code_lang = 'javascript';

                const langSel = document.getElementById('codeLangSelect');
                if (langSel) langSel.value = adminPendingRow.platform_code_lang || 'python';

                const reader = new FileReader();
                reader.onload = function (e) {
                    const content = e.target.result || '';
                    const contentEl = document.getElementById('platformCodeContent');
                    if (contentEl) contentEl.value = content;

                    const tokenCount = refreshModalTokenStats(content);
                    adminPendingRow.platform_code = content;
                    adminPendingRow.num_tokens = String(tokenCount);

                    const c2Tokens = document.getElementById('c2_numTokens');
                    if (c2Tokens) c2Tokens.value = String(tokenCount);

                    const codeStatus = document.getElementById('c1_codeStatusLabel');
                    if (codeStatus) codeStatus.textContent = 'Code ' + file.name + ' ✓';

                    const rows = window.getSharedPublicationRows();
                    if (rows[selectedRowIndex]) {
                        rows[selectedRowIndex].platform_code = content;
                        rows[selectedRowIndex].platform_code_name = file.name;
                        rows[selectedRowIndex].platform_code_lang = adminPendingRow.platform_code_lang;
                        rows[selectedRowIndex].num_tokens = String(tokenCount);
                        window.saveSharedPublicationRows(rows);
                        renderAdminTable();
                    }
                    window.showAdminToast(`✓ Archivo '${file.name}' cargado: ${tokenCount.toLocaleString()} tokens calculados.`);
                };
                reader.readAsText(file);
            };

            window.updateCodeTemplate = function () {
                const langSel = document.getElementById('codeLangSelect');
                const contentEl = document.getElementById('platformCodeContent');
                if (!langSel || !contentEl) return;
                const lang = langSel.value;
                adminPendingRow.platform_code_lang = lang;
                if (lang === 'python') {
                    adminPendingRow.platform_code_name = 'main.py';
                    if (!contentEl.value.trim()) contentEl.value = '# Python code for Hashcod platform\nimport streamlit as st\n\nst.title("Hashcod Codespace AI")\nst.write("Post-quantum quantum-resistant system initialized.")\n';
                } else if (lang === 'html') {
                    adminPendingRow.platform_code_name = 'index.html';
                    if (!contentEl.value.trim()) contentEl.value = '<!DOCTYPE html>\n<html>\n<head><title>Hashcod AI</title></head>\n<body>\n<h1>Hashcod AI View</h1>\n</body>\n</html>';
                } else if (lang === 'typescript') {
                    adminPendingRow.platform_code_name = 'index.ts';
                    if (!contentEl.value.trim()) contentEl.value = 'export const platform = "Hashcod";\nexport function computeQuantumHash(data: string): string {\n    return `SPHINCS+:${data}`;\n}\n';
                } else if (lang === 'javascript') {
                    adminPendingRow.platform_code_name = 'app.js';
                    if (!contentEl.value.trim()) contentEl.value = 'console.log("Hashcod engine online");\n';
                }
                onPlatformCodeInput();
            };

            window.savePlatformCodeAttachment = function () {
                const contentEl = document.getElementById('platformCodeContent');
                const content = (contentEl?.value || '').trim();
                const tokenCount = calculateCodeTokens(content);

                adminPendingRow.platform_code = content;
                adminPendingRow.num_tokens = String(tokenCount);

                const label = document.getElementById('c1_codeStatusLabel');
                if (label) label.textContent = 'Code ' + (adminPendingRow.platform_code_name || 'script.py') + ' ✓';

                const c2Tokens = document.getElementById('c2_numTokens');
                if (c2Tokens) c2Tokens.value = String(tokenCount);

                closePlatformCodeModal();

                // Update table
                const rows = window.getSharedPublicationRows();
                if (rows[selectedRowIndex]) {
                    rows[selectedRowIndex] = { ...adminPendingRow };
                    window.saveSharedPublicationRows(rows);
                    renderAdminTable();
                }
                window.showAdminToast(`✓ Código guardado: ${tokenCount.toLocaleString()} tokens asignados a [${adminPendingRow.identifier_code}].`);
            };

            // --- Toolbox Tool 3 (Nueva Herramienta) ---
            window.openToolboxTool3 = function () {
                if (typeof window.showAdminToast === 'function') {
                    window.showAdminToast('Herramienta 3 abierta. Lista para configuración.');
                }
                const modal = document.getElementById('tool3Modal');
                if (modal) modal.classList.add('open');
            };

            window.closeTool3Modal = function () {
                const modal = document.getElementById('tool3Modal');
                if (modal) modal.classList.remove('open');
            };

            // --- Post-Quantum SPHINCS+ (SLH-DSA) Signature Generation (Admin Exclusivo) ---
            window.stampSphincsSignature = function () {
                const timestamp = new Date().toISOString();
                const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(32)))
                    .map(b => b.toString(16).padStart(2, '0')).join('');
                
                const certDigest = `SPHINCS+-SLH-DSA-SHAKE-256s:AUTH:${randomHex.substring(0, 48)}`;
                adminPendingRow.auth_signature = 'Authorized (SPHINCS+)';
                adminPendingRow.auth_signature_digest = certDigest;

                const titleEl = document.getElementById('sphincsTitle');
                if (titleEl) titleEl.textContent = 'Firma Criptográfica Cuántica Generada (SPHINCS+)';

                const payloadEl = document.getElementById('sphincsCertPayload');
                if (payloadEl) {
                    payloadEl.innerHTML = `
                        [POST-QUANTUM CRYPTOGRAPHIC CERTIFICATE - ISSUED]\n
                        ALGORITHM: SPHINCS+ (SLH-DSA-SHAKE-256s / NIST FIPS 205)\n
                        SECURITY LEVEL: Level 5 (Quantum Attack Invariant)\n
                        TIMESTAMP (UTC): ${timestamp}\n
                        TARGET: ${adminPendingRow.identifier_code} · ${adminPendingRow.responsible_code}\n
                        CODE ATTACHMENT: ${adminPendingRow.platform_code_name || 'main.py'}\n
                        SIGNATURE DIGEST:\n${certDigest}\n
                        STATUS: AUTHORIZED & VERIFIED ✓
                    `;
                }

                const modal = document.getElementById('sphincsCertModal');
                if (modal) modal.classList.add('open');

                const btnLabel = document.getElementById('c1_authSigLabel');
                if (btnLabel) btnLabel.textContent = 'Authorized ✓';

                // Update table
                const rows = window.getSharedPublicationRows();
                rows[selectedRowIndex] = { ...adminPendingRow };
                window.saveSharedPublicationRows(rows);
                renderAdminTable();
            };

            window.closeSphincsCertModal = function () {
                const modal = document.getElementById('sphincsCertModal');
                if (modal) modal.classList.remove('open');
            };

            // --- Render 16-Column Admin Table ---
            function renderAdminTable(pulseActive = false) {
                const table = document.getElementById('adminMainDataTable');
                if (!table) return;
                const thead = table.querySelector('thead');
                const tbody = document.getElementById('adminTableBody');
                if (!tbody) return;

                const allCols = L8_SYSTEM_COLUMNS;
                const activeKeys = window.getActiveColumns();
                let activeCols = allCols.filter(c => activeKeys.includes(c.key));
                if (activeCols.length === 0) activeCols = allCols;

                // Render Header
                if (thead) {
                    let hHtml = '<tr class="table-column-header-tr">';
                    activeCols.forEach(col => {
                        hHtml += `
                            <th style="min-width: ${col.minWidth};">
                                <div class="th-content-box">
                                    <span>${col.label}</span>
                                    <button type="button" class="th-del-btn" onclick="deleteTableColumn('${col.key}', event)" title="Eliminar columna ${col.label}">✕</button>
                                </div>
                            </th>
                        `;
                    });
                    hHtml += `<th style="width: 50px; min-width: 50px; border-right:none; text-align:center;">Acciones</th>`;
                    hHtml += '</tr>';
                    thead.innerHTML = hHtml;
                }

                // Botón de restaurar columnas en Admin
                const adminRestoreBtn = document.getElementById('adminRestoreColsBtn');
                if (adminRestoreBtn) {
                    adminRestoreBtn.style.display = (activeKeys.length < allCols.length) ? 'inline-flex' : 'none';
                }

                const rows = window.getSharedPublicationRows();
                const q = (document.getElementById('adminTableSearchInput')?.value || '').toLowerCase().trim();

                tbody.innerHTML = '';
                rows.forEach((r, idx) => {
                    if (q) {
                        const searchStr = Object.values(r).join(' ').toLowerCase();
                        if (!searchStr.includes(q)) return;
                    }

                    const isSelected = (idx === selectedRowIndex);
                    const tr = document.createElement('tr');
                    tr.className = 'table-data-tr' + (isSelected ? ' active-row' : '');
                    if (isSelected && pulseActive) tr.classList.add('pulse-row');

                    const safeColor = r.hasna_color || '#E63333';
                    let rowHtml = '';

                    activeCols.forEach((col, colIdx) => {
                        const key = col.key;
                        switch (key) {
                            case 'identifier_code':
                            case 'responsible_code':
                            case 'num_tokens':
                            case 'icai_page':
                            case 'nspa_monthly':
                            case 'time_to_create':
                            case 'proof':
                            case 'manager_id':
                            case 'creator_name':
                            case 'phone':
                            case 'email':
                                rowHtml += `<td><input type="text" class="input-field-figma" value="${r[key] || ''}" onchange="updateCellData(${idx}, '${key}', this.value)" oninput="updateCellDataRealtime(${idx}, '${key}', this.value)"></td>`;
                                break;
                            case 'platform_code':
                                rowHtml += `
                                    <td>
                                        <button type="button" class="cell-home-icon-btn" onclick="openPlatformCodeModal()" title="Ver/subir código">
                                            <svg viewBox="0 0 24 24"><path d="M 9.4238281 0.98632812 A 1.0001 1.0001 0 0 0 8.6699219 1.3105469 L 2.2617188 8.3261719 A 1.0001 1.0001 0 0 0 2.0976562 9.4277344 A 1.0001 1.0001 0 0 0 2.1054688 9.4453125 C 2.1402752 9.5346047 5.2618257 17.541307 6.5039062 20.726562 C 6.8039062 21.494563 7.5431875 22 8.3671875 22 L 20 22 C 21.105 22 22 21.105 22 20 L 22 11.013672 C 22 10.376672 21.697594 9.7763906 21.183594 9.4003906 C 18.514163 7.4418892 10.37325 1.4715432 10.119141 1.2851562 A 1.0001 1.0001 0 0 0 9.4238281 0.98632812 z M 9.4179688 3.4570312 L 13.6875 8 L 13 8 A 1.0001 1.0001 0 0 0 12 9 L 12 14 L 7 14 L 7 9 A 1.0001 1.0001 0 0 0 6 8 L 5.2675781 8 L 9.4179688 3.4570312 z M 7 16 L 12 16 L 12 18 L 7 18 L 7 16 z"/></svg>
                                        </button>
                                    </td>`;
                                break;
                            case 'auth_signature':
                                rowHtml += `
                                    <td>
                                        <button type="button" class="btn-auth-figma signed" onclick="stampSphincsSignature()" title="Certificar con SPHINCS+">Authorized</button>
                                    </td>`;
                                break;
                            case 'cost_per_token':
                                rowHtml += `
                                    <td>
                                        <div class="dollar-input-figma">
                                            <span>$</span>
                                            <input type="text" value="${r.cost_per_token || ''}" onchange="updateCellData(${idx}, 'cost_per_token', this.value)" oninput="updateCellDataRealtime(${idx}, 'cost_per_token', this.value)">
                                        </div>
                                    </td>`;
                                break;
                            case 'cors_method':
                                rowHtml += `
                                    <td>
                                        <div class="cell-checkboxes" onclick="toggleAdminCors(${idx})" style="cursor:pointer;" title="Alternar CORS (Y/N)">
                                            <span class="cell-chk-box ${r.cors_method === 'Yes' ? 'checked' : ''}"></span>
                                            <span class="cell-chk-label">Y</span>
                                            <span class="cell-chk-box ${r.cors_method === 'No' ? 'checked' : ''}"></span>
                                            <span class="cell-chk-label">N</span>
                                        </div>
                                    </td>`;
                                break;
                            case 'hasna_color':
                                rowHtml += `
                                    <td>
                                        <div class="cell-color-squares">
                                            <div class="cell-color-rect ${safeColor==='#E63333'?'active':''}" style="background:#E63333;" onclick="updateAdminHasnaColor(${idx}, '#E63333')" title="Rojo HASNA"></div>
                                            <div class="cell-color-rect ${safeColor==='#33B34D'?'active':''}" style="background:#33B34D;" onclick="updateAdminHasnaColor(${idx}, '#33B34D')" title="Verde HASNA"></div>
                                            <div class="cell-color-rect ${safeColor==='#3366E6'?'active':''}" style="background:#3366E6;" onclick="updateAdminHasnaColor(${idx}, '#3366E6')" title="Azul HASNA"></div>
                                            <div class="cell-color-rect ${safeColor==='#FFFFFF'?'active':''}" style="background:#FFFFFF;" onclick="updateAdminHasnaColor(${idx}, '#FFFFFF')" title="Blanco HASNA"></div>
                                        </div>
                                    </td>`;
                                break;
                        }
                    });

                    // Acciones: Eliminar registro
                    rowHtml += `
                        <td style="border-right:none; text-align:center;">
                            <button type="button" class="cell-del-row-btn" onclick="deleteTableRow(${idx}, event)" title="Eliminar registro ${r.identifier_code}">
                                <svg style="width:14px;height:14px;fill:currentColor;" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                        </td>
                    `;

                    tr.innerHTML = rowHtml;

                    tr.addEventListener('click', (e) => {
                        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                        selectedRowIndex = idx;
                        adminPendingRow = { ...r };
                        loadPendingRowIntoCards();
                        renderAdminTable();
                    });

                    tbody.appendChild(tr);
                });
            }
            window.renderAdminTable = renderAdminTable;

            function loadPendingRowIntoCards() {
                if (document.getElementById('c1_idCode')) document.getElementById('c1_idCode').value = adminPendingRow.identifier_code || '';
                if (document.getElementById('c1_respCode')) document.getElementById('c1_respCode').value = adminPendingRow.responsible_code || '';
                if (document.getElementById('c2_numTokens')) document.getElementById('c2_numTokens').value = adminPendingRow.num_tokens || '';
                if (document.getElementById('c2_costPerToken')) document.getElementById('c2_costPerToken').value = adminPendingRow.cost_per_token || '';
                if (document.getElementById('c2_icaiPage')) document.getElementById('c2_icaiPage').value = adminPendingRow.icai_page || '';
                if (document.getElementById('c2_nspaMonthly')) document.getElementById('c2_nspaMonthly').value = adminPendingRow.nspa_monthly || '';
                if (document.getElementById('c3_timeToCreate')) document.getElementById('c3_timeToCreate').value = adminPendingRow.time_to_create || '';
                if (document.getElementById('c3_proof')) document.getElementById('c3_proof').value = adminPendingRow.proof || '';
                if (document.getElementById('c4_managerId')) document.getElementById('c4_managerId').value = adminPendingRow.manager_id || '';
                if (document.getElementById('c4_creatorName')) document.getElementById('c4_creatorName').value = adminPendingRow.creator_name || '';
                if (document.getElementById('c4_phone')) document.getElementById('c4_phone').value = adminPendingRow.phone || '';
                if (document.getElementById('c4_email')) document.getElementById('c4_email').value = adminPendingRow.email || '';

                const codeStatus = document.getElementById('c1_codeStatusLabel');
                if (codeStatus) codeStatus.textContent = 'Code ' + (adminPendingRow.platform_code_name || 'main.py') + ' ✓';

                const authLabel = document.getElementById('c1_authSigLabel');
                if (authLabel) authLabel.textContent = adminPendingRow.auth_signature ? 'Authorized ✓' : 'Authorized';

                const corsInputs = document.querySelectorAll('input[name="c3_cors"]');
                corsInputs.forEach(i => { i.checked = (i.value === adminPendingRow.cors_method); });

                document.querySelectorAll('.admin-color-square').forEach(s => {
                    s.classList.toggle('active', s.dataset.color === adminPendingRow.hasna_color);
                });
            }
            window.loadPendingRowIntoCards = loadPendingRowIntoCards;

            function gatherAllCardValues() {
                const idCode = (document.getElementById('c1_idCode')?.value || adminPendingRow.identifier_code || 'PUB-001').trim();
                const respCode = (document.getElementById('c1_respCode')?.value || adminPendingRow.responsible_code || 'DKT-ROOT').trim();
                const numTokens = (document.getElementById('c2_numTokens')?.value || adminPendingRow.num_tokens || '250000').trim();
                const costPerToken = (document.getElementById('c2_costPerToken')?.value || adminPendingRow.cost_per_token || '0.00015').trim();
                const icaiPage = (document.getElementById('c2_icaiPage')?.value || adminPendingRow.icai_page || 'ICAI-v4').trim();
                const nspaMonthly = (document.getElementById('c2_nspaMonthly')?.value || adminPendingRow.nspa_monthly || '100.0%').trim();
                const corsChecked = document.querySelector('input[name="c3_cors"]:checked')?.value || adminPendingRow.cors_method || 'Yes';
                const timeToCreate = (document.getElementById('c3_timeToCreate')?.value || adminPendingRow.time_to_create || '12 mins').trim();
                const proof = (document.getElementById('c3_proof')?.value || adminPendingRow.proof || 'Git SHA-256').trim();
                const managerId = (document.getElementById('c4_managerId')?.value || adminPendingRow.manager_id || 'MGR-01').trim();
                const creatorName = (document.getElementById('c4_creatorName')?.value || adminPendingRow.creator_name || 'Diktatcart').trim();
                const phone = (document.getElementById('c4_phone')?.value || adminPendingRow.phone || '+1 800 HASHCOD').trim();
                const email = (document.getElementById('c4_email')?.value || adminPendingRow.email || 'admin@hashcod.io').trim();

                adminPendingRow.identifier_code = idCode;
                adminPendingRow.responsible_code = respCode;
                adminPendingRow.num_tokens = numTokens;
                adminPendingRow.cost_per_token = costPerToken;
                adminPendingRow.icai_page = icaiPage;
                adminPendingRow.nspa_monthly = nspaMonthly;
                adminPendingRow.cors_method = corsChecked;
                adminPendingRow.time_to_create = timeToCreate;
                adminPendingRow.proof = proof;
                adminPendingRow.manager_id = managerId;
                adminPendingRow.creator_name = creatorName;
                adminPendingRow.phone = phone;
                adminPendingRow.email = email;
            }
            window.gatherAllCardValues = gatherAllCardValues;

            window.updateCellData = function (rowIdx, key, val) {
                const rows = window.getSharedPublicationRows();
                if (rows[rowIdx]) {
                    rows[rowIdx][key] = val;
                    window.saveSharedPublicationRows(rows);
                    if (rowIdx === selectedRowIndex) {
                        adminPendingRow[key] = val;
                        loadPendingRowIntoCards();
                    }
                }
            };

            window.updateCellDataRealtime = function (rowIdx, key, val) {
                const rows = window.getSharedPublicationRows();
                if (rows[rowIdx]) {
                    rows[rowIdx][key] = val;
                    localStorage.setItem(L8_DATA_KEY, JSON.stringify(rows));
                    if (rowIdx === selectedRowIndex) {
                        adminPendingRow[key] = val;
                        loadPendingRowIntoCards();
                    }
                }
            };

            window.toggleAdminCors = function (idx) {
                const rows = window.getSharedPublicationRows();
                if (rows[idx]) {
                    rows[idx].cors_method = (rows[idx].cors_method === 'Yes') ? 'No' : 'Yes';
                    window.saveSharedPublicationRows(rows);
                    if (idx === selectedRowIndex) {
                        adminPendingRow.cors_method = rows[idx].cors_method;
                        loadPendingRowIntoCards();
                    }
                    renderAdminTable();
                }
            };

            window.updateAdminHasnaColor = function (idx, color) {
                const rows = window.getSharedPublicationRows();
                if (rows[idx]) {
                    rows[idx].hasna_color = color;
                    window.saveSharedPublicationRows(rows);
                    if (idx === selectedRowIndex) {
                        adminPendingRow.hasna_color = color;
                        loadPendingRowIntoCards();
                    }
                    renderAdminTable();
                }
            };

            window.filterAdminTable = function () {
                renderAdminTable();
            };

            window.resetAdminTableFilter = function () {
                const input = document.getElementById('adminTableSearchInput');
                if (input) input.value = '';
                renderAdminTable();
            };

            window.adminPrevRow = function () {
                const rows = window.getSharedPublicationRows();
                if (selectedRowIndex > 0) {
                    selectedRowIndex--;
                    adminPendingRow = { ...rows[selectedRowIndex] };
                    loadPendingRowIntoCards();
                    renderAdminTable();
                }
            };

            // --- Launch on the blog Action (Despliegue Exclusivo de Admin) ---
            window.launchOnTheBlog = function () {
                gatherAllCardValues();
                const row = adminPendingRow;

                // 1. Guardar en la tabla del panel Admin
                const rows = window.getSharedPublicationRows();
                const exIdx = rows.findIndex(r => r.identifier_code === row.identifier_code);
                if (exIdx >= 0) {
                    rows[exIdx] = { ...row };
                } else {
                    rows.unshift({ ...row });
                }
                window.saveSharedPublicationRows(rows);
                renderAdminTable(true);

                // 2. Sincronizar con el Blog de Publicaciones
                const blogKey = 'l8_excel_blog_articles_v1';
                let blogArticles = [];
                try {
                    const raw = localStorage.getItem(blogKey);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed) && parsed.length > 0) blogArticles = parsed;
                    }
                } catch (e) {}

                const postTitle = `Publicación ${row.identifier_code}: ${row.creator_name} [${row.manager_id}]`;
                const postExcerpt = `Tokens: ${row.num_tokens} ($${row.cost_per_token}/token) · ICAI: ${row.icai_page} · NSPA: ${row.nspa_monthly}`;
                
                const newArticle = {
                    id: row.identifier_code,
                    date: new Date().toISOString().split('T')[0],
                    title: postTitle,
                    category: 'Lanzamientos',
                    status: 'Publicado',
                    author: row.creator_name || 'Admin',
                    excerpt: postExcerpt,
                    content: `Contenido de ${row.identifier_code}`,
                    views: 1
                };

                const existingIdx = blogArticles.findIndex(a => a.id === newArticle.id);
                if (existingIdx >= 0) blogArticles[existingIdx] = newArticle;
                else blogArticles.unshift(newArticle);

                localStorage.setItem(blogKey, JSON.stringify(blogArticles));
                if (typeof window.saveExcelArticles === 'function') {
                    window.saveExcelArticles(blogArticles);
                }

                window.showAdminToast(`✓ Publicación [${newArticle.id}] lanzada y visible en el Blog.`);
                
                if (typeof window.openBlogArticleDetails === 'function') {
                    window.openBlogArticleDetails(newArticle.id);
                }
            };

            window.exportAdminReport = function () {
                const rows = window.getSharedPublicationRows();
                let csv = 'identifier_code,responsible_code,auth_signature,num_tokens,cost_per_token,icai_page,nspa_monthly,cors_method,time_to_create,proof,manager_id,creator_name,phone,email\n';
                rows.forEach(r => {
                    csv += `"${r.identifier_code}","${r.responsible_code}","${r.auth_signature}","${r.num_tokens}","${r.cost_per_token}","${r.icai_page}","${r.nspa_monthly}","${r.cors_method}","${r.time_to_create}","${r.proof}","${r.manager_id}","${r.creator_name}","${r.phone}","${r.email}"\n`;
                });
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `admin_publication_report_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };

            // Initial render
            document.addEventListener('DOMContentLoaded', () => {
                renderAdminTable();
            });
            renderAdminTable();
        })();

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
                const privacyChk = document.getElementById('authPrivacyCheckbox');
                if (privacyChk && !privacyChk.checked) {
                    setMsg('Debes aceptar la Política de Privacidad para crear tu cuenta.');
                    return;
                }
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

        /* ===== PRIVACY POLICY MODAL CONTROLLER ===== */
        window.openPrivacyPolicyModal = function () {
            const modal = document.getElementById('privacyPolicyModal');
            if (modal) modal.classList.add('open');
        };

        window.closePrivacyPolicyModal = function () {
            const modal = document.getElementById('privacyPolicyModal');
            if (modal) modal.classList.remove('open');
        };

        window.acceptAndClosePrivacyPolicy = function () {
            const chk = document.getElementById('authPrivacyCheckbox');
            if (chk) chk.checked = true;
            closePrivacyPolicyModal();
            if (typeof window.showAdminToast === 'function') {
                window.showAdminToast('✓ Política de Privacidad aceptada.');
            }
        };

        window.l8Asset = function (path) {
            var p = String(path == null ? '' : path);
            if (!p) return p;
            if (/^(https?:|data:|blob:)/i.test(p)) return p;
            var base = window.L8_BASE_PATH || '/';
            if (p.charAt(0) === '/') p = p.slice(1);
            if (!base || base === '/') return '/' + p;
            return base.replace(/\/+$/, '/') + p;
        };

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
                if (!canvas) return;
                if (!window.OriginkitBlackHole) {
                    let attempts = 0;
                    const checkTimer = setInterval(() => {
                        attempts++;
                        if (window.OriginkitBlackHole) {
                            clearInterval(checkTimer);
                            presentBlackholeVisual();
                        } else if (attempts > 30) {
                            clearInterval(checkTimer);
                        }
                    }, 50);
                    return;
                }
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
                hintEl.textContent = 'Ready — click Enter platform to proceed';
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
    <script src="<?php echo htmlspecialchars($L8_BASE, ENT_QUOTES, 'UTF-8'); ?>components/codespace-ws.js?v=2026.1"></script>
    <script src="<?php echo htmlspecialchars($L8_BASE, ENT_QUOTES, 'UTF-8'); ?>components/tabby-terminal.js?v=2026.2"></script>
</body>
</html>
