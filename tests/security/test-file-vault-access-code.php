<?php
declare(strict_types=1);
require dirname(__DIR__, 2) . '/hashcod-file-vault-access-code.php';
function codeCheck(bool $ok, string $message): void { if (!$ok) throw new RuntimeException($message); }
$pepper = random_bytes(32);
foreach (['0', '123456', 'MiCodigo-Verde!', ' código con espacios ', str_repeat('x', 128), '🔐verde'] as $code) {
    $hash = hfvAccessCodeHash($code, 'fv_file_a123', $pepper);
    codeCheck($hash !== $code && password_get_info($hash)['algoName'] === 'bcrypt', 'Code must be stored only as a salted hash');
    codeCheck(hfvAccessCodeVerify($code, 'fv_file_a123', $hash, $pepper), 'Chosen code must unlock its file without a clock or authenticator');
    codeCheck(!hfvAccessCodeVerify($code . '!', 'fv_file_a123', $hash, $pepper), 'Any changed character must be rejected');
    codeCheck(!hfvAccessCodeVerify($code, 'fv_file_b123', $hash, $pepper), 'Verifier must be bound to its original file');
    codeCheck(!hfvAccessCodeVerify($code, 'fv_file_a123', $hash, random_bytes(32)), 'Wrong server pepper must be rejected');
}
foreach (['', '   ', str_repeat('x', 129), "code\0hidden"] as $invalid) codeCheck(!hfvAccessCodeInputValid($invalid), 'Invalid code accepted');
$prefix = str_repeat('a', 72);
$hash = hfvAccessCodeHash($prefix . 'one', 'fv_file_a123', $pepper);
codeCheck(!hfvAccessCodeVerify($prefix . 'two', 'fv_file_a123', $hash, $pepper), 'Codes must not collide after bcrypt byte 72');
codeCheck($hash !== hfvAccessCodeHash($prefix . 'one', 'fv_file_a123', $pepper), 'Each hash needs a random salt');
codeCheck(!hfvAccessCodeVerify('123456', 'fv_file_a123', 'corrupted', $pepper), 'Malformed hash must fail closed');
echo "Fixed file codes: arbitrary text, exact match, per-file binding, pepper, bounds and no bcrypt truncation OK\n";
