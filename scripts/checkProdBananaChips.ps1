Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-banana-chips.png")
Write-Host "Pixel (50, 50):" $img.GetPixel(50, 50).ToString()
Write-Host "Pixel (200, 100):" $img.GetPixel(200, 100).ToString()
$img.Dispose()
