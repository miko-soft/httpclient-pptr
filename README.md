# @mikosoft/httpclient-pptr
> The HTTP client, powered by Puppeteer and the Chrome/Chromium browser, excels at accessing dynamic web pages.



## Features
- **Dynamic Page Rendering:** This HTTP client can fully render and interact with dynamic web pages. It supports JavaScript execution, AJAX requests, and handles content generated dynamically through client-side scripting.
- **Headless Browsing:** It can run in a headless mode, which means it operates without a visible browser window. This feature is especially useful for automated tasks, web scraping, or testing where a graphical interface is not required.
- **Automatic Page Scrolling:** The HTTP client can automatically scroll to the bottom of a web page before retrieving its HTML content. This feature ensures that all dynamically loaded content is fetched, providing a comprehensive snapshot of the entire page's content, even when it extends beyond the initial viewport.



## Installation
```bash
$ npm install --save @mikosoft/httpclient-pptr
```


## Environment Variables
- **PROD_MODE** : Boolean (true/false) - When set to "true," it instructs the system to operate in production mode, optimizing memory usage by closing the browser once the page is loaded. The **true** is the default value.
In Linux the env variable can be set with command: ```export PROD_MODE="true"``` . 


## Parameters
 * @param {string} **url** - requested URL - https://www.dex8.com/docs
 * @param {string[]} **block** - what resuources to block during the request - ['image', 'stylesheet', 'font', 'script']
 * @param {object} **extraHeaders** - additional HTTP request headers - {authorization: 'JWT ...'}
 * @param {number} **timeout** - the request timeout in ms
 * @param {string} **referer** - the referer URL - 'https://www.dex8.com'
 * @param {string} **deviceName** - the device name - 'Desktop Windows' -- [https://pptr.dev/api/puppeteer.knowndevices](https://pptr.dev/api/puppeteer.knowndevices)
 * @param {[offsetX, offsetY]} **windowPosition** - the browser window offset position in pixels [x, y], for example [700, 20]
 * @param {boolean} **scroll** - to scroll the content
 * @param {string} **waitUntil** - don't send response until 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
 * @param {'new'|'old'|false} **headless** - false => show browser window
 * @param {string[]} **argsAppend** - array of arguments invoked on chrome start-- [https://peter.sh/experiments/chromium-command-line-switches/](https://peter.sh/experiments/chromium-command-line-switches/)
 * @param {boolean} **DEBUG**

## Example
```js
const util = require('util');
const { httpClientPptr } = require('@mikosoft/httpclient-pptr');

const getUrl = async () => {
  const url = process.argv[2];
  const block = [];
  const extraHeaders = {};
  const timeout = 13000;
  const referer = 'https://www.dex8.com';
  const deviceName = 'Desktop Windows';
  const windowPosition = [0, 0];
  const scroll = true;
  const waitUntil = 'load';
  const headless = false; // 'new' 'old' false
  const argsAppend = [
    // '--disable-dev-shm-usage',
    // '--use-gl=egl',
    // '--disable-setuid-sandbox',
    // '--no-first-run',
    // '--no-zygote',
    // '--single-process',
    // '--disable-gpu',
    // '--no-sandbox',
    // required for iframe
    // '--disable-web-security',
    // '--disable-features=IsolateOrigins,site-per-process',
  ];
  const DEBUG = false;

  console.log('asked url:: GET', url);
v  console.log(`\nanswer:`, util.inspect(answer, false, 3, true));
};


getUrl().catch(console.log);
```




### License
The software licensed under [MIT](LICENSE).
