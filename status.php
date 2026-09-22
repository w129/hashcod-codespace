<?php
$pageTitle = 'Estado | Hashcod Codespace';
$pageDescription = 'Estado público de Hashcod Codespace: dominio, HTTPS, sitemap, seguridad base y despliegue en Railway.';
$canonical = 'https://hashcodcodespace.dev/status';
$checks = [
  ['name'=>'Dominio oficial','value'=>'hashcodcodespace.dev','state'=>'Operativo'],
  ['name'=>'HTTPS / SSL','value'=>'Let’s Encrypt activo','state'=>'Operativo'],
  ['name'=>'Sitemap','value'=>'/sitemap.xml','state'=>'Correcto'],
  ['name'=>'Rutas internas peligrosas','value'=>'Bloqueadas públicamente','state'=>'Protegido'],
  ['name'=>'Hosting','value'=>'Railway','state'=>'Online'],
  ['name'=>'Imagen de producción','value'=>'Fijada por SHA','state'=>'Controlado'],
  ['name'=>'Google Search Console','value'=>'Configurado','state'=>'Activo'],
  ['name'=>'Seguridad base','value'=>'Headers + CORS + deny paths','state'=>'Activo']
];
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?></title><meta name="description" content="<?= htmlspecialchars($pageDescription, ENT_QUOTES, 'UTF-8') ?>"><link rel="canonical" href="<?= htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') ?>"><meta property="og:title" content="<?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?>"><meta property="og:description" content="<?= htmlspecialchars($pageDescription, ENT_QUOTES, 'UTF-8') ?>"><meta property="og:url" content="<?= htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') ?>"><meta property="og:type" content="website"><link rel="stylesheet" href="/components/hashcod-public-pages.css?v=20260922a"></head>
<body><div class="hc-page"><div class="hc-shell"><nav class="hc-nav"><a class="hc-brand" href="/"><span class="hc-mark">H</span><span><strong>Hashcod</strong><span>codespace</span></span></a><div class="hc-links"><a href="/services">Servicios</a><a href="/pricing">Precios</a><a href="/clients">Clientes</a><a href="/status">Estado</a><a href="/privacy">Privacidad</a></div></nav><main><section class="hc-hero"><div><span class="hc-kicker">Estado público de producción</span><h1 class="hc-title">Sistema online.</h1><p class="hc-lead">Página pública para verificar que Hashcod Codespace tiene dominio, HTTPS, sitemap, rutas protegidas y despliegue controlado.</p></div><aside class="hc-panel"><h2>Resumen</h2><ul class="hc-list"><li>Servicio web público operativo.</li><li>Dominio propio activo.</li><li>Google Search Console configurado.</li><li>Mejoras de seguridad iniciales aplicadas.</li></ul></aside></section><section class="hc-section"><div class="hc-section-head"><h2>Checks</h2><p>Indicadores manuales de producción.</p></div><div class="hc-status"><?php foreach($checks as $c): ?><article class="hc-card"><h3><span class="hc-dot"></span><?= htmlspecialchars($c['name']) ?></h3><p><?= htmlspecialchars($c['value']) ?></p><p class="hc-muted"><?= htmlspecialchars($c['state']) ?></p></article><?php endforeach; ?></div></section></main><footer class="hc-footer">© <?= date('Y') ?> Hashcod Codespace · Created by diktatcart · Hecho por Emil Enmanuel Pieter Mora</footer></div></div></body></html>
