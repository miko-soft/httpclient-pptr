/**
 * $ node 10openWebPage.js <url>
 * $ node 10openWebPage.js http://www.adsuu.com?x=ča
 * $ node 10openWebPage.js https://api.dex8.com?x=ča
 * $ node 10openWebPage.js https://www.dex8.com/products/robots
 */
const util = require('util');
const { httpClientPptr } = require('../index.js');

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

  console.log('asked url:: GET', url);
  const answer = await httpClientPptr(url, block, extraHeaders, timeout, referer, deviceName, windowPosition, scroll, waitUntil, headless, argsAppend);
  answer.res.content = answer.res.content ? answer.res.content.length : 0; // shorten the console.log
  console.log(`\nanswer:`, util.inspect(answer, false, 3, true));
};


getUrl().catch(console.log);
