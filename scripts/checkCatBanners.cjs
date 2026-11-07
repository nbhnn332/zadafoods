const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2 && !parts[0].startsWith('#')) envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function checkCategoryBanners() {
  const { data: cats } = await supabase.from('categories').select('*');
  console.log('Categories in DB:', cats?.map(c => ({ id: c.id, slug: c.slug, name: c.name })));

  // Check what columns are accepted by trying select with each column
  const cols = ['id', 'category_id', 'category_slug', 'title', 'subtitle', 'eyebrow', 'background_color', 'text_color', 'image_url', 'display_order', 'is_active'];
  for (const c of cols) {
    const { error } = await supabase.from('category_banners').select(c).limit(1);
    console.log(`Column ${c}:`, error ? error.message : 'EXISTS');
  }
}

checkCategoryBanners();
