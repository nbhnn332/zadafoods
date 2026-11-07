const https = require('https');

const SUPABASE_URL = 'https://qjuvwrjpbwxkqyvffbcy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdXZ3cmpwYnd4a3F5dmZmYmN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNzk5MTAsImV4cCI6MjEwODY1NTkxMH0.zxPM3jOaVyCXx8QX370lKzC6s8msXTDHQhs-ix5t8i8';

const passwords = [
  'Admin@123',
  'admin123',
  'Admin123',
  'Admin1234',
  'Admin1234!',
  'Admin123456!',
  'ZadaFoods@2026',
  'Zada@2026',
  'Admin@Zada2026',
  'Admin@zadafoods.com',
  'admin@zadafoods.com',
  'password',
  'Password123!',
  'password123!',
  'zadaadmin',
  'ZadaAdmin2026!',
  'admin',
  'Admin',
  'superadmin',
  'SuperAdmin@123',
  'ZadaFoods2026',
  'zada2026'
];

function tryLogin(email, password) {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/auth/v1/token?grant_type=password`);
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
    r.write(JSON.stringify({ email, password }));
    r.end();
  });
}

async function main() {
  for (const p of passwords) {
    const res = await tryLogin('admin@zadafoods.com', p);
    if (res.status === 200) {
      console.log('SUCCESS! Found password:', p);
      console.log('Token:', res.data.access_token);
      return;
    }
  }
  console.log('None of the common passwords matched.');
}

main();
