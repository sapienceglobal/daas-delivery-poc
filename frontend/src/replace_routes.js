const fs = require('fs');
const path = require('path');

const directory = __dirname;

const regex = /(['"`])\/customer(\/[^'"`]*)?(['"`])/g;

function processFile(filePath) {
  // Ignore this script itself
  if (filePath.endsWith('replace_routes.js')) return;

  const content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  const newContent = content.replace(regex, (match, p1, p2, p3) => {
    // If it's just '/customer', replace with '/'
    // If it's '/customer/orders', replace with '/orders'
    const newPath = p2 ? p2 : '/';
    return p1 + newPath + p3;
  });

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        walkDir(fullPath);
      }
    } else {
      if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
        processFile(fullPath);
      }
    }
  }
}

walkDir(directory);
console.log('Done!');
