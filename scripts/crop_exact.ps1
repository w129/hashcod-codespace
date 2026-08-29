
Add-Type -AssemblyName System.Drawing
$imgPath = 'C:\Users\morap\.gemini\antigravity\brain\e0ea0990-06cc-4200-88ac-11dd8948808f\.user_uploaded\media_1786050420223.png'
$outPath = 'C:\Users\morap\.gemini\antigravity\scratch\native_server\logo.png'

$bytes = [System.IO.File]::ReadAllBytes($imgPath)
$ms = New-Object System.IO.MemoryStream(,$bytes)
$src = [System.Drawing.Bitmap]::FromStream($ms)

$minX = 10000
$maxX = 0
$minY = 10000
$maxY = 0

for ($x = 40; $x -lt ($src.Width - 40); $x += 2) {
    for ($y = 40; $y -lt ($src.Height - 40); $y += 2) {
        $p = $src.GetPixel($x, $y)
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
Write-Host "LOGO BOUNDS EXACTOS SOBERANOS: X=$minX Y=$minY W=$w H=$h"

if ($w -gt 10 -and $h -gt 10) {
    $rect = New-Object System.Drawing.Rectangle($minX, $minY, $w, $h)
    $cropped = $src.Clone($rect, $src.PixelFormat)
    $src.Dispose()
    $ms.Dispose()
    $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Host "Logo recortado impecablemente en logo.png!"
}
