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
  const port = 9946;
  const tempProfile = path.join(os.tmpdir(), 'chrome_immersive_cap_' + Date.now());
  const proc = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--window-size=1440,1100'
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
      height: 1100,
      deviceScaleFactor: 1,
      mobile: false
    });

    async function takeScreenshot(filename, width = 1440, height = 1100, mobile = false) {
      await send(pageWs, 'Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile
      });
      await wait(800);
      const res = await send(pageWs, 'Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(res.data, 'base64');
      const localPath = path.join(LOCAL_SCREENSHOTS_DIR, filename);
      const artifactPath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(localPath, buf);
      fs.writeFileSync(artifactPath, buf);
      console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
    }

    // Helper to activate theme on storefront with rich intensity and full placements
    async function activatePreset(preset, intensity = 'rich') {
      await send(pageWs, 'Runtime.evaluate', {
        expression: `
          (() => {
            const raw = localStorage.getItem('zada_festival_themes');
            let themes = raw ? JSON.parse(raw) : [];
            themes = themes.map(t => {
              const matches = t.preset === '${preset}';
              return {
                ...t,
                isActive: matches,
                intensity: '${intensity}',
                placements: {
                  heroBanners: true,
                  promoBanners: true,
                  productCards: true,
                  categorySections: true,
                  announcementBar: true,
                  headerMotif: true,
                  footerMotif: true,
                  sectionDividers: true,
                  ambientBackground: true,
                  fallingParticles: true,
                  headerMotion: true,
                  stringLights: true,
                  cardRibbons: true,
                  interactiveSparkles: true
                }
              };
            });
            localStorage.setItem('zada_festival_themes', JSON.stringify(themes));
            localStorage.setItem('zada_active_theme', 'theme-${preset}');
          })()
        `
      });
      await wait(500);
    }

    // 1. DEFAULT ZADA (HOMEPAGE)
    console.log('1. Capturing Default ZaDa Theme...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/' });
    await wait(2000);
    await activatePreset('default');
    await send(pageWs, 'Page.reload');
    await wait(2500);
    await takeScreenshot('1_default_zada_homepage.png', 1440, 1100);

    // 2. CHRISTMAS RICH (HOMEPAGE: Announcement with Sleigh + Lights, Hero with Pine/Gifts/Snow, Products with Ribbons)
    console.log('2. Capturing Christmas Rich Experience...');
    await activatePreset('christmas', 'rich');
    await send(pageWs, 'Page.reload');
    await wait(2500);
    await takeScreenshot('2_christmas_rich_experience.png', 1440, 1100);

    // 3. EID RICH (HOMEPAGE: Swinging Lanterns, Crescent Moon, Emerald Atmosphere, Islamic Patterns, Barakah Ribbons)
    console.log('3. Capturing Eid Rich Experience...');
    await activatePreset('eid', 'rich');
    await send(pageWs, 'Page.reload');
    await wait(2500);
    await takeScreenshot('3_eid_rich_experience.png', 1440, 1100);

    // 4. ONAM RICH (HOMEPAGE: Nilavilakku with Glowing Flame, Falling Petals, Kasavu Gold Atmosphere, Onasadhya Ribbons)
    console.log('4. Capturing Onam Rich Experience...');
    await activatePreset('onam', 'rich');
    await send(pageWs, 'Page.reload');
    await wait(2500);
    await takeScreenshot('4_onam_rich_experience.png', 1440, 1100);

    // 5. DIWALI RICH (HOMEPAGE: Glowing Diyas with Flames, Floating Sparks, Velvety Plum Atmosphere, Festive Ribbons)
    console.log('5. Capturing Diwali Rich Experience...');
    await activatePreset('diwali', 'rich');
    await send(pageWs, 'Page.reload');
    await wait(2500);
    await takeScreenshot('5_diwali_rich_experience.png', 1440, 1100);

    // 6. PRODUCT SECTION SCROLL (CHRISTMAS RICH)
    console.log('6. Capturing Product Section Details in Christmas Rich...');
    await activatePreset('christmas', 'rich');
    await send(pageWs, 'Page.reload');
    await wait(2000);
    await send(pageWs, 'Runtime.evaluate', {
      expression: `window.scrollTo({ top: 680, behavior: 'instant' });`
    });
    await wait(1000);
    await takeScreenshot('6_christmas_product_sections_ribbons.png', 1440, 950);

    // 7. PRODUCT SECTION SCROLL (DIWALI RICH)
    console.log('7. Capturing Product Section Details in Diwali Rich...');
    await activatePreset('diwali', 'rich');
    await send(pageWs, 'Page.reload');
    await wait(2000);
    await send(pageWs, 'Runtime.evaluate', {
      expression: `window.scrollTo({ top: 680, behavior: 'instant' });`
    });
    await wait(1000);
    await takeScreenshot('7_diwali_product_sections_ribbons.png', 1440, 950);

    // 8. MOBILE VIEWPORT (390px — CHRISTMAS RICH)
    console.log('8. Capturing Mobile Homepage in Christmas Rich (390px)...');
    await activatePreset('christmas', 'rich');
    await send(pageWs, 'Page.reload');
    await wait(2000);
    await takeScreenshot('8_mobile_christmas_rich_390px.png', 390, 844, true);

    // 9. MOBILE VIEWPORT (390px — DIWALI RICH)
    console.log('9. Capturing Mobile Homepage in Diwali Rich (390px)...');
    await activatePreset('diwali', 'rich');
    await send(pageWs, 'Page.reload');
    await wait(2000);
    await takeScreenshot('9_mobile_diwali_rich_390px.png', 390, 844, true);

    // 10. RESTORE DEFAULT VERIFICATION
    console.log('10. Restoring and Verifying Default ZaDa Theme...');
    await activatePreset('default');
    await send(pageWs, 'Page.reload');
    await wait(2000);
    await takeScreenshot('10_restored_default_storefront.png', 1440, 1100);

    console.log('ALL IMMERSIVE FESTIVAL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } finally {
    proc.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch {}
  }
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
