@echo off
chcp 65001 >nul
title Hashcod Codespace - Instalacion local Laragon
set "TMPINSTALL=%TEMP%\hashcod-laragon-install.ps1"
echo Descargando instalador oficial desde GitHub...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/w129/hashcod-codespace/main/laragon-install.ps1' -OutFile '%TMPINSTALL%'"
if errorlevel 1 (
  echo No se pudo descargar el instalador.
  pause
  exit /b 1
)
echo.
echo Instalando todos los archivos en D:\laragon\www\Hashcod Codespace ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%TMPINSTALL%"
set "EXITCODE=%ERRORLEVEL%"
del /q "%TMPINSTALL%" >nul 2>&1
if not "%EXITCODE%"=="0" (
  echo.
  echo La instalacion encontro un error. Revisa el mensaje anterior.
  pause
  exit /b %EXITCODE%
)
echo.
echo Hashcod Codespace local listo.
pause
