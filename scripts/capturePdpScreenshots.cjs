const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(b));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function capture(pageUrl, outputPath, width = 1440, height = 900) {
  const port = 9550 + Math.floor(Math.random() * 200);
  const tempProfile = path.join(os.tmpdir(), 'chrome_cdp_' + Date.now() + '_' + Math.random().toString(36).substring(2));
  const proc = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`
  ]);

  try {
    let browserWsUrl = null;
    for (let i = 0; i < 30; i++) {
      try {
        const v = await fetchJson(`http://127.0.0.1:${port}/json/version`);
        browserWsUrl = v.webSocketDebuggerUrl;
        if (browserWsUrl) break;
      } catch {
        await wait(200);
      }
    }

    if (!browserWsUrl) throw new Error('Chrome failed to open CDP port ' + port);

    const ws = new WebSocket(browserWsUrl);
    await new Promise((r, rej) => {
      ws.onopen = r;
      ws.onerror = rej;
    });

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
    const pageWsUrl = `ws://127.0.0.1:${port}/devtools/page/${targetId}`;
    const pageWs = new WebSocket(pageWsUrl);
    await new Promise((r, rej) => {
      pageWs.onopen = r;
      pageWs.onerror = rej;
    });

    await send(pageWs, 'Page.enable');
    await send(pageWs, 'Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: width < 600
    });

    await send(pageWs, 'Page.navigate', { url: pageUrl });
    await wait(2500);

    const shot = await send(pageWs, 'Page.captureScreenshot', { format: 'png' });
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, Buffer.from(shot.data, 'base64'));

    ws.close();
    pageWs.close();
    proc.kill();
    console.log(`Saved screenshot to ${outputPath} (${width}x${height})`);
  } catch (err) {
    proc.kill();
    throw err;
  }
}

async function main() {
  const prefix = process.argv[2] || 'phase11_before';
  console.log(`Capturing PDP baseline (${prefix})...`);
  await capture('http://127.0.0.1:5173/product/cashew-halwa', `screenshots/${prefix}_cashew_desktop.png`, 1440, 900);
  await capture('http://127.0.0.1:5173/product/cashew-halwa', `screenshots/${prefix}_cashew_tablet.png`, 768, 1024);
  await capture('http://127.0.0.1:5173/product/cashew-halwa', `screenshots/${prefix}_cashew_mobile.png`, 390, 844);
  await capture('http://127.0.0.1:5173/product/banana-chips-nendran', `screenshots/${prefix}_banana_desktop.png`, 1440, 900);
  await capture('http://127.0.0.1:5173/product/banana-chips-nendran', `screenshots/${prefix}_banana_mobile.png`, 390, 844);
  console.log('Capture complete!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
