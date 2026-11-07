const fs = require('fs');
const path = require('path');
const https = require('https');

const envPath = path.resolve(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > -1) {
      env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
    }
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

function makePostgrestRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(endpoint, supabaseUrl);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(data)
          });
        } catch {
          resolve({
            statusCode: res.statusCode,
            data
          });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function probeAllPublicTables() {
  const tables = [
    'categories',
    'subcategories',
    'products',
    'product_variants',
    'product_images',
    'combos',
    'pricing_rules',
    'coupons',
    'reviews',
    'homepage_banners',
    'homepage_sections',
    'store_settings',
    'orders',
    'admin_roles'
  ];

  console.log('=== Public Anon RLS & Table Audit ===');
  for (const tbl of tables) {
    try {
      const res = await makePostgrestRequest(`/rest/v1/${tbl}?select=*&limit=2`);
      const isArray = Array.isArray(res.data);
      console.log(`Table '${tbl}': Status ${res.statusCode}, Rows: ${isArray ? res.data.length : 'N/A'}${res.statusCode === 401 ? ' (401 Protected)' : ''}${res.statusCode === 403 ? ' (403 RLS Denied)' : ''}`);
      if (isArray && res.data.length > 0) {
        const sampleKeys = Object.keys(res.data[0]).slice(0, 4).join(', ');
        console.log(`   Sample columns: ${sampleKeys}...`);
      }
    } catch (e) {
      console.log(`Table '${tbl}': Network Error (${e.message})`);
    }
  }
}

probeAllPublicTables();
