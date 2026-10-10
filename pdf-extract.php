<?php
/**
 * PDF data extraction (OpenDataLoader PDF, Apache-2.0).
 *
 *   GET  /api/pdf-extract/status   extractor available?
 *   POST /api/pdf-extract          multipart: file (PDF), formats (csv of json,markdown,html,text),
 *                                  sanitize (0|1), pages ("1,3,5-7", optional)
 *
 * The OpenDataLoader CLI jar runs on the server with a fixed argument list (no shell),
 * a heap cap and a wall-clock timeout. Access is the platform's Pro period, enforced by
 * router.php's platformPeriodGuard for every /api/ route. Nothing is stored: the upload and
 * the outputs live in a private temp directory removed before the response is sent.
 *
 * Env: OPENDATALOADER_JAR (default /opt/opendataloader/opendataloader-pdf-cli.jar), JAVA_BIN (default java).
 */

const PDF_EXTRACT_MAX_BYTES = 26214400;      // 25 MiB upload
const PDF_EXTRACT_MAX_OUTPUT_BYTES = 3145728; // 3 MiB per returned format
const PDF_EXTRACT_TIMEOUT_SECONDS = 60;
const PDF_EXTRACT_FORMATS = ['json' => 'json', 'markdown' => 'md', 'html' => 'html', 'text' => 'txt'];

function pdfExtractJson(array $payload, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
}

function pdfExtractJar(): string {
    $jar = trim((string)getenv('OPENDATALOADER_JAR'));
    return $jar !== '' ? $jar : '/opt/opendataloader/opendataloader-pdf-cli.jar';
}

function pdfExtractJava(): string {
    $java = trim((string)getenv('JAVA_BIN'));
    return $java !== '' ? $java : 'java';
}

function pdfExtractAvailable(): bool {
    if (!is_file(pdfExtractJar())) {
        return false;
    }
    $probe = @proc_open([pdfExtractJava(), '-version'], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
    if (!is_resource($probe)) {
        return false;
    }
    array_map('fclose', $pipes);
    return proc_close($probe) === 0;
}

/** Whitelists the requested formats; defaults to all of them. */
function pdfExtractParseFormats($raw): array {
    $wanted = array_filter(array_map('trim', explode(',', is_string($raw) ? strtolower($raw) : '')));
    $formats = array_values(array_intersect(array_keys(PDF_EXTRACT_FORMATS), $wanted));
    return $formats ?: array_keys(PDF_EXTRACT_FORMATS);
}

function pdfExtractParsePages($raw): string|false|null {
    $raw = is_string($raw) ? trim($raw) : '';
    if ($raw === '') {
        return null;
    }
    return preg_match('/^\d{1,5}(-\d{1,5})?(,\d{1,5}(-\d{1,5})?){0,19}$/', $raw) ? $raw : false;
}

function pdfExtractRemoveDir(string $dir): void {
    foreach (glob($dir . '/{,out/}*', GLOB_BRACE) ?: [] as $f) {
        if (is_file($f)) {
            @unlink($f);
        }
    }
    @rmdir($dir . '/out');
    @rmdir($dir);
}

/** Runs the CLI. Returns [true, outDir] or [false, error-code]. */
function pdfExtractRun(string $dir, array $formats, bool $sanitize, ?string $pages): array {
    $cmd = [pdfExtractJava(), '-Xmx512m', '-jar', pdfExtractJar(), '--format', implode(',', $formats),
            '--output-dir', $dir . '/out', '--image-output', 'off', '--quiet'];
    if ($sanitize) {
        $cmd[] = '--sanitize';
    }
    if ($pages !== null) {
        array_push($cmd, '--pages', $pages);
    }
    $cmd[] = $dir . '/input.pdf';
    $proc = @proc_open($cmd, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
    if (!is_resource($proc)) {
        return [false, 'extractor_unavailable'];
    }
    foreach ($pipes as $p) {
        stream_set_blocking($p, false);
    }
    $deadline = microtime(true) + PDF_EXTRACT_TIMEOUT_SECONDS;
    do {
        foreach ($pipes as $p) {
            stream_get_contents($p); // drain so the child never blocks on a full pipe
        }
        $status = proc_get_status($proc);
        if ($status['running']) {
            usleep(50000);
        }
    } while ($status['running'] && microtime(true) < $deadline);
    if ($status['running']) {
        proc_terminate($proc, 9);
        array_map('fclose', $pipes);
        proc_close($proc);
        return [false, 'extract_timeout'];
    }
    array_map('fclose', $pipes);
    $exit = proc_close($proc);
    // proc_close returns -1 once proc_get_status already reaped the child; use its recorded code.
    $exit = $status['exitcode'] >= 0 ? $status['exitcode'] : $exit;
    return $exit === 0 ? [true, $dir . '/out'] : [false, 'extract_failed'];
}

function pdfExtractCollect(string $outDir, array $formats): array {
    $files = [];
    foreach ($formats as $format) {
        $path = $outDir . '/input.' . PDF_EXTRACT_FORMATS[$format];
        if (!is_file($path)) {
            continue;
        }
        $size = (int)filesize($path);
        $content = (string)file_get_contents($path, false, null, 0, PDF_EXTRACT_MAX_OUTPUT_BYTES);
        $files[$format] = ['content' => $content, 'bytes' => $size, 'truncated' => $size > PDF_EXTRACT_MAX_OUTPUT_BYTES];
    }
    return $files;
}

function pdfExtractPageCount(array $files): ?int {
    if (empty($files['json']) || $files['json']['truncated']) {
        return null;
    }
    $doc = json_decode($files['json']['content'], true);
    return is_array($doc) && isset($doc['number of pages']) ? (int)$doc['number of pages'] : null;
}

function pdfExtractThrottled(): bool {
    if (!function_exists('apcu_add')) {
        return false;
    }
    $ip = function_exists('securityClientIp') ? (string)securityClientIp() : (string)($_SERVER['REMOTE_ADDR'] ?? '');
    // shortcut: one extraction per 3 s per client IP via APCu, move to a shared limiter beyond one instance
    return !apcu_add('pdfextract:' . hash('sha256', $ip), 1, 3);
}

function pdfExtractHandleUpload(): void {
    $upload = $_FILES['file'] ?? null;
    if (!is_array($upload) || ($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file((string)$upload['tmp_name'])) {
        pdfExtractJson(['ok' => false, 'error' => 'No se recibió el PDF.', 'code' => 'no_file'], 400);
        return;
    }
    $size = (int)$upload['size'];
    $head = (string)file_get_contents((string)$upload['tmp_name'], false, null, 0, 5);
    if ($size < 1 || $size > PDF_EXTRACT_MAX_BYTES || $head !== '%PDF-') {
        pdfExtractJson(['ok' => false, 'error' => 'El archivo debe ser un PDF de hasta 25 MB.', 'code' => 'bad_file'], 400);
        return;
    }
    $pages = pdfExtractParsePages($_POST['pages'] ?? '');
    if ($pages === false) {
        pdfExtractJson(['ok' => false, 'error' => 'Páginas no válidas. Ejemplo: 1,3,5-7', 'code' => 'bad_pages'], 400);
        return;
    }
    if (pdfExtractThrottled()) {
        pdfExtractJson(['ok' => false, 'error' => 'Espera unos segundos antes de analizar otro PDF.', 'code' => 'rate_limited'], 429);
        return;
    }
    if (!pdfExtractAvailable()) {
        pdfExtractJson(['ok' => false, 'error' => 'El extractor de PDF no está disponible en este entorno.', 'code' => 'extractor_unavailable'], 503);
        return;
    }

    $formats = pdfExtractParseFormats($_POST['formats'] ?? '');
    $dir = sys_get_temp_dir() . '/pdfx_' . bin2hex(random_bytes(8));
    if (!@mkdir($dir . '/out', 0700, true) || !@copy((string)$upload['tmp_name'], $dir . '/input.pdf')) {
        pdfExtractRemoveDir($dir);
        pdfExtractJson(['ok' => false, 'error' => 'No se pudo preparar el análisis.', 'code' => 'extract_failed'], 500);
        return;
    }
    try {
        [$ok, $result] = pdfExtractRun($dir, $formats, ($_POST['sanitize'] ?? '') === '1', $pages);
        $files = $ok ? pdfExtractCollect($result, $formats) : [];
    } finally {
        pdfExtractRemoveDir($dir);
    }
    if (!$ok || !$files) {
        $messages = ['extract_timeout' => 'El análisis tardó demasiado.', 'extractor_unavailable' => 'El extractor de PDF no está disponible en este entorno.'];
        $code = $ok ? 'extract_failed' : $result;
        pdfExtractJson(['ok' => false, 'error' => $messages[$code] ?? 'No se pudo analizar este PDF.', 'code' => $code], $code === 'extract_timeout' ? 504 : 422);
        return;
    }
    pdfExtractJson(['ok' => true, 'pages' => pdfExtractPageCount($files), 'files' => $files]);
}

function pdfExtractHandleApi($uri): bool {
    $uri = (string)$uri;
    if ($uri !== '/api/pdf-extract' && strpos($uri, '/api/pdf-extract/') !== 0) {
        return false;
    }
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($uri === '/api/pdf-extract/status' && $method === 'GET') {
        pdfExtractJson(['ok' => true, 'available' => pdfExtractAvailable()]);
    } elseif ($uri === '/api/pdf-extract' && $method === 'POST') {
        pdfExtractHandleUpload();
    } else {
        pdfExtractJson(['ok' => false, 'error' => 'Ruta no encontrada'], 404);
    }
    return true;
}
