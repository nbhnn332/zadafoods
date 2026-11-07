const { spawn } = require('child_process');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const proc = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--remote-debugging-port=9333',
  '--user-data-dir=C:\\Users\\nabha\\AppData\\Local\\Temp\\chrome_debug_test'
]);

proc.stdout.on('data', d => console.log('stdout:', d.toString()));
proc.stderr.on('data', d => console.log('stderr:', d.toString()));

setTimeout(() => {
  http.get('http://127.0.0.1:9333/json/version', res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
      console.log('Version info:', b);
      proc.kill();
      process.exit(0);
    });
  }).on('error', err => {
    console.error('HTTP Error:', err.message);
    proc.kill();
    process.exit(1);
  });
}, 2000);
