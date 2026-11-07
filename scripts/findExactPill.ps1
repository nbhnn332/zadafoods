Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-banana-chips-hero-backup.png")

# Let's inspect yellow badge pixels specifically
$minX = 999; $maxX = 0; $minY = 999; $maxY = 0
for ($y = 0; $y -lt 300; $y++) {
    for ($x = 0; $x -lt 400; $x++) {
        $c = $img.GetPixel($x, $y)
        # Yellow badge background is #F7D070 or similar: R > 230, G > 180, B < 150
        if ($c.R -gt 230 -and $c.G -gt 180 -and $c.B -gt 80 -and $c.B -lt 160) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Real yellow badge pill box: X: $minX to $maxX, Y: $minY to $maxY"
$img.Dispose()
