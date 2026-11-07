Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-banana-chips-hero.png")

# Let's check bowl rim pixels
for ($x = 20; $x -lt 350; $x += 40) {
    for ($y = 170; $y -lt 250; $y += 10) {
        $c = $img.GetPixel($x, $y)
        Write-Host "($x, $y): R=$($c.R), G=$($c.G), B=$($c.B)"
    }
}
$img.Dispose()
