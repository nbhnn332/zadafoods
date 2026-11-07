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
  console.log('Capturing Phase 15 screenshots...');

  // 1. Storefront Checkout - Genuine Customer Payment Options (No WhatsApp payment method)
  await capture(
    'http://127.0.0.1:5173/checkout?demo=true',
    path.join(ARTIFACT_DIR, 'phase15_checkout_genuine_payment_options.png'),
    1280,
    950
  );

  // 2. Admin Settings - Customer Payment Methods vs Internal WhatsApp COD Routing
  await capture(
    'http://127.0.0.1:5173/admin/settings',
    path.join(ARTIFACT_DIR, 'phase15_admin_settings_payment_and_routing.png'),
    1280,
    1050
  );

  // 3. Storefront Checkout - COD Placed & Awaiting WhatsApp Confirmation Modal
  await capture(
    'http://127.0.0.1:5173/checkout?demo=true',
    path.join(ARTIFACT_DIR, 'phase15_checkout_cod_awaiting_confirmation_modal.png'),
    1280,
    950,
    `(() => {
      // Find and click the confirm order button
      const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent.includes('Confirm Order') || b.textContent.includes('Cash on Delivery')
      );
      if (confirmBtn) {
        confirmBtn.click();
      }
    })()`
  );

  console.log('All Phase 15 screenshots captured successfully!');
}

run().catch(console.error);
