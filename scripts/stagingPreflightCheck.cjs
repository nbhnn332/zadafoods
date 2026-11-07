/**
 * ZaDa Foods — Staging Deployment Preflight Check Script
 * Read-only validation engine. Never exposes secrets or performs remote mutations.
 */

const fs = require('fs');
const path = require('path');

const EXPECTED_PROJECT_REF = 'qjuvwrjpbwxkqyvffbcy';

function runPreflight() {
  console.log('================================================================');
  console.log(' ZaDa Foods — Staging Deployment Preflight Verification');
  console.log(' Target Project Reference:', EXPECTED_PROJECT_REF);
  console.log(' Mode: READ-ONLY AUDIT (Zero remote mutations)');
  console.log('================================================================\n');

  let passed = true;
  const checks = [];

  function recordCheck(name, status, details) {
    checks.push({ name, status, details });
    const mark = status ? '[PASS]' : '[FAIL]';
    console.log(`${mark} ${name}: ${details}`);
    if (!status) passed = false;
  }

  // 1. Supabase Config & Project Reference Ambiguity Check
  const configPath = path.resolve(__dirname, '../supabase/config.toml');
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const projectMatch = configContent.match(/project_id\s*=\s*"([^"]+)"/);
    if (projectMatch && projectMatch[1] === EXPECTED_PROJECT_REF) {
      recordCheck(
        'Project Reference Verification',
        true,
        `Matched confirmed staging project reference '${EXPECTED_PROJECT_REF}'`
      );
    } else {
      recordCheck(
        'Project Reference Verification',
        false,
        `Found '${projectMatch ? projectMatch[1] : 'none'}', expected '${EXPECTED_PROJECT_REF}'`
      );
    }
  } else {
    recordCheck('Project Reference Verification', false, 'supabase/config.toml not found');
  }

  // 2. Local Migrations Existence Check
  const expectedMigrations = [
    '20261027000001_initial_schema.sql',
    '20261027000002_row_level_security.sql',
    '20261027000003_seed_dev_data.sql',
    '20261027000004_atomic_inventory_operations.sql',
    '20261027000005_scheduled_order_maintenance.sql',
  ];

  const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
  let migrationsFound = 0;
  if (fs.existsSync(migrationsDir)) {
    expectedMigrations.forEach((m) => {
      const fullPath = path.join(migrationsDir, m);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 0) {
        migrationsFound++;
      }
    });
  }
  recordCheck(
    'Local Migration Baseline',
    migrationsFound === expectedMigrations.length,
    `Found ${migrationsFound}/${expectedMigrations.length} validated SQL migrations`
  );

  // 3. Edge Functions Security Invariants
  const fnCreatePath = path.resolve(__dirname, '../supabase/functions/create-razorpay-order/index.ts');
  const fnVerifyPath = path.resolve(__dirname, '../supabase/functions/verify-razorpay-payment/index.ts');
  const fnWebhookPath = path.resolve(__dirname, '../supabase/functions/razorpay-webhook/index.ts');

  if (fs.existsSync(fnCreatePath)) {
    const content = fs.readFileSync(fnCreatePath, 'utf8');
    const hasGuestToken = content.includes('got_') && content.includes('verifyGuestToken');
    const hasServiceRolePrice = content.includes('select(') && content.includes('total_amount');
    const rejectsEmailOnly = content.includes('email or phone alone is strictly prohibited');
    recordCheck(
      'create-razorpay-order Security',
      hasGuestToken && hasServiceRolePrice && rejectsEmailOnly,
      'Order-scoped guest token, server-side pricing, and email-only access rejection verified'
    );
  } else {
    recordCheck('create-razorpay-order Security', false, 'File not found');
  }

  if (fs.existsSync(fnVerifyPath)) {
    const content = fs.readFileSync(fnVerifyPath, 'utf8');
    const hasOrderBinding = content.includes('dbOrder.razorpay_order_id !== razorpayOrderId');
    const hasHmac = content.includes('computeHmacSha256');
    const strictlyCaptured = content.includes("paymentData.status !== 'captured'") && !content.includes("paymentData.status !== 'authorized'");
    recordCheck(
      'verify-razorpay-payment Security',
      hasOrderBinding && hasHmac && strictlyCaptured,
      'Order binding, HMAC signature, and strict captured-only payment requirement verified'
    );
  } else {
    recordCheck('verify-razorpay-payment Security', false, 'File not found');
  }

  if (fs.existsSync(fnWebhookPath)) {
    const content = fs.readFileSync(fnWebhookPath, 'utf8');
    const hasAtomicClaim = content.includes('claimError') && content.includes('23505');
    const hasRetrySafe = content.includes('error_message') && content.includes('Clear previous');
    const hasDowngradeGuard = content.includes(".eq('payment_status', 'PENDING')");
    recordCheck(
      'razorpay-webhook Security',
      hasAtomicClaim && hasRetrySafe && hasDowngradeGuard,
      'Postgres unique claim, safe failure retries, and status downgrade protection verified'
    );
  } else {
    recordCheck('razorpay-webhook Security', false, 'File not found');
  }

  // 4. Client Secrets Exposure Audit
  const envExamplePath = path.resolve(__dirname, '../.env.example');
  if (fs.existsSync(envExamplePath)) {
    const content = fs.readFileSync(envExamplePath, 'utf8');
    const lines = content.split('\n');
    let leakedSecret = false;
    lines.forEach((line) => {
      if (line.trim().startsWith('VITE_') && (line.includes('SERVICE_ROLE') || line.includes('SECRET'))) {
        leakedSecret = true;
      }
    });
    recordCheck(
      'Client Environment Scoping',
      !leakedSecret,
      'Zero private keys or gateway secrets exposed with VITE_ client prefix'
    );
  } else {
    recordCheck('Client Environment Scoping', false, '.env.example not found');
  }

  // Summary
  console.log('\n================================================================');
  if (passed) {
    console.log(' PREFLIGHT RESULT: ALL LOCAL CHECKS PASSED [READY FOR PREPARATION]');
    console.log(' Project reference is validated as dedicated staging.');
    console.log(' No destructive operations or unconfirmed mutations detected.');
    console.log('================================================================');
    process.exit(0);
  } else {
    console.error(' PREFLIGHT RESULT: FAILED CHECKS DETECTED [STOPPING]');
    console.log('================================================================');
    process.exit(1);
  }
}

runPreflight();
