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

async function inspectColumns() {
  console.log('--- Columns in coupons ---');
  const { data: coup, error: coupErr } = await supabase.from('coupons').select('*').limit(1);
  if (coup && coup.length > 0) {
    console.log('Coupons columns:', Object.keys(coup[0]));
    console.log('Sample coupon:', coup[0]);
  } else {
    console.log('Coupons error/empty:', coupErr);
  }

  console.log('\n--- Columns in combos ---');
  const { data: cb, error: cbErr } = await supabase.from('combos').select('*').limit(1);
  if (cb && cb.length > 0) {
    console.log('Combos columns:', Object.keys(cb[0]));
    console.log('Sample combo:', cb[0]);
  } else {
    console.log('Combos empty or error:', cbErr ? cbErr.message : '0 rows');
  }

  console.log('\n--- Columns in reviews ---');
  const { data: rev, error: revErr } = await supabase.from('reviews').select('*').limit(1);
  if (rev && rev.length > 0) {
    console.log('Reviews columns:', Object.keys(rev[0]));
    console.log('Sample review:', rev[0]);
  } else {
    console.log('Reviews empty or error:', revErr ? revErr.message : '0 rows');
  }

  console.log('\n--- Columns in pricing_rules ---');
  const { data: pr, error: prErr } = await supabase.from('pricing_rules').select('*').limit(1);
  if (pr && pr.length > 0) {
    console.log('Pricing_rules columns:', Object.keys(pr[0]));
    console.log('Sample rule:', pr[0]);
  } else {
    console.log('Pricing_rules empty or error:', prErr ? prErr.message : '0 rows');
  }

  console.log('\n--- Columns in category_banners ---');
  const { data: catb, error: catbErr } = await supabase.from('category_banners').select('*').limit(1);
  if (catb && catb.length > 0) {
    console.log('Category_banners columns:', Object.keys(catb[0]));
    console.log('Sample banner:', catb[0]);
  } else {
    console.log('Category_banners empty or error:', catbErr ? catbErr.message : '0 rows');
  }
}

inspectColumns();
