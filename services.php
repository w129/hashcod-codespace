<?php
$pageTitle = 'Servicios | Hashcod Codespace';
$pageDescription = 'Servicios de Hashcod Codespace para desarrollo web, automatización, herramientas digitales, auditoría técnica, SEO y plataforma empresarial.';
$canonical = 'https://hashcodcodespace.dev/services';
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?></title>
  <meta name="description" content="<?= htmlspecialchars($pageDescription, ENT_QUOTES, 'UTF-8') ?>">
  <link rel="canonical" href="<?= htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') ?>">
  <meta property="og:title" content="<?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?>">
  <meta property="og:description" content="<?= htmlspecialchars($pageDescription, ENT_QUOTES, 'UTF-8') ?>">
  <meta property="og:url" content="<?= htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') ?>">
  <meta property="og:type" content="website">
  <link rel="stylesheet" href="/components/hashcod-public-pages.css?v=20260922a">
</head>
<body>
<div class="hc-page">
  <div class="hc-shell">
    <nav class="hc-nav" aria-label="Principal">
      <a class="hc-brand" href="/">
        <span class="hc-mark">H</span><span><strong>Hashcod</strong><span>codespace</span></span>
      </a>
      <div class="hc-links">
        <a href="/services">Servicios</a><a href="/pricing">Precios</a><a href="/clients">Clientes</a><a href="/status">Estado</a><a href="/privacy">Privacidad</a>
      </div>
    </nav>
    <main>
      <section class="hc-hero">
        <div>
          <span class="hc-kicker">Servicios técnicos para proyectos digitales</span>
          <h1 class="hc-title">Convierte ideas en sistemas.</h1>
          <p class="hc-lead">Hashcod Codespace reúne desarrollo, auditoría, automatización, herramientas web, documentación y mejoras de producción para llevar una plataforma desde prototipo hasta presencia pública.</p>
          <div class="hc-actions"><a class="hc-btn primary" href="/pricing">Ver planes</a><a class="hc-btn" href="/">Entrar a la plataforma</a></div>
        </div>
        <aside class="hc-panel">
          <h2>Áreas principales</h2>
          <ul class="hc-list">
            <li>Desarrollo web y herramientas digitales.</li>
            <li>Automatización de procesos y flujos internos.</li>
            <li>Auditoría técnica, seguridad y optimización.</li>
            <li>SEO técnico, sitemap, dominio y despliegue.</li>
          </ul>
        </aside>
      </section>
      <section class="hc-section">
        <div class="hc-section-head"><h2>Qué se puede construir</h2><p>Servicios organizados para negocios, estudiantes, creadores y desarrolladores.</p></div>
        <div class="hc-grid">
          <article class="hc-card"><span class="hc-badge">Web</span><h3>Plataformas y landing pages</h3><p>Diseño, estructura pública, páginas de servicios, precios, SEO base y despliegue estable.</p></article>
          <article class="hc-card"><span class="hc-badge">Datos</span><h3>Formularios y registros</h3><p>Captura de datos, validaciones, Supabase/Postgres, almacenamiento y paneles de control.</p></article>
          <article class="hc-card"><span class="hc-badge">Seguridad</span><h3>Auditoría y endurecimiento</h3><p>Revisión de rutas, headers, CORS, archivos sensibles, permisos, rate limits y exposición pública.</p></article>
          <article class="hc-card"><span class="hc-badge">Automatización</span><h3>Flujos internos</h3><p>Procesos para clientes, generación de documentos, tickets, códigos, QR y tareas repetitivas.</p></article>
          <article class="hc-card"><span class="hc-badge">Producto</span><h3>Prototipos funcionales</h3><p>Interfaces, sistemas de acceso, herramientas de código, módulos de contenido y demos públicas.</p></article>
          <article class="hc-card"><span class="hc-badge">Marca</span><h3>Presencia digital</h3><p>Dominio, Google Search Console, sitemap, metadatos, Open Graph y estructura de confianza.</p></article>
        </div>
      </section>
    </main>
    <footer class="hc-footer">© <?= date('Y') ?> Hashcod Codespace · Created by diktatcart · Hecho por Emil Enmanuel Pieter Mora</footer>
  </div>
</div>
</body>
</html>
