const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

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

async function captureScreenshot(pageUrl, outputPath, width = 443, height = 887) {
  const port = 9444;
  const tempProfile = path.join(os.tmpdir(), 'chrome_cdp_' + Date.now());
  const proc = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`
  ]);

  let browserWsUrl = null;
  for (let i = 0; i < 20; i++) {
    try {
      const v = await fetchJson(`http://127.0.0.1:${port}/json/version`);
      browserWsUrl = v.webSocketDebuggerUrl;
      if (browserWsUrl) break;
    } catch {
      await wait(200);
    }
  }

  if (!browserWsUrl) {
    proc.kill();
    throw new Error('Chrome did not start debugging port');
  }

  // 1. Connect to browser to create a new page target
  const browserWs = new WebSocket(browserWsUrl);
  await new Promise(r => browserWs.onopen = r);

  let msgId = 1;
  function sendBrowser(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === id) {
          browserWs.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      browserWs.addEventListener('message', handler);
      browserWs.send(JSON.stringify({ id, method, params }));
    });
  }

  const { targetId } = await sendBrowser('Target.createTarget', { url: pageUrl });
  browserWs.close();

  // 2. Connect directly to the created page
  const pageWsUrl = `ws://127.0.0.1:${port}/devtools/page/${targetId}`;
  const pageWs = new WebSocket(pageWsUrl);
  await new Promise(r => pageWs.onopen = r);

  function sendPage(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === id) {
          pageWs.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      pageWs.addEventListener('message', handler);
      pageWs.send(JSON.stringify({ id, method, params }));
    });
  }

  pageWs.addEventListener('message', (evt) => {
    try {
      const d = JSON.parse(evt.data);
      if (d.method === 'Runtime.exceptionThrown') {
        console.error('PAGE EXCEPTION:', d.params.exceptionDetails?.exception?.description || d.params.exceptionDetails?.text);
      } else if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) {
        console.warn('PAGE CONSOLE ' + d.params.type.toUpperCase() + ':', d.params.args?.map(a => a.value || a.description));
      }
    } catch {}
  });

  await sendPage('Runtime.enable');
  await sendPage('Page.enable');
  await sendPage('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: true
  });

  // Wait for React rendering & data loading
  await wait(3500);

  const snap = await sendPage('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false
  });

  if (snap && snap.data) {
    const buf = Buffer.from(snap.data, 'base64');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buf);
    console.log(`Successfully captured ${outputPath} (${buf.length} bytes, ${width}x${height} @2x)`);
  } else {
    console.error('Failed to capture screenshot data:', snap);
  }

  pageWs.close();
  proc.kill();
}

const args = process.argv.slice(2);
const targetUrl = args[0] || 'http://127.0.0.1:5173/';
const outputFile = args[1] || 'screenshots/current_home.png';

captureScreenshot(targetUrl, outputFile).catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
