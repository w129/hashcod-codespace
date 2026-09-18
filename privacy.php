<?php
declare(strict_types=1);

require_once __DIR__ . '/platform-registration-contract.php';

$contract = hashcodRegistrationContract();
$contractHash = hashcodRegistrationContractSha256();

function privacy_h(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= privacy_h($contract['title']) ?> · Hashcod Codespace</title>
    <style>
        :root {
            --paper: #fff;
            --ink: #111;
            --muted: #666;
            --line: #cfcfcf;
            --soft: #f4f4f2;
            --grid: rgba(17,17,17,.055);
        }
        * { box-sizing: border-box; }
        html { background: #f7f7f5; color: var(--ink); }
        body {
            margin: 0;
            min-height: 100vh;
            padding: 42px 20px 72px;
            background:
                linear-gradient(var(--grid) 1px, transparent 1px),
                linear-gradient(90deg, var(--grid) 1px, transparent 1px),
                #f7f7f5;
            background-size: 32px 32px;
            font-family: Inter, "Segoe UI", Arial, sans-serif;
            line-height: 1.62;
        }
        .privacy-container {
            width: min(980px, 100%);
            margin: 0 auto;
            background: var(--paper);
            border: 1px solid var(--ink);
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 24px 70px rgba(0,0,0,.10);
        }
        .document-head {
            padding: 34px 38px 26px;
            border-bottom: 1px solid var(--ink);
        }
        .document-kicker {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 18px;
            font: 700 11px/1.2 "IBM Plex Mono", Consolas, monospace;
            letter-spacing: .08em;
            text-transform: uppercase;
        }
        .document-title {
            margin: 0;
            max-width: 780px;
            font-size: clamp(28px, 4.3vw, 48px);
            line-height: 1.03;
            letter-spacing: -.035em;
        }
        .document-subtitle {
            margin: 14px 0 0;
            color: var(--muted);
            font: 600 12px/1.4 "IBM Plex Mono", Consolas, monospace;
        }
        .document-meta {
            display: grid;
            grid-template-columns: repeat(3, minmax(0,1fr));
            border-bottom: 1px solid var(--ink);
            background: var(--soft);
        }
        .meta-cell {
            min-width: 0;
            padding: 13px 16px;
            border-right: 1px solid var(--line);
        }
        .meta-cell:last-child { border-right: 0; }
        .meta-label {
            display: block;
            margin-bottom: 4px;
            color: var(--muted);
            font: 700 9px/1.2 "IBM Plex Mono", Consolas, monospace;
            letter-spacing: .08em;
            text-transform: uppercase;
        }
        .meta-value {
            display: block;
            overflow-wrap: anywhere;
            font: 600 11px/1.4 "IBM Plex Mono", Consolas, monospace;
        }
        .document-body {
            padding: 34px 38px 44px;
        }
        .intro-notice {
            margin: 0 0 30px;
            padding: 15px 17px;
            border-left: 4px solid var(--ink);
            background: var(--soft);
            font-size: 13px;
        }
        .contract-section {
            padding: 24px 0;
            border-top: 1px solid #dedede;
        }
        .contract-section:first-of-type {
            padding-top: 0;
            border-top: 0;
        }
        .contract-section h2 {
            margin: 0 0 12px;
            font: 700 17px/1.25 "IBM Plex Mono", Consolas, monospace;
        }
        .contract-section p {
            margin: 0 0 12px;
            color: #2c2c2c;
            font-size: 14px;
        }
        .contract-section p:last-child { margin-bottom: 0; }
        .contract-section ul {
            margin: 12px 0 0;
            padding-left: 22px;
        }
        .contract-section li {
            margin: 7px 0;
            color: #2c2c2c;
            font-size: 13.5px;
        }
        .evidence-box {
            margin-top: 14px;
            border: 1px solid var(--ink);
            border-radius: 10px;
            overflow: hidden;
        }
        .evidence-box-head {
            padding: 11px 13px;
            background: var(--ink);
            color: #fff;
            font: 700 11px/1.2 "IBM Plex Mono", Consolas, monospace;
            letter-spacing: .04em;
        }
        .evidence-box-body {
            padding: 13px 15px;
            background: #fafafa;
        }
        .legal-note {
            margin-top: 30px;
            padding: 16px 18px;
            border: 1px solid var(--line);
            border-radius: 10px;
            background: #fafafa;
        }
        .legal-note strong {
            display: block;
            margin-bottom: 7px;
            font: 700 12px/1.2 "IBM Plex Mono", Consolas, monospace;
        }
        .legal-note p {
            margin: 0;
            color: #444;
            font-size: 12px;
        }
        .legal-references {
            margin-top: 30px;
            padding-top: 22px;
            border-top: 1px solid var(--ink);
        }
        .legal-references h2 {
            margin: 0 0 12px;
            font: 700 15px/1.2 "IBM Plex Mono", Consolas, monospace;
        }
        .legal-references li {
            margin: 7px 0;
            font-size: 12.5px;
        }
        .acceptance-block {
            margin-top: 34px;
            padding: 20px;
            border: 2px solid var(--ink);
            border-radius: 12px;
            background: #fff;
        }
        .acceptance-block h2 {
            margin: 0 0 10px;
            font: 800 16px/1.2 "IBM Plex Mono", Consolas, monospace;
        }
        .acceptance-block p {
            margin: 0;
            font-size: 13px;
        }
        .document-actions {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 18px 38px;
            border-top: 1px solid var(--ink);
            background: var(--soft);
        }
        .document-actions a,
        .document-actions button {
            min-height: 40px;
            padding: 0 15px;
            border: 1px solid var(--ink);
            border-radius: 8px;
            background: #fff;
            color: var(--ink);
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font: 700 11px/1 "IBM Plex Mono", Consolas, monospace;
        }
        .document-actions .primary {
            background: var(--ink);
            color: #fff;
        }
        @media (max-width: 720px) {
            body { padding: 16px 10px 40px; }
            .document-head, .document-body { padding-left: 20px; padding-right: 20px; }
            .document-meta { grid-template-columns: 1fr; }
            .meta-cell { border-right: 0; border-bottom: 1px solid var(--line); }
            .meta-cell:last-child { border-bottom: 0; }
            .document-actions { padding: 14px 20px; flex-direction: column; }
        }
        @media print {
            body { padding: 0; background: #fff; }
            .privacy-container { width: 100%; border: 0; border-radius: 0; box-shadow: none; }
            .document-actions { display: none; }
        }
    </style>
</head>
<body>
<main class="privacy-container">
    <header class="document-head">
        <div class="document-kicker">
            <span>Hashcod Codespace® / Documento contractual</span>
            <span>República Dominicana</span>
        </div>
        <h1 class="document-title"><?= privacy_h($contract['title']) ?></h1>
        <p class="document-subtitle"><?= privacy_h($contract['subtitle']) ?></p>
    </header>

    <section class="document-meta" aria-label="Identificación del documento">
        <div class="meta-cell">
            <span class="meta-label">Versión</span>
            <span class="meta-value"><?= privacy_h($contract['version']) ?></span>
        </div>
        <div class="meta-cell">
            <span class="meta-label">Vigente desde</span>
            <span class="meta-value"><?= privacy_h($contract['effective_date']) ?></span>
        </div>
        <div class="meta-cell">
            <span class="meta-label">SHA-256 canónico</span>
            <span class="meta-value"><?= privacy_h($contractHash) ?></span>
        </div>
    </section>

    <article class="document-body">
        <p class="intro-notice">
            Este documento contiene las condiciones contractuales y de privacidad aplicables al registro de una plataforma.
            La aceptación se registra electrónicamente cuando el Usuario marca el checkbox correspondiente y envía el formulario.
        </p>

        <?php foreach ($contract['sections'] as $section): ?>
            <section class="contract-section">
                <h2><?= privacy_h((string)$section['title']) ?></h2>
                <?php foreach (($section['paragraphs'] ?? []) as $paragraph): ?>
                    <p><?= privacy_h((string)$paragraph) ?></p>
                <?php endforeach; ?>

                <?php if (!empty($section['bullets'])): ?>
                    <?php if (str_starts_with((string)$section['title'], '7.') || str_starts_with((string)$section['title'], '8.')): ?>
                        <div class="evidence-box">
                            <div class="evidence-box-head">
                                <?= str_starts_with((string)$section['title'], '8.')
                                    ? 'EVIDENCIA INSTITUCIONAL, COMERCIAL Y DE MARCA'
                                    : 'EVIDENCIA TÉCNICA ASOCIADA AL REGISTRO' ?>
                            </div>
                            <div class="evidence-box-body">
                                <ul>
                                    <?php foreach ($section['bullets'] as $bullet): ?>
                                        <li><?= privacy_h((string)$bullet) ?></li>
                                    <?php endforeach; ?>
                                </ul>
                            </div>
                        </div>
                    <?php else: ?>
                        <ul>
                            <?php foreach ($section['bullets'] as $bullet): ?>
                                <li><?= privacy_h((string)$bullet) ?></li>
                            <?php endforeach; ?>
                        </ul>
                    <?php endif; ?>
                <?php endif; ?>
            </section>
        <?php endforeach; ?>

        <aside class="legal-note">
            <strong>PRECISIÓN SOBRE LA ACEPTACIÓN ELECTRÓNICA</strong>
            <p>
                El checkbox y el envío del formulario documentan una manifestación electrónica de voluntad y aceptación contractual.
                Este mecanismo no se presenta como firma digital certificada bajo el artículo 31 de la Ley núm. 126-02 salvo que se
                incorpore un sistema adicional que cumpla sus requisitos técnicos.
            </p>
        </aside>

        <section class="legal-references">
            <h2>Referencias legales</h2>
            <ul>
                <?php foreach ($contract['legal_references'] as $reference): ?>
                    <li><?= privacy_h((string)$reference) ?></li>
                <?php endforeach; ?>
            </ul>
        </section>

        <section class="acceptance-block">
            <h2>Declaración de aceptación</h2>
            <p>
                Al marcar el checkbox del formulario y seleccionar “ENVIAR REGISTRO”, el Usuario declara que ha tenido acceso a esta
                versión del documento, que acepta sus condiciones y que autoriza el registro de la evidencia técnica descrita para
                acreditar dicha aceptación.
            </p>
        </section>
    </article>

    <footer class="document-actions">
        <a href="./">← Volver a Hashcod Codespace</a>
        <button type="button" onclick="window.print()">Imprimir documento</button>
        <a class="primary" href="./#platform-registration">Continuar al registro</a>
    </footer>
</main>
</body>
</html>
