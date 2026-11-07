Add-Type -AssemblyName System.Drawing
$ref = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\reference\2 home catogory ui.png")
Write-Host "Width: $($ref.Width), Height: $($ref.Height)"
$ref.Dispose()

$p1 = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-banana-chips-cat.png")
Write-Host "prod-banana-chips-cat: $($p1.Width) x $($p1.Height)"
$p1.Dispose()

$p2 = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-spicy-chips.png")
Write-Host "prod-spicy-chips: $($p2.Width) x $($p2.Height)"
$p2.Dispose()
