const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkTables() {
  const tables = [
    'products',
    'categories',
    'subcategories',
    'product_images',
    'orders',
    'order_items',
    'homepage_banners',
    'category_banners',
    'homepage_sections',
    'profiles',
    'admin_roles',
    'admin_accounts',
    'admin_permissions',
    'admin_audit_logs',
    'inventory_logs',
    'coupons',
    'combos',
    'reviews',
    'bulk_enquiries'
  ];

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table ${t}: ERROR -> ${error.message} (code: ${error.code})`);
    } else {
      console.log(`Table ${t}: OK (records found: ${data.length})`);
    }
  }
}

checkTables().catch(console.error);
