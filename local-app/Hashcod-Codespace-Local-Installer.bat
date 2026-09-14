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
