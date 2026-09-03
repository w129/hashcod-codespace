@echo off
rem ============================================================================
rem  Hashcod Codespace - Launch Script for Go gRPC Daemon & Gateway
rem  Port 50051: Native gRPC | Port 50052: Browser gRPC-Web Gateway
rem ============================================================================

setlocal enabledelayedexpansion
set "SCRIPT_DIR=%~dp0"
set "BIN_EXE=%SCRIPT_DIR%bin\codespace_daemon.exe"

set "GRPC_PORT=50051"
set "GRPC_WEB_PORT=50052"
set "DILITHIUM_EPOCH_FILE=%SCRIPT_DIR%..\data_storage\auth\active_dilithium5_epoch.json"

echo [STARTING] Hashcod Codespace gRPC Daemon...
echo Native gRPC:     http://127.0.0.1:%GRPC_PORT%
echo gRPC-Web Gateway: http://127.0.0.1:%GRPC_WEB_PORT%
echo Epoch Storage:   %DILITHIUM_EPOCH_FILE%

if exist "%BIN_EXE%" (
    "%BIN_EXE%"
) else (
    echo [INFO] Compiled binary not found, running directly via Go runtime...
    cd /d "%SCRIPT_DIR%"
    go run main.go
)

pause
