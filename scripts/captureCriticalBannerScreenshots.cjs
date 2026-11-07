const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\nabha\\.gemini\\antigravity\\brain\\f0e5354f-d078-42e8-97ed-8e16f4e21dfa';

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

async function capture(pageUrl, outputPath, width, height, scriptToEvaluate) {
  const port = 9600 + Math.floor(Math.random() * 200);
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
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((res, rej) => {
        const curId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === curId) {
            ws.removeEventListener('message', handler);
            if (msg.error) rej(msg.error);
            else res(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const targetWsUrl = `ws://127.0.0.1:${port}/devtools/page/${targetId}`;
    const pageWs = new WebSocket(targetWsUrl);
    await new Promise(r => pageWs.onopen = r);

    let pId = 1;
    function sendPage(method, params = {}) {
      return new Promise((res, rej) => {
        const curId = pId++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === curId) {
            pageWs.removeEventListener('message', handler);
            if (msg.error) rej(msg.error);
            else res(msg.result);
          }
        };
        pageWs.addEventListener('message', handler);
        pageWs.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await sendPage('Page.enable');
    await sendPage('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false
    });

    await sendPage('Page.navigate', { url: pageUrl });
    await wait(2000);

    if (scriptToEvaluate) {
      await sendPage('Runtime.evaluate', {
        expression: scriptToEvaluate,
        awaitPromise: true
      });
      await wait(1500);
    }

    const scr = await sendPage('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outputPath, Buffer.from(scr.data, 'base64'));
    console.log(`Saved screenshot: ${outputPath}`);

    pageWs.close();
    ws.close();
  } finally {
    proc.kill();
    try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
  }
}

async function run() {
  const adminAuthScript = `
    (() => {
      localStorage.setItem('zada_auth_user', JSON.stringify({
        id: 'usr-admin-1',
        email: 'admin@zadafoods.com',
        fullName: 'ZaDa Administrator',
        phone: '+91 75939 59235',
        role: 'admin',
        createdAt: '2026-01-01T00:00:00Z'
      }));
    })()
  `;

  console.log('Capturing Critical Banner Persistence verification screenshots...');

  // 1. Storefront Homepage Hero
  await capture(
    'http://127.0.0.1:5173/',
    path.join(ARTIFACT_DIR, 'critical_fix_storefront_homepage_hero.png'),
    1440,
    900,
    adminAuthScript
  );

  // 2. Admin CMS Hero Banners Management
  await capture(
    'http://127.0.0.1:5173/admin/cms',
    path.join(ARTIFACT_DIR, 'critical_fix_admin_cms_banners.png'),
    1440,
    900,
    adminAuthScript
  );

  // 3. Admin CMS Create Banner Modal (Showing zero-image default and live CSS preview)
  const openModalScript = `
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent.includes('Add Hero Banner'));
      if (addBtn) addBtn.click();
    })()
  `;
  await capture(
    'http://127.0.0.1:5173/admin/cms',
    path.join(ARTIFACT_DIR, 'critical_fix_admin_create_banner_modal.png'),
    1440,
    900,
    openModalScript
  );

  console.log('All verification screenshots captured successfully!');
}

run().catch(console.error);
