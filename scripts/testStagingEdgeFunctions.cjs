const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const SUPABASE_URL = env['VITE_SUPABASE_URL'] || 'https://qjuvwrjpbwxkqyvffbcy.supabase.co';
const SUPABASE_ANON_KEY = env['VITE_SUPABASE_ANON_KEY'];

function sendFnRequest(fnName, method, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/functions/v1/${fnName}`);
    const req = https.request(url, {
      method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...headers
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('=== Staging Edge Functions Live Endpoint Audit ===\n');

  console.log('1. Probing create-razorpay-order...');
  try {
    const res1 = await sendFnRequest('create-razorpay-order', 'POST', {});
    console.log('Status:', res1.status, 'Response:', res1.data || res1.raw);
  } catch (err) {
    console.log('Error reaching create-razorpay-order:', err.message);
  }

  console.log('\n2. Probing verify-razorpay-payment...');
  try {
    const res2 = await sendFnRequest('verify-razorpay-payment', 'POST', {});
    console.log('Status:', res2.status, 'Response:', res2.data || res2.raw);
  } catch (err) {
    console.log('Error reaching verify-razorpay-payment:', err.message);
  }

  console.log('\n3. Probing razorpay-webhook...');
  try {
    const res3 = await sendFnRequest('razorpay-webhook', 'POST', { test: true }, {
      'x-razorpay-signature': 'invalid_signature_test'
    });
    console.log('Status:', res3.status, 'Response:', res3.data || res3.raw);
  } catch (err) {
    console.log('Error reaching razorpay-webhook:', err.message);
  }
}

main().catch(console.error);
