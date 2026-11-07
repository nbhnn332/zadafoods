const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2 && !parts[0].startsWith('#')) envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function testLogin(email, password) {
  console.log(`Testing login for ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.log(`  Error: ${error.message}`);
    return null;
  }
  console.log(`  SUCCESS! User ID: ${data.user.id}, email: ${data.user.email}`);
  return data.session;
}

async function run() {
  const testEmails = [
    'admin.zadafoods.superad@gmail.com',
    'superadmin@zadafoods.com',
    'numan@example.com',
    'admin@zadafoods.com',
    'test@example.com'
  ];
  const testPasswords = ['admin123', 'password123', 'SecurePass2026!', 'ZadaAdmin2026!'];

  for (const email of testEmails) {
    for (const pass of testPasswords) {
      const session = await testLogin(email, pass);
      if (session) {
        console.log(`FOUND WORKING CREDENTIALS: ${email} / ${pass}`);
        return;
      }
    }
  }
  console.log('No matching test passwords found.');
}

run();
