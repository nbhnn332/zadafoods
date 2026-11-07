Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-banana-chips-hero.png")

# What are the colors around (35..299, 97..199)?
# Above it: Y = 0..90
# Below it: Y = 200..250 (the wooden bowl rim)
# Left: X = 0..30
Write-Host "Pixel at (150, 50):" $img.GetPixel(150, 50).ToString()
Write-Host "Pixel at (150, 90):" $img.GetPixel(150, 90).ToString()
Write-Host "Pixel at (150, 205):" $img.GetPixel(150, 205).ToString()

$img.Dispose()
