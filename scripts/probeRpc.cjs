const https = require('https');

const SUPABASE_URL = 'https://qjuvwrjpbwxkqyvffbcy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdXZ3cmpwYnd4a3F5dmZmYmN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNzk5MTAsImV4cCI6MjEwODY1NTkxMH0.zxPM3jOaVyCXx8QX370lKzC6s8msXTDHQhs-ix5t8i8';

function checkRpc(name) {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/${name}`);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ name, status: res.statusCode, body: d }));
    });
    req.on('error', err => resolve({ name, error: err.message }));
    req.write('{}');
    req.end();
  });
}

async function main() {
  const candidateFns = [
    'is_admin',
    'exec',
    'exec_sql',
    'execute_sql',
    'sql',
    'run_sql',
    'query',
    'atomic_order_inventory_decrement',
    'atomic_order_cancellation_restock',
    'release_unpaid_whatsapp_or_abandoned_orders',
    'manage_banners',
    'admin_save_banner',
    'save_banner'
  ];

  for (const fn of candidateFns) {
    const res = await checkRpc(fn);
    console.log(`RPC ${fn}: status ${res.status}`);
  }
}

main();
