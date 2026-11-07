Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-banana-chips-clean-hero.png")
Write-Host "Dimensions: $($img.Width) x $($img.Height)"

# Check if there is any dark text or badge in top-left
$hasPill = $false
for ($y = 0; $y -lt 100; $y++) {
    for ($x = 0; $x -lt 200; $x++) {
        $c = $img.GetPixel($x, $y)
        # In Screen 3 the badge had text in black / dark brown
        if ($c.R -lt 30 -and $c.G -lt 30 -and $c.B -lt 30) {
            $hasPill = $true
        }
    }
}
Write-Host "Has pill text in top left: $hasPill"
$img.Dispose()
