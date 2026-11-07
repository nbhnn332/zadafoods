Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-banana-chips-cat.png")
Write-Host "prod-banana-chips-cat dimensions: $($img.Width) x $($img.Height)"
$img.Dispose()
