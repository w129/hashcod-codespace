<?php
/**
 * LibreOffice suite en la plataforma servidor (MPL-2.0).
 * Despliega un workspace con Writer, Calc, Impress, Draw, Base, Math y Chart.
 * El clone del core es opcional (muy pesado); la suite funciona sin él.
 */

function libreofficeRootDir() {
    return __DIR__ . '/data_storage/libreoffice';
}

function libreofficeDocsDir() {
    return libreofficeRootDir() . '/docs';
}

function libreofficeRepoDir() {
    return __DIR__ . '/data_storage/repos/libreoffice-core';
}

function libreofficeCloneUrl() {
    return 'https://anongit.freedesktop.org/git/libreoffice/core.git';
}

function libreofficeMirrorUrl() {
    return 'https://github.com/LibreOffice/core.git';
}

function libreofficeIsCloned() {
    return is_dir(libreofficeRepoDir() . '/.git');
}

function libreofficeSuiteTools() {
    return [
        [
            'id' => 'writer',
            'name' => 'Writer',
            'label' => 'Documentos',
            'ext' => 'odt.html',
            'color' => '#2c5aa0',
            'desc' => 'Procesador de textos',
        ],
        [
            'id' => 'calc',
            'name' => 'Calc',
            'label' => 'Hojas de cálculo',
            'ext' => 'ods.json',
            'color' => '#007c3c',
            'desc' => 'Hojas de cálculo',
        ],
        [
            'id' => 'impress',
            'name' => 'Impress',
            'label' => 'Presentaciones',
            'ext' => 'odp.json',
            'color' => '#d2691e',
            'desc' => 'Presentaciones',
        ],
        [
            'id' => 'draw',
            'name' => 'Draw',
            'label' => 'Dibujos',
            'ext' => 'odg.json',
            'color' => '#c8102e',
            'desc' => 'Dibujo vectorial',
        ],
        [
            'id' => 'base',
            'name' => 'Base',
            'label' => 'Bases de datos',
            'ext' => 'odb.json',
            'color' => '#6b3fa0',
            'desc' => 'Bases de datos',
        ],
        [
            'id' => 'math',
            'name' => 'Math',
            'label' => 'Fórmulas',
            'ext' => 'odf.txt',
            'color' => '#008080',
            'desc' => 'Editor de fórmulas',
        ],
        [
            'id' => 'chart',
            'name' => 'Chart',
            'label' => 'Gráficos',
            'ext' => 'chart.json',
            'color' => '#1a6fb5',
            'desc' => 'Gráficos y diagramas',
        ],
    ];
}

function libreofficeEnsureDirs() {
    $root = libreofficeRootDir();
    $docs = libreofficeDocsDir();
    if (!is_dir($root)) {
        @mkdir($root, 0775, true);
    }
    if (!is_dir($docs)) {
        @mkdir($docs, 0775, true);
    }
    return is_dir($root) && is_dir($docs);
}

function libreofficeDefaultDoc($toolId) {
    switch ($toolId) {
        case 'writer':
            return [
                'title' => 'Documento Writer',
                'html' => '<h1>LibreOffice Writer</h1><p>Escribe aquí tu documento. Formato enriquecido en la plataforma servidor.</p>',
            ];
        case 'calc':
            return [
                'title' => 'Hoja Calc',
                'rows' => 12,
                'cols' => 8,
                'cells' => [
                    'A1' => 'Mes', 'B1' => 'Ingresos', 'C1' => 'Gastos',
                    'A2' => 'Enero', 'B2' => '1200', 'C2' => '800',
                    'A3' => 'Febrero', 'B3' => '1350', 'C3' => '920',
                ],
            ];
        case 'impress':
            return [
                'title' => 'Presentación Impress',
                'slides' => [
                    ['title' => 'LibreOffice Impress', 'body' => 'Presentación en la plataforma l8'],
                    ['title' => 'Diapositiva 2', 'body' => 'Edita el título y el contenido'],
                ],
            ];
        case 'draw':
            return [
                'title' => 'Dibujo Draw',
                'width' => 800,
                'height' => 500,
                'strokes' => [],
            ];
        case 'base':
            return [
                'title' => 'Base de datos',
                'fields' => ['id', 'nombre', 'nota'],
                'rows' => [
                    ['1', 'Registro A', 'Ejemplo'],
                    ['2', 'Registro B', 'Ejemplo'],
                ],
            ];
        case 'math':
            return [
                'title' => 'Fórmula Math',
                'formula' => 'E = m c^2',
            ];
        case 'chart':
            return [
                'title' => 'Gráfico Chart',
                'labels' => ['A', 'B', 'C', 'D'],
                'values' => [12, 19, 8, 15],
            ];
        default:
            return ['title' => $toolId, 'data' => null];
    }
}

function libreofficeDocPath($toolId) {
    $tools = libreofficeSuiteTools();
    $ext = 'json';
    foreach ($tools as $t) {
        if ($t['id'] === $toolId) {
            $ext = $t['ext'];
            break;
        }
    }
    return libreofficeDocsDir() . '/' . preg_replace('/[^a-z0-9_-]/i', '', $toolId) . '.' . $ext;
}

function libreofficeSeedDocs() {
    libreofficeEnsureDirs();
    if (libreofficeSuiteReady()) {
        // Ya desplegado: no reescribir (arranque <50ms).
        $all = true;
        foreach (libreofficeSuiteTools() as $tool) {
            if (!is_file(libreofficeDocPath($tool['id']))) { $all = false; break; }
        }
        if ($all) return [];
    }
    $seeded = [];
    foreach (libreofficeSuiteTools() as $tool) {
        $path = libreofficeDocPath($tool['id']);
        if (!is_file($path)) {
            $payload = libreofficeDefaultDoc($tool['id']);
            $payload['tool'] = $tool['id'];
            $payload['updated_at'] = gmdate('c');
            if (substr($path, -5) === '.html' || substr($path, -4) === '.txt') {
                if ($tool['id'] === 'writer') {
                    @file_put_contents($path, (string)($payload['html'] ?? ''));
                } else {
                    @file_put_contents($path, (string)($payload['formula'] ?? ''));
                }
            } else {
                @file_put_contents($path, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            }
            $seeded[] = $tool['id'];
        }
    }
    $marker = libreofficeRootDir() . '/suite.json';
    @file_put_contents($marker, json_encode([
        'ok' => true,
        'deployed_at' => gmdate('c'),
        'tools' => array_map(function ($t) { return $t['id']; }, libreofficeSuiteTools()),
        'license' => 'MPL-2.0',
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    return $seeded;
}

function libreofficeSuiteReady() {
    return is_file(libreofficeRootDir() . '/suite.json') && is_dir(libreofficeDocsDir());
}

require_once __DIR__ . '/supabase.php';

function libreofficeLoadDoc($toolId) {
    $toolId = strtolower(preg_replace('/[^a-z0-9_-]/i', '', (string)$toolId));
    $valid = false;
    foreach (libreofficeSuiteTools() as $t) {
        if ($t['id'] === $toolId) { $valid = true; break; }
    }
    if (!$valid) {
        return ['ok' => false, 'error' => 'Herramienta desconocida'];
    }

    if (function_exists('supabaseLoadDocumentRecord')) {
        $remote = @supabaseLoadDocumentRecord($toolId, 'libreoffice_' . $toolId);
        if (!empty($remote['ok']) && is_array($remote['doc'])) {
            $rd = $remote['doc'];
            if ($toolId === 'writer') {
                return ['ok' => true, 'tool' => 'writer', 'title' => $rd['title'] ?? 'Documento Writer', 'html' => $rd['content'] ?? ''];
            }
            if ($toolId === 'math') {
                return ['ok' => true, 'tool' => 'math', 'title' => $rd['title'] ?? 'Fórmula Math', 'formula' => $rd['content'] ?? 'E = m c^2'];
            }
            $meta = $rd['meta'] ?? [];
            $meta['ok'] = true;
            $meta['tool'] = $toolId;
            return $meta;
        }
    }

    libreofficeEnsureDirs();
    $path = libreofficeDocPath($toolId);
    if (!is_file($path)) {
        libreofficeSeedDocs();
    }
    if ($toolId === 'writer') {
        $html = is_file($path) ? (string)@file_get_contents($path) : '';
        return ['ok' => true, 'tool' => 'writer', 'title' => 'Documento Writer', 'html' => $html];
    }
    if ($toolId === 'math') {
        $formula = is_file($path) ? (string)@file_get_contents($path) : 'E = m c^2';
        return ['ok' => true, 'tool' => 'math', 'title' => 'Fórmula Math', 'formula' => $formula];
    }
    $raw = is_file($path) ? (string)@file_get_contents($path) : '';
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        $data = libreofficeDefaultDoc($toolId);
        $data['tool'] = $toolId;
    }
    $data['ok'] = true;
    $data['tool'] = $toolId;
    return $data;
}

function libreofficeSaveDoc($toolId, $payload) {
    $toolId = strtolower(preg_replace('/[^a-z0-9_-]/i', '', (string)$toolId));
    $valid = false;
    foreach (libreofficeSuiteTools() as $t) {
        if ($t['id'] === $toolId) { $valid = true; break; }
    }
    if (!$valid) {
        return ['ok' => false, 'error' => 'Herramienta desconocida'];
    }
    if (!is_array($payload)) {
        return ['ok' => false, 'error' => 'Payload inválido'];
    }
    libreofficeEnsureDirs();
    $path = libreofficeDocPath($toolId);
    $payload['tool'] = $toolId;
    $payload['updated_at'] = gmdate('c');

    $saveContent = '';
    if ($toolId === 'writer') {
        $html = (string)($payload['html'] ?? '');
        if (strlen($html) > 800000) {
            return ['ok' => false, 'error' => 'Documento demasiado grande'];
        }
        $ok = @file_put_contents($path, $html) !== false;
        $saveContent = $html;
    } else if ($toolId === 'math') {
        $formula = substr((string)($payload['formula'] ?? ''), 0, 20000);
        $ok = @file_put_contents($path, $formula) !== false;
        $saveContent = $formula;
    } else {
        $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if ($json === false || strlen($json) > 900000) {
            return ['ok' => false, 'error' => 'Documento demasiado grande'];
        }
        $ok = @file_put_contents($path, $json) !== false;
        $saveContent = $payload;
    }

    if (function_exists('supabaseSaveDocumentRecord')) {
        @supabaseSaveDocumentRecord($toolId, 'LibreOffice ' . ucfirst($toolId), 'libreoffice_' . $toolId, $saveContent, $payload);
    }

    return ['ok' => $ok, 'tool' => $toolId, 'saved' => $ok];
}

function libreofficeStatusPayload($detail = false) {
    $suiteReady = libreofficeSuiteReady();
    $tools = [];
    foreach (libreofficeSuiteTools() as $t) {
        $path = libreofficeDocPath($t['id']);
        $tools[] = array_merge($t, [
            'ready' => is_file($path) || $suiteReady,
            'has_doc' => is_file($path),
        ]);
    }
    $out = [
        'ok' => true,
        'suite_ready' => $suiteReady,
        'cloned' => false,
        'ready' => $suiteReady,
        'path' => 'data_storage/libreoffice',
        'docs_path' => 'data_storage/libreoffice/docs',
        'core_path' => 'data_storage/repos/libreoffice-core',
        'absolute_path' => libreofficeRootDir(),
        'branch' => null,
        'last_commit' => null,
        'files' => null,
        'bytes' => null,
        'license' => 'MPL-2.0',
        'remote_url' => libreofficeCloneUrl(),
        'mirror_url' => libreofficeMirrorUrl(),
        'platform_url' => '/libreoffice',
        'tools' => $tools,
        'fast' => true,
        'message' => $suiteReady
            ? 'Suite LibreOffice lista.'
            : 'Suite lista para desplegar (instantáneo).',
    ];
    // Detalle del core solo bajo demanda (find/du son lentos en repos grandes).
    if ($detail && libreofficeIsCloned()) {
        $dir = libreofficeRepoDir();
        $out['cloned'] = true;
        $out['branch'] = trim((string) @shell_exec('git -C ' . escapeshellarg($dir) . ' rev-parse --abbrev-ref HEAD 2>/dev/null')) ?: null;
        $out['last_commit'] = trim((string) @shell_exec('git -C ' . escapeshellarg($dir) . ' log -1 --pretty=format:"%h — %s (%cr)" 2>/dev/null')) ?: null;
    }
    return $out;
}

/**
 * Despliega la suite completa en <1s (solo dirs + docs seed).
 * No clona el core (eso tarda minutos); no exige cuenta.
 */
function libreofficeEnsure($opts = []) {
    $t0 = microtime(true);
    if (!libreofficeEnsureDirs()) {
        return [
            'ok' => false,
            'error' => 'No se pudo crear data_storage/libreoffice',
            'suite_ready' => false,
            'ms' => (int) round((microtime(true) - $t0) * 1000),
        ];
    }
    $seeded = libreofficeSeedDocs();
    $st = libreofficeStatusPayload(false);
    $st['ok'] = true;
    $st['suite_ready'] = true;
    $st['ready'] = true;
    $st['seeded'] = $seeded;
    $st['already'] = empty($seeded);
    $st['ms'] = (int) round((microtime(true) - $t0) * 1000);
    $st['message'] = $st['already']
        ? 'Suite ya estaba lista (' . $st['ms'] . ' ms).'
        : 'LibreOffice listo: Writer, Calc, Impress, Draw, Base, Math y Chart (' . $st['ms'] . ' ms).';
    // Nunca clonar core aquí — bloquea la UI. Solo si se pide explícitamente en otro endpoint.
    unset($opts);
    return $st;
}
