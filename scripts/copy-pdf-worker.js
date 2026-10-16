const fs = require('fs');
const path = require('path');

const workerSource = require.resolve(
  'pdfjs-dist/build/pdf.worker.min.mjs'
);

const publicDir = path.join(process.cwd(), 'public');
const workerDestination = path.join(
  publicDir,
  'pdf.worker.min.mjs'
);

fs.mkdirSync(publicDir, { recursive: true });
fs.copyFileSync(workerSource, workerDestination);

console.log(
  'Copied matching PDF.js worker to public/pdf.worker.min.mjs'
);
