const fs = require('fs');

let logRaw = fs.readFileSync('tsc-errors.log');
let log = logRaw.toString('utf16le');
if (log.charCodeAt(0) === 0xFEFF) {
  log = log.substring(1);
}

const lines = log.split('\n');

const fileChanges = {};

for (const line of lines) {
  const match = line.trim().match(/^(.+?)\((\d+),(\d+)\): error TS(\d+): (.+)$/);
  if (!match) continue;

  const filepath = match[1].trim();
  const lineNum = parseInt(match[2], 10);
  const colNum = parseInt(match[3], 10);
  const errorCode = match[4];
  const msg = match[5];

  if (!fileChanges[filepath]) fileChanges[filepath] = [];
  fileChanges[filepath].push({ lineNum, colNum, errorCode, msg });
}

let filesFixed = 0;

for (const [filepath, changes] of Object.entries(fileChanges)) {
  if (!fs.existsSync(filepath)) {
      console.log('Not found:', filepath);
      continue;
  }
  let content = fs.readFileSync(filepath, 'utf8').split('\n');
  let changed = false;

  for (const change of changes) {
    const { lineNum, errorCode, msg } = change;
    const lIdx = lineNum - 1;
    if (lIdx < 0 || lIdx >= content.length) continue;

    if (errorCode === '2353' && msg.includes("'name' does not exist in type 'RoleSelect")) {
      content[lIdx] = content[lIdx].replace(/\bname\b/, 'title');
      changed = true;
    }
    if (errorCode === '2353' && msg.includes("'title' does not exist in type 'UserSelect")) {
      content[lIdx] = content[lIdx].replace(/\btitle\b/, 'name');
      changed = true;
    }
    if (errorCode === '2339' && (msg.includes("Property 'title' does not exist on type '{ name: string") || msg.includes("Property 'title' does not exist on type '{ key: string; name: string; }'") || msg.includes("Property 'title' does not exist on type '{ id: string; key: string; name: string; rank: number; }'") || msg.includes("Property 'title' does not exist on type 'RoleOption'") || msg.includes("Property 'title' does not exist on type 'Role'"))) {
      content[lIdx] = content[lIdx].replace(/\.title\b/g, '.name');
      changed = true;
    }
    if (errorCode === '2353' && msg.includes("'name' does not exist in type '(Without<RoleCreateInput")) {
      content[lIdx] = content[lIdx].replace(/\bname\b/, 'title');
      changed = true;
    }
    if (errorCode === '2300' && msg.includes("Duplicate identifier 'personnelCode'")) {
        if (!content[lIdx].startsWith('//')) {
            content[lIdx] = '// ' + content[lIdx];
            changed = true;
        }
    }
    if (errorCode === '2687' || errorCode === '2717') {
         if (msg.includes("personnelCode") && !content[lIdx].startsWith('//')) {
             content[lIdx] = '// ' + content[lIdx];
             changed = true;
         }
    }
  }

  if (changed) {
    fs.writeFileSync(filepath, content.join('\n'), 'utf8');
    filesFixed++;
  }
}

console.log(`Fixed simple TS errors in ${filesFixed} files.`);
