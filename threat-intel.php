<?php
/**
 * threat-intel.php — Subetapa de Inteligencia de Amenazas y Reputación de IP / Bot Defense
 * para Hashcod Codespace (Milestone 1).
 *
 * Características:
 * 1. Comprobación de reputación de IP multi-proveedor en tiempo real:
 *    - AbuseIPDB v2 (API REST con headers de autorización y edad de reportes).
 *    - IPQualityScore (IPQS) con detección de proxy/VPN/Tor/bot.
 *    - StopForumSpam (API pública de spam y abuso sin necesidad obligatoria de clave).
 * 2. Caché multinivel de alta concurrencia:
 *    - Nivel 1: Memoria de proceso + APCu (lock-free, <0.1ms).
 *    - Nivel 2: Particionamiento de disco de 2 niveles en data_storage/security/threat_cache/.
 *    - TTL configurable (por defecto 3600 segundos).
 * 3. Matriz de decisión y acciones de defensa:
 *    - ALLOW: Puntuación de amenaza < 40
 *    - CHALLENGE: 40 <= Puntuación < 85 (penalización de rate limit / Cloudflare Turnstile)
 *    - BLOCK: Puntuación >= 85 o firmas de bots maliciosos / trampas honeypot
 * 4. Trampas honeypot de decepción pasiva:
 *    - Detección de sondas (/api/honeypot/*, /api/admin/debug, /.env, /.aws/credentials, etc.)
 *    - Baneo automático inmediato de la IP atacante y generación de señuelos sintéticos creíbles.
 * 5. Telemetría y auditoría de seguridad persistente:
 *    - Registro histórico de eventos y contadores de rendimiento con rotación automática.
 * 6. Resiliencia al 100%:
 *    - Timeouts estrictos en llamadas externas (<=1.5s).
 *    - Fallback elegante a reputación local heurística si la red o las APIs externas fallan.
 */

if (!defined('THREAT_CACHE_TTL')) {
    define('THREAT_CACHE_TTL', 3600);
}

if (!function_exists('securityClientIp')) {
    require_once __DIR__ . '/security.php';
}
if (!function_exists('secretGet')) {
    require_once __DIR__ . '/secrets.php';
}
if (!function_exists('l8CacheGet')) {
    require_once __DIR__ . '/cache.php';
}

/**
 * Directorio raíz para almacenamiento de caché de amenazas.
 */
function threatIntelCacheDir(): string {
    $dir = __DIR__ . '/data_storage/security/threat_cache';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir;
}

/**
 * Partición de disco de 2 niveles para caché de amenazas (data_storage/security/threat_cache/ab/cd/...).
 */
function threatIntelShardPath(string $ip): string {
    $hash = hash('sha256', 'threat_ip_' . trim($ip));
    $d1 = substr($hash, 0, 2);
    $d2 = substr($hash, 2, 2);
    $dir = threatIntelCacheDir() . '/' . $d1 . '/' . $d2;
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir . '/ip_' . substr($hash, 4, 28) . '.json';
}

/**
 * Directorio de telemetría de amenazas.
 */
function threatIntelTelemetryDir(): string {
    $dir = __DIR__ . '/data_storage/security/telemetry';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir;
}

/**
 * Ruta del archivo de registro de telemetría de amenazas.
 */
function threatIntelTelemetryPath(): string {
    return threatIntelTelemetryDir() . '/threat_events.json';
}

/**
 * Ruta del archivo de estadísticas agregadas.
 */
function threatIntelStatsPath(): string {
    return threatIntelTelemetryDir() . '/threat_stats.json';
}

/**
 * Determina si una IP es privada, de bucle local, enlace local o de documentación (RFC 1918 / RFC 5737 / RFC 4193).
 */
function threatIntelIsPrivateIp(string $ip): bool {
    $ip = trim($ip);
    if ($ip === '' || $ip === '127.0.0.1' || $ip === '::1' || $ip === 'localhost') {
        return true;
    }

    // Comprobación de rangos privados estándar con filtros de PHP
    if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
        return true;
    }

    // Rangos adicionales específicos (CGNAT, Carrier-grade NAT 100.64.0.0/10)
    static $specialCidrs = [
        '100.64.0.0/10',
        '169.254.0.0/16',
        '192.0.2.0/24',
        '198.51.100.0/24',
        '203.0.113.0/24',
        '240.0.0.0/4'
    ];

    foreach ($specialCidrs as $cidr) {
        if (function_exists('securityIpInCidr') && securityIpInCidr($ip, $cidr)) {
            return true;
        }
    }

    return false;
}

/**
 * Ejecuta una petición HTTP GET rápida y resistente con timeouts estrictos (<=1.5s).
 */
function threatIntelHttpRequest(string $url, array $headers = [], int $timeoutMs = 1500): ?array {
    $timeoutSec = max(1, (int)ceil($timeoutMs / 1000));

    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT_MS, min(1000, $timeoutMs));
        curl_setopt($ch, CURLOPT_TIMEOUT_MS, $timeoutMs);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Hashcod-Security-ThreatIntel/2026.1 (DefenseEngine; +https://hashcod.com)');
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false || $httpCode < 200 || $httpCode >= 400) {
            return null;
        }

        $decoded = json_decode((string)$response, true);
        return is_array($decoded) ? $decoded : null;
    }

    // Fallback con stream context si cURL no estuviera disponible
    $ctx = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => implode("\r\n", array_merge($headers, [
                'User-Agent: Hashcod-Security-ThreatIntel/2026.1 (DefenseEngine)'
            ])),
            'timeout' => $timeoutSec,
            'ignore_errors' => true
        ]
    ]);

    $raw = @file_get_contents($url, false, $ctx);
    if ($raw === false) {
        return null;
    }

    $decoded = json_decode((string)$raw, true);
    return is_array($decoded) ? $decoded : null;
}

/**
 * Consulta la reputación de la IP en AbuseIPDB v2.
 */
function threatIntelQueryAbuseIpdb(string $ip): ?array {
    $apiKey = function_exists('secretGet')
        ? secretGet('ABUSEIPDB_API_KEY', '')
        : (getenv('ABUSEIPDB_API_KEY') ?: '');

    if (empty($apiKey)) {
        return null;
    }

    $url = 'https://api.abuseipdb.com/api/v2/check?ipAddress=' . urlencode($ip) . '&maxAgeInDays=90&verbose=true';
    $headers = [
        'Key: ' . trim($apiKey),
        'Accept: application/json'
    ];

    $res = threatIntelHttpRequest($url, $headers, 1500);
    if (!$res || !isset($res['data'])) {
        return null;
    }

    $data = $res['data'];
    $score = isset($data['abuseConfidenceScore']) ? (int)$data['abuseConfidenceScore'] : 0;
    $totalReports = isset($data['totalReports']) ? (int)$data['totalReports'] : 0;
    $isTor = !empty($data['isTor']);
    $isWhitelisted = !empty($data['isWhitelisted']);

    return [
        'provider' => 'abuseipdb',
        'score' => $score,
        'reports' => $totalReports,
        'is_tor' => $isTor,
        'is_whitelisted' => $isWhitelisted,
        'country_code' => $data['countryCode'] ?? 'XX',
        'usage_type' => $data['usageType'] ?? 'Unknown',
        'isp' => $data['isp'] ?? 'Unknown',
        'last_reported_at' => $data['lastReportedAt'] ?? null
    ];
}

/**
 * Consulta la reputación de la IP en IPQualityScore (IPQS).
 */
function threatIntelQueryIpQualityScore(string $ip): ?array {
    $apiKey = function_exists('secretGet')
        ? secretGet('IPQS_API_KEY', '')
        : (getenv('IPQS_API_KEY') ?: '');

    if (empty($apiKey)) {
        return null;
    }

    $url = 'https://ipqualityscore.com/api/json/ip/' . urlencode($apiKey) . '/' . urlencode($ip) . '?strictness=1&allow_public_access_points=true';
    $headers = [
        'Accept: application/json'
    ];

    $res = threatIntelHttpRequest($url, $headers, 1500);
    if (!$res || empty($res['success'])) {
        return null;
    }

    $score = isset($res['fraud_score']) ? (int)$res['fraud_score'] : 0;
    $isProxy = !empty($res['proxy']);
    $isVpn = !empty($res['vpn']);
    $isTor = !empty($res['tor']);
    $isBot = !empty($res['bot_status']) || !empty($res['is_crawler']);
    $recentAbuse = !empty($res['recent_abuse']);

    // Si IPQS marca proxy activo, tor o bot, ajustar puntuación mínima
    if ($isTor) $score = max($score, 90);
    if ($isBot) $score = max($score, 85);
    if ($recentAbuse) $score = max($score, 75);

    return [
        'provider' => 'ipqualityscore',
        'score' => $score,
        'proxy' => $isProxy,
        'vpn' => $isVpn,
        'tor' => $isTor,
        'bot' => $isBot,
        'recent_abuse' => $recentAbuse,
        'country_code' => $res['country_code'] ?? 'XX',
        'isp' => $res['ISP'] ?? 'Unknown'
    ];
}

/**
 * Consulta la reputación de la IP en StopForumSpam (pública, sin clave forzosa).
 */
function threatIntelQueryStopForumSpam(string $ip): ?array {
    $url = 'https://api.stopforumspam.org/api?ip=' . urlencode($ip) . '&json';
    $headers = [
        'Accept: application/json'
    ];

    $res = threatIntelHttpRequest($url, $headers, 1500);
    if (!$res || empty($res['success']) || !isset($res['ip'])) {
        return null;
    }

    $ipData = $res['ip'];
    $appears = !empty($ipData['appears']);
    $frequency = isset($ipData['frequency']) ? (int)$ipData['frequency'] : 0;
    $confidence = isset($ipData['confidence']) ? (float)$ipData['confidence'] : 0.0;

    $score = 0;
    if ($appears) {
        if ($confidence > 0) {
            $score = (int)round($confidence);
        } else {
            $score = min(95, 45 + ($frequency * 10));
        }
    }

    return [
        'provider' => 'stopforumspam',
        'score' => $score,
        'appears' => $appears,
        'frequency' => $frequency,
        'confidence' => $confidence,
        'country' => $ipData['country'] ?? 'XX'
    ];
}

/**
 * Motor de reputación y análisis heurístico local cuando las APIs externas no están disponibles.
 * Inspecciona firmas de User-Agent, cabeceras maliciosas, intentos de inyección y patrones de sondeo.
 */
function threatIntelLocalHeuristicScore(string $ip, ?string $ua = null): array {
    $score = 0;
    $flags = [];

    // 1. IP privada o local -> score 0 absoluto
    if (threatIntelIsPrivateIp($ip)) {
        return [
            'score' => 0,
            'source' => 'local_whitelist',
            'flags' => ['private_or_loopback_ip'],
            'status' => 'ALLOW'
        ];
    }

    // 2. Comprobar si la IP ya tiene un ban activo en el subsistema de seguridad
    if (function_exists('securityIpIsBanned') && securityIpIsBanned($ip)) {
        return [
            'score' => 100,
            'source' => 'local_banlist',
            'flags' => ['active_security_ban'],
            'status' => 'BLOCK'
        ];
    }

    // 3. Inspección de User-Agent malicioso
    $ua = $ua !== null ? $ua : ($_SERVER['HTTP_USER_AGENT'] ?? '');
    if ($ua !== '') {
        if (function_exists('securityIsScannerUa') && securityIsScannerUa($ua)) {
            $score = max($score, 90);
            $flags[] = 'malicious_scanner_ua';
        }

        $uaLower = strtolower($ua);
        $threatKeywords = [
            'dirbuster', 'nikto', 'sqlmap', 'nmap', 'masscan', 'gobuster',
            'wpscan', 'nuclei', 'acunetix', 'havij', 'hydra', 'metasploit',
            'nessus', 'zgrab', 'censys', 'shodan', 'zoomeye', 'leakix'
        ];
        foreach ($threatKeywords as $kw) {
            if (strpos($uaLower, $kw) !== false) {
                $score = max($score, 95);
                $flags[] = 'known_exploit_tool:' . $kw;
                break;
            }
        }
    } else {
        // Peticiones sin User-Agent en endpoints no locales reciben penalización leve
        $score += 15;
        $flags[] = 'empty_user_agent';
    }

    // 4. Inspección de cabeceras sospechosas y payloads de inyección
    $headersToInspect = [
        $_SERVER['HTTP_USER_AGENT'] ?? '',
        $_SERVER['HTTP_REFERER'] ?? '',
        $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '',
        $_SERVER['REQUEST_URI'] ?? ''
    ];

    foreach ($headersToInspect as $hdr) {
        if (!is_string($hdr) || $hdr === '') continue;

        // Log4Shell / JNDI injection
        if (stripos($hdr, '${jndi:') !== false || stripos($hdr, '${lower:') !== false) {
            $score = 100;
            $flags[] = 'exploit_jndi_log4j';
            break;
        }

        // Shellshock CVE-2014-6271
        if (strpos($hdr, '() { :; };') !== false) {
            $score = 100;
            $flags[] = 'exploit_shellshock';
            break;
        }

        // PHP Wrapper injection
        if (preg_match('#php://(input|filter|memory)#i', $hdr)) {
            $score = max($score, 90);
            $flags[] = 'php_stream_injection';
        }

        // Path traversal
        if (strpos($hdr, '../..') !== false || strpos($hdr, '..\\..') !== false) {
            $score = max($score, 85);
            $flags[] = 'path_traversal_signature';
        }
    }

    $status = 'ALLOW';
    if ($score >= 85) {
        $status = 'BLOCK';
    } elseif ($score >= 40) {
        $status = 'CHALLENGE';
    }

    return [
        'score' => min(100, $score),
        'source' => 'local_heuristic',
        'flags' => $flags,
        'status' => $status
    ];
}

/**
 * Consulta la reputación de la IP en la caché local (L1 APCu/Memoria + L2 Disco Sharded).
 */
function threatIntelGetCachedReputation(string $ip): ?array {
    $memKey = 'threat_rep:' . trim($ip);

    // 1. Memoria rápida / APCu
    if (function_exists('l8CacheGet')) {
        $cached = l8CacheGet($memKey);
        if (is_array($cached) && isset($cached['score'], $cached['status'])) {
            $cached['cached'] = true;
            return $cached;
        }
    }

    // 2. Disco Sharded en data_storage/security/threat_cache/
    $path = threatIntelShardPath($ip);
    if (is_readable($path)) {
        $raw = @file_get_contents($path);
        if ($raw !== false && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded) && isset($decoded['expires_at']) && (int)$decoded['expires_at'] > time()) {
                $decoded['cached'] = true;
                if (function_exists('l8CacheSet')) {
                    $ttl = (int)$decoded['expires_at'] - time();
                    l8CacheSet($memKey, $decoded, max(60, $ttl));
                }
                return $decoded;
            } elseif (is_array($decoded) && isset($decoded['expires_at']) && (int)$decoded['expires_at'] <= time()) {
                @unlink($path);
            }
        }
    }

    return null;
}

/**
 * Guarda el resultado de reputación en caché (L1 APCu + L2 Disco Sharded).
 */
function threatIntelSetCachedReputation(string $ip, array $data, int $ttl = THREAT_CACHE_TTL): bool {
    $now = time();
    $data['cached_at'] = $now;
    $data['expires_at'] = $now + $ttl;
    $data['cached'] = false; // El payload almacenado

    $memKey = 'threat_rep:' . trim($ip);
    if (function_exists('l8CacheSet')) {
        l8CacheSet($memKey, $data, $ttl);
    }

    $shardPath = threatIntelShardPath($ip);
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
        return false;
    }

    $tmp = $shardPath . '.' . bin2hex(random_bytes(6)) . '.tmp';
    if (@file_put_contents($tmp, $json) !== false) {
        @rename($tmp, $shardPath);
        @chmod($shardPath, 0600);
        return true;
    }

    return false;
}

/**
 * Función Principal del Contrato de Interfaz:
 * Comprueba la reputación de una dirección IP evaluando proveedores de Threat Intelligence,
 * caché multinivel y análisis heurístico de resiliencia total.
 *
 * @param string $ip Dirección IP a evaluar (v4 o v6).
 * @param bool $bypassCache Si se debe forzar una re-consulta omitiendo la caché.
 * @return array{status: string, score: int, source: string, cached: bool, details: array}
 */
function threatIntelCheckIp(string $ip, bool $bypassCache = false): array {
    $ip = trim((string)$ip);
    if ($ip === '') {
        $ip = function_exists('securityClientIp') ? securityClientIp() : '127.0.0.1';
    }

    // 1. Caso Inmediato: IP Local / Privada / Whitelist
    if (threatIntelIsPrivateIp($ip)) {
        return [
            'status' => 'ALLOW',
            'score' => 0,
            'source' => 'local_whitelist',
            'cached' => false,
            'ip' => $ip,
            'details' => [
                'type' => 'private_or_loopback',
                'description' => 'Local or private RFC1918/RFC4193 range'
            ]
        ];
    }

    // 2. Comprobación de Caché L1/L2
    if (!$bypassCache) {
        $cached = threatIntelGetCachedReputation($ip);
        if ($cached !== null) {
            $cached['cached'] = true;
            return $cached;
        }
    }

    // 3. Análisis heurístico local previo (detección rápida de scanners o exploits en vuelo)
    $heuristic = threatIntelLocalHeuristicScore($ip);
    if ($heuristic['score'] >= 85) {
        $result = [
            'status' => 'BLOCK',
            'score' => $heuristic['score'],
            'source' => $heuristic['source'],
            'cached' => false,
            'ip' => $ip,
            'details' => [
                'heuristic_flags' => $heuristic['flags'],
                'reason' => 'Severe threat detected by local heuristics'
            ]
        ];
        threatIntelSetCachedReputation($ip, $result, 3600);
        threatIntelRecordTelemetry([
            'event' => 'THREAT_BLOCK_HEURISTIC',
            'ip' => $ip,
            'score' => $heuristic['score'],
            'status' => 'BLOCK',
            'source' => $heuristic['source']
        ]);
        return $result;
    }

    // 4. Consulta a proveedores de Threat Intel externos
    $providerScores = [];
    $providerDetails = [];
    $primarySource = 'local_heuristic';

    // A. AbuseIPDB v2
    $abuseData = threatIntelQueryAbuseIpdb($ip);
    if ($abuseData !== null) {
        $providerScores[] = $abuseData['score'];
        $providerDetails['abuseipdb'] = $abuseData;
        $primarySource = 'abuseipdb';
    }

    // B. IPQualityScore
    $ipqsData = threatIntelQueryIpQualityScore($ip);
    if ($ipqsData !== null) {
        $providerScores[] = $ipqsData['score'];
        $providerDetails['ipqualityscore'] = $ipqsData;
        if ($primarySource === 'local_heuristic') $primarySource = 'ipqualityscore';
    }

    // C. StopForumSpam
    $sfsData = threatIntelQueryStopForumSpam($ip);
    if ($sfsData !== null) {
        $providerScores[] = $sfsData['score'];
        $providerDetails['stopforumspam'] = $sfsData;
        if ($primarySource === 'local_heuristic') $primarySource = 'stopforumspam';
    }

    // 5. Agregación y Normalización del Threat Score (0 a 100)
    if (!empty($providerScores)) {
        // Tomar el puntaje más severo entre los proveedores consultados
        $aggregatedScore = max($providerScores);
        // Si hay heurística local con score mayor, elevar
        $aggregatedScore = max($aggregatedScore, $heuristic['score']);
    } else {
        // Fallback elegante a la heurística local si ninguna API externa respondió
        $aggregatedScore = $heuristic['score'];
        $primarySource = 'local_heuristic';
    }

    $aggregatedScore = max(0, min(100, (int)$aggregatedScore));

    // 6. Asignación de acción de defensa
    $status = 'ALLOW';
    if ($aggregatedScore >= 85) {
        $status = 'BLOCK';
    } elseif ($aggregatedScore >= 40) {
        $status = 'CHALLENGE';
    }

    $result = [
        'status' => $status,
        'score' => $aggregatedScore,
        'source' => $primarySource,
        'cached' => false,
        'ip' => $ip,
        'details' => [
            'providers' => $providerDetails,
            'heuristic_score' => $heuristic['score'],
            'heuristic_flags' => $heuristic['flags'] ?? [],
            'evaluated_at' => date('c')
        ]
    ];

    // 7. Guardar en caché y registrar telemetría
    threatIntelSetCachedReputation($ip, $result, THREAT_CACHE_TTL);
    threatIntelRecordTelemetry([
        'event' => 'IP_REPUTATION_CHECK',
        'ip' => $ip,
        'score' => $aggregatedScore,
        'status' => $status,
        'source' => $primarySource
    ]);

    return $result;
}

/**
 * Comprueba si una URI corresponde a una ruta de trampa honeypot de decepción.
 */
function threatIntelIsHoneypot(string $uri): bool {
    $uri = '/' . ltrim((string)$uri, '/');
    $uriLower = strtolower($uri);

    $exactHoneypots = [
        '/api/honeypot/actuator',
        '/api/honeypot/debug',
        '/api/honeypot/eval',
        '/api/honeypot/phpinfo',
        '/api/honeypot/credentials',
        '/api/admin/debug',
        '/api/admin/config.json',
        '/api/admin/dump',
        '/api/admin/database.sql',
        '/.env',
        '/.env.local',
        '/.env.production',
        '/.env.stage',
        '/.aws/credentials',
        '/.aws/config',
        '/.git/config',
        '/.git/head',
        '/wp-admin/install.php',
        '/phpmyadmin/index.php',
        '/administrator/index.php',
        '/actuator/env',
        '/actuator/health'
    ];

    if (in_array($uriLower, $exactHoneypots, true)) {
        return true;
    }

    $honeypotPrefixes = [
        '/api/honeypot/',
        '/api/admin/debug/'
    ];

    foreach ($honeypotPrefixes as $p) {
        if (strpos($uriLower, $p) === 0) {
            return true;
        }
    }

    return false;
}

/**
 * Función Principal del Contrato de Interfaz:
 * Dispara la trampa honeypot cuando un atacante o escáner intenta acceder a una ruta de decepción.
 * Registra el incidente, aplica un baneo inmediato de 24 horas y actualiza el caché de amenazas a BLOCK (100).
 */
function threatIntelHoneypotTrigger(string $uri, string $ip): void {
    $ip = trim((string)$ip);
    if ($ip === '') {
        $ip = function_exists('securityClientIp') ? securityClientIp() : '127.0.0.1';
    }

    $uri = '/' . ltrim((string)$uri, '/');
    $now = time();

    // 1. Registrar IP en lista persistente de honeypot bans
    $honeypotsPath = threatIntelTelemetryDir() . '/honeypot_bans.json';
    $bans = [];
    if (is_readable($honeypotsPath)) {
        $raw = @file_get_contents($honeypotsPath);
        $bans = json_decode((string)$raw, true) ?: [];
    }

    $bans[$ip] = [
        'ip' => $ip,
        'trap_uri' => $uri,
        'banned_at' => date('c'),
        'ban_expires' => $now + 86400, // 24 horas
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
    ];

    @file_put_contents($honeypotsPath, json_encode($bans, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

    // 2. Aplicar ban nativo en el subsistema de seguridad
    if (function_exists('securityIpBan')) {
        securityIpBan(86400, 'honeypot_trap:' . substr($uri, 0, 40), $ip);
    }

    // 3. Forzar reputación en caché local a BLOCK (score 100)
    $threatRecord = [
        'status' => 'BLOCK',
        'score' => 100,
        'source' => 'honeypot_trap',
        'cached' => false,
        'ip' => $ip,
        'details' => [
            'trap_uri' => $uri,
            'reason' => 'Offending IP touched deception honeypot trap'
        ]
    ];
    threatIntelSetCachedReputation($ip, $threatRecord, 86400);

    // 4. Registrar evento en telemetría
    threatIntelRecordTelemetry([
        'event' => 'HONEYPOT_TRAP_TRIGGERED',
        'ip' => $ip,
        'uri' => $uri,
        'score' => 100,
        'status' => 'BLOCK',
        'source' => 'honeypot_trap'
    ]);
}

/**
 * Sirve un señuelo sintético creíble (Decoy Response) cuando un atacante toca una ruta honeypot,
 * simulando datos de configuración o diagnósticos sin revelar la infraestructura real.
 */
function threatIntelServeHoneypotDecoy(string $uri, string $ip): void {
    $uriLower = strtolower('/' . ltrim((string)$uri, '/'));

    if (!headers_sent()) {
        header('Cache-Control: no-store, no-cache, must-revalidate');
        header('X-Content-Type-Options: nosniff');
    }

    // Señuelo .env
    if (strpos($uriLower, '.env') !== false) {
        http_response_code(200);
        header('Content-Type: text/plain; charset=utf-8');
        echo "# Hashcod Sandbox Environment Configuration (Canary Trap)\n";
        echo "APP_ENV=production\n";
        echo "APP_DEBUG=false\n";
        echo "APP_KEY=base64:" . base64_encode(random_bytes(32)) . "\n";
        echo "DB_CONNECTION=pgsql\n";
        echo "DB_HOST=127.0.0.1\n";
        echo "DB_PORT=5432\n";
        echo "DB_DATABASE=codespace_canary\n";
        echo "DB_USERNAME=canary_user\n";
        echo "DB_PASSWORD=canary_pass_" . substr(bin2hex(random_bytes(8)), 0, 16) . "\n";
        echo "AWS_ACCESS_KEY_ID=AKIA" . strtoupper(bin2hex(random_bytes(8))) . "\n";
        echo "AWS_SECRET_ACCESS_KEY=" . base64_encode(random_bytes(30)) . "\n";
        exit;
    }

    // Señuelo Actuator Spring Boot
    if (strpos($uriLower, 'actuator') !== false) {
        http_response_code(200);
        header('Content-Type: application/vnd.spring-boot.actuator.v3+json; charset=utf-8');
        echo json_encode([
            '_links' => [
                'self' => ['href' => '/actuator', 'templated' => false],
                'health' => ['href' => '/actuator/health', 'templated' => false],
                'info' => ['href' => '/actuator/info', 'templated' => false]
            ],
            'status' => 'UP',
            'components' => [
                'diskSpace' => ['status' => 'UP', 'details' => ['total' => 107374182400, 'free' => 53687091200]],
                'ping' => ['status' => 'UP']
            ]
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // Señuelo Admin Debug / Config
    if (strpos($uriLower, '/api/admin') === 0 || strpos($uriLower, '/api/honeypot') === 0) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok' => false,
            'error' => 'Access Denied - Diagnostic honeypot triggered',
            'code' => 'honeypot_interception',
            'ip' => $ip,
            'timestamp' => date('c')
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Señuelo por defecto
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not Found';
    exit;
}

/**
 * Función Principal del Contrato de Interfaz:
 * Registra un evento de seguridad / reputación en el archivo de telemetría y actualiza los contadores agregados.
 */
function threatIntelRecordTelemetry(array $event): void {
    $now = time();
    $isoDate = date('c');

    $eventRecord = array_merge([
        'id' => bin2hex(random_bytes(8)),
        'timestamp' => $isoDate,
        'unix_time' => $now,
        'ip' => $event['ip'] ?? '127.0.0.1',
        'event' => $event['event'] ?? 'SECURITY_EVENT',
        'status' => $event['status'] ?? 'ALLOW',
        'score' => isset($event['score']) ? (int)$event['score'] : 0,
        'source' => $event['source'] ?? 'unknown',
        'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown', 0, 180),
        'request_uri' => substr($_SERVER['REQUEST_URI'] ?? '/', 0, 200)
    ], $event);

    // 1. Guardar en histórico circular de eventos (últimos 500)
    $telemetryPath = threatIntelTelemetryPath();
    $events = [];
    if (is_readable($telemetryPath)) {
        $raw = @file_get_contents($telemetryPath);
        $events = json_decode((string)$raw, true) ?: [];
    }

    $events[] = $eventRecord;
    if (count($events) > 500) {
        $events = array_slice($events, -500);
    }
    @file_put_contents($telemetryPath, json_encode($events, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);

    // 2. Actualizar estadísticas agregadas
    $statsPath = threatIntelStatsPath();
    $stats = [
        'total_checks' => 0,
        'allowed' => 0,
        'challenged' => 0,
        'blocked' => 0,
        'honeypot_hits' => 0,
        'cache_hits' => 0,
        'cache_misses' => 0,
        'updated_at' => $isoDate
    ];

    if (is_readable($statsPath)) {
        $rawStats = @file_get_contents($statsPath);
        $decodedStats = json_decode((string)$rawStats, true);
        if (is_array($decodedStats)) {
            $stats = array_merge($stats, $decodedStats);
        }
    }

    $stats['total_checks']++;
    $statusKey = strtolower((string)($event['status'] ?? 'allow'));
    if ($statusKey === 'allow') $stats['allowed']++;
    elseif ($statusKey === 'challenge') $stats['challenged']++;
    elseif ($statusKey === 'block') $stats['blocked']++;

    if (($event['event'] ?? '') === 'HONEYPOT_TRAP_TRIGGERED') {
        $stats['honeypot_hits']++;
    }

    if (!empty($event['cached'])) {
        $stats['cache_hits']++;
    } else {
        $stats['cache_misses']++;
    }

    $stats['updated_at'] = $isoDate;
    @file_put_contents($statsPath, json_encode($stats, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

/**
 * Función Principal del Contrato de Interfaz:
 * Retorna las métricas y telemetría completa de inteligencia de amenazas para el monitor UI y auditorías.
 */
function threatIntelGetTelemetry(): array {
    $statsPath = threatIntelStatsPath();
    $stats = [
        'total_checks' => 0,
        'allowed' => 0,
        'challenged' => 0,
        'blocked' => 0,
        'honeypot_hits' => 0,
        'cache_hits' => 0,
        'cache_misses' => 0,
        'cache_hit_ratio' => 1.0,
        'uptime_percent' => 100.0,
        'updated_at' => date('c')
    ];

    if (is_readable($statsPath)) {
        $raw = @file_get_contents($statsPath);
        $decoded = json_decode((string)$raw, true);
        if (is_array($decoded)) {
            $stats = array_merge($stats, $decoded);
            $totalLookups = $stats['cache_hits'] + $stats['cache_misses'];
            $stats['cache_hit_ratio'] = $totalLookups > 0 ? round($stats['cache_hits'] / $totalLookups, 3) : 1.0;
        }
    }

    // Leer últimos 50 eventos
    $telemetryPath = threatIntelTelemetryPath();
    $recentEvents = [];
    if (is_readable($telemetryPath)) {
        $raw = @file_get_contents($telemetryPath);
        $allEvents = json_decode((string)$raw, true) ?: [];
        $recentEvents = array_slice(array_reverse($allEvents), 0, 50);
    }

    // Top amenazas detectadas
    $honeypotsPath = threatIntelTelemetryDir() . '/honeypot_bans.json';
    $honeypotBans = [];
    if (is_readable($honeypotsPath)) {
        $raw = @file_get_contents($honeypotsPath);
        $honeypotBans = json_decode((string)$raw, true) ?: [];
    }

    $abuseKeyConfigured = !empty(getenv('ABUSEIPDB_API_KEY')) || (!empty(function_exists('secretGet') ? secretGet('ABUSEIPDB_API_KEY', '') : ''));
    $ipqsKeyConfigured = !empty(getenv('IPQS_API_KEY')) || (!empty(function_exists('secretGet') ? secretGet('IPQS_API_KEY', '') : ''));

    return [
        'ok' => true,
        'service' => 'Hashcod Threat Intelligence & Bot Defense Subsystem',
        'version' => '2026.1',
        'status' => 'ONLINE',
        'stats' => $stats,
        'recent_events' => $recentEvents,
        'honeypot_active_bans' => array_values($honeypotBans),
        'providers' => [
            'abuseipdb' => [
                'name' => 'AbuseIPDB v2',
                'configured' => $abuseKeyConfigured,
                'status' => $abuseKeyConfigured ? 'ACTIVE' : 'STANDBY'
            ],
            'ipqualityscore' => [
                'name' => 'IPQualityScore (IPQS)',
                'configured' => $ipqsKeyConfigured,
                'status' => $ipqsKeyConfigured ? 'ACTIVE' : 'STANDBY'
            ],
            'stopforumspam' => [
                'name' => 'StopForumSpam API',
                'configured' => true,
                'status' => 'ACTIVE'
            ],
            'local_heuristics' => [
                'name' => 'Adaptive Heuristic Matcher',
                'configured' => true,
                'status' => 'ACTIVE'
            ]
        ],
        'defense_thresholds' => [
            'allow_max' => 39,
            'challenge_range' => '40 - 84',
            'block_min' => 85
        ],
        'timestamp' => date('c')
    ];
}

/**
 * Enrutador de endpoints REST específicos de Threat Intelligence para `api.php`.
 *
 * @param string $uri Ruta de la petición.
 * @return bool True si la petición fue manejada y finalizada.
 */
function threatIntelHandleApi(string $uri): bool {
    $uri = '/' . ltrim((string)$uri, '/');

    // 1. Honeypots interceptados en el espacio de nombres /api/honeypot/* o /api/admin/debug
    if (threatIntelIsHoneypot($uri)) {
        $ip = function_exists('securityClientIp') ? securityClientIp() : '127.0.0.1';
        threatIntelHoneypotTrigger($uri, $ip);
        threatIntelServeHoneypotDecoy($uri, $ip);
        return true;
    }

    // 2. Telemetría de Seguridad: GET /api/security/threat-telemetry
    if ($uri === '/api/security/threat-telemetry' || $uri === '/api/threat/telemetry') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(threatIntelGetTelemetry(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    // 3. Estado del Subetapa: GET /api/security/threat-intel
    if ($uri === '/api/security/threat-intel' || $uri === '/api/threat/status') {
        header('Content-Type: application/json; charset=utf-8');
        $telemetry = threatIntelGetTelemetry();
        echo json_encode([
            'ok' => true,
            'service' => 'Threat Intelligence & Bot Defense Subsystem',
            'version' => '2026.1',
            'defense_engine' => 'Multi-Tier Reputation + Honeypot Decoy',
            'providers' => $telemetry['providers'],
            'stats_summary' => [
                'total_evaluations' => $telemetry['stats']['total_checks'],
                'threats_blocked' => $telemetry['stats']['blocked'],
                'honeypot_interceptions' => $telemetry['stats']['honeypot_hits'],
                'cache_hit_ratio' => $telemetry['stats']['cache_hit_ratio']
            ],
            'timestamp' => date('c')
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    // 4. Comprobación Manual de Reputación de IP: POST /api/security/reputation-check
    if ($uri === '/api/security/reputation-check' || $uri === '/api/threat/check-ip') {
        header('Content-Type: application/json; charset=utf-8');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']);
            return true;
        }

        $raw = file_get_contents('php://input');
        $body = json_decode((string)$raw, true) ?: [];
        $targetIp = trim((string)($body['ip'] ?? ''));

        if ($targetIp === '') {
            $targetIp = function_exists('securityClientIp') ? securityClientIp() : '127.0.0.1';
        }

        $bypassCache = !empty($body['force_refresh']) || !empty($body['bypass_cache']);
        $rep = threatIntelCheckIp($targetIp, $bypassCache);

        echo json_encode([
            'ok' => true,
            'reputation' => $rep,
            'evaluated_at' => date('c')
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    return false;
}
