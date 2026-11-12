const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\nabha\\.gemini\\antigravity\\brain\\f0e5354f-d078-42e8-97ed-8e16f4e21dfa';
const LOCAL_SCREENSHOTS_DIR = path.join(__dirname, '..', 'evidence_screenshots');

if (!fs.existsSync(LOCAL_SCREENSHOTS_DIR)) {
  fs.mkdirSync(LOCAL_SCREENSHOTS_DIR, { recursive: true });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => resolve(JSON.parse(b)));
    }).on('error', reject);
  });
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function capture() {
  const port = 9942;
  const tempProfile = path.join(os.tmpdir(), 'chrome_festival_cap_' + Date.now());
  const proc = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--window-size=1440,900'
  ]);

  try {
    let version = null;
    for (let i = 0; i < 20; i++) {
      try {
        version = await fetchJson(`http://127.0.0.1:${port}/json/version`);
        if (version) break;
      } catch {}
      await wait(300);
    }
    if (!version) throw new Error('Chrome did not start');

    const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
    const page = targets.find((t) => t.type === 'page');
    const wsUrl = page.webSocketDebuggerUrl;

    const WebSocket = require('ws');
    const pageWs = new WebSocket(wsUrl);
    await new Promise((resolve) => pageWs.on('open', resolve));

    let msgId = 1;
    function send(ws, method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.id === id) {
            ws.off('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.on('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send(pageWs, 'Page.enable');
    await send(pageWs, 'Runtime.enable');
    await send(pageWs, 'Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    // 0. AUTHENTICATE AS SUPER ADMIN
    console.log('Logging in as Super Admin via /login...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/login' });
    await wait(2000);

    await send(pageWs, 'Runtime.evaluate', {
      expression: `
        (() => {
          const emailInput = document.querySelector('input[type="email"]');
          const passInput = document.querySelector('input[type="password"]');
          if (!emailInput || !passInput) return 'no inputs';
          function setVal(el, val) {
            el.value = val;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
          setVal(emailInput, 'superadmin@zadafoods.com');
          setVal(passInput, 'ZaDaSuperAdmin2026!');
          const submitBtn = document.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.click();
          return 'submitted';
        })()
      `
    });
    await wait(2500);

    async function takeScreenshot(filename, width = 1440, height = 900, mobile = false) {
      await send(pageWs, 'Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile
      });
      await wait(500);
      const res = await send(pageWs, 'Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(res.data, 'base64');
      const localPath = path.join(LOCAL_SCREENSHOTS_DIR, filename);
      const artifactPath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(localPath, buf);
      fs.writeFileSync(artifactPath, buf);
      console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
    }

    // Helper to activate theme on storefront
    async function activatePresetOnStorefront(preset, intensity = 'balanced') {
      await send(pageWs, 'Runtime.evaluate', {
        expression: `
          (() => {
            const raw = localStorage.getItem('zada_festival_themes');
            let themes = raw ? JSON.parse(raw) : [];
            themes = themes.map(t => ({
              ...t,
              isActive: t.preset === '${preset}',
              intensity: '${intensity}'
            }));
            localStorage.setItem('zada_festival_themes', JSON.stringify(themes));
            localStorage.setItem('zada_active_theme', 'theme-${preset}');
            window.dispatchEvent(new CustomEvent('zada-theme-changed', { detail: { theme: '${preset}' } }));
          })()
        `
      });
      await wait(1000);
    }

    // 1. DEFAULT ZADA THEME (HOMEPAGE)
    console.log('1. Capturing Homepage in Default ZaDa Theme...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/' });
    await wait(2000);
    await activatePresetOnStorefront('default');
    await send(pageWs, 'Page.reload');
    await wait(2000);
    await takeScreenshot('homepage_theme_default.png', 1440, 900);

    // 2. ONAM — BALANCED (HOMEPAGE)
    console.log('2. Capturing Homepage in Onam — Balanced Theme...');
    await activatePresetOnStorefront('onam', 'balanced');
    await send(pageWs, 'Page.reload');
    await wait(2000);
    await takeScreenshot('homepage_theme_onam_balanced.png', 1440, 900);

    // 3. DIWALI — BALANCED (HOMEPAGE)
    console.log('3. Capturing Homepage in Diwali — Balanced Theme...');
    await activatePresetOnStorefront('diwali', 'balanced');
    await send(pageWs, 'Page.reload');
    await wait(2000);
    await takeScreenshot('homepage_theme_diwali_balanced.png', 1440, 900);

    // 4. EID — BALANCED (HOMEPAGE)
    console.log('4. Capturing Homepage in Eid — Balanced Theme...');
    await activatePresetOnStorefront('eid', 'balanced');
    await send(pageWs, 'Page.reload');
    await wait(2000);
    await takeScreenshot('homepage_theme_eid_balanced.png', 1440, 900);

    // 5. CHRISTMAS — BALANCED (HOMEPAGE)
    console.log('5. Capturing Homepage in Christmas — Balanced Theme...');
    await activatePresetOnStorefront('christmas', 'balanced');
    await send(pageWs, 'Page.reload');
    await wait(2000);
    await takeScreenshot('homepage_theme_christmas_balanced.png', 1440, 900);

    // 6. RESTORE DEFAULT (HOMEPAGE)
    console.log('6. Triggering and Capturing Restore Default...');
    await activatePresetOnStorefront('default');
    await send(pageWs, 'Page.reload');
    await wait(2000);
    await takeScreenshot('homepage_theme_restore_default.png', 1440, 900);

    // 7. SHOP CATALOGUE (DIWALI)
    console.log('7. Capturing Shop Page in Diwali Theme...');
    await activatePresetOnStorefront('diwali', 'balanced');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/shop' });
    await wait(2000);
    await takeScreenshot('shop_page_diwali_balanced.png', 1440, 900);

    // 8. PRODUCT DETAIL (ONAM)
    console.log('8. Capturing Product Detail in Onam Theme...');
    await activatePresetOnStorefront('onam', 'balanced');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/product/banana-chips' });
    await wait(2000);
    await takeScreenshot('pdp_page_onam_balanced.png', 1440, 900);

    // 9. CART PAGE (EID)
    console.log('9. Capturing Cart Page in Eid Theme...');
    await activatePresetOnStorefront('eid', 'balanced');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/cart' });
    await wait(2000);
    await takeScreenshot('cart_page_eid_balanced.png', 1440, 900);

    // 10. CHECKOUT PAGE (DIWALI)
    console.log('10. Capturing Checkout Page in Diwali Theme...');
    await activatePresetOnStorefront('diwali', 'balanced');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/checkout' });
    await wait(2000);
    await takeScreenshot('checkout_page_diwali_balanced.png', 1440, 900);

    // 11. MOBILE HOMEPAGE (ONAM)
    console.log('11. Capturing Mobile Homepage in Onam Theme...');
    await activatePresetOnStorefront('onam', 'balanced');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/' });
    await wait(2000);
    await takeScreenshot('mobile_homepage_onam_balanced.png', 390, 844, true);

    // 12. MOBILE HOMEPAGE (DIWALI)
    console.log('12. Capturing Mobile Homepage in Diwali Theme...');
    await activatePresetOnStorefront('diwali', 'balanced');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/' });
    await wait(2000);
    await takeScreenshot('mobile_homepage_diwali_balanced.png', 390, 844, true);

    // 13. ADMIN CMS IMAGE-ONLY BANNER SAVE VERIFICATION
    console.log('13. Capturing Admin CMS with Image-Only Banner & Disabled CTA...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/admin/cms' });
    await wait(2500);

    // Open add banner modal and configure image-only banner
    await send(pageWs, 'Runtime.evaluate', {
      expression: `
        (() => {
          const addBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Add Desktop Banner') || b.textContent.includes('Add Banner'));
          if (addBtns.length > 0) addBtns[0].click();
        })()
      `
    });
    await wait(1000);

    // Configure image URL and uncheck CTA
    await send(pageWs, 'Runtime.evaluate', {
      expression: `
        (() => {
          const inputs = document.querySelectorAll('input[type="text"]');
          function setVal(el, val) {
            el.value = val;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
          // Headline is input 0 (leave empty for image-only)
          if (inputs[0]) setVal(inputs[0], '');
          // Badge is input 1
          if (inputs[1]) setVal(inputs[1], '');
          // Subtitle is input 2
          if (inputs[2]) setVal(inputs[2], '');
          // Image URL is input 3
          if (inputs[3]) setVal(inputs[3], 'https://images.unsplash.com/photo-1546833999-b9f581a1996d');
          
          // Disable CTA
          const ctaCheck = document.querySelector('input[type="checkbox"]');
          if (ctaCheck && ctaCheck.checked) {
            ctaCheck.click();
          }
        })()
      `
    });
    await wait(1000);
    await takeScreenshot('admin_cms_image_only_banner_saved.png', 1440, 900);

    // 14. STOREFRONT IMAGE-ONLY BANNER LIVE
    console.log('14. Capturing Storefront Image-Only Banner Live...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/' });
    await wait(2000);
    await takeScreenshot('storefront_image_only_banner_live.png', 1440, 900);

    // Clean up to default theme
    await activatePresetOnStorefront('default');
    await send(pageWs, 'Page.reload');
    await wait(1000);

    console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } finally {
    proc.kill();
  }
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
