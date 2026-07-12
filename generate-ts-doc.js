const fs = require('fs');
const path = require('path');

const mdPath = path.join('d:', 'zanjirenabodii', 'app', 'metro-line1-app', 'lohe', 'docs', 'گراف عیب‌یابی قطارهای AC و DC — درخت تصمیم راهبر 1d98c5dc1ea54fc99ab877213cc95186.md');
const content = fs.readFileSync(mdPath, 'utf8');

const escapedContent = content
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$/g, '\\$');

const tsContent = `export const TROUBLESHOOTING_GRAPH_MD = \`${escapedContent}\`;\n`;

const outPath = path.join('d:', 'zanjirenabodii', 'app', 'metro-line1-app', 'src', 'server', 'modules', 'ai', 'troubleshooting-docs.ts');
fs.writeFileSync(outPath, tsContent);
console.log('Created troubleshooting-docs.ts successfully.');
