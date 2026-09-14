param(
    [string]$Destination = 'D:\laragon\www\Hashcod Codespace',
    [string]$Branch = 'main',
    [switch]$SkipSupabasePrompt
)

$ErrorActionPreference = 'Stop'
$Repo = 'w129/hashcod-codespace'
$RepoZip = "https://github.com/$Repo/archive/refs/heads/$Branch.zip"
$ProductionBundleUrl = 'https://hashcod-codespace-1.onrender.com/components/rare-folder-entry.bundle.js'

function Write-Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Test-JavaScriptBundle([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
    $file = Get-Item -LiteralPath $Path
    if ($file.Length -lt 4096) { return $false }
    $prefix = Get-Content -LiteralPath $Path -Raw -ErrorAction SilentlyContinue
    if (-not $prefix) { return $false }
    if ($prefix -match '(?is)^\s*<!doctype\s+html|^\s*<html') { return $false }
    return $true
}

function Build-RareBundle([string]$ProjectRoot, [string]$BundlePath) {
    $buildDir = Join-Path $ProjectRoot 'rare-folder-build'
    $packageJson = Join-Path $buildDir 'package.json'
    if (-not (Test-Path -LiteralPath $packageJson)) { return $false }

    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $npm) { $npm = Get-Command npm -ErrorAction SilentlyContinue }
    if (-not $npm) { return $false }

    Write-Step 'Compilando Rare UI localmente con Node/npm'
    Push-Location $buildDir
    try {
        & $npm.Source install --no-fund --no-audit
        if ($LASTEXITCODE -ne 0) { return $false }
        & $npm.Source run build
        if ($LASTEXITCODE -ne 0) { return $false }
    } finally {
        Pop-Location
    }
    return (Test-JavaScriptBundle $BundlePath)
}

Write-Host 'Hashcod Codespace - Bootstrap seguro para Laragon' -ForegroundColor Green
Write-Host "Destino: $Destination"

$tempRoot = Join-Path $env:TEMP ('hashcod-laragon-bootstrap-' + [guid]::NewGuid().ToString('N'))
$zipFile = Join-Path $tempRoot 'repo.zip'
$extractRoot = Join-Path $tempRoot 'extract'
New-Item -ItemType Directory -Force -Path $tempRoot, $extractRoot | Out-Null

try {
    Write-Step 'Descargando la rama main completa desde GitHub'
    Invoke-WebRequest -Uri $RepoZip -OutFile $zipFile -UseBasicParsing
    Expand-Archive -LiteralPath $zipFile -DestinationPath $extractRoot -Force

    $project = Get-ChildItem -LiteralPath $extractRoot -Directory | Select-Object -First 1
    if (-not $project) { throw 'No se pudo localizar la carpeta extraida del repositorio.' }

    $installer = Join-Path $project.FullName 'laragon-install.ps1'
    if (-not (Test-Path -LiteralPath $installer)) {
        throw 'No se encontro laragon-install.ps1 en la descarga.'
    }

    $components = Join-Path $project.FullName 'components'
    New-Item -ItemType Directory -Force -Path $components | Out-Null
    $bundlePath = Join-Path $components 'rare-folder-entry.bundle.js'

    if (-not (Test-JavaScriptBundle $bundlePath)) {
        Write-Step 'Rare UI no viene precompilado en GitHub; obteniendo el bundle de produccion'
        try {
            Invoke-WebRequest -Uri $ProductionBundleUrl -OutFile $bundlePath -UseBasicParsing -TimeoutSec 120
        } catch {
            Write-Warning ('No se pudo descargar el bundle de produccion: ' + $_.Exception.Message)
        }
    }

    if (-not (Test-JavaScriptBundle $bundlePath)) {
        Remove-Item -LiteralPath $bundlePath -Force -ErrorAction SilentlyContinue
        $built = Build-RareBundle -ProjectRoot $project.FullName -BundlePath $bundlePath
        if (-not $built) {
            throw 'No se pudo obtener ni compilar components\rare-folder-entry.bundle.js. Verifica Internet o instala Node.js/npm y vuelve a ejecutar este bootstrap.'
        }
    }

    Write-Host 'Rare UI bundle: OK' -ForegroundColor Green
    Write-Step 'Ejecutando el instalador corregido'

    $args = @(
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', $installer,
        '-Destination', $Destination,
        '-Branch', $Branch
    )
    if ($SkipSupabasePrompt) { $args += '-SkipSupabasePrompt' }

    & powershell.exe @args
    $code = $LASTEXITCODE
    if ($code -ne 0) {
        throw "El instalador termino con codigo $code"
    }
} finally {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}
