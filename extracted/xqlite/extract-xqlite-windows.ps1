# Extrae el código fuente legible de XQLite-Windows (sin _internal runtime).
# Uso:
#   powershell -ExecutionPolicy Bypass -File extract-xqlite-windows.ps1
# Opcional:
#   .\extract-xqlite-windows.ps1 -Source 'D:\XQLite-Windows\XQLite' -OutZip 'D:\XQLite-Windows-SOURCE.zip'

param(
  [string]$Source = 'D:\XQLite-Windows\XQLite',
  [string]$OutZip = 'D:\XQLite-Windows-SOURCE.zip',
  [string]$Staging = "$env:TEMP\xqlite-source-extract"
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $Source)) {
  throw "No existe: $Source"
}

if (Test-Path $Staging) { Remove-Item $Staging -Recurse -Force }
New-Item -ItemType Directory -Path $Staging | Out-Null

$vendor = Join-Path $Source 'vendor'
$assets = Join-Path $Source 'assets'
$db = Join-Path $Source 'xqlite.db'
$envFile = Join-Path $Source '.env'

# 1) vendor source (Python + catalog)
if (Test-Path $vendor) {
  Copy-Item $vendor (Join-Path $Staging 'vendor') -Recurse -Force
}

# 2) assets
if (Test-Path $assets) {
  Copy-Item $assets (Join-Path $Staging 'assets') -Recurse -Force
}

# 3) DB schema only (no full dump of secrets)
$schemaOut = Join-Path $Staging 'xqlite.schema.sql'
if (Test-Path $db) {
  Copy-Item $db (Join-Path $Staging 'xqlite.db') -Force
  $sqlite = Get-Command sqlite3 -ErrorAction SilentlyContinue
  if ($sqlite) {
    & sqlite3 $db '.schema' | Set-Content -Path $schemaOut -Encoding UTF8
    & sqlite3 $db '.tables' | Set-Content -Path (Join-Path $Staging 'xqlite.tables.txt') -Encoding UTF8
  } else {
    'sqlite3 CLI not found — DB file copied; open with DB Browser for SQLite' |
      Set-Content -Path (Join-Path $Staging 'xqlite.tables.txt') -Encoding UTF8
  }
}

# 4) .env keys only (values redacted)
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { $_ }
    elseif ($_ -match '^\s*([^=]+)=(.*)$') { "$($matches[1])=***REDACTED***" }
    else { $_ }
  } | Set-Content -Path (Join-Path $Staging '.env.redacted') -Encoding UTF8
}

# 5) inventory
Get-ChildItem $Source -Recurse -Force |
  Where-Object { $_.FullName -notmatch '\\_internal\\' } |
  Select-Object FullName, Length, LastWriteTime |
  Export-Csv -Path (Join-Path $Staging 'inventory-no-internal.csv') -NoTypeInformation -Encoding UTF8

# 6) concatenated source dump for easy paste
$dump = Join-Path $Staging 'ALL_VENDOR_SOURCE.txt'
$pyFiles = @()
if (Test-Path (Join-Path $Staging 'vendor')) {
  $pyFiles = Get-ChildItem (Join-Path $Staging 'vendor') -Recurse -Include *.py,*.json,*.md,*.txt -File |
    Where-Object { $_.Name -ne 'opencriptg_catalog.json' }  # catalog is huge; kept as file
}
$sb = New-Object System.Text.StringBuilder
foreach ($f in $pyFiles) {
  [void]$sb.AppendLine(('=' * 80))
  [void]$sb.AppendLine("FILE: $($f.FullName)")
  [void]$sb.AppendLine(('=' * 80))
  [void]$sb.AppendLine((Get-Content -Raw $f.FullName))
  [void]$sb.AppendLine()
}
$sb.ToString() | Set-Content -Path $dump -Encoding UTF8

# 7) zip
if (Test-Path $OutZip) { Remove-Item $OutZip -Force }
Compress-Archive -Path (Join-Path $Staging '*') -DestinationPath $OutZip -Force

Write-Host ""
Write-Host "OK -> $OutZip"
Write-Host "Staging -> $Staging"
Write-Host ""
Write-Host "Archivos fuente en vendor:"
Get-ChildItem (Join-Path $Staging 'vendor') -File | ForEach-Object {
  Write-Host ("  {0,10}  {1}" -f $_.Length, $_.Name)
}
Write-Host ""
Write-Host "Sube el zip al agente, o pega ALL_VENDOR_SOURCE.txt"
