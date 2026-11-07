const { spawn } = require('child_process');
const http = require('http');
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
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testSpaNav() {
  const port = 9912;
  const tempProfile = path.join(os.tmpdir(), 'chrome_spa_test_' + Date.now());
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + port, '--user-data-dir=' + tempProfile]);
  try {
    let wsUrl = null;
    for (let i = 0; i < 20; i++) {
      try {
        const v = await fetchJson('http://127.0.0.1:' + port + '/json/version');
        wsUrl = v.webSocketDebuggerUrl;
        if (wsUrl) break;
      } catch { await wait(200); }
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
    const pageWs = new WebSocket('ws://127.0.0.1:' + port + '/devtools/page/' + targetId);
    await new Promise(r => pageWs.onopen = r);
    await send(pageWs, 'Page.enable');

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
    await wait(2500);

    const checkRes = await send(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const links = Array.from(document.querySelectorAll('a')).map(a => ({ text: a.innerText.trim(), href: a.getAttribute('href') }));
        return {
          url: window.location.href,
          h1: document.querySelector('h1')?.innerText,
          navLinks: links.filter(l => l.href && l.href.startsWith('/admin'))
        };
      })()`,
      returnByValue: true
    });
    console.log('SPA State:', JSON.stringify(checkRes.result.value, null, 2));

    pageWs.close();
    ws.close();
  } finally {
    proc.kill();
  }
}
testSpaNav().catch(console.error);
