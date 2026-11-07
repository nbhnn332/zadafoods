const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2 && !parts[0].startsWith('#')) envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function testSignUp() {
  const email = 'superadmin@zadafoods.com';
  const password = 'SuperAdminPass2026!';
  console.log(`Attempting signUp for ${email}...`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'ZaDa Super Administrator'
      }
    }
  });

  if (error) {
    console.log('SignUp error:', error.message);
  } else {
    console.log('SignUp success!', {
      user: data.user ? { id: data.user.id, email: data.user.email, confirmed: data.user.email_confirmed_at } : null,
      session: !!data.session
    });
  }
}

testSignUp();
