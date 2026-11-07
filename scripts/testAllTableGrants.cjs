const { createClient } = require('@supabase/supabase-js');
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
const supabase = createClient(url, anonKey);

async function testAll() {
  const tables = [
    'categories', 'subcategories', 'products', 'product_variants', 'product_images',
    'combos', 'combo_items', 'pricing_rules', 'coupons', 'reviews',
    'homepage_banners', 'category_banners', 'store_settings', 'store_content_pages',
    'festival_themes', 'orders', 'order_items', 'carts', 'cart_items',
    'admin_accounts', 'admin_roles', 'admin_permissions', 'audit_logs'
  ];

  console.log('Table SELECT check for anon:');
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`  ❌ ${t}: ${error.code} - ${error.message}`);
    } else {
      console.log(`  ✓ ${t}: SELECT OK (${data.length} rows)`);
    }
  }
}

testAll();
