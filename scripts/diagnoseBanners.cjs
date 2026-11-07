const fs = require('fs');
const path = require('path');
const https = require('https');

// Read .env
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SUPABASE_ANON_KEY = env['VITE_SUPABASE_ANON_KEY'];

function request(method, pathQuery, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const isAuth = pathQuery.startsWith('auth/v1/');
    const url = isAuth ? `${SUPABASE_URL}/${pathQuery}` : `${SUPABASE_URL}/rest/v1/${pathQuery}`;
    const parsedUrl = new URL(url);
    const reqHeaders = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...headers
    };
    const req = https.request({
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: reqHeaders
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  console.log('Testing INSERT on orders...');
  const res = await request('POST', 'orders', {
    order_number: `ORD-TEST-${Date.now()}`,
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    customer_phone: '9876543210',
    total_amount: 100,
    items: [],
    shipping_address: { address: 'Test' }
  });
  console.log('Orders insert status:', res.status, res.data || res.raw);
}

main().catch(console.error);
