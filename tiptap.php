<?php
/**
 * TipTap document editor — persistence for the Word-like sheet window.
 * Frontend: tiptap_editor/ (https://github.com/ueberdosis/tiptap)
 */

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
        'platform_url' => '/tiptap',
        'has_doc' => is_file($path),
        'docs_path' => 'data_storage/tiptap/docs',
    ];
}

/**
 * Spanish → English using oomol-lab/epub-translator prompt + LLM.
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
    foreach (['OPENAI_API_KEY', 'OPENAI_API_BASE', 'OPENAI_CHAT_MODEL', 'EPUB_TRANSLATOR_API_KEY', 'EPUB_TRANSLATOR_URL', 'EPUB_TRANSLATOR_MODEL', 'PATH', 'HOME', 'LANG'] as $k) {
        $v = getenv($k);
        if ($v !== false && $v !== '') {
            $env[$k] = $v;
        }
    }
    $pythonBins = [];
    foreach (['/opt/l8-py/bin/python', '/usr/local/bin/l8-python', 'python3', 'python'] as $bin) {
        $pythonBins[] = $bin;
    }
    $proc = null;
    $pipes = [];
    $lastErr = 'Could not start python translator';
    foreach ($pythonBins as $bin) {
        $cmd = is_file($bin) || $bin === 'python3' || $bin === 'python'
            ? [$bin, $script]
            : null;
        if ($cmd === null) {
            continue;
        }
        $try = @proc_open($cmd, $descriptors, $pipes, __DIR__, $env);
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
 * Direct OpenAI HTTP using the vendored epub-translator system prompt
 * (same path as translate_es_en.py when the Python package is missing).
 */
function tiptapTranslateViaOpenAiEnv($text, $mode = 'replace') {
    $key = getenv('OPENAI_API_KEY') ?: getenv('EPUB_TRANSLATOR_API_KEY') ?: '';
    if ($key === '') {
        return ['ok' => false, 'error' => 'Missing OPENAI_API_KEY'];
    }
    $model = getenv('OPENAI_CHAT_MODEL') ?: getenv('EPUB_TRANSLATOR_MODEL') ?: 'gpt-4o';
    $base = rtrim(getenv('OPENAI_API_BASE') ?: getenv('EPUB_TRANSLATOR_URL') ?: 'https://api.openai.com/v1', '/');
    $url = $base . '/chat/completions';
    $system = tiptapEpubTranslatorSystemPrompt();
    $paras = preg_split("/\n\s*\n/", (string) $text) ?: [(string) $text];
    $englishParts = [];
    foreach ($paras as $para) {
        $para = (string) $para;
        if (trim($para) === '') {
            $englishParts[] = '';
            continue;
        }
        $payload = json_encode([
            'model' => $model,
            'temperature' => 0,
            'messages' => [
                ['role' => 'system', 'content' => $system],
                ['role' => 'user', 'content' => $para],
            ],
        ], JSON_UNESCAPED_UNICODE);
        if ($payload === false) {
            return ['ok' => false, 'error' => 'JSON encode failed'];
        }
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $key,
            ],
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 120,
        ]);
        $raw = curl_exec($ch);
        $err = curl_error($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($raw === false) {
            return ['ok' => false, 'error' => 'OpenAI curl: ' . $err];
        }
        $data = json_decode((string) $raw, true);
        if ($code >= 400 || !is_array($data)) {
            $msg = is_array($data) ? ($data['error']['message'] ?? 'HTTP ' . $code) : ('HTTP ' . $code);
            return ['ok' => false, 'error' => 'OpenAI: ' . $msg];
        }
        $englishParts[] = trim((string) ($data['choices'][0]['message']['content'] ?? ''));
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
        return ['ok' => false, 'error' => 'Empty translation from OpenAI'];
    }
    return tiptapTranslateFormatResult($text, $english, $mode, 'epub-translator-prompt+openai-http');
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

function tiptapTranslateViaAiChat($text, $mode = 'replace') {
    if (!function_exists('aiChatComplete')) {
        @require_once __DIR__ . '/ai-chat.php';
    }
    if (!function_exists('aiChatComplete') || !function_exists('aiChatLoadSession') || !function_exists('aiChatIsAuthed')) {
        return ['ok' => false, 'error' => 'AI chat stack unavailable'];
    }
    $session = aiChatLoadSession();
    $provider = null;
    foreach (['gpt-5.6', 'claude-fable-5', 'gemini-3.6', 'manus'] as $id) {
        if (aiChatIsAuthed($session, $id)) {
            $provider = $id;
            break;
        }
    }
    if ($provider === null) {
        return [
            'ok' => false,
            'error' => 'No LLM credentials. Configure OPENAI_API_KEY (epub-translator) or AI chat auth.',
        ];
    }

    $system = tiptapEpubTranslatorSystemPrompt();
    $paras = preg_split("/\n\s*\n/", (string) $text) ?: [(string) $text];
    $englishParts = [];
    foreach ($paras as $para) {
        $para = (string) $para;
        if (trim($para) === '') {
            $englishParts[] = '';
            continue;
        }
        // aiChatComplete uses its own system prompt — embed epub-translator rules in user message.
        $userMsg =
            "[epub-translator system rules]\n" . $system
            . "\n[source Spanish text]\n" . $para;
        $res = aiChatComplete($provider, $userMsg, '');
        if (empty($res['ok'])) {
            return [
                'ok' => false,
                'error' => $res['error'] ?? 'LLM translation failed',
                'provider' => $provider,
            ];
        }
        $englishParts[] = trim((string) ($res['content'] ?? ''));
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
        return ['ok' => false, 'error' => 'Empty translation from LLM'];
    }
    $out = tiptapTranslateFormatResult($text, $english, $mode, 'epub-translator-prompt+' . $provider);
    $out['provider'] = $provider;
    return $out;
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

    // Prefer Python + epub-translator package / OpenAI (same prompts as upstream)
    $py = tiptapTranslateViaPython($text, $mode);
    if (!empty($py['ok'])) {
        return $py;
    }

    // Direct OpenAI with vendored epub-translator prompt (no Python required)
    $oa = tiptapTranslateViaOpenAiEnv($text, $mode);
    if (!empty($oa['ok'])) {
        if (!empty($py['error'])) {
            $oa['python_error'] = $py['error'];
        }
        return $oa;
    }

    // Fallback: platform AI chat OAuth session with the same prompt
    $ai = tiptapTranslateViaAiChat($text, $mode);
    if (!empty($ai['ok'])) {
        if (!empty($py['error'])) {
            $ai['python_error'] = $py['error'];
        }
        if (!empty($oa['error'])) {
            $ai['openai_error'] = $oa['error'];
        }
        return $ai;
    }

    return [
        'ok' => false,
        'error' => ($ai['error'] ?? null) ?: ($oa['error'] ?? null) ?: ($py['error'] ?? 'Translation unavailable'),
        'python_error' => $py['error'] ?? null,
        'openai_error' => $oa['error'] ?? null,
        'hint' => 'Install epub-translator (pip install epub-translator) + OPENAI_API_KEY, or configure AI chat credentials.',
        'source' => 'https://github.com/oomol-lab/epub-translator',
    ];
}

