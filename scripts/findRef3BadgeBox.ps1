Add-Type -AssemblyName System.Drawing
$ref3 = [System.Drawing.Bitmap]::FromFile("$PWD\public\assets\reference\3 product detail ui.png")
$minY = 9999; $maxY = 0; $minX = 9999; $maxX = 0
for ($y = 195; $y -lt 500; $y++) {
    for ($x = 31; $x -lt 400; $x++) {
        $c = $ref3.GetPixel($x, $y)
        # Yellow badge background is #FAD982 or similar: R in 235..255, G in 190..230, B in 100..155
        if ($c.R -gt 235 -and $c.G -gt 190 -and $c.G -lt 230 -and $c.B -gt 100 -and $c.B -lt 155) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
Write-Host "Badge bounding box in Ref 3: X: $minX to $maxX, Y: $minY to $maxY"
$ref3.Dispose()
