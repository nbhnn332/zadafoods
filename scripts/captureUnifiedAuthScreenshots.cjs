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
  const tempProfile = path.join(os.tmpdir(), 'chrome_cdp_auth_' + Date.now() + '_' + Math.random().toString(36).substring(2));
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
    const pageWs = new WebSocket(`ws://127.0.0.1:${port}/devtools/page/${targetId}`);
    await new Promise(r => pageWs.onopen = r);

    await send(pageWs, 'Page.enable');
    await send(pageWs, 'DOM.enable');
    await send(pageWs, 'Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: false
    });

    if (preNavScript) {
      await send(pageWs, 'Page.addScriptToEvaluateOnNewDocument', {
        source: preNavScript
      });
    }

    await send(pageWs, 'Page.navigate', { url: pageUrl });
    await wait(2000);

    if (scriptToEvaluate) {
      await send(pageWs, 'Runtime.evaluate', {
        expression: scriptToEvaluate,
        awaitPromise: true
      });
      await wait(1000);
    }

    const { data } = await send(pageWs, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outputPath, Buffer.from(data, 'base64'));
    console.log('Saved screenshot:', outputPath);

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
  const superAdminState = JSON.stringify({
    id: 'usr-superadmin-root',
    email: 'admin.zadafoods.superad@gmail.com',
    fullName: 'ZaDa Super Administrator',
    role: 'superadmin',
    status: 'active',
    permissions: [
      'dashboard.view', 'products.manage', 'categories.manage', 'subcategories.manage',
      'inventory.manage', 'orders.manage', 'courier.manage', 'customers.view',
      'coupons.manage', 'combos.manage', 'cms.homepage', 'cms.hero_banners',
      'cms.category_banners', 'cms.sections', 'reviews.moderate', 'enquiries.manage',
      'content.manage', 'reports.export', 'audit_logs.view', 'settings.manage', 'admins.manage'
    ],
    createdAt: '2026-01-01T00:00:00Z'
  });

  const customerState = JSON.stringify({
    id: 'usr-customer-test',
    email: 'customer.numan@example.com',
    fullName: 'Numan Sidique',
    role: 'customer',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z'
  });

  const contentAdminState = JSON.stringify({
    id: 'usr-admin-cms',
    email: 'content.admin@zadafoods.com',
    fullName: 'Content & Marketing Admin',
    role: 'admin',
    status: 'active',
    permissions: ['dashboard.view', 'cms.homepage', 'cms.hero_banners', 'cms.category_banners', 'cms.sections'],
    createdAt: '2026-01-01T00:00:00Z'
  });

  // 1. Unified Login Page (Clean, unauthenticated state)
  await capture(
    'http://127.0.0.1:5173/login',
    path.join(ARTIFACT_DIR, 'unified_auth_login_page.png'),
    1280,
    800,
    null,
    `localStorage.removeItem('zada_auth_user');`
  );

  // 2. Super Admin Dashboard (Full RBAC & Admin Management visible)
  await capture(
    'http://127.0.0.1:5173/admin/dashboard',
    path.join(ARTIFACT_DIR, 'superadmin_logged_in_dashboard.png'),
    1440,
    900,
    null,
    `localStorage.setItem('zada_auth_user', '${superAdminState}');`
  );

  // 3. Customer Blocked from /admin Route
  await capture(
    'http://127.0.0.1:5173/admin/dashboard',
    path.join(ARTIFACT_DIR, 'customer_access_denied_admin_route.png'),
    1280,
    800,
    null,
    `localStorage.setItem('zada_auth_user', '${customerState}');`
  );

  // 4. Content Admin Blocked from /admin/orders
  await capture(
    'http://127.0.0.1:5173/admin/orders',
    path.join(ARTIFACT_DIR, 'admin_permission_restricted_view.png'),
    1440,
    900,
    null,
    `localStorage.setItem('zada_auth_user', '${contentAdminState}');`
  );
}

run().catch(console.error);
