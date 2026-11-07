Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-spicy-chips.png")
# Let's check colors in top-left, bottom-left, top-right, bottom-right
Write-Host "prod-spicy-chips corners:"
Write-Host "Top-left (10, 10):" $img.GetPixel(10, 10).ToString()
Write-Host "Top-right (390, 10):" $img.GetPixel(390, 10).ToString()
Write-Host "Bottom-left (10, 200):" $img.GetPixel(10, 200).ToString()
Write-Host "Bottom-right (390, 200):" $img.GetPixel(390, 200).ToString()
$img.Dispose()
