const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\nabha\\.gemini\\antigravity\\brain\\f0e5354f-d078-42e8-97ed-8e16f4e21dfa';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'manual_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

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

async function capture() {
  const port = 9975;
  const tempProfile = path.join(os.tmpdir(), 'chrome_manual_extra_' + Date.now());
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

    const WebSocket = require('ws');
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
    await send(pageWs, 'Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false
    });

    async function saveCurrentScreen(filename) {
      const res = await send(pageWs, 'Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(res.data, 'base64');
      const p1 = path.join(SCREENSHOT_DIR, filename);
      const p2 = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(p1, buf);
      if (fs.existsSync(ARTIFACT_DIR)) fs.writeFileSync(p2, buf);
      console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
    }

    // Authenticate Super Admin
    console.log('Logging in as Super Admin...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/login' });
    await wait(2000);

    await send(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const emailInput = document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');
        const submitBtn = document.querySelector('button[type="submit"]');

        const setVal = (input, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        };

        setVal(emailInput, 'admin.zadafoods.superad@gmail.com');
        setVal(passInput, 'SecurePass2026!');
        submitBtn.click();
      })()`
    });
    await wait(2500);

    // First navigate to /admin/dashboard
    console.log('Navigating to /admin/dashboard...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/admin/dashboard' });
    await wait(2500);

    const routes = [
      { name: 'manual_admin_16_bestsellers.png', path: '/admin/bestsellers', title: 'Bestseller Collection' },
      { name: 'manual_admin_17_handpicked.png', path: '/admin/handpicked', title: 'Handpicked Collection' },
      { name: 'manual_admin_18_content.png', path: '/admin/content', title: 'Store Content Pages' },
      { name: 'manual_admin_19_audit_logs.png', path: '/admin/audit-logs', title: 'System Audit Logs' },
      { name: 'manual_admin_20_data_cleanup.png', path: '/admin/data-management', title: 'Bulk Data Cleanup' }
    ];

    for (const r of routes) {
      console.log(`Navigating to ${r.title} (${r.path})...`);
      await send(pageWs, 'Runtime.evaluate', {
        expression: `(() => {
          const link = document.querySelector('a[href="${r.path}"]');
          if (link) {
            link.click();
          } else {
            window.location.hash = '';
            window.history.pushState({}, '', '${r.path}');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        })()`
      });
      await wait(2000);
      await saveCurrentScreen(r.name);
    }

    console.log('All remaining admin screenshots captured successfully!');
    pageWs.close();
    ws.close();
  } catch (err) {
    console.error('Capture failed:', err);
  } finally {
    proc.kill();
  }
}

capture();
