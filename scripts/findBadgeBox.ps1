Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-spicy-chips.png")

$minX = $img.Width
$maxX = 0
$minY = $img.Height
$maxY = 0

# Check strictly bottom-right: x > 250, y > 140
for ($y = 140; $y -lt $img.Height; $y++) {
    for ($x = 250; $x -lt $img.Width; $x++) {
        $c = $img.GetPixel($x, $y)
        # The badge is pure bright red-orange #E04010 or #D03010
        if ($c.R -gt 180 -and $c.G -lt 85 -and $c.B -lt 50) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Badge bounding box in bottom right: X: $minX to $maxX, Y: $minY to $maxY"
$img.Dispose()
