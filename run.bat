@echo off
chcp 65001 >nul
title l8 codespace — Native PHP HTML — Puerto 8000
cls
echo ==================================================
echo  l8 codespace — Native PHP HTML (no Vite/React SPA)
echo  Acceso Local: http://localhost:8000
echo ==================================================
echo.
echo Liberando puerto 8000 en caso de estar ocupado...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo.
echo Servidor PHP activo. Abre http://localhost:8000
echo El view-source debe mostrar HTML completo.
echo --------------------------------------------------
"D:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe" -S localhost:8000 router.php
pause
