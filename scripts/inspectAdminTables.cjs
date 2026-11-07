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

async function inspect() {
  console.log('Testing connection to Supabase...');
  
  // 1. Profiles
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  console.log('PROFILES:', pErr ? pErr.message : profiles);

  // 2. Admin Roles
  const { data: roles, error: rErr } = await supabase.from('admin_roles').select('*');
  console.log('ADMIN ROLES:', rErr ? rErr.message : roles);

  // 3. Admin Accounts
  const { data: accounts, error: aErr } = await supabase.from('admin_accounts').select('*');
  console.log('ADMIN ACCOUNTS:', aErr ? aErr.message : accounts);

  // 4. Admin Permissions
  const { data: perms, error: permErr } = await supabase.from('admin_permissions').select('*');
  console.log('ADMIN PERMISSIONS:', permErr ? permErr.message : perms);
}

inspect().catch(console.error);
