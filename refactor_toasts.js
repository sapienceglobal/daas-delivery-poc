const fs = require('fs');
const path = require('path');

const libPath = path.join(__dirname, 'single_restaurant_mobile', 'lib');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  const toastImport = "import 'package:single_restaurant_mobile/utils/toast_utils.dart';\n";

  // Extremely broad regex to capture ANY ScaffoldMessenger...showSnackBar(...)
  // Because flutter code can have arbitrary newlines, we replace it using string methods or regex on the whole file
  // Let's just find "ScaffoldMessenger.of(context).showSnackBar" and replace the block manually or with AST... wait, it's safer to just replace them manually or use a simpler regex
  // Let's replace:
  // ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('...'), backgroundColor: Colors.red));
  // messenger.showSnackBar(...)

  // We'll just replace the most common ones missed
  // 1. orders_screen.dart
  content = content.replace(/ScaffoldMessenger\.of\(context\)\.showSnackBar\(const SnackBar\(content: Text\('Order cancelled successfully'\)\)\);/g, "ToastUtils.showSuccess(context, 'Order cancelled successfully');");
  content = content.replace(/ScaffoldMessenger\.of\(context\)\.showSnackBar\(SnackBar\(content: Text\(e\.toString\(\)\), backgroundColor: Colors\.red\)\);/g, "ToastUtils.showError(context, e.toString());");

  // 2. saved_cards_screen.dart
  content = content.replace(/ScaffoldMessenger\.of\(context\)\.showSnackBar\(SnackBar\(content: Text\('Error adding card: \$\{e\.toString\(\)\}'\)\)\);/g, "ToastUtils.showError(context, 'Error adding card: ${e.toString()}');");

  // 3. track_order_screen.dart
  content = content.replace(/ScaffoldMessenger\.of\(context\)\.showSnackBar\(const SnackBar\(content: Text\('Order cancelled successfully'\)\)\);/g, "ToastUtils.showSuccess(context, 'Order cancelled successfully');");
  content = content.replace(/ScaffoldMessenger\.of\(context\)\.showSnackBar\(SnackBar\(content: Text\(e\.toString\(\)\), backgroundColor: Colors\.red\)\);/g, "ToastUtils.showError(context, e.toString());");

  // 4. offers_screen.dart
  content = content.replace(/ScaffoldMessenger\.of\(context\)\.showSnackBar\(\s*SnackBar\(content: const Text\('Add items to cart first'\), backgroundColor: Colors\.red\.shade800\),\s*\);/g, "ToastUtils.showError(context, 'Add items to cart first');");
  content = content.replace(/ScaffoldMessenger\.of\(context\)\.showSnackBar\(\s*SnackBar\(\s*content: Text\('Coupon removed: \$\{e\.toString\(\)\.replaceAll\('Exception: ', ''\)\}'\),\s*backgroundColor: Colors\.orange,\s*\),\s*\);/g, "ToastUtils.showInfo(context, 'Coupon removed: ${e.toString().replaceAll(\\'Exception: \\', \\'\\')}');");

  // 5. main_screen.dart
  content = content.replace(/ScaffoldMessenger\.of\(context\)\.showSnackBar\(\s*const SnackBar\(content: Text\('Press back again to exit'\)\),\s*\);/g, "ToastUtils.showInfo(context, 'Press back again to exit');");

  // 6. loyalty_rewards_screen.dart
  content = content.replace(/messenger\.showSnackBar\(const SnackBar\(content: Text\('Coupon code copied!'\), duration: Duration\(seconds: 2\)\)\);/g, "ToastUtils.showSuccess(context, 'Coupon code copied!');");
  content = content.replace(/messenger\.showSnackBar\(\s*const SnackBar\(content: Text\('Rewards feature is coming soon!'\)\),\s*\);/g, "ToastUtils.showInfo(context, 'Rewards feature is coming soon!');");
  content = content.replace(/messenger\.showSnackBar\(\s*SnackBar\(content: Text\(e\.toString\(\)\)\),\s*\);/g, "ToastUtils.showError(context, e.toString());");
  content = content.replace(/messenger\.showSnackBar\(\s*const SnackBar\(content: Text\('Coupon applied successfully!'\)\),\s*\);/g, "ToastUtils.showSuccess(context, 'Coupon applied successfully!');");
  content = content.replace(/ScaffoldMessenger\.of\(context\)\.showSnackBar\(\s*const SnackBar\(\s*content: Text\('Order placed successfully using rewards!'\),\s*backgroundColor: Colors\.green,\s*\),\s*\);/g, "ToastUtils.showSuccess(context, 'Order placed successfully using rewards!');");
  content = content.replace(/ScaffoldMessenger\.of\(context\)\.showSnackBar\(\s*SnackBar\(\s*content: Text\('Failed to place order: \$\{e\.toString\(\)\}'\),\s*backgroundColor: Colors\.red,\s*\),\s*\);/g, "ToastUtils.showError(context, 'Failed to place order: ${e.toString()}');");


  if (content !== originalContent) {
    if (!content.includes('toast_utils.dart')) {
      content = toastImport + content;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.dart') && !fullPath.includes('toast_utils.dart')) {
      processFile(fullPath);
    }
  }
}

walk(libPath);
console.log("Done");
