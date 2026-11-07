const https = require('https');

const SUPABASE_URL = 'https://qjuvwrjpbwxkqyvffbcy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdXZ3cmpwYnd4a3F5dmZmYmN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNzk5MTAsImV4cCI6MjEwODY1NTkxMH0.zxPM3jOaVyCXx8QX370lKzC6s8msXTDHQhs-ix5t8i8';

function req(endpoint, body) {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/${endpoint}`);
    const r = https.request(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    r.write(JSON.stringify(body));
    r.end();
  });
}

async function main() {
  const email = `test_admin_${Date.now()}@zadafoods.com`;
  const password = 'TestAdminPassword123!';
  console.log('Signing up', email);
  const signupRes = await req('auth/v1/signup', {
    email,
    password,
    data: { role: 'admin', full_name: 'Super Admin' }
  });
  console.log('Signup status:', signupRes.status);
  console.log('Signup response:', signupRes.data);

  if (signupRes.data && signupRes.data.access_token) {
    console.log('Immediate access token received!');
  } else {
    console.log('Attempting login...');
    const loginRes = await req('auth/v1/token?grant_type=password', {
      email,
      password
    });
    console.log('Login status:', loginRes.status);
    console.log('Login response:', loginRes.data);
  }
}

main();
