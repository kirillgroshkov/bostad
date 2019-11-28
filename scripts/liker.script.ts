/*

DEBUG=nc* yarn tsn ./scripts/liker.script.ts

 */

import { pDelay } from '@naturalcycles/js-lib'
import { requireEnvKeys, runScript } from '@naturalcycles/nodejs-lib'
import { dayjs } from '@naturalcycles/time-lib'
import { Page } from 'puppeteer'
import * as puppeteer from 'puppeteer'
import { tmpDir } from '../src/paths.cnst'

const alertMode = false
let liked = 0
let skipped = 0

// todo: fix when "stuck on Dennis" (if name or id doesn't change after 2 clicks, or 1 click...)

runScript(async () => {
  // const {BOSTAD_LOGIN, BOSTAD_PW, BOSTAD_TOKEN} = requireEnvKeys('BOSTAD_LOGIN', 'BOSTAD_PW', 'BOSTAD_TOKEN')
  const { BOSTAD_TOKEN } = requireEnvKeys('BOSTAD_TOKEN')

  const browser = await puppeteer.launch({
    headless: false,
    // slowMo: 250,
    // devtools: true,
  })
  // const pages = await browser.pages()
  // console.log(pages)
  const page = await browser.newPage()
  // const [page] = await browser.pages()

  // page.on('console', msg => console.log('PAGE LOG:', msg.text()))
  // await page.evaluate(() => console.log(`url is ${location.href}`));

  await page.setViewport({
    width: 1380,
    height: 700,
    deviceScaleFactor: 0.5,
  })

  const expires = dayjs()
    .add(1, 'year')
    .unix()

  await page.setCookie({
    name: 'Access-Token',
    value: BOSTAD_TOKEN,
    domain: 'bostad.blocket.se',
    path: '/',
    expires,
  })

  await page.goto('https://bostad.blocket.se/profile/listings/')

  await page.click(`.CookieConsent .dialog-cta button.focus`)

  await page.waitForSelector('.matching-button')
  await page.click('.matching-button')

  while (true) {
    await processPerson(page)
  }

  /*
  await page.goto('https://bostad.blocket.se/login/')

  // const cookieButtonSelector = `.CookieConsent .dialog-cta button.focus`
  await page.click(`.CookieConsent .dialog-cta button.focus`)

  await page.click(`.SignupHandler a.button`)

  // await pDelay(3000)
  await page.waitForSelector(`input[type='email']`)
  await page.click(`input[type='email']`)
  await page.keyboard.type(BOSTAD_LOGIN)

  await page.click(`input[type='password']`)
  await page.keyboard.type(BOSTAD_PW)

   */

  await pDelay(100000)

  await page.screenshot({ path: `${tmpDir}/screen2.png` })

  await browser.close()
})

async function processPerson(page: Page): Promise<void> {
  await page.waitForSelector('.RentalProfileSection')
  const text = ((await page.$eval('.RentalProfileSection', s => s.textContent)) as any) as string
  console.log({ text })

  if (text.toLowerCase().includes('just me')) {
    // just me, click LIKE
    liked++
    console.log(`JUST ME - liking`, { liked, skipped })
    // await page.focus('.button.apply')
    if (alertMode) {
      await page.evaluate(`alert('LIKE')`)
    }
    await page.click('.button.apply')
  } else {
    // many people - skip
    console.log('many people, skipping', { liked, skipped })
    skipped++
    // await page.focus('.secondary.skip')
    if (alertMode) {
      await page.evaluate(`alert('SKIP')`)
    }
    await page.click('.secondary.skip')
  }

  // await page.waitForNavigation({ waitUntil: 'networkidle0' })

  await pDelay(2000)
}
