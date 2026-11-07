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

async function check() {
  console.log('--- Checking profiles ---');
  const { data: p, error: pe } = await supabase.from('profiles').select('*').limit(10);
  console.log('profiles:', pe ? pe.message : p);

  console.log('--- Checking admin_roles ---');
  const { data: ar, error: are } = await supabase.from('admin_roles').select('*').limit(10);
  console.log('admin_roles:', are ? are.message : ar);

  console.log('--- Checking admin_accounts ---');
  const { data: aa, error: aae } = await supabase.from('admin_accounts').select('*').limit(10);
  console.log('admin_accounts:', aae ? aae.message : aa);
}

check();
