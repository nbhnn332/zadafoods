Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-banana-chips-backup.png")
Write-Host "Pixel at (10, 5):" $img.GetPixel(10, 5).ToString()
Write-Host "Pixel at (150, 10):" $img.GetPixel(150, 10).ToString()
Write-Host "Pixel at (200, 40):" $img.GetPixel(200, 40).ToString()
$img.Dispose()
