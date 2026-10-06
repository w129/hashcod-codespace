<?php
declare(strict_types=1);

// Shared by signed-direct and multipart uploads, hosted and Windows runtimes.
function hfvAccessCodeInputValid(string $code): bool {
    return trim($code) !== '' && strlen($code) <= 512 && !str_contains($code, "\0")
        && preg_match_all('/./us', $code) >= 1 && preg_match_all('/./us', $code) <= 128;
}

function hfvAccessCodeDigest(string $code, string $id, string $pepper): string {
    // Fixed-size hex input avoids bcrypt's 72-byte truncation and binds each
    // verifier to its file and the private server key. Never trim chosen codes.
    return hash_hmac('sha256', 'hashcod-file-vault-access-code-v1|' . $id . '|' . $code, $pepper);
}

function hfvAccessCodeHash(string $code, string $id, string $pepper): string {
    if (!hfvAccessCodeInputValid($code) || $id === '' || $pepper === '') return '';
    $hash = password_hash(hfvAccessCodeDigest($code, $id, $pepper), PASSWORD_BCRYPT, ['cost' => 12]);
    return is_string($hash) ? $hash : '';
}

function hfvAccessCodeVerify(string $code, string $id, string $hash, string $pepper): bool {
    if (!hfvAccessCodeInputValid($code) || $id === '' || $hash === '' || $pepper === '') return false;
    return password_verify(hfvAccessCodeDigest($code, $id, $pepper), $hash);
}
