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
  const port = 9940;
  const tempProfile = path.join(os.tmpdir(), 'chrome_phase_cap_' + Date.now());
  const proc = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--window-size=1440,900'
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
          const m = JSON.parse(e.data);
          if (m.id === msgId) {
            targetWs.removeEventListener('message', onMsg);
            if (m.error) rej(m.error);
            else res(m.result);
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
      deviceScaleFactor: 1,
      mobile: false
    });

    async function evalJs(expr) {
      const res = await send(pageWs, 'Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      return res.result ? res.result.value : null;
    }

    async function takeScreenshot(name) {
      const { data } = await send(pageWs, 'Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(data, 'base64');
      const localPath = path.join(LOCAL_SCREENSHOTS_DIR, name + '.png');
      const artifactPath = path.join(ARTIFACT_DIR, name + '.png');
      fs.writeFileSync(localPath, buf);
      try {
        fs.writeFileSync(artifactPath, buf);
      } catch {}
      console.log(`✓ Saved screenshot: ${name}.png (${buf.length} bytes)`);
    }

    // ── 0. LOG IN AS SUPER ADMIN ──
    console.log('Logging in as Super Admin via /login...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/login' });
    await wait(2000);

    await evalJs(`
      (() => {
        const emailInput = document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');
        const submitBtn = document.querySelector('button[type="submit"]');

        const setVal = (input, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        };

        if (emailInput && passInput && submitBtn) {
          const adminEmail = process.env.ADMIN_EMAIL || 'superadmin@zadafoods.com';
          const adminPass = process.env.ADMIN_PASSWORD || 'ZaDaSuperAdmin2026!';
          setVal(emailInput, adminEmail);
          setVal(passInput, adminPass);
          submitBtn.click();
        }
      })()
    `);
    await wait(3000);

    const currentUrl = await evalJs(`window.location.href`);
    console.log('Current URL after login attempt:', currentUrl);

    // ── SCREENSHOT 1: Active Festival Theme Storefront ──
    console.log('1. Setting and rendering Active Festival Theme Storefront...');
    await evalJs(`
      const themes = JSON.parse(localStorage.getItem('zada_festival_themes') || '[]');
      const onamActive = themes.map(t => ({
        ...t,
        isActive: t.preset === 'onam'
      }));
      localStorage.setItem('zada_festival_themes', JSON.stringify(onamActive));
      localStorage.setItem('zada_active_theme', 'theme-onam');
    `);
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/?ts=' + Date.now() });
    await wait(2500);
    await takeScreenshot('festival_theme_active_storefront');

    // ── SCREENSHOT 2: Corporate & Gifting CMS Storefront Sync ──
    console.log('2. Scrolled to Corporate & Gifting Section...');
    await evalJs(`
      window.scrollTo({ top: 1250, behavior: 'instant' });
    `);
    await wait(1200);
    await takeScreenshot('corporate_gifting_cms_storefront_sync');

    // ── SCREENSHOT 3: Restore Default ZaDa Modal in Admin Festivals ──
    console.log('3. Opening Admin Festivals and triggering Restore Default Modal...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/admin/festivals' });
    await wait(2500);
    const fUrl = await evalJs(`window.location.href + ' | H1: ' + (document.querySelector('h1')?.innerText || 'none')`);
    console.log('Festivals page state:', fUrl);

    await evalJs(`
      const btns = Array.from(document.querySelectorAll('button'));
      const restoreBtn = btns.find(b => b.textContent.includes('Restore Default ZaDa'));
      if (restoreBtn) restoreBtn.click();
    `);
    await wait(1200);
    await takeScreenshot('festival_theme_restore_default_modal');

    // Dismiss modal
    await evalJs(`
      const btns = Array.from(document.querySelectorAll('button'));
      const cancelBtn = btns.find(b => b.textContent.includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    `);
    await wait(500);

    // ── SCREENSHOT 4: Image-Only Banner in Admin CMS ──
    console.log('4. Navigating to Admin CMS Banner modal with image-only and optional CTA...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/admin/cms' });
    await wait(2500);
    const cmsUrl = await evalJs(`window.location.href + ' | H1: ' + (document.querySelector('h1')?.innerText || 'none')`);
    console.log('CMS page state:', cmsUrl);

    await evalJs(`
      const addBtn = document.querySelector('[data-testid="add-desktop-banner-btn"]');
      if (addBtn) addBtn.click();
    `);
    await wait(1200);

    await evalJs(`
      const inputs = Array.from(document.querySelectorAll('input'));
      const imgInput = inputs.find(i => i.placeholder && i.placeholder.includes('Leave empty for Pure CSS'));
      if (imgInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(imgInput, 'https://images.unsplash.com/photo-1541658016709-82535e94bc69');
        imgInput.dispatchEvent(new Event('input', { bubbles: true }));
        imgInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const ctaCheck = Array.from(document.querySelectorAll('label')).find(l => l.textContent.includes('Enable CTA Button'));
      if (ctaCheck) {
        const inp = ctaCheck.querySelector('input');
        if (inp && inp.checked) inp.click();
      }
    `);
    await wait(1500);
    await takeScreenshot('banner_image_only_clickable');

    // Close banner modal
    await evalJs(`
      const btns = Array.from(document.querySelectorAll('button'));
      const cancel = btns.find(b => b.textContent === 'Cancel');
      if (cancel) cancel.click();
    `);
    await wait(500);

    // ── SCREENSHOT 5: Bulk Data Cleanup Preview & Confirmation Modal ──
    console.log('5. Navigating to Admin Data Management and running Dry-Run Preview...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/admin/data-management' });
    await wait(2500);
    const dmUrl = await evalJs(`window.location.href + ' | H1: ' + (document.querySelector('h1')?.innerText || 'none')`);
    console.log('Data Management page state:', dmUrl);

    await evalJs(`
      const btns = Array.from(document.querySelectorAll('button'));
      const prevBtn = btns.find(b => b.textContent.includes('Run Dry-Run Preview'));
      if (prevBtn) prevBtn.click();
    `);
    await wait(3000);

    // Trigger confirm modal
    await evalJs(`
      const btns = Array.from(document.querySelectorAll('button'));
      const proceed = btns.find(b => b.textContent.includes('Proceed to Secure Cleanup'));
      if (proceed) proceed.click();
    `);
    await wait(1500);
    await takeScreenshot('bulk_data_cleanup_preview_and_modal');

    pageWs.close();
    ws.close();
    proc.kill();
    console.log('All 5 screenshots captured successfully!');
  } catch (err) {
    console.error('Screenshot capture error:', err);
    proc.kill();
  }
}

capture();
