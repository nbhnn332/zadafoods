Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-banana-chips-hero.png")

$newImg = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$g = [System.Drawing.Graphics]::FromImage($newImg)
$g.DrawImage($img, 0, 0, $img.Width, $img.Height)

# Find yellow badge pixels and replace with dark green ambient background
for ($y = 80; $y -lt 165; $y++) {
    for ($x = 20; $x -lt 170; $x++) {
        $c = $img.GetPixel($x, $y)
        # Yellow badge or text pixels: R > 150, G > 120, B < 150
        if (($c.R -gt 150 -and $c.G -gt 120 -and $c.B -lt 150) -or ($c.R -lt 50 -and $c.G -lt 50 -and $c.B -lt 50 -and $x -gt 30 -and $x -lt 150 -and $y -gt 95 -and $y -lt 140)) {
            # Sample from dark green background above at (x, y - 60)
            $sampleY = [Math]::Max(15, $y - 65)
            $sampleColor = $img.GetPixel($x, $sampleY)
            $newImg.SetPixel($x, $y, $sampleColor)
        }
    }
}

$newImg.Save("$PWD\public\assets\prod-banana-chips-hero-clean.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$newImg.Dispose()
$img.Dispose()
Write-Host "Cleaned hero banana chips image."
