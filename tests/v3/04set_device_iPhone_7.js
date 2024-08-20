const puppeteer = require('puppeteer-core');
const { HttpClientPptr } = require('../../index.js');

/**
 * $ node 04set_device_iPhone_7.js "https://www.dex8.com"
 */
const openURL = async (url) => {
  console.log(` ...opening "${url}"`);


  const opts = {
    puppeteerLaunchOptions: {
      executablePath: '',
      headless: false, // new, old, false
      devtools: false,  // open Chrome devtools
      dumpio: false, // If true, pipes the browser process stdout and stderr to process.stdout and process.stderr
      slowMo: 13,
      args: [],
      ignoreDefaultArgs: [
        '--enable-automation' // remove "Chrome is being controlled by automated test software"
      ],
      defaultViewport: null, // override default viewport size {width: 800, height: 600} - https://pptr.dev/api/puppeteer.browserconnectoptions/#defaultviewport
    },
    device: null, // {name, userAgent, viewport}
    cookies: null, // [{name, value, domain, path, expires, httpOnly, secure}, ...]
    evaluateOnNewDocument_callback: null,
    extraRequestHeaders: {}, // additional HTTP request headers - {authorization: 'JWT ...'}
    blockResources: [], // resuources to block during the request, for example: ['image', 'stylesheet', 'font', 'script']
    gotoOpts: {}, // used in page.goto(url, opts) - {referer:string, timeout:number, waitUntil:'load'|'domcontentloaded'|'networkidle0'|'networkidle2'} - https://pptr.dev/api/puppeteer.gotooptions
    closeBrowser: false, // close browser after answer is received or on page.goto error
    waitCSSselector: null,
    postGoto: null, // function which will be executed after page.goto(), scroll, click on popup, etc. for example: postGoto: page => {page.evaluate(...);}
    debug: false
  };
  const hcp = new HttpClientPptr(opts);


  hcp.injectPuppeteer(puppeteer);
  hcp.set_executablePath({ linux: '/usr/bin/google-chrome', win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  hcp.set_window(1300, 1000, 800, 50);
  hcp.set_device('iPhone 7'); // https://pptr.dev/api/puppeteer.knowndevices

  const answer = await hcp.askOnce(url);
  hcp.print(answer);
};


const url = process.argv[2];
openURL(url).catch(console.error);