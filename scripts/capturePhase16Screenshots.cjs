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
  const tempProfile = path.join(os.tmpdir(), 'chrome_cdp_16_' + Date.now() + '_' + Math.random().toString(36).substring(2));
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
  console.log('Capturing Phase 16 Super Admin & RBAC screenshots...');

  const setSuperAdminAuth = `
    localStorage.setItem('zada_auth_user', JSON.stringify({
      id: 'usr-superadmin-root',
      email: 'superadmin@zadafoods.com',
      fullName: 'ZaDa Super Administrator',
      phone: '+91 75939 59235',
      role: 'superadmin',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z'
    }));
  `;

  const setOrdinaryAdminAuth = `
    localStorage.setItem('zada_auth_user', JSON.stringify({
      id: 'usr-admin-orders',
      email: 'orders@zadafoods.com',
      fullName: 'Order Fulfillment Officer',
      phone: '+91 75939 59235',
      role: 'admin',
      status: 'active',
      permissions: ['orders.manage', 'dashboard.view'],
      createdAt: '2026-01-01T00:00:00Z'
    }));
  `;

  // 1. Super Admin Management Table & Metrics
  await capture(
    'http://127.0.0.1:5173/admin/admins',
    path.join(ARTIFACT_DIR, 'phase16_admin_management_table.png'),
    1280,
    950,
    null,
    setSuperAdminAuth
  );

  // 2. Create Admin Modal with Checkbox Groups
  await capture(
    'http://127.0.0.1:5173/admin/admins',
    path.join(ARTIFACT_DIR, 'phase16_create_admin_modal.png'),
    1280,
    950,
    `(() => {
      const createBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Create Admin'));
      if (createBtn) createBtn.click();
    })()`,
    setSuperAdminAuth
  );

  // 3. Edit Permissions Modal
  await capture(
    'http://127.0.0.1:5173/admin/admins',
    path.join(ARTIFACT_DIR, 'phase16_edit_permissions_modal.png'),
    1280,
    950,
    `(() => {
      const permBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Permissions'));
      if (permBtns.length > 0) permBtns[0].click();
    })()`,
    setSuperAdminAuth
  );

  // 4. Access Restricted for Ordinary Admin
  await capture(
    'http://127.0.0.1:5173/admin/admins',
    path.join(ARTIFACT_DIR, 'phase16_access_restricted_view.png'),
    1280,
    800,
    null,
    setOrdinaryAdminAuth
  );

  console.log('All Phase 16 screenshots captured successfully!');
}

run().catch(console.error);
