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
        'translator' => 'https://github.com/oomol-lab/epub-translator',
        'translate_es_en' => true,
        'translate_no_openai' => true,
        'platform_url' => '/tiptap',
        'has_doc' => is_file($path),
        'docs_path' => 'data_storage/tiptap/docs',
    ];
}

/**
 * Spanish → English without OpenAI.
 * Workflow (paragraph / bilingual) inspired by oomol-lab/epub-translator.
 * @see https://github.com/oomol-lab/epub-translator
 */
function tiptapEpubTranslatorSystemPrompt() {
    $path = __DIR__ . '/tiptap_editor/epub_translator_prompt/translate.jinja';
    $raw = is_file($path) ? (string) @file_get_contents($path) : '';
    $userRules =
        "Source language is Spanish (es-ES / es-MX accepted). "
        . "Target language is English. "
        . "Produce a complete, accurate, natural English translation with 100% meaning fidelity. "
        . "Preserve paragraph breaks exactly. "
        . "Do not leave any Spanish untranslated unless it is a proper name that must stay.";
    if ($raw === '') {
        return "You are a translator. Translate the following text into English.\n\n"
            . "Translation rules:\n"
            . "- Translate completely; do not omit any part of the source text\n"
            . "- Maintain fidelity to the source; do not modify, add, or remove content\n"
            . "- Translate sentence by sentence, preserving paragraph structure\n"
            . "- Preserve all details; do not summarize or abbreviate\n"
            . "- Output plain text only\n\n"
            . "<rules>\n" . $userRules . "\n</rules>\n"
            . "Output only the translated text, nothing else.";
    }
    $out = str_replace('{{ target_language }}', 'English', $raw);
    $block =
        "User may provide additional requirements in <rules> tags before the source text. "
        . "Follow them, but prioritize the rules above if conflicts arise.\n\n"
        . "<rules>\n" . $userRules . "\n</rules>\n";
    $out = preg_replace(
        '/\{%-?\s*if user_prompt\s*-?%\}.*?\{%-?\s*endif\s*-?%\}/s',
        $block,
        $out
    );
    $out = str_replace('{{ user_prompt }}', $userRules, (string) $out);
    return trim((string) $out) . "\n";
}

function tiptapTranslateViaPython($text, $mode = 'replace') {
    $script = __DIR__ . '/tiptap_editor/translate_es_en.py';
    if (!is_file($script)) {
        return ['ok' => false, 'error' => 'translate_es_en.py missing'];
    }
    $payload = json_encode(['text' => $text, 'mode' => $mode], JSON_UNESCAPED_UNICODE);
    if ($payload === false) {
        return ['ok' => false, 'error' => 'JSON encode failed'];
    }
    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];
    $env = $_ENV;
    foreach (['LIBRETRANSLATE_URL', 'LIBRETRANSLATE_API_KEY', 'PATH', 'HOME', 'LANG', 'PYTHONPATH'] as $k) {
        $v = getenv($k);
        if ($v !== false && $v !== '') {
            $env[$k] = $v;
        }
    }
    // Ensure user-site packages (deep-translator) are visible
    $userSite = getenv('HOME') ? (getenv('HOME') . '/.local/lib/python3.12/site-packages') : '';
    if ($userSite !== '' && is_dir($userSite)) {
        $env['PYTHONPATH'] = isset($env['PYTHONPATH']) && $env['PYTHONPATH'] !== ''
            ? $userSite . PATH_SEPARATOR . $env['PYTHONPATH']
            : $userSite;
    }
    $proc = null;
    $pipes = [];
    $lastErr = 'Could not start python translator';
    foreach (['/opt/l8-py/bin/python', '/usr/local/bin/l8-python', 'python3', 'python'] as $bin) {
        if ($bin !== 'python3' && $bin !== 'python' && !is_file($bin)) {
            continue;
        }
        $try = @proc_open([$bin, $script], $descriptors, $pipes, __DIR__, $env);
        if (is_resource($try)) {
            $proc = $try;
            break;
        }
        $lastErr = 'Could not start ' . $bin;
    }
    if (!is_resource($proc)) {
        return ['ok' => false, 'error' => $lastErr];
    }
    fwrite($pipes[0], $payload);
    fclose($pipes[0]);
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $code = proc_close($proc);
    $data = json_decode((string) $stdout, true);
    if (!is_array($data)) {
        return [
            'ok' => false,
            'error' => 'Invalid translator output',
            'stderr' => substr((string) $stderr, 0, 500),
            'code' => $code,
        ];
    }
    return $data;
}

/**
 * PHP fallback: Google Translate gtx endpoint (no API key / no OpenAI).
 */
function tiptapTranslateViaGoogleGtx($text, $mode = 'replace') {
    $paras = preg_split("/\n\s*\n/", (string) $text) ?: [(string) $text];
    $englishParts = [];
    foreach ($paras as $para) {
        $para = (string) $para;
        if (trim($para) === '') {
            $englishParts[] = '';
            continue;
        }
        $chunks = [];
        $len = strlen($para);
        $max = 4200;
        if ($len <= $max) {
            $chunks[] = $para;
        } else {
            for ($i = 0; $i < $len; $i += $max) {
                $chunks[] = substr($para, $i, $max);
            }
        }
        $translated = [];
        foreach ($chunks as $chunk) {
            $url = 'https://translate.googleapis.com/translate_a/single?' . http_build_query([
                'client' => 'gtx',
                'sl' => 'es',
                'tl' => 'en',
                'dt' => 't',
                'q' => $chunk,
            ]);
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 60,
                CURLOPT_HTTPHEADER => ['User-Agent: l8-tiptap-translator/1.0'],
            ]);
            $raw = curl_exec($ch);
            $err = curl_error($ch);
            $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($raw === false || $code >= 400) {
                return ['ok' => false, 'error' => 'Google gtx failed: ' . ($err ?: ('HTTP ' . $code))];
            }
            $data = json_decode((string) $raw, true);
            if (!is_array($data) || !isset($data[0]) || !is_array($data[0])) {
                return ['ok' => false, 'error' => 'Google gtx invalid response'];
            }
            $piece = '';
            foreach ($data[0] as $seg) {
                if (is_array($seg) && isset($seg[0]) && is_string($seg[0])) {
                    $piece .= $seg[0];
                }
            }
            $translated[] = $piece;
        }
        $englishParts[] = trim(implode("\n", $translated));
    }
    $english = '';
    foreach ($englishParts as $i => $p) {
        if ($i > 0) {
            $english .= "\n\n";
        }
        $english .= $p;
    }
    $english = trim($english);
    if ($english === '') {
        return ['ok' => false, 'error' => 'Empty translation from Google gtx'];
    }
    return tiptapTranslateFormatResult($text, $english, $mode, 'google-gtx');
}

function tiptapTranslateFormatResult($source, $english, $mode, $engine) {
    $final = $english;
    if ($mode === 'bilingual') {
        $sp = preg_split("/\n\s*\n/", trim((string) $source)) ?: [];
        $ep = preg_split("/\n\s*\n/", $english) ?: [];
        $sp = array_values(array_filter(array_map('trim', $sp), static function ($s) {
            return $s !== '';
        }));
        $ep = array_values(array_filter(array_map('trim', $ep), static function ($s) {
            return $s !== '';
        }));
        if (count($sp) === count($ep) && count($sp) > 0) {
            $blocks = [];
            foreach ($sp as $i => $s) {
                $blocks[] = $s;
                $blocks[] = $ep[$i];
            }
            $final = implode("\n\n", $blocks);
        } else {
            $final = trim((string) $source) . "\n\n" . $english;
        }
    }
    return [
        'ok' => true,
        'text' => $final,
        'english' => $english,
        'engine' => $engine,
        'source' => 'https://github.com/oomol-lab/epub-translator',
        'mode' => $mode,
    ];
}

function tiptapTranslateEsEn($text, $mode = 'replace') {
    $text = (string) $text;
    $mode = $mode === 'bilingual' ? 'bilingual' : 'replace';
    if (trim($text) === '') {
        return ['ok' => false, 'error' => 'No hay texto para traducir'];
    }
    if (strlen($text) > 120000) {
        return ['ok' => false, 'error' => 'Texto demasiado largo (máx. ~120k)'];
    }

    // Python: deep-translator / Google gtx / LibreTranslate / Argos (no OpenAI)
    $py = tiptapTranslateViaPython($text, $mode);
    if (!empty($py['ok'])) {
        return $py;
    }

    // PHP fallback: Google Translate gtx (no API key)
    $gtx = tiptapTranslateViaGoogleGtx($text, $mode);
    if (!empty($gtx['ok'])) {
        if (!empty($py['error'])) {
            $gtx['python_error'] = $py['error'];
        }
        return $gtx;
    }

    return [
        'ok' => false,
        'error' => ($gtx['error'] ?? null) ?: ($py['error'] ?? 'Translation unavailable'),
        'python_error' => $py['error'] ?? null,
        'hint' => 'pip install deep-translator (no OpenAI). Optional: LIBRETRANSLATE_URL or argostranslate.',
        'source' => 'https://github.com/oomol-lab/epub-translator',
    ];
}

