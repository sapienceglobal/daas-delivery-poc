// Regenerates the 3 native-splash assets from your two source files:
//   assets/images/branded/lassi-lounge/Lassi-Lounge-icon.png   (cup symbol only)
//   assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png   (cup + "Lassi Lounge" text)
//
// Run with:  dart run pad_image.dart
// Then regenerate native files with: dart run flutter_native_splash:create

import 'dart:io';
import 'package:image/image.dart' as img;

const basePath = 'assets/images/branded/lassi-lounge';

void main() {
  // ---------------------------------------------------------------
  // 1. APP ICON (cup symbol only) -> native splash icon, 2 variants
  // ---------------------------------------------------------------
  final rawIcon =
      img.decodeImage(File('$basePath/Lassi-Lounge-icon.png').readAsBytesSync())!;
  final icon = img.trim(rawIcon, mode: img.TrimMode.transparent); // tight-crop to visible pixels

  // Legacy splash (Android < 12 + iOS): NOT masked by the OS, so keep the
  // canvas modest — a huge source image renders oversized/overflowing here.
  // Content fills ~79% of the canvas.
  _writeIconCanvas(
    icon,
    canvasSize: 480,
    contentHeight: 380,
    outPath: '$basePath/splash-icon.png',
  );

  // Android 12+ splash: the OS masks this inside a circle whose diameter is
  // 2/3 of the canvas — official flutter_native_splash spec is a 1152px
  // canvas with content safely inside a 768px circle. contentHeight=600
  // keeps a safety margin so nothing ever gets clipped by the mask.
  _writeIconCanvas(
    icon,
    canvasSize: 1152,
    contentHeight: 600,
    outPath: '$basePath/splash-icon-android12.png',
  );

  // ---------------------------------------------------------------
  // 2. WORDMARK (icon + "Lassi Lounge" text) -> small bottom branding image
  //    (this is the equivalent of your website navbar's text fallback,
  //    except it uses your real logo art instead of a system font)
  // ---------------------------------------------------------------
  final rawLogo =
      img.decodeImage(File('$basePath/Lassi-Lounge-logo.png').readAsBytesSync())!;
  final logo = img.trim(rawLogo, mode: img.TrimMode.transparent);

  const brandingWidth = 900;
  final brandingScale = brandingWidth / logo.width;
  final resizedLogo = img.copyResize(
    logo,
    width: brandingWidth,
    height: (logo.height * brandingScale).round(),
  );

  final padX = (resizedLogo.width * 0.05).round();
  final padY = (resizedLogo.height * 0.15).round();
  final branding = img.Image(
    width: resizedLogo.width + padX * 2,
    height: resizedLogo.height + padY * 2,
    numChannels: 4,
  );
  img.compositeImage(branding, resizedLogo, dstX: padX, dstY: padY);
  File('$basePath/splash-branding.png').writeAsBytesSync(img.encodePng(branding));
  print('Wrote $basePath/splash-branding.png (${branding.width}x${branding.height})');

  print('\nDone. Now run: dart run flutter_native_splash:create');
}

void _writeIconCanvas(
  img.Image content, {
  required int canvasSize,
  required int contentHeight,
  required String outPath,
}) {
  final scale = contentHeight / content.height;
  final resized = img.copyResize(
    content,
    width: (content.width * scale).round(),
    height: contentHeight,
  );

  // Fully transparent canvas — the splash BACKGROUND colour comes from
  // pubspec.yaml's `color` / `android_12.color`, never bake white in here.
  final canvas = img.Image(width: canvasSize, height: canvasSize, numChannels: 4);
  final x = (canvasSize - resized.width) ~/ 2;
  final y = (canvasSize - resized.height) ~/ 2;
  img.compositeImage(canvas, resized, dstX: x, dstY: y);

  File(outPath).writeAsBytesSync(img.encodePng(canvas));
  print('Wrote $outPath (canvas ${canvas.width}x${canvas.height}, '
      'content ${resized.width}x${resized.height})');
}