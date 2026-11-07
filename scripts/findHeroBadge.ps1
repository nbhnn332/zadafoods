Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-banana-chips-hero.png")
Write-Host "Banana chips hero: $($img.Width) x $($img.Height)"

# In top-left (x: 0 to 200, y: 0 to 100), check yellow badge pixels:
$minX = $img.Width; $maxX = 0; $minY = $img.Height; $maxY = 0

for ($y = 0; $y -lt [Math]::Min($img.Height, 200); $y++) {
    for ($x = 0; $x -lt [Math]::Min($img.Width, 300); $x++) {
        $c = $img.GetPixel($x, $y)
        # Yellow badge: R > 200, G > 180, B < 120
        if ($c.R -gt 210 -and $c.G -gt 180 -and $c.B -lt 140) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Yellow badge bounding box: X: $minX to $maxX, Y: $minY to $maxY"
$img.Dispose()
