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

const SUPABASE_URL = env['VITE_SUPABASE_URL'] || 'https://qjuvwrjpbwxkqyvffbcy.supabase.co';
const SUPABASE_ANON_KEY = env['VITE_SUPABASE_ANON_KEY'];

function queryTable(table, query = '') {
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('--- 1. Staging Products ---');
  const prods = await queryTable('products', 'select=*');
  console.log(JSON.stringify(prods.data, null, 2));

  console.log('--- 2. Staging Product Variants ---');
  const variants = await queryTable('product_variants', 'select=*');
  console.log(JSON.stringify(variants.data, null, 2));

  console.log('--- 3. Staging Homepage Banners ---');
  const banners = await queryTable('homepage_banners', 'select=*');
  console.log(JSON.stringify(banners.data, null, 2));

  console.log('--- 4. Staging Store Settings ---');
  const settings = await queryTable('store_settings', 'select=*');
  console.log(JSON.stringify(settings.data, null, 2));
}

main().catch(console.error);
