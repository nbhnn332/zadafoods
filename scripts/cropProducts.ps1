Add-Type -AssemblyName System.Drawing

function Crop-Image($sourcePath, $x, $y, $w, $h, $destPath) {
    $img = [System.Drawing.Bitmap]::FromFile($sourcePath)
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $crop = $img.Clone($rect, $img.PixelFormat)
    $crop.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $crop.Dispose()
    $img.Dispose()
    Write-Host "Cropped to $destPath ($w x $h)"
}

$ref2 = "$PWD\public\assets\reference\2 home catogory ui.png"

# In Screen 2: Product cards row 1 (Y ~ 700 to 915)
Crop-Image $ref2 32 700 400 215 "$PWD\public\assets\prod-banana-chips-cat.png"
Crop-Image $ref2 455 700 400 215 "$PWD\public\assets\prod-spicy-chips.png"

# In Screen 2: Product cards row 2 (Y ~ 1180 to 1395)
Crop-Image $ref2 32 1180 400 215 "$PWD\public\assets\prod-tapioca-chips.png"
Crop-Image $ref2 455 1180 400 215 "$PWD\public\assets\prod-sweet-chips.png"
