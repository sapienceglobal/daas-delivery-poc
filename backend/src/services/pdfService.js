import puppeteer from 'puppeteer';
import logger from '../utils/logger.js';

/**
 * Generates a PDF buffer from a given HTML string.
 * @param {string} htmlContent - The full HTML string to render.
 * @returns {Promise<Buffer>} - The generated PDF buffer.
 */
export const generatePdfFromHtml = async (htmlContent) => {
  let browser;
  try {
    logger.info('Launching Puppeteer browser for PDF generation...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    
    // set the HTML content of the page
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });

    // generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    });

    logger.info('PDF generated successfully');
    return pdfBuffer;
  } catch (error) {
    logger.error('Failed to generate PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
