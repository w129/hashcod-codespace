const fs = require('fs');
const { execSync } = require('child_process');

const psCode = `
Add-Type -AssemblyName System.Drawing
$imgPath = 'C:\\Users\\morap\\.gemini\\antigravity\\brain\\e0ea0990-06cc-4200-88ac-11dd8948808f\\.user_uploaded\\media_1786050335867.png'
$outPath = 'C:\\Users\\morap\\.gemini\\antigravity\\scratch\\native_server\\logo.png'

$bytes = [System.IO.File]::ReadAllBytes($imgPath)
$ms = New-Object System.IO.MemoryStream(,$bytes)
$src = [System.Drawing.Bitmap]::FromStream($ms)

$minX = 10000
$maxX = 0
$minY = 10000
$maxY = 0

for ($x = 0; $x -lt $src.Width; $x++) {
    for ($y = 0; $y -lt $src.Height; $y++) {
        $p = $src.GetPixel($x, $y)
        # Detectar pixeles oscuros
        if ($p.R -lt 50 -and $p.G -lt 50 -and $p.B -lt 50) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$w = $maxX - $minX + 1
$h = $maxY - $minY + 1
Write-Host "LIMITES REALES DEL LOGO: X=$minX Y=$minY W=$w H=$h"

if ($w -gt 10 -and $h -gt 10) {
    $pad = 10
    $cropX = [Math]::Max(0, $minX - $pad)
    $cropY = [Math]::Max(0, $minY - $pad)
    $cropW = [Math]::Min($src.Width - $cropX, $w + ($pad * 2))
    $cropH = [Math]::Min($src.Height - $cropY, $h + ($pad * 2))

    $rect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
    $cropped = $src.Clone($rect, $src.PixelFormat)
    $src.Dispose()
    $ms.Dispose()
    $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Host "LOGOTIPO CORTE PERFECTO GUARDADO EN logo.png!"
}
`;

fs.writeFileSync('C:\\Users\\morap\\.gemini\\antigravity\\scratch\\native_server\\crop_logo_clean.ps1', psCode);

try {
    const out = execSync('powershell -ExecutionPolicy Bypass -File C:\\Users\\morap\\.gemini\\antigravity\\scratch\\native_server\\crop_logo_clean.ps1');
    console.log(out.toString());
} catch(e) {
    console.error(e.message);
}
