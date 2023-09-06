const os = require('os');
const puppeteer = require('puppeteer-core');


// define chrome executable path
const osPlatform = os.platform(); // possible values are: 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'

// environment variables
const PROD_MODE = !(process.env.PROD_MODE === 'false'); // set to false if you want to test


let executablePath = '';
if (/^win/i.test(osPlatform)) {
  executablePath = '';
} else if (/^linux/i.test(osPlatform)) {
  executablePath = '/usr/bin/google-chrome'; // use google chrome instead of chromium
}


/*** define possible devices ***/
const my_devices = {
  'Desktop Linux': {
    name: 'Desktop Linux',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36',
    viewport: {
      width: 1300,
      height: 900,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      isLandscape: false

    }
  },
  'Desktop Windows': {
    name: 'Desktop Windows',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36',
    viewport: {
      width: 1300,
      height: 900,
      deviceScaleFactor: 0.5,
      isMobile: false,
      hasTouch: false,
      isLandscape: true
    }
  },
  'Desktop Macintosh': {
    name: 'Desktop Macintosh',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    viewport: {
      width: 1300,
      height: 900,
      deviceScaleFactor: 0.5,
      isMobile: false,
      hasTouch: false,
      isLandscape: true
    }
  }
};


/**
 * Send HTTP request via Chrome browser.
 * Chromium Browser HTTP Client:
 * 1. launch browser with URL
 * 2. extract HTML from the document
 * 3. close browser
 * @param {string} url - request URL - https://www.zacks.com/stock/quote/news?q=news
 * @param {string[]} block - what resuources to block during the request - ['image', 'stylesheet', 'font', 'script']
 * @param {object} extraHeaders - additional HTTP request headers - {authorization: 'JWT ...'}
 * @param {number} timeout - the request timeout in ms
 * @param {string} referer - the referer URL - 'https://www.dex8.com'
 * @param {string} deviceName - the device name - 'Desktop Windows'
 * @param {[offsetX, offsetY]} windowPosition - the browser window offset position in pixels [x, y], for example [700, 20]
 * @param {boolean} scroll - to scroll the content
 * @param {string} waitUntil - don't send response until 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
 * @param {'new'|'old'|false} headless - false => show browser window
 * @param {string[]} argsAppend - array of chrome arguments -- https://peter.sh/experiments/chromium-command-line-switches/
 * @returns
 */
const httpClientPptr = async (url, block = [], extraHeaders = {}, timeout = 13000, referer = '', deviceName = 'Desktop Windows', windowPosition = [700, 20], scroll = false, waitUntil = 'load', headless = 'new', argsAppend = []) => {

  /*** 1. form answer similar to @mikosoft/httpclient-nodejs */
  const answer = {
    requestURL: url,
    redirectedURL: undefined,
    requestMethod: undefined,
    status: 0,
    statusMessage: '',
    // httpVersion: undefined,
    gzip: undefined,
    deflate: undefined,
    https: undefined,
    // remoteAddress: // TODO
    // referrerPolicy: // TODO
    req: {
      headers: undefined,
      payload: undefined
    },
    res: {
      headers: undefined,
      content: undefined
    },
    time: {
      req: _getTime(),
      res: undefined,
      duration: undefined
    }
  };

  // get device
  const pup_devices = puppeteer.KnownDevices; // https://github.com/puppeteer/puppeteer/blob/master/src/DeviceDescriptors.ts
  const devices = { ...pup_devices, ...my_devices };
  const device = devices[deviceName];


  /*** 2. open browser */
  const browserWidth = device.viewport.width + 20;
  const browserHeight = device.viewport.height + 150;

  const args = [
    `--ash-host-window-bounds=${browserWidth}x${browserHeight}`,
    `--window-size=${browserWidth},${browserHeight}`,
    `--window-position=${windowPosition[0]},${windowPosition[1]}`
  ].concat(argsAppend);

  const puppeteerLaunchOptions = {
    executablePath,
    headless,
    devtools: false,  // Open Chrome devtools at the beginning of the test
    dumpio: false,
    slowMo: 13,  // Wait 13 ms each step of execution, for example chars typing
    args
  };
  const browser = await puppeteer.launch(puppeteerLaunchOptions).catch(console.log);
  if (!browser) { throw new Error(`The puppeteer didn't launch the browser with ${JSON.stringify(puppeteerLaunchOptions)}`); }
  const [page] = await browser.pages(); // open in first tab
  // const page = await browser.newPage(); // open new tab


  const requestResponseObj = {}; // {request, response}

  /*** 3. block resources ***/
  await page.setRequestInterception(true); // enable abort() and continue() methods -- https://pptr.dev/api/puppeteer.page.setrequestinterception
  page.on('request', request => {
    /* add extra headers */
    const headers = { ...request.headers(), ...extraHeaders };

    /* block resources: images, js, css, ... */
    const rt = request.resourceType(); // resource type
    const block_tf = block.indexOf(rt) !== -1;
    // console.log('resourceType:: ', rt, block_tf, request.method(), request.url());

    if (block_tf) { request.abort(); }
    else { request.continue({ headers }); }

    /* set answer props */
    requestResponseObj.request = request;
  });


  /*** 4. get status code & HTTP method (GET, POST, PUT, ...) ***/
  let SEARCH = true;
  page.on('response', response => {
    // console.log(response.status(), response.url(), response.statusText());

    requestResponseObj.response = response;

    // DEBUG
    // console.log('request::', requestResponseObj.request.url());
    // console.log('response::', requestResponseObj.response.url(), requestResponseObj.response.status(), requestResponseObj.response.headers());
    // console.log();


    // format answer on first 200 response
    const contentType = response.headers() ? response.headers()['content-type'] : '';
    if (SEARCH && response.status() === 200 && contentType.includes('text/html')) {
      SEARCH = false;

      answer.redirectedURL = requestResponseObj.request.url();
      answer.requestMethod = requestResponseObj.request.method();
      answer.req.headers = requestResponseObj.request.headers();
      answer.req.payload = requestResponseObj.request.postData();

      answer.status = requestResponseObj.response.status();
      answer.statusMessage = requestResponseObj.response.statusText();
      answer.res.headers = requestResponseObj.response.headers();
    }

  });



  /*** 5. set browser settings ***/
  // await page.bringToFront();
  await page.emulate(device);

  const width = device.viewport.width;
  const height = device.viewport.height;
  await page.setViewport({ width, height });


  /*** 6. open URL ***/
  // get last response -- page.on('response', ...) catch all responses e.g. from all resources and redirects
  // referer = 'http://referer-test-chrome.net'; // uncomment to test referer
  let requestErrorMsg;
  await page.goto(url, { waitUntil, timeout, referer }).catch(err => {
    requestErrorMsg = err.message;
    PROD_MODE && browser.close();
    console.log('Browser is closed due to error in page.goto(). ', err.message);
  });

  // if no response do not execute further code
  if (requestErrorMsg) {
    answer.status = 400;
    answer.statusMessage = requestErrorMsg;
    return answer;
  }


  /*** 7. scroll to the bottom and extract whole HTML ***/
  answer.res.content = await page.evaluate(async (scroll) => {
    if (scroll) {
      // scroll to the page bottom
      const scrollHeight = document.body.scrollHeight; // maximal viewport height (also document.documentElement.scrollHeight can be used)
      const viewportHeight = window.innerHeight; // always constant regardless scrolling, changes only when browser window is resized
      window.scrollTo({
        top: scrollHeight - viewportHeight,
        left: 0,
        behavior: 'smooth'
      });
      await new Promise(resolve => setTimeout(resolve, 3000)); // small delay because of scroll
    }

    return document.documentElement.outerHTML;
  }, scroll);



  /*** 8. close opened browser ***/
  PROD_MODE && await browser.close();


  /*** 9. define other answer fields ***/
  answer.gzip = !!answer.res.headers['content-encoding'] ? /gzip/.test(answer.res.headers['content-encoding']) : false;
  answer.deflate = !!answer.res.headers['content-encoding'] ? /deflate/.test(answer.res.headers['content-encoding']) : false;
  answer.https = /^https/.test(answer.requestURL);
  if (/^3\d{2}/.test(answer.status)) { answer.redirectedURL = page.url(); }
  if (!!referer) { answer.req.headers.referer = referer; }
  answer.time.res = _getTime();
  answer.time.duration = _getTimeDiff(answer.time.req, answer.time.res); // duration in seconds

  // debug answer
  // delete answer.res.content;
  // console.log('answer:: ', answer);


  return answer;

};



/**
 * Get current date/time
 */
const _getTime = () => {
  const d = new Date();
  return d.toISOString();
};


/**
 * Get time difference in seconds
 */
const _getTimeDiff = (start, end) => {
  const ds = new Date(start);
  const de = new Date(end);
  return (de.getTime() - ds.getTime()) / 1000;
};



module.exports = httpClientPptr;
