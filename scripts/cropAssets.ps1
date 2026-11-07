Add-Type -AssemblyName System.Drawing

$imgHome = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\reference\1 home ui.png")
Write-Host "Home Image Size: $($imgHome.Width) x $($imgHome.Height)"

# 1. Measure and crop Hero Banner
# Dark green card bounds in 887x1774
# Left X: ~28, Right X: ~859 (Width: 831)
# Top Y: ~240, Bottom Y: ~700 (Height: ~460)
$bannerRect = New-Object System.Drawing.Rectangle(28, 240, 831, 460)
$bannerCrop = $imgHome.Clone($bannerRect, $imgHome.PixelFormat)
$bannerCrop.Save("$PWD\public\assets\hero-banner.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bannerCrop.Dispose()
Write-Host "Saved hero-banner.png"

# 2. Extract Category Images (10 categories in 5 columns x 2 rows)
# Row 1 categories: Y ~ 890 to 1020
# Col 1 (Chips): X ~ 35, W ~ 140
# Col 2 (Sweets): X ~ 205, W ~ 140
# Col 3 (Halwa): X ~ 375, W ~ 140
# Col 4 (Laddu): X ~ 545, W ~ 140
# Col 5 (Mixture): X ~ 715, W ~ 140

# Row 2 categories: Y ~ 1060 to 1190
# Col 1 (Pickles): X ~ 35
# Col 2 (Dates): X ~ 205
# Col 3 (Nuts): X ~ 375
# Col 4 (Gift Packs): X ~ 545
# Col 5 (Combos): X ~ 715

$categories = @(
    @{ name = "cat-chips"; x = 32; y = 890; w = 150; h = 155 },
    @{ name = "cat-sweets"; x = 202; y = 890; w = 150; h = 155 },
    @{ name = "cat-halwa"; x = 372; y = 890; w = 150; h = 155 },
    @{ name = "cat-laddu"; x = 542; y = 890; w = 150; h = 155 },
    @{ name = "cat-mixture"; x = 712; y = 890; w = 150; h = 155 },
    @{ name = "cat-pickles"; x = 32; y = 1065; w = 150; h = 155 },
    @{ name = "cat-dates"; x = 202; y = 1065; w = 150; h = 155 },
    @{ name = "cat-nuts"; x = 372; y = 1065; w = 150; h = 155 },
    @{ name = "cat-gift-packs"; x = 542; y = 1065; w = 150; h = 155 },
    @{ name = "cat-combos"; x = 712; y = 1065; w = 150; h = 155 }
)

foreach ($cat in $categories) {
    $rect = New-Object System.Drawing.Rectangle($cat.x, $cat.y, $cat.w, $cat.h)
    $crop = $imgHome.Clone($rect, $imgHome.PixelFormat)
    $crop.Save("$PWD\public\assets\$($cat.name).png", [System.Drawing.Imaging.ImageFormat]::Png)
    $crop.Dispose()
}
Write-Host "Saved 10 category images"

# 3. Extract Bestseller Product Images
# Banana Chips product photo: X ~ 32, Y ~ 1318, W ~ 400, H ~ 240
$prod1Rect = New-Object System.Drawing.Rectangle(32, 1318, 400, 240)
$prod1Crop = $imgHome.Clone($prod1Rect, $imgHome.PixelFormat)
$prod1Crop.Save("$PWD\public\assets\prod-banana-chips.png", [System.Drawing.Imaging.ImageFormat]::Png)
$prod1Crop.Dispose()

# Cashew Halwa product photo: X ~ 455, Y ~ 1318, W ~ 400, H ~ 240
$prod2Rect = New-Object System.Drawing.Rectangle(455, 1318, 400, 240)
$prod2Crop = $imgHome.Clone($prod2Rect, $imgHome.PixelFormat)
$prod2Crop.Save("$PWD\public\assets\prod-cashew-halwa.png", [System.Drawing.Imaging.ImageFormat]::Png)
$prod2Crop.Dispose()
Write-Host "Saved bestseller product images"

$imgHome.Dispose()
