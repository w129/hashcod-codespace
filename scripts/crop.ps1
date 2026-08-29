Add-Type -AssemblyName System.Drawing
$imgPath = 'C:\Users\morap\.gemini\antigravity\scratch\native_server\logo.png'
$outPath = 'C:\Users\morap\.gemini\antigravity\scratch\native_server\logo_cropped.png'

$bytes = [System.IO.File]::ReadAllBytes($imgPath)
$ms = New-Object System.IO.MemoryStream(,$bytes)
$src = [System.Drawing.Bitmap]::FromStream($ms)

$minX = $src.Width
$maxX = 0
$minY = $src.Height
$maxY = 0

for ($x = 0; $x -lt $src.Width; $x++) {
    for ($y = 0; $y -lt $src.Height; $y++) {
        $p = $src.GetPixel($x, $y)
        if ($p.R -lt 220 -or $p.G -lt 220 -or $p.B -lt 220) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

if ($maxX -gt $minX -and $maxY -gt $minY) {
    $w = $maxX - $minX + 1
    $h = $maxY - $minY + 1
    $rect = New-Object System.Drawing.Rectangle($minX, $minY, $w, $h)
    $cropped = $src.Clone($rect, $src.PixelFormat)
    $src.Dispose()
    $ms.Dispose()
    $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Host "Recorte completo: $w x $h"
} else {
    $src.Dispose()
    $ms.Dispose()
    Write-Host "No recortado"
}
