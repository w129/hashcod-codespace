<?php
/**
 * Secure Toolbox link launcher for Hashcod Codespace.
 *
 * Each 4x4 Toolbox circle can be assigned an HTTP(S) URL plus a sanitized SVG.
 * Configuration requires the registered Windows Hello admin session. The user
 * chooses a private access signature for each circle when saving it; only a
 * one-way password hash of that signature is stored. Opening (or deleting) a
 * saved link requires the same per-circle signature. Destination URLs and
 * identity metadata are never exposed by the public pull endpoint.
 */

declare(strict_types=1);

@ini_set('display_errors', '0');
@ini_set('expose_php', '0');
@set_time_limit(20);

require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/admin-device.php';

securityBootstrap('api');

const HTL_TABLE = 'hashcod_toolbox_links';
const HTL_MAX_SVG_BYTES = 32768;
const HTL_MAX_BODY_BYTES = 131072;
const HTL_MAX_SIGNATURE_BYTES = 32768;

function htlJson(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function htlRequireAjaxPost(): void {
    if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        htlJson(['ok' => false, 'error' => 'Método no permitido'], 405);
    }
    if (strcasecmp((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''), 'XMLHttpRequest') !== 0) {
        htlJson(['ok' => false, 'error' => 'Solicitud no autorizada'], 403);
    }
}

function htlReadJson(): array {
    $raw = file_get_contents('php://input', false, null, 0, HTL_MAX_BODY_BYTES + 1);
    if (!is_string($raw) || trim($raw) === '') return [];
    if (strlen($raw) > HTL_MAX_BODY_BYTES) {
        htlJson(['ok' => false, 'error' => 'Payload demasiado grande'], 413);
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function htlRows($body): array {
    if (!is_array($body) || $body === []) return [];
    if (array_keys($body) === range(0, count($body) - 1)) return $body;
    return isset($body['slot_key']) ? [$body] : [];
}

function htlSlot($value): string {
    $slot = trim((string)$value);
    return preg_match('/^[1-4]-[1-4]$/', $slot) ? $slot : '';
}

/**
 * Access signatures are user-defined secrets. Leading/trailing whitespace is
 * ignored so copied signatures do not fail because of an accidental newline.
 */
function htlNormalizeSignature($value): string {
    $signature = trim((string)$value);
    if ($signature === '' || strlen($signature) > HTL_MAX_SIGNATURE_BYTES) return '';
    return $signature;
}

/** Store no plaintext signature: SHA-512 prehash + password_hash. */
function htlHashSignature($value): string {
    $signature = htlNormalizeSignature($value);
    if ($signature === '') return '';
    $digest = hash('sha512', $signature);
    $algorithm = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
    $hash = password_hash($digest, $algorithm);
    return is_string($hash) ? $hash : '';
}

function htlVerifyStoredSignature($value, $storedHash): bool {
    $signature = htlNormalizeSignature($value);
    $storedHash = trim((string)$storedHash);
    if ($signature === '' || $storedHash === '') return false;
    return password_verify(hash('sha512', $signature), $storedHash);
}

function htlRequireStoredSignature(array $body, array $row): void {
    $rate = securityRateAllowSliding('hashcod_toolbox_circle_signature', 18, 60);
    if (empty($rate['allowed'])) {
        htlJson([
            'ok' => false,
            'error' => 'Demasiados intentos de firma. Espera antes de volver a probar.',
            'retry_after' => (int)($rate['retry_after'] ?? 30),
        ], 429);
    }

    $storedHash = trim((string)($row['access_signature_hash'] ?? ''));
    if ($storedHash === '') {
        htlJson([
            'ok' => false,
            'error' => 'Este círculo fue guardado antes del sistema de firma individual. Edítalo y guarda una firma nueva.',
        ], 409);
    }

    if (!htlVerifyStoredSignature($body['signature'] ?? '', $storedHash)) {
        htlJson(['ok' => false, 'error' => 'Firma del círculo incorrecta. Debes usar la misma que elegiste al guardarlo.'], 403);
    }
}

function htlUuidV4(): string {
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    $hex = bin2hex($data);
    return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4)
        . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20, 12);
}

function htlNormalizeUrl($value): string {
    $url = trim((string)$value);
    if ($url === '' || strlen($url) > 4096) return '';
    $parts = @parse_url($url);
    $scheme = strtolower((string)($parts['scheme'] ?? ''));
    $host = trim((string)($parts['host'] ?? ''));
    if (!in_array($scheme, ['http', 'https'], true) || $host === '') return '';
    if (isset($parts['user']) || isset($parts['pass'])) return '';
    return $url;
}

function htlCleanText($value, int $max): string {
    $value = trim((string)$value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    if (function_exists('mb_substr')) return mb_substr($value, 0, $max, 'UTF-8');
    return substr($value, 0, $max);
}

/**
 * Strict SVG sanitizer for Toolbox icons. No scripts, foreign HTML, network
 * resources, event attributes or javascript/data URLs are allowed.
 */
function htlSanitizeSvg($raw): string {
    $svg = trim((string)$raw);
    if ($svg === '' || strlen($svg) > HTL_MAX_SVG_BYTES) return '';
    if (stripos($svg, '<!DOCTYPE') !== false || stripos($svg, '<!ENTITY') !== false) return '';

    if (!class_exists('DOMDocument')) {
        if (!preg_match('/^<svg\b[\s\S]*<\/svg>$/i', $svg)) return '';
        if (preg_match('/<(script|foreignObject|iframe|object|embed|audio|video|image|use|a)\b/i', $svg)) return '';
        if (preg_match('/\son[a-z]+\s*=/i', $svg)) return '';
        if (preg_match('/(?:javascript:|data:text\/html|https?:\/\/)/i', $svg)) return '';
        return $svg;
    }

    $previous = libxml_use_internal_errors(true);
    $dom = new DOMDocument('1.0', 'UTF-8');
    $ok = $dom->loadXML($svg, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING | LIBXML_COMPACT);
    libxml_clear_errors();
    libxml_use_internal_errors($previous);
    if (!$ok || !$dom->documentElement || strtolower($dom->documentElement->localName) !== 'svg') return '';

    $allowedElements = array_fill_keys([
        'svg','g','path','circle','ellipse','rect','line','polyline','polygon',
        'defs','lineargradient','radialgradient','stop','clippath','mask','title','desc'
    ], true);
    $globalAttrs = array_fill_keys([
        'id','viewbox','width','height','x','y','x1','y1','x2','y2','cx','cy','r','rx','ry',
        'd','points','fill','fill-opacity','fill-rule','stroke','stroke-width','stroke-opacity',
        'stroke-linecap','stroke-linejoin','stroke-miterlimit','stroke-dasharray','stroke-dashoffset',
        'opacity','transform','gradientunits','gradienttransform','offset','stop-color','stop-opacity',
        'clip-path','clip-rule','mask','preserveaspectratio','xmlns','role','aria-hidden','focusable'
    ], true);

    $nodes = [];
    foreach ($dom->getElementsByTagName('*') as $node) $nodes[] = $node;
    foreach ($nodes as $node) {
        $name = strtolower($node->localName);
        if (!isset($allowedElements[$name])) return '';
        if (!$node->hasAttributes()) continue;
        $remove = [];
        foreach ($node->attributes as $attr) {
            $attrName = strtolower($attr->name);
            $value = trim((string)$attr->value);
            if (str_starts_with($attrName, 'on')) return '';
            if (in_array($attrName, ['href','xlink:href','style'], true)) {
                if ($attrName === 'style') return '';
                if ($value === '' || $value[0] !== '#') return '';
            }
            if (!isset($globalAttrs[$attrName]) && !in_array($attrName, ['href','xlink:href'], true)) {
                $remove[] = $attr->name;
                continue;
            }
            if (preg_match('/javascript:|data:text\/html|https?:\/\//i', $value)) return '';
        }
        foreach ($remove as $attrName) $node->removeAttribute($attrName);
    }

    $out = $dom->saveXML($dom->documentElement);
    if (!is_string($out) || $out === '' || strlen($out) > HTL_MAX_SVG_BYTES) return '';
    return $out;
}

function htlFetchRow(string $slot): ?array {
    $res = supabaseDbSelect(
        HTL_TABLE,
        'select=slot_key,url,icon_svg,label,identity_id,identity_name,identity_username,identity_email,access_signature_hash,is_deleted,created_at_ms,updated_at_ms,updated_by'
        . '&slot_key=eq.' . rawurlencode($slot) . '&limit=1'
    );
    if (empty($res['ok'])) return null;
    $rows = htlRows($res['body'] ?? []);
    return $rows ? $rows[0] : null;
}

function htlPublicList(): array {
    $res = supabaseDbSelect(
        HTL_TABLE,
        'select=slot_key,icon_svg,label,updated_at_ms&is_deleted=eq.false&order=slot_key.asc&limit=16'
    );
    if (empty($res['ok'])) {
        return ['ok' => false, 'error' => $res['error'] ?? 'No se pudo leer PostgreSQL', 'links' => []];
    }
    $links = [];
    foreach (htlRows($res['body'] ?? []) as $row) {
        $slot = htlSlot($row['slot_key'] ?? '');
        if ($slot === '') continue;
        $icon = htlSanitizeSvg($row['icon_svg'] ?? '');
        if ($icon === '') continue;
        $links[] = [
            'slot' => $slot,
            'label' => htlCleanText($row['label'] ?? '', 120),
            'iconSvg' => $icon,
            'updatedAt' => max(1, (int)($row['updated_at_ms'] ?? 1)),
        ];
    }
    return ['ok' => true, 'links' => $links, 'shared' => true];
}

function htlSave(array $body): array {
    $slot = htlSlot($body['slot'] ?? '');
    $url = htlNormalizeUrl($body['url'] ?? '');
    $icon = htlSanitizeSvg($body['iconSvg'] ?? $body['icon_svg'] ?? '');
    $signatureHash = htlHashSignature($body['signature'] ?? '');
    if ($slot === '') return ['ok' => false, 'error' => 'Círculo inválido.', 'status' => 400];
    if ($url === '') return ['ok' => false, 'error' => 'Introduce un enlace HTTP o HTTPS válido.', 'status' => 422];
    if ($icon === '') return ['ok' => false, 'error' => 'El SVG no es válido o contiene elementos no permitidos.', 'status' => 422];
    if ($signatureHash === '') return ['ok' => false, 'error' => 'Elige una firma de acceso para este círculo.', 'status' => 422];

    $label = htlCleanText($body['label'] ?? '', 120);
    $identityName = htlCleanText($body['identityName'] ?? '', 120);
    $identityUsername = htlCleanText($body['identityUsername'] ?? '', 120);
    $identityEmail = htlCleanText($body['identityEmail'] ?? '', 254);
    if ($identityEmail !== '' && filter_var($identityEmail, FILTER_VALIDATE_EMAIL) === false) {
        return ['ok' => false, 'error' => 'El correo de la identidad no es válido.', 'status' => 422];
    }

    $existing = htlFetchRow($slot);
    $now = (int)round(microtime(true) * 1000);
    $created = max(1, (int)($existing['created_at_ms'] ?? $now));
    $identityId = (string)($existing['identity_id'] ?? '');
    if (!preg_match('/^[0-9a-f-]{36}$/i', $identityId)) $identityId = htlUuidV4();

    $row = [
        'slot_key' => $slot,
        'url' => $url,
        'icon_svg' => $icon,
        'label' => $label,
        'identity_id' => $identityId,
        'identity_name' => $identityName,
        'identity_username' => $identityUsername,
        'identity_email' => $identityEmail,
        'access_signature_hash' => $signatureHash,
        'is_deleted' => false,
        'created_at_ms' => $created,
        'updated_at_ms' => max($created, $now),
        'updated_by' => 'windows-hello-admin',
        'updated_at' => gmdate('c'),
    ];
    $db = supabaseDbUpsert(HTL_TABLE, [$row], 'slot_key');
    if (empty($db['ok'])) {
        return ['ok' => false, 'error' => $db['error'] ?? 'PostgreSQL no pudo guardar el círculo.', 'status' => 503];
    }
    return ['ok' => true, 'slot' => $slot, 'identityId' => $identityId, 'updatedAt' => $row['updated_at_ms']];
}

function htlOpen(array $body): array {
    $slot = htlSlot($body['slot'] ?? '');
    if ($slot === '') return ['ok' => false, 'error' => 'Círculo inválido.', 'status' => 400];
    $row = htlFetchRow($slot);
    if (!$row || !empty($row['is_deleted'])) {
        return ['ok' => false, 'error' => 'Este círculo todavía no tiene un enlace seguro.', 'status' => 404];
    }
    htlRequireStoredSignature($body, $row);
    $url = htlNormalizeUrl($row['url'] ?? '');
    if ($url === '') return ['ok' => false, 'error' => 'El enlace guardado no es válido.', 'status' => 422];
    return [
        'ok' => true,
        'slot' => $slot,
        'url' => $url,
        'label' => htlCleanText($row['label'] ?? '', 120),
        'identity' => [
            'id' => (string)($row['identity_id'] ?? ''),
            'name' => htlCleanText($row['identity_name'] ?? '', 120),
            'username' => htlCleanText($row['identity_username'] ?? '', 120),
            'email' => htlCleanText($row['identity_email'] ?? '', 254),
            'provider' => 'hashcod-codespace',
        ],
    ];
}

function htlDelete(array $body): array {
    $slot = htlSlot($body['slot'] ?? '');
    if ($slot === '') return ['ok' => false, 'error' => 'Círculo inválido.', 'status' => 400];
    $existing = htlFetchRow($slot);
    if (!$existing) return ['ok' => true, 'slot' => $slot];
    htlRequireStoredSignature($body, $existing);
    $existing['is_deleted'] = true;
    $existing['updated_at_ms'] = max((int)($existing['created_at_ms'] ?? 1), (int)round(microtime(true) * 1000));
    $existing['updated_by'] = 'windows-hello-admin';
    $existing['updated_at'] = gmdate('c');
    $db = supabaseDbUpsert(HTL_TABLE, [$existing], 'slot_key');
    if (empty($db['ok'])) {
        return ['ok' => false, 'error' => $db['error'] ?? 'No se pudo quitar el enlace.', 'status' => 503];
    }
    return ['ok' => true, 'slot' => $slot];
}

$action = trim((string)($_GET['action'] ?? 'pull'));

if ($action === 'pull') {
    if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'GET') {
        htlJson(['ok' => false, 'error' => 'Método no permitido'], 405);
    }
    $result = htlPublicList();
    htlJson($result, !empty($result['ok']) ? 200 : 503);
}

if ($action === 'save') {
    htlRequireAjaxPost();
    adminRequire();
    $body = htlReadJson();
    $result = htlSave($body);
    htlJson($result, (int)($result['status'] ?? (!empty($result['ok']) ? 200 : 422)));
}

if ($action === 'open') {
    htlRequireAjaxPost();
    $body = htlReadJson();
    $result = htlOpen($body);
    htlJson($result, (int)($result['status'] ?? (!empty($result['ok']) ? 200 : 422)));
}

if ($action === 'delete') {
    htlRequireAjaxPost();
    adminRequire();
    $body = htlReadJson();
    $result = htlDelete($body);
    htlJson($result, (int)($result['status'] ?? (!empty($result['ok']) ? 200 : 422)));
}

htlJson(['ok' => false, 'error' => 'Acción no reconocida'], 404);
