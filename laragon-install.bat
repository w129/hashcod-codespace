@echo off
chcp 65001 >nul
title Hashcod Codespace - Instalador Laragon
cd /d "%~dp0"
echo Instalando/actualizando Hashcod Codespace en:
echo D:\laragon\www\Hashcod Codespace
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0laragon-install.ps1"
if errorlevel 1 (
  echo.
  echo La instalacion encontro un error. Revisa el mensaje de arriba.
  pause
  exit /b 1
)
echo.
echo Listo. Presiona una tecla para cerrar.
pause >nul
