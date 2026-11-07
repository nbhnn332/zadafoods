Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\cat-chips.png")
Write-Host "cat-chips: $($img.Width) x $($img.Height)"
$img.Dispose()
$img2 = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-banana-chips.png")
Write-Host "prod-banana-chips: $($img2.Width) x $($img2.Height)"
$img2.Dispose()
