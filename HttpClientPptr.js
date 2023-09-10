const os = require('os');
const util = require('util');

/**
 * Use chrome+puppeteer to extract HTML from a web page.
 */
class HttpClientPptr {
  /**
   * @param {object} opts - options
   * {
   *  headless :any - false => show browser window
   *  deviceName :string - the device name - 'Desktop Windows', 'Desktop Linux', 'Desktop Macintosh' or from https://pptr.dev/api/puppeteer.knowndevices
   *  windowPosition :[number, number] - the browser window offset position in pixels [x, y], for example [700, 20]
   *  timeout :number - the HTTP request timeout in ms
   *  referer :string - the referer URL, for example: 'https://www.dex8.com'
   *  block: :string[] - what resuources to block during the request, for example: ['image', 'stylesheet', 'font', 'script']
   *  scroll :boolean - scroll the content to the page end
   *  waitUntil :string - don't send response until 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
   *  argsAppend :string[] - array of chrome arguments -- https://peter.sh/experiments/chromium-command-line-switches/
   *  extraHeaders :object - additional HTTP request headers - {authorization: 'JWT ...'}
   *  closeBrowser :boolean - close browser after answer or page.goto error
   *  closePopups :string[] - CSS selectors to click to close popups
   *  debug :boolean
   * }
   */
  constructor(opts) {
    if (!!opts) {
      this.opts = opts;
    } else {
      this.opts = {
        headless: 'new',
        deviceName: 'Desktop Windows',
        windowPosition: [0, 0],
        timeout: 21000,
        referer: '',
        block: [],
        scroll: false,
        waitUntil: 'load',
        argsAppend: [],
        extraHeaders: {},
        closeBrowser: true,
        closePopups: [],
        debug: false
      };
    }
  }


  injectPuppeteer(puppeteer) {
    this.puppeteer = puppeteer;
  }



  /**
   * Define chrome executable path
   * @param {string} executablePath - for example: '/usr/bin/google-chrome'
   */
  defineExecutablePath(executablePath = '') {
    const osPlatform = os.platform(); // possible values are: 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'
    if (!executablePath && /^linux/i.test(osPlatform)) {
      executablePath = '/usr/bin/google-chrome'; // use google chrome instead of chromium
    } else if (!executablePath && /^win/i.test(osPlatform)) {
      executablePath = '';
    }
    this.executablePath = executablePath;
  }


  /**
   * Set device object.
   * @param {string} deviceName - selected device name - 'Desktop Windows', 'Desktop Linux', 'Desktop Macintosh' or from https://pptr.dev/api/puppeteer.knowndevices
   * @param {object[]} myDevices - array of custom defined devices
   * @returns {void}
   */
  setDeviceObject(deviceName = 'Desktop Windows', myDevices = []) {
    if (!myDevices.length) {
      myDevices = {
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
    } // \if
    const pup_devices = this.puppeteer.KnownDevices; // https://pptr.dev/api/puppeteer.knowndevices
    const devices = { ...pup_devices, ...myDevices };
    this.device = devices[deviceName];
  }


  /**
   *
   * @param {string} url - requested URL
   * @returns {object} - answer
   */
  async ask(url) {
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
        req: this._getTime(),
        res: undefined,
        duration: undefined
      }
    };


    /*** 2. open browser */
    const browserWidth = this.device.viewport.width + 20;
    const browserHeight = this.device.viewport.height + 150;

    const args = [
      `--ash-host-window-bounds=${browserWidth}x${browserHeight}`,
      `--window-size=${browserWidth},${browserHeight}`,
      `--window-position=${this.opts.windowPosition[0]},${this.opts.windowPosition[1]}`
    ].concat(this.opts.argsAppend);

    const puppeteerLaunchOptions = {
      executablePath: this.executablePath,
      headless: this.opts.headless,
      devtools: false,  // Open Chrome devtools at the beginning of the test
      dumpio: false,
      slowMo: 13,  // Wait 13 ms each step of execution, for example chars typing
      args
    };

    let browser = '';
    setTimeout(() => {
      if (!browser) { throw new Error(`The puppeteer didn't launch the browser with ${JSON.stringify(puppeteerLaunchOptions)}. Check compatibility between puppeteer-core and browser: https://www.npmjs.com/package/puppeteer-core?activeTab=versions`); }
    }, this.opts.timeout);
    browser = await this.puppeteer.launch(puppeteerLaunchOptions).catch(console.log);
    const [page] = await browser.pages(); // open in first tab
    // const page = await browser.newPage(); // open new tab


    let requestResponseArr = []; // [{request, response}]


    /*** 3. block resources ***/
    await page.setRequestInterception(true); // enable abort() and continue() methods -- https://pptr.dev/api/puppeteer.page.setrequestinterception
    page.on('request', request => {
      /* add extra headers */
      const headers = { ...request.headers(), ...this.opts.extraHeaders };

      /* block resources: images, js, css, ... */
      const rt = request.resourceType(); // resource type
      const block_tf = this.opts.block.indexOf(rt) !== -1;
      this.opts.debug && console.log('on request::', rt, block_tf, request.method(), request.url());

      if (block_tf) { request.abort(); }
      else { request.continue({ headers }); }

      /* set answer props */
      requestResponseArr.push({ request });
    });


    /*** 4. format answer on first 200 response ***/
    page.on('response', response => {
      requestResponseArr = requestResponseArr.map(obj => {
        if (!!obj && obj.request.url() === response.url()) { obj.response = response; }
        return obj;
      });
    });



    /*** 5. set browser settings ***/
    // await page.bringToFront();
    await page.emulate(this.device);

    const width = this.device.viewport.width;
    const height = this.device.viewport.height;
    await page.setViewport({ width, height });


    /*** 6. open URL ***/
    // get last response -- page.on('response', ...) catch all responses e.g. from all resources and redirects
    // referer = 'http://referer-test-chrome.net'; // uncomment to test referer
    let requestErrorMsg;
    const gotoOpts = {
      waitUntil: this.opts.waitUntil,
      timeout: this.opts.timeout,
      referer: this.opts.referer
    };
    await page.goto(url, gotoOpts).catch(err => {
      requestErrorMsg = err.message;
      this.opts.closeBrowser && browser.close();
      console.log('Browser is closed due to error in page.goto():', err.message);
    });

    // if no response do not execute further code
    if (requestErrorMsg) {
      answer.status = 400;
      answer.statusMessage = requestErrorMsg;
      return answer;
    }


    /*** 7. close popups ***/
    for (const cssSelector of this.opts.closePopups) {
      const click_EH = await page.waitForSelector(cssSelector, { timeout: this.opts.timeout }).catch(err => console.log(err.message));
      if (!!click_EH) {
        await click_EH.click();
        await new Promise(r => setTimeout(r, 800));
      }
    }


    /*** 8. scroll to the bottom and extract HTML ***/
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
    }, this.opts.scroll);



    /*** 9. close opened browser ***/
    this.opts.closeBrowser && await browser.close();


    /*** 10. debug AND define answer fields ***/
    // DEBUG
    if (this.opts.debug) {
      for (const requestResponseObj of requestResponseArr) { // requestResponseObj:: {request, response}
        console.log();
        console.log('request::', requestResponseObj.request.url());
        requestResponseObj.response && console.log('response::', requestResponseObj.response.url(), requestResponseObj.response.status(), requestResponseObj.response.statusText(), requestResponseObj.response.headers());
        !requestResponseObj.response && console.log('response::');
        console.log();
      }
    }
    // define answer fields
    for (const requestResponseObj of requestResponseArr) { // requestResponseObj:: {request, response}
      const contentType = requestResponseObj.response.headers() ? requestResponseObj.response.headers()['content-type'] : '';
      if (requestResponseObj.response.status() === 200 && contentType.includes('text/html')) {
        answer.redirectedURL = requestResponseObj.request.url();
        answer.requestMethod = requestResponseObj.request.method();
        answer.req.headers = requestResponseObj.request.headers();
        answer.req.payload = requestResponseObj.request.postData();

        answer.status = requestResponseObj.response.status();
        answer.statusMessage = requestResponseObj.response.statusText();
        answer.res.headers = requestResponseObj.response.headers();

        break;
      }
    }



    /*** 11. define other answer fields ***/
    answer.gzip = !!answer.res.headers['content-encoding'] ? /gzip/.test(answer.res.headers['content-encoding']) : false;
    answer.deflate = !!answer.res.headers['content-encoding'] ? /deflate/.test(answer.res.headers['content-encoding']) : false;
    answer.https = /^https/.test(answer.requestURL);
    if (/^3\d{2}/.test(answer.status)) { answer.redirectedURL = page.url(); }
    if (!!this.opts.referer) { answer.req.headers.referer = this.opts.referer; }
    answer.time.res = this._getTime();
    answer.time.duration = this._getTimeDiff(answer.time.req, answer.time.res); // duration in seconds


    return answer;

  }



  /*** MISC ***/
  /**
   * Print the object to the console.
   * @param {object} obj
   */
  print(obj) {
    const opts = {
      showHidden: false,
      depth: 5,
      colors: true,
      customInspect: true,
      showProxy: false,
      maxArrayLength: 10,
      maxStringLength: 350,
      breakLength: 80,
      compact: false,
      sorted: false,
      getters: false,
      numericSeparator: false
    };
    console.log(util.inspect(obj, opts));
  }



  /*** PRIVATE ***/
  /**
 * Get current date/time
 */
  _getTime() {
    const d = new Date();
    return d.toISOString();
  }

  /**
   * Get time difference in seconds
   */
  _getTimeDiff(start, end) {
    const ds = new Date(start);
    const de = new Date(end);
    return (de.getTime() - ds.getTime()) / 1000;
  }




}



module.exports = HttpClientPptr;
