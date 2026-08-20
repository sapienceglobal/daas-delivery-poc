Add-Type -AssemblyName System.Drawing
$bitmap = [System.Drawing.Bitmap]::FromFile('e:\Projects\daas-delivery-poc\temp_logos\Lassi-Lounge-logo.png')
$isTransparent = $false
for ($y = 0; $y -lt $bitmap.Height; $y++) {
    for ($x = 0; $x -lt $bitmap.Width; $x++) {
        $pixel = $bitmap.GetPixel($x, $y)
        if ($pixel.A -eq 0) {
            $isTransparent = $true
            break
        }
    }
    if ($isTransparent) { break }
}
if ($isTransparent) {
    for ($y = 0; $y -lt $bitmap.Height; $y++) {
        for ($x = 0; $x -lt $bitmap.Width; $x++) {
            $pixel = $bitmap.GetPixel($x, $y)
            if ($pixel.A -gt 0) {
                $newPixel = [System.Drawing.Color]::FromArgb($pixel.A, 255, 255, 255)
                $bitmap.SetPixel($x, $y, $newPixel)
            }
        }
    }
    $bitmap.Save('e:\Projects\daas-delivery-poc\single_restaurant_mobile\android\app\src\main\res\drawable\ic_notification_lassi.png', [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host 'Created transparent white icon'
} else {
    Write-Host 'Image has no transparency, cannot make white icon automatically.'
}
$bitmap.Dispose()
