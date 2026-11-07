Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-banana-chips-hero.png")
Write-Host "Pixel at (150, 70):" $img.GetPixel(150, 70).ToString()
Write-Host "Pixel at (159, 60):" $img.GetPixel(159, 60).ToString()
$img.Dispose()
