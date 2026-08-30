<?php
/**
 * Copyright (C) 2020-2026 Denver Technologies, Inc.
 * Copyright (C) 2026 DIKTATCART / Hashcod
 *
 * This file is part of Hashcod codespace / Warp Terminal integration.
 *
 * Modified on 2026 by DIKTATCART / Hashcod: Added custom Warp-style cell blocks,
 * execution status, block toolbar, and platform integration.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// index.php — plataforma servidor HTML nativo (PHP). No Vite / no React SPA.
require_once __DIR__ . '/l8-html.php';
require_once __DIR__ . '/cloudflare-turnstile.php';

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
<link rel="stylesheet" href="<?php echo htmlspecialchars($L8_BASE, ENT_QUOTES, 'UTF-8'); ?>components/durable-objects.css?v=2026.1">
    <link rel="stylesheet" href="<?php echo htmlspecialchars($L8_BASE, ENT_QUOTES, 'UTF-8'); ?>components/warp-terminal.css?v=2026.1">
    <link rel="stylesheet" href="<?php echo htmlspecialchars($L8_BASE, ENT_QUOTES, 'UTF-8'); ?>components/polyglot-grid.css?v=2026.1">
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
           TERMINAL CONSOLE & CELLS SPECIFICATION (WHITE CELLS / BLACK SHELL)
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
            background: transparent;
        }

        /* top-output-bar (Celda de ejecucion (=) en Liquid Glass Blanco) */
        .block-row.block-execution {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: stretch;
            padding: 0px;
            width: 100%;
            max-width: 1200px;
            min-height: 52px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.72) 100%) !important;
            backdrop-filter: blur(20px) saturate(190%) !important;
            -webkit-backdrop-filter: blur(20px) saturate(190%) !important;
            border: 1px solid rgba(255, 255, 255, 0.85) !important;
            border-radius: 8px !important;
            overflow: hidden;
            flex: none;
            order: 0;
            flex-grow: 0;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.95), inset 0 -1px 2px rgba(203, 213, 225, 0.35) !important;
            transition: all 0.2s ease;
        }

        /* equal-column (Columna del icono = en Liquid Glass) */
        .block-execution .block-symbol {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 0px;
            width: 40px;
            min-width: 40px;
            min-height: 52px;
            background: rgba(255, 255, 255, 0.5) !important;
            backdrop-filter: blur(14px) !important;
            -webkit-backdrop-filter: blur(14px) !important;
            border-right: 1px solid rgba(203, 213, 225, 0.65) !important;
            flex: none;
            order: 0;
            flex-grow: 0;
            user-select: none;
            /* = */
            font-family: 'Geist Mono', 'Inter', monospace;
            font-style: normal;
            font-weight: 800;
            font-size: 19px;
            line-height: 22px;
            color: #0f172a !important;
            text-align: center;
            text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
        }

        /* output-area (Contenido en Liquid Glass Blanco con texto legible oscuro) */
        .block-execution .block-body {
            box-sizing: border-box;
            width: 100%;
            max-width: 1160px;
            min-height: 52px;
            max-height: 650px;
            background: transparent !important;
            padding: 10px 14px;
            overflow-y: auto;
            flex: none;
            order: 1;
            flex-grow: 1;
            word-break: break-all;
            white-space: pre-wrap;
            line-height: 1.45;
            font-family: 'IBM Plex Mono', 'Geist Mono', monospace;
            font-size: 13px;
            color: #0f172a !important;
            display: flex;
            align-items: flex-start;
        }

        .block-execution .block-body pre,
        .block-execution .block-body code,
        .block-execution .block-body .warp-session-feed,
        .block-execution .block-body .warp-feed-output {
            color: #0f172a !important;
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

        /* bottom-input-bar (Barra de Herramientas Inferior Blanca con Iconos al inicio) */
        .block-row.block-prompt {
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            padding: 0px 14px;
            gap: 10px;
            width: 100%;
            max-width: 1200px;
            height: 48px;
            min-height: 48px;
            background: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            border-top: 1px solid #e2e8f0 !important;
            border-bottom-left-radius: 8px !important;
            border-bottom-right-radius: 8px !important;
            border-top-left-radius: 0 !important;
            border-top-right-radius: 0 !important;
            flex: none;
            order: 0;
            flex-grow: 0;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06) !important;
            overflow-x: auto;
            scrollbar-width: thin;
        }

        /* prompt-symbol en Negro */
        .block-prompt .block-symbol {
            width: 18px;
            min-width: 18px;
            height: 24px;
            font-family: 'Geist Mono', 'IBM Plex Mono', monospace;
            font-style: normal;
            font-weight: 800;
            font-size: 18px;
            line-height: 24px;
            color: #000000 !important;
            background: transparent;
            border: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            user-select: none;
            cursor: pointer;
            padding: 0;
            margin: 0;
            transition: color 0.15s ease, transform 0.15s ease;
        }

        .block-prompt .block-symbol:hover {
            color: #334155 !important;
            transform: scale(1.15);
        }

        /* Contenedor de herramientas organizadas desde el inicio de la celda */
        .block-prompt .prompt-tools-container {
            display: inline-flex;
            align-items: center;
            justify-content: flex-start;
            gap: 8px;
            flex: 1;
            overflow-x: auto;
            padding: 2px 0;
        }

        /* Botones de herramientas con icono interactivo */
        .cell-action-icon {
            box-sizing: border-box;
            display: inline-flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 5px;
            width: 32px;
            height: 32px;
            min-width: 32px;
            min-height: 32px;
            background: #f8fafc;
            border-radius: 6px;
            cursor: pointer;
            border: 1px solid #cbd5e1;
            flex-shrink: 0;
            color: #0f172a;
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .cell-action-icon:hover {
            background: #f1f5f9;
            border-color: #0f172a;
            transform: translateY(-1px);
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
        }

        .cell-action-icon:active {
            transform: translateY(0);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .cell-action-icon svg {
            width: 18px;
            height: 18px;
            display: block;
            flex-shrink: 0;
            color: #000000;
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

        .tb-slot.is-tool-github:hover {
            border-color: #000000;
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
        }
        .tb-slot.is-tool-github .tb-inner-ring {
            border-color: #000000;
            opacity: 0.7;
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
        .warp-gateway-btn,
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
        .warp-gateway-btn svg,
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
        .warp-gateway-btn:hover svg,
        .notepad-gateway-btn:hover svg,
        .icon-gateway:hover svg,
        .action-gateway-btn:hover svg,
        .gateway-action-btn:hover .gateway-crescent-svg {
            animation: none;
            transform: rotate(85deg) scale(1.25);
            color: #000000;
        }

        .gateway-action-btn:active svg,
        .warp-gateway-btn:active svg,
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
            background: #ffffff !important;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            font-family: 'IBM Plex Mono', 'Geist Mono', monospace;
            color: #1e293b !important;
            box-sizing: border-box;
            text-align: left;
        }

        .ssh-card-container strong,
        .ssh-card-container h3,
        .ssh-card-container h4 {
            color: #0f172a !important;
        }

        .ssh-card-container p {
            color: #334155 !important;
        }

        .ssh-card-container code {
            color: #0f172a !important;
            background: #f1f5f9 !important;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
            font-weight: 500;
        }

        .ssh-card-container div {
            color: #334155 !important;
        }

        .ssh-card-container .metric-badge-black {
            color: #ffffff !important;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            letter-spacing: 0.04em;
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
            padding: 14px;
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .vk-keypad-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            width: 100%;
            flex: 1;
        }

        .vk-keypad-grid.fx-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .vk-keypad-grid.symbols-grid {
            grid-template-columns: repeat(4, 1fr);
        }

        .vk-key-btn {
            background: #ffffff;
            border: 1px solid #dcdad5;
            border-radius: 6px;
            padding: 8px 6px;
            font: 600 13px 'Geist Mono', 'IBM Plex Mono', monospace;
            color: #1f2937;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.12s ease;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            user-select: none;
        }

        .vk-key-btn:hover {
            background: #f3f4f6;
            border-color: #9ca3af;
            color: #111827;
            transform: translateY(-1px);
        }

        .vk-key-btn:active {
            transform: translateY(0) scale(0.97);
            background: #e5e7eb;
        }

        .vk-key-btn.action-enter {
            background: #111827;
            color: #ffffff;
            border-color: #111827;
        }

        .vk-key-btn.action-enter:hover {
            background: #2563eb;
            border-color: #2563eb;
        }

        .vk-key-btn.action-clear {
            background: #fee2e2;
            color: #dc2626;
            border-color: #fca5a5;
        }

        .vk-key-btn.action-clear:hover {
            background: #fecaca;
        }

        .vk-key-btn.cmd-btn {
            font-size: 11.5px;
            padding: 8px 6px;
            text-align: left;
            justify-content: flex-start;
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
            margin: 12px 0 6px;
            font-size: 12px;
            color: #b91c1c;
            line-height: 1.5;
            white-space: normal;
            word-break: break-word;
            font-weight: 500;
            transition: all 0.2s ease;
        }

        .auth-msg:not(:empty) {
            padding: 10px 12px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
        }

        .auth-msg.ok {
            color: #15803d;
            background: #f0fdf4 !important;
            border-color: #bbf7d0 !important;
        }

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

        /* Privacy Policy Modal Overlay & Dynamic Styling */
        .privacy-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 100000;
            background: rgba(9, 11, 17, 0.75);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .privacy-modal-overlay.open {
            opacity: 1;
            pointer-events: auto;
        }

        .privacy-modal-card {
            width: min(880px, 96vw);
            max-height: 90vh;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 30px 70px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            animation: privacyCardScale 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes privacyCardScale {
            from { transform: scale(0.95) translateY(8px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
        }

        .privacy-modal-header {
            padding: 18px 24px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }

        .privacy-tabs-bar {
            display: flex;
            background: #f1f5f9;
            padding: 4px;
            border-bottom: 1px solid #e2e8f0;
            gap: 4px;
            overflow-x: auto;
        }

        .privacy-tab-btn {
            background: transparent;
            border: none;
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.15s ease;
            white-space: nowrap;
            font-family: inherit;
        }

        .privacy-tab-btn:hover {
            color: #0f172a;
            background: rgba(255, 255, 255, 0.6);
        }

        .privacy-tab-btn.active {
            background: #ffffff;
            color: #0f172a;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .privacy-tab-btn svg {
            width: 14px;
            height: 14px;
            fill: currentColor;
            flex-shrink: 0;
        }

        .privacy-modal-body {
            padding: 24px 26px;
            overflow-y: auto;
            color: #334155;
            font-size: 13px;
            line-height: 1.68;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            flex: 1;
        }

        .privacy-tab-pane {
            display: none;
            animation: privacyPaneFade 0.2s ease-out;
        }

        .privacy-tab-pane.active {
            display: block;
        }

        @keyframes privacyPaneFade {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .privacy-modal-body h3 {
            margin: 18px 0 8px;
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .privacy-modal-body h3:first-child {
            margin-top: 0;
        }

        .privacy-modal-body p {
            margin: 0 0 12px;
        }

        .privacy-modal-body ul {
            margin: 0 0 14px 20px;
            padding: 0;
        }

        .privacy-modal-body li {
            margin-bottom: 6px;
        }

        .privacy-vector-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 12px;
            margin: 14px 0;
        }

        .privacy-vector-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 12px 14px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            transition: transform 0.15s, border-color 0.15s;
        }

        .privacy-vector-card:hover {
            transform: translateY(-2px);
            border-color: #cbd5e1;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .privacy-vector-head {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 700;
            font-size: 12.5px;
            color: #0f172a;
        }

        .privacy-vector-head svg {
            width: 18px;
            height: 18px;
            fill: #0ea5e9;
            flex-shrink: 0;
        }

        .privacy-vector-desc {
            font-size: 11.5px;
            color: #64748b;
            line-height: 1.45;
        }

        .privacy-modal-footer {
            padding: 16px 24px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
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
        /* Botón de versión móvil con icono estilizado */
        .icon-mobile, .boot-mobile-toggle {
            background: #ffffff !important;
            border: 1.5px solid #e2e8f0 !important;
            border-radius: 10px !important;
            padding: 4px 6px !important;
            cursor: pointer;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
        }

        .icon-mobile:hover, .boot-mobile-toggle:hover {
            transform: translateY(-1px) scale(1.03);
            border-color: #cbd5e1 !important;
            box-shadow: 0 3px 8px rgba(0,0,0,0.12);
        }

        .icon-mobile.active-mobile-mode, .boot-mobile-toggle.active-mobile-mode {
            background: #f0fdf4 !important;
            border-color: #16a34a !important;
            box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2) !important;
        }

        /* Optimizaciones generales para modo teléfono */
        body.mobile-mode {
            touch-action: manipulation;
        }

        body.mobile-mode .top-bar {
            position: sticky;
            top: 0;
            z-index: 100;
            background: rgba(255, 255, 255, 0.96);
            backdrop-filter: blur(8px);
            border-bottom: 1px solid #e2e8f0;
        }

        body.mobile-mode .auth-card {
            width: 100% !important;
            max-width: 95vw !important;
            margin: 10px auto !important;
            padding: 16px 14px !important;
            box-sizing: border-box;
        }

        body.mobile-mode .privacy-modal-content {
            width: 96vw !important;
            max-height: 90vh !important;
            border-radius: 12px !important;
        }

        body.mobile-mode .privacy-tabs-bar {
            overflow-x: auto;
            white-space: nowrap;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 6px;
        }

        body.mobile-mode .privacy-tab-btn {
            font-size: 11px;
            padding: 6px 10px;
        }

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

            /* Warp Terminal */
        svg.warp-icon-svg, .warp-icon-svg, .warp-prompt-header svg, .warp-terminal-container svg {
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
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.72) 100%) !important;
            backdrop-filter: blur(20px) saturate(190%) !important;
            -webkit-backdrop-filter: blur(20px) saturate(190%) !important;
            border: 1px solid rgba(255, 255, 255, 0.85) !important;
            margin-bottom: 8px;
            border-radius: 8px !important;
            overflow: hidden;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.95), inset 0 -1px 2px rgba(203, 213, 225, 0.35) !important;
        }
        .block-row.block-prompt {
            border: 1px solid #cbd5e1;
            border-top: 1px solid #e2e8f0;
            background: #ffffff !important;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
        }
    
        /* ===== NVIDIA DYNAMO TOOL OVERLAY & ENHANCED VECTOR STYLES ===== */
        .tb-slot.is-tool-dynamo:hover {
            border-color: #76B900 !important;
            box-shadow: 0 12px 32px rgba(118, 185, 0, 0.35) !important;
        }
        .tb-slot.is-tool-dynamo .tb-inner-ring {
            border-color: #76B900;
            opacity: 0.85;
        }
        .dynamo-dock-overlay {
            display: none;
            position: fixed !important;
            inset: 0 !important;
            z-index: 10005 !important;
            background: rgba(8, 12, 18, 0.86) !important;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            align-items: center;
            justify-content: center;
            padding: 24px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.25s ease;
        }
        .dynamo-dock-overlay.is-open,
        .dynamo-dock-overlay.open {
            display: flex !important;
            opacity: 1 !important;
            pointer-events: auto !important;
        }
        .dynamo-dock-shell {
            width: 100%;
            max-width: 1180px;
            max-height: 92vh;
            background: radial-gradient(130% 100% at 50% 0%, #131d2e 0%, #0a0f18 100%);
            color: #f8fafc;
            border: 1px solid rgba(118, 185, 0, 0.4);
            border-radius: 20px;
            box-shadow: 0 30px 70px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(118, 185, 0, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.15);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: 'Geist', 'Inter', -apple-system, system-ui, sans-serif;
            animation: dynamoModalZoom 0.28s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 10006 !important;
        }
        @keyframes dynamoModalZoom {
            from { transform: scale(0.95) translateY(12px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .dynamo-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px 26px;
            background: rgba(5, 9, 15, 0.95);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .dynamo-brand {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .dynamo-logo-wrap {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(118, 185, 0, 0.2) 0%, rgba(118, 185, 0, 0.05) 100%);
            border: 1px solid rgba(118, 185, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(118, 185, 0, 0.2);
        }
        .dynamo-brand h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -0.02em;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .dynamo-badge-pill {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            font-family: 'Geist Mono', monospace;
            background: rgba(118, 185, 0, 0.12);
            color: #76B900;
            border: 1px solid rgba(118, 185, 0, 0.6);
            padding: 3px 8px;
            border-radius: 6px;
            font-weight: 700;
        }
        .dynamo-grid-metrics {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
            padding: 18px 26px;
            background: rgba(8, 13, 22, 0.8);
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .dynamo-metric-card {
            background: linear-gradient(180deg, rgba(26, 36, 54, 0.7) 0%, rgba(15, 23, 38, 0.8) 100%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            padding: 14px 16px;
            display: flex;
            align-items: flex-start;
            gap: 14px;
            transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .dynamo-metric-card:hover {
            transform: translateY(-2px);
            border-color: rgba(118, 185, 0, 0.4);
        }
        .dynamo-metric-ico {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background: rgba(118, 185, 0, 0.12);
            border: 1px solid rgba(118, 185, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            color: #76B900;
        }
        .dynamo-metric-info {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .dynamo-metric-label {
            font-size: 11px;
            color: #94a3b8;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }
        .dynamo-metric-val {
            font-size: 20px;
            font-weight: 800;
            color: #ffffff;
            font-family: 'Geist Mono', monospace;
            letter-spacing: -0.02em;
        }
        .dynamo-metric-val.green { color: #76B900; }
        .dynamo-body {
            padding: 22px 26px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 22px;
        }
        .dynamo-topology-container {
            background: #060a12;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            padding: 16px 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .dynamo-topology-flow {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            overflow-x: auto;
            padding-bottom: 4px;
        }
        .dynamo-node-item {
            background: #131c2e;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 10px;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Geist Mono', monospace;
            font-size: 12px;
            font-weight: 600;
            color: #e2e8f0;
            flex-shrink: 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .dynamo-node-item.active {
            border-color: #76B900;
            background: linear-gradient(135deg, rgba(118, 185, 0, 0.18) 0%, rgba(118, 185, 0, 0.05) 100%);
            color: #76B900;
            box-shadow: 0 0 16px rgba(118, 185, 0, 0.15);
        }
        .dynamo-arrow-vector {
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .dynamo-playground {
            background: #060a12;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            padding: 18px 20px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }
        .dynamo-prompt-input {
            width: 100%;
            height: 76px;
            background: #0d1524;
            border: 1px solid #233148;
            border-radius: 10px;
            color: #f8fafc;
            font-family: 'Geist Mono', monospace;
            font-size: 13px;
            padding: 12px 16px;
            resize: none;
            box-sizing: border-box;
            line-height: 1.5;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .dynamo-prompt-input:focus {
            outline: none;
            border-color: #76B900;
            box-shadow: 0 0 0 3px rgba(118, 185, 0, 0.25);
        }
        .dynamo-stream-output {
            background: #04070d;
            border: 1px solid #1a2538;
            border-radius: 10px;
            padding: 14px 18px;
            min-height: 90px;
            font-family: 'Geist Mono', monospace;
            font-size: 12px;
            color: #cbd5e1;
            white-space: pre-wrap;
            line-height: 1.6;
        }
        .dynamo-btn {
            background: #172236;
            color: #f8fafc;
            border: 1px solid #2d3e5c;
            border-radius: 9px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.15s ease;
        }
        .dynamo-btn:hover {
            background: #233352;
            border-color: #435b85;
            color: #ffffff;
        }
        .dynamo-btn.primary {
            background: #76B900;
            color: #050b00;
            border-color: #76B900;
            font-weight: 800;
            box-shadow: 0 4px 14px rgba(118, 185, 0, 0.3);
        }
        .dynamo-btn.primary:hover {
            background: #88d400;
            box-shadow: 0 6px 20px rgba(118, 185, 0, 0.45);
        }

        /* ===== STRIX AI SECURITY & IP SCANNER OVERLAY & STYLES ===== */
        .tb-slot.is-tool-strix:hover {
            border-color: #ffffff !important;
            box-shadow: 0 12px 32px rgba(255, 255, 255, 0.35) !important;
        }
        .strix-dock-overlay {
            display: none;
            position: fixed !important;
            inset: 0 !important;
            z-index: 10005 !important;
            background: rgba(8, 12, 22, 0.86) !important;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            align-items: center;
            justify-content: center;
            padding: 24px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.25s ease;
        }
        .strix-dock-overlay.is-open,
        .strix-dock-overlay.open {
            display: flex !important;
            opacity: 1 !important;
            pointer-events: auto !important;
        }
        .strix-dock-shell {
            width: 100%;
            max-width: 1180px;
            max-height: 92vh;
            background: radial-gradient(130% 100% at 50% 0%, #0f1c30 0%, #060b14 100%);
            color: #f8fafc;
            border: 1px solid rgba(56, 189, 248, 0.4);
            border-radius: 20px;
            box-shadow: 0 30px 70px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(56, 189, 248, 0.18);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: 'Geist', 'Inter', -apple-system, system-ui, sans-serif;
            animation: dynamoModalZoom 0.28s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 10006 !important;
        }
        .strix-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px 26px;
            background: rgba(4, 8, 16, 0.95);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .strix-brand {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .strix-logo-wrap {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(56, 189, 248, 0.05) 100%);
            border: 1px solid rgba(56, 189, 248, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(56, 189, 248, 0.2);
        }
        .strix-brand h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -0.02em;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .strix-badge-pill {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            font-family: 'Geist Mono', monospace;
            background: rgba(56, 189, 248, 0.12);
            color: #38bdf8;
            border: 1px solid rgba(56, 189, 248, 0.6);
            padding: 3px 8px;
            border-radius: 6px;
            font-weight: 700;
        }
        .strix-scan-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 26px;
            background: rgba(6, 11, 20, 0.85);
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            flex-wrap: wrap;
        }
        .strix-input {
            flex: 1;
            min-width: 260px;
            background: #0b1322;
            border: 1px solid #1e293b;
            border-radius: 10px;
            color: #ffffff;
            font-family: 'Geist Mono', monospace;
            font-size: 13px;
            padding: 10px 16px;
        }
        .strix-input:focus {
            outline: none;
            border-color: #38bdf8;
            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
        }
        .strix-grid-metrics {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
            padding: 18px 26px;
            background: rgba(6, 10, 18, 0.7);
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .strix-metric-card {
            background: linear-gradient(180deg, rgba(19, 31, 51, 0.7) 0%, rgba(10, 18, 32, 0.8) 100%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            padding: 14px 16px;
            display: flex;
            align-items: flex-start;
            gap: 14px;
        }
        .strix-metric-ico {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background: rgba(56, 189, 248, 0.12);
            border: 1px solid rgba(56, 189, 248, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            color: #38bdf8;
        }
        .strix-metric-val {
            font-size: 20px;
            font-weight: 800;
            color: #ffffff;
            font-family: 'Geist Mono', monospace;
        }
        .strix-metric-val.blue { color: #38bdf8; }
        .strix-body {
            padding: 22px 26px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .strix-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            text-align: left;
        }
        .strix-table th {
            padding: 10px 14px;
            background: #0c1524;
            color: #94a3b8;
            font-weight: 700;
            border-bottom: 1px solid #1e293b;
            font-family: 'Geist Mono', monospace;
            font-size: 11px;
            text-transform: uppercase;
        }
        .strix-table td {
            padding: 12px 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            color: #e2e8f0;
        }
        .strix-severity-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 11px;
            font-family: 'Geist Mono', monospace;
        }
        .strix-btn {
            background: #132238;
            color: #f8fafc;
            border: 1px solid #253956;
            border-radius: 9px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.15s ease;
        }
        .strix-btn:hover {
            background: #1c3252;
            border-color: #38bdf8;
            color: #ffffff;
        }
        .strix-btn.primary {
            background: #38bdf8;
            color: #030812;
            border-color: #38bdf8;
            font-weight: 800;
            box-shadow: 0 4px 14px rgba(56, 189, 248, 0.3);
        }
        .strix-btn.primary:hover {
            background: #60a5fa;
            box-shadow: 0 6px 20px rgba(56, 189, 248, 0.45);
        }

        /* ===== GitHub Repositories Tool Modal & Overlay ===== */
        .gh-dock-overlay {
            display: none;
            position: fixed !important;
            inset: 0 !important;
            z-index: 10005 !important;
            background: rgba(0, 0, 0, 0.75) !important;
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            align-items: center;
            justify-content: center;
            padding: 20px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
        }
        .gh-dock-overlay.is-open,
        .gh-dock-overlay.open {
            display: flex !important;
            opacity: 1 !important;
            pointer-events: auto !important;
        }
        .gh-dock-shell {
            width: 100%;
            max-width: 1100px;
            max-height: 90vh;
            background: #ffffff;
            color: #000000;
            border-radius: 12px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: 'IBM Plex Sans', system-ui, sans-serif;
            animation: ghModalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 10006 !important;
            pointer-events: auto !important;
        }
        @keyframes ghModalIn {
            from { transform: scale(0.96) translateY(8px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .gh-dock-head {
            padding: 16px 20px;
            background: #fafafa;
            border-bottom: 1px solid #e5e5e5;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
        }
        .gh-dock-brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .gh-dock-brand svg {
            width: 28px;
            height: 28px;
            fill: #000000;
            flex-shrink: 0;
        }
        .gh-dock-brand h2 {
            font-size: 16px;
            font-weight: 700;
            color: #111827;
            margin: 0;
            line-height: 1.2;
        }
        .gh-dock-brand p {
            font-size: 12px;
            color: #6b7280;
            margin: 2px 0 0;
        }
        .gh-dock-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .gh-dock-btn {
            background: #ffffff;
            border: 1px solid #d1d5db;
            color: #374151;
            padding: 7px 14px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.15s ease;
        }
        .gh-dock-btn:hover {
            background: #f3f4f6;
            border-color: #9ca3af;
        }
        .gh-dock-btn.primary {
            background: #000000;
            color: #ffffff;
            border-color: #000000;
        }
        .gh-dock-btn.primary:hover {
            background: #1f2937;
        }
        .gh-dock-btn.primary svg {
            fill: #ffffff;
        }
        .gh-dock-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: #ffffff;
        }
        .gh-metrics-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
            padding: 10px 14px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-size: 12px;
        }
        .gh-metric-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 3px 8px;
            background: #000000;
            color: #ffffff;
            border-radius: 4px;
            font-weight: 600;
            font-size: 11px;
        }
        .gh-metric-badge.green {
            background: #10b981;
        }
        .gh-search-row {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
        }
        .gh-search-input {
            flex: 1;
            min-width: 250px;
            padding: 9px 14px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 13px;
            font-family: inherit;
            background: #ffffff;
            color: #111827;
            outline: none;
            transition: border-color 0.15s;
        }
        .gh-search-input:focus {
            border-color: #000000;
        }
        .gh-table-container {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: auto;
            max-height: 480px;
        }
        .gh-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            text-align: left;
        }
        .gh-table th {
            position: sticky;
            top: 0;
            background: #f9fafb;
            padding: 10px 14px;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 11px;
            color: #4b5563;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #e5e7eb;
            z-index: 1;
        }
        .gh-table td {
            padding: 12px 14px;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: middle;
            color: #1f2937;
        }
        .gh-table tr:hover td {
            background: #f8fafc;
        }
        .gh-repo-cell {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .gh-repo-cell svg {
            width: 18px;
            height: 18px;
            fill: #111827;
            flex-shrink: 0;
        }
        .gh-repo-name {
            font-weight: 600;
            color: #0969da;
            text-decoration: none;
        }
        .gh-repo-name:hover {
            text-decoration: underline;
        }
        .gh-tag {
            font-size: 10px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 999px;
            display: inline-block;
        }
        .gh-tag.cloned {
            background: #dcfce7;
            color: #15803d;
        }
        .gh-tag.available {
            background: #f3f4f6;
            color: #4b5563;
        }
        .gh-action-btn {
            padding: 5px 10px;
            border: 1px solid #d1d5db;
            background: #ffffff;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: #374151;
            transition: all 0.12s;
        }
        .gh-action-btn:hover {
            background: #f3f4f6;
            border-color: #9ca3af;
        }
        .gh-action-btn.clone-btn {
            background: #000000;
            color: #ffffff;
            border-color: #000000;
        }
        .gh-action-btn.clone-btn:hover {
            background: #1f2937;
        }
        .gh-action-btn.clone-btn svg {
            fill: #ffffff;
        }

    
        /* HIDE GATEWAY & TOKENS COMPLETELY */
        .icon-gateway, #topBarGatewayBtn, .gateway-action-btn, #gatewayModal,
        .icon-tokens, #tokensMeterBtn, #tokensPanel, .tokens-panel,
        .tokens-unlock-overlay, #tokensUnlockOverlay, .tokens-unlock-shell {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }

    
        /* ICON LOGOUT BUTTON */
        .icon-logout {
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.5);
            border-radius: 8px;
            color: #ef4444;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            padding: 0;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .icon-logout:hover {
            background: rgba(239, 68, 68, 0.2);
            border-color: #ef4444;
            color: #f87171;
            transform: scale(1.08);
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.35);
        }

    
        /* CLOUDFLARE TURNSTILE WIDGET */
        .cf-turnstile {
            min-height: 65px;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 12px 0 !important;
            border-radius: 8px;
        }

        /* AUTH CHECKOUT CARD & WHATSAPP VOUCHER (DARK TERMINAL & VECTOR AESTHETIC) */
        .auth-checkout-box {
            margin-top: 14px;
            padding: 16px 18px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-top: 3px solid #0f172a;
            border-radius: 12px;
            text-align: left;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
            transition: all 0.2s ease;
            position: relative;
        }

        .auth-checkout-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
        }

        .auth-checkout-badge {
            font-size: 11.5px;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.01em;
            display: flex;
            align-items: center;
            gap: 7px;
            font-family: 'IBM Plex Mono', monospace;
            text-transform: uppercase;
        }

        .auth-checkout-badge-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #16a34a;
            box-shadow: 0 0 6px rgba(22, 163, 74, 0.6);
            display: inline-block;
        }

        .auth-checkout-price {
            font-size: 12px;
            color: #15803d;
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
            border-radius: 6px;
            padding: 3px 9px;
            font-family: 'IBM Plex Mono', monospace;
            font-weight: 700;
        }

        .auth-checkout-price strong {
            color: #15803d;
            font-weight: 800;
            font-size: 13.5px;
        }

        .auth-voucher-terminal-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 7px 12px;
            margin-bottom: 12px;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 11px;
            color: #475569;
        }

        .auth-voucher-id-pill {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            color: #0f172a;
            padding: 2px 7px;
            border-radius: 4px;
            font-weight: 700;
            letter-spacing: 0.03em;
        }

                .auth-checkout-features {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 14px;
        }

        .auth-checkout-feature-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 11.5px;
            color: #334155;
            line-height: 1.45;
        }

        .auth-checkout-feature-item .auth-feature-icon {
            flex-shrink: 0;
            margin-top: 2px;
        }

        .auth-checkout-text {
            font-size: 12px;
            color: #334155;
            line-height: 1.6;
            margin: 0 0 14px 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .auth-checkout-text strong {
            color: #0f172a;
            font-weight: 700;
        }

        .auth-whatsapp-link {
            color: #16a34a;
            font-weight: 700;
            text-decoration: underline;
            text-underline-offset: 2px;
            transition: color 0.15s;
        }

        .auth-whatsapp-link:hover {
            color: #15803d;
        }

        .auth-checkout-actions {
            display: grid;
            grid-template-columns: 1.3fr 1fr 1fr;
            gap: 8px;
            margin-bottom: 14px;
        }

        @media (max-width: 580px) {
            .auth-checkout-actions {
                grid-template-columns: 1fr;
            }
        }

        .auth-btn-whatsapp,
        .auth-btn-capture,
        .auth-btn-copy-msg {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 9px 12px;
            font-size: 11.5px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.15s ease;
            font-family: 'IBM Plex Mono', monospace;
            user-select: none;
        }

        .auth-btn-whatsapp {
            background: #16a34a;
            color: #ffffff;
            border: 1px solid #15803d;
            box-shadow: 0 1px 3px rgba(22, 163, 74, 0.25);
            font-weight: 700;
        }

        .auth-btn-whatsapp:hover {
            background: #15803d;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35);
            color: #ffffff;
        }

        .auth-btn-capture {
            background: #ffffff;
            color: #0f172a;
            border: 1px solid #cbd5e1;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .auth-btn-capture:hover {
            background: #f8fafc;
            border-color: #94a3b8;
            transform: translateY(-1px);
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
            color: #0f172a;
        }

        .auth-btn-copy-msg {
            background: #ffffff;
            color: #0f172a;
            border: 1px solid #cbd5e1;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .auth-btn-copy-msg:hover {
            background: #f8fafc;
            border-color: #94a3b8;
            color: #0f172a;
            transform: translateY(-1px);
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
        }

        .auth-checkout-checkbox-label {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 11.5px;
            color: #1e293b;
            line-height: 1.45;
            cursor: pointer;
            padding: 10px 12px;
            background: #ffffff;
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            transition: all 0.15s ease;
        }

        .auth-checkout-checkbox-label:hover {
            border-color: #94a3b8;
            background: #fafafa;
        }

        .auth-checkout-checkbox-label input[type="checkbox"] {
            margin-top: 2px;
            cursor: pointer;
            accent-color: #16a34a;
            width: 15px;
            height: 15px;
            flex-shrink: 0;
        }

        .auth-checkout-checkbox-label strong {
            color: #0f172a !important;
            font-weight: 700;
        }
        
        .auth-checkout-box,
        .auth-checkout-box strong,
        .auth-checkout-box span,
        .auth-checkout-box p {
            color: #0f172a;
        }
        
        .auth-checkout-feature-item {
            color: #334155 !important;
        }
        
        .auth-checkout-feature-item strong {
            color: #0f172a !important;
        }
        
        .auth-checkout-checkbox-label {
            color: #0f172a !important;
        }
        
        .auth-checkout-checkbox-label span {
            color: #0f172a !important;
        }
</style>
    <script src="<?php echo htmlspecialchars($L8_BASE, ENT_QUOTES, 'UTF-8'); ?>components/originkit/ui/blackhole-runtime.js"></script>
<!-- Cloudflare Turnstile Bot Protection Init -->
    <script>
        const CF_TURNSTILE_SITE_KEY = '<?php echo htmlspecialchars(function_exists("cfTurnstileGetSiteKey") ? cfTurnstileGetSiteKey() : "0x4AAAAAAEfpecWchE9q2-cs", ENT_QUOTES, "UTF-8"); ?>';
        window.turnstileTokens = {
            login: '',
            register: '',
            recover: '',
            latest: ''
        };

        window.onTurnstileSuccessLogin = function (token) {
            window.turnstileTokens.login = token;
            window.turnstileTokens.latest = token;
        };
        window.onTurnstileExpireLogin = function () {
            window.turnstileTokens.login = '';
        };

        window.onTurnstileSuccessRegister = function (token) {
            window.turnstileTokens.register = token;
            window.turnstileTokens.latest = token;
        };
        window.onTurnstileExpireRegister = function () {
            window.turnstileTokens.register = '';
        };

        window.onTurnstileSuccessRecover = function (token) {
            window.turnstileTokens.recover = token;
            window.turnstileTokens.latest = token;
        };
        window.onTurnstileExpireRecover = function () {
            window.turnstileTokens.recover = '';
        };

        window.renderTurnstileWidgets = function () {
            if (window.turnstile && typeof window.turnstile.render === 'function') {
                const siteKey = CF_TURNSTILE_SITE_KEY || '0x4AAAAAAEfpecWchE9q2-cs';
                const configs = [
                    { id: 'cfTurnstileLogin', cb: window.onTurnstileSuccessLogin, exp: window.onTurnstileExpireLogin },
                    { id: 'cfTurnstileRegister', cb: window.onTurnstileSuccessRegister, exp: window.onTurnstileExpireRegister },
                    { id: 'cfTurnstileRecover', cb: window.onTurnstileSuccessRecover, exp: window.onTurnstileExpireRecover }
                ];
                configs.forEach(function (c) {
                    const el = document.getElementById(c.id);
                    if (el && !el.hasChildNodes()) {
                        try {
                            window.turnstile.render('#' + c.id, {
                                sitekey: siteKey,
                                theme: 'light',
                                size: 'flexible',
                                callback: c.cb,
                                'expired-callback': c.exp
                            });
                        } catch (e) {}
                    }
                });
            }
        };

        window.onloadTurnstileCallback = function () {
            window.turnstileReady = true;
            window.renderTurnstileWidgets();
        };

        setInterval(window.renderTurnstileWidgets, 500);
    </script>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback" async defer></script>
</head>
<body class="boot-locked">
    <script>
        (function () {
            try {
                var stored = localStorage.getItem('l8_mobile_mode');
                var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent || '') || (window.innerWidth <= 768);
                if (stored === '1' || (stored === null && isMobile)) {
                    document.documentElement.classList.add('mobile-mode');
                    if (document.body) {
                        document.body.classList.add('mobile-mode');
                    } else {
                        document.addEventListener('DOMContentLoaded', function () {
                            document.body.classList.add('mobile-mode');
                        });
                    }
                }
            } catch (e) {}
        })();
    </script>
    <div id="bootCliOverlay" class="boot-cli-overlay" role="dialog" aria-modal="true" aria-label="l8 codespace blackhole">
            <button type="button" class="boot-mobile-toggle" id="bootMobileModeBtn" title="Versión móvil" aria-label="Activar versión móvil" aria-pressed="false" onclick="toggleMobileMode()">
                <img src="mobile-mode-icon.png" alt="Versión móvil" class="mobile-toggle-img" style="width:30px; height:30px; object-fit:contain; display:block; border-radius:6px;">
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
                <button type="button" class="auth-tab" id="authTabValidate" data-tab="validate">Comprobar</button>
            </div>

            <div class="auth-panel active" id="authPanelLogin">
                <label class="auth-label" for="authAesInput">Clave AES-256 (o L8ID / acct_... / L8REC)</label>
                <input class="auth-input" id="authAesInput" type="password" autocomplete="off" spellcheck="false" placeholder="Clave AES-256 de tu cuenta">
                <label class="auth-label" for="authIdentityInput">Clave identificador L8ID (o ID de cuenta)</label>
                <input class="auth-input" id="authIdentityInput" type="password" autocomplete="off" spellcheck="false" placeholder="Clave L8ID-… de tu cuenta">
                <div class="cf-turnstile" id="cfTurnstileLogin" data-sitekey="<?php echo htmlspecialchars(function_exists("cfTurnstileGetSiteKey") ? cfTurnstileGetSiteKey() : "0x4AAAAAAEfpecWchE9q2-cs", ENT_QUOTES, "UTF-8"); ?>" data-callback="onTurnstileSuccessLogin" data-expired-callback="onTurnstileExpireLogin" data-theme="light" data-size="flexible" style="margin:10px 0;"></div>
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
                        <input type="checkbox" id="authPrivacyCheckbox" required>
                        <span>Acepto la <a href="javascript:void(0)" onclick="openPrivacyPolicyModal()" class="privacy-link">Política de Privacidad y Modelo de Certificación</a>: certificación de creaciones con IA mediante pruebas deterministas, seguridad post-cuántica (NIST PQC) y soberanía de datos (cero telemetría).</span>
                    </label>
                </div>
                <div class="cf-turnstile" id="cfTurnstileRegister" data-sitekey="<?php echo htmlspecialchars(function_exists("cfTurnstileGetSiteKey") ? cfTurnstileGetSiteKey() : "0x4AAAAAAEfpecWchE9q2-cs", ENT_QUOTES, "UTF-8"); ?>" data-callback="onTurnstileSuccessRegister" data-expired-callback="onTurnstileExpireRegister" data-theme="light" data-size="flexible" style="margin:10px 0;"></div>
                <button type="button" class="auth-btn" id="authRegisterBtn">Crear cuenta</button>

                <div class="auth-checkout-box" id="authCheckoutBox">
                    <div class="auth-checkout-header">
                        <span class="auth-checkout-badge">
                            <span class="auth-checkout-badge-dot"></span>
                            <span>PQC VOUCHER &amp; CHECKOUT</span>
                        </span>
                        <span class="auth-checkout-price"><strong>US$ 60.27</strong> / mes</span>
                    </div>

                    <div class="auth-voucher-terminal-bar">
                        <span>Ref: <span class="auth-voucher-id-pill" id="authVoucherIdDisplay">HASHCOD-L8-PQC</span></span>
                        <span style="color:#64748b; font-size:10.5px;">NIST ML-DSA-87 / Dilithium-5</span>
                    </div>

                    <div class="auth-checkout-features">
                        <div class="auth-checkout-feature-item">
                            <svg class="auth-feature-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            <span><strong>Certificación Determinista de IA:</strong> Certifica plataformas de IA y ofrece alojamiento seguro con criptografía post-cuántica.</span>
                        </div>
                        <div class="auth-checkout-feature-item">
                            <svg class="auth-feature-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            <span><strong>Aceptación de Términos:</strong> Al registrarte confirmas que aceptas la Política de Privacidad y la suscripción mensual de <strong>US$ 60.27 / mes</strong>.</span>
                        </div>
                        <div class="auth-checkout-feature-item">
                            <svg class="auth-feature-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            <span><strong>Coordinación por WhatsApp:</strong> El pago se coordina vía transferencia bancaria al <a href="javascript:void(0)" onclick="openWhatsAppCheckout(event)" target="_blank" rel="noopener noreferrer" id="authInlineWhatsappLink" class="auth-whatsapp-link">829-472-1257</a> para recibir tu clave <strong>Dilithium-5</strong>.</span>
                        </div>
                    </div>
                    
                    <div class="auth-checkout-actions">
                        <a href="javascript:void(0)" onclick="openWhatsAppCheckout(event)" target="_blank" rel="noopener noreferrer" class="auth-btn-whatsapp" id="authWhatsappBtn" title="Abrir WhatsApp con confirmación formal de términos">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.879.814 2.795.815 3.179 0 5.767-2.587 5.768-5.766.001-3.18-2.585-5.767-5.767-5.801zm3.376 8.163c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.025-.48-1.583-.657-2.589-2.28-2.667-2.384-.078-.104-.633-.842-.633-1.608 0-.765.401-1.141.543-1.295.144-.155.312-.194.417-.194.104 0 .208.001.299.006.096.004.224-.036.35.267.13.312.443 1.077.482 1.156.039.078.065.169.013.273-.052.104-.078.169-.156.26-.078.091-.163.203-.234.273-.078.078-.16.163-.069.318.091.156.403.666.865 1.077.595.53 1.097.694 1.253.772.156.078.247.065.338-.039.091-.104.39-.455.494-.611.104-.156.208-.13.351-.078.143.052.91.429 1.066.507.156.078.26.117.299.182.039.065.039.377-.105.782z"/></svg>
                            <span>WhatsApp: 829-472-1257</span>
                        </a>
                        <button type="button" class="auth-btn-capture" id="authCaptureCheckoutBtn" onclick="triggerCheckoutCapture()" title="Descargar comprobante de aceptación de términos PNG">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                            <span>Capturar PNG</span>
                        </button>
                        <button type="button" class="auth-btn-copy-msg" id="authCopyWhatsappBtn" onclick="copyWhatsAppMessage()" title="Copiar el payload JSON">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            <span>Copiar Payload</span>
                        </button>
                    </div>

                    <label class="auth-checkout-checkbox-label">
                        <input type="checkbox" id="authCheckoutCheckbox" required>
                        <span><strong>Confirmo la Aceptación de Términos y Política de Privacidad</strong> (Suscripción US$ 60.27 / mes coordinada vía WhatsApp).</span>
                    </label>
                </div>
            </div>

            <div class="auth-panel" id="authPanelRecover">
                <label class="auth-label" for="authRecoverInput">Clave L8REC o código de respaldo</label>
                <input class="auth-input" id="authRecoverInput" type="password" autocomplete="off" spellcheck="false" placeholder="L8REC-… o XXXX-XXXX-XXXX">
                <div class="cf-turnstile" id="cfTurnstileRecover" data-sitekey="<?php echo htmlspecialchars(function_exists("cfTurnstileGetSiteKey") ? cfTurnstileGetSiteKey() : "0x4AAAAAAEfpecWchE9q2-cs", ENT_QUOTES, "UTF-8"); ?>" data-callback="onTurnstileSuccessRecover" data-expired-callback="onTurnstileExpireRecover" data-theme="light" data-size="flexible" style="margin:10px 0;"></div>
                <button type="button" class="auth-btn" id="authRecoverBtn">Recuperar y regenerar claves</button>
                <p class="auth-foot" style="margin-top:10px;">Si perdiste AES/L8ID pero guardaste el kit, aquí emites claves nuevas. Las anteriores quedan invalidadas.</p>
            </div>

            <div class="auth-panel" id="authPanelValidate">
                <label class="auth-label" for="authValidateInput">Clave o Cuenta a Comprobar</label>
                <input class="auth-input" id="authValidateInput" type="text" autocomplete="off" spellcheck="false" placeholder="Pega tu clave AES-256, L8ID, ID acct_... o L8REC">
                <button type="button" class="auth-btn" id="authValidateBtn">Comprobar en Supabase</button>
                <div id="authValidateResult" style="display:none; margin-top:12px; padding:12px; border-radius:6px; background:#f8fafc; border:1px solid #cbd5e1; font-size:11.5px; line-height:1.5;"></div>
                <p class="auth-foot" style="margin-top:10px;">Diagnóstico en vivo: Verifica si tu cuenta o claves existen sincronizadas en Supabase sin revelar secretos.</p>
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
         POLÍTICA DE PRIVACIDAD, TRATAMIENTO DE DATOS Y CERTIFICACIÓN DETERMINISTA (DINÁMICA)
         ========================================================================= -->
    <div id="privacyPolicyModal" class="privacy-modal-overlay" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="privacyModalTitle">
        <div class="privacy-modal-card">
            <!-- Header -->
            <div class="privacy-modal-header">
                <div>
                    <span class="admin-gate-badge" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; font-size:11px; padding:3px 8px; border-radius:20px; font-weight:600; display:inline-flex; align-items:center; gap:4px;">
                        <svg style="width:12px;height:12px;fill:currentColor;" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                        Hashcod Codespace · Arquitectura Real & Certificación PQC
                    </span>
                    <h2 class="admin-gate-title" id="privacyModalTitle" style="font-size:16px; font-weight:700; color:#0f172a; margin:4px 0 0;">Política de Privacidad y Modelo Operativo</h2>
                </div>
                <button type="button" class="admin-close-btn" onclick="closePrivacyPolicyModal()" title="Cerrar política de privacidad" style="background:#f1f5f9; border:none; border-radius:50%; width:28px; height:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#64748b;">
                    <svg style="width:14px;height:14px;fill:currentColor;" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>

            <!-- Dynamic Tabs Navigation -->
            <div class="privacy-tabs-bar">
                <button type="button" class="privacy-tab-btn active" onclick="showPrivacyTab('tab-scope')" id="btnTab-scope">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    1. Alcance & Cero Telemetría
                </button>
                <button type="button" class="privacy-tab-btn" onclick="showPrivacyTab('tab-openclaw')" id="btnTab-openclaw">
                    <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-6h2zm0-8h-2V7h2z"/></svg>
                    2. OpenClaw 🦞 & Agentes
                </button>
                <button type="button" class="privacy-tab-btn" onclick="showPrivacyTab('tab-crypto')" id="btnTab-crypto">
                    <svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                    3. Criptografía PQC & Strix
                </button>
                <button type="button" class="privacy-tab-btn" onclick="showPrivacyTab('tab-storage')" id="btnTab-storage">
                    <svg viewBox="0 0 24 24"><path d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z"/></svg>
                    4. SODA Storage & Docs
                </button>
                <button type="button" class="privacy-tab-btn" onclick="showPrivacyTab('tab-license')" id="btnTab-license">
                    <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                    5. Licenciamiento FOSS
                </button>
                <button type="button" class="privacy-tab-btn" onclick="showPrivacyTab('tab-evidence')" id="btnTab-evidence">
                    <svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                    6. Evidencias & Auditoría
                </button>
                <button type="button" class="privacy-tab-btn" onclick="showPrivacyTab('tab-gov')" id="btnTab-gov" style="color:#0284c7;">
                    <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                    7. Validación Legal (Rep. Dom. 🇩🇴)
                </button>
            </div>

            <!-- Body Container -->
            <div class="privacy-modal-body">
                
                <!-- TAB 1: ALCANCE & CERO TELEMETRÍA -->
                <div class="privacy-tab-pane active" id="pane-tab-scope">
                    <div class="privacy-highlight-box" style="background:#f0fdf4; border-left:4px solid #16a34a; color:#14532d; padding:14px 16px; margin-bottom:16px; border-radius:4px;">
                        <div style="font-weight:700; font-size:13px; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                            <svg style="width:16px;height:16px;fill:#16a34a;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                            Declaración de Cero Telemetría y Soberanía Total de Datos (Own-Your-Data)
                        </div>
                        <p style="margin:0; font-size:12px; line-height:1.55;">
                            <strong>Hashcod Codespace</strong> opera bajo un principio estricto de <em>Zero-Knowledge</em> y computación aislada. No recopilamos rastreo publicitario, no vendemos datos ni almacenamos telemetría invasiva. Todo el código fuente y los proyectos se gestionan localmente en tu carpeta <code>~/workspace</code>.
                        </p>
                    </div>

                    <h3>🏛️ Arquitectura Operativa y Servicios Activos</h3>
                    <p>La plataforma integra de manera real y funcional los siguientes componentes de cómputo:</p>
                    <div class="privacy-vector-grid">
                        <div class="privacy-vector-card">
                            <div class="privacy-vector-head">
                                <svg viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
                                Motores Nativos Multi-Lenguaje
                            </div>
                            <div class="privacy-vector-desc">
                                Micro-core ultra rápido en <strong>C99</strong>, orquestador concurrente en <strong>Go</strong> (Goroutines pool), stack de inferencia en <strong>Rust</strong> (NVIDIA Dynamo) y backend <strong>PHP 8.1 / Python 3.12</strong>.
                            </div>
                        </div>

                        <div class="privacy-vector-card">
                            <div class="privacy-vector-head">
                                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                                Workspace Central & POSIX Shell
                            </div>
                            <div class="privacy-vector-desc">
                                Terminal Bash interactiva con soporte POSIX completo, gestión de repositorios Git en vivo y enlaces hacia entornos Linux/Ubuntu y macOS.
                            </div>
                        </div>

                        <div class="privacy-vector-card">
                            <div class="privacy-vector-head">
                                <svg viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9z"/></svg>
                                Dual-Catalyst 4-ENV Tunnel
                            </div>
                            <div class="privacy-vector-desc">
                                Canales de comunicación aislados <code>/a</code> (macho: 1 vía ENV_1 ➜ ENV_3) y <code>/b</code> (hembra: 2 vías reactivas ENV_2 ⟷ ENV_4) para flujos de datos sin interferencias.
                            </div>
                        </div>

                        <div class="privacy-vector-card">
                            <div class="privacy-vector-head">
                                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/></svg>
                                Certificación Determinista de IA
                            </div>
                            <div class="privacy-vector-desc">
                                Software de verificación que audita entradas, salidas y modelos empleados, emitiendo certificados criptográficos inmutables respaldados por hashes NIST PQC.
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TAB 2: OPENCLAW & AGENTES -->
                <div class="privacy-tab-pane" id="pane-tab-openclaw">
                    <div class="privacy-highlight-box" style="background:#fff7ed; border-left:4px solid #ea580c; color:#9a3412; padding:14px 16px; margin-bottom:16px; border-radius:4px;">
                        <div style="font-weight:700; font-size:13px; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                            <span style="font-size:16px;">🦞</span> OpenClaw Multi-Channel AI Gateway & Autonomous Agents
                        </div>
                        <p style="margin:0; font-size:12px; line-height:1.55;">
                            La plataforma integra el ecosistema <strong>OpenClaw 2026.8.1</strong> para desplegar agentes autónomos multi-canal sobre el workspace central.
                        </p>
                    </div>

                    <h3>🦞 Tratamiento de Datos en el Gateway OpenClaw</h3>
                    <ul>
                        <li><strong>Puerto RPC y Gateway Local (18789):</strong> El daemon opera en un puerto local aislado (<code>127.0.0.1:18789</code>) comunicándose vía WebSocket y HTTP RPC seguro con el Codespace.</li>
                        <li><strong>Zero-Data Retention en Canales de Mensajería:</strong> Los mensajes procesados a través de WhatsApp, Telegram, Discord, Slack o Webhooks son utilizados exclusivamente para ejecutar la tarea solicitada y devolver la respuesta al operador, sin retención secundaria en servidores externos.</li>
                        <li><strong>50+ Habilidades Autónomas Aisladas (Skills):</strong> Las habilidades activas (<code>coding-agent</code>, <code>diagram-maker</code>, <code>github</code>, <code>gh-issues</code>, <code>gemini</code>, <code>active-memory</code>) operan dentro de los límites estrictos del directorio <code>workspace/</code>.</li>
                        <li><strong>Custodia de API Keys de Modelos:</strong> Las credenciales para Claude 3.7 Sonnet, OpenAI o Gemini se leen directamente desde la bóveda criptográfica local y nunca se comparten con terceros.</li>
                    </ul>
                </div>

                <!-- TAB 3: CRIPTOGRAFÍA PQC & STRIX -->
                <div class="privacy-tab-pane" id="pane-tab-crypto">
                    <div class="privacy-highlight-box" style="background:#f8fafc; border-left:4px solid #6366f1; color:#1e1b4b; padding:14px 16px; margin-bottom:16px; border-radius:4px;">
                        <div style="font-weight:700; font-size:13px; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                            <svg style="width:16px;height:16px;fill:#6366f1;" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                            Seguridad Post-Cuántica (NIST PQC) y Auditoría Strix AI
                        </div>
                        <p style="margin:0; font-size:12px; line-height:1.55;">
                            Implementación nativa de los algoritmos estandarizados por el NIST para resistencia frente a computación cuántica.
                        </p>
                    </div>

                    <h3>🔐 Bóveda Criptográfica y Firmas Digitales</h3>
                    <ul>
                        <li><strong>CRYSTALS-Dilithium Nivel 5 (ML-DSA-87):</strong> Empleado para la autenticación criptográfica del panel de administración y verificación de integridad de código.</li>
                        <li><strong>SPHINCS+ (SLH-DSA-SHAKE-256s):</strong> Sellos criptográficos sin estado para certificación inmutable de activos.</li>
                        <li><strong>Bóveda AES-256-GCM:</strong> Cifrado simétrico autenticado para proteger credenciales y claves de cuenta en <code>data_storage/hashcod_keys</code>.</li>
                        <li><strong>Strix Security Scanner:</strong> Auditor autónomo en Python (<code>strix_scanner.py</code>) que evalúa en tiempo real puertos abiertos, directivas de seguridad CSP, HSTS y cabeceras OWASP contra vulnerabilidades de red.</li>
                    </ul>
                </div>

                <!-- TAB 4: SODA STORAGE & DOCS -->
                <div class="privacy-tab-pane" id="pane-tab-storage">
                    <div class="privacy-highlight-box" style="background:#f0fdfa; border-left:4px solid #0d9488; color:#134e4a; padding:14px 16px; margin-bottom:16px; border-radius:4px;">
                        <div style="font-weight:700; font-size:13px; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                            <svg style="width:16px;height:16px;fill:#0d9488;" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
                            SODA Storage Controller & Suites de Documentos Locales
                        </div>
                        <p style="margin:0; font-size:12px; line-height:1.55;">
                            Almacenamiento unificado de datos y edición ofimática local sin dependencia de nubes cerradas.
                        </p>
                    </div>

                    <h3>💾 Almacenamiento y Edición de Documentos</h3>
                    <ul>
                        <li><strong>SODA Storage Pools & Fileshares:</strong> Controlador en Python (<code>storage_controller.py</code>) para aprovisionamiento dinámico de volúmenes NVMe y carpetas compartidas NFS/POSIX.</li>
                        <li><strong>TipTap Editor (Word-like):</strong> Editor nativo enriquecido para documentos técnicos montado localmente en <code>/tiptap</code>.</li>
                        <li><strong>LibreOffice Server Workspace:</strong> Suite ofimática completa ejecutada en el servidor sin transferir archivos a nubes de terceros.</li>
                        <li><strong>Persistencia Supabase Cloud:</strong> Tablas relacionales PostgreSQL sincronizadas con cifrado en reposo para metadatos de sesión y kits de recuperación L8REC.</li>
                    </ul>
                </div>

                <!-- TAB 5: LICENCIAMIENTO FOSS -->
                <div class="privacy-tab-pane" id="pane-tab-license">
                    <div class="privacy-highlight-box" style="background:#f8fafc; border-left:4px solid #475569; color:#0f172a; padding:14px 16px; margin-bottom:16px; border-radius:4px;">
                        <div style="font-weight:700; font-size:13px; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                            <svg style="width:16px;height:16px;fill:#475569;" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                            Declaración Oficial de Licencias Open Source & Propiedad
                        </div>
                        <p style="margin:0; font-size:12px; line-height:1.55;">
                            Transparencia en el uso de componentes de código abierto y deslinde de licencias.
                        </p>
                    </div>

                    <h3>⚖️ Desglose de Licencias</h3>
                    <ul>
                        <li><strong>GNU Bash (GNU GPLv3):</strong> La herramienta de terminal GNU Bash integrada para la ejecución de comandos es software libre distribuido bajo la <strong>GNU General Public License v3</strong>. Aplica exclusivamente a la ejecución del intérprete shell.</li>
                        <li><strong>OpenClaw (Licencia MIT):</strong> El framework de gateway y agente OpenClaw es software de código abierto bajo licencia MIT.</li>
                        <li><strong>Propiedad Intelectual de Hashcod:</strong> Todo el núcleo orquestador, la arquitectura Dual-Catalyst 4-ENV, las firmas post-cuánticas Dilithium-5, el panel Warp y la interfaz gráfica completa son propiedad exclusiva de <strong>Hashcod Codespace</strong>.</li>
                    </ul>
                </div>

                <!-- TAB 6: EVIDENCIAS & AUDITORÍA -->
                <div class="privacy-tab-pane" id="pane-tab-evidence">
                    <h3>📸 Evidencia de Análisis y Software de Certificación</h3>
                    <p>Muestra real del software de análisis de datos y telemetría de interacción con IA utilizado para respaldar las certificaciones deterministas emitidas por la plataforma:</p>
                    
                    <div class="privacy-evidence-card" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px; margin-top:12px;">
                        <img src="gus-mav-analysis-sample.png" alt="Software de prueba de uso de IA a través de chat local por API Rest (GUS MAV)" class="privacy-evidence-img" onclick="window.open('gus-mav-analysis-sample.png', '_blank')" title="Haz clic para ver la captura en tamaño completo" style="width:100%; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer;">
                        <div class="privacy-evidence-caption" style="margin-top:10px; font-size:12px; color:#475569; line-height:1.5;">
                            <strong>Figura 1: Software de prueba de uso de IA a través de chat local por API Rest (GUS MAV v1.1.1).</strong>
                            <p style="margin:4px 0 0;">
                                Registro de canales de <em>Inputs</em>, <em>Outputs</em>, repeticiones y modelos empleados en tiempo real para respaldar de forma determinista la certificación de proyectos creados con IA.
                            </p>
                        </div>
                    </div>

                    <div class="privacy-evidence-card" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px; margin-top:20px;">
                        <div style="font-size:13px; font-weight:700; color:#0f172a; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
                            <svg style="width:16px;height:16px;fill:#16a34a;" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.879.814 2.795.815 3.179 0 5.767-2.587 5.768-5.766.001-3.18-2.585-5.767-5.767-5.801zm3.376 8.163c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.025-.48-1.583-.657-2.589-2.28-2.667-2.384-.078-.104-.633-.842-.633-1.608 0-.765.401-1.141.543-1.295.144-.155.312-.194.417-.194.104 0 .208.001.299.006.096.004.224-.036.35.267.13.312.443 1.077.482 1.156.039.078.065.169.013.273-.052.104-.078.169-.156.26-.078.091-.163.203-.234.273-.078.078-.16.163-.069.318.091.156.403.666.865 1.077.595.53 1.097.694 1.253.772.156.078.247.065.338-.039.091-.104.39-.455.494-.611.104-.156.208-.13.351-.078.143.052.91.429 1.066.507.156.078.26.117.299.182.039.065.039.377-.105.782z"/></svg>
                            <span>Como debe de verse el whatsapp</span>
                        </div>
                        <img src="whatsapp-checkout-preview.png" alt="Como debe de verse el whatsapp - diktatcart" class="privacy-evidence-img" onclick="window.open('whatsapp-checkout-preview.png', '_blank')" title="Haz clic para ver la captura en tamaño completo" style="width:100%; max-width:640px; display:block; margin:0 auto; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                        <div class="privacy-evidence-caption" style="margin-top:10px; font-size:12px; color:#475569; line-height:1.5;">
                            <strong>Figura 2: Interfaz oficial de solicitud y checkout vía WhatsApp (diktatcart: 829-472-1257).</strong>
                            <p style="margin:4px 0 0;">
                                Muestra c&oacute;mo debe de verse la pantalla de WhatsApp al iniciar la solicitud de suscripci&oacute;n mensual de <strong>US$ 60.27</strong> para Hashcod Codespace y obtener la clave de acceso Dilithium-5 tras la confirmaci&oacute;n del dep&oacute;sito o transferencia bancaria.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- TAB 7: VALIDACIÓN GUBERNAMENTAL & LEGAL (REPÚBLICA DOMINICANA) -->
                <div class="privacy-tab-pane" id="pane-tab-gov">
                    <div class="privacy-highlight-box" style="background:#f0f9ff; border-left:4px solid #0284c7; color:#0369a1; padding:14px 16px; margin-bottom:16px; border-radius:4px;">
                        <div style="font-weight:700; font-size:13px; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                            <span style="font-size:16px;">🇩🇴</span>
                            Certificación, Registro de Marca y Validación Oficial del Gobierno Dominicano
                        </div>
                        <p style="margin:0; font-size:12px; line-height:1.55;">
                            <strong>Hashcod Codespace</strong> y su infraestructura de desarrollo, criptografía y certificación de software se encuentran formalmente registrados y respaldados ante los organismos oficiales del Estado Dominicano: <strong>ONAPI</strong> (Oficina Nacional de la Propiedad Industrial), <strong>DGII</strong> (Dirección General de Impuestos Internos) y la <strong>Cámara de Comercio y Producción</strong>.
                        </p>
                    </div>

                    <h3>🏛️ Documentación Legal y Certificados Gubernamentales</h3>
                    <p style="font-size:12.5px; color:#475569; margin-bottom:16px;">
                        Los siguientes títulos y certificados confieren amparo jurídico legal, derechos exclusivos de explotación y formalidad tributaria sobre la plataforma y servicios de Hashcod:
                    </p>

                    <!-- GRID DE DOCUMENTOS LEGALES -->
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-bottom:20px;">
                        
                        <!-- 1. ONAPI Certificado Marca -->
                        <div class="privacy-evidence-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:14px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                            <div style="font-size:12px; font-weight:700; color:#0f172a; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
                                <span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-size:10px;">ONAPI</span>
                                Certificado de Marca Mixta "Hashcod"
                            </div>
                            <img src="gob-onapi-marca-hashcod.png" alt="Certificado ONAPI de Registro de Marca Mixta Hashcod" class="privacy-evidence-img" onclick="window.open('gob-onapi-marca-hashcod.png', '_blank')" title="Clic para ampliar documento" style="width:100%; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer;">
                            <div style="margin-top:8px; font-size:11.5px; color:#475569; line-height:1.45;">
                                <strong>Núm. de Registro: 336973 (Clase 42 Internacional)</strong><br>
                                <strong>Vigencia:</strong> 18/08/2026 – 18/08/2036 (10 años)<br>
                                <strong>Cobertura:</strong> Software como Servicio (SaaS), Criptografía aplicada a software, Protección de datos digitales, Certificación de IA y Almacenamiento seguro.
                            </div>
                        </div>

                        <!-- 2. ONAPI Oficio de Envío -->
                        <div class="privacy-evidence-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:14px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                            <div style="font-size:12px; font-weight:700; color:#0f172a; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
                                <span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-size:10px;">ONAPI</span>
                                Oficio Oficial de Concesión y Registro
                            </div>
                            <img src="gob-onapi-cert-envio.png" alt="Envío de Certificación de Registro de Marca ONAPI" class="privacy-evidence-img" onclick="window.open('gob-onapi-cert-envio.png', '_blank')" title="Clic para ampliar documento" style="width:100%; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer;">
                            <div style="margin-top:8px; font-size:11.5px; color:#475569; line-height:1.45;">
                                <strong>Solicitud Núm.: 2026-35462</strong><br>
                                <strong>Titular:</strong> Emil Enmanuel Pieter Mora<br>
                                <strong>Emisión:</strong> Ministerio de Industria, Comercio y Mipymes (MICM) / Lic. Michelle Marie Guzmán Soñé, Directora de Signos Distintivos.
                            </div>
                        </div>

                        <!-- 3. DGII Certificación RNC -->
                        <div class="privacy-evidence-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:14px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                            <div style="font-size:12px; font-weight:700; color:#0f172a; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
                                <span style="background:#dcfce7; color:#15803d; padding:2px 6px; border-radius:4px; font-size:10px;">DGII</span>
                                Certificación de Contribuyente Activo
                            </div>
                            <img src="gob-dgii-rnc-certificacion.png" alt="Certificación DGII RNC Activo" class="privacy-evidence-img" onclick="window.open('gob-dgii-rnc-certificacion.png', '_blank')" title="Clic para ampliar documento" style="width:100%; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer;">
                            <div style="margin-top:8px; font-size:11.5px; color:#475569; line-height:1.45;">
                                <strong>RNC No.: 40209369293 (Cert. Núm. C0426011487298)</strong><br>
                                <strong>Condición:</strong> Contribuyente Activo Ordinario<br>
                                <strong>Actividad Económica:</strong> Diseño y Desarrollo de Software.<br>
                                <strong>Ministerio:</strong> Hacienda y Economía / DGII República Dominicana.
                            </div>
                        </div>

                        <!-- 4. Cámara de Comercio Registro Mercantil (3 Páginas Completas) -->
                        <div class="privacy-evidence-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:14px; box-shadow:0 1px 3px rgba(0,0,0,0.05); grid-column: 1 / -1;">
                            <div style="font-size:13px; font-weight:700; color:#0f172a; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <span style="background:#fef3c7; color:#b45309; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700;">CÁMARA DE COMERCIO</span>
                                    <span>Certificado de Registro Mercantil (No. 3323LV-PF · DIKTATCART)</span>
                                </div>
                                <span style="font-size:11px; color:#64748b;">Validez Legal Ley 126-02 · 3 Páginas Oficiales</span>
                            </div>
                            
                            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:12px;">
                                <div>
                                    <div style="font-size:11px; font-weight:600; color:#475569; margin-bottom:4px;">Página 1: Titularidad & RNC</div>
                                    <img src="gob-camara-comercio-registro-mercantil-p1.png" alt="Registro Mercantil Página 1" class="privacy-evidence-img" onclick="window.open('gob-camara-comercio-registro-mercantil-p1.png', '_blank')" title="Clic para ampliar Página 1" style="width:100%; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
                                </div>
                                <div>
                                    <div style="font-size:11px; font-weight:600; color:#475569; margin-bottom:4px;">Página 2: Objeto, IA & Criptografía</div>
                                    <img src="gob-camara-comercio-registro-mercantil-p2.png" alt="Registro Mercantil Página 2" class="privacy-evidence-img" onclick="window.open('gob-camara-comercio-registro-mercantil-p2.png', '_blank')" title="Clic para ampliar Página 2" style="width:100%; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
                                </div>
                                <div>
                                    <div style="font-size:11px; font-weight:600; color:#475569; margin-bottom:4px;">Página 3: Firma Digital & Registrador</div>
                                    <img src="gob-camara-comercio-registro-mercantil-p3.png" alt="Registro Mercantil Página 3" class="privacy-evidence-img" onclick="window.open('gob-camara-comercio-registro-mercantil-p3.png', '_blank')" title="Clic para ampliar Página 3" style="width:100%; border-radius:6px; border:1px solid #cbd5e1; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
                                </div>
                            </div>

                            <div style="font-size:11.5px; color:#475569; line-height:1.5; background:#f8fafc; padding:10px 12px; border-radius:6px; border:1px solid #e2e8f0;">
                                <strong>Nombre Comercial / Establecimiento:</strong> DIKTATCART (Reg. No. 925063)<br>
                                <strong>Titular:</strong> Emil Enmanuel Pieter Mora · <strong>RNC:</strong> 402-0936929-3 · <strong>WhatsApp Oficial:</strong> (829) 472-1257<br>
                                <strong>Actividad Registrada:</strong> Diseño y desarrollo de software, soluciones digitales, Inteligencia Artificial, automatización y herramientas criptográficas.<br>
                                <strong>Validación Oficial:</strong> Código <code>87CD8008-AC9C-481B-8C8B-1D63D2246AD1</code> verificable en <code>www.camaralavega.org.do</code>.
                            </div>
                        </div>

                    </div>
                </div>


            </div>

            <!-- Footer -->
            <div class="privacy-modal-footer">
                <div style="font-size:11.5px; color:#64748b; display:flex; align-items:center; gap:6px;">
                    <svg style="width:14px;height:14px;fill:#10b981;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    <span>Vigencia 2026.8 · Cumplimiento NIST PQC & Zero-Knowledge</span>
                </div>
                <button type="button" class="admin-gate-btn" onclick="acceptAndClosePrivacyPolicy()" style="background:#0f172a; color:#fff; border:none; padding:9px 20px; font-weight:600; border-radius:8px; cursor:pointer; font-size:12.5px; display:inline-flex; align-items:center; gap:6px;">
                    <span>Entendido y Aceptar Política</span>
                    <svg style="width:14px;height:14px;fill:currentColor;" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
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
                <button type="button" class="hashcod-dock-slot is-filled is-ready" id="hashcodDockGridBtn" data-dock-slot="7" title="Polyglot Grid API Launcher &amp; Code Studio" aria-label="Abrir Polyglot Grid API Launcher" onclick="togglePolyglotGridModal()">
                    <svg style="width:13px; height:13px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="2" width="20" height="20" rx="3" stroke="#00f3ff" stroke-width="1.5" fill="rgba(0, 243, 255, 0.1)"/>
                        <line x1="2" y1="8" x2="22" y2="8" stroke="#00f3ff" stroke-width="1" stroke-dasharray="2 2"/>
                        <line x1="2" y1="14" x2="22" y2="14" stroke="#00f3ff" stroke-width="1" stroke-dasharray="2 2"/>
                        <line x1="8" y1="2" x2="8" y2="22" stroke="#00f3ff" stroke-width="1" stroke-dasharray="2 2"/>
                        <line x1="14" y1="2" x2="14" y2="22" stroke="#00f3ff" stroke-width="1" stroke-dasharray="2 2"/>
                        <circle cx="11" cy="11" r="2.5" fill="#00f3ff"/>
                    </svg>
                </button>
                <div class="hashcod-clock-pop" id="hashcodClockPop" role="dialog" aria-label="Hora actual" aria-hidden="true">
                    <div class="hashcod-clock-label">Hora actual</div>
                    <div class="hashcod-clock-time" id="hashcodClockTime">00:00:00</div>
                </div>
            </nav>
        </div>
        <div class="top-bar-right" style="display:flex; align-items:center; gap:8px;">
           <!-- CUIDADO: Asegúrate de escribir la letra 'l' minúscula al inicio, no el número '1' -->
<button type="button" class="icon-logout" id="topBarLogoutBtn" title="Cerrar sesión de la cuenta" aria-label="Cerrar sesión de la cuenta" onclick="window.l8LogoutSession && window.l8LogoutSession()">

 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20" aria-hidden="true" style="overflow:visible;">
<circle cx="24" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="3"></circle>
<line x1="22.09" x2="13.5" y1="9.63" y2="16.5" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="3"></line>
<line x1="26.24" x2="34.5" y1="9.89" y2="16.5" fill="none" stroke="currentColor" stroke-width="3"></line>
<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="3" d="M26.24,39.5H6.5c-1.1,0-2-0.9-2-2v-19c0-1.1,0.9-2,2-2h7"></path>
<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="3" d="M24,16.5h18.5c1.1,0,2,0.9,2,2v19c0,1.1-0.9,2-2,2h-6.6"></path>
<path fill="currentColor" d="M11.35,32.1c-1.86,0-3.38-1.84-3.38-4.1s1.52-4.1,3.38-4.1c1.48,0,2.37,1.01,2.66,1.6c0.25,0.51,0.04,1.12-0.47,1.37 c-0.5,0.25-1.11,0.04-1.36-0.45c-0.05-0.08-0.29-0.47-0.83-0.47c-0.71,0-1.33,0.96-1.33,2.05c0,1.09,0.62,2.05,1.33,2.05 c0.57,0,0.82-0.45,0.82-0.45c0.25-0.51,0.86-0.72,1.37-0.47c0.51,0.25,0.72,0.86,0.47,1.37C13.72,31.1,12.83,32.1,11.35,32.1z"></path>
<path fill="currentColor" d="M40,30.05h-2.05v-1.03h1.54c0.57,0,1.03-0.46,1.03-1.03c0-0.57-0.46-1.03-1.03-1.03h-1.54v-1.03H40 c0.57,0,1.03-0.46,1.03-1.03S40.57,23.9,40,23.9h-3.08c-0.57,0-1.03,0.46-1.03,1.03v6.16c0,0.57,0.46,1.03,1.03,1.03H40 c0.57,0,1.03-0.46,1.03-1.03C41.03,30.51,40.57,30.05,40,30.05z"></path>
<path fill="currentColor" d="M19.7,32.1h-3.08c-0.57,0-1.03-0.46-1.03-1.03v-6.16c0-0.57,0.46-1.03,1.03-1.03s1.03,0.46,1.03,1.03v5.13h2.05 c0.57,0,1.03,0.46,1.03,1.03S20.27,32.1,19.7,32.1z"></path>
<path fill="currentColor" d="M24.66,32.1c-1.98,0-3.59-1.84-3.59-4.1s1.61-4.1,3.59-4.1s3.59,1.84,3.59,4.1S26.64,32.1,24.66,32.1z M24.66,25.95 c-0.83,0-1.54,0.94-1.54,2.05c0,1.11,0.7,2.05,1.54,2.05c0.83,0,1.54-0.94,1.54-2.05C26.2,26.89,25.49,25.95,24.66,25.95z"></path>
<path fill="currentColor" d="M32.59,32.1h-1.12c-1.11,0-1.89-0.66-2.17-0.94c-0.4-0.4-0.4-1.05,0-1.45s1.05-0.4,1.45,0c0.08,0.08,0.37,0.34,0.72,0.34 h1.12c0.28,0,0.51-0.23,0.51-0.51c0-0.28-0.23-0.51-0.51-0.51h-0.9c-1.41,0-2.57-1.15-2.57-2.57c0-1.41,1.15-2.57,2.57-2.57h0.9 c1.16,0,1.92,0.73,2.01,0.81c0.4,0.4,0.4,1.05,0,1.45c-0.4,0.4-1.05,0.4-1.45,0c0,0,0,0,0,0c0,0-0.25-0.21-0.56-0.21h-0.9 c-0.28,0-0.51,0.23-0.51,0.51c0,0.28,0.23,0.51,0.51,0.51h0.9c1.41,0,2.57,1.15,2.57,2.57C35.15,30.95,34,32.1,32.59,32.1z"></path>
</svg>
            </button>
            <button type="button" class="icon-mobile" id="mobileModeBtn" title="Versión móvil" aria-label="Activar versión móvil" aria-pressed="false" onclick="toggleMobileMode()">
                <img src="mobile-mode-icon.png" alt="Versión móvil" class="mobile-toggle-img" style="width:24px; height:24px; object-fit:contain; display:block; border-radius:4px;">
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

    <!-- Polyglot Grid API Launcher & Code Studio Modal (Circle 7) -->
        <!-- Polyglot Grid API Launcher & Code Studio Modal (Circle 7 — Tkinter Studio) -->
    <div class="polyglot-grid-overlay" id="polyglotGridOverlay" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="pgModalTitle">
        <div class="polyglot-studio-modal" id="polyglotStudioModal">
            <!-- Tkinter Main Title Bar -->
            <div class="tk-title-bar">
                <div class="tk-title-left">
                    <div class="tk-logo-icon">
                        <div class="tk-logo-bar-yellow"></div>
                        <div class="tk-logo-bar-blue"></div>
                        <div class="tk-logo-bar-red"></div>
                    </div>
                    <span class="tk-title-text" id="pgModalTitle">Grid View — Tkinter Polyglot Studio</span>
                </div>
                <div class="tk-title-right">
                    <button type="button" class="tk-btn-window" id="pgBtnHelp" title="Help">?</button>
                    <button type="button" class="tk-btn-window" id="pgBtnMin" title="Minimize">-</button>
                    <button type="button" class="tk-btn-window" id="pgBtnMax" title="Maximize">□</button>
                    <button type="button" class="tk-btn-window" id="polyglotGridCloseBtn" title="Close (Esc)">✕</button>
                </div>
            </div>

            <!-- Tkinter Menu Bar -->
            <div class="tk-menu-bar">
                <button type="button" class="tk-menu-item" id="polyglotUploadFolderBtn"><u>F</u>ile</button>
                <input type="file" id="polyglotDirInput" webkitdirectory directory multiple style="display:none;" aria-hidden="true">
                <button type="button" class="tk-menu-item" id="polyglotExportBtn"><u>E</u>dit</button>
                <button type="button" class="tk-menu-item" id="polyglotImportBtn"><u>V</u>iew</button>
                <input type="file" id="polyglotImportInput" accept=".json" style="display:none;" aria-hidden="true">
                <button type="button" class="tk-menu-item" id="pgMenuHelp"><u>H</u>elp</button>
            </div>

            <!-- Navigation Tabs Bar -->
            <nav class="pg-tabs-bar" aria-label="Navegación de módulos Polyglot Studio">
                <button type="button" class="pg-tab-btn active" data-tab="matrix">Grid View (8×7)</button>
                <button type="button" class="pg-tab-btn" data-tab="explorer">Directory Explorer</button>
                <button type="button" class="pg-tab-btn" data-tab="studio">Code-to-API Studio</button>
                <button type="button" class="pg-tab-btn" data-tab="logs">Log Output</button>
            </nav>

            <!-- 4-Pane Responsive Workspace Body -->
            <div class="pg-workspace">
                <!-- Pane 1: 8x7 Coordinate Matrix Grid & Cell History Window -->
                <section class="pg-pane active-tab-pane" data-pane="matrix" aria-label="Matriz de coordenadas 8x7">
                    <div class="pg-matrix-container">
                        <!-- Left Viewport: 8x7 Matrix Grid -->
                        <div class="pg-matrix-left-col">
                            <div class="pg-grid-headers-x" style="display:none;"></div>
                            <div id="pgMatrixGridBody"></div>
                        </div>

                        <!-- Right Panel: Cell History (media_1788123344558.png) -->
                        <div class="tk-history-window">
                            <div class="tk-history-title-bar">
                                <div class="tk-title-left">
                                    <div class="tk-logo-icon">
                                        <div class="tk-logo-bar-yellow"></div>
                                        <div class="tk-logo-bar-blue"></div>
                                        <div class="tk-logo-bar-red"></div>
                                    </div>
                                    <span>Cell History</span>
                                </div>
                                <div class="tk-title-right">
                                    <button type="button" class="tk-btn-window">-</button>
                                    <button type="button" class="tk-btn-window">□</button>
                                    <button type="button" class="tk-btn-window">✕</button>
                                </div>
                            </div>

                            <div class="tk-history-menu">
                                <span style="text-decoration:underline;">File</span>
                                <span style="text-decoration:underline;">Edit</span>
                                <span style="text-decoration:underline;">View</span>
                                <span style="text-decoration:underline;">Help</span>
                            </div>

                            <div class="tk-history-content">
                                <div class="tk-history-header-row">
                                    <span id="pgInspectorCoordTitle">Cell (0, 0, 0, 0)</span>
                                    <span class="tk-history-status-badge" id="pgInspectorState">SUCCESS</span>
                                </div>

                                <div class="tk-history-row">
                                    <span class="tk-history-row-label">Bound File</span>
                                    <span class="tk-history-row-val" id="pgInspectorFile">services/ml_analyzer.py</span>
                                </div>

                                <div class="tk-history-row">
                                    <span class="tk-history-row-label">Target Function</span>
                                    <span class="tk-history-row-val" id="pgInspectorFunc">predict_classification</span>
                                </div>

                                <div class="tk-history-row">
                                    <span class="tk-history-row-label">Framework</span>
                                    <span class="tk-history-row-val" id="pgInspectorFw">FASTAPI</span>
                                </div>

                                <div class="tk-history-row">
                                    <span class="tk-history-row-label">Execution Count</span>
                                    <span class="tk-history-row-val" id="pgInspectorCount">1</span>
                                </div>

                                <div class="tk-history-row" style="border-bottom:none;">
                                    <span class="tk-history-row-label">Last Latency</span>
                                    <span class="tk-history-row-val" id="pgInspectorLatency">154ms</span>
                                </div>
                            </div>

                            <div class="tk-history-actions">
                                <button type="button" class="tk-btn-action" id="pgBatchArmBtn">⚡ Arm Selected</button>
                                <div style="display:flex; gap:8px;">
                                    <button type="button" class="tk-btn-action" id="pgBatchExecBtn" style="flex:1;">▶ Execute Selected</button>
                                    <button type="button" class="tk-btn-action" id="pgBatchClearBtn" style="width:100px;">✕ Clear</button>
                                </div>
                            </div>

                            <div class="tk-status-bar">
                                <div class="tk-status-left">Ready</div>
                                <div class="tk-status-right">Lines: 10</div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Pane 2: Directory Upload & File Explorer -->
                <section class="pg-pane" data-pane="explorer" aria-label="Explorador de archivos y carpetas">
                    <div class="pg-pane-head">
                        <span>Directory Explorer — Tkinter File Tree</span>
                        <div style="display:flex; gap:8px;">
                            <select id="polyglotPresetSelect" class="tk-btn-action" style="padding:2px 6px; font-size:11px;">
                                <option value="ml_analyzer.py">⚡ Preset: ML Inference (FastAPI / Sanic)</option>
                                <option value="math_service.py">⚡ Preset: Vector / Matrix Linear Algebra</option>
                                <option value="auth_controller.js">⚡ Preset: Auth &amp; JWT Controller (Express)</option>
                                <option value="payment_processor.go">⚡ Preset: Payment Processor (Go Gin)</option>
                                <option value="crypto_hasher.c">⚡ Preset: FNV-1a Crypto Hasher (C REST)</option>
                                <option value="OrderService.java">⚡ Preset: Order Service (Spring Boot)</option>
                            </select>
                            <button type="button" class="tk-btn-action" id="polyglotUploadFolderBtn2">Upload Folder...</button>
                        </div>
                    </div>
                    <div class="pg-pane-body" style="display:flex; flex-direction:column; gap:10px;">
                        <div class="pg-dropzone" id="polyglotDropZone" style="background:#ECE9D8; border:2px dashed #808080; padding:16px; text-align:center; font-weight:700;">
                            <span>Drag and drop code directories or scripts here</span>
                        </div>
                        <input type="search" id="polyglotFileSearch" placeholder="Filter files..." style="padding:6px; font-family:var(--tk-font-mono); border:1.5px solid #808080;">
                        <div class="pg-ext-filters" style="display:flex; gap:6px;">
                            <span class="pg-ext-chip active" data-ext="all">All</span>
                            <span class="pg-ext-chip" data-ext=".py">.py</span>
                            <span class="pg-ext-chip" data-ext=".js">.js</span>
                            <span class="pg-ext-chip" data-ext=".go">.go</span>
                            <span class="pg-ext-chip" data-ext=".c">.c</span>
                            <span class="pg-ext-chip" data-ext=".java">.java</span>
                        </div>
                        <div id="polyglotFileTree" style="background:#FFFFFF; border:1.5px solid #808080; padding:8px; height:240px; overflow-y:auto;"></div>
                        <button type="button" class="tk-btn-action" id="polyglotBindCellBtn">🔗 Bind Selected File to Active Coordinate</button>
                    </div>
                </section>

                <!-- Pane 3: Code Studio & Code-to-API Converter -->
                <section class="pg-pane" data-pane="studio" aria-label="Estudio de código y convertidor a API">
                    <div class="pg-pane-head">
                        <span>Code-to-API Studio — Polyglot REST Synthesizer</span>
                        <span style="font-size:11px; color:#000080;">6 Target Frameworks</span>
                    </div>
                    <div class="pg-pane-body" style="display:flex; flex-direction:column; gap:10px;">
                        <div class="pg-framework-selector" style="display:flex; gap:6px;">
                            <span class="pg-fw-pill active" data-fw="fastapi">Python FastAPI</span>
                            <span class="pg-fw-pill" data-fw="sanic">Python Sanic</span>
                            <span class="pg-fw-pill" data-fw="express">Node Express</span>
                            <span class="pg-fw-pill" data-fw="go">Go Gin</span>
                            <span class="pg-fw-pill" data-fw="c">C (libmicrohttpd)</span>
                            <span class="pg-fw-pill" data-fw="java">Java Spring Boot</span>
                        </div>
                        <div style="display:flex; gap:8px;">
                            <select id="pgMethodSelect" style="padding:6px; font-weight:700; border:1.5px solid #808080;">
                                <option value="POST">POST</option>
                                <option value="GET">GET</option>
                                <option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option>
                            </select>
                            <input type="text" id="pgPathInput" value="/api/v1/predict" style="flex:1; padding:6px; font-family:var(--tk-font-mono); border:1.5px solid #808080;">
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; flex:1; min-height:360px;">
                            <div style="display:flex; flex-direction:column; border:1.5px solid #808080;">
                                <div style="background:#ECE9D8; padding:4px 8px; font-weight:700; font-size:11px; border-bottom:1px solid #808080;">Source Code</div>
                                <textarea id="polyglotSourceEditor" style="flex:1; padding:8px; font-family:var(--tk-font-mono); font-size:12px; border:none; resize:none;" spellcheck="false"></textarea>
                            </div>
                            <div style="display:flex; flex-direction:column; border:1.5px solid #808080;">
                                <div style="background:#ECE9D8; padding:4px 8px; font-weight:700; font-size:11px; border-bottom:1px solid #808080; display:flex; justify-content:space-between;">
                                    <span>Synthesized REST Module</span>
                                    <div class="pg-snippet-tabs">
                                        <span class="pg-snippet-tab active" data-snippet="curl">curl</span>
                                        <span class="pg-snippet-tab" data-snippet="fetch">fetch()</span>
                                    </div>
                                </div>
                                <textarea id="polyglotGeneratedApi" readonly style="flex:1; padding:8px; font-family:var(--tk-font-mono); font-size:12px; border:none; resize:none; color:#000080;" spellcheck="false"></textarea>
                                <pre id="polyglotSnippetOutput" style="display:none;"></pre>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Pane 4: Log Output Window (media_1788123330915.png) -->
                <section class="pg-pane pg-pane-logs" data-pane="logs" aria-label="Consola de ejecución en tiempo real">
                    <div class="tk-log-window-container">
                        <div class="tk-history-title-bar">
                            <div class="tk-title-left">
                                <div class="tk-logo-icon">
                                    <div class="tk-logo-bar-yellow"></div>
                                    <div class="tk-logo-bar-blue"></div>
                                    <div class="tk-logo-bar-red"></div>
                                </div>
                                <span>Log Output</span>
                            </div>
                            <div class="tk-title-right">
                                <button type="button" class="tk-btn-window">?</button>
                                <button type="button" class="tk-btn-window">-</button>
                                <button type="button" class="tk-btn-window">□</button>
                                <button type="button" class="tk-btn-window">✕</button>
                            </div>
                        </div>

                        <div class="tk-history-menu">
                            <span style="text-decoration:underline;">File</span>
                            <span style="text-decoration:underline;">Edit</span>
                            <span style="text-decoration:underline;">View</span>
                            <span style="text-decoration:underline;">Help</span>
                        </div>

                        <div style="padding:6px 10px; background:var(--tk-bg-gray); display:flex; gap:8px; align-items:center;">
                            <span style="font-size:11px; font-weight:700;">Request Payload:</span>
                            <input type="text" id="polyglotPayloadInput" value='{"features": [0.82, 0.45, 1.29, 0.15], "threshold": 0.5}' style="flex:1; padding:4px; font-family:var(--tk-font-mono); font-size:11px; border:1.5px solid #808080;">
                            <button type="button" class="tk-btn-action" id="polyglotSendRequestBtn" style="padding:4px 10px;">▶ Send Request</button>
                            <button type="button" class="tk-btn-action" id="pgClearLogsBtn" style="padding:4px 10px;">Clear</button>
                        </div>

                        <!-- Tkinter Log Screen (Matching Screenshot 2) -->
                        <div class="tk-log-screen" id="polyglotConsoleOutput">
                            <div class="tk-log-line"><span class="tk-log-time">[2024-01-15 10:23:01]</span> <span class="tk-log-badge info">INFO:</span> Application started</div>
                            <div class="tk-log-line"><span class="tk-log-time">[2024-01-15 10:23:02]</span> <span class="tk-log-badge info">INFO:</span> Loading configuration...</div>
                            <div class="tk-log-line"><span class="tk-log-time">[2024-01-15 10:23:03]</span> <span class="tk-log-badge info" style="color:#555555;">DEBUG:</span> Config file found</div>
                            <div class="tk-log-line"><span class="tk-log-time">[2024-01-15 10:23:04]</span> <span class="tk-log-badge info">INFO:</span> Connecting to database...</div>
                            <div class="tk-log-line"><span class="tk-log-time">[2024-01-15 10:23:05]</span> <span class="tk-log-badge warn">WARNING:</span> Slow connection detected</div>
                            <div class="tk-log-line"><span class="tk-log-time">[2024-01-15 10:23:06]</span> <span class="tk-log-badge info">INFO:</span> Connected successfully</div>
                            <div class="tk-log-line"><span class="tk-log-time">[2024-01-15 10:23:07]</span> <span class="tk-log-badge error">ERROR:</span> Failed to load module 'analytics'</div>
                            <div class="tk-log-line"><span class="tk-log-time">[2024-01-15 10:23:08]</span> <span class="tk-log-badge info">INFO:</span> Retrying...</div>
                            <div class="tk-log-line"><span class="tk-log-time">[2024-01-15 10:23:09]</span> <span class="tk-log-badge info">INFO:</span> Module loaded successfully</div>
                            <div class="tk-log-line"><span class="tk-log-time">[2024-01-15 10:23:10]</span> <span class="tk-log-badge info">INFO:</span> System ready</div>
                        </div>

                        <div class="tk-status-bar">
                            <div class="tk-status-left">Ready</div>
                            <div class="tk-status-right">Lines: 10</div>
                        </div>
                    </div>
                </section>
            </div>

            <!-- Global Status Bar -->
            <div class="tk-status-bar">
                <div class="tk-status-left" id="tkGlobalStatusLeft">Ready</div>
                <div class="tk-status-right" id="tkGlobalStatusRight">Lines: 10</div>
            </div>
        </div>
    </div>


    
