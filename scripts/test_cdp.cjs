const cp = require('child_process');
const fs = require('fs');
const path = require('path');

async function testCdp() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tmpDir = path.join(process.env.TEMP, 'chrome-cdp-test-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });

  const chromeProc = cp.spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-debugging-port=9222',
    `--user-data-dir=${tmpDir}`,
    'about:blank'
  ]);

  // wait 1 second for port 9222
  await new Promise(r => setTimeout(r, 1200));

  try {
    const res = await fetch('http://127.0.0.1:9222/json/list');
    const pages = await res.json();
    console.log('Pages found:', pages.length);
    const wsUrl = pages[0].webSocketDebuggerUrl;
    console.log('WS URL:', wsUrl);

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve) => ws.onopen = resolve);

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Page.navigate', { url: 'http://127.0.0.1:5173' });
    await new Promise(r => setTimeout(r, 1500));

    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(data, 'base64');
    fs.writeFileSync('manual_screenshots/cdp_home.png', buf);
    console.log('Screenshot written successfully, size:', buf.length);

    ws.close();
  } catch (err) {
    console.error('CDP test error:', err);
  } finally {
    chromeProc.kill();
  }
}

testCdp();
