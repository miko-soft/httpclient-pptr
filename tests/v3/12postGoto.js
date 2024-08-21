const puppeteer = require('puppeteer-core');
const { HttpClientPptr } = require('../../index.js');


/**
 * $ node 12postGoto.js "https://www.dex8.com"
 */
const openURL = async (url) => {
  console.log(` ...opening "${url}"`);

  const postGoto = async page => {
    const h1 = await page.evaluate(() => {
      const h1Element = document.querySelector('h1');
      return h1Element ? h1Element.innerText : null;
    });
    return h1;
  };

  const opts = {
    puppeteerLaunchOptions: {
      executablePath: '',
      headless: false, // new, old, false
      devtools: false,  // open Chrome devtools
      dumpio: false, // If true, pipes the browser process stdout and stderr to process.stdout and process.stderr
      slowMo: 13,
      args: [
        `--window-size=1300,1000`,
        `--window-position=400,20`
      ],
      ignoreDefaultArgs: [
        '--enable-automation' // remove "Chrome is being controlled by automated test software"
      ],
      defaultViewport: null, // override default viewport size {width: 800, height: 600} - https://pptr.dev/api/puppeteer.browserconnectoptions/#defaultviewport
    },
    device: null, // {name, userAgent, viewport}
    cookies: null, // [{name, value, domain, path, expires, httpOnly, secure}, ...]
    storage: null, // localStorage and sessionStorage {local: {key1: val1, key2: val2, ...}, session: {key1: val1, key2: val2, ...}}
    evaluateOnNewDocument_callback: null,
    extraRequestHeaders: {}, // additional HTTP request headers - {authorization: 'JWT ...'}
    blockResources: [], // resuources to block during the request, for example: ['image', 'stylesheet', 'font', 'script']
    gotoOpts: {}, // used in page.goto(url, opts) - {referer:string, timeout:number, waitUntil:'load'|'domcontentloaded'|'networkidle0'|'networkidle2'} - https://pptr.dev/api/puppeteer.gotooptions
    closeBrowser: false, // close browser after answer is received or on page.goto error
    // waitCSSselector: { selector: 'footer#bad', timeout: 5000 }, // bad css selector
    waitCSSselector: { selector: 'footer#rs-footer', timeout: 5000 }, // good css selector
    postGoto, // function which will be executed after page.goto(), scroll, click on popup, etc. for example: postGoto: page => {page.evaluate(...);}
    debug: false
  };
  const hcp = new HttpClientPptr(opts);


  hcp.injectPuppeteer(puppeteer);
  hcp.set_executablePath({ linux: '/usr/bin/google-chrome', win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });

  const answer = await hcp.askOnce(url);
  hcp.print(answer);
};


const url = process.argv[2];
openURL(url).catch(console.error);
