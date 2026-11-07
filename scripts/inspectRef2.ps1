Add-Type -AssemblyName System.Drawing
$ref = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\reference\2 home catogory ui.png")

# Let's inspect what colors/content are in the top-left of the first product (32, 700)
# and second product (455, 700)
# In Screen 2, did the original image have a badge?
# Let's crop clean images of the food without the badge, or let's inspect where the food is.
Write-Host "Screen 2 image loaded."
$ref.Dispose()
