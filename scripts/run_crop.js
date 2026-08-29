const fs = require('fs');
const { execSync } = require('child_process');

// Script ejecutable de PowerShell con variables correctamente escapadas
const psScript = `
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Bitmap]::FromFile('C:\\Users\\morap\\.gemini\\antigravity\\brain\\e0ea0990-06cc-4200-88ac-11dd8948808f\\.user_uploaded\\media_1786050420223.png')

$minX = $src.Width
$maxX = 0
$minY = $src.Height
$maxY = 0

for ($x = 20; $x -lt ($src.Width - 20); $x++) {
    for ($y = 20; $y -lt ($src.Height - 20); $y++) {
        $p = $src.GetPixel($x, $y)
        if ($p.R -lt 100 -and $p.G -lt 100 -and $p.B -lt 100) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$w = $maxX - $minX + 1
$h = $maxY - $minY + 1
Write-Host "Recorte final: X=$minX Y=$minY W=$w H=$h"

$rect = New-Object System.Drawing.Rectangle($minX, $minY, $w, $h)
$cropped = $src.Clone($rect, $src.PixelFormat)
$src.Dispose()
$cropped.Save('C:\\Users\\morap\\.gemini\\antigravity\\scratch\\native_server\\logo.png', [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Dispose()
`;

fs.writeFileSync('C:\\Users\\morap\\.gemini\\antigravity\\scratch\\native_server\\do_crop.ps1', psScript);

try {
    const out = execSync('powershell -ExecutionPolicy Bypass -File C:\\Users\\morap\\.gemini\\antigravity\\scratch\\native_server\\do_crop.ps1');
    console.log(out.toString());
} catch(e) {
    console.error(e);
}
