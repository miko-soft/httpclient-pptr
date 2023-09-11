# @mikosoft/httpclient-pptr
> The HTTP client, powered by Puppeteer and the Chrome/Chromium browser, excels at accessing dynamic web pages.



## Features
- no dependencies
- **Dynamic Page Rendering:** This HTTP client can fully render and interact with dynamic web pages. It supports JavaScript execution, AJAX requests, and handles content generated dynamically through client-side scripting.
- **Headless Browsing:** It can run in a headless mode, which means it operates without a visible browser window. This feature is especially useful for automated tasks, web scraping, or testing where a graphical interface is not required.
- **Automatic Page Scrolling:** The HTTP client can automatically scroll to the bottom of a web page before retrieving its HTML content. This feature ensures that all dynamically loaded content is fetched, providing a comprehensive snapshot of the entire page's content, even when it extends beyond the initial viewport.
- Scroll at the end of web page
- Click and close popups



## Installation
```bash
$ npm install --save @mikosoft/httpclient-pptr
```


## Options
   * **headless** :any - false => show browser window
   *  **deviceName** :string - the device name - 'Desktop Windows', 'Desktop Linux', 'Desktop Macintosh' or from https://pptr.dev/api/puppeteer.knowndevices
   *  **windowPosition** :[number, number] - the browser window offset position in pixels [x, y], for example [700, 20]
   *  **timeout** :number - the HTTP request timeout in ms
   *  referer :string - the referer URL, for example: 'https://www.dex8.com'
   *  **block**: :string[] - what resuources to block during the request, for example: ['image', 'stylesheet', 'font', 'script']
   *  **scroll** :boolean - scroll the content to the page end
   *  **waitUntil** :string - don't send response until 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
   *  **argsAppend** :string[] - array of chrome arguments -- https://peter.sh/experiments/chromium-command-line-switches/
   *  *extraHeaders* :object - additional HTTP request headers - {authorization: 'JWT ...'}
   *  **closeBrowser** :boolean - close browser after answer or page.goto error
   *  **closePopups** :string[] - CSS selectors to click to close popups
   *  **debug** :boolean



## Example
```js
const puppeteer = require('puppeteer-core');
const { HttpClientPptr } = require('../index.js');

const printAnswer = async () => {
  const opts = {
    headless: false,
    deviceName: 'Desktop Linux',
    windowPosition: [700, 20],
    timeout: 21000,
    referer: '',
    block: ['image'],
    scroll: false,
    waitUntil: 'networkidle2',
    argsAppend: [],
    extraHeaders: {},
    closeBrowser: true,
    closePopups: [],
    debug: false
  };
  const hcp = new HttpClientPptr(opts);
  hcp.injectPuppeteer(puppeteer);
  hcp.defineExecutablePath(); // '/usr/bin/google-chrome'
  hcp.setDeviceObject('Desktop Linux');

  const answer = await hcp.ask('https://www.dex8.com');

  console.log('ANSWER::');
  hcp.print(answer);
};


printAnswer().catch(console.log);
```

## API
#### constructor(opts)

#### injectPuppeteer(puppeteer)
Inject puppeteer-core. Check compatibility with installed chrome [https://pptr.dev/chromium-support](https://pptr.dev/chromium-support) .

#### defineExecutablePath(executablePath = '')
define executable path to chrome or chrome based browser, for example in Ubunut it's: *'/usr/bin/google-chrome'*

#### setDeviceObject(deviceName = 'Desktop Windows', myDevices = [])
Set device object.
- *deviceName*:string - the device name - 'Desktop Windows', 'Desktop Linux', 'Desktop Macintosh' or from https://pptr.dev/api/puppeteer.knowndevices
- *myDevices*:object[] - a list of custom defined device objects


#### *async* ask(url)
Get answer from the requested URL.

```js
ANSWER::
{
  requestURL: 'https://www.dex8.com',
  redirectedURL: 'https://www.dex8.com/',
  requestMethod: 'GET',
  status: 200,
  statusMessage: 'OK',
  gzip: true,
  deflate: false,
  https: true,
  req: {
    headers: {
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
    },
    payload: undefined
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
      date: 'Sun, 10 Sep 2023 14:35:30 GMT',
      server: 'nginx/1.17.10 (Ubuntu)',
      'transfer-encoding': 'chunked'
    },
    content: '<html lang="en" class=" js flexbox canvas canvastext webgl no-touch geolocation postmessage websqldatabase indexeddb hashchange history draganddrop websockets rgba hsla multiplebgs backgroundsize borderimage borderradius boxshadow textshadow opacity cssanimations csscolumns cssgradients cssreflections csstransforms csstransforms3d csstransitions fo'... 42566 more characters
  },
  time: {
    req: '2023-09-10T14:35:28.118Z',
    res: '2023-09-10T14:35:34.259Z',
    duration: 6.141
  }
}


```


#### print(answer)
Print answer object.


### License
The software licensed under [MIT](LICENSE).
