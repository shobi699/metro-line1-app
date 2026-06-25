const XLSX = require('xlsx');
const path = require('path');

try {
  const filePath = path.resolve(__dirname, 'persenel.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log('Headers:', rows[0]);
  console.log('Row 1:', rows[1]);
  console.log('Row 2:', rows[2]);
  console.log('Total rows:', rows.length);
} catch (err) {
  console.error(err);
}
