const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const sharp = require('sharp');

const DEFAULT_SCREENSHOT_URL = 'https://example.com';
const VIEWPORT = { width: 600, height: 800 };

exports.handler = async function handler(event) {
  const screenshotUrl = getScreenshotUrl(event);

  let browser;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: VIEWPORT,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(screenshotUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    const screenshot = await page.screenshot({ type: 'png' });
    const image = await sharp(screenshot)
      .resize(VIEWPORT.width, VIEWPORT.height, {
        fit: 'contain',
        position: 'center',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .grayscale()
      .png({ quality: 100 })
      .toBuffer();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
      isBase64Encoded: true,
      body: image.toString('base64'),
    };
  } catch (error) {
    console.error('Failed to generate screenshot', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to generate screenshot',
        details: error.message,
      }),
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

function getScreenshotUrl(event) {
  const queryParamUrl = event.queryStringParameters && event.queryStringParameters.url;
  const rawUrl = queryParamUrl || process.env.SCREENSHOT_URL || DEFAULT_SCREENSHOT_URL;

  try {
    return new URL(rawUrl).toString();
  } catch (error) {
    throw new Error(`Invalid screenshot URL: ${rawUrl}`);
  }
}
