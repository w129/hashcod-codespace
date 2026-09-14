@echo off
chcp 65001 >nul
title Hashcod Codespace - Reparar solo Rare UI
cd /d "%~dp0"

echo ============================================================
echo   HASHCOD CODESPACE - REPARACION PUNTUAL RARE UI
echo ============================================================
echo.
echo Este proceso NO actualiza todo el proyecto.
echo Solo repara la animacion Rare UI requerida en Laragon.
echo No toca .env, data_storage, Supabase ni el resto del codigo.
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0laragon-bootstrap.ps1"

if errorlevel 1 (
    echo.
    echo ERROR: La reparacion puntual no se completo.
    echo Enviame una captura del mensaje de arriba.
    pause
    exit /b 1
)

echo.
echo Reparacion terminada.
echo Pulsa Reload/Recargar en Laragon y abre:
echo http://localhost/Hashcod%%20Codespace/
echo.
pause
