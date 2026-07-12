const fs = require('fs');

const filesToFix = [
  {
    path: 'prisma/seed.ts',
    fixes: [{ search: 'title,', replace: 'title: name,' }]
  },
  {
    path: 'src/server/db-seed.ts',
    fixes: [{ search: 'title,', replace: 'title: name,' }]
  },
  {
    path: 'src/app/api/admin/roles/route.ts',
    fixes: [{ search: 'title,', replace: 'title: name,' }]
  },
  {
    path: 'src/app/api/admin/roles/[id]/route.ts',
    fixes: [{ search: 'name:', replace: 'title:' }, { search: '.name', replace: '.title' }]
  },
  {
    path: 'src/server/modules/directory/service.ts',
    fixes: [{ search: 'role: { key: string; name: string }', replace: 'role: { key: string; title: string }' }, { search: 'name: true', replace: 'title: true' }]
  }
];

let count = 0;
for (const item of filesToFix) {
  if (fs.existsSync(item.path)) {
    let content = fs.readFileSync(item.path, 'utf8');
    let changed = false;
    for (const fix of item.fixes) {
      if (content.includes(fix.search)) {
        content = content.replaceAll(fix.search, fix.replace);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(item.path, content, 'utf8');
      count++;
    }
  }
}
console.log('Fixed', count, 'files manually');
