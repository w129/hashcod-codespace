<?php
/**
 * Constancia tool API and public verification surfaces.
 *
 *   Tool (Pro period via the /api guard + signature gate cookie):
 *     GET  /api/constancia/status          configuration + whether the tool is unlocked
 *     POST /api/constancia/unlock          {signature}   -> sets the gate cookie
 *     POST /api/constancia/seal            JSON fields (see constanciaValidateInput); the asset only arrives as hex digests
 *     GET  /api/constancia/list            issued constancias (never the cédula/RNC)
 *     GET  /api/constancia/file/{N}.pdf|.cod
 *     POST /api/constancia/revoke          {number, reason}
 *   Public (no Pro period, no gate; router.php lets these through):
 *     GET  /api/constancia/public/{N}      verification result as JSON ( ?h=<32 hex> compares the QR fingerprint )
 *     GET  /api/constancia/public/{N}.cod  the .cod package (public constancias only)
 *     GET  /verify/{N}                     verification page;  GET /.well-known/did.json   issuer DID document
 */
require_once __DIR__ . '/constancia-lib.php';
if (!function_exists('mldsaSeal')) require_once __DIR__ . '/mldsa-access.php';

const CONSTANCIA_GATE_COOKIE = 'hashcod_seal_access_v1';
const CONSTANCIA_GATE_TTL = 1800;

function constanciaJson(array $payload, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
}

function constanciaGateOpen(): bool {
    $d = mldsaOpen((string)($_COOKIE[CONSTANCIA_GATE_COOKIE] ?? ''));
    return is_array($d) && ($d['kind'] ?? '') === 'seal-access-v1' && (int)($d['exp'] ?? 0) > time()
        && hash_equals((string)($d['host'] ?? ''), mldsaHost()) && hash_equals((string)($d['ua'] ?? ''), mldsaUa());
}

function constanciaClientHash(): string {
    $ip = function_exists('securityClientIp') ? (string)securityClientIp() : (string)($_SERVER['REMOTE_ADDR'] ?? '');
    return hash('sha256', 'seal-unlock|' . $ip);
}

function constanciaBody(int $max = 2097152): ?array {
    if (!str_starts_with(strtolower((string)($_SERVER['CONTENT_TYPE'] ?? '')), 'application/json')) return null; // forces a CORS preflight cross-origin
    $raw = file_get_contents('php://input', false, null, 0, $max + 1);
    if (!is_string($raw) || strlen($raw) > $max) return null;
    $data = json_decode($raw, true);
    return is_array($data) ? $data : null;
}

function constanciaRowByNumber(PDO $pdo, string $number): ?array {
    if (!preg_match('/^HC-\d{4}-\d{6}$/', $number)) return null;
    $st = $pdo->prepare('SELECT * FROM constancias WHERE number = ?');
    $st->execute([$number]);
    return $st->fetch() ?: null;
}

/** Verification payload shared by the JSON API and the HTML page. Private constancias hide holder and asset. */
function constanciaPublicView(array $row, ?string $h = null): array {
    // The checks spawn openssl and walk the ledger: cache them briefly (APCu) so a public endpoint cannot be used to burn CPU.
    $cacheKey = 'constancia:' . $row['number'] . ':' . $row['status'] . ':' . substr($row['fingerprint'], 0, 16);
    $cached = function_exists('apcu_fetch') ? apcu_fetch($cacheKey, $hit) : false;
    if ($cached !== false && !empty($hit)) {
        [$verify, $ledgerBreak] = $cached;
    } else {
        $files = constanciaReadCod((string)$row['cod']) ?? [];
        $verify = constanciaVerifyPackage($files, constanciaDidDocument(), constanciaCaFile());
        $ledgerBreak = constanciaLedgerCheck(constanciaDb());
        if (function_exists('apcu_store')) apcu_store($cacheKey, [$verify, $ledgerBreak], 60);
    }
    $public = $row['visibility'] === 'public';
    $view = [
        'ok' => true, 'number' => $row['number'], 'status' => $row['status'], 'revokedAt' => $row['revoked_at'], 'visibility' => $row['visibility'],
        'domain' => constanciaDomain(), 'issuer' => constanciaIssuerDid(), 'fingerprint' => $row['fingerprint'],
        'genTimeUtc' => $row['tsa_gen_time'], 'genTimeAst' => constanciaAstTime($row['tsa_gen_time']),
        'tsa' => $row['tsa_name'] ?: parse_url((string)$row['tsa_url'], PHP_URL_HOST), 'template' => $row['template_version'],
        'verify' => $verify, 'ledgerIntact' => $ledgerBreak === null, 'sealSvg' => constanciaSealSvg($row['seal_seed'], 180),
        'hProvided' => $h !== null, 'hMatches' => $h !== null ? hash_equals(substr($row['fingerprint'], 0, 32), strtolower($h)) : null,
        'chainVerified' => (bool)($verify['chain'] ?? false),
    ];
    if ($public) {
        $view['holder'] = $row['holder_name']; $view['asset'] = ['name' => $row['asset_name'], 'type' => CONSTANCIA_ASSET_TYPES[$row['asset_type']] ?? $row['asset_type'], 'version' => $row['version'], 'digest' => $row['digest'],
            'merkleRoot' => $row['merkle_root'], 'files' => $row['manifest_json'] ? json_decode($row['manifest_json'], true) : null];
    }
    return $view;
}

function constanciaHandleApi($uri): bool {
    $uri = (string)$uri;
    if (!str_starts_with($uri, '/api/constancia/')) return false;
    $path = substr($uri, strlen('/api/constancia/'));
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    // ----- public
    if (preg_match('#^public/(HC-\d{4}-\d{6})(\.cod)?$#', $path, $m)) {
        if ($method !== 'GET') { constanciaJson(['ok' => false, 'error' => 'Método no permitido'], 405); return true; }
        $row = constanciaRowByNumber(constanciaDb(), $m[1]);
        if (!$row) { constanciaJson(['ok' => false, 'error' => 'Constancia no encontrada'], 404); return true; }
        if (!empty($m[2])) {
            if ($row['visibility'] !== 'public') { constanciaJson(['ok' => false, 'error' => 'Constancia privada'], 403); return true; }
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $row['number'] . '.cod"');
            header('Content-Length: ' . strlen($row['cod']));
            header('X-Content-Type-Options: nosniff');
            echo $row['cod'];
            return true;
        }
        $h = isset($_GET['h']) && is_string($_GET['h']) && constanciaIsHex($_GET['h'], 32) ? $_GET['h'] : null;
        constanciaJson(constanciaPublicView($row, $h));
        return true;
    }

    // ----- tool
    if ($path === 'status' && $method === 'GET') {
        constanciaJson(['ok' => true, 'unlocked' => constanciaGateOpen(),
            'configured' => ['gate' => count(constanciaAllowedSignatureHashes()) > 0, 'issuer' => constanciaIssuerKeypair() !== null, 'tsa' => constanciaTsaUrl() !== ''] + constanciaCapabilities(),
            'issuerDid' => constanciaIssuerDid(), 'keyId' => constanciaKeyId(), 'declaration' => CONSTANCIA_DECLARATION, 'template' => CONSTANCIA_TEMPLATE_VERSION,
            'assetTypes' => CONSTANCIA_ASSET_TYPES, 'aiUse' => CONSTANCIA_AI_USE]);
        return true;
    }
    if ($path === 'unlock' && $method === 'POST') {
        $pdo = constanciaDb();
        $pdo->prepare('DELETE FROM unlock_attempts WHERE at < ?')->execute([time() - 600]);
        $st = $pdo->prepare('SELECT COUNT(*) FROM unlock_attempts WHERE ip_hash = ?');
        $st->execute([constanciaClientHash()]);
        if ((int)$st->fetchColumn() >= 8) { constanciaJson(['ok' => false, 'error' => 'Demasiados intentos. Espera unos minutos.', 'code' => 'rate_limited'], 429); return true; }
        $body = constanciaBody(65536);
        if ($body === null) { constanciaJson(['ok' => false, 'error' => 'Solicitud no válida.'], 400); return true; }
        if (!count(constanciaAllowedSignatureHashes())) { constanciaJson(['ok' => false, 'error' => 'La herramienta no tiene firmas autorizadas configuradas.', 'code' => 'gate_not_configured'], 503); return true; }
        if (!constanciaSignatureAllowed((string)($body['signature'] ?? ''))) {
            $pdo->prepare('INSERT INTO unlock_attempts (ip_hash, at) VALUES (?,?)')->execute([constanciaClientHash(), time()]);
            constanciaJson(['ok' => false, 'error' => 'La firma no es válida.', 'code' => 'bad_signature'], 403);
            return true;
        }
        $exp = time() + CONSTANCIA_GATE_TTL;
        mldsaCookie(CONSTANCIA_GATE_COOKIE, mldsaSeal(['kind' => 'seal-access-v1', 'exp' => $exp, 'host' => mldsaHost(), 'ua' => mldsaUa(), 'sid' => bin2hex(random_bytes(8))]), $exp);
        constanciaJson(['ok' => true, 'expiresAt' => $exp]);
        return true;
    }

    // everything below needs the gate
    if (!constanciaGateOpen()) { constanciaJson(['ok' => false, 'error' => 'Introduce la firma para usar esta herramienta.', 'code' => 'locked'], 401); return true; }

    if ($path === 'seal' && $method === 'POST') {
        $body = constanciaBody();
        if ($body === null) { constanciaJson(['ok' => false, 'error' => 'Solicitud no válida.'], 400); return true; }
        try {
            $result = constanciaSeal($body);
        } catch (InvalidArgumentException $e) {
            constanciaJson(['ok' => false, 'error' => 'Revisa los campos marcados.', 'code' => 'invalid', 'fields' => json_decode($e->getMessage(), true) ?: []], 422);
            return true;
        } catch (RuntimeException $e) {
            $map = ['issuer_not_configured' => 'Falta configurar la llave del emisor (HASHCOD_SEAL_ED25519_SEED_B64).', 'tsa_not_configured' => 'Falta configurar la autoridad de sello de tiempo (HASHCOD_TSA_URL).',
                'tsa_unreachable' => 'La autoridad de sello de tiempo no respondió; no se emitió ninguna constancia.', 'tsa_query' => 'Este entorno no tiene el comando openssl necesario para el sello de tiempo.', 'tsa_rejected' => 'La autoridad de sello de tiempo rechazó la solicitud.'];
            $code = $e->getMessage();
            error_log('constancia seal failed: ' . $code);
            constanciaJson(['ok' => false, 'error' => $map[$code] ?? 'No se pudo emitir la constancia.', 'code' => $code], str_ends_with($code, 'not_configured') ? 503 : 502);
            return true;
        } catch (Throwable $e) {
            error_log('constancia seal error: ' . $e->getMessage());
            constanciaJson(['ok' => false, 'error' => 'No se pudo emitir la constancia.', 'code' => 'internal'], 500);
            return true;
        }
        $row = constanciaRowByNumber(constanciaDb(), $result['number']);
        $pdfReady = false;
        try { constanciaStoredPdf($row); $pdfReady = true; } catch (Throwable) { /* the PDF can be regenerated on download */ }
        constanciaJson(['ok' => true, 'number' => $result['number'], 'fingerprint' => $result['fingerprint'], 'digest' => $result['digest'], 'merkleRoot' => $result['merkleRoot'], 'genTimeUtc' => gmdate('Y-m-d H:i:s', strtotime($result['genTime'])) . ' UTC', 'genTimeAst' => constanciaAstTime($result['genTime']),
            'verifyUrl' => constanciaVerifyUrl($result['number']), 'pdfReady' => $pdfReady], 201);
        return true;
    }
    if ($path === 'list' && $method === 'GET') {
        $rows = constanciaDb()->query('SELECT number, holder_name, asset_name, asset_type, version, visibility, status, tsa_gen_time, revoked_at FROM constancias ORDER BY seq DESC, year DESC LIMIT 200')->fetchAll();
        constanciaJson(['ok' => true, 'items' => $rows]);
        return true;
    }
    if (preg_match('#^file/(HC-\d{4}-\d{6})\.(pdf|cod)$#', $path, $m) && $method === 'GET') {
        $row = constanciaRowByNumber(constanciaDb(), $m[1]);
        if (!$row) { constanciaJson(['ok' => false, 'error' => 'Constancia no encontrada'], 404); return true; }
        try { $bytes = $m[2] === 'pdf' ? constanciaStoredPdf($row) : (string)$row['cod']; }
        catch (Throwable) { constanciaJson(['ok' => false, 'error' => 'No se pudo generar el PDF.'], 500); return true; }
        header('Content-Type: ' . ($m[2] === 'pdf' ? 'application/pdf' : 'application/octet-stream'));
        header('Content-Disposition: ' . (isset($_GET['inline']) && $m[2] === 'pdf' ? 'inline' : 'attachment') . '; filename="' . $row['number'] . '.' . $m[2] . '"');
        header('Content-Length: ' . strlen($bytes));
        header('Cache-Control: private, no-store');
        header('X-Content-Type-Options: nosniff');
        echo $bytes;
        return true;
    }
    if ($path === 'revoke' && $method === 'POST') {
        $body = constanciaBody(65536);
        $number = (string)($body['number'] ?? ''); $reason = trim((string)($body['reason'] ?? ''));
        if ($body === null || !preg_match('/^HC-\d{4}-\d{6}$/', $number) || mb_strlen($reason) < 3 || mb_strlen($reason) > 300) { constanciaJson(['ok' => false, 'error' => 'Indica el número y un motivo (3-300 caracteres).'], 422); return true; }
        $pdo = constanciaDb();
        $pdo->exec('BEGIN IMMEDIATE');
        try {
            $row = constanciaRowByNumber($pdo, $number);
            if (!$row || $row['status'] === 'revocada') { $pdo->exec('ROLLBACK'); constanciaJson(['ok' => false, 'error' => 'La constancia no existe o ya está revocada.'], 409); return true; }
            $at = gmdate('Y-m-d\TH:i:s\Z');
            constanciaLedgerAppend($pdo, ['event' => 'revoked', 'number' => $number, 'at' => $at, 'reason' => $reason]);
            $pdo->prepare("UPDATE constancias SET status='revocada', revoked_at=?, revoke_reason=? WHERE number=?")->execute([$at, $reason, $number]);
            $pdo->exec('COMMIT');
        } catch (Throwable $e) { $pdo->exec('ROLLBACK'); error_log('constancia revoke: ' . $e->getMessage()); constanciaJson(['ok' => false, 'error' => 'No se pudo revocar.'], 500); return true; }
        constanciaJson(['ok' => true, 'number' => $number, 'status' => 'revocada']);
        return true;
    }
    constanciaJson(['ok' => false, 'error' => 'Ruta no encontrada'], 404);
    return true;
}

/** PDF bytes for a row, rendered once and cached next to the database. */
function constanciaStoredPdf(array $row): string {
    $dir = constanciaDataDir() . '/pdf';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $file = $dir . '/' . $row['number'] . '.pdf';
    if (is_file($file)) return (string)file_get_contents($file);
    $pdf = constanciaRenderPdf($row);
    file_put_contents($file, $pdf, LOCK_EX);
    return $pdf;
}

/* ---------- public pages (called from router.php) ---------- */

function constanciaPageHeaders(string $type): void {
    header('Content-Type: ' . $type);
    header("Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
}

function constanciaServePublic(string $uri): void {
    if ($uri === '/.well-known/did.json') {
        header('Content-Type: application/did+json');
        header('Access-Control-Allow-Origin: *');
        header('Cache-Control: public, max-age=300');
        header('X-Content-Type-Options: nosniff');
        echo json_encode(constanciaDidDocument(), JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        return;
    }
    $e = fn($v) => htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    constanciaPageHeaders('text/html; charset=utf-8');
    $number = substr($uri, strlen('/verify/'));
    $row = preg_match('/^HC-\d{4}-\d{6}$/', $number) ? constanciaRowByNumber(constanciaDb(), $number) : null;
    $head = '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Verificación de constancia</title><link rel="stylesheet" href="/components/constancia-verify.css?v=1"></head><body><main class="cv">';
    if (!$row) {
        http_response_code(404);
        echo $head . '<p class="cv-domain" data-domain="' . $e(constanciaDomain()) . '">' . $e(constanciaDomain()) . '</p><h1>Constancia no encontrada</h1><p>No existe una constancia con ese número en este dominio.</p></main></body></html>';
        return;
    }
    $h = isset($_GET['h']) && is_string($_GET['h']) && constanciaIsHex($_GET['h'], 32) ? $_GET['h'] : null;
    $view = constanciaPublicView($row, $h);
    $vigente = $view['status'] === 'vigente';
    $out = $head . '<p class="cv-domain">Dominio verificado: <strong>' . $e($view['domain']) . '</strong> <small>(comprueba que la barra de direcciones muestre este dominio)</small></p>';
    $out .= '<h1>Constancia ' . $e($view['number']) . '</h1>';
    $out .= '<p class="cv-state ' . ($vigente ? 'ok' : 'bad') . '" role="status">' . ($vigente ? 'Estado: vigente' : 'Estado: REVOCADA el ' . $e($view['revokedAt'])) . '</p>';
    if ($h !== null) $out .= $view['hMatches'] ? '<p class="cv-state ok">La huella del QR coincide con la registrada.</p>' : '<p class="cv-state bad" role="alert">¡Atención! La huella del enlace NO coincide con la registrada: el QR o el enlace pudo ser alterado.</p>';
    $out .= '<section><h2>Comprobaciones</h2><ul class="cv-checks">';
    foreach ($view['verify']['checks'] as $c) $out .= '<li class="' . ($c['ok'] ? 'ok' : 'bad') . '"><b>' . ($c['ok'] ? '✓' : '✗') . '</b> ' . $e($c['label']) . '<small>' . $e($c['detail']) . '</small></li>';
    $out .= '<li class="' . ($view['ledgerIntact'] ? 'ok' : 'bad') . '"><b>' . ($view['ledgerIntact'] ? '✓' : '✗') . '</b> Libro de solo-anexión sin alteraciones<small>cadena de hashes</small></li></ul></section>';
    $out .= '<section class="cv-grid"><div><h2>Sello de tiempo</h2><p>' . $e($view['genTimeUtc']) . '<br>' . $e($view['genTimeAst']) . '<br><small>Fuente: ' . $e($view['tsa']) . '</small></p>';
    $out .= '<h2>Huella de la constancia</h2><p class="mono">' . $e($view['fingerprint']) . '</p></div><div class="cv-seal"><div id="cv-seal">' . $view['sealSvg'] . '</div><small>Sello visual generado desde el registro: compáralo con el impreso.</small></div></section>';
    if ($view['visibility'] === 'public') {
        $a = $view['asset'];
        $out .= '<section id="cv-asset" data-digest="' . $e($a['digest']) . '" data-files="' . $e(json_encode(array_column($a['files'] ?? [], 'sha512'))) . '"><h2>Activo</h2><dl><dt>Titular</dt><dd>' . $e($view['holder']) . '</dd><dt>Activo</dt><dd>' . $e($a['name']) . ' · ' . $e($a['type']) . ' · v' . $e($a['version']) . '</dd><dt>' . ($a['merkleRoot'] ? 'Raíz Merkle (SHA-512)' : 'Hash del activo (SHA-512)') . '</dt><dd class="mono">' . $e($a['digest']) . '</dd></dl>';
        $out .= '<div class="cv-drop" id="cv-drop" tabindex="0"><p>Arrastra aquí el archivo del activo (o pulsa para elegirlo): su SHA-512 se calcula en tu navegador y no se sube.</p><input type="file" id="cv-file"><p id="cv-result" role="status"></p></div></section>';
        $out .= '<p><a href="/api/constancia/public/' . $e($view['number']) . '.cod">Descargar paquete .cod</a></p>';
    } else {
        $out .= '<p class="cv-private">Constancia privada: solo se muestran estado, sello y comprobaciones.</p>';
    }
    $out .= '<p class="cv-cli">Desde la terminal: <code>hcod verify ' . $e($view['number']) . '</code></p></main><script src="/components/sha512-stream.js?v=1"></script><script src="/components/constancia-verify.js?v=1"></script></body></html>';
    echo $out;
}
