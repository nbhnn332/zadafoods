Add-Type -AssemblyName System.Drawing

$ref3 = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\reference\3 product detail ui.png")
# Let's crop from X = 50, Y = 275, W = 780, H = 405
# This is completely below Y = 270 where the badge ended!
$rect = New-Object System.Drawing.Rectangle(50, 275, 780, 405)
$crop = $ref3.Clone($rect, $ref3.PixelFormat)
$crop.Save("$PWD\public\assets\prod-banana-chips-clean-hero.png", [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()
$ref3.Dispose()

Write-Host "Cropped clean hero image from Screen 3 below the badge line!"
