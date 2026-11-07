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

async function capture(pageUrl, outputPath, width, height, scriptToEvaluate, preNavScript) {
  const port = 9700 + Math.floor(Math.random() * 200);
  const tempProfile = path.join(os.tmpdir(), 'chrome_cdp_15b_' + Date.now() + '_' + Math.random().toString(36).substring(2));
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
    const targetWsUrl = `ws://127.0.0.1:${port}/devtools/page/${targetId}`;
    const pageWs = new WebSocket(targetWsUrl);
    await new Promise(r => pageWs.onopen = r);

    await send(pageWs, 'Page.enable');
    await send(pageWs, 'Runtime.enable');
    await send(pageWs, 'Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: width < 768
    });

    if (preNavScript) {
      await send(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5173/' });
      await wait(1500);
      await send(pageWs, 'Runtime.evaluate', {
        expression: preNavScript,
        awaitPromise: true
      });
      await wait(500);
    }

    await send(pageWs, 'Page.navigate', { url: pageUrl });
    await wait(2500);

    if (scriptToEvaluate) {
      await send(pageWs, 'Runtime.evaluate', {
        expression: scriptToEvaluate,
        awaitPromise: true
      });
      await wait(1800);
    }

    const { data } = await send(pageWs, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outputPath, Buffer.from(data, 'base64'));
    console.log(`Saved screenshot to: ${outputPath}`);

    pageWs.close();
    ws.close();
  } finally {
    proc.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch {}
  }
}

async function run() {
  console.log('Capturing Phase 15B Subcategory CMS screenshots...');

  const setAdminAuth = `
    localStorage.setItem('zada_auth_user', JSON.stringify({
      id: 'usr-admin-1',
      email: 'admin@zadafoods.com',
      fullName: 'ZaDa Administrator',
      phone: '+91 75939 59235',
      role: 'admin',
      createdAt: '2026-01-01T00:00:00Z'
    }));
  `;

  // 1. Admin Subcategories Management Table
  await capture(
    'http://127.0.0.1:5173/admin/subcategories',
    path.join(ARTIFACT_DIR, 'phase15b_admin_subcategories_table.png'),
    1280,
    950,
    null,
    setAdminAuth
  );

  // 2. Admin Subcategory Add Modal
  await capture(
    'http://127.0.0.1:5173/admin/subcategories',
    path.join(ARTIFACT_DIR, 'phase15b_admin_subcategory_modal.png'),
    1280,
    950,
    `(() => {
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Subcategory'));
      if (addBtn) addBtn.click();
    })()`,
    setAdminAuth
  );

  // 3. Storefront /category/chips with Dynamic Subcategory Pills (Desktop)
  await capture(
    'http://127.0.0.1:5173/category/chips',
    path.join(ARTIFACT_DIR, 'phase15b_storefront_chips_filtering.png'),
    1280,
    900
  );

  // 4. Storefront /category/chips Mobile View (Horizontally Scrollable Chips)
  await capture(
    'http://127.0.0.1:5173/category/chips',
    path.join(ARTIFACT_DIR, 'phase15b_storefront_chips_mobile.png'),
    390,
    844
  );

  console.log('All Phase 15B screenshots captured successfully!');
}

run().catch(console.error);
