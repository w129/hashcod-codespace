<?php
/**
 * Hashcod Codespace desktop runtime helpers.
 *
 * The Electron shell launches the bundled PHP server on 127.0.0.1 and injects
 * a per-process random bridge token into every request made by the desktop
 * renderer. The token never lives in frontend JavaScript or persisted files.
 * This lets the local application keep sensitive operations restricted to the
 * installed desktop shell while still allowing camera/clipboard/admin flows
 * that cannot use the hosted-origin assumptions used in production.
 */

declare(strict_types=1);

function hashcodDesktopEnabled(): bool {
    $value = strtolower(trim((string)(getenv('HASHCOD_DESKTOP') ?: '')));
    return in_array($value, ['1', 'true', 'yes', 'on'], true);
}

function hashcodDesktopLoopbackRequest(): bool {
    $remote = trim((string)($_SERVER['REMOTE_ADDR'] ?? ''));
    return $remote === '127.0.0.1' || $remote === '::1';
}

function hashcodDesktopBridgeToken(): string {
    return trim((string)(getenv('HASHCOD_DESKTOP_ADMIN_TOKEN') ?: ''));
}

function hashcodDesktopBridgeValid(): bool {
    if (!hashcodDesktopEnabled() || !hashcodDesktopLoopbackRequest()) return false;
    $expected = hashcodDesktopBridgeToken();
    if ($expected === '' || strlen($expected) < 32) return false;
    $provided = trim((string)($_SERVER['HTTP_X_HASHCOD_DESKTOP_TOKEN'] ?? ''));
    return $provided !== '' && hash_equals($expected, $provided);
}

function hashcodDesktopOrigin(): string {
    $configured = rtrim(trim((string)(getenv('HASHCOD_DESKTOP_ORIGIN') ?: '')), '/');
    if ($configured !== '') return $configured;
    $host = trim((string)($_SERVER['HTTP_HOST'] ?? ''));
    return $host !== '' ? 'http://' . $host : 'http://127.0.0.1';
}

function hashcodDesktopCloudOrigin(): string {
    $configured = rtrim(trim((string)(getenv('HASHCOD_CLOUD_ORIGIN') ?: '')), '/');
    return $configured !== '' ? $configured : 'https://hashcodcodespace.dev';
}

function hashcodDesktopRuntimeInfo(): array {
    return [
        'desktop' => hashcodDesktopEnabled(),
        'bridge_authenticated' => hashcodDesktopBridgeValid(),
        'loopback' => hashcodDesktopLoopbackRequest(),
        'origin' => hashcodDesktopOrigin(),
        'cloud_origin' => hashcodDesktopCloudOrigin(),
    ];
}
