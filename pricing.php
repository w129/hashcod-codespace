<?php
$pageTitle = 'Precios | Hashcod Codespace';
$pageDescription = 'Planes orientativos de Hashcod Codespace para mejoras, desarrollo, auditoría, SEO y soporte técnico de plataformas digitales.';
$canonical = 'https://hashcodcodespace.dev/pricing';
$plans = [
  ['name'=>'Inicio','price'=>'US$25','desc'=>'Para una mejora puntual o revisión inicial.','items'=>['Revisión básica','Ajuste visual pequeño','Informe corto','Entrega por prioridad normal']],
  ['name'=>'Pro','price'=>'US$75','desc'=>'Para mejorar una página o módulo completo.','items'=>['Diseño responsive','SEO base','Corrección de errores','Deploy y prueba pública']],
  ['name'=>'Platform','price'=>'US$150+','desc'=>'Para módulos avanzados y mejoras de producción.','items'=>['Auditoría técnica','Supabase/Postgres','Paneles y formularios','Plan de escalamiento']]
];
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?></title>
  <meta name="description" content="<?= htmlspecialchars($pageDescription, ENT_QUOTES, 'UTF-8') ?>">
  <link rel="canonical" href="<?= htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') ?>">
  <meta property="og:title" content="<?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?>"><meta property="og:description" content="<?= htmlspecialchars($pageDescription, ENT_QUOTES, 'UTF-8') ?>"><meta property="og:url" content="<?= htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') ?>"><meta property="og:type" content="website">
  <link rel="stylesheet" href="/components/hashcod-public-pages.css?v=20260922a">
</head>
<body><div class="hc-page"><div class="hc-shell">
<nav class="hc-nav"><a class="hc-brand" href="/"><span class="hc-mark">H</span><span><strong>Hashcod</strong><span>codespace</span></span></a><div class="hc-links"><a href="/services">Servicios</a><a href="/pricing">Precios</a><a href="/clients">Clientes</a><a href="/status">Estado</a><a href="/privacy">Privacidad</a></div></nav>
<main>
<section class="hc-hero"><div><span class="hc-kicker">Planes simples y escalables</span><h1 class="hc-title">Precios claros para construir.</h1><p class="hc-lead">Estos precios son orientativos y pueden variar según dificultad, urgencia, integraciones, seguridad, base de datos, diseño y alcance técnico.</p><div class="hc-actions"><a class="hc-btn primary" href="/services">Ver servicios</a><a class="hc-btn" href="/">Entrar a la plataforma</a></div></div><aside class="hc-panel"><h2>Incluye enfoque de producción</h2><ul class="hc-list"><li>Dominio y HTTPS.</li><li>SEO técnico base.</li><li>Diseño responsive.</li><li>Revisión de seguridad antes de publicar.</li></ul></aside></section>
<section class="hc-section"><div class="hc-section-head"><h2>Planes</h2><p>Selecciona el nivel según el alcance del proyecto.</p></div><div class="hc-grid"><?php foreach($plans as $p): ?><article class="hc-card"><span class="hc-badge"><?= htmlspecialchars($p['name']) ?></span><div class="hc-price"><?= htmlspecialchars($p['price']) ?></div><p><?= htmlspecialchars($p['desc']) ?></p><ul class="hc-list" style="margin-top:16px"><?php foreach($p['items'] as $it): ?><li><?= htmlspecialchars($it) ?></li><?php endforeach; ?></ul></article><?php endforeach; ?></div><p class="hc-muted" style="margin-top:18px">Los pagos no se procesan en esta página todavía. La integración de pagos se activa solo cuando el flujo legal, fiscal y técnico esté definido.</p></section>
</main><footer class="hc-footer">© <?= date('Y') ?> Hashcod Codespace · Created by diktatcart · Hecho por Emil Enmanuel Pieter Mora</footer>
</div></div></body></html>
