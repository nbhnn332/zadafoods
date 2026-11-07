Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-banana-chips-hero-backup.png")
$newImg = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$g = [System.Drawing.Graphics]::FromImage($newImg)
$g.DrawImage($img, 0, 0, $img.Width, $img.Height)

# The badge is in X: 0 to 230, Y: 40 to 125
# Let's inspect where the yellow badge and text are, and fill with the dark green background
for ($y = 0; $y -lt 140; $y++) {
    for ($x = 0; $x -lt 250; $x++) {
        $c = $img.GetPixel($x, $y)
        # Check if pixel is part of yellow badge or dark text or badge border
        # Yellow badge: R > 150, G > 120, B < 150
        # Dark text: R < 35, G < 35, B < 35
        # Badge shadow/border: R > 60, G > 50, B < 30
        $isBadge = ($c.R -gt 150 -and $c.G -gt 120 -and $c.B -lt 150) -or 
                   ($c.R -lt 35 -and $c.G -lt 35 -and $c.B -lt 35 -and $y -gt 35 -and $y -lt 120) -or
                   ($c.R -gt 70 -and $c.R -lt 150 -and $c.G -gt 60 -and $c.G -lt 130 -and $c.B -lt 50 -and $x -lt 230)
        
        if ($isBadge) {
            # Background at (5, 5) or smooth dark green
            $bgR = 18 + ($x % 3)
            $bgG = 32 + ($y % 3)
            $bgB = 0
            $newImg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $bgR, $bgG, $bgB))
        }
    }
}

$newImg.Save("$PWD\public\assets\prod-banana-chips-hero.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$newImg.Dispose()
$img.Dispose()
Write-Host "Cleaned all yellow badge and text pixels from prod-banana-chips-hero.png"
