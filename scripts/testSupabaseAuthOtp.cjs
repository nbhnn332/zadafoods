const https = require('https');

const SUPABASE_URL = 'https://qjuvwrjpbwxkqyvffbcy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdXZ3cmpwYnd4a3F5dmZmYmN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNzk5MTAsImV4cCI6MjEwODY1NTkxMH0.zxPM3jOaVyCXx8QX370lKzC6s8msXTDHQhs-ix5t8i8';

function req(pathQuery, body) {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/${pathQuery}`);
    const r = https.request(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) });
        } catch {
          resolve({ status: res.statusCode, raw: d });
        }
      });
    });
    r.write(JSON.stringify(body));
    r.end();
  });
}

async function main() {
  console.log('Testing auth methods on Supabase...');
  // Check if signInWithOtp or passwordless is available
  const otpRes = await req('auth/v1/otp', {
    email: 'admin@zadafoods.com',
    create_user: false
  });
  console.log('OTP status:', otpRes.status, otpRes.data || otpRes.raw);
}

main();
