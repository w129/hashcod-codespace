<?php
/**
 * TipTap document editor — persistence for the Word-like sheet window.
 * Frontend: tiptap_editor/ (https://github.com/ueberdosis/tiptap)
 */

require_once __DIR__ . '/supabase.php';

function tiptapRootDir() {
    return __DIR__ . '/data_storage/tiptap';
}

function tiptapDocsDir() {
    return tiptapRootDir() . '/docs';
}

function tiptapEnsureDirs() {
    $dirs = [tiptapRootDir(), tiptapDocsDir()];
    foreach ($dirs as $d) {
        if (!is_dir($d)) {
            @mkdir($d, 0700, true);
        }
    }
}

function tiptapNormalizeId($id) {
    $id = strtolower(preg_replace('/[^a-z0-9_-]/i', '', (string) $id));
    if ($id === '') {
        $id = 'main';
    }
    return substr($id, 0, 64);
}

function tiptapDocPath($id) {
    return tiptapDocsDir() . '/' . tiptapNormalizeId($id) . '.json';
}

function tiptapDefaultDoc($id = 'main') {
    return [
        'id' => tiptapNormalizeId($id),
        'title' => 'Documento sin título',
        'html' => '<h1>Documento nuevo</h1><p>Escribe aquí con TipTap — formato de procesador de textos en hoja directa.</p>',
        'json' => null,
        'updated_at' => null,
        'engine' => 'tiptap',
        'source' => 'https://github.com/ueberdosis/tiptap',
    ];
}

function tiptapLoadDoc($id = 'main') {
    tiptapEnsureDirs();
    $id = tiptapNormalizeId($id);
    $path = tiptapDocPath($id);

    if (function_exists('supabaseLoadDocumentRecord')) {
        $remote = @supabaseLoadDocumentRecord($id, 'tiptap');
        if (!empty($remote['ok']) && is_array($remote['doc'])) {
            $rd = $remote['doc'];
            return [
                'ok' => true,
                'id' => $id,
                'title' => $rd['title'] ?? 'Documento sin título',
                'html' => $rd['content'] ?? ($rd['html'] ?? ''),
                'json' => $rd['meta']['json'] ?? null,
                'updated_at' => $rd['updated_at'] ?? null,
                'engine' => 'tiptap',
                'source' => 'https://github.com/ueberdosis/tiptap'
            ];
        }
    }

    if (!is_file($path)) {
        $doc = tiptapDefaultDoc($id);
        $doc['ok'] = true;
        return $doc;
    }
    $raw = (string) @file_get_contents($path);
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        $doc = tiptapDefaultDoc($id);
        $doc['ok'] = true;
        return $doc;
    }
    $data['ok'] = true;
    $data['id'] = $id;
    if (!isset($data['engine'])) {
        $data['engine'] = 'tiptap';
    }
    return $data;
}

function tiptapSaveDoc($payload) {
    if (!is_array($payload)) {
        return ['ok' => false, 'error' => 'Payload inválido'];
    }
    tiptapEnsureDirs();
    $id = tiptapNormalizeId($payload['id'] ?? 'main');
    $title = trim((string) ($payload['title'] ?? 'Documento sin título'));
    if ($title === '') {
        $title = 'Documento sin título';
    }
    if (strlen($title) > 120) {
        $title = substr($title, 0, 120);
    }
    $html = (string) ($payload['html'] ?? '');
    if (strlen($html) > 900000) {
        return ['ok' => false, 'error' => 'Documento demasiado grande'];
    }
    $json = $payload['json'] ?? null;
    $doc = [
        'id' => $id,
        'title' => $title,
        'html' => $html,
        'json' => $json,
        'updated_at' => gmdate('c'),
        'engine' => 'tiptap',
        'source' => 'https://github.com/ueberdosis/tiptap',
    ];
    $encoded = json_encode($doc, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($encoded === false || strlen($encoded) > 950000) {
        return ['ok' => false, 'error' => 'Documento demasiado grande'];
    }
    $ok = @file_put_contents(tiptapDocPath($id), $encoded) !== false;

    // Persistencia inmutable a Supabase DB + Storage
    if (function_exists('supabaseSaveDocumentRecord')) {
        @supabaseSaveDocumentRecord($id, $title, 'tiptap', $html, ['json' => $json]);
    }

    return [
        'ok' => $ok,
        'saved' => $ok,
        'id' => $id,
        'title' => $title,
        'updated_at' => $doc['updated_at'],
    ];
}

function tiptapStatusPayload() {
    tiptapEnsureDirs();
    $path = tiptapDocPath('main');
    return [
        'ok' => true,
        'engine' => 'tiptap',
        'source' => 'https://github.com/ueberdosis/tiptap',
        'platform_url' => '/tiptap',
        'has_doc' => is_file($path),
        'docs_path' => 'data_storage/tiptap/docs',
    ];
}
