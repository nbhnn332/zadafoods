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
  const port = 9948;
  const tempProfile = path.join(os.tmpdir(), 'chrome_six_themes_' + Date.now());
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

    // Helper to activate a preset
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

    // 1. DEFAULT ZADA
    console.log('1. Capturing Default ZaDa Theme (Desktop & Mobile)...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/' });
    await wait(2000);
    await activatePreset('default');
    await send(pageWs, 'Page.reload');
    await wait(2500);
    await takeScreenshot('theme_1_default_desktop.png', 1440, 1100, false);
    await takeScreenshot('theme_1_default_mobile_390.png', 390, 844, true);

    // 2. CHRISTMAS RICH
    console.log('2. Capturing Christmas Rich Experience (Desktop & Mobile)...');
    await activatePreset('christmas', 'rich');
    await send(pageWs, 'Page.reload');
    await wait(2500);
    await takeScreenshot('theme_2_christmas_desktop.png', 1440, 1100, false);
    await takeScreenshot('theme_2_christmas_mobile_390.png', 390, 844, true);

    // 3. EID RICH
    console.log('3. Capturing Eid Rich Experience (Desktop & Mobile)...');
    await activatePreset('eid', 'rich');
    await send(pageWs, 'Page.reload');
    await wait(2500);
    await takeScreenshot('theme_3_eid_desktop.png', 1440, 1100, false);
    await takeScreenshot('theme_3_eid_mobile_390.png', 390, 844, true);

    // 4. ONAM RICH
    console.log('4. Capturing Onam Rich Experience (Desktop & Mobile)...');
    await activatePreset('onam', 'rich');
    await send(pageWs, 'Page.reload');
    await wait(2500);
    await takeScreenshot('theme_4_onam_desktop.png', 1440, 1100, false);
    await takeScreenshot('theme_4_onam_mobile_390.png', 390, 844, true);

    // 5. DIWALI RICH
    console.log('5. Capturing Diwali Rich Experience (Desktop & Mobile)...');
    await activatePreset('diwali', 'rich');
    await send(pageWs, 'Page.reload');
    await wait(2500);
    await takeScreenshot('theme_5_diwali_desktop.png', 1440, 1100, false);
    await takeScreenshot('theme_5_diwali_mobile_390.png', 390, 844, true);

    // 6. NEW YEAR RICH
    console.log('6. Capturing New Year Rich Experience (Desktop & Mobile)...');
    await activatePreset('new_year', 'rich');
    await send(pageWs, 'Page.reload');
    await wait(2500);
    await takeScreenshot('theme_6_new_year_desktop.png', 1440, 1100, false);
    await takeScreenshot('theme_6_new_year_mobile_390.png', 390, 844, true);

    // 7. RESTORE DEFAULT VERIFICATION
    console.log('7. Restoring and Verifying Default ZaDa Theme...');
    await activatePreset('default');
    await send(pageWs, 'Page.reload');
    await wait(2500);
    await takeScreenshot('theme_7_restored_default_verification.png', 1440, 1100, false);

    // 8. ADMIN THEME CONTROLS
    console.log('8. Capturing Admin Festivals Console...');
    // Seed fake admin user so route doesn't redirect
    await send(pageWs, 'Runtime.evaluate', {
      expression: `
        (() => {
          localStorage.setItem('zada_auth_user', JSON.stringify({
            id: 'admin-super-id',
            email: 'admin@zadafoods.com',
            role: 'super_admin',
            fullName: 'Senior Admin'
          }));
        })()
      `
    });
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/admin/festivals' });
    await wait(2500);
    await takeScreenshot('theme_8_admin_festival_controls.png', 1440, 1100, false);

    console.log('ALL SIX FESTIVAL THEMES CAPTURED IN DESKTOP AND MOBILE LAYOUTS!');
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
