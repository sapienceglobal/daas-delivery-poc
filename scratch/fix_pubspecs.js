const fs = require('fs');
const path = require('path');

function fixPubspec(relPath) {
  const filePath = path.join(__dirname, '..', relPath);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix wrong placement under dependencies
  content = content.replace(
    'dependencies:\r\n  flutter:\r\n  config:\r\n    enable-swift-package-manager: false\r\n    sdk: flutter',
    'dependencies:\r\n  flutter:\r\n    sdk: flutter'
  );
  content = content.replace(
    'dependencies:\n  flutter:\n  config:\n    enable-swift-package-manager: false\n    sdk: flutter',
    'dependencies:\n  flutter:\n    sdk: flutter'
  );

  // Add correctly under top-level flutter: section
  const targetFlutter = '# The following section is specific to Flutter packages.\r\nflutter:\r\n';
  const replaceFlutter = '# The following section is specific to Flutter packages.\r\nflutter:\r\n  config:\r\n    enable-swift-package-manager: false\r\n';

  if (content.includes(targetFlutter) && !content.includes('flutter:\r\n  config:')) {
    content = content.replace(targetFlutter, replaceFlutter);
  } else {
    const targetFlutterLF = '# The following section is specific to Flutter packages.\nflutter:\n';
    const replaceFlutterLF = '# The following section is specific to Flutter packages.\nflutter:\n  config:\n    enable-swift-package-manager: false\n';
    if (content.includes(targetFlutterLF) && !content.includes('flutter:\n  config:')) {
      content = content.replace(targetFlutterLF, replaceFlutterLF);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', relPath);
}

fixPubspec('single_restaurant_mobile/pubspec.yaml');
fixPubspec('merchant_mobile/pubspec.yaml');

