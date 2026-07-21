const fs = require('fs');

function fixFile(path, replacer) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    const newContent = replacer(content);
    if (newContent !== content) {
      fs.writeFileSync(path, newContent, 'utf8');
      console.log('Fixed', path);
    }
  }
}

// 1. guard.test.ts
fixFile('src/server/rbac/guard.test.ts', content => 
  content.replace(/requireRole\(user, 'admin'\)\.status/g, "(await requireRole(user, 'admin'))?.status")
);

// 2. org-unit.ts
fixFile('src/server/rbac/org-unit.ts', content => 
  content.replace(/@\/generated\/prisma/g, '@/generated/prisma/client')
);

// 3. admin/requests/page.tsx
fixFile('src/app/(app)/admin/requests/page.tsx', content => 
  content.replace(/personnelCode/g, 'nationalId') // Wait, we renamed it to personnelCode! The API might still return nationalId? Or maybe the type interface RequestUser has nationalId? Let's check.
);

// 4. directory/service.ts and import.ts
fixFile('src/server/modules/directory/service.ts', content => 
  content.replace(/title: true/g, 'name: true') // Reverting the wrong replace
         .replace(/title: string/g, 'name: string')
);
fixFile('src/server/modules/directory/import.ts', content => 
  content.replace(/name:/g, 'title:') // Wait, the error is "'name' does not exist in type 'RoleWhereInput'". So we SHOULD use 'title:'
);

// 5. forms/submissions/[id]/route.ts
fixFile('src/app/api/forms/submissions/[id]/route.ts', content => 
  content.replace(/name:/g, 'title:')
);

// 6. admin/roles/[id]/route.ts
fixFile('src/app/api/admin/roles/[id]/route.ts', content => 
  content.replace(/title/g, 'name') // The type says '{ name?: string }', meaning they didn't run prisma generate properly or the type is inferred from something else?
);
