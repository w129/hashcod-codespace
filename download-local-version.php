<?php
$path = __DIR__ . '/local-app/Hashcod-Codespace-Local-Installer.bat';
$filename = 'Hashcod-Codespace-Local-Installer.bat';

// Keep a self-contained fallback so the download still works even if a deploy
// accidentally omits local-app/ from the runtime image. This launcher fetches
// the real PowerShell installer from the main branch when the user runs it.
$fallback = <<<'BAT'
@echo off
chcp 65001 >nul
title Hashcod Codespace - Local Application Installer

echo ============================================================
echo   HASHCOD CODESPACE - LOCAL APPLICATION INSTALLER
echo ============================================================
echo.
echo Se instalara/actualizara Hashcod Codespace en:
echo   D:\laragon\www\Hashcod Codespace
echo.
echo El instalador conserva .env y data_storage existentes.
echo.

set "PS1=%TEMP%\hashcod-codespace-install-local-%RANDOM%%RANDOM%.ps1"

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/w129/hashcod-codespace/main/local-app/install-local.ps1' -OutFile '%PS1%'"
if errorlevel 1 (
  echo.
  echo ERROR: No se pudo descargar el instalador local.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PS1%"
set "CODE=%ERRORLEVEL%"
del /q "%PS1%" >nul 2>&1

if not "%CODE%"=="0" (
  echo.
  echo ERROR: La instalacion termino con codigo %CODE%.
  pause
  exit /b %CODE%
)

echo.
echo Hashcod Codespace Local esta listo.
pause
BAT;

if (is_file($path)) {
    $payload = (string) file_get_contents($path);
} else {
    $payload = str_replace("\n", "\r\n", $fallback) . "\r\n";
}

if ($payload === '') {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    echo 'Hashcod Codespace local installer could not be generated.';
    exit;
}

// Clear security/cache headers that are useful for normal HTML but can confuse
// browser download handling. The installer itself contains no server secrets.
foreach ([
    'Content-Security-Policy',
    'Cross-Origin-Opener-Policy',
    'Cross-Origin-Resource-Policy',
    'X-Frame-Options',
    'ETag',
    'Last-Modified',
] as $headerName) {
    header_remove($headerName);
}

http_response_code(200);
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . strlen($payload));
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'HEAD') {
    exit;
}

echo $payload;
exit;
