import type { Browser } from 'puppeteer-core'
import puppeteerCore from 'puppeteer-core'

let browserInstance: Browser | null = null

function useBundledChromium(): boolean {
  return process.env.RENDER === 'true' || process.platform === 'linux'
}

async function launchBrowser(): Promise<Browser> {
  if (useBundledChromium()) {
    const chromium = await import('@sparticuz/chromium')
    chromium.default.setGraphicsMode = false
    return puppeteerCore.launch({
      args: chromium.default.args,
      defaultViewport: chromium.default.defaultViewport,
      executablePath: await chromium.default.executablePath(),
      headless: chromium.default.headless,
    })
  }

  const puppeteer = await import('puppeteer')
  return puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
}

async function getBrowser(): Promise<Browser> {
  if (browserInstance?.connected) return browserInstance
  browserInstance = await launchBrowser()
  return browserInstance
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser()
  const page = await browser.newPage()
  try {
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return Buffer.from(pdf)
  } finally {
    await page.close()
  }
}

export async function closePdfBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}
