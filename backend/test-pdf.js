import { generatePdfFromHtml } from './src/services/pdfService.js';
import fs from 'fs';

const html = `<html><body><h1>Test Invoice PDF</h1><p>This is a test.</p></body></html>`;

generatePdfFromHtml(html)
  .then(buffer => {
    fs.writeFileSync('test.pdf', buffer);
    console.log('Test PDF generated successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Test PDF generation failed:', err);
    process.exit(1);
  });
