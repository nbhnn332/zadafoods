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

async function capture(pageUrl, outputPath, width, height, clickSelector) {
  const port = 9560 + Math.floor(Math.random() * 100);
  const tempProfile = path.join(os.tmpdir(), 'chrome_cdp_' + Date.now() + '_' + Math.random().toString(36).substring(2));
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
    await send(pageWs, 'Network.enable');
    await send(pageWs, 'Runtime.enable');
    await send(pageWs, 'Network.setCacheDisabled', { cacheDisabled: true });
    await send(pageWs, 'Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: width < 600
    });

    await send(pageWs, 'Page.navigate', { url: pageUrl });
    await wait(2200);

    if (clickSelector) {
      await send(pageWs, 'Runtime.evaluate', {
        expression: `
          (function() {
            const btns = Array.from(document.querySelectorAll('button'));
            const target = btns.find(b => b.textContent && b.textContent.includes('${clickSelector}'));
            if (target) {
              target.click();
            }
          })();
        `
      });
      await wait(1000);
    }

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
  const targets = [
    {
      url: 'http://127.0.0.1:5173/category/chips',
      file: 'screenshots/phase13_category_chips_desktop.png',
      w: 1440,
      h: 900
    },
    {
      url: 'http://127.0.0.1:5173/category/chips',
      file: 'screenshots/phase13_category_chips_mobile.png',
      w: 390,
      h: 844
    },
    {
      url: 'http://127.0.0.1:5173/category/sweets',
      file: 'screenshots/phase13_category_sweets_desktop.png',
      w: 1440,
      h: 900
    },
    {
      url: 'http://127.0.0.1:5173/category/sweets',
      file: 'screenshots/phase13_category_sweets_mobile.png',
      w: 390,
      h: 844
    },
    {
      url: 'http://127.0.0.1:5173/category/halwa',
      file: 'screenshots/phase13_category_halwa_desktop.png',
      w: 1440,
      h: 900
    },
    {
      url: 'http://127.0.0.1:5173/our-story',
      file: 'screenshots/phase13_our_story_desktop.png',
      w: 1440,
      h: 900
    },
    {
      url: 'http://127.0.0.1:5173/our-story',
      file: 'screenshots/phase13_our_story_mobile.png',
      w: 390,
      h: 844
    },
    {
      url: 'http://127.0.0.1:5173/admin/cms',
      file: 'screenshots/phase13_admin_category_banners_desktop.png',
      w: 1440,
      h: 900,
      clickSelector: 'Category Banners'
    }
  ];

  for (const t of targets) {
    console.log(`Capturing ${t.url} at ${t.w}x${t.h}...`);
    await capture(t.url, t.file, t.w, t.h, t.clickSelector);
  }
  console.log('All Phase 13 screenshots captured successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
