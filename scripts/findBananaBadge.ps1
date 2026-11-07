Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-banana-chips.png")
Write-Host "Dimensions: $($img.Width) x $($img.Height)"

$minX = 999; $maxX = 0; $minY = 999; $maxY = 0

for ($y = 0; $y -lt 100; $y++) {
    for ($x = 0; $x -lt 200; $x++) {
        $c = $img.GetPixel($x, $y)
        # Yellow badge or dark text:
        if (($c.R -gt 180 -and $c.G -gt 140 -and $c.B -lt 140) -or ($c.R -lt 40 -and $c.G -lt 40 -and $c.B -lt 40)) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Yellow badge in prod-banana-chips: X: $minX to $maxX, Y: $minY to $maxY"
$img.Dispose()
