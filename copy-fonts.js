const fs = require('fs');
const path = require('path');

const srcDir = 'd:/zanjirenabodii/zanjirenabodi/fonts';
const destDir = 'd:/zanjirenabodii/app/metro-line1-app/mobile/assets/fonts';

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.readdirSync(srcDir).forEach(file => {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    console.log(`Copied ${file}`);
  });
  console.log('Fonts copied successfully!');
} catch (err) {
  console.error('Error copying fonts:', err);
}
