param(
    [string]$Destination = 'D:\laragon\www\Hashcod Codespace',
    [string]$Branch = 'main'
)

$ErrorActionPreference = 'Stop'
$Repo = 'w129/hashcod-codespace'
$RawBase = "https://raw.githubusercontent.com/$Repo/$Branch"
$ProductionBundleUrl = 'https://hashcodcodespace.dev/components/rare-folder-entry.bundle.js'

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

function Download-TextFile([string]$Url, [string]$Target) {
    $parent = Split-Path -Parent $Target
    if ($parent) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    Invoke-WebRequest -Uri $Url -OutFile $Target -UseBasicParsing -TimeoutSec 120
}

function Build-RareBundle([string]$TempRoot, [string]$BundleTarget) {
    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $npm) { $npm = Get-Command npm -ErrorAction SilentlyContinue }
    if (-not $npm) { return $false }

    $buildDir = Join-Path $TempRoot 'rare-folder-build'
    $componentsDir = Join-Path $TempRoot 'components'
    New-Item -ItemType Directory -Force -Path $buildDir, $componentsDir | Out-Null

    Write-Step 'Descargando solo los archivos fuente necesarios para compilar Rare UI'
    Download-TextFile "$RawBase/rare-folder-build/package.json" (Join-Path $buildDir 'package.json')
    Download-TextFile "$RawBase/rare-folder-build/entry.jsx" (Join-Path $buildDir 'entry.jsx')

    Write-Step 'Compilando solamente rare-folder-entry.bundle.js'
    Push-Location $buildDir
    try {
        & $npm.Source install --no-fund --no-audit
        if ($LASTEXITCODE -ne 0) { return $false }
        & $npm.Source run build
        if ($LASTEXITCODE -ne 0) { return $false }
    } finally {
        Pop-Location
    }

    $built = Join-Path $componentsDir 'rare-folder-entry.bundle.js'
    if (-not (Test-JavaScriptBundle $built)) { return $false }
    Copy-Item -LiteralPath $built -Destination $BundleTarget -Force
    return (Test-JavaScriptBundle $BundleTarget)
}

Write-Host 'Hashcod Codespace - Reparacion puntual de Rare UI para Laragon' -ForegroundColor Green
Write-Host "Destino: $Destination"
Write-Host 'Este proceso NO actualiza todo el proyecto.' -ForegroundColor Green
Write-Host 'Solo repara los archivos necesarios para la animacion local.' -ForegroundColor Green

if (-not (Test-Path -LiteralPath $Destination -PathType Container)) {
    throw "No existe la carpeta local: $Destination"
}

$components = Join-Path $Destination 'components'
New-Item -ItemType Directory -Force -Path $components | Out-Null
$bundleTarget = Join-Path $components 'rare-folder-entry.bundle.js'
$tempRoot = Join-Path $env:TEMP ('hashcod-rareui-only-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

try {
    Write-Step 'Reparando solo components\rare-folder-entry.bundle.js'
    $downloaded = Join-Path $tempRoot 'rare-folder-entry.bundle.js'
    try {
        Invoke-WebRequest -Uri $ProductionBundleUrl -OutFile $downloaded -UseBasicParsing -TimeoutSec 120
        if (Test-JavaScriptBundle $downloaded) {
            Copy-Item -LiteralPath $downloaded -Destination $bundleTarget -Force
        }
    } catch {
        Write-Warning ('No se pudo obtener el bundle precompilado de produccion: ' + $_.Exception.Message)
    }

    if (-not (Test-JavaScriptBundle $bundleTarget)) {
        $ok = Build-RareBundle -TempRoot $tempRoot -BundleTarget $bundleTarget
        if (-not $ok) {
            throw 'No se pudo crear rare-folder-entry.bundle.js. Instala Node.js/npm o verifica tu conexion a Internet.'
        }
    }

    Write-Host 'rare-folder-entry.bundle.js: OK' -ForegroundColor Green

    # Solo repara los dos archivos de entrada local si faltan. No toca el resto del codigo.
    $localEntry = Join-Path $Destination 'laragon-local-entry.php'
    if (-not (Test-Path -LiteralPath $localEntry -PathType Leaf)) {
        Write-Step 'Falta laragon-local-entry.php; descargando solo ese archivo'
        Download-TextFile "$RawBase/laragon-local-entry.php" $localEntry
    }

    $localRouter = Join-Path $Destination 'laragon-router.php'
    if (-not (Test-Path -LiteralPath $localRouter -PathType Leaf)) {
        Write-Step 'Falta laragon-router.php; descargando solo ese archivo'
        Download-TextFile "$RawBase/laragon-router.php" $localRouter
    }

    if (-not (Test-Path -LiteralPath (Join-Path $Destination '404.html') -PathType Leaf)) {
        throw 'Falta 404.html en tu instalacion local. Ese archivo contiene la interfaz principal y no puedo reparar solo Rare UI sin el.'
    }

    # Ajuste minimo de Apache: solo agrega la entrada local si todavia no existe.
    $htaccessPath = Join-Path $Destination '.htaccess'
    if (Test-Path -LiteralPath $htaccessPath -PathType Leaf) {
        $ht = Get-Content -LiteralPath $htaccessPath -Raw
        $changed = $false
        if ($ht -notmatch '(?im)^\s*DirectoryIndex\s+laragon-local-entry\.php') {
            $ht = "DirectoryIndex laragon-local-entry.php index.php index.html`r`n" + $ht
            $changed = $true
        }
        if ($ht -match 'RewriteRule \^\(\.\*\)\$ router\.php \[QSA,L\]') {
            $ht = $ht -replace 'RewriteRule \^\(\.\*\)\$ router\.php \[QSA,L\]', 'RewriteRule ^(.*)$ laragon-router.php [QSA,L]'
            $changed = $true
        }
        if ($changed) {
            Set-Content -LiteralPath $htaccessPath -Value $ht -Encoding UTF8
        }
    }

    Write-Host ''
    Write-Host 'REPARACION PUNTUAL COMPLETADA' -ForegroundColor Green
    Write-Host 'Se actualizo unicamente la integracion Rare UI necesaria.' -ForegroundColor Green
    Write-Host 'NO se modificaron .env, data_storage, Supabase ni el resto del codigo.' -ForegroundColor Green
    Write-Host 'Pulsa Reload/Recargar en Laragon y abre:'
    Write-Host 'http://localhost/Hashcod%20Codespace/' -ForegroundColor Cyan
} finally {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}
