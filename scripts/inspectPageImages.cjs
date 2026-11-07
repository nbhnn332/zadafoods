const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    }).on('error', reject);
  });
}

function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function inspectImages() {
  const port = 9580;
  const tempProfile = path.join(os.tmpdir(), 'chrome_cdp_inspect');
  const proc = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`
  ]);

  try {
    let browserWsUrl = null;
    for (let i = 0; i < 25; i++) {
      try {
        const v = await fetchJson(`http://127.0.0.1:${port}/json/version`);
        browserWsUrl = v.webSocketDebuggerUrl;
        if (browserWsUrl) break;
      } catch {
        await wait(200);
      }
    }

    const ws = new WebSocket(browserWsUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(targetWs, method, params = {}) {
      return new Promise((res, rej) => {
        const msgId = id++;
        const onMsg = e => {
          const d = JSON.parse(e.data);
          if (d.id === msgId) {
            targetWs.removeEventListener('message', onMsg);
            if (d.error) rej(d.error);
            else res(d.result);
          }
        };
        targetWs.addEventListener('message', onMsg);
        targetWs.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    const { targetId } = await send(ws, 'Target.createTarget', { url: 'about:blank' });
    const pageWs = new WebSocket(`ws://127.0.0.1:${port}/devtools/page/${targetId}`);
    await new Promise(r => pageWs.onopen = r);

    await send(pageWs, 'Page.enable');
    await send(pageWs, 'Runtime.enable');
    await send(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5173/shop' });
    await wait(2000);

    const evalResult = await send(pageWs, 'Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll('img')).map(i => ({ src: i.src, alt: i.alt }))`,
      returnByValue: true
    });

    console.log('Images loaded on /shop:');
    console.log(evalResult.result.value);

    ws.close();
    pageWs.close();
    proc.kill();
  } catch (e) {
    proc.kill();
    console.error(e);
  }
}

inspectImages();
