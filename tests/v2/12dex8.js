const puppeteer = require('puppeteer-core');
const { HttpClientPptr } = require('../../index.js');

const printAnswer = async () => {
  const opts = {
    headless: false,
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
