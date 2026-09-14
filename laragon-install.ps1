param(
    [string]$Destination = 'D:\laragon\www\Hashcod Codespace',
    [string]$Branch = 'main',
    [switch]$SkipSupabasePrompt
)

$ErrorActionPreference = 'Stop'
$Repo = 'w129/hashcod-codespace'
$RepoZip = "https://github.com/$Repo/archive/refs/heads/$Branch.zip"

function Write-Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Set-EnvValue([string]$File, [string]$Key, [string]$Value) {
    $escaped = [Regex]::Escape($Key)
    $lines = @()
    if (Test-Path -LiteralPath $File) { $lines = Get-Content -LiteralPath $File }
    $found = $false
    $out = foreach ($line in $lines) {
        if ($line -match "^$escaped=") {
            $found = $true
            "$Key=$Value"
        } else {
            $line
        }
    }
    if (-not $found) { $out += "$Key=$Value" }
    Set-Content -LiteralPath $File -Value $out -Encoding UTF8
}

function New-HexSecret([int]$Bytes = 32) {
    $data = New-Object byte[] $Bytes
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($data)
    } finally {
        $rng.Dispose()
    }
    return ([BitConverter]::ToString($data)).Replace('-', '').ToLowerInvariant()
}

function Find-LaragonPhp {
    $phpRoot = 'D:\laragon\bin\php'
    if (-not (Test-Path -LiteralPath $phpRoot)) { return $null }
    $items = Get-ChildItem -Path $phpRoot -Filter php.exe -Recurse -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending
    if ($items) { return $items[0].FullName }
    return $null
}

function Copy-ProjectSafely([string]$Source, [string]$Target) {
    New-Item -ItemType Directory -Force -Path $Target | Out-Null

    # Nunca borrar el destino completo: data_storage puede tener archivos de cache
    # abiertos por PHP/Laragon. Sincronizamos solo el codigo y preservamos el estado
    # local (.env, data_storage y cualquier .git local).
    $robocopy = Get-Command robocopy.exe -ErrorAction SilentlyContinue
    if ($robocopy) {
        Write-Host 'Sincronizando archivos sin tocar .env ni data_storage...' -ForegroundColor DarkCyan
        $args = @(
            $Source,
            $Target,
            '*',
            '/E',
            '/R:2',
            '/W:1',
            '/COPY:DAT',
            '/DCOPY:DAT',
            '/NFL',
            '/NDL',
            '/NP',
            '/NJH',
            '/NJS',
            '/XD', '.git', 'data_storage',
            '/XF', '.env'
        )
        & robocopy.exe @args
        $roboCode = $LASTEXITCODE
        if ($roboCode -ge 8) {
            throw "Robocopy no pudo sincronizar el proyecto (codigo $roboCode)."
        }
        # Robocopy usa codigos 1-7 para resultados correctos; no deben convertirse
        # en el codigo de salida del instalador.
        $global:LASTEXITCODE = 0
        return
    }

    Write-Host 'Robocopy no disponible; usando copia segura de PowerShell.' -ForegroundColor Yellow
    Get-ChildItem -LiteralPath $Source -Force | ForEach-Object {
        if ($_.Name -in @('.env', '.git', 'data_storage')) { return }
        $dest = Join-Path $Target $_.Name
        if ($_.PSIsContainer) {
            New-Item -ItemType Directory -Force -Path $dest | Out-Null
            Copy-Item -Path (Join-Path $_.FullName '*') -Destination $dest -Recurse -Force -ErrorAction Stop
            Get-ChildItem -LiteralPath $_.FullName -Force |
                Where-Object { $_.Name -like '.*' } |
                ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $dest -Recurse -Force -ErrorAction Stop }
        } else {
            Copy-Item -LiteralPath $_.FullName -Destination $dest -Force -ErrorAction Stop
        }
    }
}

Write-Host 'Hashcod Codespace - Instalador local para Laragon' -ForegroundColor Green
Write-Host "Destino: $Destination"

$laragonRoot = 'D:\laragon'
if (-not (Test-Path -LiteralPath $laragonRoot)) {
    throw 'No se encontro D:\laragon. Instala/ubica Laragon en D:\laragon o ejecuta este script con -Destination apuntando a tu carpeta www.'
}

$parent = Split-Path -Parent $Destination
New-Item -ItemType Directory -Force -Path $parent | Out-Null
New-Item -ItemType Directory -Force -Path $Destination | Out-Null

Write-Step 'Descargando la rama main completa desde GitHub'
$tempRoot = Join-Path $env:TEMP ('hashcod-codespace-install-' + [guid]::NewGuid().ToString('N'))
$zip = Join-Path $tempRoot 'hashcod-codespace.zip'
$extract = Join-Path $tempRoot 'extract'
New-Item -ItemType Directory -Force -Path $tempRoot, $extract | Out-Null

try {
    Invoke-WebRequest -Uri $RepoZip -OutFile $zip -UseBasicParsing
    Expand-Archive -LiteralPath $zip -DestinationPath $extract -Force
    $source = Get-ChildItem -LiteralPath $extract -Directory | Select-Object -First 1
    if (-not $source) { throw 'No se pudo extraer el repositorio descargado.' }

    Write-Step 'Sincronizando el codigo sin borrar tus datos locales'
    Copy-ProjectSafely -Source $source.FullName -Target $Destination
} finally {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}

# Garantiza que exista el area de datos local sin reemplazar nada que ya tenga.
$dataStorage = Join-Path $Destination 'data_storage'
New-Item -ItemType Directory -Force -Path $dataStorage | Out-Null

Write-Step 'Preparando variables locales'
$envFile = Join-Path $Destination '.env'
$envExample = Join-Path $Destination '.env.example'
if (-not (Test-Path -LiteralPath $envFile)) {
    if (Test-Path -LiteralPath $envExample) {
        Copy-Item -LiteralPath $envExample -Destination $envFile -Force
    } else {
        New-Item -ItemType File -Path $envFile -Force | Out-Null
    }
}

# El router local calcula automaticamente / o /Hashcod%20Codespace/ segun como
# se abra la plataforma, por eso no fijamos un L8_PUBLIC_BASE global.
Set-EnvValue $envFile 'L8_PUBLIC_BASE' ''
Set-EnvValue $envFile 'L8_TRUST_PROXY' '0'
Set-EnvValue $envFile 'L8_CORS_ORIGINS' ''
Set-EnvValue $envFile 'L8_REQUIRE_AUTH_MUTATIONS' '1'

# Stable local secrets; generate only when empty.
$current = Get-Content -LiteralPath $envFile -Raw
foreach ($key in @('L8_AUTH_PEPPER','L8_VAULT_MASTER_KEY','L8_DATA_ENCRYPTION_KEY','L8_TOKENS_UNLOCK_SEED')) {
    if ($current -notmatch "(?m)^$([Regex]::Escape($key))=.+$") {
        Set-EnvValue $envFile $key (New-HexSecret 32)
        $current = Get-Content -LiteralPath $envFile -Raw
    }
}

Write-Step 'Activando la interfaz completa y la animacion Rare UI en Laragon'
$localEntry = Join-Path $Destination 'laragon-local-entry.php'
$localRouter = Join-Path $Destination 'laragon-router.php'
$fullHtml = Join-Path $Destination '404.html'
$rareBundle = Join-Path $Destination 'components\rare-folder-entry.bundle.js'
foreach ($requiredFile in @($localEntry, $localRouter, $fullHtml, $rareBundle)) {
    if (-not (Test-Path -LiteralPath $requiredFile)) {
        throw "Falta un archivo requerido para la version local: $requiredFile"
    }
}

# Apache/Laragon: la raiz del directorio debe abrir la entrada local completa,
# no el index.php vacio que el proyecto conserva como punto de enrutamiento.
$htaccessPath = Join-Path $Destination '.htaccess'
if (Test-Path -LiteralPath $htaccessPath) {
    $ht = Get-Content -LiteralPath $htaccessPath -Raw
    if ($ht -notmatch '(?im)^\s*DirectoryIndex\s+laragon-local-entry\.php') {
        $ht = "DirectoryIndex laragon-local-entry.php index.php index.html`r`n" + $ht
    }
    $ht = $ht -replace 'RewriteRule \^\(\.\*\)\$ router\.php \[QSA,L\]', 'RewriteRule ^(.*)$ laragon-router.php [QSA,L]'
    Set-Content -LiteralPath $htaccessPath -Value $ht -Encoding UTF8
}

if (-not $SkipSupabasePrompt) {
    Write-Host ''
    Write-Host 'Supabase mantiene sincronizacion/persistencia entre dispositivos.' -ForegroundColor Yellow
    $cfg = Get-Content -LiteralPath $envFile -Raw
    $hasUrl = $cfg -match '(?m)^SUPABASE_URL=.+$'
    if (-not $hasUrl) {
        $url = Read-Host 'SUPABASE_URL (Enter para dejarlo pendiente)'
        if ($url) { Set-EnvValue $envFile 'SUPABASE_URL' $url.Trim() }
    }
    $cfg = Get-Content -LiteralPath $envFile -Raw
    if ($cfg -notmatch '(?m)^SUPABASE_PUBLISHABLE_KEY=.+$') {
        $pub = Read-Host 'SUPABASE_PUBLISHABLE_KEY / ANON KEY (Enter para dejarlo pendiente)'
        if ($pub) { Set-EnvValue $envFile 'SUPABASE_PUBLISHABLE_KEY' $pub.Trim() }
    }
    $cfg = Get-Content -LiteralPath $envFile -Raw
    if ($cfg -notmatch '(?m)^SUPABASE_SECRET_KEY=.+$') {
        $secret = Read-Host 'SUPABASE_SECRET_KEY / SERVICE ROLE (Enter para dejarlo pendiente)' -AsSecureString
        if ($secret.Length -gt 0) {
            $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
            try {
                $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
                Set-EnvValue $envFile 'SUPABASE_SECRET_KEY' $plain
            } finally {
                [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
            }
        }
    }
}

Write-Step 'Comprobando PHP de Laragon'
$php = Find-LaragonPhp
if (-not $php) {
    Write-Warning 'No encontre php.exe dentro de D:\laragon\bin\php. Activa/instala PHP 8.1+ en Laragon.'
} else {
    Write-Host "PHP: $php"
    & $php -v | Select-Object -First 1
    $modules = (& $php -m) -join "`n"
    $required = @('curl','openssl','mbstring','fileinfo','json')
    $missing = @()
    foreach ($m in $required) {
        if ($modules -notmatch "(?im)^$([Regex]::Escape($m))$") { $missing += $m }
    }
    if ($missing.Count -gt 0) {
        Write-Warning ('Extensiones PHP que debes habilitar en Laragon: ' + ($missing -join ', '))
    } else {
        Write-Host 'Extensiones PHP principales: OK' -ForegroundColor Green
    }
    & $php -l $localEntry
    & $php -l $localRouter
    & $php -l (Join-Path $Destination 'router.php')
}

Write-Step 'Creando accesos locales'
$openBat = Join-Path $Destination 'ABRIR-HASHCOD-CODESPACE.bat'
@"
@echo off
start "" "http://localhost/Hashcod%%20Codespace/"
"@ | Set-Content -LiteralPath $openBat -Encoding ASCII

$serverBat = Join-Path $Destination 'SERVIDOR-PHP-8000.bat'
$phpForBat = if ($php) { $php } else { 'php' }
@"
@echo off
cd /d "$Destination"
start "" "http://localhost:8000/"
"$phpForBat" -S localhost:8000 laragon-router.php
pause
"@ | Set-Content -LiteralPath $serverBat -Encoding ASCII

Write-Host ''
Write-Host 'INSTALACION LOCAL COMPLETADA' -ForegroundColor Green
Write-Host "Proyecto: $Destination"
Write-Host 'La pantalla inicial local usa la misma animacion Rare UI/React-Motion de produccion.' -ForegroundColor Green
Write-Host 'Opcion Laragon/Apache: http://localhost/Hashcod%20Codespace/'
Write-Host 'Opcion servidor PHP: ejecuta SERVIDOR-PHP-8000.bat'
Write-Host 'Si Laragon ya estaba abierto, pulsa Reload/Recargar para que Apache vea los cambios.'
Write-Host 'Tu .env y data_storage se preservan durante futuras actualizaciones.' -ForegroundColor Green
Write-Host 'Tu .env queda solo en la PC y no debe subirse a GitHub.' -ForegroundColor Yellow
