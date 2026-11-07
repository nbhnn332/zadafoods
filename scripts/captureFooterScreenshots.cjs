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

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function captureFooter() {
  const port = 9970;
  const tempProfile = path.join(os.tmpdir(), 'chrome_footer_' + Date.now());
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${tempProfile}`]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 20; i++) {
      try {
        const v = await fetchJson(`http://127.0.0.1:${port}/json/version`);
        wsUrl = v.webSocketDebuggerUrl;
        if (wsUrl) break;
      } catch {
        await wait(200);
      }
    }
    const ws = new WebSocket(wsUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(targetWs, method, params = {}) {
      return new Promise((res, rej) => {
        const msgId = id++;
        const onMsg = e => {
          const d = JSON.parse(e.data);
          if (d.id === msgId) {
            targetWs.removeEventListener('message', onMsg);
            if (d.error) rej(d.error); else res(d.result);
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

    async function snap(name, width, height, mobile = false) {
      await send(pageWs, 'Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile });
      await send(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5173/' });
      await wait(2500);

      // Scroll to bottom
      await send(pageWs, 'Runtime.evaluate', {
        expression: `window.scrollTo(0, document.body.scrollHeight);`
      });
      await wait(1000);

      const { data } = await send(pageWs, 'Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(data, 'base64');
      fs.writeFileSync(path.join('manual_screenshots', name), buf);
      fs.writeFileSync(path.join(ARTIFACT_DIR, name), buf);
      console.log(`✓ Captured ${name} (${buf.length} bytes)`);
    }

    console.log('Capturing footer viewports...');
    await snap('footer_desktop_1280.png', 1280, 800, false);
    await snap('footer_tablet_768.png', 768, 1024, false);
    await snap('footer_mobile_390.png', 390, 844, true);

    pageWs.close();
    ws.close();
  } finally {
    proc.kill();
    try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
  }
}

captureFooter().catch(console.error);
