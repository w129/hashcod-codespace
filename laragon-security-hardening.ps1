param(
    [string]$LaragonRoot = 'D:\laragon',
    [string]$ProjectRoot = 'D:\laragon\www\Hashcod Codespace',
    [string]$HostName = 'hashcod-codespace.test'
)

$ErrorActionPreference = 'Stop'

function Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Ensure-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Host 'Se requiere permiso de administrador para instalar el certificado y configurar Apache/hosts.' -ForegroundColor Yellow
        $args = @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + $PSCommandPath + '"'),'-LaragonRoot',('"' + $LaragonRoot + '"'),'-ProjectRoot',('"' + $ProjectRoot + '"'),'-HostName',$HostName)
        Start-Process powershell.exe -Verb RunAs -ArgumentList ($args -join ' ')
        exit 0
    }
}

function Find-OpenSSL {
    $candidates = @()
    $apacheRoot = Join-Path $LaragonRoot 'bin\apache'
    if (Test-Path -LiteralPath $apacheRoot) {
        $candidates += Get-ChildItem -LiteralPath $apacheRoot -Recurse -Filter openssl.exe -ErrorAction SilentlyContinue
    }
    $phpRoot = Join-Path $LaragonRoot 'bin\php'
    if (Test-Path -LiteralPath $phpRoot) {
        $candidates += Get-ChildItem -LiteralPath $phpRoot -Recurse -Filter openssl.exe -ErrorAction SilentlyContinue
    }
    $cmd = Get-Command openssl.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $first = $candidates | Sort-Object FullName -Descending | Select-Object -First 1
    if ($first) { return $first.FullName }
    return $null
}

function Find-ApacheDir {
    $root = Join-Path $LaragonRoot 'bin\apache'
    if (-not (Test-Path -LiteralPath $root)) { return $null }
    $httpd = Get-ChildItem -LiteralPath $root -Recurse -Filter httpd.exe -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1
    if ($httpd) { return $httpd.Directory.FullName }
    return $null
}

function Ensure-HttpdModule([string]$HttpdConf, [string]$ModuleName, [string]$ModulePath) {
    $text = Get-Content -LiteralPath $HttpdConf -Raw
    $escaped = [regex]::Escape("LoadModule $ModuleName $ModulePath")
    if ($text -match "(?im)^\s*LoadModule\s+$([regex]::Escape($ModuleName))\s+") { return }
    $commentPattern = "(?im)^\s*#\s*LoadModule\s+$([regex]::Escape($ModuleName))\s+$([regex]::Escape($ModulePath))\s*$"
    if ($text -match $commentPattern) {
        $text = [regex]::Replace($text, $commentPattern, "LoadModule $ModuleName $ModulePath", 1)
        Set-Content -LiteralPath $HttpdConf -Value $text -Encoding UTF8
    }
}

function Add-HostsEntry([string]$Name) {
    $hosts = Join-Path $env:SystemRoot 'System32\drivers\etc\hosts'
    $text = Get-Content -LiteralPath $hosts -Raw
    if ($text -notmatch "(?im)^\s*127\.0\.0\.1\s+.*\b$([regex]::Escape($Name))\b") {
        Add-Content -LiteralPath $hosts -Value "`r`n127.0.0.1`t$Name`r`n::1`t$Name" -Encoding ASCII
    }
}

function Write-LocalSecurityPhp([string]$Project) {
    $target = Join-Path $Project 'laragon-local-security.php'
    $php = @'
<?php
/** Local-only hardening for Hashcod Codespace under Laragon. */
$remote = (string)($_SERVER['REMOTE_ADDR'] ?? '');
if ($remote !== '' && !in_array($remote, ['127.0.0.1', '::1'], true)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Hashcod Codespace local: acceso permitido solo desde este equipo.';
    exit;
}

$isHttps = (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off')
    || ((int)($_SERVER['SERVER_PORT'] ?? 0) === 443);

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests");
header('Permissions-Policy: geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=()');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
if ($isHttps) {
    header('Strict-Transport-Security: max-age=31536000');
}

if (session_status() === PHP_SESSION_NONE) {
    @ini_set('session.use_strict_mode', '1');
    @ini_set('session.use_only_cookies', '1');
    @ini_set('session.cookie_httponly', '1');
    @ini_set('session.cookie_samesite', 'Strict');
    @ini_set('session.cookie_secure', $isHttps ? '1' : '0');
    @ini_set('session.sid_length', '64');
    @ini_set('session.sid_bits_per_character', '6');
}
'@
    Set-Content -LiteralPath $target -Value $php -Encoding UTF8

    $entry = Join-Path $Project 'laragon-local-entry.php'
    if (Test-Path -LiteralPath $entry) {
        $content = Get-Content -LiteralPath $entry -Raw
        if ($content -notmatch 'laragon-local-security\.php') {
            $content = $content -replace '^<\?php\s*', "<?php`r`n`$__hashcodLocalSecurity = __DIR__ . '/laragon-local-security.php';`r`nif (is_file(`$__hashcodLocalSecurity)) { require_once `$__hashcodLocalSecurity; }`r`n"
            Set-Content -LiteralPath $entry -Value $content -Encoding UTF8
        }
    }

    $userIni = @'
session.use_strict_mode=1
session.use_only_cookies=1
session.cookie_httponly=1
session.cookie_secure=1
session.cookie_samesite=Strict
session.sid_length=64
session.sid_bits_per_character=6
expose_php=Off
display_errors=Off
log_errors=On
'@
    Set-Content -LiteralPath (Join-Path $Project '.user.ini') -Value $userIni -Encoding ASCII
}

function Harden-ProjectHtaccess([string]$Project) {
    $path = Join-Path $Project '.htaccess'
    if (-not (Test-Path -LiteralPath $path)) { New-Item -ItemType File -Path $path | Out-Null }
    $text = Get-Content -LiteralPath $path -Raw
    $begin = '# HASHCOD LOCAL SECURITY BEGIN'
    $end = '# HASHCOD LOCAL SECURITY END'
    $block = @'
# HASHCOD LOCAL SECURITY BEGIN
Options -Indexes

<IfModule mod_authz_core.c>
    <RequireAll>
        Require local
    </RequireAll>
</IfModule>

<FilesMatch "(?i)^(?:\.env(?:\..*)?|.*\.(?:sql|sqlite|sqlite3|db|bak|backup|log|pem|key|pfx|p12)|composer\.(?:json|lock)|package(?:-lock)?\.json|yarn\.lock)$">
    Require all denied
</FilesMatch>

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(?:\.git|\.github|data_storage|rare-folder-build|node_modules)(?:/|$) - [F,L,NC]
</IfModule>

<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set Referrer-Policy "no-referrer"
    Header always set Permissions-Policy "geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=()"
    Header always set Content-Security-Policy "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests"
    Header always set Strict-Transport-Security "max-age=31536000" env=HTTPS
</IfModule>
# HASHCOD LOCAL SECURITY END
'@
    if ($text -match [regex]::Escape($begin)) {
        $pattern = "(?s)$([regex]::Escape($begin)).*?$([regex]::Escape($end))"
        $text = [regex]::Replace($text, $pattern, $block.Trim())
    } else {
        $text = $text.TrimEnd() + "`r`n`r`n" + $block.Trim() + "`r`n"
    }
    Set-Content -LiteralPath $path -Value $text -Encoding UTF8
}

Ensure-Administrator

if (-not (Test-Path -LiteralPath $LaragonRoot)) { throw "No existe Laragon en $LaragonRoot" }
if (-not (Test-Path -LiteralPath $ProjectRoot)) { throw "No existe Hashcod Codespace en $ProjectRoot" }

Step 'Localizando Apache y OpenSSL'
$apacheDir = Find-ApacheDir
if (-not $apacheDir) { throw 'No se encontro httpd.exe dentro de Laragon.' }
$httpd = Join-Path $apacheDir 'httpd.exe'
$httpdConf = Join-Path $apacheDir 'conf\httpd.conf'
$openssl = Find-OpenSSL
if (-not $openssl) { throw 'No se encontro openssl.exe. Activa/instala Apache SSL en Laragon e intenta de nuevo.' }
Write-Host "Apache: $apacheDir"
Write-Host "OpenSSL: $openssl"

Step 'Creando certificado HTTPS local confiable'
$sslDir = Join-Path $LaragonRoot 'etc\ssl\hashcod-codespace'
New-Item -ItemType Directory -Force -Path $sslDir | Out-Null
$rootKey = Join-Path $sslDir 'hashcod-local-ca.key'
$rootCrt = Join-Path $sslDir 'hashcod-local-ca.crt'
$leafKey = Join-Path $sslDir "$HostName.key"
$leafCsr = Join-Path $sslDir "$HostName.csr"
$leafCrt = Join-Path $sslDir "$HostName.crt"
$serial = Join-Path $sslDir 'hashcod-local-ca.srl'
$ext = Join-Path $sslDir 'hashcod-san.cnf'

if (-not (Test-Path -LiteralPath $rootCrt) -or -not (Test-Path -LiteralPath $rootKey)) {
    & $openssl genrsa -out $rootKey 4096
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la clave de la CA local.' }
    & $openssl req -x509 -new -nodes -key $rootKey -sha256 -days 3650 -subj '/CN=Hashcod Local Development CA' -out $rootCrt -addext 'basicConstraints=critical,CA:TRUE' -addext 'keyUsage=critical,keyCertSign,cRLSign'
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la CA local.' }
}

$extText = @"
[req]
distinguished_name=req_dn
prompt=no
req_extensions=v3_req
[req_dn]
CN=$HostName
[v3_req]
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=@alt_names
[alt_names]
DNS.1=$HostName
DNS.2=localhost
IP.1=127.0.0.1
IP.2=::1
"@
Set-Content -LiteralPath $ext -Value $extText -Encoding ASCII

& $openssl genrsa -out $leafKey 3072
if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la clave HTTPS local.' }
& $openssl req -new -key $leafKey -out $leafCsr -config $ext
if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la solicitud del certificado.' }
& $openssl x509 -req -in $leafCsr -CA $rootCrt -CAkey $rootKey -CAcreateserial -CAserial $serial -out $leafCrt -days 825 -sha256 -extfile $ext -extensions v3_req
if ($LASTEXITCODE -ne 0) { throw 'No se pudo firmar el certificado HTTPS local.' }

Import-Certificate -FilePath $rootCrt -CertStoreLocation 'Cert:\LocalMachine\Root' | Out-Null

# Restringir las claves privadas al sistema/administradores y al usuario actual.
$user = "$env:USERDOMAIN\$env:USERNAME"
foreach ($key in @($rootKey, $leafKey)) {
    & icacls.exe $key /inheritance:r /grant:r "SYSTEM:F" "Administrators:F" "$user:F" | Out-Null
}

Step 'Configurando nombre local seguro'
Add-HostsEntry $HostName

Step 'Activando mod_ssl, mod_headers y mod_rewrite si estan disponibles'
if (-not (Test-Path -LiteralPath $httpdConf)) { throw "No existe $httpdConf" }
Copy-Item -LiteralPath $httpdConf -Destination ($httpdConf + '.hashcod-security.bak') -Force
Ensure-HttpdModule $httpdConf 'ssl_module' 'modules/mod_ssl.so'
Ensure-HttpdModule $httpdConf 'socache_shmcb_module' 'modules/mod_socache_shmcb.so'
Ensure-HttpdModule $httpdConf 'headers_module' 'modules/mod_headers.so'
Ensure-HttpdModule $httpdConf 'rewrite_module' 'modules/mod_rewrite.so'

$httpdText = Get-Content -LiteralPath $httpdConf -Raw
if ($httpdText -notmatch '(?im)^\s*Listen\s+443\s*$') {
    Add-Content -LiteralPath $httpdConf -Value "`r`n# Hashcod local HTTPS`r`nListen 443`r`n" -Encoding ASCII
}
if ($httpdText -notmatch '(?im)IncludeOptional\s+.*sites-enabled') {
    $includePath = ($LaragonRoot -replace '\\','/') + '/etc/apache2/sites-enabled/*.conf'
    Add-Content -LiteralPath $httpdConf -Value "`r`nIncludeOptional `"$includePath`"`r`n" -Encoding ASCII
}

Step 'Creando VirtualHost HTTPS limitado a este equipo'
$sitesDir = Join-Path $LaragonRoot 'etc\apache2\sites-enabled'
New-Item -ItemType Directory -Force -Path $sitesDir | Out-Null
$vhostPath = Join-Path $sitesDir "$HostName.conf"
$doc = $ProjectRoot -replace '\\','/'
$cert = $leafCrt -replace '\\','/'
$key = $leafKey -replace '\\','/'
$vhost = @"
<VirtualHost 127.0.0.1:80>
    ServerName $HostName
    DocumentRoot "$doc"
    <Directory "$doc">
        Require local
        AllowOverride All
        Options -Indexes +FollowSymLinks
    </Directory>
    Redirect permanent / https://$HostName/
</VirtualHost>

<VirtualHost 127.0.0.1:443>
    ServerName $HostName
    DocumentRoot "$doc"

    SSLEngine on
    SSLProtocol -all +TLSv1.2 +TLSv1.3
    SSLCipherSuite HIGH:!aNULL:!MD5:!3DES:!RC4
    SSLCertificateFile "$cert"
    SSLCertificateKeyFile "$key"

    <Directory "$doc">
        Require local
        AllowOverride All
        Options -Indexes +FollowSymLinks
        DirectoryIndex laragon-local-entry.php index.php index.html
    </Directory>

    <LocationMatch "(?i)/(?:\.git|\.github|data_storage|rare-folder-build|node_modules)(?:/|$)">
        Require all denied
    </LocationMatch>

    <FilesMatch "(?i)^(?:\.env(?:\..*)?|.*\.(?:sql|sqlite|sqlite3|db|bak|backup|log|pem|key|pfx|p12)|composer\.(?:json|lock)|package(?:-lock)?\.json|yarn\.lock)$">
        Require all denied
    </FilesMatch>

    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set Referrer-Policy "no-referrer"
    Header always set Permissions-Policy "geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=()"
    Header always set Content-Security-Policy "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests"
    Header always set Strict-Transport-Security "max-age=31536000"
    Header always unset Server
</VirtualHost>
"@
Set-Content -LiteralPath $vhostPath -Value $vhost -Encoding ASCII

Step 'Endureciendo archivos y sesiones locales'
Write-LocalSecurityPhp $ProjectRoot
Harden-ProjectHtaccess $ProjectRoot

Step 'Validando configuracion de Apache'
& $httpd -t
if ($LASTEXITCODE -ne 0) {
    throw 'Apache detecto un error de configuracion. Se guardo un backup de httpd.conf con extension .hashcod-security.bak.'
}

Write-Host ''
Write-Host 'HARDENING LOCAL COMPLETADO' -ForegroundColor Green
Write-Host "URL segura: https://$HostName/" -ForegroundColor Green
Write-Host 'Controles aplicados:' -ForegroundColor Green
Write-Host '  - HTTPS con certificado local confiable'
Write-Host '  - acceso solo desde 127.0.0.1 / ::1'
Write-Host '  - bloqueo de .env, claves, backups, logs y data_storage'
Write-Host '  - directory listing desactivado'
Write-Host '  - CSP anti-frame/object + HSTS + nosniff + no-referrer'
Write-Host '  - cookies/sesiones PHP Secure, HttpOnly, SameSite=Strict cuando aplique'
Write-Host '  - claves TLS con ACL restringida'
Write-Host ''
Write-Host 'Ahora pulsa Reload/Recargar en Laragon o reinicia Apache y abre la URL segura.' -ForegroundColor Yellow
