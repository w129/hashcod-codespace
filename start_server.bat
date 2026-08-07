@echo off
chcp 65001 >nul
title Servidor Native PHP + React TypeScript l8 - Puerto 8000
cls
echo ==================================================
echo 🚀 SERVIDOR NATIVE PHP + REACT TYPESCRIPT (D:\laragon\www\l8)
echo 📡 Acceso Local: http://localhost:8000
echo ==================================================
echo.
echo Liberando puerto 8000 en caso de estar ocupado...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo.
echo 🟢 Servidor PHP activo. Abre http://localhost:8000 en tu navegador.
echo --------------------------------------------------
"D:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe" -S localhost:8000 router.php
pause
