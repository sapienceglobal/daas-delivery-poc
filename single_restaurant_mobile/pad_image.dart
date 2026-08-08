import 'dart:io';
import 'package:image/image.dart' as img;

void main() async {
  // 1. Process the Icon (Center)
  final iconFile = File('assets/images/branded/lassi-lounge/Lassi-Lounge-icon.png');
  final iconImage = img.decodeImage(iconFile.readAsBytesSync())!;

  // Create a 1152x1152 square for Android 12 icon
  final squareSize = 1152;
  var paddedIcon = img.Image(width: squareSize, height: squareSize);
  
  // Fill with white (or transparent if we want, but white is safer)
  // For transparent background: img.fill(paddedIcon, color: img.ColorRgba8(255, 255, 255, 0));
  img.fill(paddedIcon, color: img.ColorRgba8(255, 255, 255, 255));

  // Resize icon to fit inside the safe zone (around 600x600)
  final resizedIcon = img.copyResize(iconImage, width: 600, maintainAspect: true);
  
  // Draw the resized icon onto the center of the padded square
  final offsetX = (squareSize - resizedIcon.width) ~/ 2;
  final offsetY = (squareSize - resizedIcon.height) ~/ 2;
  
  img.compositeImage(paddedIcon, resizedIcon, dstX: offsetX, dstY: offsetY);
  
  File('assets/images/branded/lassi-lounge/Lassi-Lounge-icon-padded.png').writeAsBytesSync(img.encodePng(paddedIcon));
  print('Created Lassi-Lounge-icon-padded.png');

  // 2. Process the Branding Logo (Bottom)
  final logoFile = File('assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png');
  final logoImage = img.decodeImage(logoFile.readAsBytesSync())!;

  // Make the branding logo have a specific aspect ratio, e.g., 3:1, without stretching the original
  // Let's create a canvas of 800x200 and center the logo inside it.
  var paddedLogo = img.Image(width: 800, height: 200);
  img.fill(paddedLogo, color: img.ColorRgba8(255, 255, 255, 255)); // White background
  
  // Resize logo to fit inside 600x150
  var resizedLogo = img.copyResize(logoImage, width: 600, maintainAspect: true);
  if (resizedLogo.height > 150) {
    resizedLogo = img.copyResize(resizedLogo, height: 150, maintainAspect: true);
  }

  final logoOffsetX = (800 - resizedLogo.width) ~/ 2;
  final logoOffsetY = (200 - resizedLogo.height) ~/ 2;

  img.compositeImage(paddedLogo, resizedLogo, dstX: logoOffsetX, dstY: logoOffsetY);

  File('assets/images/branded/lassi-lounge/Lassi-Lounge-logo-padded.png').writeAsBytesSync(img.encodePng(paddedLogo));
  print('Created Lassi-Lounge-logo-padded.png');
}
