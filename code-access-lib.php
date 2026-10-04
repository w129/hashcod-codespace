<?php
declare(strict_types=1);

require_once __DIR__ . '/mldsa-access.php';

function codeAccessProtocol(): string {
    return 'HASHCOD-ACCESS/1';
}

function codeAccessTemplate(string $challenge): string {
    $challenge=str_replace(["\\","'","\r","\n"],['','','',''],$challenge);
    return "<?php\n\nreturn [\n"
        . "  'protocol' => '" . codeAccessProtocol() . "',\n"
        . "  'challenge' => '" . $challenge . "',\n"
        . "  'signature' => 'PASTE_ML_DSA_87_SIGNATURE_BASE64_HERE',\n"
        . "];\n";
}

function codeAccessParseManifest(string $source): ?array {
    if($source===''||strlen($source)>12000)return null;
    if(str_contains($source,"\0"))return null;

    // Deliberately accept only one tiny PHP-shaped literal grammar. Nothing is
    // evaluated, included, required, reflected, tokenized into executable PHP,
    // or passed to a shell.
    $pattern="~\\A\\s*<\\?php\\s*return\\s*\\[\\s*"
        . "'protocol'\\s*=>\\s*'(" . preg_quote(codeAccessProtocol(),'~') . ")'\\s*,\\s*"
        . "'challenge'\\s*=>\\s*'([^'\\r\\n]{20,2048})'\\s*,\\s*"
        . "'signature'\\s*=>\\s*'([A-Za-z0-9+/_=.-]{20,9000})'\\s*,?\\s*"
        . "\\]\\s*;\\s*(?:\\?>)?\\s*\\z~D";

    if(!preg_match($pattern,$source,$m))return null;
    return [
        'protocol'=>$m[1],
        'challenge'=>$m[2],
        'signature'=>$m[3],
    ];
}
