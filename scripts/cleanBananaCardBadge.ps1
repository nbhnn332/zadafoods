Add-Type -AssemblyName System.Drawing
$bytes = [System.IO.File]::ReadAllBytes("$PWD\public\assets\prod-banana-chips-backup.png")
$ms = New-Object System.IO.MemoryStream($bytes, 0, $bytes.Length)
$img = [System.Drawing.Bitmap]::FromStream($ms)

$newImg = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$g = [System.Drawing.Graphics]::FromImage($newImg)
$g.DrawImage($img, 0, 0, $img.Width, $img.Height)

for ($y = 0; $y -lt 85; $y++) {
    for ($x = 0; $x -lt 165; $x++) {
        $c = $img.GetPixel($x, $y)
        $isBadge = ($c.R -gt 150 -and $c.G -gt 120 -and $c.B -lt 150) -or 
                   ($c.R -lt 40 -and $c.G -lt 40 -and $c.B -lt 40 -and $y -gt 10 -and $y -lt 70) -or
                   ($c.R -gt 60 -and $c.R -lt 150 -and $c.G -gt 60 -and $c.G -lt 130 -and $c.B -lt 50)
        
        if ($isBadge) {
            # Sample from the warm ambient studio background at (x + 160, y)
            $sampleX = [Math]::Min($img.Width - 1, $x + 160)
            $sampleColor = $img.GetPixel($sampleX, $y)
            $newImg.SetPixel($x, $y, $sampleColor)
        }
    }
}

$newImg.Save("$PWD\public\assets\prod-banana-chips-temp.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$newImg.Dispose()
$img.Dispose()
$ms.Dispose()

Move-Item "public\assets\prod-banana-chips-temp.png" "public\assets\prod-banana-chips.png" -Force
Write-Host "Patched prod-banana-chips.png with ambient studio texture."
