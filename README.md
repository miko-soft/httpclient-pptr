# @mikosoft/httpclient-pptr
> The HTTP client, utilizing Puppeteer and the Chrome/Chromium browser, is highly effective for accessing dynamic web pages.



## Features
- no dependencies
- **Dynamic Page Rendering:** This HTTP client can fully render and interact with dynamic web pages. It supports JavaScript execution, AJAX requests, and handles content generated dynamically through client-side scripting.
- **Headless Browsing:** It can run in a headless mode, which means it operates without a visible browser window. This feature is especially useful for automated tasks, web scraping, or testing where a graphical interface is not required.



## Installation
```bash
$ npm install --save @mikosoft/httpclient-pptr
```


## Options
Options is the object which is used as constructor parameter. The object properties are:
- **puppeteerLaunchOptions** :object - [https://pptr.dev/api/puppeteer.puppeteerlaunchoptions](https://pptr.dev/api/puppeteer.puppeteerlaunchoptions)
- **device** :string|object - device name of [KnownDevices](https://pptr.dev/api/puppeteer.knowndevices) or custom object {name, userAgent, viewport}
- **cookies** :object[] - array of cookies [{name, value, domain, path, expires, httpOnly, secure}, ...]
- **storage** :{local:object, session:object} - localStorage and sessionStorage *{local: {key1: val1, key2: val2, ...}, session: {key1: val1, key2: val2, ...}}*
- **evaluateOnNewDocument_callback** :Function - a callback function that will be executed in *page.evaluateOnNewDocument(this.opts.evaluateOnNewDocument_callback)*
- **extraRequestHeaders** :object - additional request headers
- **blockResources** :string[] - resuources to block during the request, for example: ['image', 'stylesheet', 'font', 'script']
- **gotoOpts** :object [goto options](https://pptr.dev/api/puppeteer.gotooptions) used in *page.goto(url, opts)* - {referer:string, timeout:number, waitUntil:'load'|'domcontentloaded'|'networkidle0'|'networkidle2'}
- **closeBrowser** :boolean - close the browser either after the response is received or if an error occurs during *page.goto(url)*
- **waitCSSselector** :{selector:string, timeout:number} - wait for CSS selector before sending answer -- default timeout is 10000ms
- **postGoto** :Function - function which will be executed after page.goto(), scroll, click on popup, etc. for example: *page => {page.evaluate(...);}*
- **debug** :boolean

## Example
```js
const puppeteer = require('puppeteer-core');
const { HttpClientPptr } = require('@mikosoft/httpclient-pptr');

const fetchURL = async () => {
  const opts = {
    puppeteerLaunchOptions: {
      executablePath: '/usr/bin/google-chrome',
      headless: false, // new, old, false
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
    closeBrowser: false, // close browser after answer is received or on page.goto error
    waitCSSselector: null,
    postGoto: null, // function which will be executed after page.goto(), scroll, click on popup, etc. for example: postGoto: page => {page.evaluate(...);}
    debug: false
  };
  const hcp = new HttpClientPptr(opts);
  hcp.injectPuppeteer(puppeteer);

  const answer = await hcp.askOnce(url);
  hcp.print(answer);
};


fetchURL().catch(console.log);
```


## API
#### constructor(opts)

#### injectPuppeteer(puppeteer)
Inject puppeteer or puppeteer-core. Check compatibility with the installed chrome browser [https://pptr.dev/chromium-support](https://pptr.dev/chromium-support) .


#### set_executablePath(pathsObj)
Define executable path to chrome or chrome based browser, for example:
```
{
  linux: '/usr/bin/google-chrome',
  win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
}
```


#### set_window(width:number, height:number, x:number, y:number)
Set window size and position.  If width or height has falsy value then window is maximized with *'--start-maximized'* arg.


#### set_device(dev :string|object)
Specify the device to be emulated. If a string is provided, it should match one of the [KnownDevices](https://pptr.dev/api/puppeteer.knowndevices). If an object is provided, a custom device configuration will be used.


#### set_cookies(cookieArr :object[])
Define a cookie array of objects that will be loaded before the page opens. The *cookieArr* is array of cookies *[{name, value, domain, path, expires, httpOnly, secure}, ...]*.


#### set_storage(storageObj :{local:object, session:object})
Define a localStorage and sessionStorage object that will be loaded before the page opens.. The *storageObj* is *{local: {key1: val1, key2: val2, ...}, session: {key1: val1, key2: val2, ...}}*.


#### set_evaluateOnNewDocument(cb :Function)
Define callback function that will be executed within* page.evaluateOnNewDocument(cb)*.
It's useful to set *navigator.webdriver* to false:
```js
await page.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, 'webdriver', {
    get: () => false,
  });
});
```


### *async* askOnce(url) :Promise&lt;Answer&gt;
Get answer from the requested URL.

```js
ANSWER::
{
  requestMethod: 'GET',
  requestURL: 'https://www.dex8.com',
  finalURL: 'https://www.dex8.com/',
  status: 200,
  statusMessage: 'OK',
  decompressed: true,
  https: true,
  req: {
    headers: {
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
    }
  },
  res: {
    headers: {
      'access-control-allow-headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      'access-control-allow-methods': 'GET',
      'access-control-allow-origin': '*',
      'access-control-max-age': '3600',
      connection: 'keep-alive',
      'content-encoding': 'gzip',
      'content-type': 'text/html; charset=utf-8',
      date: 'Wed, 21 Aug 2024 10:04:17 GMT',
      server: 'nginx/1.17.10 (Ubuntu)',
      'transfer-encoding': 'chunked'
    },
    content: '<!DOCTYPE html><html lang="en" class=" js flexbox canvas canvastext webgl no-touch geolocation postmessage no-websqldatabase indexeddb hashchange history draganddrop websockets rgba hsla multiplebgs backgroundsize borderimage borderradius boxshadow textshadow opacity cssanimations csscolumns cssgradients cssreflections csstransforms csstransforms3d csstransitions fontface generatedcontent video audio localstorage sessionstorage webworkers no-applicationcache svg inlinesvg smil svgclippaths"><head>\n' +
      '  <meta charset="UTF-8">\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '  <title>DEX8 - Data Extraction and Browser Automation SaaS</title>\n' +
      '  <meta name="description" content="The ultimate SaaS platform for data extraction and task automation. Utilize web robots with custom or premade scripts from Turnkey Solutions for seamless data scraping.">\n' +
      '  <meta name="keywords" content="DEX8, Data extraction, Task automation, SaaS platform, Web robots, Data scraping, Turnkey Solutions, Workflow automation, Streamlining operations, Data processing, Web scraping, Data integration, Business efficiency, API integration, Custom scripts, Cloud-based solution">\n' +
      '  <meta name="author" content="MikoSoft">\n' +
      '  <meta name="robots" content="index,follow">\n' +
      '  <meta name="googlebot" content="index,follow">\n' +
      '  <link rel="icon" href="/favicon.ico" type="image/x-icon">\n' +
      '  \n' +
      '\n' +
      '  <!-- ---template--- -->\n' +
      '  <link rel="stylesheet" type="text/css" href="/tpl/css/bootstrap.min.css"><!-- bootstrap v4 css -->\n' +
      '  <link rel="stylesheet" type="text/css" href="/tpl/css/font-awesome.min.css"><!-- font-awesome css -->\n' +
      '  <link rel="stylesheet" type="text/css" href="/tpl/css/animate.css"><!-- animate css -->\n' +
      '  <link rel="stylesheet" type="text/css" href="/tpl/css/owl.carousel.css"><!-- owl.carousel css -->\n' +
      '  <link rel="stylesheet" type="text/css" href="/tpl/fonts/flaticon.css"><!-- flaticon css  -->\n' +
      '  <link rel="stylesheet" type="text/css" href="/tpl/css/rsmenu-main.css"><!-- rsmenu CSS -->\n' +
      '  <link rel="stylesheet" type="text/css" href="/tpl/css/magnific-popup.css"><!-- magnific popup css -->\n' +
      '  <link rel="stylesheet" type="text/css" href="/tpl/css/rsmenu-transitions.css"><!-- rsmenu transitions CSS -->\n' +
      '  <link rel="stylesheet" type="text/css" href="/tpl/style.css"> <!-- style css -->\n' +
      '  <link rel="stylesheet" type="text/css" href="/tpl/css/spacing.css"><!-- Spacing css -->\n' +
      '  <link rel="stylesheet" type="text/css" href="/tpl/css/responsive.css"> <!-- responsive css -->\n' +
      '\n' +
      '  <!-- css -->\n' +
      '  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/1.35.0/iconfont/tabler-icons.min.css" integrity="sha512-tpsEzNMLQS7w9imFSjbEOHdZav3/aObSESAL1y5jyJDoICFF2YwEdAHOPdOr1t+h8hTzar0flphxR76pd0V1zQ==" crossorigin="anonymous" referrerpolicy="no-referrer">\n' +
      '\n' +
      '  <!-- Google tag (gtag.js) -->\n' +
      '  <script async="" src="https://www.googletagmanager.com/gtag/js?id=G-DBGN72XCQD"></script>\n' +
      '  <script>\n' +
      '    window.dataLayer = window.dataLayer || [];\n' +
      '    function gtag() { dataLayer.push(argum'... 47480 more characters,
    cookies: [
      {
        name: '_ga',
        value: 'GA1.1.1239121796.1724234659',
        domain: '.dex8.com',
        path: '/',
        expires: 1758794658.550137,
        size: 30,
        httpOnly: false,
        secure: false,
        session: false,
        priority: 'Medium',
        sameParty: false,
        sourceScheme: 'Secure',
        partitionKey: undefined
      },
      {
        name: '_ga_DBGN72XCQD',
        value: 'GS1.1.1724234658.1.0.1724234658.0.0.0',
        domain: '.dex8.com',
        path: '/',
        expires: 1758794658.549311,
        size: 51,
        httpOnly: false,
        secure: false,
        session: false,
        priority: 'Medium',
        sameParty: false,
        sourceScheme: 'Secure',
        partitionKey: undefined
      }
    ],
    postGotoResult: undefined
  },
  time: {
    req: '2024-08-21T10:04:14.531Z',
    res: '2024-08-21T10:04:19.023Z',
    duration: 4.492
  }
}

```


#### print(answer)
Print (debug) answer object.


### License
The software licensed under [MIT](LICENSE).
