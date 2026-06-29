const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Temporarily read and dump loheadi (2).xlsx structure
try {
  const filePath = path.join(__dirname, 'lohe', 'loheadi (2).xlsx');
  if (fs.existsSync(filePath)) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    fs.writeFileSync(
      path.join(__dirname, 'temp-data.json'),
      JSON.stringify({
        sheetNames: workbook.SheetNames,
        rowsCount: rows.length,
        firstRows: rows.slice(0, 100)
      }, null, 2),
      'utf8'
    );
  }
} catch (err) {
  fs.writeFileSync(
    path.join(__dirname, 'temp-error.txt'),
    err.stack || err.message,
    'utf8'
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ]
      }
    ]
  }
};

module.exports = nextConfig;
