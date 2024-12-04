const os = require('os');
const util = require('util');

/**
 * Use chrome+puppeteer to extract HTML from a web page.
 */
class HttpClientPptr {

  constructor(opts) {
    this.opts = opts ?? {
      puppeteerLaunchOptions: {
        executablePath: '',
        headless: 'new', // new, old, false
        devtools: false,  // open Chrome devtools
        dumpio: false, // If true, pipes the browser process stdout and stderr to process.stdout and process.stderr
        slowMo: 13,
        args: [
          '--start-maximized', // full window width and height
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
      closeBrowser: true, // close the browser either after the response is received or if an error occurs during `page.goto`.
      waitCSSselector: null, // {selector: 'div#article', timeout: 5000} --> default timeout is 10000ms
      postGoto: null, // function which will be executed after page.goto(), scroll, click on popup, etc. for example: postGoto: page => {page.evaluate(...);}
      debug: false
    };
  }


  /**
   * Inject puppeteer. Check version compatibility with installed chrome: https://pptr.dev/chromium-support
   * @param {Puppeteer} puppeteer - puppeteer-core (https://www.npmjs.com/package/puppeteer-core)
   */
  injectPuppeteer(puppeteer) {
    this.puppeteer = puppeteer;
  }


  /**
   * Define the Chrome executable path to ensure compatibility across all platforms.
   * @param {object} pathsObj - {linux: '/usr/bin/google-chrome', win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}
   */
  set_executablePath(pathsObj) {
    if (!pathsObj) { pathsObj = { linux: '/usr/bin/google-chrome', win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }; }
    const osPlatform = os.platform(); // possible values are: 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'
    this.opts.puppeteerLaunchOptions.executablePath = pathsObj[osPlatform];
  }


  /**
   * Set the window size and position. If either width or height is given a false value, the window will be set to full size.
   * @param {number} width - in pixels
   * @param {number} height - in pixels
   * @param {number} x - in pixels
   * @param {number} y - in pixels
   */
  set_window(width, height, x, y) {
    let args_win = [];
    if (!width || !height) { // full size
      args_win = [
        '--start-maximized'
      ];
      this.opts.puppeteerLaunchOptions.defaultViewport = null;
    } else {
      args_win = [
        `--window-size=${width},${height}`,
        `--window-position=${x},${y}`
      ];
    }
    this.opts.puppeteerLaunchOptions.args = [...new Set(this.opts.puppeteerLaunchOptions.args.concat(args_win))];
  }


  /**
   * Set device user-agent & viewport from puppeteer.KnownDevices or some custom defined object:
  {
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
  }
   * @param {string|object} dev - device name from KnownDevices or inject custom defined device
   */
  set_device(dev) {
    if (typeof dev === 'string') {
      const knownDevices = this.puppeteer.KnownDevices; // https://pptr.dev/api/puppeteer.knowndevices
      const knownDevice = knownDevices[dev];
      if (!knownDevice) { throw new Error(`The "${dev}" is not in the list of known devices. See https://pptr.dev/api/puppeteer.knowndevices`); }
      this.opts.device = knownDevices[dev];
    } else if (typeof dev === 'object' && dev?.userAgent && dev?.viewport) {
      this.opts.device = dev;
    } else {
      this.opts.device = null;
    }
  }


  /**
   * Define a cookie array of objects that will be loaded before the page opens.
   * @param {object[]} cookieArr - [{name, value, domain, path, expires, httpOnly, secure}, ...]
   */
  set_cookies(cookieArr) {
    this.opts.cookies = cookieArr;
  }


  /**
   * Define a localStorage and sessionStorage object that will be loaded before the page opens.
   * * @param {object[]} storageObj - {local:object, session:object}
   */
  set_storage(storageObj) {
    this.opts.storage = storageObj;
  }


  /**
   * Define callback function that will be executed within page.evaluateOnNewDocument().
   * It's useful to set navigator.webdriver to false:
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
   * @param {Function} cb
   */
  set_evaluateOnNewDocument(cb) {
    this.opts.evaluateOnNewDocument_callback = cb;
  }


  /**
   * Send HTTP request
   * @param {string} url - requested URL
   * @returns {object} - answer
   */
  async askOnce(url) {
    url = this._correctUrl(url);

    /*** 1. answer prototype (similar as @mikosoft/httpclient-nodejs) ***/
    const answer = {
      requestMethod: 'GET',
      requestURL: url,
      finalURL: '', // final browser's URL, i.e. url after redirections
      status: 0,
      statusMessage: '',
      decompressed: false,
      https: null,
      req: {
        headers: undefined
      },
      res: {
        headers: undefined,
        content: undefined,
        cookies: undefined,
        postGotoResult: undefined
      },
      time: {
        req: this._getTime(),
        res: undefined,
        duration: undefined
      },
    };


    /*** 2. open browser and tab ***/
    const browser = await this.puppeteer.launch(this.opts.puppeteerLaunchOptions).catch(console.log);
    const [page] = await browser.pages(); // open in first tab
    // const page = await browser.newPage(); // open new tab


    /*** 3. block resources - images, css, js, etc ***/
    await page.setRequestInterception(true); // enable abort() and continue() methods -- https://pptr.dev/api/puppeteer.page.setrequestinterception


    /*** 4.A catch requests ***/
    const request_response_map = new Map();
    page.on('request', request => {
      // add extra headers
      const headers = { ...request.headers(), ...this.opts.extraRequestHeaders };

      // block resources: images, js, css, ...
      const rt = request.resourceType(); // resource type: document, font, script, image
      const block_tf = this.opts.blockResources.includes(rt);
      block_tf ? request.abort() : request.continue({ headers });

      // save request
      const req_url = request.url();
      const map_obj = { request, response: null };
      request_response_map.set(req_url, map_obj);

      // DEBUG requests
      this.opts.debug && console.log('on request::', rt, `blocked:${block_tf}`, request.url(), request.method());
    });


    /* 4.B catch responses */
    page.on('response', response => {
      // save response
      const resp_url = response.url();
      const map_obj = request_response_map.get(resp_url);
      map_obj.response = response;
      request_response_map.set(resp_url, map_obj);

      // DEBUG responses
      this.opts.debug && console.log('on response::', response.url(), response.status());
    });


    /*** 5. emulate() is shortcut for setUserAgent() and setViewport() ***/
    this.opts.device && await page.emulate(this.opts.device);
    // await page.bringToFront();


    /*** 6. set cookies before page opens ***/
    this.opts.cookies && await page.setCookie(...this.opts.cookies);


    /*** 7. set localStorage and sessionStorage ***/
    this.opts.storage && await page.evaluateOnNewDocument(storageObj => {
      if (!!storageObj.local) {
        for (const [key, value] of Object.entries(storageObj.local)) {
          let val = value;
          if (val && typeof val === 'object') { val = JSON.stringify(val); }
          localStorage.setItem(key, val);
        }
      }
      if (!!storageObj.session) {
        for (const [key, value] of Object.entries(storageObj.session)) {
          let val = value;
          if (val && typeof val === 'object') { val = JSON.stringify(val); }
          sessionStorage.setItem(key, val);
        }
      }
    }, this.opts.storage);


    /*** 8. evaluateOnNewDocument - evaluate before page loads ***/
    this.opts.evaluateOnNewDocument_callback && await page.evaluateOnNewDocument(this.opts.evaluateOnNewDocument_callback);


    /*** 9. open URL and catch response with page.on('response', ...) ***/
    try {
      await page.goto(url, this.opts?.gotoOpts);
    } catch (err) {
      answer.status = this._getStatus(err);
      answer.statusMessage = `The pptr page.goto() error: ${err.message}`;
      this.opts.closeBrowser && await browser.close();
      return answer;
    }


    /*** 10. wait for CSS selector ***/
    !!this.opts.waitCSSselector?.selector && await page.waitForSelector(this.opts.waitCSSselector.selector, { timeout: this.opts.waitCSSselector.selector.timeout || 10000 }).catch(err => { answer.status = this._getStatus(err); answer.statusMessage = `The pptr page.waitForSelector() waitCSSselector error: ${err.message}`; });


    /*** 11. execute after the web page has loaded ***/
    if (this.opts.postGoto) { answer.res.postGotoResult = await this.opts.postGoto.call(this, page); }


    /*** 12. define other answer fields */
    // get content
    let content = '';
    try {
      content = await page.content();
    } catch (err) {
      answer.status = this._getStatus(err);
      answer.statusMessage = `The pptr page.content() error: ${err.message}`;
      content = await page.content();
    }

    // retrieve the final browser URL (after all redirections)
    const finalURL = page.url();

    // cookies
    const cookies = await page.cookies();

    // get document request and response from request_response_map
    const request_response_obj = request_response_map.get(finalURL);
    const documentRequest = request_response_obj?.request;
    const documentResponse = request_response_obj?.response;
    this.opts.debug && console.log('documentRequest::', documentRequest?.url(), documentRequest?.headers());
    this.opts.debug && console.log('documentResponse::', documentResponse?.url(), documentResponse?.status(), documentResponse?.statusText(), documentResponse?.headers());


    /*** 13. answer fields ***/
    answer.finalURL = finalURL;
    answer.status = answer.status || documentResponse?.status() || 0;
    answer.statusMessage = answer.statusMessage || documentResponse?.statusText() || '';
    answer.req.headers = documentRequest?.headers() || [];
    answer.res.headers = documentResponse?.headers() || [];
    answer.res.content = content;
    answer.res.cookies = cookies;
    answer.decompressed = answer.res.headers['content-encoding'] === 'gzip' || answer.res.headers['content-encoding'] === 'deflate';
    answer.https = /^https/.test(answer.finalURL);
    answer.time.res = this._getTime();
    answer.time.duration = this._getTimeDiff(answer.time.req, answer.time.res); // duration in seconds


    /*** 14. close opened browser ***/
    this.opts.closeBrowser && await browser.close();


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
      maxArrayLength: 100,
      maxStringLength: 3000,
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


  _getStatus(err) {
    let status;
    if (err.response) {
      status = err.response.status();
    } else if (err.name === 'TimeoutError') {
      status = 408; // request Timeout for waitForSelector timeout
    } else if (err.message.includes('No node found')) {
      status = 404; // not Found if the selector is not found
    } else if (err.message.includes('net::ERR')) {
      status = 503; //  Handle network errors (e.g., DNS failure, connection refused) -- Service Unavailable for network issues
    } else {
      status = 500; // Internal Server Error for other cases
    }
    return status;
  }

  /**
   * URL corrections
   */
  _correctUrl(url) {
    if (!url) { throw new Error('URL is not defined'); }
    if (typeof url !== 'string') { throw new Error('URL is not string data type'); }

    // 1. trim from left and right
    url = url.trim();

    // 2. add protocol
    if (!/^https?:\/\//.test(url)) {
      url = 'http://' + url;
    }

    // 3. remove multiple empty spaces and insert %20
    if (this.opts.encodeURI) {
      url = encodeURI(url);
    } else {
      url = url.replace(/\s+/g, ' ');
      url = url.replace(/ /g, '%20');
    }

    return url;
  }



}



module.exports = HttpClientPptr;
