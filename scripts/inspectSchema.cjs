const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2 && !parts[0].startsWith('#')) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const url = envVars.VITE_SUPABASE_URL;
const anonKey = envVars.VITE_SUPABASE_ANON_KEY;

async function fetchSwagger() {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`
    }
  });
  const data = await res.json();
  const defs = data.definitions || {};

  const tables = ['combos', 'combo_items', 'reviews', 'category_banners', 'homepage_banners', 'pricing_rules', 'coupons'];
  for (const t of tables) {
    console.log(`\n================ ${t} ================`);
    if (defs[t]) {
      const props = defs[t].properties || {};
      for (const [col, info] of Object.entries(props)) {
        console.log(`  ${col}: ${info.type} (${info.format || ''}) ${info.description || ''}`);
      }
    } else {
      console.log(`Table ${t} NOT FOUND in swagger definitions!`);
    }
  }
}

fetchSwagger();
