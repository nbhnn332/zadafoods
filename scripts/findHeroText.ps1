Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-banana-chips-hero.png")

# Look for dark black/brown text pixels: R < 40, G < 40, B < 40
Write-Host "Dark text pixels in prod-banana-chips-hero:"
$count = 0
for ($y = 0; $y -lt 150; $y++) {
    for ($x = 0; $x -lt 250; $x++) {
        $c = $img.GetPixel($x, $y)
        if ($c.R -lt 30 -and $c.G -lt 30 -and $c.B -lt 30) {
            $count++
            if ($count -le 10) {
                Write-Host "Pixel at ($x, $y): R=$($c.R), G=$($c.G), B=$($c.B)"
            }
        }
    }
}
Write-Host "Total dark text pixels: $count"
$img.Dispose()
