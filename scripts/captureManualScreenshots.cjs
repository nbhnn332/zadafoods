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

async function captureAll() {
  const port = 9930;
  const tempProfile = path.join(os.tmpdir(), 'chrome_manual_' + Date.now());
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

    async function saveCurrentScreen(name) {
      const { data } = await send(pageWs, 'Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(data, 'base64');
      fs.writeFileSync(path.join(SCREENSHOT_DIR, name), buf);
      fs.writeFileSync(path.join(ARTIFACT_DIR, name), buf);
      console.log(`✓ Saved [${name}] (${buf.length} bytes)`);
    }

    // 1. PUBLIC STOREFRONT SCREENS
    console.log('\n--- 1. Capturing Customer Storefront Screens ---');
    await send(pageWs, 'Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 2,
      mobile: false
    });

    // Home
    await send(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5173/' });
    await wait(2000);
    await saveCurrentScreen('manual_01_hero_brand.png');

    // Our Story
    await send(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5173/our-story' });
    await wait(1800);
    await saveCurrentScreen('manual_02_our_story.png');

    // Shop Catalog
    await send(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5173/shop' });
    await wait(1800);
    await saveCurrentScreen('manual_03_shop_catalog.png');

    // Product Detail
    await send(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5173/product/banana-chips-nendran' });
    await wait(1800);
    await saveCurrentScreen('manual_04_product_detail.png');

    // Cart Page
    await send(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5173/cart' });
    await wait(1800);
    await saveCurrentScreen('manual_05_cart_page.png');

    // Bulk Enquiries
    await send(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5173/bulk-enquiries' });
    await wait(1800);
    await saveCurrentScreen('manual_06_bulk_enquiries.png');

    // Guest Checkout
    await send(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5173/checkout' });
    await wait(1800);
    await saveCurrentScreen('manual_07_guest_checkout.png');

    // Order Tracking (Protected Order Shield)
    await send(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5173/order-tracking/ord-1' });
    await wait(1800);
    await saveCurrentScreen('manual_08_order_tracking.png');

    // Login Portal
    await send(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5173/login' });
    await wait(1800);
    await saveCurrentScreen('manual_09_login_portal.png');

    // Mobile Storefront Viewport (390 x 844)
    console.log('\n--- 2. Capturing Mobile Storefront ---');
    await send(pageWs, 'Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await send(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5173/' });
    await wait(2000);
    await saveCurrentScreen('manual_10_mobile_storefront.png');

    // Reset viewport for Admin
    await send(pageWs, 'Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false
    });

    // 2. ADMIN AUTHENTICATION & SPA MODULES
    console.log('\n--- 3. Authenticating Super Admin & Capturing Modules ---');
    await send(pageWs, 'Page.navigate', { url: 'http://127.0.0.1:5173/login' });
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
    await wait(3000);

    // Module 1: Dashboard
    await saveCurrentScreen('manual_admin_01_dashboard.png');

    const adminRoutes = [
      { name: 'manual_admin_02_products.png', path: '/admin/products', title: 'Products' },
      { name: 'manual_admin_03_subcategories.png', path: '/admin/subcategories', title: 'Subcategories' },
      { name: 'manual_admin_04_inventory.png', path: '/admin/inventory', title: 'Inventory' },
      { name: 'manual_admin_05_orders.png', path: '/admin/orders', title: 'Orders' },
      { name: 'manual_admin_06_customers.png', path: '/admin/customers', title: 'Customers' },
      { name: 'manual_admin_07_coupons.png', path: '/admin/coupons', title: 'Coupons' },
      { name: 'manual_admin_08_combos.png', path: '/admin/combos', title: 'Combos' },
      { name: 'manual_admin_09_cms.png', path: '/admin/cms', title: 'CMS' },
      { name: 'manual_admin_10_festivals.png', path: '/admin/festivals', title: 'Festivals' },
      { name: 'manual_admin_11_reviews.png', path: '/admin/reviews', title: 'Reviews' },
      { name: 'manual_admin_12_enquiries.png', path: '/admin/enquiries', title: 'Enquiries' },
      { name: 'manual_admin_13_reports.png', path: '/admin/reports', title: 'Reports' },
      { name: 'manual_admin_14_management.png', path: '/admin/admins', title: 'Admin Users' },
      { name: 'manual_admin_15_settings.png', path: '/admin/settings', title: 'Settings' }
    ];

    for (const r of adminRoutes) {
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

    console.log('\n=============================================');
    console.log('All Storefront and Admin Screenshots Successfully Captured!');
    console.log('=============================================\n');

    pageWs.close();
    ws.close();
  } finally {
    proc.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch {}
  }
}

captureAll().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
