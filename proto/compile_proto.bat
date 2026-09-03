@echo off
rem ============================================================================
rem  Hashcod Codespace - Protocol Buffers Compiler Script
rem  Compiles proto/codespace_pqc.proto to Go and JS/gRPC stubs
rem ============================================================================

setlocal enabledelayedexpansion
set "SCRIPT_DIR=%~dp0"
set "ROOT_DIR=%SCRIPT_DIR%.."
set "PROTO_SRC=%SCRIPT_DIR%codespace_pqc.proto"
set "GO_OUT=%ROOT_DIR%\daemon\pb"

echo [1/3] Verifying protoc compiler...
where protoc >nul 2>nul
if errorlevel 1 (
    echo [WARN] 'protoc' compiler not detected in system PATH.
    echo [INFO] Precompiled Go stubs are already provided in daemon\pb\
    echo [INFO] To recompile manually, install protoc and protoc-gen-go / protoc-gen-go-grpc.
    exit /b 0
)

echo [2/3] Ensuring output directory exists: %GO_OUT%
if not exist "%GO_OUT%" mkdir "%GO_OUT%"

echo [3/3] Compiling %PROTO_SRC% ...
protoc --proto_path="%SCRIPT_DIR%" ^
       --go_out="%GO_OUT%" --go_opt=paths=source_relative ^
       --go-grpc_out="%GO_OUT%" --go-grpc_opt=paths=source_relative ^
       "%PROTO_SRC%"

if errorlevel 1 (
    echo [ERROR] protoc execution failed.
    exit /b 1
)

echo [SUCCESS] Protocol Buffers compiled successfully to %GO_OUT%
exit /b 0
