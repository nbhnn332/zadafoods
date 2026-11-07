const fs = require('fs');
const path = require('path');
const https = require('https');

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const SUPABASE_URL = env['VITE_SUPABASE_URL'] || 'https://qjuvwrjpbwxkqyvffbcy.supabase.co';
const SUPABASE_ANON_KEY = env['VITE_SUPABASE_ANON_KEY'];

function sendRequest(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
    const req = https.request(url, {
      method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...headers
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('--- Test 1: Public Anon Read on homepage_banners ---');
  const readRes = await sendRequest('GET', 'homepage_banners?select=*');
  console.log('GET Status:', readRes.status);
  console.log('Active banners count:', Array.isArray(readRes.data) ? readRes.data.length : readRes.data);

  console.log('\n--- Test 2: Unauthorized Anon Insert on homepage_banners (RLS Check) ---');
  const insertRes = await sendRequest('POST', 'homepage_banners', {
    title: 'Hacked Banner',
    image_url: 'https://evil.com/banner.png',
    is_active: true
  });
  console.log('POST Status:', insertRes.status);
  console.log('POST Result (Expected 401/403 or RLS error):', insertRes.data || insertRes.raw);

  console.log('\n--- Test 3: Unauthorized Anon Delete on homepage_banners ---');
  const deleteRes = await sendRequest('DELETE', 'homepage_banners?title=eq.Hacked Banner');
  console.log('DELETE Status:', deleteRes.status);
  console.log('DELETE Result:', deleteRes.data || deleteRes.raw);
}

main().catch(console.error);
