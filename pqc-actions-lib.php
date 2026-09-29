<?php
declare(strict_types=1);

require_once __DIR__ . '/secrets.php';
require_once __DIR__ . '/supabase.php';

const PQA_VERSION = 1;
const PQA_ALGORITHM = 'ML-DSA-87';
const PQA_SESSION_COOKIE = 'hashcod_pqc_action_v1';
const PQA_SESSION_TTL = 1800;
const PQA_PERMIT_TTL = 45;
const PQA_MAX_EVENTS_PER_MINUTE = 600;

function pqaB64u(string $raw): string {
    return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
}

function pqaB64ud(string $value): string {
    $value = strtr(trim($value), '-_', '+/');
    $pad = strlen($value) % 4;
    if ($pad) $value .= str_repeat('=', 4 - $pad);
    $raw = base64_decode($value, true);
    return is_string($raw) ? $raw : '';
}

function pqaHttps(): bool {
    if (function_exists('securityIsHttps')) return securityIsHttps();
    $proto = strtolower(trim((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')));
    if ($proto !== '') return explode(',', $proto)[0] === 'https';
    return !empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off';
}

function pqaHost(): string {
    $host = strtolower(trim((string)($_SERVER['HTTP_X_FORWARDED_HOST'] ?? $_SERVER['HTTP_HOST'] ?? '')));
    return preg_replace('/\s*,.*$/', '', $host) ?? $host;
}

function pqaUaHash(): string {
    return hash('sha256', (string)($_SERVER['HTTP_USER_AGENT'] ?? ''));
}

function pqaSameOrigin(): bool {
    $origin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    $site = strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
    if ($origin === '') return in_array($site, ['', 'same-origin', 'same-site', 'none'], true);

    $parts = @parse_url($origin);
    if (!is_array($parts)) return false;
    $scheme = strtolower((string)($parts['scheme'] ?? ''));
    $host = strtolower((string)($parts['host'] ?? ''));
    $port = isset($parts['port']) ? ':' . (int)$parts['port'] : '';
    $requestScheme = pqaHttps() ? 'https' : 'http';
    return $scheme !== '' && $host !== '' && hash_equals($requestScheme . '://' . pqaHost(), $scheme . '://' . $host . $port);
}

function pqaSecret(): string {
    static $secret = null;
    if (is_string($secret) && strlen($secret) === 32) return $secret;

    $configured = trim((string)secretGet('HASHCOD_PQC_ACTION_HMAC_SECRET', ''));
    if ($configured !== '') {
        $secret = hash('sha256', 'hashcod|pqc-actions|hmac|v1|' . $configured, true);
        return $secret;
    }
    if (function_exists('secretsDataKey')) {
        $base = secretsDataKey();
        if (is_string($base) && strlen($base) >= 32) {
            $secret = hash_hmac('sha256', 'hashcod|pqc-actions|hmac|v1', $base, true);
            return $secret;
        }
    }
    $generated = function_exists('secretEnsure')
        ? (string)secretEnsure('HASHCOD_PQC_ACTION_HMAC_SECRET', fn() => bin2hex(random_bytes(32)))
        : '';
    if ($generated === '') throw new RuntimeException('pqc_action_hmac_secret_unavailable');
    $secret = hash('sha256', 'hashcod|pqc-actions|hmac|v1|' . $generated, true);
    return $secret;
}

function pqaSeal(array $payload): string {
    $body = pqaB64u((string)json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    $mac = hash_hmac('sha256', $body, pqaSecret(), true);
    return $body . '.' . pqaB64u($mac);
}

function pqaOpen(string $token): ?array {
    $parts = explode('.', trim($token), 2);
    if (count($parts) !== 2) return null;
    $mac = pqaB64ud($parts[1]);
    $expected = hash_hmac('sha256', $parts[0], pqaSecret(), true);
    if (strlen($mac) !== 32 || !hash_equals($expected, $mac)) return null;
    $decoded = json_decode(pqaB64ud($parts[0]), true);
    return is_array($decoded) ? $decoded : null;
}

function pqaDataDir(): string {
    $dir = __DIR__ . '/data_storage/security/pqc-actions';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    @chmod($dir, 0700);
    return $dir;
}

function pqaSessionCookieOptions(int $expires): array {
    return [
        'expires' => $expires,
        'path' => '/',
        'secure' => pqaHttps(),
        'httponly' => true,
        'samesite' => 'Strict',
    ];
}

function pqaIssueSession(): array {
    $now = time();
    $sid = bin2hex(random_bytes(24));
    $payload = [
        'kind' => 'hashcod-pqc-action-session',
        'v' => PQA_VERSION,
        'sid' => $sid,
        'iat' => $now,
        'exp' => $now + PQA_SESSION_TTL,
        'ua' => pqaUaHash(),
        'host' => pqaHost(),
        'scheme' => pqaHttps() ? 'https' : 'http',
    ];
    setcookie(PQA_SESSION_COOKIE, pqaSeal($payload), pqaSessionCookieOptions($payload['exp']));
    return $payload;
}

function pqaCurrentSession(bool $create = true): ?array {
    $token = trim((string)($_COOKIE[PQA_SESSION_COOKIE] ?? ''));
    $session = $token !== '' ? pqaOpen($token) : null;
    $valid = is_array($session)
        && ($session['kind'] ?? '') === 'hashcod-pqc-action-session'
        && (int)($session['v'] ?? 0) === PQA_VERSION
        && (int)($session['exp'] ?? 0) >= time()
        && preg_match('/^[a-f0-9]{48}$/', (string)($session['sid'] ?? ''))
        && hash_equals((string)($session['ua'] ?? ''), pqaUaHash())
        && hash_equals((string)($session['host'] ?? ''), pqaHost())
        && hash_equals((string)($session['scheme'] ?? ''), pqaHttps() ? 'https' : 'http');
    if ($valid) return $session;
    return $create ? pqaIssueSession() : null;
}

function pqaSessionHash(array $session): string {
    return hash('sha256', (string)($session['sid'] ?? ''));
}

function pqaStatePath(string $sidHash): string {
    return pqaDataDir() . '/session-' . substr($sidHash, 0, 40) . '.json';
}

function pqaStateDefaults(): array {
    return [
        'last_seq' => 0,
        'chain_head' => str_repeat('0', 128),
        'recent_event_ids' => [],
        'rate_window' => time(),
        'rate_count' => 0,
        'updated_at' => 0,
    ];
}

function pqaNormalizeState($state): array {
    $out = pqaStateDefaults();
    if (!is_array($state)) return $out;
    $out['last_seq'] = max(0, (int)($state['last_seq'] ?? 0));
    $head = strtolower((string)($state['chain_head'] ?? ''));
    if (preg_match('/^[a-f0-9]{128}$/', $head)) $out['chain_head'] = $head;
    $ids = $state['recent_event_ids'] ?? [];
    if (is_array($ids)) {
        $ids = array_values(array_filter(array_map('strval', $ids), fn($v) => preg_match('/^[a-zA-Z0-9._:-]{8,96}$/', $v)));
        $out['recent_event_ids'] = array_slice($ids, -128);
    }
    $out['rate_window'] = max(0, (int)($state['rate_window'] ?? time()));
    $out['rate_count'] = max(0, (int)($state['rate_count'] ?? 0));
    $out['updated_at'] = max(0, (int)($state['updated_at'] ?? time()));
    return $out;
}

function pqaReadStateFile($fp): array {
    rewind($fp);
    $raw = stream_get_contents($fp);
    $state = is_string($raw) && $raw !== '' ? json_decode($raw, true) : null;
    return pqaNormalizeState($state);
}

function pqaWriteStateFile($fp, array $state): void {
    $payload = json_encode($state, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if (!is_string($payload)) throw new RuntimeException('pqc_action_state_encode_failed');
    rewind($fp);
    if (!ftruncate($fp, 0)) throw new RuntimeException('pqc_action_state_truncate_failed');
    if (fwrite($fp, $payload) === false) throw new RuntimeException('pqc_action_state_write_failed');
    fflush($fp);
}

function pqaCloudRows($body): array {
    if (!is_array($body) || $body === []) return [];
    if (array_keys($body) === range(0, count($body) - 1)) return $body;
    return isset($body['id']) ? [$body] : [];
}

function pqaCloudStateId(string $sidHash): string {
    return 'pqc_action_' . substr($sidHash, 0, 40);
}

function pqaCloudLoadState(string $sidHash): ?array {
    if (!function_exists('supabaseDbSelect') || !function_exists('supabaseConfig')) return null;
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) return null;
    $id = pqaCloudStateId($sidHash);
    $res = supabaseDbSelect('l8_app_states', 'select=state,updated_at&id=eq.' . rawurlencode($id) . '&limit=1');
    if (empty($res['ok'])) return null;
    $rows = pqaCloudRows($res['body'] ?? []);
    if (!$rows) return null;
    $state = $rows[0]['state'] ?? [];
    if (is_string($state)) $state = json_decode($state, true);
    if (!is_array($state)) return null;
    return pqaNormalizeState($state);
}

function pqaCloudCheckpoint(string $sidHash, array $state, array $receipt, ?array $pqc): void {
    if (!function_exists('supabaseDbUpsert') || !function_exists('supabaseConfig')) return;
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) return;
    $updated = gmdate('c');
    $checkpoint = $state;
    $checkpoint['last_receipt_hash'] = hash('sha256', (string)json_encode($receipt, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    $checkpoint['last_signature_b64'] = is_array($pqc) ? (string)($pqc['signature_b64'] ?? '') : '';
    $checkpoint['key_fingerprint'] = is_array($pqc) ? (string)($pqc['key_fingerprint'] ?? '') : '';
    $checkpoint['algorithm'] = PQA_ALGORITHM;
    $checkpoint['standard'] = 'NIST FIPS 204';
    @supabaseDbUpsert('l8_app_states', [[
        'id' => pqaCloudStateId($sidHash),
        'account_key' => 'pqc_session_' . substr($sidHash, 0, 40),
        'app_id' => 'hashcod-pqc-action-bus-v1',
        'state' => $checkpoint,
        'updated_at' => $updated,
    ]], 'id');
}

function pqaReadState(array $session): array {
    $sidHash = pqaSessionHash($session);
    $path = pqaStatePath($sidHash);
    $local = pqaStateDefaults();
    $fp = @fopen($path, 'c+');
    if ($fp) {
        if (@flock($fp, LOCK_SH)) {
            $local = pqaReadStateFile($fp);
            @flock($fp, LOCK_UN);
        }
        @fclose($fp);
    }
    $cloud = pqaCloudLoadState($sidHash);
    if (is_array($cloud) && (int)($cloud['last_seq'] ?? 0) > (int)($local['last_seq'] ?? 0)) {
        return $cloud;
    }
    return $local;
}

function pqaPython(): string {
    return is_executable('/opt/l8-py/bin/python') ? '/opt/l8-py/bin/python' : 'python3';
}

function pqaRunCrypto(string $command, array $payload = []): ?array {
    $cmd = [pqaPython(), __DIR__ . '/scripts/mldsa87_access.py', $command];
    $proc = @proc_open($cmd, [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ], $pipes, __DIR__);
    if (!is_resource($proc)) return null;
    if ($payload !== []) fwrite($pipes[0], (string)json_encode($payload, JSON_UNESCAPED_SLASHES));
    fclose($pipes[0]);
    $out = (string)stream_get_contents($pipes[1]);
    $err = (string)stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $code = @proc_close($proc);
    $decoded = json_decode(trim($out), true);
    if ($code !== 0 || !is_array($decoded) || empty($decoded['ok'])) return null;
    return $decoded;
}

function pqaValidPublicKeyB64(string $value): bool {
    if (strlen($value) !== 3456 || preg_match('/[^A-Za-z0-9+\/]/', $value)) return false;
    $raw = base64_decode($value, true);
    return is_string($raw) && strlen($raw) === 2592;
}

function pqaValidSecretKeyB64(string $value): bool {
    if (strlen($value) !== 6528 || preg_match('/[^A-Za-z0-9+\/]/', $value)) return false;
    $raw = base64_decode($value, true);
    return is_string($raw) && strlen($raw) === 4896;
}

function pqaActionKeypair(): ?array {
    static $pair = null;
    if (is_array($pair)) return $pair;

    $pk = preg_replace('/\s+/', '', trim((string)secretGet('HASHCOD_ACTION_MLDSA87_PUBLIC_KEY_B64', ''))) ?? '';
    $sk = preg_replace('/\s+/', '', trim((string)secretGet('HASHCOD_ACTION_MLDSA87_SECRET_KEY_B64', ''))) ?? '';
    if (pqaValidPublicKeyB64($pk) && pqaValidSecretKeyB64($sk)) {
        return $pair = ['public_key_b64' => $pk, 'secret_key_b64' => $sk];
    }

    $lockPath = pqaDataDir() . '/keygen.lock';
    $lock = @fopen($lockPath, 'c+');
    if (!$lock) return null;
    if (!@flock($lock, LOCK_EX)) {
        @fclose($lock);
        return null;
    }

    $pk = preg_replace('/\s+/', '', trim((string)secretGet('HASHCOD_ACTION_MLDSA87_PUBLIC_KEY_B64', ''))) ?? '';
    $sk = preg_replace('/\s+/', '', trim((string)secretGet('HASHCOD_ACTION_MLDSA87_SECRET_KEY_B64', ''))) ?? '';
    if (!pqaValidPublicKeyB64($pk) || !pqaValidSecretKeyB64($sk)) {
        $auto = strtolower(trim((string)secretGet('HASHCOD_ACTION_MLDSA87_AUTO_GENERATE', '1')));
        if (!in_array($auto, ['1', 'true', 'yes', 'on'], true)) {
            @flock($lock, LOCK_UN);
            @fclose($lock);
            return null;
        }
        $generated = pqaRunCrypto('keygen-json');
        if (!is_array($generated)) {
            @flock($lock, LOCK_UN);
            @fclose($lock);
            return null;
        }
        $pk = (string)($generated['public_key_b64'] ?? '');
        $sk = (string)($generated['secret_key_b64'] ?? '');
        if (!pqaValidPublicKeyB64($pk) || !pqaValidSecretKeyB64($sk)) {
            @flock($lock, LOCK_UN);
            @fclose($lock);
            return null;
        }
        $probe = 'HC-PQC-ACTION-KEY-SELFTEST.' . pqaB64u(random_bytes(24));
        $probeSig = pqaRunCrypto('sign-json', ['secret_key_b64' => $sk, 'message' => $probe]);
        $probeOk = is_array($probeSig)
            ? pqaRunCrypto('verify-json', [
                'public_key_b64' => $pk,
                'challenge' => $probe,
                'signature_b64' => (string)($probeSig['signature_b64'] ?? ''),
            ])
            : null;
        if (!is_array($probeOk)) {
            @flock($lock, LOCK_UN);
            @fclose($lock);
            return null;
        }
        if (!function_exists('secretPutVault')
            || !secretPutVault('HASHCOD_ACTION_MLDSA87_PUBLIC_KEY_B64', $pk)
            || !secretPutVault('HASHCOD_ACTION_MLDSA87_SECRET_KEY_B64', $sk)) {
            @flock($lock, LOCK_UN);
            @fclose($lock);
            return null;
        }
    }

    @flock($lock, LOCK_UN);
    @fclose($lock);
    @chmod($lockPath, 0600);
    return $pair = ['public_key_b64' => $pk, 'secret_key_b64' => $sk];
}

function pqaPublicKeyStatus(): array {
    $pair = pqaActionKeypair();
    if (!is_array($pair)) {
        return [
            'active' => false,
            'algorithm' => PQA_ALGORITHM,
            'standard' => 'NIST FIPS 204',
            'key_fingerprint' => '',
        ];
    }
    $raw = base64_decode($pair['public_key_b64'], true);
    return [
        'active' => true,
        'algorithm' => PQA_ALGORITHM,
        'standard' => 'NIST FIPS 204',
        'key_fingerprint' => is_string($raw) ? hash('sha256', $raw) : '',
    ];
}

function pqaSignMessage(string $message): ?array {
    $pair = pqaActionKeypair();
    if (!is_array($pair)) return null;
    $signed = pqaRunCrypto('sign-json', [
        'secret_key_b64' => $pair['secret_key_b64'],
        'message' => $message,
    ]);
    if (!is_array($signed)) return null;
    $signature = (string)($signed['signature_b64'] ?? '');
    $raw = base64_decode($signature, true);
    if (!is_string($raw) || strlen($raw) !== 4627) return null;
    $pkRaw = base64_decode($pair['public_key_b64'], true);
    return [
        'algorithm' => PQA_ALGORITHM,
        'standard' => 'NIST FIPS 204',
        'signature_b64' => $signature,
        'key_fingerprint' => is_string($pkRaw) ? hash('sha256', $pkRaw) : '',
    ];
}

function pqaPublicKeyB64(): string {
    $pair = pqaActionKeypair();
    return is_array($pair) ? (string)$pair['public_key_b64'] : '';
}

function pqaSanitizeToken(string $value, int $max = 160): string {
    $value = preg_replace('/[\x00-\x1F\x7F]/u', '', trim($value)) ?? '';
    if (function_exists('mb_substr')) return mb_substr($value, 0, $max, 'UTF-8');
    return substr($value, 0, $max);
}

function pqaNormalizeKind(string $kind): string {
    $kind = strtolower(trim($kind));
    if (!preg_match('/^[a-z][a-z0-9._:-]{1,63}$/', $kind)) return 'ui.action';
    return $kind;
}

function pqaNormalizeEventId(string $eventId): string {
    $eventId = trim($eventId);
    return preg_match('/^[a-zA-Z0-9._:-]{8,96}$/', $eventId) ? $eventId : '';
}

function pqaAuditPath(): string {
    return pqaDataDir() . '/audit-' . gmdate('Y-m-d') . '.jsonl';
}

function pqaAppendAudit(array $record): void {
    $line = json_encode($record, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if (!is_string($line)) return;
    $fp = @fopen(pqaAuditPath(), 'ab');
    if (!$fp) return;
    if (@flock($fp, LOCK_EX)) {
        @fwrite($fp, $line . "\n");
        @fflush($fp);
        @flock($fp, LOCK_UN);
    }
    @fclose($fp);
    @chmod(pqaAuditPath(), 0600);
}

/**
 * Derives a deterministic transition vector and its Euclidean norm:
 * ||x||_2 = sqrt(x_1^2 + ... + x_n^2)
 *
 * The norm is NOT used as a replacement cryptographic primitive. It is
 * domain-separated transition material that is bound into the HMAC chain and
 * the ML-DSA-87 signed receipt, so every transit carries an additional,
 * independently recomputable mathematical factor.
 */
function pqaEuclideanTransition(string $previousHash, string $canonicalEvent, int $seq, string $eventId): array {
    $seedMaterial = implode("\n", [
        'HC-PQC-EUCLIDEAN-TRANSITION-V1',
        $previousHash,
        (string)$seq,
        $eventId,
        $canonicalEvent,
    ]);
    $digest = hash('sha512', $seedMaterial, true);

    // Eight 16-bit coordinates keep the fixed-point multiplication safely
    // inside signed 64-bit integer range while still changing avalanche-style
    // with every distinct transition.
    $unpacked = unpack('n8', substr($digest, 0, 16));
    if (!is_array($unpacked) || count($unpacked) !== 8) {
        throw new RuntimeException('pqc_transition_vector_failed');
    }

    $vector = [];
    $sumSquares = 0.0;
    foreach ($unpacked as $coordinate) {
        $x = (int)$coordinate + 1; // 1..65536, avoids a zero-only coordinate.
        $vector[] = $x;
        $sumSquares += (float)$x * (float)$x;
    }

    $norm = sqrt($sumSquares);
    if (!is_finite($norm) || $norm <= 0.0) {
        throw new RuntimeException('pqc_transition_norm_failed');
    }

    // Fixed-point representation is what participates in the cryptographic
    // transcript, avoiding platform-dependent float serialization.
    $normScaled = (int)round($norm * 1000000.0);

    $scalarParts = unpack('n1', substr($digest, 16, 2));
    if (!is_array($scalarParts) || !isset($scalarParts[1])) {
        throw new RuntimeException('pqc_transition_scalar_failed');
    }
    $transitScalar = (int)$scalarParts[1] + 1; // 1..65536.
    $transitionProduct = $normScaled * $transitScalar;

    if ($normScaled <= 0 || $transitionProduct <= 0) {
        throw new RuntimeException('pqc_transition_product_failed');
    }

    return [
        'scheme' => 'EUCLIDEAN-NORM-V1',
        'formula' => '||x||_2=sqrt(x1^2+...+xn^2)',
        'dimension' => 8,
        'derivation' => 'SHA-512(HC-PQC-EUCLIDEAN-TRANSITION-V1 || previous_hash || seq || event_id || canonical_event)',
        'norm_scaled_1e6' => $normScaled,
        'transit_scalar' => $transitScalar,
        'transition_product' => (string)$transitionProduct,
        'vector_commitment_sha256' => hash('sha256', implode(',', $vector)),
    ];
}

function pqaCanonicalTransition(array $transition): string {
    $canonical = json_encode($transition, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if (!is_string($canonical) || $canonical === '') {
        throw new RuntimeException('pqc_transition_encode_failed');
    }
    return $canonical;
}

function pqaProcessAction(array $session, array $input): array {
    $sidHash = pqaSessionHash($session);
    $path = pqaStatePath($sidHash);
    $fp = @fopen($path, 'c+');
    if (!$fp || !@flock($fp, LOCK_EX)) {
        if (is_resource($fp)) @fclose($fp);
        throw new RuntimeException('pqc_action_state_lock_failed');
    }

    try {
        $state = pqaReadStateFile($fp);
        $cloudState = pqaCloudLoadState($sidHash);
        if (is_array($cloudState) && (int)($cloudState['last_seq'] ?? 0) > (int)($state['last_seq'] ?? 0)) {
            $state = $cloudState;
        }
        $now = time();
        if ($now - (int)$state['rate_window'] >= 60) {
            $state['rate_window'] = $now;
            $state['rate_count'] = 0;
        }
        if ((int)$state['rate_count'] >= PQA_MAX_EVENTS_PER_MINUTE) {
            throw new RuntimeException('pqc_action_rate_limited');
        }

        $seq = (int)($input['seq'] ?? 0);
        $expectedSeq = (int)$state['last_seq'] + 1;
        if ($seq !== $expectedSeq) {
            return [
                'ok' => false,
                'error' => 'sequence_conflict',
                'next_seq' => $expectedSeq,
            ];
        }

        $eventId = pqaNormalizeEventId((string)($input['event_id'] ?? ''));
        if ($eventId === '') throw new InvalidArgumentException('invalid_event_id');
        if (in_array($eventId, $state['recent_event_ids'], true)) {
            throw new RuntimeException('replayed_event');
        }

        $clientTs = (int)($input['client_ts'] ?? 0);
        $nowMs = (int)round(microtime(true) * 1000);
        if ($clientTs > 0 && abs($nowMs - $clientTs) > 300000) {
            throw new RuntimeException('stale_event');
        }

        $kind = pqaNormalizeKind((string)($input['kind'] ?? 'ui.action'));
        $target = pqaSanitizeToken((string)($input['target'] ?? ''), 180);
        $toolId = pqaSanitizeToken((string)($input['tool_id'] ?? ''), 120);
        $requestPath = pqaSanitizeToken((string)($input['request_path'] ?? ''), 240);
        $method = strtoupper(pqaSanitizeToken((string)($input['method'] ?? ''), 12));
        if (!preg_match('/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)?$/', $method)) $method = '';

        $event = [
            'v' => PQA_VERSION,
            'sid_hash' => $sidHash,
            'seq' => $seq,
            'event_id' => $eventId,
            'kind' => $kind,
            'target' => $target,
            'tool_id' => $toolId,
            'request_path' => $requestPath,
            'method' => $method,
            'client_ts' => $clientTs,
            'server_ts' => $nowMs,
            'path' => pqaSanitizeToken((string)($_SERVER['REQUEST_URI'] ?? ''), 240),
            'ua_hash' => pqaUaHash(),
        ];

        $canonicalEvent = (string)json_encode($event, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $previous = (string)$state['chain_head'];

        // Every transit gets a deterministic Euclidean-norm multiplier derived
        // from this exact transition. The fixed-point product is mixed into the
        // chain BEFORE ML-DSA-87 signs the receipt.
        $transition = pqaEuclideanTransition($previous, $canonicalEvent, $seq, $eventId);
        $canonicalTransition = pqaCanonicalTransition($transition);
        $eventHash = hash_hmac(
            'sha512',
            "HC-PQC-ACTION-CHAIN-V2\n" . $previous . "\n" . $canonicalEvent . "\n" . $canonicalTransition,
            pqaSecret()
        );

        $receipt = [
            'v' => PQA_VERSION,
            'algorithm' => PQA_ALGORITHM,
            'standard' => 'NIST FIPS 204',
            'event' => $event,
            'transition' => $transition,
            'previous_hash' => $previous,
            'event_hash' => $eventHash,
        ];
        $canonicalReceipt = (string)json_encode($receipt, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $message = 'HC-PQC-ACTION-V1.' . pqaB64u($canonicalReceipt);
        $pqc = pqaSignMessage($message);
        if (!is_array($pqc)) {
            throw new RuntimeException('pqc_signing_unavailable');
        }

        $receiptHash = hash('sha256', $canonicalReceipt);
        $permit = pqaSeal([
            'kind' => 'pqc-action-permit',
            'v' => PQA_VERSION,
            'sid_hash' => $sidHash,
            'event_id' => $eventId,
            'event_hash' => $eventHash,
            'transition_product' => (string)$transition['transition_product'],
            'receipt_hash' => $receiptHash,
            'request_path' => $requestPath,
            'method' => $method,
            'pqc_signed' => true,
            'iat' => $now,
            'exp' => $now + PQA_PERMIT_TTL,
        ]);

        $state['last_seq'] = $seq;
        $state['chain_head'] = $eventHash;
        $state['recent_event_ids'][] = $eventId;
        $state['recent_event_ids'] = array_slice(array_values(array_unique($state['recent_event_ids'])), -128);
        $state['rate_count'] = (int)$state['rate_count'] + 1;
        $state['updated_at'] = $now;
        pqaWriteStateFile($fp, $state);

        $criticalKinds = ['platform.start', 'platform.enter', 'tool.enable', 'api.mutation'];
        if (($seq % 8) === 0 || in_array($kind, $criticalKinds, true)) {
            pqaCloudCheckpoint($sidHash, $state, $receipt, $pqc);
        }

        pqaAppendAudit([
            'receipt' => $receipt,
            'receipt_hash' => $receiptHash,
            'pqc' => $pqc,
        ]);

        return [
            'ok' => true,
            'next_seq' => $seq + 1,
            'receipt' => $receipt,
            'receipt_hash' => $receiptHash,
            'event_hash' => $eventHash,
            'transition' => $transition,
            'permit_token' => $permit,
            'pqc' => $pqc,
        ];
    } finally {
        @flock($fp, LOCK_UN);
        @fclose($fp);
        @chmod($path, 0600);
    }
}

function pqaEnforcementEnabled(): bool {
    $value = strtolower(trim((string)secretGet('HASHCOD_PQC_ACTION_ENFORCE', '0')));
    return in_array($value, ['1', 'true', 'yes', 'on'], true);
}

function pqaPermitReplayDir(): string {
    $dir = pqaDataDir() . '/permits';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    @chmod($dir, 0700);
    return $dir;
}

function pqaPermitReplayCleanup(): void {
    if (random_int(1, 32) !== 1) return;
    $now = time();
    foreach (glob(pqaPermitReplayDir() . '/*.used') ?: [] as $path) {
        $exp = (int)@file_get_contents($path);
        if ($exp > 0 && $exp < $now - 60) @unlink($path);
    }
}

function pqaConsumePermitPayload(array $payload): bool {
    $eventHash = strtolower((string)($payload['event_hash'] ?? ''));
    $eventId = (string)($payload['event_id'] ?? '');
    $exp = (int)($payload['exp'] ?? 0);
    if (!preg_match('/^[a-f0-9]{128}$/', $eventHash) || pqaNormalizeEventId($eventId) === '' || $exp < time()) return false;
    pqaPermitReplayCleanup();
    $key = hash('sha256', $eventHash . '|' . $eventId);
    $path = pqaPermitReplayDir() . '/' . $key . '.used';
    $fp = @fopen($path, 'x');
    if (!is_resource($fp)) return false;
    @fwrite($fp, (string)$exp);
    @fclose($fp);
    @chmod($path, 0600);
    return true;
}

function pqaValidatePermitToken(string $token, string $requestPath = '', string $method = '', bool $consume = false): bool {
    $payload = pqaOpen($token);
    if (!is_array($payload)) return false;
    if (($payload['kind'] ?? '') !== 'pqc-action-permit') return false;
    if ((int)($payload['v'] ?? 0) !== PQA_VERSION) return false;
    if ((int)($payload['exp'] ?? 0) < time()) return false;
    if (empty($payload['pqc_signed'])) return false;

    $session = pqaCurrentSession(false);
    if (!is_array($session)) return false;
    if (!hash_equals((string)($payload['sid_hash'] ?? ''), pqaSessionHash($session))) return false;

    $boundPath = (string)($payload['request_path'] ?? '');
    $boundMethod = strtoupper((string)($payload['method'] ?? ''));
    if ($requestPath !== '' && $boundPath !== '' && !hash_equals($boundPath, $requestPath)) return false;
    if ($method !== '' && $boundMethod !== '' && !hash_equals($boundMethod, strtoupper($method))) return false;
    if ($consume && !pqaConsumePermitPayload($payload)) return false;
    return true;
}

function pqaRequirePermitForMutation(string $requestPath): void {
    if (!pqaEnforcementEnabled()) return;
    $method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) return;
    if ($requestPath === '/api/pqc-actions') return;

    $permit = trim((string)($_SERVER['HTTP_X_HASHCOD_PQC_PERMIT'] ?? ''));
    if ($permit === '' || !pqaValidatePermitToken($permit, $requestPath, $method, true)) {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        http_response_code(428);
        echo json_encode([
            'ok' => false,
            'error' => 'pqc_action_permit_required',
            'algorithm' => PQA_ALGORITHM,
            'standard' => 'NIST FIPS 204',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }
}
