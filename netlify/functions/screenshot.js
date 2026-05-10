const path = require('path');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const DEFAULT_SCREENSHOT_URL = 'https://example.com';
const VIEWPORT = { width: 600, height: 800 };

exports.handler = async function handler(event) {
  if (event.httpMethod === 'HEAD' || hasHealthcheck(event)) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  }

  const screenshotUrl = getScreenshotUrl(event);

  let browser;

  try {
    chromium.setGraphicsMode = false;
    const chromiumPackageRoot = path.dirname(require.resolve('@sparticuz/chromium/package.json'));
    const executablePath = await chromium.executablePath(path.join(chromiumPackageRoot, 'bin'));

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: VIEWPORT,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(screenshotUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    const screenshot = await page.screenshot({ type: 'png' });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
      isBase64Encoded: true,
      body: screenshot.toString('base64'),
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

function hasHealthcheck(event) {
  return event.queryStringParameters && event.queryStringParameters.health === '1';
}

function getScreenshotUrl(event) {
  const queryParamUrl = event.queryStringParameters && event.queryStringParameters.url;
  const rawUrl = queryParamUrl || process.env.SCREENSHOT_URL || DEFAULT_SCREENSHOT_URL;

  try {
    return new URL(rawUrl).toString();
  } catch (error) {
    throw new Error(`Invalid screenshot URL: ${rawUrl}`);
  }
}
