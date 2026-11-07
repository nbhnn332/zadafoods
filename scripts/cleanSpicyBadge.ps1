Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-spicy-chips.png")

# Let's clone and patch the bottom-right rectangle (X: 245 to 395, Y: 140 to 210)
# We can sample from adjacent natural bowl texture around X: 150 to 245, Y: 140 to 210
# or blend with a smooth gradient matching the wooden table/bowl rim
$newImg = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$g = [System.Drawing.Graphics]::FromImage($newImg)
$g.DrawImage($img, 0, 0, $img.Width, $img.Height)

# Texture patch from adjacent region
$srcRect = New-Object System.Drawing.Rectangle(150, 140, 100, 65)
$destRect = New-Object System.Drawing.Rectangle(250, 140, 135, 65)

# Or copy pixels with a smooth feather
for ($y = 140; $y -lt [Math]::Min($img.Height, 206); $y++) {
    for ($x = 245; $x -lt [Math]::Min($img.Width, 395); $x++) {
        # Sample from (x - 90, y)
        $sampleX = [Math]::Max(140, $x - 90)
        $sampleColor = $img.GetPixel($sampleX, $y)
        
        # Soft darken slightly to match right vignette
        $factor = 0.92
        $r = [int]($sampleColor.R * $factor)
        $gCol = [int]($sampleColor.G * $factor)
        $b = [int]($sampleColor.B * $factor)
        $newImg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $r, $gCol, $b))
    }
}

$newImg.Save("$PWD\public\assets\prod-spicy-chips-clean.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$newImg.Dispose()
$img.Dispose()

Write-Host "Created clean spicy chips image without baked-in badge."
