const fs = require('fs');

const filesToFix = [
  'prisma/seed.ts',
  'src/server/db-seed.ts'
];

let count = 0;
for (const file of filesToFix) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix the specific broken syntax
    content = content.replaceAll('title: name,', 'title,');
    content = content.replaceAll('f.title: name,', 'f.title,');
    content = content.replaceAll('title: f.title,', 'title: f.title,'); // no change
    
    // Now fix the real issue where title was meant to be used but it was a shorthand
    // The previous error was: No value exists in scope for the shorthand property 'title'.
    // That means there was a `{ title, ... }` where `name` was in scope instead of `title`.
    // Let's replace `{ title, ` with `{ title: name, `
    // Wait, the previous issue was: `error TS18004: No value exists in scope for the shorthand property 'title'. Either declare one or provide an initializer.`
    // Let's just fix it by replacing `{ ..., title, ... }` with `{ ..., title: name, ... }`. But wait, in Prisma create it's usually `name`. Let me just replace `title,` with `title: name,` ONLY IF it's NOT `f.title,` or `item.title,` or `x.title,`.
    
    content = content.replace(/(?<!\.)\btitle,/g, 'title: name,');
    // revert the one that might be wrong
    content = content.replaceAll('f.title: name,', 'f.title,');
    content = content.replaceAll('title: title: name,', 'title: name,');

    fs.writeFileSync(file, content, 'utf8');
    count++;
  }
}
console.log('Fixed', count, 'files manually');
