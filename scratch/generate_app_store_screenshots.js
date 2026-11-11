const path = require('path');
const sharp = require(path.join(__dirname, '../frontend/node_modules/sharp'));
const fs = require('fs');

const srcDir = 'E:/Projects/playstorelassilounge';

const targets = [
  {
    name: 'AppStore_Screenshots_6.7_inch',
    width: 1290,
    height: 2796,
    description: 'iPhone 6.7" / 6.9" Display (iPhone 15 Pro Max, 16 Pro Max, Plus)'
  },
  {
    name: 'AppStore_Screenshots_6.1_inch',
    width: 1179,
    height: 2556,
    description: 'iPhone 6.1" / 6.3" Display (iPhone 15 Pro, 16 Pro)'
  },
  {
    name: 'AppStore_Screenshots_6.5_inch',
    width: 1242,
    height: 2688,
    description: 'iPhone 6.5" Display (iPhone 11 Pro Max, XS Max)'
  }
];

const fileOrder = [
  { file: 'home.jpeg', out: '01_Home.jpg' },
  { file: 'menu.jpeg', out: '02_Menu.jpg' },
  { file: 'item-details.jpeg', out: '03_Item_Details.jpg' },
  { file: 'Cart.jpeg', out: '04_Cart_Checkout.jpg' },
  { file: 'Loyality-rewards.jpeg', out: '05_Loyalty_Rewards.jpg' },
  { file: 'allCategory.jpeg', out: '06_All_Categories.jpg' },
  { file: 'search.jpeg', out: '07_Search_Dishes.jpg' },
  { file: 'Help & Support.jpeg', out: '08_Help_Support.jpg' }
];

async function generateScreenshots() {
  console.log('Starting App Store screenshot generation...');

  for (const target of targets) {
    const outDir = path.join(srcDir, target.name);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    console.log(`\nGenerating for: ${target.name} (${target.width}x${target.height})`);

    for (const item of fileOrder) {
      const srcFile = path.join(srcDir, item.file);
      if (!fs.existsSync(srcFile)) {
        console.warn(`File not found: ${srcFile}`);
        continue;
      }

      const img = sharp(srcFile);
      const meta = await img.metadata();
      const raw = await img.raw().toBuffer();

      // Sample true top and bottom corner colors
      const topY = 15;
      const botY = meta.height - 15;
      const cornerX = 15;
      const tOff = (topY * meta.width + cornerX) * meta.channels;
      const bOff = (botY * meta.width + cornerX) * meta.channels;

      const topColor = { r: raw[tOff], g: raw[tOff + 1], b: raw[tOff + 2] };
      const botColor = { r: raw[bOff], g: raw[bOff + 1], b: raw[bOff + 2] };

      // Calculate scaled dimensions to preserve exact aspect ratio without cropping
      const targetW = target.width;
      const targetH = target.height;

      const scale = targetW / meta.width;
      const scaledH = Math.round(meta.height * scale);

      // Resize the core content
      const resized = await sharp(srcFile)
        .resize(targetW, scaledH, { fit: 'fill', kernel: 'lanczos3' })
        .toBuffer();

      const remainingH = targetH - scaledH;
      const topPad = Math.max(0, Math.floor(remainingH / 2));
      const botPad = Math.max(0, targetH - scaledH - topPad);

      const layers = [];

      if (topPad > 0) {
        const topImg = await sharp({
          create: { width: targetW, height: topPad, channels: 3, background: topColor }
        }).png().toBuffer();
        layers.push({ input: topImg, top: 0, left: 0 });
      }

      layers.push({ input: resized, top: topPad, left: 0 });

      if (botPad > 0) {
        const botImg = await sharp({
          create: { width: targetW, height: botPad, channels: 3, background: botColor }
        }).png().toBuffer();
        layers.push({ input: botImg, top: topPad + scaledH, left: 0 });
      }

      const outFile = path.join(outDir, item.out);
      await sharp({
        create: { width: targetW, height: targetH, channels: 3, background: topColor }
      })
        .composite(layers)
        .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
        .toFile(outFile);

      const stat = fs.statSync(outFile);
      console.log(`  ✓ ${item.out} -> ${(stat.size / 1024).toFixed(1)} KB`);
    }
  }

  // Also generate the optional Header Asset (3840 x 1646)
  const headerDir = path.join(srcDir, 'AppStore_Header_Asset');
  if (!fs.existsSync(headerDir)) fs.mkdirSync(headerDir, { recursive: true });

  const homeImg = path.join(srcDir, 'home.jpeg');
  if (fs.existsSync(homeImg)) {
    // Generate a sleek promotional banner for the header asset (3840 x 1646)
    const headerW = 3840;
    const headerH = 1646;

    // We take the biryani hero section from home.jpeg
    const heroCrop = await sharp(homeImg)
      .extract({ left: 30, top: 180, width: 740, height: 400 })
      .resize(headerW, headerH, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 92 })
      .toFile(path.join(headerDir, 'Header_Asset_3840x1646.jpg'));

    console.log(`\n✓ Header Asset generated: 3840x1646`);
  }

  console.log('\nAll App Store screenshots generated successfully!');
}

generateScreenshots().catch(console.error);
