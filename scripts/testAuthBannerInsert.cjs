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

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SUPABASE_ANON_KEY = env['VITE_SUPABASE_ANON_KEY'];

function req(urlStr, method, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const r = https.request({
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method,
      headers
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
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function main() {
  console.log('1. Signing in admin@zadafoods.com ...');
  const loginRes = await req(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, 'POST', {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  }, {
    email: 'admin@zadafoods.com',
    password: 'AdminPassword@123'
  });

  console.log('Login status:', loginRes.status);
  const token = loginRes.data?.access_token;
  if (!token) {
    console.log('No access token received:', loginRes.data);
    return;
  }
  console.log('Access token received successfully! User ID:', loginRes.data.user?.id);

  console.log('\n2. Testing INSERT homepage_banners with Authenticated JWT ...');
  const insertRes = await req(`${SUPABASE_URL}/rest/v1/homepage_banners`, 'POST', {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }, {
    title: 'Authenticated Admin Banner Test',
    subtitle: 'Testing RLS',
    display_order: 10,
    is_active: false
  });

  console.log('Insert status:', insertRes.status);
  console.log('Insert result:', insertRes.data || insertRes.raw);
}

main().catch(console.error);
