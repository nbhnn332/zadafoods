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
    await wait(2200);

    if (scriptToEvaluate) {
      await send(pageWs, 'Runtime.evaluate', {
        expression: scriptToEvaluate,
        awaitPromise: true
      });
      await wait(1200);
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
  console.log('Capturing Phase 14 screenshots...');

  // 1. Storefront Homepage - Hero Slideshow
  await capture(
    'http://127.0.0.1:5173/',
    path.join(ARTIFACT_DIR, 'phase14_homepage_hero_slideshow.png'),
    1280,
    800
  );

  // 2. Admin CMS - Hero Banners with Zero-Image Authorization & Purge Demo Action
  await capture(
    'http://127.0.0.1:5173/admin/cms',
    path.join(ARTIFACT_DIR, 'phase14_admin_cms_hero_banners.png'),
    1280,
    900
  );

  // 3. Admin Orders - Print Bill Modal Preview
  await capture(
    'http://127.0.0.1:5173/admin/orders',
    path.join(ARTIFACT_DIR, 'phase14_admin_orders_print_invoice.png'),
    1280,
    950,
    `(() => {
      const printBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Print Bill'));
      if (printBtn) printBtn.click();
    })()`
  );

  // 4. Storefront Checkout - Payment Method Selector
  await capture(
    'http://127.0.0.1:5173/checkout?demo=true',
    path.join(ARTIFACT_DIR, 'phase14_checkout_payment_selector.png'),
    1280,
    900
  );

  // 5. Storefront Checkout - WhatsApp Confirmation Dialog
  await capture(
    'http://127.0.0.1:5173/checkout?demo=true',
    path.join(ARTIFACT_DIR, 'phase14_checkout_whatsapp_dialog.png'),
    1280,
    900,
    `(() => {
      // Find WhatsApp payment option
      const waOption = Array.from(document.querySelectorAll('div')).find(el => el.textContent && el.textContent.includes('WhatsApp Direct Order') && el.classList.contains('cursor-pointer'));
      if (waOption) waOption.click();
      setTimeout(() => {
        const orderBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Order via WhatsApp'));
        if (orderBtn) orderBtn.click();
      }, 300);
    })()`
  );

  console.log('All Phase 14 screenshots captured successfully!');
}

run().catch(console.error);
