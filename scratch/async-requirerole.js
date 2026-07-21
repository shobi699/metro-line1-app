const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      results.push(filePath);
    }
  }
  return results;
}

const files = walk(path.join(__dirname, 'src/app/api'));
let count = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('requireRole(') && !content.includes('await requireRole(')) {
    content = content.replace(/requireRole\s*\(/g, 'await requireRole(');
    fs.writeFileSync(file, content, 'utf8');
    count++;
  }
}
console.log(`Updated ${count} files to await requireRole`);
