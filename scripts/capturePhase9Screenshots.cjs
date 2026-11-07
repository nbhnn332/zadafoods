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
      res.on('end', () => resolve(JSON.parse(b)));
    }).on('error', reject);
  });
}

function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function capture(pageUrl, outputPath, width = 443, height = 887) {
  const port = 9445 + Math.floor(Math.random() * 100);
  const tempProfile = path.join(os.tmpdir(), 'chrome_cdp_' + Date.now() + '_' + Math.random());
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

    if (!browserWsUrl) throw new Error('Chrome failed to open CDP port ' + port);

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
    const pageWsUrl = `ws://127.0.0.1:${port}/devtools/page/${targetId}`;
    const pageWs = new WebSocket(pageWsUrl);
    await new Promise(r => pageWs.onopen = r);

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
  const screens = [
    { url: 'http://127.0.0.1:5173/', file: 'screenshots/home_updated.png', w: 443, h: 887 },
    { url: 'http://127.0.0.1:5173/category/chips', file: 'screenshots/category_updated.png', w: 443, h: 887 },
    { url: 'http://127.0.0.1:5173/product/banana-chips-nendran', file: 'screenshots/pdp_updated.png', w: 443, h: 887 },
    { url: 'http://127.0.0.1:5173/product/cashew-halwa', file: 'screenshots/pdp_cashew_halwa_updated.png', w: 443, h: 887 },
    { url: 'http://127.0.0.1:5173/cart?demo=true', file: 'screenshots/cart_updated.png', w: 443, h: 887 },
    { url: 'http://127.0.0.1:5173/checkout?demo=true', file: 'screenshots/checkout_updated.png', w: 443, h: 887 },
    { url: 'http://127.0.0.1:5173/order-tracking/ZDF1008', file: 'screenshots/order_tracking_updated.png', w: 443, h: 887 },
    { url: 'http://127.0.0.1:5173/account', file: 'screenshots/account_updated.png', w: 443, h: 887 },
    { url: 'http://127.0.0.1:5173/admin/cms', file: 'screenshots/admin_cms_desktop.png', w: 1280, h: 800 },
    { url: 'http://127.0.0.1:5173/admin/settings', file: 'screenshots/admin_settings_desktop.png', w: 1280, h: 800 }
  ];

  for (const s of screens) {
    console.log(`Capturing ${s.url}...`);
    await capture(s.url, s.file, s.w, s.h);
  }
  console.log('All 10 Phase 9C pre-launch verification screenshots captured successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
