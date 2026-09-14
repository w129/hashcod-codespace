param(
    [string]$Destination = 'D:\laragon\www\Hashcod Codespace'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoZip = 'https://github.com/w129/hashcod-codespace/archive/refs/heads/main.zip'
$tempRoot = Join-Path $env:TEMP ('hashcod-local-app-' + [guid]::NewGuid().ToString('N'))
$zipFile = Join-Path $tempRoot 'hashcod-codespace.zip'
$extractRoot = Join-Path $tempRoot 'extract'

function Step([string]$Message) {
    Write-Host ''
    Write-Host "==> $Message" -ForegroundColor Cyan
}

Write-Host 'Hashcod Codespace - Local Application Installer' -ForegroundColor Green
Write-Host "Destino: $Destination"

if (-not (Test-Path -LiteralPath 'D:\laragon' -PathType Container)) {
    throw 'Laragon no fue encontrado en D:\laragon. Instala Laragon o cambia la ruta de destino.'
}

New-Item -ItemType Directory -Force -Path $tempRoot, $extractRoot | Out-Null

try {
    Step 'Descargando la version local desde GitHub'
    Invoke-WebRequest -Uri $repoZip -OutFile $zipFile -UseBasicParsing -TimeoutSec 180

    Step 'Extrayendo archivos'
    Expand-Archive -LiteralPath $zipFile -DestinationPath $extractRoot -Force

    $source = Get-ChildItem -LiteralPath $extractRoot -Directory | Select-Object -First 1
    if (-not $source) {
        throw 'No se pudo localizar la carpeta extraida.'
    }

    Step 'Instalando/actualizando Hashcod Codespace en Laragon'
    New-Item -ItemType Directory -Force -Path $Destination | Out-Null

    $robocopyArgs = @(
        $source.FullName,
        $Destination,
        '/E',
        '/R:2',
        '/W:1',
        '/NFL',
        '/NDL',
        '/NJH',
        '/NJS',
        '/XF', '.env', 'LOCAL-DB-CREDENTIALS.txt',
        '/XD', 'data_storage', '.git'
    )

    & robocopy.exe @robocopyArgs | Out-Null
    $copyCode = $LASTEXITCODE
    if ($copyCode -ge 8) {
        throw "Robocopy termino con codigo $copyCode"
    }

    $envExample = Join-Path $Destination '.env.example'
    $envFile = Join-Path $Destination '.env'
    if (-not (Test-Path -LiteralPath $envFile) -and (Test-Path -LiteralPath $envExample)) {
        Copy-Item -LiteralPath $envExample -Destination $envFile -Force
    }

    Step 'Creando lanzador local'
    $launcherPath = Join-Path $Destination 'START-HASHCOD-CODESPACE.bat'
    $launcher = @'
@echo off
chcp 65001 >nul
cd /d "%~dp0"
if exist "D:\laragon\laragon.exe" (
  start "" "D:\laragon\laragon.exe"
  timeout /t 4 /nobreak >nul
)
start "" "https://hashcod-codespace.test/"
'@
    Set-Content -LiteralPath $launcherPath -Value $launcher -Encoding ASCII

    Step 'Creando acceso directo en el escritorio'
    try {
        $desktop = [Environment]::GetFolderPath('Desktop')
        $shortcutPath = Join-Path $desktop 'Hashcod Codespace Local.lnk'
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut($shortcutPath)
        $shortcut.TargetPath = $launcherPath
        $shortcut.WorkingDirectory = $Destination
        $shortcut.Description = 'Hashcod Codespace - Local Application'
        $shortcut.Save()
        Write-Host "Acceso directo: $shortcutPath" -ForegroundColor Green
    }
    catch {
        Write-Warning ('No se pudo crear el acceso directo: ' + $_.Exception.Message)
    }

    Write-Host ''
    Write-Host 'INSTALACION LOCAL COMPLETADA' -ForegroundColor Green
    Write-Host "Carpeta: $Destination"
    Write-Host "Lanzador: $launcherPath"
    Write-Host ''
    Write-Host 'Inicia Laragon y usa el acceso directo Hashcod Codespace Local.' -ForegroundColor Yellow
}
finally {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}

Read-Host 'Pulsa Enter para cerrar'
