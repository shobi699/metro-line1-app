const XLSX = require('xlsx');
const path = require('path');

try {
  const filePath = path.resolve(__dirname, 'lohe', 'loheadi (2).xlsx');
  console.log('Reading file:', filePath);
  const workbook = XLSX.readFile(filePath);
  console.log('Sheet Names:', workbook.SheetNames);
  
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(`\nSheet: ${sheetName}`);
    console.log('Row count:', rows.length);
    console.log('First 20 rows:');
    rows.slice(0, 20).forEach((row, i) => {
      console.log(`Row ${i}:`, row);
    });
  }
} catch (err) {
  console.error(err);
}
