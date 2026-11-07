Add-Type -AssemblyName System.Drawing

$ref6 = "$PSScriptRoot\..\public\assets\reference\6 Order Tracking web Screen.png"
$img = [System.Drawing.Bitmap]::FromFile($ref6)

# The item card in Order Items is at X ~ 65, Y ~ 875, W ~ 110, H ~ 110
# Let's find the exact bounds:
# In 887x1774:
# Order items starts around Y=800
# First item image is around X=65, Y=870, W=110, H=110
$rect = New-Object System.Drawing.Rectangle(66, 768, 110, 110)
$crop = $img.Clone($rect, $img.PixelFormat)
$dest = "$PSScriptRoot\..\public\assets\order-banana-chips.png"
$crop.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()
$img.Dispose()
Write-Host "Saved $dest"
