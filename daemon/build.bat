@echo off
rem ============================================================================
rem  Hashcod Codespace - High-Performance Go gRPC Daemon Build Script
rem  Compiles daemon/main.go to daemon/bin/codespace_daemon.exe
rem ============================================================================

setlocal enabledelayedexpansion
set "SCRIPT_DIR=%~dp0"
set "BIN_DIR=%SCRIPT_DIR%bin"
set "TARGET_EXE=%BIN_DIR%\codespace_daemon.exe"

echo [1/3] Locating Go compiler...
set "GO_BIN="
where go >nul 2>nul
if not errorlevel 1 (
    set "GO_BIN=go"
) else if exist "C:\Program Files\Go\bin\go.exe" (
    set "GO_BIN=C:\Program Files\Go\bin\go.exe"
) else if exist "C:\Go\bin\go.exe" (
    set "GO_BIN=C:\Go\bin\go.exe"
) else if exist "D:\laragon\bin\go\bin\go.exe" (
    set "GO_BIN=D:\laragon\bin\go\bin\go.exe"
)

if "%GO_BIN%"=="" (
    echo [ERROR] Go compiler (go.exe) was not found in PATH or standard locations.
    echo Please install Go 1.21+ from https://go.dev/dl/
    exit /b 1
)

echo [2/3] Preparing output directory: %BIN_DIR%
if not exist "%BIN_DIR%" mkdir "%BIN_DIR%"

echo [3/3] Compiling Go gRPC Daemon...
cd /d "%SCRIPT_DIR%"
"%GO_BIN%" build -v -ldflags="-s -w" -o "%TARGET_EXE%" main.go
if errorlevel 1 (
    echo [ERROR] Build failed! Check compiler error logs above.
    exit /b 1
)

echo ============================================================================
echo [SUCCESS] Binary compiled successfully:
echo %TARGET_EXE%
echo ============================================================================
exit /b 0
