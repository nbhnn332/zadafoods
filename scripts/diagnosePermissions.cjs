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

console.log('Testing staging URL:', url);
const supabase = createClient(url, anonKey);

async function run() {
  console.log('\n--- 1. Testing SELECT on pricing_rules ---');
  const { data: prData, error: prErr } = await supabase.from('pricing_rules').select('*').limit(3);
  console.log('pricing_rules select:', prErr ? prErr.message : `Success (${prData.length} rows)`);

  console.log('\n--- 2. Testing SELECT on combos ---');
  const { data: cbData, error: cbErr } = await supabase.from('combos').select('*').limit(3);
  console.log('combos select:', cbErr ? cbErr.message : `Success (${cbData.length} rows)`);

  console.log('\n--- 3. Testing SELECT on homepage_banners ---');
  const { data: hbData, error: hbErr } = await supabase.from('homepage_banners').select('*').limit(3);
  console.log('homepage_banners select:', hbErr ? hbErr.message : `Success (${hbData.length} rows)`);

  console.log('\n--- 4. Testing SELECT on category_banners ---');
  const { data: catbData, error: catbErr } = await supabase.from('category_banners').select('*').limit(3);
  console.log('category_banners select:', catbErr ? catbErr.message : `Success (${catbData.length} rows)`);

  console.log('\n--- 5. Testing SELECT on coupons ---');
  const { data: coupData, error: coupErr } = await supabase.from('coupons').select('*').limit(3);
  console.log('coupons select:', coupErr ? coupErr.message : `Success (${coupData.length} rows)`);

  console.log('\n--- 6. Testing SELECT on reviews ---');
  const { data: revData, error: revErr } = await supabase.from('reviews').select('*').limit(5);
  console.log('reviews select:', revErr ? revErr.message : `Success (${revData.length} rows)`);
}

run();
