const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\nabha\\.gemini\\antigravity\\brain\\f0e5354f-d078-42e8-97ed-8e16f4e21dfa';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'manual_screenshots');
const ROOT_DIR = path.join(__dirname, '..');

function getBase64Image(filename) {
  const p = path.join(SCREENSHOT_DIR, filename);
  if (fs.existsSync(p)) {
    const data = fs.readFileSync(p);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  return '';
}

function buildClientAdminManualHtml() {
  const imgLogin = getBase64Image('manual_09_login_portal.png');
  const imgDash = getBase64Image('manual_admin_01_dashboard.png');
  const imgProd = getBase64Image('manual_admin_02_products.png');
  const imgSubcat = getBase64Image('manual_admin_03_subcategories.png');
  const imgInv = getBase64Image('manual_admin_04_inventory.png');
  const imgOrd = getBase64Image('manual_admin_05_orders.png');
  const imgCust = getBase64Image('manual_admin_06_customers.png');
  const imgCoup = getBase64Image('manual_admin_07_coupons.png');
  const imgComb = getBase64Image('manual_admin_08_combos.png');
  const imgCms = getBase64Image('manual_admin_09_cms.png');
  const imgFest = getBase64Image('manual_admin_10_festivals.png');
  const imgRev = getBase64Image('manual_admin_11_reviews.png');
  const imgEnq = getBase64Image('manual_admin_12_enquiries.png');
  const imgRep = getBase64Image('manual_admin_13_reports.png');
  const imgMgmt = getBase64Image('manual_admin_14_management.png');
  const imgSet = getBase64Image('manual_admin_15_settings.png');
  const imgBestsellers = getBase64Image('manual_admin_16_bestsellers.png');
  const imgHandpicked = getBase64Image('manual_admin_17_handpicked.png');
  const imgContent = getBase64Image('manual_admin_18_content.png');
  const imgAuditLogs = getBase64Image('manual_admin_19_audit_logs.png');
  const imgDataCleanup = getBase64Image('manual_admin_20_data_cleanup.png');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ZaDa Foods — Client Operations Manual (Admin Panel Edition)</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 11mm 14mm 11mm;
      @bottom-right {
        content: "Page " counter(page);
        font-size: 8pt;
        color: #7A7265;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      @bottom-left {
        content: "ZaDa Foods • Client Admin Operations Manual • Confidential";
        font-size: 8pt;
        color: #7A7265;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #FAF7F2;
      color: #1F2937;
      margin: 0;
      padding: 0;
      line-height: 1.5;
      font-size: 8.8pt;
    }
    h1, h2, h3, h4 {
      color: #072C20;
      font-family: Georgia, serif;
      margin-top: 0;
    }
    h1 { font-size: 20pt; line-height: 1.2; margin-bottom: 8pt; }
    h2 {
      font-size: 13pt;
      border-bottom: 2px solid #D1C7B7;
      padding-bottom: 4pt;
      margin-top: 14pt;
      margin-bottom: 8pt;
      page-break-after: avoid;
      color: #072C20;
    }
    h3 {
      font-size: 10pt;
      color: #A67732;
      margin-top: 10pt;
      margin-bottom: 4pt;
      page-break-after: avoid;
    }
    p { margin: 0 0 6pt 0; }
    ul, ol { margin: 0 0 8pt 0; padding-left: 18pt; }
    li { margin-bottom: 3pt; }
    .page-break { page-break-before: always; }
    .avoid-break { page-break-inside: avoid; }

    /* Cover Page */
    .cover-page {
      min-height: 960px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(180deg, #FAF7F2 0%, #F5EFE6 100%);
      border: 5px double #072C20;
      padding: 40px 30px;
      margin: 10px;
    }
    .cover-badge {
      display: inline-block;
      background: #072C20;
      color: #FAF7F2;
      font-size: 8.5pt;
      font-weight: bold;
      letter-spacing: 2px;
      padding: 5px 16px;
      border-radius: 20px;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .cover-brand {
      font-size: 38pt;
      font-weight: bold;
      color: #072C20;
      letter-spacing: 2px;
      margin-bottom: 6px;
      font-family: Georgia, serif;
    }
    .cover-tagline {
      font-size: 13pt;
      font-style: italic;
      color: #A67732;
      margin-bottom: 20px;
    }
    .cover-divider {
      width: 120px;
      height: 3px;
      background-color: #A67732;
      margin: 14px auto;
    }
    .cover-title {
      font-size: 22pt;
      color: #072C20;
      font-weight: bold;
      margin-top: 16px;
      margin-bottom: 10px;
    }
    .cover-subtitle {
      font-size: 11pt;
      color: #4B5563;
      max-width: 540px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .cover-meta {
      margin-top: 25px;
      padding: 16px 22px;
      background: white;
      border: 1px solid #D1C7B7;
      border-radius: 8px;
      font-size: 8.5pt;
      color: #374151;
      text-align: left;
      width: 440px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.04);
    }
    .cover-meta table { width: 100%; border-collapse: collapse; }
    .cover-meta td { padding: 4px 6px; }
    .cover-meta td.bold { font-weight: bold; color: #072C20; width: 155px; }

    /* Table of Contents */
    .toc-container {
      background: white;
      border: 1px solid #E5DECF;
      border-radius: 8px;
      padding: 16px 22px;
      margin-bottom: 16px;
    }
    .toc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 22px;
    }
    .toc-item {
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      border-bottom: 1px dashed #E5DECF;
      padding-bottom: 3px;
    }
    .toc-num { color: #A67732; font-weight: bold; width: 26px; }
    .toc-name { flex-grow: 1; color: #374151; font-weight: 500; }

    /* UI Screenshots */
    .screenshot-box {
      margin: 8pt 0 10pt 0;
      border: 1px solid #D1C7B7;
      border-radius: 6px;
      overflow: hidden;
      background: #FFFFFF;
      box-shadow: 0 2px 4px rgba(0,0,0,0.06);
      page-break-inside: avoid;
    }
    .screenshot-img {
      width: 100%;
      height: auto;
      display: block;
      max-height: 320px;
      object-fit: contain;
      background: #FDFBF7;
    }
    .screenshot-caption {
      background: #F4EFE6;
      border-top: 1px solid #E5DECF;
      padding: 5px 12px;
      font-size: 7.5pt;
      color: #5C5245;
      font-style: italic;
    }

    /* Badges & Callouts */
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 7pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-primary { background: #072C20; color: #FAF7F2; }
    .badge-gold { background: #A67732; color: #FFFFFF; }
    .badge-success { background: #059669; color: #FFFFFF; }
    .badge-danger { background: #DC2626; color: #FFFFFF; }
    .badge-subtle { background: #EFE9DE; color: #5C5245; }

    .callout {
      border-left: 4px solid #072C20;
      background: #F5EFE6;
      padding: 7pt 11pt;
      border-radius: 0 6px 6px 0;
      margin: 7pt 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }
    .callout-gold {
      border-left-color: #A67732;
      background: #FDF9EE;
    }
    .callout-tip {
      border-left-color: #059669;
      background: #ECFDF5;
    }
    .callout-title {
      font-weight: bold;
      color: #072C20;
      margin-bottom: 2pt;
      font-size: 8.8pt;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Step Cards */
    .step-box {
      display: flex;
      gap: 10px;
      margin-bottom: 5pt;
      background: white;
      padding: 7pt 11pt;
      border: 1px solid #E5DECF;
      border-radius: 6px;
      page-break-inside: avoid;
    }
    .step-num {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #072C20;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 7.5pt;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .step-content { flex-grow: 1; }
    .step-title {
      font-weight: bold;
      color: #072C20;
      font-size: 8.5pt;
      margin-bottom: 2pt;
    }
    .step-desc {
      font-size: 8pt;
      color: #4B5563;
      margin: 0;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 7pt 0;
      font-size: 8pt;
      page-break-inside: avoid;
      background: white;
      border: 1px solid #D1C7B7;
    }
    table.data-table th {
      background: #072C20;
      color: #FAF7F2;
      padding: 5px 8px;
      text-align: left;
      font-weight: 600;
      font-family: Georgia, serif;
    }
    table.data-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #EFE9DE;
      color: #374151;
      vertical-align: top;
    }
    table.data-table tr:nth-child(even) td {
      background: #FAF7F2;
    }

    .footer-note {
      text-align: center;
      font-size: 7.5pt;
      color: #7A7265;
      margin-top: 20pt;
      border-top: 1px solid #E5DECF;
      padding-top: 8pt;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-badge">CLIENT TRAINING & OPERATIONS GUIDE</div>
    <div class="cover-brand">ZaDa FOODS</div>
    <div class="cover-tagline">"Authentic Kerala Flavours, Rooted in Tradition"</div>
    <div class="cover-divider"></div>
    <div class="cover-title">ADMIN PANEL OPERATIONS MANUAL</div>
    <div class="cover-subtitle">
      A comprehensive, practical visual reference guide designed exclusively for the ZaDa Foods client operations team to master every module of the Admin Operations Console.
    </div>

    <div class="cover-meta">
      <table>
        <tr><td class="bold">Store Brand:</td><td>ZaDa Foods (Punalur, Kollam, Kerala)</td></tr>
        <tr><td class="bold">Admin Portal URL:</td><td>yourdomain.com/admin (or /login)</td></tr>
        <tr><td class="bold">Official WhatsApp Support:</td><td>+91 75939 59235</td></tr>
        <tr><td class="bold">Customer Care Email:</td><td>care@zadafoods.com</td></tr>
        <tr><td class="bold">Console Edition:</td><td>ZaDa Operations Console v2.5</td></tr>
        <tr><td class="bold">Target Audience:</td><td>Client Store Owners, Managers & Dispatch Staff</td></tr>
      </table>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- TABLE OF CONTENTS -->
  <h2>TABLE OF CONTENTS</h2>
  <div class="toc-container">
    <div class="toc-grid">
      <div class="toc-item"><span class="toc-num">01</span><span class="toc-name">Quick-Start: The 15-Minute Daily Routine</span></div>
      <div class="toc-item"><span class="toc-num">02</span><span class="toc-name">Admin Portal Sign-In & Access Control</span></div>
      <div class="toc-item"><span class="toc-num">03</span><span class="toc-name">Operations & Analytics Dashboard</span></div>
      <div class="toc-item"><span class="toc-num">04</span><span class="toc-name">Products & Weight Variants Management</span></div>
      <div class="toc-item"><span class="toc-num">05</span><span class="toc-name">Subcategories & Category Hero Banners</span></div>
      <div class="toc-item"><span class="toc-num">06</span><span class="toc-name">Inventory Control & Low-Stock Alerts</span></div>
      <div class="toc-item"><span class="toc-num">07</span><span class="toc-name">Order Fulfillment & Courier AWB Dispatch</span></div>
      <div class="toc-item"><span class="toc-num">08</span><span class="toc-name">Customers Directory & Lifetime Spend</span></div>
      <div class="toc-item"><span class="toc-num">09</span><span class="toc-name">Coupons, Tiers & Automatic Pricing Rules</span></div>
      <div class="toc-item"><span class="toc-num">10</span><span class="toc-name">Combo Pack Builder & Curated Gift Sets</span></div>
      <div class="toc-item"><span class="toc-num">11</span><span class="toc-name">Homepage CMS & Banner CTA Customization</span></div>
      <div class="toc-item"><span class="toc-num">12</span><span class="toc-name">Bestseller & Handpicked Collections Curation</span></div>
      <div class="toc-item"><span class="toc-num">13</span><span class="toc-name">Immersive Festival Experience Engine</span></div>
      <div class="toc-item"><span class="toc-num">14</span><span class="toc-name">Product Reviews Moderation Queue</span></div>
      <div class="toc-item"><span class="toc-num">15</span><span class="toc-name">Wholesale & Bulk Order Enquiries Inbox</span></div>
      <div class="toc-item"><span class="toc-num">16</span><span class="toc-name">Store Content Pages & Policy Editor</span></div>
      <div class="toc-item"><span class="toc-num">17</span><span class="toc-name">Financial Sales Reports & CSV Accounting Export</span></div>
      <div class="toc-item"><span class="toc-num">18</span><span class="toc-name">Staff Admin Users & Permission Roles</span></div>
      <div class="toc-item"><span class="toc-num">19</span><span class="toc-name">Store Logistics, Shipping Rates & COD Advance</span></div>
      <div class="toc-item"><span class="toc-num">20</span><span class="toc-name">System Audit Logs & Bulk Data Maintenance</span></div>
      <div class="toc-item"><span class="toc-num">21</span><span class="toc-name">Daily & Weekly Checklists and FAQ</span></div>
    </div>
  </div>

  <!-- MODULE 1 -->
  <h2>01. Quick-Start: The 15-Minute Daily Routine</h2>
  <p>The ZaDa Foods Operations Console allows store managers to oversee ecommerce fulfillment, product catalog updates, pricing, and marketing promotions without touching code. Everything is managed through visual web interfaces.</p>

  <div class="callout callout-tip">
    <div class="callout-title">The Daily 15-Minute Routine for Store Managers:</div>
    <ol>
      <li><strong>Morning Order Review (5 Mins):</strong> Log in to <code>/admin</code>. Review overnight orders in <em>Orders &amp; Courier AWB</em>, verify payments, print packing slips, and hand them to the packaging team.</li>
      <li><strong>Inventory Check (3 Mins):</strong> Check <em>Inventory &amp; Stock &gt; Low Stock Alerts</em> to ensure bestsellers like Wayanad Banana Chips or Cashew Halwa are well-stocked.</li>
      <li><strong>Afternoon Courier Handover (4 Mins):</strong> Paste the courier Air Waybill (AWB) number into the order details drawer and click <strong>"Update to SHIPPED"</strong> so customers receive instant tracking updates.</li>
      <li><strong>Enquiries &amp; WhatsApp Assistance (3 Mins):</strong> Open <em>Bulk Enquiries</em> to follow up with catering and corporate buyers directly on WhatsApp (+91 75939 59235).</li>
    </ol>
  </div>

  <!-- MODULE 2 -->
  <h2>02. Admin Portal Sign-In & Access Control</h2>
  <p>To access the console, open your browser and navigate to <code>/login</code> or <code>/admin</code>. Enter your authorized administrator email and password.</p>

  <div class="screenshot-box">
    <img src="${imgLogin}" class="screenshot-img" alt="Admin Sign In" />
    <div class="screenshot-caption">Figure 2.1: Unified Secure Sign-In Portal with role-based routing.</div>
  </div>

  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Enter Administrator Credentials</div>
      <div class="step-desc">Type your management email (e.g. <code>admin@zadafoods.com</code>) and password. Click <strong>"Sign In"</strong>.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Automatic Role-Based Redirection</div>
      <div class="step-desc">The system checks your account permissions in real time. Administrators are directed to the Operations Console. Ordinary customers are strictly prohibited from administrative routes.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Permission Guard Protection</div>
      <div class="step-desc">Staff accounts (such as Marketing or Dispatch executives) only see the specific modules permitted by the Super Administrator. Unauthorized areas are hidden from the sidebar automatically.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 3 -->
  <h2>03. Operations & Analytics Dashboard</h2>
  <p>The Dashboard provides an instant snapshot of your store's commercial health, order pipeline, and critical inventory warnings.</p>

  <div class="screenshot-box">
    <img src="${imgDash}" class="screenshot-img" alt="Operations Dashboard" />
    <div class="screenshot-caption">Figure 3.1: Operations Dashboard showing gross revenue, order volume, pending fulfillment counts, and low-stock alerts.</div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th>Metric Card</th>
        <th>What It Measures</th>
        <th>Manager Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Total Gross Revenue</strong></td>
        <td>Total rupee value of all completed and confirmed customer purchases. Shows today, week, and month breakdown.</td>
        <td>Monitor sales velocity against monthly targets.</td>
      </tr>
      <tr>
        <td><strong>Total Orders Placed</strong></td>
        <td>Cumulative order count and Average Order Value (AOV).</td>
        <td>Use combo packs and free delivery thresholds to raise AOV.</td>
      </tr>
      <tr>
        <td><strong>Pending Fulfillment</strong></td>
        <td>Orders confirmed and paid, but not yet handed over to the courier partner.</td>
        <td><strong>High Priority:</strong> Click <em>"Fulfill Orders"</em> to dispatch orders without delay.</td>
      </tr>
      <tr>
        <td><strong>Low Stock SKUs</strong></td>
        <td>Product variants whose physical inventory is at or below the safety threshold (default: 5 units).</td>
        <td>Notify production to repack or restock immediately.</td>
      </tr>
      <tr>
        <td><strong>7-Day Revenue Trend</strong></td>
        <td>Visual daily revenue bar chart highlighting peak sales days and promotion spikes.</td>
        <td>Evaluate impact of active festival campaigns or coupon codes.</td>
      </tr>
    </tbody>
  </table>

  <!-- MODULE 4 -->
  <h2>04. Products & Weight Variants Management</h2>
  <p>The Products module lets you create, update, and manage your entire Kerala delicacies catalog. ZaDa Foods uses a multi-variant architecture so one product can have multiple pack sizes (e.g. 250g, 500g, 1kg) with individual prices and stock.</p>

  <div class="screenshot-box">
    <img src="${imgProd}" class="screenshot-img" alt="Products Console" />
    <div class="screenshot-caption">Figure 4.1: Product catalog manager with search, category filtering, and edit modal.</div>
  </div>

  <h3>How to Add or Edit a Product:</h3>
  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Product Identity & SEO Slug</div>
      <div class="step-desc">Enter the product name (e.g. <em>Pure Coconut Oil Banana Chips</em>). The SEO slug (e.g. <code>banana-chips</code>) is generated automatically.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Assign Category & Subcategory</div>
      <div class="step-desc">Select the primary category (e.g. <em>Chips &amp; Crisps</em>) and optional subcategory (e.g. <em>Salted Crisps</em>).</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Configure Weight Variants (Crucial)</div>
      <div class="step-desc">Add each pack size (e.g. <code>250g</code>, <code>500g</code>, <code>1kg</code>). For each variant, specify:
        <ul>
          <li><strong>Selling Price (₹):</strong> The actual price charged to the customer at checkout.</li>
          <li><strong>MRP (₹):</strong> Maximum Retail Price (shows struck-through discount on storefront).</li>
          <li><strong>Stock Quantity:</strong> Current physical packages available in the warehouse.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">4</div>
    <div class="step-content">
      <div class="step-title">Upload Product Photography</div>
      <div class="step-desc">Upload crisp, authentic product images. The primary image is displayed on catalog cards; additional photos appear in the product page thumbnail gallery.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 5 & 6 -->
  <h2>05. Subcategories & Category Hero Banners</h2>
  <p>Organize nested product discovery and upload dedicated visual banners for individual category landing pages.</p>

  <div class="screenshot-box">
    <img src="${imgSubcat}" class="screenshot-img" alt="Subcategories Manager" />
    <div class="screenshot-caption">Figure 5.1: Subcategory structure and category hero banner configuration.</div>
  </div>

  <div class="callout callout-gold">
    <div class="callout-title">Category Banners Best Practices:</div>
    <p>Upload landscape images (recommended 1200 × 400 px) for categories like <em>Halwa</em>, <em>Spices</em>, or <em>Traditional Sweets</em>. When customers click category discovery pills, this banner introduces the collection with heritage elegance.</p>
  </div>

  <h2>06. Inventory Control & Low-Stock Alerts</h2>
  <p>Prevent selling out-of-stock items. The inventory engine tracks physical stock across every variant in real time. When an order is placed, stock decrements automatically.</p>

  <div class="screenshot-box">
    <img src="${imgInv}" class="screenshot-img" alt="Inventory Console" />
    <div class="screenshot-caption">Figure 6.1: Real-time inventory table with stock adjustment modal and audit history.</div>
  </div>

  <h3>Adjusting Inventory (Purchase Order or Restock):</h3>
  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Find the SKU Variant</div>
      <div class="step-desc">Search for the product or filter by category. Click <strong>"Adjust Stock"</strong> beside the variant.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Select Action: Add, Deduct, or Override</div>
      <div class="step-desc">Choose <strong>Add (+)</strong> when fresh batches arrive from the kitchen, or <strong>Override (=)</strong> during periodic physical inventory counts.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Select Reason & Save Audit Log</div>
      <div class="step-desc">Choose from <em>Purchase Order, Warehouse Restock, Inventory Correction, or Damaged in Transit</em>. Every change is logged with the admin's email and timestamp.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 7 -->
  <h2>07. Order Fulfillment & Courier AWB Dispatch</h2>
  <p>The Order Management console is your dispatch command center. Here you review incoming orders, verify online and COD payments, print invoices, and update courier tracking.</p>

  <div class="screenshot-box">
    <img src="${imgOrd}" class="screenshot-img" alt="Orders Console" />
    <div class="screenshot-caption">Figure 7.1: Order Management screen showing status tabs, customer address notes, and courier dispatch drawer.</div>
  </div>

  <h3>The Complete 5-Stage Order Lifecycle:</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th>Status</th>
        <th>What It Means</th>
        <th>Store Manager Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-subtle">PENDING</span></td>
        <td>Order submitted, payment pending verification.</td>
        <td>Check Razorpay status. For WhatsApp assisted orders, confirm customer intent.</td>
      </tr>
      <tr>
        <td><span class="badge badge-primary">CONFIRMED</span></td>
        <td>Payment received (Razorpay prepaid or COD advance token).</td>
        <td>Print packing slip. Pass items and shipping address to packing team.</td>
      </tr>
      <tr>
        <td><span class="badge badge-gold">PACKED</span></td>
        <td>Items boxed in sealed food-grade cartons with bubble wrap.</td>
        <td>Affix shipping label and place in the courier dispatch bay.</td>
      </tr>
      <tr>
        <td><span class="badge badge-primary">SHIPPED</span></td>
        <td>Handed over to courier executive.</td>
        <td><strong>Select Courier &amp; Paste AWB Tracking Number.</strong> Customer tracking updates live.</td>
      </tr>
      <tr>
        <td><span class="badge badge-success">DELIVERED</span></td>
        <td>Parcel confirmed delivered at customer's doorstep.</td>
        <td>Order complete. For COD orders, verify doorstep cash remittance from courier.</td>
      </tr>
    </tbody>
  </table>

  <h3>How to Dispatch an Order (Step-by-Step):</h3>
  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Click on the Order Row</div>
      <div class="step-desc">Opens the Order Details drawer showing purchased variants, quantities, customer phone, and shipping destination.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Select Courier Partner</div>
      <div class="step-desc">Choose from the dropdown: <em>DTDC Express, Delhivery, India Post, Blue Dart, or Professional Couriers</em>.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Paste the Courier AWB Tracking Number</div>
      <div class="step-desc">Enter the Air Waybill tracking code from the courier manifest (e.g. <code>DEL123456789IN</code>).</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">4</div>
    <div class="step-content">
      <div class="step-title">Update Status to "SHIPPED" & Save</div>
      <div class="step-desc">Click <strong>"Update Order"</strong>. The customer's order tracking page (<code>/order-tracking/ORD-XXXX</code>) immediately displays the live courier link.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 8 & 9 -->
  <h2>08. Customers Directory & Lifetime Spend</h2>
  <p>Track your customer relationships, repeat buyers, verified mobile numbers, and lifetime value in one central directory.</p>

  <div class="screenshot-box">
    <img src="${imgCust}" class="screenshot-img" alt="Customers Directory" />
    <div class="screenshot-caption">Figure 8.1: Customer Directory displaying registered names, phone numbers, order count, and lifetime spend.</div>
  </div>

  <h2>09. Coupons, Tiers & Automatic Pricing Rules</h2>
  <p>Drive sales, run seasonal promotions, and reward first-time visitors with flexible discount coupon codes.</p>

  <div class="screenshot-box">
    <img src="${imgCoup}" class="screenshot-img" alt="Coupons Management" />
    <div class="screenshot-caption">Figure 9.1: Coupons and discount rules manager.</div>
  </div>

  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Click "+ Create Coupon"</div>
      <div class="step-desc">Configure the promotion parameters:
        <ul>
          <li><strong>Coupon Code:</strong> Uppercase alphanumeric code (e.g. <code>ONAM20</code>, <code>WELCOME50</code>).</li>
          <li><strong>Discount Type:</strong> <em>Percentage (%)</em> (e.g. 15% off) or <em>Flat Amount (₹)</em> (e.g. ₹50 off).</li>
          <li><strong>Minimum Order Value:</strong> Minimum cart total required to activate the code (e.g. ₹499).</li>
          <li><strong>Maximum Discount Cap:</strong> Protects margins on large bulk purchases (e.g. max discount ₹200).</li>
          <li><strong>First Order Only:</strong> Restricts usage to new customers making their first purchase.</li>
          <li><strong>Expiry Date:</strong> Set campaign end date. The coupon deactivates automatically when expired.</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 10 & 11 -->
  <h2>10. Combo Pack Builder & Curated Gift Sets</h2>
  <p>Multi-item bundles encourage customers to sample multiple flavours and significantly increase your Average Order Value (AOV).</p>

  <div class="screenshot-box">
    <img src="${imgComb}" class="screenshot-img" alt="Combo Pack Builder" />
    <div class="screenshot-caption">Figure 10.1: Combo Builder module for assembling multi-product gift hampers and snack boxes.</div>
  </div>

  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Name &amp; Bundle Description</div>
      <div class="step-desc">Enter a celebratory title (e.g. <em>Malabar Tea Time Treat Box</em> or <em>Kerala Feast Spices Combo</em>).</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Select Included Products</div>
      <div class="step-desc">Pick 2 to 5 individual products. The builder automatically sums their individual prices and displays the combined value.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Set Special Bundle Price &amp; Savings Badge</div>
      <div class="step-desc">Enter the discounted bundle price (e.g. Items ₹650 &rarr; Bundle Price ₹549). The storefront displays a prominent <em>"Save ₹101"</em> badge.</div>
    </div>
  </div>

  <h2>11. Homepage CMS & Banner CTA Customization</h2>
  <p>Manage your storefront homepage hero banners, promotional announcement texts, and layout section ordering anytime.</p>

  <div class="screenshot-box">
    <img src="${imgCms}" class="screenshot-img" alt="Homepage CMS" />
    <div class="screenshot-caption">Figure 11.1: Content Management System for hero banners, CTA buttons, and homepage section order.</div>
  </div>

  <div class="callout callout-gold">
    <div class="callout-title">NEW: Flexible Banner CTA Button Rules:</div>
    <ul>
      <li><strong>CTA Button Enabled:</strong> Enter CTA button text (e.g. <em>"Explore Spices"</em>) and destination link (e.g. <code>/category/spices</code>). A styled button appears over the banner.</li>
      <li><strong>Image-Only Banners (CTA Disabled):</strong> If you upload a professionally designed banner that already contains text or artwork, toggle CTA Button OFF. No empty button or blank space will appear.</li>
      <li><strong>Clickable Banner Toggle:</strong> When CTA button is OFF, you can toggle <em>"Make Entire Banner Clickable"</em> so tapping anywhere on the banner navigates to the destination page.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 12 & 13 -->
  <h2>12. Bestseller & Handpicked Collections Curation</h2>
  <p>Showcase top-performing snacks and artisanal selections directly on the storefront homepage with dedicated admin curation modules.</p>

  <div class="screenshot-box">
    <img src="${imgBestsellers}" class="screenshot-img" alt="Bestsellers Admin" />
    <div class="screenshot-caption">Figure 12.1: Bestseller collection curation console with drag-and-drop order and badge toggles.</div>
  </div>

  <div class="screenshot-box">
    <img src="${imgHandpicked}" class="screenshot-img" alt="Handpicked Admin" />
    <div class="screenshot-caption">Figure 12.2: Handpicked selection manager for featuring seasonal specialties.</div>
  </div>

  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Curating Homepage Highlights</div>
      <div class="step-desc">Open <em>Bestseller Collection</em> or <em>Handpicked For You</em>. Select up to 8 products from your catalog. Check the toggle to feature them prominently on the homepage.</div>
    </div>
  </div>

  <h2>13. Immersive Festival Experience Engine</h2>
  <p>ZaDa Foods features a built-in festival transformation engine that dresses the entire website in rich, culturally authentic festive themes with a single click.</p>

  <div class="screenshot-box">
    <img src="${imgFest}" class="screenshot-img" alt="Festival Themes" />
    <div class="screenshot-caption">Figure 13.1: Festival Themes dashboard for seasonal theme activation, visual intensity, and placement controls.</div>
  </div>

  <h3>Available Curated Festival Themes:</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th>Theme Preset</th>
        <th>Visual Identity &amp; Aesthetic</th>
        <th>Festive Animations &amp; Motifs</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Default ZaDa</strong></td>
        <td>Deep Forest Green (#072C20), Antique Gold (#A67732), Warm Ivory.</td>
        <td>Classic Kerala heritage branding, subtle banana leaf silhouettes.</td>
      </tr>
      <tr>
        <td><strong>Christmas Magic</strong></td>
        <td>Rich Evergreen (#052014), Crimson Accents, Champagne Gold.</td>
        <td>Gentle snowfall across page, Santa sleigh on top bar, corner pine trees, gift ribbons.</td>
      </tr>
      <tr>
        <td><strong>Eid Celebration</strong></td>
        <td>Emerald Green (#06281E), Midnight Blue, Imperial Gold (#C5A059).</td>
        <td>Crescent moon, twinkling stars, gently swinging fanoos lanterns, arabesque patterns.</td>
      </tr>
      <tr>
        <td><strong>Onam Kasavu</strong></td>
        <td>Kasavu Ivory, Royal Green (#0B2B1B), Golden Kasavu (#CA8A04).</td>
        <td>Athapookalam floral petals, Kanikonna blossom accents, celebratory harvest motifs.</td>
      </tr>
      <tr>
        <td><strong>Diwali Festival of Lights</strong></td>
        <td>Deep Royal Purple (#180829), Obsidian, Radiant Gold (#F59E0B).</td>
        <td>Warm glowing diya lamps, sparkler shimmer, auspicious rangoli flourishes.</td>
      </tr>
      <tr>
        <td><strong>New Year Celebration</strong></td>
        <td>Midnight Blue (#0B0E1E), Starlight Champagne Gold (#E2B855).</td>
        <td>Sparkling starlight bursts, celebratory effervescence, holiday countdown banner.</td>
      </tr>
    </tbody>
  </table>

  <h3>How to Activate a Festival Theme:</h3>
  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Select Festival Preset</div>
      <div class="step-desc">Click on the festival card (e.g. <em>Onam Harvest Festival</em> or <em>Diwali Festival of Lights</em>).</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Set Visual Intensity &amp; Placements</div>
      <div class="step-desc">Select intensity level: <em>Subtle, Balanced, Rich, or Grand</em>. Toggle placements for hero banners, product card ribbons, announcement bar, and falling particles.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Click "Activate Theme"</div>
      <div class="step-desc">The entire customer storefront instantly updates. When the festival ends, click <strong>"Restore Default ZaDa"</strong> in the top right to revert to the classic brand identity.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 14 & 15 -->
  <h2>14. Product Reviews Moderation Queue</h2>
  <p>Maintain store trust by approving genuine customer testimonials and filtering out spam before reviews go live on product pages.</p>

  <div class="screenshot-box">
    <img src="${imgRev}" class="screenshot-img" alt="Reviews Moderation" />
    <div class="screenshot-caption">Figure 14.1: Reviews Moderation Queue with 1-click Approve, Reject, and Verified Buyer flags.</div>
  </div>

  <h2>15. Wholesale & Bulk Order Enquiries Inbox</h2>
  <p>Catering businesses, restaurants, gift curators, and wedding planners submit bulk purchase requests (&gt;15 kg). Review their requests and connect directly on WhatsApp.</p>

  <div class="screenshot-box">
    <img src="${imgEnq}" class="screenshot-img" alt="Bulk Enquiries" />
    <div class="screenshot-caption">Figure 15.1: Wholesale inquiries management screen with direct WhatsApp chat triggers.</div>
  </div>

  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Review Buyer Requirements</div>
      <div class="step-desc">View customer name, company/event details, requested kilograms, and required delivery date.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">One-Click WhatsApp Follow-up</div>
      <div class="step-desc">Click the green <strong>"Chat on WhatsApp"</strong> button to open a pre-filled WhatsApp conversation with the buyer (+91 75939 59235) to negotiate pricing and share custom quotations.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 16 & 17 -->
  <h2>16. Store Content Pages & Policy Editor</h2>
  <p>Easily edit brand story pages, legal policies, and customer FAQs without requiring web developer assistance.</p>

  <div class="screenshot-box">
    <img src="${imgContent}" class="screenshot-img" alt="Content Pages" />
    <div class="screenshot-caption">Figure 16.1: Store content and policy editor for Our Story, Shipping Policy, Refund Policy, and FAQs.</div>
  </div>

  <h2>17. Financial Sales Reports & CSV Accounting Export</h2>
  <p>Download your complete financial sales records with one click for monthly accounting, GST filing, and business analysis.</p>

  <div class="screenshot-box">
    <img src="${imgRep}" class="screenshot-img" alt="Sales Reports" />
    <div class="screenshot-caption">Figure 17.1: Reports module showing monthly revenue charts and CSV export triggers.</div>
  </div>

  <div class="callout callout-tip">
    <div class="callout-title">Exporting Orders for Your Accountant:</div>
    <p>Click <strong>"Export Orders CSV"</strong>. Open the downloaded file in Microsoft Excel or Google Sheets. It includes Order IDs, Customer Names, Contact Numbers, Delivery Addresses, Item Breakdowns, Quantities, Taxes, Shipping Fees, and Payment Modes.</p>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 18 & 19 -->
  <h2>18. Staff Admin Users & Permission Roles</h2>
  <p>Safely grant operations access to team members without sharing your master Super Admin password.</p>

  <div class="screenshot-box">
    <img src="${imgMgmt}" class="screenshot-img" alt="Staff Management" />
    <div class="screenshot-caption">Figure 18.1: Staff Administration console for role assignment and account suspension.</div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th>Role Title</th>
        <th>What They Can Access</th>
        <th>Recommended Team Member</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-primary">Super Administrator</span></td>
        <td>Full master access: payment settings, staff creation, database maintenance, full control.</td>
        <td>Store Owner / Managing Director</td>
      </tr>
      <tr>
        <td><span class="badge badge-gold">Operations Admin</span></td>
        <td>Order fulfillment, entering courier tracking AWBs, inventory adjustments, customer contacts.</td>
        <td>Warehouse / Dispatch Manager</td>
      </tr>
      <tr>
        <td><span class="badge badge-subtle">Marketing Admin</span></td>
        <td>Creating coupons, editing homepage banners, activating festival themes, moderating reviews.</td>
        <td>Social Media / Marketing Staff</td>
      </tr>
      <tr>
        <td><span class="badge badge-danger">Suspended</span></td>
        <td>Login access immediately revoked. Account locked out.</td>
        <td>Former employees / inactive contractors</td>
      </tr>
    </tbody>
  </table>

  <h2>19. Store Logistics, Shipping Rates & COD Advance</h2>
  <p>Configure your shipping rates, free delivery thresholds, and Cash on Delivery rules in one central panel.</p>

  <div class="screenshot-box">
    <img src="${imgSet}" class="screenshot-img" alt="Store Settings" />
    <div class="screenshot-caption">Figure 19.1: Store logistics, delivery fees, and payment settings console.</div>
  </div>

  <div class="callout callout-gold">
    <div class="callout-title">Key Settings Every Store Owner Should Know:</div>
    <ul>
      <li><strong>Free Shipping Threshold:</strong> e.g. ₹500 (orders at or above this amount automatically receive Free Delivery).</li>
      <li><strong>Standard Delivery Fee:</strong> e.g. ₹40 (applied to orders below the free shipping limit).</li>
      <li><strong>COD Advance Token:</strong> Optional small online advance (e.g. ₹60 or 15%) paid at checkout to prevent fake COD orders, with the balance collected at the customer's doorstep.</li>
      <li><strong>Official WhatsApp Number:</strong> Set to <code>917593959235</code> (+91 75939 59235) for instant customer order support.</li>
      <li><strong>Store Contact Information:</strong> Update customer care email (<code>care@zadafoods.com</code>) and Punalur, Kollam address.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 20 & 21 -->
  <h2>20. System Audit Logs & Bulk Data Maintenance</h2>
  <p>Monitor security activity and maintain clean system data with comprehensive logging and safe test data cleanup tools.</p>

  <div class="screenshot-box">
    <img src="${imgAuditLogs}" class="screenshot-img" alt="Audit Logs" />
    <div class="screenshot-caption">Figure 20.1: Security audit log recording every administrative update, login, and stock movement.</div>
  </div>

  <div class="screenshot-box">
    <img src="${imgDataCleanup}" class="screenshot-img" alt="Data Cleanup" />
    <div class="screenshot-caption">Figure 20.2: Bulk Data Cleanup module for purging demo orders and test reviews.</div>
  </div>

  <h2>21. Daily & Weekly Store Checklists & FAQ</h2>

  <div class="callout callout-tip">
    <div class="callout-title">Daily Morning Routine (10 Minutes):</div>
    <ul>
      <li>[ ] <strong>1.</strong> Log in to the Admin Console at <code>/admin</code>.</li>
      <li>[ ] <strong>2.</strong> Check <strong>Pending Fulfillment</strong> count on the Dashboard.</li>
      <li>[ ] <strong>3.</strong> Open <em>Orders</em>, print packing slips, and hand them to the packing team.</li>
      <li>[ ] <strong>4.</strong> Check <em>Inventory &gt; Low Stock</em> to see if any spice packs need repacking.</li>
      <li>[ ] <strong>5.</strong> Check <em>Bulk Enquiries</em> and respond to wholesale buyers on WhatsApp (+91 75939 59235).</li>
    </ul>
  </div>

  <div class="callout">
    <div class="callout-title">Daily Afternoon Dispatch Routine:</div>
    <ul>
      <li>[ ] Hand over packed cartons to the courier pickup executive.</li>
      <li>[ ] Open each dispatched order in <em>Orders</em>, enter Courier Name (e.g. DTDC) &amp; AWB Tracking Number.</li>
      <li>[ ] Click <strong>"Update to SHIPPED"</strong> so your customers receive tracking updates.</li>
    </ul>
  </div>

  <h3>Frequently Asked Questions &amp; Troubleshooting:</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th>Incident / Question</th>
        <th>Solution &amp; Best Practice</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>How to immediately mark an item Out of Stock?</strong></td>
        <td>Go to <em>Inventory &amp; Stock</em>, find the variant, click <strong>Adjust Stock</strong>, choose <strong>OVERRIDE</strong>, enter <code>0</code>, and save. The website disables purchases immediately.</td>
      </tr>
      <tr>
        <td><strong>Customer says online payment succeeded but order is Pending?</strong></td>
        <td>Open the order drawer, inspect the Razorpay payment ID. Once verified in your Razorpay dashboard, change Payment Status to <strong>PAID</strong> and save.</td>
      </tr>
      <tr>
        <td><strong>How to pause Cash on Delivery (COD) temporarily?</strong></td>
        <td>Go to <em>Store Settings</em> &gt; uncheck <strong>"Enable Cash on Delivery"</strong> &gt; click Save. Storefront immediately switches to online prepaid only.</td>
      </tr>
      <tr>
        <td><strong>Customer wants to change their shipping address after ordering?</strong></td>
        <td>Open the order in <em>Orders</em>, update the address notes, and ensure the revised address is printed on the courier label before dispatch.</td>
      </tr>
      <tr>
        <td><strong>Forgot Admin Password?</strong></td>
        <td>On the login portal (<code>/login</code>), click <strong>"Forgot password?"</strong>, enter your admin email, and follow the password reset link sent to your inbox.</td>
      </tr>
    </tbody>
  </table>

  <div class="footer-note">
    ZaDa Foods Client Operations Manual (Admin Panel Edition) • Confidential &amp; Proprietary • Prepared for ZaDa Foods Store Management.
  </div>

</body>
</html>`;
}

async function run() {
  console.log('Generating ZaDa_Foods_Client_Admin_Manual.html...');
  const html = buildClientAdminManualHtml();
  const htmlPath = path.join(ROOT_DIR, 'ZaDa_Foods_Client_Admin_Manual.html');
  const artifactHtmlPath = path.join(ARTIFACT_DIR, 'ZaDa_Foods_Client_Admin_Manual.html');
  fs.writeFileSync(htmlPath, html);
  if (fs.existsSync(ARTIFACT_DIR)) fs.writeFileSync(artifactHtmlPath, html);

  console.log('Printing ZaDa_Foods_Client_Admin_Manual.pdf via Headless Chrome...');
  const pdfPath = path.join(ROOT_DIR, 'ZaDa_Foods_Client_Admin_Manual.pdf');
  const artifactPdfPath = path.join(ARTIFACT_DIR, 'ZaDa_Foods_Client_Admin_Manual.pdf');

  cp.execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--print-to-pdf=${pdfPath}`,
    '--no-pdf-header-footer',
    htmlPath
  ]);

  if (fs.existsSync(ARTIFACT_DIR)) fs.copyFileSync(pdfPath, artifactPdfPath);
  console.log(`✓ Generated ${pdfPath} (${fs.statSync(pdfPath).size} bytes)`);

  console.log('\n=============================================');
  console.log('Client Admin Manual PDF Successfully Created!');
  console.log('=============================================\n');
}

run().catch(err => {
  console.error('Failed to generate client admin manual:', err);
  process.exit(1);
});
