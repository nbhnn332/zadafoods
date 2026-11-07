const SUPABASE_URL = 'https://ykzgqaepayuqatgbvsoq.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdXZ3cmpwYnd4a3F5dmZmYmN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNzk5MTAsImV4cCI6MjEwODY1NTkxMH0.zxPM3jOaVyCXx8QX370lKzC6s8msXTDHQhs-ix5t8i8';

async function executePhase21LiveTests() {
  console.log('================================================================');
  console.log('   ZaDa Foods — Phase 21 Live Staging Verification Tests');
  console.log('================================================================\n');

  const testResults = [];

  // -------------------------------------------------------------------------
  // 1. GUEST CART ISOLATION TESTS
  // -------------------------------------------------------------------------
  const guestAToken = 'gcart_token_alpha_' + Date.now();
  const guestBToken = 'gcart_token_beta_' + Date.now();

  // Test 1.1: Cart Query without x-cart-token header (Missing Token)
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
    testResults.push({
      section: '1. Cart Isolation',
      test: 'Missing cart token on SELECT /rest/v1/carts',
      httpStatus: status,
      result: status === 401 || body === '[]' ? 'DENIED / 0 ROWS (PASSED)' : 'VULNERABLE',
      responseSnippet: body.slice(0, 100)
    });
  } catch (err) {
    testResults.push({ section: '1. Cart Isolation', test: 'Missing cart token', error: err.message });
  }

  // Test 1.2: Cart Insertion without token
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/carts`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: 'arbitrary_session_unauthenticated'
      })
    });
    const status = res.status;
    const body = await res.text();
    testResults.push({
      section: '1. Cart Isolation',
      test: 'Unverified Cart INSERT without x-cart-token header',
      httpStatus: status,
      result: status >= 400 ? 'DENIED BY RLS (PASSED)' : 'VULNERABLE',
      responseSnippet: body.slice(0, 100)
    });
  } catch (err) {
    testResults.push({ section: '1. Cart Isolation', test: 'Unverified Cart INSERT', error: err.message });
  }

  // Test 1.3: Cart Items Cross-Session Access (Stolen/Mismatched Token)
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cart_items?select=*`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'x-cart-token': 'attacker_stolen_token_xyz'
      }
    });
    const status = res.status;
    const body = await res.text();
    testResults.push({
      section: '1. Cart Isolation',
      test: 'Cross-session cart_items enumeration with invalid token',
      httpStatus: status,
      result: status === 401 || body === '[]' ? 'DENIED / 0 ROWS (PASSED)' : 'VULNERABLE',
      responseSnippet: body.slice(0, 100)
    });
  } catch (err) {
    testResults.push({ section: '1. Cart Isolation', test: 'Cross-session cart_items', error: err.message });
  }

  // -------------------------------------------------------------------------
  // 2. SERVER-AUTHORITATIVE ORDER CREATION TESTS
  // -------------------------------------------------------------------------

  // Test 2.1: Direct REST Orders Insertion Attempt with ₹1 Tampered Total
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_number: 'ATTACK-1INR-' + Date.now(),
        customer_name: 'Adversary',
        customer_email: 'attacker@example.com',
        customer_phone: '9876543210',
        shipping_address: { city: 'Cochin' },
        delivery_method: 'STANDARD',
        payment_mode: 'COD',
        payment_status: 'PENDING',
        total_amount: 1.00 // Malicious price tampering
      })
    });
    const status = res.status;
    const body = await res.text();
    testResults.push({
      section: '2. Order Authority',
      test: 'Direct REST order insert with ₹1 manipulated total',
      httpStatus: status,
      result: status >= 400 ? 'DENIED BY POSTGRESQL (PASSED)' : 'VULNERABLE',
      responseSnippet: body.slice(0, 120)
    });
  } catch (err) {
    testResults.push({ section: '2. Order Authority', test: 'Direct REST ₹1 total', error: err.message });
  }

  // Test 2.2: Direct REST Orders Insertion Attempt with payment_status = PAID
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_number: 'ATTACK-PAID-' + Date.now(),
        customer_name: 'Adversary',
        customer_email: 'attacker@example.com',
        customer_phone: '9876543210',
        shipping_address: { city: 'Cochin' },
        delivery_method: 'STANDARD',
        payment_mode: 'RAZORPAY',
        payment_status: 'PAID' // Malicious claim
      })
    });
    const status = res.status;
    const body = await res.text();
    testResults.push({
      section: '2. Order Authority',
      test: 'Direct REST order insert with payment_status = PAID',
      httpStatus: status,
      result: status >= 400 ? 'DENIED BY TRIGGER / PERMISSIONS (PASSED)' : 'VULNERABLE',
      responseSnippet: body.slice(0, 120)
    });
  } catch (err) {
    testResults.push({ section: '2. Order Authority', test: 'Direct REST PAID status', error: err.message });
  }

  // Test 2.3: Order RPC with Negative Quantity
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_order_server_authoritative`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_order_data: {
          customer_name: 'Test Negative Qty',
          customer_email: 'neg@test.com',
          customer_phone: '9876543210',
          shipping_address: { city: 'Kochi' },
          delivery_method: 'STANDARD',
          payment_mode: 'COD',
          items: [
            { variant_id: 'f0000000-0000-0000-0000-000000000002', quantity: -5 }
          ]
        }
      })
    });
    const status = res.status;
    const body = await res.text();
    testResults.push({
      section: '2. Order Authority',
      test: 'Authoritative order RPC with negative quantity (-5)',
      httpStatus: status,
      result: status >= 400 || body.includes('ORDER_VALIDATION_FAILED') ? 'REJECTED SAFELY (PASSED)' : 'VULNERABLE',
      responseSnippet: body.slice(0, 120)
    });
  } catch (err) {
    testResults.push({ section: '2. Order Authority', test: 'Negative quantity', error: err.message });
  }

  // Test 2.4: Order RPC with Non-existent Variant UUID
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_order_server_authoritative`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_order_data: {
          customer_name: 'Test Nonexistent Variant',
          customer_email: 'nonexistent@test.com',
          customer_phone: '9876543210',
          shipping_address: { city: 'Kochi' },
          delivery_method: 'STANDARD',
          payment_mode: 'COD',
          items: [
            { variant_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', quantity: 1 }
          ]
        }
      })
    });
    const status = res.status;
    const body = await res.text();
    testResults.push({
      section: '2. Order Authority',
      test: 'Authoritative order RPC with non-existent variant UUID',
      httpStatus: status,
      result: status >= 400 || body.includes('ORDER_VALIDATION_FAILED') ? 'REJECTED SAFELY (PASSED)' : 'VULNERABLE',
      responseSnippet: body.slice(0, 120)
    });
  } catch (err) {
    testResults.push({ section: '2. Order Authority', test: 'Nonexistent variant', error: err.message });
  }

  // -------------------------------------------------------------------------
  // 3. TRIGGER INTEGRITY & GUC INJECTION RESISTANCE
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'zada.authoritative_order_creation=true' // Attempted GUC header injection
      },
      body: JSON.stringify({
        order_number: 'ATTACK-GUC-' + Date.now(),
        customer_name: 'Adversary GUC',
        customer_email: 'guc@example.com',
        customer_phone: '9876543210',
        shipping_address: { city: 'Cochin' },
        delivery_method: 'STANDARD',
        payment_mode: 'COD',
        payment_status: 'PENDING',
        total_amount: 1.00
      })
    });
    const status = res.status;
    const body = await res.text();
    testResults.push({
      section: '3. Trigger Integrity',
      test: 'Header GUC spoofing (Prefer: zada.authoritative_order_creation=true)',
      httpStatus: status,
      result: status >= 400 ? 'BLOCKED SAFELY (PASSED)' : 'VULNERABLE',
      responseSnippet: body.slice(0, 120)
    });
  } catch (err) {
    testResults.push({ section: '3. Trigger Integrity', test: 'GUC spoofing', error: err.message });
  }

  // -------------------------------------------------------------------------
  // 4. SUPER ADMIN BOOTSTRAP SECURITY TESTS
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bootstrap_super_admin`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target_email: 'attacker.evil.admin@gmail.com'
      })
    });
    const status = res.status;
    const body = await res.text();
    testResults.push({
      section: '4. Super Admin Bootstrap',
      test: 'Anonymous caller attempting to invoke bootstrap_super_admin',
      httpStatus: status,
      result: status >= 400 ? 'ACCESS DENIED (PASSED)' : 'VULNERABLE',
      responseSnippet: body.slice(0, 120)
    });
  } catch (err) {
    testResults.push({ section: '4. Super Admin Bootstrap', test: 'Bootstrap invoke attempt', error: err.message });
  }

  // -------------------------------------------------------------------------
  // 5. CUSTOMER DIRECTORY & ADMIN RECORDS PRIVACY
  // -------------------------------------------------------------------------
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=email,phone,full_name`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    const status = res.status;
    const body = await res.text();
    testResults.push({
      section: '5. Privacy Separation',
      test: 'Anonymous attempt to dump customer directory from profiles',
      httpStatus: status,
      result: status === 401 || body === '[]' ? 'DENIED / 0 ROWS (PASSED)' : 'VULNERABLE',
      responseSnippet: body.slice(0, 100)
    });
  } catch (err) {
    testResults.push({ section: '5. Privacy Separation', test: 'Profiles dump attempt', error: err.message });
  }

  console.log(JSON.stringify(testResults, null, 2));
}

executePhase21LiveTests();
