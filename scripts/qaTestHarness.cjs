const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\nabha\\.gemini\\antigravity\\brain\\f0e5354f-d078-42e8-97ed-8e16f4e21dfa';
const BASE_URL = 'http://127.0.0.1:5173';

function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

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

class BrowserSession {
  constructor(port, tempProfile, proc, ws, pageWs) {
    this.port = port;
    this.tempProfile = tempProfile;
    this.proc = proc;
    this.ws = ws;
    this.pageWs = pageWs;
    this.msgId = 1;
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      const onMsg = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === id) {
          this.pageWs.removeEventListener('message', onMsg);
          if (d.error) reject(d.error);
          else resolve(d.result);
        }
      };
      this.pageWs.addEventListener('message', onMsg);
      this.pageWs.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || 'Evaluation error');
    }
    return res.result?.value;
  }

  async navigate(url, waitTime = 2000) {
    await this.send('Page.navigate', { url });
    await wait(waitTime);
  }

  async captureScreenshot(filename) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    const fullPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(fullPath, Buffer.from(data, 'base64'));
    return fullPath;
  }

  async setViewport(width, height, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: isMobile
    });
  }

  async close() {
    try {
      this.pageWs.close();
      this.ws.close();
    } catch {}
    this.proc.kill();
    try {
      fs.rmSync(this.tempProfile, { recursive: true, force: true });
    } catch {}
  }
}

async function launchBrowser(initScript = null) {
  const port = 9800 + Math.floor(Math.random() * 150);
  const tempProfile = path.join(os.tmpdir(), 'chrome_cdp_qa_' + Date.now() + '_' + Math.random().toString(36).substring(2));
  const proc = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`
  ]);

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

  if (!browserWsUrl) {
    proc.kill();
    throw new Error('Chrome failed to open CDP port ' + port);
  }

  const ws = new WebSocket(browserWsUrl);
  await new Promise(r => ws.onopen = r);

  const sendWs = (method, params = {}) => {
    return new Promise((res, rej) => {
      const id = Math.floor(Math.random() * 100000);
      const onMsg = e => {
        const d = JSON.parse(e.data);
        if (d.id === id) {
          ws.removeEventListener('message', onMsg);
          if (d.error) rej(d.error);
          else res(d.result);
        }
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  const { targetId } = await sendWs('Target.createTarget', { url: 'about:blank' });
  const pageWs = new WebSocket(`ws://127.0.0.1:${port}/devtools/page/${targetId}`);
  await new Promise(r => pageWs.onopen = r);

  const session = new BrowserSession(port, tempProfile, proc, ws, pageWs);
  await session.send('Page.enable');
  await session.send('DOM.enable');
  await session.send('Runtime.enable');
  await session.setViewport(1440, 900);

  if (initScript) {
    await session.send('Page.navigate', { url: BASE_URL });
    await wait(600);
    await session.evaluate(initScript);
    await wait(300);
  }

  return session;
}

const SUPERADMIN_STORAGE = `
localStorage.setItem('zada_auth_user', JSON.stringify({
  id: 'usr-superadmin-root',
  email: 'admin.zadafoods.superad@gmail.com',
  fullName: 'ZaDa Super Administrator',
  role: 'superadmin',
  status: 'active',
  permissions: [
    'dashboard.view', 'products.manage', 'categories.manage', 'subcategories.manage',
    'inventory.manage', 'orders.manage', 'courier.manage', 'customers.view',
    'coupons.manage', 'combos.manage', 'cms.homepage', 'cms.hero_banners',
    'cms.category_banners', 'cms.sections', 'cms.festivals', 'reviews.moderate', 'enquiries.manage',
    'content.manage', 'reports.export', 'audit_logs.view', 'settings.manage', 'admins.manage'
  ],
  createdAt: '2026-01-01T00:00:00Z'
}));
`;

const ORDER_ADMIN_STORAGE = `
localStorage.setItem('zada_auth_user', JSON.stringify({
  id: 'usr-admin-orders',
  email: 'orders.staff@zadafoods.com',
  fullName: 'Order Fulfillment Officer',
  role: 'admin',
  status: 'active',
  permissions: ['dashboard.view', 'orders.manage', 'courier.manage', 'inventory.manage', 'customers.view'],
  createdAt: '2026-03-01T00:00:00Z'
}));
`;

const CUSTOMER_STORAGE = `
localStorage.setItem('zada_auth_user', JSON.stringify({
  id: 'usr-cust-alice',
  email: 'alice.qa@example.com',
  fullName: 'Alice QA Johnson',
  role: 'customer',
  status: 'active',
  phone: '+91 98765 43210',
  permissions: [],
  createdAt: '2026-02-15T00:00:00Z'
}));
`;

module.exports = {
  launchBrowser,
  SUPERADMIN_STORAGE,
  ORDER_ADMIN_STORAGE,
  CUSTOMER_STORAGE,
  BASE_URL,
  ARTIFACT_DIR,
  wait
};
