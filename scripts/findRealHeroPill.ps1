Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-banana-chips-hero-backup.png")

$minX = 999; $maxX = 0; $minY = 999; $maxY = 0

for ($y = 0; $y -lt 180; $y++) {
    for ($x = 0; $x -lt 300; $x++) {
        $c = $img.GetPixel($x, $y)
        # Any pixel in badge region: yellow background or dark text
        # Dark text: R < 40, G < 40, B < 40
        # Yellow badge: R > 200, G > 170, B < 150
        if (($c.R -lt 40 -and $c.G -lt 40 -and $c.B -lt 40) -or ($c.R -gt 200 -and $c.G -gt 170 -and $c.B -lt 150)) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Real Badge Bounding Box in Hero: X: $minX to $maxX, Y: $minY to $maxY"
$img.Dispose()
