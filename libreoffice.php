<?php
/**
 * LibreOffice core — estado / ensure clone en el servidor.
 * Código: data_storage/repos/libreoffice-core (MPL-2.0).
 */

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

function libreofficeStatusPayload() {
    $dir = libreofficeRepoDir();
    $cloned = libreofficeIsCloned();
    $branch = null;
    $commit = null;
    $files = null;
    $bytes = null;
    if ($cloned) {
        $branch = trim((string) @shell_exec('git -C ' . escapeshellarg($dir) . ' rev-parse --abbrev-ref HEAD 2>/dev/null'));
        $commit = trim((string) @shell_exec('git -C ' . escapeshellarg($dir) . ' log -1 --pretty=format:"%h — %s (%cr)" 2>/dev/null'));
        $countOut = trim((string) @shell_exec('find ' . escapeshellarg($dir) . ' -type f ! -path "*/.git/*" 2>/dev/null | wc -l'));
        $files = is_numeric($countOut) ? (int) $countOut : null;
        $sizeOut = trim((string) @shell_exec('du -sb ' . escapeshellarg($dir) . ' 2>/dev/null'));
        if (preg_match('/^(\d+)/', $sizeOut, $m)) {
            $bytes = (int) $m[1];
        }
    }
    $top = [];
    if ($cloned && is_dir($dir)) {
        $entries = @scandir($dir) ?: [];
        foreach ($entries as $e) {
            if ($e === '.' || $e === '..' || $e === '.git') continue;
            $top[] = $e;
            if (count($top) >= 40) break;
        }
        sort($top);
    }
    return [
        'ok' => true,
        'cloned' => $cloned,
        'path' => 'data_storage/repos/libreoffice-core',
        'absolute_path' => $dir,
        'branch' => $branch !== '' ? $branch : null,
        'last_commit' => $commit !== '' ? $commit : null,
        'files' => $files,
        'bytes' => $bytes,
        'license' => 'MPL-2.0',
        'remote_url' => libreofficeCloneUrl(),
        'mirror_url' => libreofficeMirrorUrl(),
        'platform_url' => '/libreoffice',
        'top_level' => $top,
        'ready' => $cloned,
    ];
}

/** Asegura el clone (usa cloneOrUpdateRepository si existe). */
function libreofficeEnsure() {
    if (libreofficeIsCloned()) {
        $st = libreofficeStatusPayload();
        $st['already'] = true;
        $st['message'] = 'LibreOffice core ya está en el servidor.';
        return $st;
    }
    if (!function_exists('cloneOrUpdateRepository')) {
        return [
            'ok' => false,
            'error' => 'cloneOrUpdateRepository no disponible',
            'cloned' => false,
        ];
    }
    $res = cloneOrUpdateRepository(libreofficeCloneUrl());
    $st = libreofficeStatusPayload();
    $st['ok'] = !empty($res['ok']) && !empty($st['cloned']);
    $st['ensure'] = $res;
    $st['message'] = !empty($st['ok'])
        ? 'LibreOffice core desplegado en el servidor.'
        : ($res['error'] ?? $res['raw_output'] ?? 'No se pudo clonar LibreOffice');
    if (empty($st['ok'])) {
        $st['error'] = $st['message'];
    }
    return $st;
}
