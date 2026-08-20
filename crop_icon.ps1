Add-Type -AssemblyName System.Drawing
$bitmap = [System.Drawing.Bitmap]::FromFile('e:\Projects\daas-delivery-poc\temp_logos\Lassi-Lounge-logo.png')

$minX = $bitmap.Width
$minY = $bitmap.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $bitmap.Height; $y++) {
    for ($x = 0; $x -lt $bitmap.Width; $x++) {
        $pixel = $bitmap.GetPixel($x, $y)
        if ($pixel.A -gt 10) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Bounding box: minX=$minX, minY=$minY, maxX=$maxX, maxY=$maxY"

if ($minX -le $maxX -and $minY -le $maxY) {
    $cropRect = New-Object System.Drawing.Rectangle($minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1))
    $cropped = $bitmap.Clone($cropRect, $bitmap.PixelFormat)
    
    # Make it white
    for ($y = 0; $y -lt $cropped.Height; $y++) {
        for ($x = 0; $x -lt $cropped.Width; $x++) {
            $pixel = $cropped.GetPixel($x, $y)
            if ($pixel.A -gt 10) {
                $newPixel = [System.Drawing.Color]::FromArgb($pixel.A, 255, 255, 255)
                $cropped.SetPixel($x, $y, $newPixel)
            } else {
                $newPixel = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
                $cropped.SetPixel($x, $y, $newPixel)
            }
        }
    }
    
    $cropped.Save('e:\Projects\daas-delivery-poc\single_restaurant_mobile\android\app\src\main\res\drawable\ic_notification_lassi.png', [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host 'Created tightly cropped white icon'
    $cropped.Dispose()
} else {
    Write-Host 'Could not find any non-transparent pixels'
}
$bitmap.Dispose()
