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
- PROD_MODE : true | false     - is the production mode, if yes then close the browser to save the memory













## Example
```js
/*** NodeJS script ***/
const { HttpClient } = require('@mikosoft/httpclient-node');

const getUrl = async () => {
  try {
    const opts = {
      encodeURI: false,
      encoding: 'utf8',
      timeout: 3000,
      retry: 2,
      retryDelay: 2100,
      maxRedirects: 3,
      headers: {
        'authorization': '',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
        'accept': '*/*', // 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
        'cache-control': 'no-cache',
        'host': '',
        'accept-encoding': 'gzip',
        'connection': 'close', // keep-alive
        'content-type': 'text/html; charset=UTF-8'
      },
      debug: false
    };

    const hcn = new HttpClient(opts); // http client instance
    const answers = await hcn.ask('http://www.adsuu.com');
    console.log(answers);

  } catch (err) { throw err; }
};


getUrl().catch(console.error);
```

Other examples are in /tests/ folder.



## API

#### constructor(opts:{encodeURI:boolean, timeout:number, retry:number, retryDelay:number, maxRedirects:number, headers:object})
- **encodeURI**	Encode URI before request is sent.	(false)
- **timeout**	Close socket on certain period of time in milliseconds. Same as timeout in NodeJS HTTP library.	(8000)
- **retry**	When HTTP Client receives an error response it will try to send requests repeatedly. The retry number determines the max allowed retries.	(3)
- **retryDelay**	Time delay after each retry in milliseconds.	(5500)
- **maxRedirects**	When HTTP Client receives 301 in Header response it will try to send new request to redirected URL. Number maxRedirects determines max redirects allowed to prevent infinite loops.	(3)
- **headers**	Definition of HTTP Headers used in HTTP request.	(see below)

```js
headers::
{
  'authorization': '',
  'user-agent': `DEX8-SDK/${pkg_json.version} https://dex8.com`, // 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36'
  'accept': '*/*', // 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
  'cache-control': 'no-cache',
  'host': '',
  'accept-encoding': 'gzip',
  'connection': 'close', // keep-alive
  'content-type': 'text/html; charset=UTF-8'
}
```


#### askOnce(url, method = 'GET', body_obj)
Send one time HTTP/HTTPS request. Redirection is not handled. Response is a Promise so async/await can be used.
*hcn.askOnce('https://www.dummy-api.com/create', 'POST', {first_name: 'Saša'});*
```
answer (HTTP response) is formatted as simple object
------------------------------------------------------------
{
  requestURL: 'http://www.adsuu.com',
  requestMethod: 'GET',
  status: 200,
  statusMessage: 'OK',
  httpVersion: '1.1',
  gzip: true,
  https: false,
  req: {
    headers: {
      authorization: '',
      'user-agent': 'DEX8-SDK/2.0.5 https://dex8.com',
      accept: '*/*',
      'cache-control': 'no-cache',
      host: '',
      'accept-encoding': 'gzip',
      connection: 'close',
      'content-type': 'text/html; charset=UTF-8'
    },
    payload: undefined
  },
  res: {
    headers: {
      server: 'nginx',
      date: 'Fri, 06 Mar 2020 11:20:54 GMT',
      'content-type': 'text/html; charset=UTF-8',
      'transfer-encoding': 'chunked',
      connection: 'close',
      vary: 'Accept-Encoding',
      'x-powered-by': 'PHP/5.6.40',
      'x-xss-protection': '1; mode=block',
      'x-content-type-options': 'nosniff',
      'x-nginx-cache-status': 'MISS',
      'x-server-powered-by': 'Engintron',
      'content-encoding': 'gzip'
    },
    content: '\n' +
      '\n' +
      ''
  }
```


#### ask(url, method = 'GET', body_obj)
Sends HTTP/HTTPS request to HTTP server. Redirection is handled maxRedirects times. Response is an array of resolved responses for every redirection stage. If there's no redirects then this array will contain only one response.
*hcn.ask('www.yahoo.com');*

```
answers:
-----------------------------
[
  {
    requestURL: 'http://bing.com',
    requestMethod: 'GET',
    status: 301,
    statusMessage: 'Moved Permanently',
    httpVersion: '1.1',
    gzip: false,
    https: false,
    req: {
      headers: {
        authorization: '',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
        accept: '*/*',
        'cache-control': 'no-cache',
        host: '',
        'accept-encoding': 'gzip',
        connection: 'close',
        'content-type': 'text/html; charset=UTF-8'
      },
      payload: undefined
    },
    res: {
      headers: {
        location: 'http://www.bing.com/',
        server: 'Microsoft-IIS/10.0',
        'x-msedge-ref': 'Ref A: BDA43350AD8448E0BF90BD7557179CC9 Ref B: ZAG30EDGE0120 Ref C: 2020-03-06T11:28:13Z',
        'set-cookie': [Array],
        date: 'Fri, 06 Mar 2020 11:28:13 GMT',
        connection: 'close',
        'content-length': '0'
      },
      content: ''
    }
  },
  {
    requestURL: 'http://www.bing.com/',
    requestMethod: 'GET',
    status: 302,
    statusMessage: '',
    httpVersion: '1.1',
    gzip: true,
    https: false,
    req: {
      headers: {
        authorization: '',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
        accept: '*/*',
        'cache-control': 'no-cache',
        host: '',
        'accept-encoding': 'gzip',
        connection: 'close',
        'content-type': 'text/html; charset=UTF-8'
      },
      payload: undefined
    },
    res: {
      headers: {
        'cache-control': 'private',
        'content-length': '179',
        'content-type': 'text/html; charset=utf-8',
        'content-encoding': 'gzip',
        location: 'https://www.bing.com:443/?toHttps=1&redig=D1B8D19DDBFC4CD8A6B9FA690AD3919B',
        vary: 'Accept-Encoding',
        'x-msedge-ref': 'Ref A: 41FC9D16CE464F90A17D18B339B3A0A4 Ref B: ZAG30EDGE0116 Ref C: 2020-03-06T11:28:13Z',
        'set-cookie': [Array],
        date: 'Fri, 06 Mar 2020 11:28:13 GMT',
        connection: 'close'
      },
      content: '\r\n' +
        'Object moved to here.\r\n' +
        '\r\n'
    }
  },
  {
    requestURL: 'https://www.bing.com:443/?toHttps=1&redig=D1B8D19DDBFC4CD8A6B9FA690AD3919B',
    requestMethod: 'GET',
    status: 200,
    statusMessage: 'OK',
    httpVersion: '1.1',
    gzip: true,
    https: true,
    req: {
      headers: {
        authorization: '',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
        accept: '*/*',
        'cache-control': 'no-cache',
        host: '',
        'accept-encoding': 'gzip',
        connection: 'close',
        'content-type': 'text/html; charset=UTF-8'
      },
      payload: undefined
    },
    res: {
      headers: {
        'cache-control': 'private',
        'transfer-encoding': 'chunked',
        'content-type': 'text/html; charset=utf-8',
        'content-encoding': 'gzip',
        vary: 'Accept-Encoding',
        p3p: 'CP="NON UNI COM NAV STA LOC CURa DEVa PSAa PSDa OUR IND"',
        'set-cookie': [Array],
        'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
        'x-msedge-ref': 'Ref A: 7F6C67E1D8364C0DA87DE69A2455A213 Ref B: ZAG30EDGE0220 Ref C: 2020-03-06T11:28:14Z',
        date: 'Fri, 06 Mar 2020 11:28:13 GMT',
        connection: 'close'
      },
      content: ' ... '
    }
  }
]
```


#### askJSON(url, method = 'GET', body)
Send HTTP/HTTPS request to API with JSON response. Redirection is not handled because we suppose that APIs are not using redirections.
Parameter body can be either string or object type.
As HTTP Client receives responses as string it will be automatically converted into object.
*hcn.askJSON('http://dummy.restapiexample.com/api/v1/employees');*

```
JSON answer:
----------------------------------------
{
  requestURL: 'http://dummy.restapiexample.com/api/v1/employees',
  requestMethod: 'GET',
  status: 200,
  statusMessage: 'OK',
  httpVersion: '1.1',
  gzip: true,
  https: false,
  req: {
    headers: {
      authorization: '',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
      accept: 'application/json',
      'cache-control': 'no-cache',
      host: '',
      'accept-encoding': 'gzip',
      connection: 'close',
      'content-type': 'application/json; charset=utf-8'
    },
    payload: undefined
  },
  res: {
    headers: {
      'access-control-allow-origin': '*',
      'access-control-expose-headers': 'Content-Type, X-Requested-With, X-authentication, X-client',
      'cache-control': 'no-store, no-cache, must-revalidate',
      'content-encoding': 'gzip',
      'content-type': 'application/json;charset=utf-8',
      date: 'Fri, 06 Mar 2020 11:46:31 GMT',
      expires: 'Thu, 19 Nov 1981 08:52:00 GMT',
      'host-header': 'c2hhcmVkLmJsdWVob3N0LmNvbQ==',
      pragma: 'no-cache',
      'referrer-policy': '',
      response: '200',
      server: 'nginx/1.16.0',
      'set-cookie': [
        'PHPSESSID=5df0597c3f284dc14c0c7e564466867c; path=/',
        'ezoadgid_133674=-1; Path=/; Domain=restapiexample.com; Expires=Fri, 06 Mar 2020 12:16:30 UTC',
        'ezoref_133674=; Path=/; Domain=restapiexample.com; Expires=Fri, 06 Mar 2020 13:46:30 UTC',
        'ezoab_133674=mod89-c; Path=/; Domain=restapiexample.com; Expires=Fri, 06 Mar 2020 13:46:30 UTC',
        'active_template::133674=pub_site.1583495190; Path=/; Domain=restapiexample.com; Expires=Sun, 08 Mar 2020 11:46:30 UTC'
      ],
      vary: 'Accept-Encoding,X-APP-JSON',
      'x-middleton-response': '200',
      'x-sol': 'pub_site',
      'content-length': '595',
      connection: 'close'
    },
    content: {
      status: 'success',
      data: [
        [Object], [Object], [Object],
        [Object], [Object], [Object],
        [Object], [Object], [Object],
        [Object], [Object], [Object],
        [Object], [Object], [Object],
        [Object], [Object], [Object],
        [Object], [Object], [Object],
        [Object], [Object], [Object]
      ]
    }
  }
}
```


#### grabStreams(url, method = 'GET', body)
Get request and response streams which can be used for piping. For example: clientResponse.pipe(file)
*hcn.grabStreams('http://www.dex8.com');*


#### setHeaders(headerObj)
Change request header object. Previously defined "this.headers" properties will be overwritten.
headerObj - {'authorization', 'user-agent', accept, 'cache-control', 'host', 'accept-encoding', 'connection'}
*hcn.setHeaders({authorization: 'myToken, 'content-type': 'application/json; charset=utf-8', accept: 'application/json'});*

#### setHeader(headerName, headerValue)
Change only one request header.
headerName - header field name
headerValue - header field value
*hcn.setHeader('authorization', 'myToken);*

#### delHeaders(headerNames)
Delete the request headers.
headerNames - array of header names ['content-type', 'accept']
*hcn.delHeaders(['content-type', 'accept']);*

#### getHeaders()
Get the current request headers.





### License
The software licensed under [MIT](LICENSE).
