Add-Type -AssemblyName System.Drawing
$ref = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\reference\2 home catogory ui.png")
Write-Host "Screen 2 dimensions: $($ref.Width) x $($ref.Height)"

# In Screen 2, where is the spicy banana chips photo?
# Original crop: 455, 700, 400, 215
# Let's inspect the pixels around (455, 700) to (855, 915)
$spicy = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\prod-spicy-chips.png")
Write-Host "Spicy width: $($spicy.Width), height: $($spicy.Height)"

# In prod-spicy-chips.png (400x215), where is the red ON OFFER badge?
# It's at the bottom right.
# Let's find the bounding box of orange/red pixels in bottom right:
for ($y = 150; $y -lt 215; $y++) {
    for ($x = 250; $x -lt 400; $x++) {
        $c = $spicy.GetPixel($x, $y)
        if ($c.R -gt 180 -and $c.G -lt 80 -and $c.B -lt 50) {
            # Red/orange badge pixel
        }
    }
}
$spicy.Dispose()
$ref.Dispose()
