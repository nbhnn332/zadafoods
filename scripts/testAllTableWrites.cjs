const https = require('https');

const SUPABASE_URL = 'https://qjuvwrjpbwxkqyvffbcy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdXZ3cmpwYnd4a3F5dmZmYmN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNzk5MTAsImV4cCI6MjEwODY1NTkxMH0.zxPM3jOaVyCXx8QX370lKzC6s8msXTDHQhs-ix5t8i8';

function testTable(table) {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
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
      res.on('end', () => resolve({ table, status: res.statusCode, body: d }));
    });
    req.on('error', err => resolve({ table, error: err.message }));
    req.write('{}');
    req.end();
  });
}

async function main() {
  const tables = [
    'homepage_banners',
    'category_banners',
    'homepage_sections',
    'categories',
    'subcategories',
    'products',
    'orders',
    'customer_reviews',
    'reviews',
    'bulk_enquiries',
    'store_settings',
    'profiles',
    'admin_roles'
  ];

  for (const t of tables) {
    const res = await testTable(t);
    const shortBody = res.body ? res.body.substring(0, 100) : res.error;
    console.log(`${t.padEnd(20)}: ${res.status} | ${shortBody}`);
  }
}

main();
