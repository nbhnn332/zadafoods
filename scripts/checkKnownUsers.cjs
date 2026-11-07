const https = require('https');

const SUPABASE_URL = 'https://qjuvwrjpbwxkqyvffbcy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdXZ3cmpwYnd4a3F5dmZmYmN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNzk5MTAsImV4cCI6MjEwODY1NTkxMH0.zxPM3jOaVyCXx8QX370lKzC6s8msXTDHQhs-ix5t8i8';

async function checkUser(email, pass) {
  return new Promise(res => {
    const r = https.request(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }
    }, response => {
      let b = '';
      response.on('data', c => b += c);
      response.on('end', () => res({ status: response.statusCode, data: JSON.parse(b) }));
    });
    r.write(JSON.stringify({ email, password: pass }));
    r.end();
  });
}

async function main() {
  const users = [
    { email: 'numan@example.com', pass: 'password123' },
    { email: 'test@example.com', pass: 'password123' },
    { email: 'user@example.com', pass: 'password123' },
    { email: 'care@zadafoods.com', pass: 'password123' },
    { email: 'superadmin@zadafoods.com', pass: 'password123' }
  ];

  for (const u of users) {
    const res = await checkUser(u.email, u.pass);
    console.log(u.email, res.status, res.data?.error_code || res.data?.message || (res.status === 200 ? 'SUCCESS' : res.data));
  }
}

main();
