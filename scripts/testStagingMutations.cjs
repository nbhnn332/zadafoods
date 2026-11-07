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

async function testMutations() {
  console.log('Testing mutations with anon (public client):');

  console.log('\n1. Test INSERT on pricing_rules:');
  const { error: prErr } = await supabase.from('pricing_rules').insert({
    id: `pr-test-${Date.now()}`,
    name: 'Test Rule',
    rule_type: 'VOLUME_DISCOUNT',
    min_quantity: 2,
    discount_percentage: 10,
    is_active: false
  });
  console.log('pricing_rules insert error:', prErr ? `${prErr.code} - ${prErr.message}` : 'SUCCESS');

  console.log('\n2. Test INSERT on combos:');
  const { error: cbErr } = await supabase.from('combos').insert({
    id: `cb-test-${Date.now()}`,
    name: 'Test Combo',
    slug: `test-combo-${Date.now()}`,
    combo_price: 500,
    is_active: false
  });
  console.log('combos insert error:', cbErr ? `${cbErr.code} - ${cbErr.message}` : 'SUCCESS');

  console.log('\n3. Test INSERT on homepage_banners:');
  const { error: hbErr } = await supabase.from('homepage_banners').insert({
    title: 'Test Banner',
    display_order: 99,
    is_active: false
  });
  console.log('homepage_banners insert error:', hbErr ? `${hbErr.code} - ${hbErr.message}` : 'SUCCESS');

  console.log('\n4. Test INSERT on category_banners:');
  const { error: catbErr } = await supabase.from('category_banners').insert({
    title: 'Test Cat Banner',
    category_id: 'chips',
    is_active: false
  });
  console.log('category_banners insert error:', catbErr ? `${catbErr.code} - ${catbErr.message}` : 'SUCCESS');

  console.log('\n5. Test INSERT on coupons:');
  const { error: coupErr } = await supabase.from('coupons').insert({
    code: `TEST${Date.now()}`,
    discount_type: 'FIXED',
    discount_amount: 50,
    is_active: false
  });
  console.log('coupons insert error:', coupErr ? `${coupErr.code} - ${coupErr.message}` : 'SUCCESS');

  console.log('\n6. Test INSERT on reviews:');
  const { error: revErr } = await supabase.from('reviews').insert({
    reviewer_name: 'Test Reviewer',
    rating: 5,
    status: 'pending'
  });
  console.log('reviews insert error:', revErr ? `${revErr.code} - ${revErr.message}` : 'SUCCESS');
}

testMutations();
