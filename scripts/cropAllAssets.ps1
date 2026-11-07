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

$ref1 = "$PWD\public\assets\reference\1 home ui.png"
$ref2 = "$PWD\public\assets\reference\2 home catogory ui.png"
$ref3 = "$PWD\public\assets\reference\3 product detail ui.png"
$ref4 = "$PWD\public\assets\reference\4cart ui.png"
$ref5 = "$PWD\public\assets\reference\5checkout ui.png"
$ref6 = "$PWD\public\assets\reference\6 Order Tracking web Screen.png"
$ref7 = "$PWD\public\assets\reference\7 Warm ZaDa Food Account Dashboard.png"

# 1. Hero Banner (Screen 1)
Crop-Image $ref1 28 240 831 460 "$PWD\public\assets\hero-banner.png"

# 2. Category Icons (Clean dish bowls, 150x120 without text)
# Row 1
Crop-Image $ref1 32 890 150 120 "$PWD\public\assets\cat-chips.png"
Crop-Image $ref1 202 890 150 120 "$PWD\public\assets\cat-sweets.png"
Crop-Image $ref1 372 890 150 120 "$PWD\public\assets\cat-halwa.png"
Crop-Image $ref1 542 890 150 120 "$PWD\public\assets\cat-laddu.png"
Crop-Image $ref1 712 890 150 120 "$PWD\public\assets\cat-mixture.png"

# Row 2
Crop-Image $ref1 32 1065 150 120 "$PWD\public\assets\cat-pickles.png"
Crop-Image $ref1 202 1065 150 120 "$PWD\public\assets\cat-dates.png"
Crop-Image $ref1 372 1065 150 120 "$PWD\public\assets\cat-nuts.png"
Crop-Image $ref1 542 1065 150 120 "$PWD\public\assets\cat-gift-packs.png"
Crop-Image $ref1 712 1065 150 120 "$PWD\public\assets\cat-combos.png"

# 3. Product Images
# Banana Chips Nendran (from Screen 3 large hero: 825 x 485)
Crop-Image $ref3 31 195 825 485 "$PWD\public\assets\prod-banana-chips-hero.png"

# Banana Chips Card Photo (from Screen 2: 400 x 238)
Crop-Image $ref2 31 395 401 238 "$PWD\public\assets\prod-banana-chips.png"

# Spicy Banana Chips Card Photo (from Screen 2: 400 x 238)
Crop-Image $ref2 455 395 401 238 "$PWD\public\assets\prod-spicy-chips.png"

# Tapioca Chips Card Photo (from Screen 2: 400 x 238)
Crop-Image $ref2 31 660 401 238 "$PWD\public\assets\prod-tapioca-chips.png"

# Sweet Banana Chips Card Photo (from Screen 2: 400 x 238)
Crop-Image $ref2 455 660 401 238 "$PWD\public\assets\prod-sweet-chips.png"

# Cashew Halwa Photo (from Screen 1 Bestseller: 400 x 140)
Crop-Image $ref1 455 742 400 140 "$PWD\public\assets\prod-cashew-halwa.png"

# Square Thumbnails from Screen 4 Cart
Crop-Image $ref4 61 220 186 186 "$PWD\public\assets\cart-banana-chips.png"
Crop-Image $ref4 61 525 186 186 "$PWD\public\assets\cart-cashew-halwa.png"
Crop-Image $ref4 61 832 186 186 "$PWD\public\assets\cart-kerala-mixture.png"

# Category Hero Banner from Screen 2
Crop-Image $ref2 30 228 827 242 "$PWD\public\assets\cat-hero-chips.png"

# PDP Thumbnails from Screen 3
Crop-Image $ref3 31 760 155 140 "$PWD\public\assets\pdp-thumb-1.png"
Crop-Image $ref3 203 760 155 140 "$PWD\public\assets\pdp-thumb-2.png"
Crop-Image $ref3 372 760 155 140 "$PWD\public\assets\pdp-thumb-3.png"
Crop-Image $ref3 538 760 155 140 "$PWD\public\assets\pdp-thumb-4.png"
Crop-Image $ref3 707 760 155 140 "$PWD\public\assets\pdp-thumb-5.png"

# Account Promo Banner from Screen 7
Crop-Image $ref7 61 1370 765 215 "$PWD\public\assets\account-promo-banner.png"

Write-Host "All reference assets extracted successfully!"
