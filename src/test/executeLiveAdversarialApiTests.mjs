// In Node.js 18+, fetch is available globally.

const SUPABASE_URL = 'https://ykzgqaepayuqatgbvsoq.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdXZ3cmpwYnd4a3F5dmZmYmN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNzk5MTAsImV4cCI6MjEwODY1NTkxMH0.zxPM3jOaVyCXx8QX370lKzC6s8msXTDHQhs-ix5t8i8';

async function runAdversarialTests() {
  const results = [];
  console.log('=== Running Phase 20 Live Adversarial API Tests against Staging ===\n');

  // 1. Direct REST Order Insertion with payment_status = 'PAID'
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        order_number: 'ATTACK-PAID-001',
        customer_name: 'Adversary User',
        customer_email: 'attacker@example.com',
        customer_phone: '9999999999',
        shipping_address: { street: 'Attacker Lane', city: 'Dark Web' },
        delivery_method: 'STANDARD',
        payment_mode: 'COD',
        payment_status: 'PAID', // Malicious status!
        subtotal_amount: 1,
        total_amount: 1
      })
    });
    const status = res.status;
    const body = await res.text();
    results.push({
      test: 'Direct REST attempt: payment_status = PAID',
      status,
      denied: status >= 400,
      details: body.slice(0, 150)
    });
  } catch (err) {
    results.push({ test: 'Direct REST attempt: payment_status = PAID', error: err.message });
  }

  // 2. Direct REST Order Insertion with ₹1 Manipulated Total
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        order_number: 'ATTACK-1INR-001',
        customer_name: 'Adversary Price Tamper',
        customer_email: 'tamper@example.com',
        customer_phone: '9999999999',
        shipping_address: { street: 'Tamper Rd' },
        delivery_method: 'STANDARD',
        payment_mode: 'COD',
        payment_status: 'PENDING',
        subtotal_amount: 1.00, // Malicious ₹1 claimed subtotal
        total_amount: 1.00    // Malicious ₹1 claimed total
      })
    });
    const status = res.status;
    const body = await res.text();
    results.push({
      test: 'Direct REST attempt: ₹1 manipulated total_amount',
      status,
      denied: status >= 400,
      details: body.slice(0, 150)
    });
  } catch (err) {
    results.push({ test: 'Direct REST attempt: ₹1 manipulated total_amount', error: err.message });
  }

  // 3. Unauthorized Store Settings Modification via REST
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/store_settings?key=eq.checkout`, {
      method: 'PATCH',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        value: { isCodGloballyEnabled: false, tampered: true }
      })
    });
    const status = res.status;
    const body = await res.text();
    results.push({
      test: 'Direct REST attempt: Unauthorized store_settings modification',
      status,
      denied: status >= 400 || body === '[]' || body === '',
      details: body.slice(0, 150)
    });
  } catch (err) {
    results.push({ test: 'Direct REST attempt: Unauthorized store_settings modification', error: err.message });
  }

  // 4. Unauthorized Product Catalog Creation via Anonymous REST
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Hacked Injected Product',
        slug: 'hacked-product',
        is_published: true
      })
    });
    const status = res.status;
    const body = await res.text();
    results.push({
      test: 'Direct REST attempt: Unauthorized product catalog insertion',
      status,
      denied: status >= 400,
      details: body.slice(0, 150)
    });
  } catch (err) {
    results.push({ test: 'Direct REST attempt: Unauthorized product catalog insertion', error: err.message });
  }

  // 5. Enumeration of Administrative Roles via Anonymous REST
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/admin_roles`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    const status = res.status;
    const body = await res.text();
    results.push({
      test: 'Direct REST attempt: Anonymous enumeration of admin_roles',
      status,
      denied: status >= 400 || body === '[]',
      details: body.slice(0, 150)
    });
  } catch (err) {
    results.push({ test: 'Direct REST attempt: Anonymous enumeration of admin_roles', error: err.message });
  }

  // 6. Direct REST Cart Access without verified token
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/carts`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    const status = res.status;
    const body = await res.text();
    results.push({
      test: 'Direct REST attempt: Anonymous query on carts table without x-cart-token',
      status,
      denied: status >= 400 || body === '[]',
      details: body.slice(0, 150)
    });
  } catch (err) {
    results.push({ test: 'Direct REST attempt: Anonymous query on carts table without x-cart-token', error: err.message });
  }

  console.log(JSON.stringify(results, null, 2));
}

runAdversarialTests();
