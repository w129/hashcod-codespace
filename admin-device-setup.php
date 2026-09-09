<?php
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Registrar laptop de administración · Hashcod</title>
  <link rel="stylesheet" href="/components/admin-device-setup.css?v=1">
  <script src="/components/admin-device-setup.js?v=1" defer></script>
</head>
<body>
  <main>
    <p class="eyebrow">HASHCOD CODESPACE</p>
    <h1>Registrar esta laptop</h1>
    <p>Usa Windows Hello en este equipo para preparar su acceso administrativo. Selecciona este dispositivo y confirma con tu PIN o huella.</p>
    <p>La restricción final exigirá esta credencial y la IP <strong>38.196.115.73</strong>. Este paso prepara la clave pública: todavía no activa permisos ni cambia el acceso de la plataforma.</p>
    <button id="enroll" type="button">Crear credencial con Windows Hello</button>
    <p id="status" role="status" aria-live="polite"></p>
    <section id="result" hidden>
      <h2>Credencial preparada</h2>
      <p>La información siguiente es pública. Compártela en esta conversación para vincularla a la administración. Nunca compartas tu PIN ni tu huella.</p>
      <label for="credential">Clave pública del equipo</label>
      <textarea id="credential" readonly spellcheck="false" rows="12"></textarea>
      <button id="copy" type="button">Copiar clave pública</button>
    </section>
  </main>
</body>
</html>
