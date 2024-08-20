const puppeteer = require('puppeteer-core');
const { HttpClientPptr } = require('../../index.js');

/**
 * $ node 00default_opts.js "https://www.yahoo.com"
 */
const openURL = async (url) => {
  console.log(` ...opening "${url}"`);
  const hcp = new HttpClientPptr();
  hcp.injectPuppeteer(puppeteer);
  hcp.set_executablePath({ linux: '/usr/bin/google-chrome', win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const answer = await hcp.askOnce(url);
  hcp.print(answer);
};


const url = process.argv[2];
openURL(url).catch(console.error);
