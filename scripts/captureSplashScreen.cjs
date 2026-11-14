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
  const port = 9968;
  const tempProfile = path.join(os.tmpdir(), 'chrome_splash_' + Date.now());
  const proc = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--window-size=1440,960'
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

    async function evaluate(ws, expression) {
      const res = await send(ws, 'Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result ? res.result.value : undefined;
    }

    async function waitForSplashTagline(ws) {
      for (let i = 0; i < 40; i++) {
        const phase = await evaluate(
          ws,
          `document.querySelector('[data-splash-phase]')?.getAttribute('data-splash-phase')`
        );
        if (phase === 'tagline') {
          return true;
        }
        await wait(100);
      }
      return false;
    }

    async function takeScreenshot(ws, filename) {
      const res = await send(ws, 'Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(res.data, 'base64');
      const localPath = path.join(LOCAL_SCREENSHOTS_DIR, filename);
      fs.writeFileSync(localPath, buffer);
      console.log(`Saved screenshot: ${localPath}`);

      if (fs.existsSync(ARTIFACT_DIR)) {
        const artifactPath = path.join(ARTIFACT_DIR, filename);
        fs.writeFileSync(artifactPath, buffer);
        console.log(`Saved artifact: ${artifactPath}`);
      }
    }

    await send(pageWs, 'Page.enable');
    await send(pageWs, 'Runtime.enable');

    // Capture 1: Desktop Default Brand Reveal (No Festival Badge, Pure Kerala ZaDa Brand Reveal)
    console.log('Navigating to Default Brand Splash (Desktop 1440x960)...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/?splash=1&theme=default' });
    await waitForSplashTagline(pageWs);
    await wait(350);
    console.log('Capturing Desktop Default Splash...');
    await takeScreenshot(pageWs, 'splash_01_brand_reveal_desktop.png');

    // Capture 2: Mobile Viewport 390x844
    console.log('Configuring mobile 390x844 viewport...');
    await send(pageWs, 'Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/?splash=1&theme=default' });
    await waitForSplashTagline(pageWs);
    await wait(350);
    console.log('Capturing Mobile Splash...');
    await takeScreenshot(pageWs, 'splash_02_mobile_reveal_390px.png');

    // Reset back to desktop viewport
    await send(pageWs, 'Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 960,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Capture 3: Christmas Theme Splash
    console.log('Navigating to Christmas Theme Splash...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/?splash=1&theme=christmas' });
    await waitForSplashTagline(pageWs);
    await wait(350);
    console.log('Capturing Christmas Splash...');
    await takeScreenshot(pageWs, 'splash_03_christmas_theme.png');

    // Capture 4: Diwali Theme Splash
    console.log('Navigating to Diwali Theme Splash...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/?splash=1&theme=diwali' });
    await waitForSplashTagline(pageWs);
    await wait(350);
    console.log('Capturing Diwali Splash...');
    await takeScreenshot(pageWs, 'splash_04_diwali_theme.png');

    // Capture 5: Onam Theme Splash
    console.log('Navigating to Onam Theme Splash...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/?splash=1&theme=onam' });
    await waitForSplashTagline(pageWs);
    await wait(350);
    console.log('Capturing Onam Splash...');
    await takeScreenshot(pageWs, 'splash_05_onam_theme.png');

    // Capture 6: Eid Theme Splash
    console.log('Navigating to Eid Theme Splash...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/?splash=1&theme=eid' });
    await waitForSplashTagline(pageWs);
    await wait(350);
    console.log('Capturing Eid Splash...');
    await takeScreenshot(pageWs, 'splash_06_eid_theme.png');

    // Capture 7: Storefront Transition Complete (Cross-fade exit finished)
    console.log('Allowing splash to complete transition and settle storefront...');
    await send(pageWs, 'Page.navigate', { url: 'http://localhost:5173/?theme=default' });
    await wait(3500);
    console.log('Capturing settled storefront after transition...');
    await takeScreenshot(pageWs, 'splash_07_storefront_transition_complete.png');

    console.log('All splash screen captures completed successfully!');
    pageWs.close();
  } catch (err) {
    console.error('Capture error:', err);
  } finally {
    proc.kill();
  }
}

capture();
