<?php
$base = getenv('L8_PUBLIC_BASE');
if ($base === false || $base === null) $base = '';
$base = '/' . trim((string)$base, '/');
if ($base === '/') $base = '';
$home = $base . '/';
$components = $base . '/components/';
http_response_code(404);
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
?><!doctype html>
<html lang="es" data-hashcod-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#07090b">
  <title>404 · Hashcod Codespace</title>
  <script>
    (function(){
      try {
        var pref=localStorage.getItem('hashcod_ux_theme_v1')||'system';
        var dark=pref==='dark'||(pref==='system'&&window.matchMedia&&matchMedia('(prefers-color-scheme:dark)').matches);
        document.documentElement.dataset.hashcodTheme=dark?'dark':'light';
      } catch(e) {}
    })();
  </script>
  <link rel="stylesheet" href="<?= htmlspecialchars($components, ENT_QUOTES, 'UTF-8') ?>hashcod-ux-system.css?v=20260917-1">
  <style>
    *{box-sizing:border-box}
    html,body{margin:0;min-height:100%;background:var(--hashcod-ux-bg);color:var(--hashcod-ux-text)}
    body{min-height:100vh;display:grid;place-items:center;padding:28px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow:hidden}
    .nf-grid{position:fixed;inset:0;pointer-events:none;opacity:.35;background-image:linear-gradient(var(--hashcod-ux-border) 1px,transparent 1px),linear-gradient(90deg,var(--hashcod-ux-border) 1px,transparent 1px);background-size:42px 42px;mask-image:radial-gradient(circle at center,#000 20%,transparent 76%)}
    .nf-shell{position:relative;width:min(880px,100%);border:1px solid var(--hashcod-ux-border);border-radius:24px;background:color-mix(in srgb,var(--hashcod-ux-bg) 90%,transparent);box-shadow:var(--hashcod-ux-shadow);padding:clamp(24px,5vw,58px);backdrop-filter:blur(18px)}
    .nf-kicker{display:flex;align-items:center;gap:10px;color:var(--hashcod-ux-muted);font-size:11px;letter-spacing:.16em;text-transform:uppercase}
    .nf-dot{width:8px;height:8px;border-radius:50%;background:var(--hashcod-ux-error);box-shadow:0 0 22px color-mix(in srgb,var(--hashcod-ux-error) 70%,transparent)}
    .nf-code{margin:26px 0 0;font-size:clamp(78px,18vw,190px);line-height:.78;letter-spacing:-.08em;font-weight:800}
    h1{margin:26px 0 10px;font-size:clamp(24px,4vw,42px);letter-spacing:-.04em}
    p{max-width:680px;margin:0;color:var(--hashcod-ux-muted);font:500 clamp(13px,1.7vw,16px)/1.65 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
    .nf-path{display:inline-block;max-width:100%;margin-top:16px;padding:8px 10px;border:1px solid var(--hashcod-ux-border);border-radius:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--hashcod-ux-muted);font-size:11px}
    .nf-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}
    .nf-actions a,.nf-actions button{min-height:42px;padding:0 15px;border-radius:10px;border:1px solid var(--hashcod-ux-border);background:var(--hashcod-ux-surface);color:var(--hashcod-ux-text);font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}
    .nf-actions .primary{background:var(--hashcod-ux-text);color:var(--hashcod-ux-bg);border-color:var(--hashcod-ux-text)}
    .nf-foot{margin-top:38px;padding-top:16px;border-top:1px solid var(--hashcod-ux-border);display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;color:var(--hashcod-ux-muted);font-size:9px;letter-spacing:.08em}
    @media(max-width:560px){body{padding:14px}.nf-shell{border-radius:18px}.nf-actions>*{flex:1 1 140px}.nf-code{font-size:92px}}
  </style>
</head>
<body>
  <div class="nf-grid" aria-hidden="true"></div>
  <main class="nf-shell" data-scroll-reveal>
    <div class="nf-kicker"><span class="nf-dot"></span> HASHCOD / ROUTING / 404</div>
    <div class="nf-code" aria-hidden="true">404</div>
    <h1>Esta ruta no existe.</h1>
    <p>La plataforma está funcionando, pero la dirección solicitada no corresponde a una herramienta, recurso o página disponible de Hashcod Codespace.</p>
    <div class="nf-path"><?= htmlspecialchars((string)($_SERVER['REQUEST_URI'] ?? '/'), ENT_QUOTES, 'UTF-8') ?></div>
    <div class="nf-actions">
      <a class="primary" href="<?= htmlspecialchars($home, ENT_QUOTES, 'UTF-8') ?>">Volver a Codespace</a>
      <button type="button" onclick="history.length>1?history.back():location.assign('<?= htmlspecialchars($home, ENT_QUOTES, 'UTF-8') ?>')">Atrás</button>
      <button type="button" onclick="window.HashcodUX&&HashcodUX.palette.open()">Command palette</button>
    </div>
    <div class="nf-foot"><span>HASHCOD CODESPACE</span><span>HTTP 404 · NOT FOUND</span></div>
  </main>
  <script defer src="<?= htmlspecialchars($components, ENT_QUOTES, 'UTF-8') ?>hashcod-ux-system.js?v=20260917-1" data-hashcod-ux-system="true"></script>
</body>
</html>
