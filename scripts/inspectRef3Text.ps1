Add-Type -AssemblyName System.Drawing
$ref3 = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\reference\3 product detail ui.png")
Write-Host "Ref 3 dimensions: $($ref3.Width) x $($ref3.Height)"

# In Screen 3, where is the Best Seller pill?
# Screen 3 top has back button, cart, then the big product image.
# On the product image, where is the Best Seller pill?
# Let's inspect coordinates around X = 30 to 300, Y = 195 to 300:
for ($y = 195; $y -lt 300; $y += 5) {
    for ($x = 31; $x -lt 250; $x += 5) {
        $c = $ref3.GetPixel($x, $y)
        # Check for black text or badge border
        # The badge has text "BEST SELLER" in dark brown/black
        if ($c.R -lt 40 -and $c.G -lt 40 -and $c.B -lt 40) {
            Write-Host "Dark text pixel in pill at ($x, $y): R=$($c.R), G=$($c.G), B=$($c.B)"
        }
    }
}
$ref3.Dispose()
