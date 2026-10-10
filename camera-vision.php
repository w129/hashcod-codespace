<?php
/**
 * Camera Vision — server side of the dock "Vision" tool.
 *
 * Frames come from the user's camera in the browser; object detection runs in
 * the Detectron2 service (services/detectron2-vision) so no model or secret
 * ever reaches browser JavaScript. Every route requires an account session
 * (securityRequireAccountSession is applied in api.php for /api/vision/).
 *
 *   GET    /api/vision/status   detector configured?
 *   POST   /api/vision/detect   {image: "data:image/jpeg;base64,..."} -> detections (+ log entry)
 *   GET    /api/vision/log      per-account log table
 *   DELETE /api/vision/log      clear the log
 *
 * Env: DETECTRON2_URL (detector base URL), DETECTRON2_TOKEN (shared bearer).
 */

const CAMERA_VISION_MAX_FRAME_BYTES = 1500000;
const CAMERA_VISION_MAX_LOG_ENTRIES = 1000;
const CAMERA_VISION_MAX_DETECTIONS = 50;
const CAMERA_VISION_LOG_REPEAT_SECONDS = 10;

function cameraVisionJson(array $payload, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
}

function cameraVisionDetectorUrl(): string {
    $url = trim((string)getenv('DETECTRON2_URL'));
    if ($url === '' || !preg_match('#^https?://#i', $url)) {
        return '';
    }
    return rtrim($url, '/');
}

/** Decodes a JPEG data URL; returns raw bytes or null when invalid/oversized. */
function cameraVisionDecodeFrame($image): ?string {
    if (!is_string($image) || strlen($image) > CAMERA_VISION_MAX_FRAME_BYTES * 1.4) {
        return null;
    }
    if (!preg_match('#^data:image/jpeg;base64,([A-Za-z0-9+/=]+)$#', $image, $m)) {
        return null;
    }
    $bytes = base64_decode($m[1], true);
    if ($bytes === false || $bytes === '' || strlen($bytes) > CAMERA_VISION_MAX_FRAME_BYTES) {
        return null;
    }
    return strncmp($bytes, "\xFF\xD8\xFF", 3) === 0 ? $bytes : null;
}

/** Validates the upstream response and keeps only bounded, typed fields. */
function cameraVisionNormalizeDetections($upstream): ?array {
    if (!is_array($upstream) || !isset($upstream['detections']) || !is_array($upstream['detections'])) {
        return null;
    }
    $width = (int)($upstream['width'] ?? 0);
    $height = (int)($upstream['height'] ?? 0);
    if ($width < 1 || $height < 1 || $width > 8192 || $height > 8192) {
        return null;
    }
    $out = [];
    foreach (array_slice($upstream['detections'], 0, CAMERA_VISION_MAX_DETECTIONS) as $d) {
        if (!is_array($d) || !isset($d['label'], $d['score'], $d['box']) || !is_array($d['box']) || count($d['box']) !== 4) {
            continue;
        }
        $box = array_map('floatval', array_values($d['box']));
        $out[] = [
            'label' => mb_substr(preg_replace('/[^\p{L}\p{N} _-]/u', '', (string)$d['label']), 0, 40),
            'score' => max(0.0, min(1.0, round((float)$d['score'], 3))),
            'box' => array_map(static fn($v) => round($v, 1), $box),
        ];
    }
    return ['width' => $width, 'height' => $height, 'detections' => $out];
}

/** Calls the Detectron2 service. Returns [ok, normalized|error-code]. */
function cameraVisionCallDetector(string $jpeg): array {
    $base = cameraVisionDetectorUrl();
    if ($base === '') {
        return [false, 'detector_not_configured'];
    }
    $headers = ['Content-Type: image/jpeg'];
    $token = trim((string)getenv('DETECTRON2_TOKEN'));
    if ($token !== '') {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    $ch = curl_init($base . '/detect');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $jpeg,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_FOLLOWLOCATION => false,
    ]);
    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if (!is_string($body) || $status !== 200) {
        return [false, 'detector_unavailable'];
    }
    $normalized = cameraVisionNormalizeDetections(json_decode($body, true));
    return $normalized === null ? [false, 'detector_bad_response'] : [true, $normalized];
}

function cameraVisionLogPath(string $accountId): string {
    $dir = __DIR__ . '/data_storage/camera_vision';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '', $accountId) . '.json';
}

function cameraVisionReadLog(string $path): array {
    $rows = is_file($path) ? json_decode((string)@file_get_contents($path), true) : [];
    return is_array($rows) ? $rows : [];
}

/**
 * Appends a log row only when the set of labels changed or the same scene has
 * been seen for CAMERA_VISION_LOG_REPEAT_SECONDS, so a 1 fps stream stays readable.
 */
function cameraVisionAppendLog(array $rows, array $detections, int $now): array {
    $counts = [];
    foreach ($detections as $d) {
        $counts[$d['label']] = ($counts[$d['label']] ?? 0) + 1;
    }
    ksort($counts);
    if (!$counts) {
        return $rows;
    }
    $last = $rows ? $rows[count($rows) - 1] : null;
    if ($last && ($last['counts'] ?? null) === $counts && $now - (int)($last['ts'] ?? 0) < CAMERA_VISION_LOG_REPEAT_SECONDS) {
        return $rows;
    }
    $best = [];
    foreach ($detections as $d) {
        $best[$d['label']] = max($best[$d['label']] ?? 0, $d['score']);
    }
    $rows[] = ['ts' => $now, 'counts' => $counts, 'best' => $best];
    return array_slice($rows, -CAMERA_VISION_MAX_LOG_ENTRIES);
}

function cameraVisionThrottled(string $accountId): bool {
    if (!function_exists('apcu_add')) {
        return false;
    }
    // shortcut: one detect per second per account via APCu, move to a shared limiter when scaling past one instance
    return !apcu_add('camvision:' . $accountId, 1, 1);
}

function cameraVisionHandleApi($uri): bool {
    $uri = (string)$uri;
    if ($uri !== '/api/vision' && strpos($uri, '/api/vision/') !== 0) {
        return false;
    }
    $sess = securityRequireAccountSession();
    $accountId = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($sess['account_id'] ?? $sess['user_id'] ?? ''));
    if ($accountId === '') {
        cameraVisionJson(['ok' => false, 'error' => 'Se requiere sesión de cuenta'], 401);
        return true;
    }
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($uri === '/api/vision/status' && $method === 'GET') {
        cameraVisionJson(['ok' => true, 'detector' => cameraVisionDetectorUrl() !== '']);
        return true;
    }

    if ($uri === '/api/vision/log' && $method === 'GET') {
        cameraVisionJson(['ok' => true, 'entries' => array_reverse(cameraVisionReadLog(cameraVisionLogPath($accountId)))]);
        return true;
    }

    if ($uri === '/api/vision/log' && $method === 'DELETE') {
        @unlink(cameraVisionLogPath($accountId));
        cameraVisionJson(['ok' => true]);
        return true;
    }

    if ($uri === '/api/vision/detect' && $method === 'POST') {
        $input = json_decode((string)file_get_contents('php://input'), true);
        $jpeg = cameraVisionDecodeFrame(is_array($input) ? ($input['image'] ?? null) : null);
        if ($jpeg === null) {
            cameraVisionJson(['ok' => false, 'error' => 'Fotograma no válido', 'code' => 'bad_frame'], 400);
            return true;
        }
        if (cameraVisionThrottled($accountId)) {
            cameraVisionJson(['ok' => false, 'error' => 'Demasiadas solicitudes', 'code' => 'rate_limited'], 429);
            return true;
        }
        [$ok, $result] = cameraVisionCallDetector($jpeg);
        if (!$ok) {
            $messages = [
                'detector_not_configured' => 'El detector no está configurado en este entorno.',
                'detector_unavailable' => 'El detector no responde. Inténtalo de nuevo.',
                'detector_bad_response' => 'El detector devolvió una respuesta no válida.',
            ];
            cameraVisionJson(['ok' => false, 'error' => $messages[$result] ?? 'Detector no disponible', 'code' => $result], 503);
            return true;
        }
        $path = cameraVisionLogPath($accountId);
        $fh = @fopen($path, 'c+');
        if ($fh && flock($fh, LOCK_EX)) {
            $rows = cameraVisionAppendLog(json_decode((string)stream_get_contents($fh), true) ?: [], $result['detections'], time());
            ftruncate($fh, 0);
            rewind($fh);
            fwrite($fh, json_encode($rows));
            fflush($fh);
            flock($fh, LOCK_UN);
        }
        if ($fh) {
            fclose($fh);
            @chmod($path, 0600);
        }
        cameraVisionJson(['ok' => true] + $result);
        return true;
    }

    cameraVisionJson(['ok' => false, 'error' => 'Ruta no encontrada'], 404);
    return true;
}
