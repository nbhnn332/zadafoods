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

function buildUserManualHtml() {
  const imgHero = getBase64Image('manual_01_hero_brand.png');
  const imgStory = getBase64Image('manual_02_our_story.png');
  const imgShop = getBase64Image('manual_03_shop_catalog.png');
  const imgPdp = getBase64Image('manual_04_product_detail.png');
  const imgCart = getBase64Image('manual_05_cart_page.png');
  const imgBulk = getBase64Image('manual_06_bulk_enquiries.png');
  const imgGuestCheckout = getBase64Image('manual_07_guest_checkout.png');
  const imgCustomerCheckout = getBase64Image('manual_08_customer_checkout.png');
  const imgTracking = getBase64Image('manual_08_order_tracking.png');
  const imgLogin = getBase64Image('manual_09_login_portal.png');
  const imgAccount = getBase64Image('manual_10_customer_account.png');
  const imgMobile = getBase64Image('manual_10_mobile_storefront.png');

  const imgAdminDash = getBase64Image('manual_admin_01_dashboard.png');
  const imgAdminProd = getBase64Image('manual_admin_02_products.png');
  const imgAdminSubcat = getBase64Image('manual_admin_03_subcategories.png');
  const imgAdminInv = getBase64Image('manual_admin_04_inventory.png');
  const imgAdminOrd = getBase64Image('manual_admin_05_orders.png');
  const imgAdminCust = getBase64Image('manual_admin_06_customers.png');
  const imgAdminCoup = getBase64Image('manual_admin_07_coupons.png');
  const imgAdminComb = getBase64Image('manual_admin_08_combos.png');
  const imgAdminCms = getBase64Image('manual_admin_09_cms.png');
  const imgAdminFest = getBase64Image('manual_admin_10_festivals.png');
  const imgAdminRev = getBase64Image('manual_admin_11_reviews.png');
  const imgAdminEnq = getBase64Image('manual_admin_12_enquiries.png');
  const imgAdminRep = getBase64Image('manual_admin_13_reports.png');
  const imgAdminMgmt = getBase64Image('manual_admin_14_management.png');
  const imgAdminSet = getBase64Image('manual_admin_15_settings.png');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ZaDa Foods — Official Website & Operations Manual</title>
  <style>
    @page {
      size: A4;
      margin: 16mm 14mm 16mm 14mm;
      @bottom-right {
        content: counter(page);
        font-size: 8pt;
        color: #7A7265;
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
      line-height: 1.55;
      font-size: 9.5pt;
    }
    h1, h2, h3, h4 {
      color: #072C20;
      font-family: Georgia, serif;
      margin-top: 0;
    }
    h1 { font-size: 20pt; line-height: 1.2; margin-bottom: 8pt; }
    h2 { font-size: 14pt; border-bottom: 2px solid #D1C7B7; padding-bottom: 4pt; margin-top: 18pt; margin-bottom: 10pt; page-break-after: avoid; }
    h3 { font-size: 11pt; color: #A67732; margin-top: 12pt; margin-bottom: 4pt; page-break-after: avoid; }
    p { margin: 0 0 8pt 0; }
    ul, ol { margin: 0 0 10pt 0; padding-left: 18pt; }
    li { margin-bottom: 4pt; }
    .page-break { page-break-before: always; }
    .avoid-break { page-break-inside: avoid; }
    
    /* Cover Page */
    .cover-page {
      height: 100%;
      min-height: 980px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(180deg, #FAF7F2 0%, #F3EEE4 100%);
      border: 6px double #072C20;
      padding: 40px;
      margin: 10px;
    }
    .cover-brand {
      font-size: 38pt;
      font-weight: bold;
      color: #072C20;
      letter-spacing: 2px;
      margin-bottom: 4px;
    }
    .cover-tagline {
      font-size: 14pt;
      font-style: italic;
      color: #A67732;
      margin-bottom: 30px;
      letter-spacing: 1px;
    }
    .cover-divider {
      width: 120px;
      height: 3px;
      background-color: #A67732;
      margin: 20px auto;
    }
    .cover-title {
      font-size: 22pt;
      color: #072C20;
      font-weight: bold;
      margin-top: 25px;
      margin-bottom: 12px;
    }
    .cover-subtitle {
      font-size: 11.5pt;
      color: #4B5563;
      max-width: 550px;
      line-height: 1.6;
      margin-bottom: 40px;
    }
    .cover-meta {
      margin-top: 60px;
      padding: 16px 24px;
      background: white;
      border: 1px solid #D1C7B7;
      border-radius: 8px;
      font-size: 9pt;
      color: #374151;
      text-align: left;
      width: 380px;
    }
    .cover-meta table { width: 100%; border-collapse: collapse; }
    .cover-meta td { padding: 4px 6px; }
    .cover-meta td.bold { font-weight: bold; color: #072C20; width: 130px; }

    /* Table of Contents */
    .toc-container {
      background: white;
      border: 1px solid #E5DECF;
      border-radius: 8px;
      padding: 24px 30px;
      margin-bottom: 24px;
    }
    .toc-section {
      margin-bottom: 14px;
    }
    .toc-section-title {
      font-weight: bold;
      font-size: 11pt;
      color: #072C20;
      border-bottom: 1px dashed #A67732;
      padding-bottom: 3pt;
      margin-bottom: 6pt;
    }
    .toc-item {
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      margin-bottom: 3pt;
    }
    .toc-num { color: #A67732; font-weight: bold; width: 24px; }
    .toc-name { flex-grow: 1; color: #374151; }

    /* Content Styling */
    .screenshot-box {
      margin: 10pt 0 14pt 0;
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
      max-height: 380px;
      object-fit: contain;
      background: #FDFBF7;
    }
    .screenshot-caption {
      background: #F4EFE6;
      border-top: 1px solid #E5DECF;
      padding: 5px 12px;
      font-size: 8pt;
      color: #5C5245;
      font-style: italic;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-primary { background: #072C20; color: #FAF7F2; }
    .badge-gold { background: #A67732; color: #FFFFFF; }
    .badge-subtle { background: #EFE9DE; color: #5C5245; }

    .callout {
      border-left: 4px solid #072C20;
      background: #F5EFE6;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      margin: 10pt 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }
    .callout-gold {
      border-left-color: #A67732;
      background: #FDF9EE;
    }
    .callout-title {
      font-weight: bold;
      color: #072C20;
      margin-bottom: 3pt;
      font-size: 9pt;
    }

    .step-box {
      display: flex;
      gap: 12px;
      margin-bottom: 8pt;
      background: white;
      padding: 10px 14px;
      border: 1px solid #E5DECF;
      border-radius: 6px;
      page-break-inside: avoid;
    }
    .step-num {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #072C20;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 8pt;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .step-content {
      flex-grow: 1;
    }
    .step-title {
      font-weight: bold;
      color: #072C20;
      font-size: 9pt;
      margin-bottom: 2pt;
    }
    .step-desc {
      font-size: 8.5pt;
      color: #4B5563;
      margin: 0;
    }

    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0;
      font-size: 8pt;
      page-break-inside: avoid;
      background: white;
      border: 1px solid #D1C7B7;
    }
    table.data-table th {
      background: #072C20;
      color: #FAF7F2;
      padding: 6px 10px;
      text-align: left;
      font-weight: 600;
      font-family: Georgia, serif;
    }
    table.data-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #EFE9DE;
      color: #374151;
      vertical-align: top;
    }
    table.data-table tr:nth-child(even) td {
      background: #FAF7F2;
    }

    .footer-note {
      text-align: center;
      font-size: 8pt;
      color: #7A7265;
      margin-top: 30px;
      border-top: 1px solid #E5DECF;
      padding-top: 12px;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-brand">ZaDa FOODS</div>
    <div class="cover-tagline">"Authentic Kerala Flavours, Rooted in Tradition"</div>
    <div class="cover-divider"></div>
    <div class="cover-title">CLIENT HANDOVER & OPERATIONS MANUAL</div>
    <div class="cover-subtitle">
      A comprehensive visual guide and standard operating procedure for the ZaDa Foods e-commerce storefront and operations console.
    </div>

    <div class="cover-meta">
      <table>
        <tr><td class="bold">Brand:</td><td>ZaDa Foods</td></tr>
        <tr><td class="bold">Official Support:</td><td>+91 75939 59235 (WhatsApp)</td></tr>
        <tr><td class="bold">Official Email:</td><td>care@zadafoods.com</td></tr>
        <tr><td class="bold">Platform Edition:</td><td>ZaDa Commerce v2.4 (Phase 23)</td></tr>
        <tr><td class="bold">Target Audience:</td><td>Store Administrators, Operations & Customer Service Staff</td></tr>
        <tr><td class="bold">Date of Release:</td><td>November 2026</td></tr>
      </table>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- TABLE OF CONTENTS -->
  <h2>TABLE OF CONTENTS</h2>
  <div class="toc-container">
    <div class="toc-section">
      <div class="toc-section-title">SECTION A — CUSTOMER WEBSITE GUIDE</div>
      <div class="toc-item"><span class="toc-num">01</span><span class="toc-name">Brand Positioning, Homepage & Heritage Story</span></div>
      <div class="toc-item"><span class="toc-num">02</span><span class="toc-name">Product Discovery, Category Navigation & Filters</span></div>
      <div class="toc-item"><span class="toc-num">03</span><span class="toc-name">Product Detail Page: Variants, Freshness & Pricing</span></div>
      <div class="toc-item"><span class="toc-num">04</span><span class="toc-name">Shopping Cart, Bag Management & Bulk Inquiries</span></div>
      <div class="toc-item"><span class="toc-num">05</span><span class="toc-name">Frictionless Guest Checkout (No Registration Needed)</span></div>
      <div class="toc-item"><span class="toc-num">06</span><span class="toc-name">Registered Customer Checkout & Saved Address Book</span></div>
      <div class="toc-item"><span class="toc-num">07</span><span class="toc-name">Pincode Serviceability & Real-Time Delivery Check</span></div>
      <div class="toc-item"><span class="toc-num">08</span><span class="toc-name">Secure Payment Options (Razorpay, COD Advance, WhatsApp)</span></div>
      <div class="toc-item"><span class="toc-num">09</span><span class="toc-name">Order Confirmation, Tracking & Guest Access Link</span></div>
      <div class="toc-item"><span class="toc-num">10</span><span class="toc-name">Customer Account Portal & Order History</span></div>
      <div class="toc-item"><span class="toc-num">11</span><span class="toc-name">Direct WhatsApp Ordering & Customer Concierge</span></div>
      <div class="toc-item"><span class="toc-num">12</span><span class="toc-name">Mobile Shopping Experience & Bottom Navigation Bar</span></div>
    </div>

    <div class="toc-section">
      <div class="toc-section-title">SECTION B — ADMIN PANEL OPERATIONS GUIDE</div>
      <div class="toc-item"><span class="toc-num">13</span><span class="toc-name">Admin Authentication & Role-Based Access Control (RBAC)</span></div>
      <div class="toc-item"><span class="toc-num">14</span><span class="toc-name">Operations & Analytics Dashboard</span></div>
      <div class="toc-item"><span class="toc-num">15</span><span class="toc-name">Product Catalogue Management (Add, Edit, Images, Variants)</span></div>
      <div class="toc-item"><span class="toc-num">16</span><span class="toc-name">Category & Subcategory Hierarchy Management</span></div>
      <div class="toc-item"><span class="toc-num">17</span><span class="toc-name">Real-Time Inventory, Stock Alerts & Batch Updates</span></div>
      <div class="toc-item"><span class="toc-num">18</span><span class="toc-name">Order Processing Pipeline, AWB Tracking & Status Updates</span></div>
      <div class="toc-item"><span class="toc-num">19</span><span class="toc-name">Customer Profile Directory & Lifetime Order History</span></div>
      <div class="toc-item"><span class="toc-num">20</span><span class="toc-name">Coupons, Promotional Discounts & Minimum Cart Rules</span></div>
      <div class="toc-item"><span class="toc-num">21</span><span class="toc-name">Combo Packs, Bundles & Savings Banners</span></div>
      <div class="toc-item"><span class="toc-num">22</span><span class="toc-name">Content Management System (CMS) & Dynamic Hero Banners</span></div>
      <div class="toc-item"><span class="toc-num">23</span><span class="toc-name">Festival Themes, Seasonal Themes & Festive Badges</span></div>
      <div class="toc-item"><span class="toc-num">24</span><span class="toc-name">Customer Review Moderation & Approval Workflow</span></div>
      <div class="toc-item"><span class="toc-num">25</span><span class="toc-name">Bulk Corporate & Wholesale Enquiries Management</span></div>
      <div class="toc-item"><span class="toc-num">26</span><span class="toc-name">Sales Reports & Accounting CSV Data Export</span></div>
      <div class="toc-item"><span class="toc-num">27</span><span class="toc-name">Staff Admin Users & Granular Permission Management</span></div>
      <div class="toc-item"><span class="toc-num">28</span><span class="toc-name">Store Configuration, COD Advance & Payment Settings</span></div>
    </div>

    <div class="toc-section">
      <div class="toc-section-title">SECTION C — OPERATIONAL RUNBOOKS & STANDARD OPERATING PROCEDURES</div>
      <div class="toc-item"><span class="toc-num">29</span><span class="toc-name">Publishing New Products & Categories Standard Operating Procedure</span></div>
      <div class="toc-item"><span class="toc-num">30</span><span class="toc-name">Daily Inventory Auditing & Low Stock Alerts</span></div>
      <div class="toc-item"><span class="toc-num">31</span><span class="toc-name">Complete Order Fulfillment Lifecycle (Placement to Doorstep)</span></div>
      <div class="toc-item"><span class="toc-num">32</span><span class="toc-name">Cash on Delivery (COD) Advance Reconciliation & Balance Collection</span></div>
      <div class="toc-item"><span class="toc-num">33</span><span class="toc-name">Customer Refund & Return Management Policy</span></div>
      <div class="toc-item"><span class="toc-num">34</span><span class="toc-name">Seasonal & Festival Campaign Activation Protocol</span></div>
      <div class="toc-item"><span class="toc-num">35</span><span class="toc-name">Daily & Weekly Store Operator Checklists</span></div>
      <div class="toc-item"><span class="toc-num">36</span><span class="toc-name">Troubleshooting Common Operational Inquiries</span></div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION A -->
  <h1>SECTION A: CUSTOMER WEBSITE GUIDE</h1>
  <p>This section provides store operators, customer service executives, and managers with an exact visual reference of the customer-facing e-commerce storefront, explaining how customers discover products, place orders, and track fulfillment.</p>

  <h2>01. Brand Positioning, Homepage & Heritage Story</h2>
  <p>ZaDa Foods is positioned as a <strong>premium Kerala food brand</strong> celebrating authentic culinary heritage. The catalogue highlights <em>Spices and Spice Blends</em>, <em>Whole & Ground Spices</em>, <em>Traditional Kerala Ingredients</em>, and <em>Authentic Cooking Essentials</em>, supported by heritage snack specialities.</p>

  <div class="screenshot-box">
    <img src="${imgHero}" class="screenshot-img" alt="ZaDa Foods Storefront Homepage" />
    <div class="screenshot-caption">Figure 1.1: Storefront Homepage showing premium hero banner, USP strip (Spices & Blends, Pure Ingredients, Zero Additives), and authentic Kerala visual theme.</div>
  </div>

  <div class="callout">
    <div class="callout-title">Brand Identity Core Rules:</div>
    <ul>
      <li><strong>Official Tagline:</strong> <em>"Authentic Kerala Flavours, Rooted in Tradition"</em></li>
      <li><strong>Colour Palette:</strong> Warm Ivory (#FAF7F2), Forest Green (#072C20), and Restrained Gold (#A67732).</li>
      <li><strong>Catalogue Focus:</strong> Kerala spices, ground blends, pure cold-pressed oils, traditional cooking essentials, and farm-fresh specialty snacks.</li>
    </ul>
  </div>

  <div class="screenshot-box">
    <img src="${imgStory}" class="screenshot-img" alt="Our Story Heritage Page" />
    <div class="screenshot-caption">Figure 1.2: Our Story page showcasing the four pillars of ZaDa craftsmanship: Hand-Harvested Hill Spices, Farm-Direct Bananas, Pure Cold-Pressed Coconut Oil, and Batch-Crafted Freshness.</div>
  </div>

  <div class="page-break"></div>

  <h2>02. Product Discovery, Category Navigation & Filters</h2>
  <p>The shop page allows customers to quickly find spices, blends, and snacks through intuitive category buttons, instant search, and sorting filters.</p>

  <div class="screenshot-box">
    <img src="${imgShop}" class="screenshot-img" alt="Shop Catalogue Page" />
    <div class="screenshot-caption">Figure 2.1: Shop catalogue view displaying category pills (Spices & Blends, Snacks, Traditional Essentials), pricing, variant chips, and instant "Add to Bag" triggers.</div>
  </div>

  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Category Filtering</div>
      <div class="step-desc">Customers tap any top category pill to instantly narrow down products without reloading the entire page.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Instant Keyword Search</div>
      <div class="step-desc">Typing in the top navigation bar filters matches across product titles, spice ingredients, and descriptions in real time.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Variant Selection on Catalogue Card</div>
      <div class="step-desc">Customers can choose pack sizes (e.g. 250g, 500g, 1kg) directly from the catalogue card before adding to cart.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <h2>03. Product Detail Page: Variants, Freshness & Pricing</h2>
  <p>The Product Detail Page (PDP) provides customers with detailed nutritional facts, ingredient transparency, customer star ratings, and real-time inventory availability.</p>

  <div class="screenshot-box">
    <img src="${imgPdp}" class="screenshot-img" alt="Product Detail Page" />
    <div class="screenshot-caption">Figure 3.1: Product detail page featuring multi-angle high-res gallery, weight variant selection, freshness promise badge, and quantity controls.</div>
  </div>

  <div class="callout callout-gold">
    <div class="callout-title">Key Elements on Every Product Page:</div>
    <ul>
      <li><strong>Dynamic Pricing & Savings:</strong> Displays Current Price, Crossed-Out MRP, and calculated percentage discount badge.</li>
      <li><strong>Stock Indicators:</strong> Real-time alerts such as "In Stock — Fresh Batch Ready" or "Only 3 left in stock". When inventory hits zero, the button automatically transforms into a disabled "Out of Stock" state.</li>
      <li><strong>Verified Customer Reviews:</strong> Verified purchase badges, user-submitted star ratings, and authentic feedback.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <h2>04. Shopping Cart, Bag Management & Bulk Inquiries</h2>
  <p>The shopping cart calculates subtotals, packaging, courier delivery charges, and coupon discounts with complete price transparency.</p>

  <div class="screenshot-box">
    <img src="${imgCart}" class="screenshot-img" alt="Shopping Cart Page" />
    <div class="screenshot-caption">Figure 4.1: Shopping Cart summary displaying selected items, unit quantities, subtotal calculations, and free delivery progress indicator.</div>
  </div>

  <div class="screenshot-box">
    <img src="${imgBulk}" class="screenshot-img" alt="Bulk Enquiries Page" />
    <div class="screenshot-caption">Figure 4.2: Bulk Order Inquiry form for wholesale buyers, festival gifting, export orders, and restaurant culinary supply.</div>
  </div>

  <div class="callout">
    <div class="callout-title">Bulk Inquiries Workflow:</div>
    <p>When wedding planners, corporate clients, or restaurants require bulk spices or snacks (>15kg), they submit the Bulk Enquiry form. The request is routed directly to the Admin Console under <em>Bulk Enquiries</em> for custom wholesale quote dispatch.</p>
  </div>

  <div class="page-break"></div>

  <h2>05. Frictionless Guest Checkout (No Registration Needed)</h2>
  <p>To eliminate checkout friction, ZaDa Foods offers a <strong>first-class Guest Checkout</strong>. Customers are never forced to register an account or create a password to complete their purchase.</p>

  <div class="screenshot-box">
    <img src="${imgGuestCheckout}" class="screenshot-img" alt="Guest Checkout Screen" />
    <div class="screenshot-caption">Figure 5.1: Guest Checkout screen showing the "Continue as Guest" panel with full delivery address and 10-digit mobile verification.</div>
  </div>

  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Zero Friction Data Entry</div>
      <div class="step-desc">Guests provide only essential shipping information: Full Name, 10-Digit Mobile Number, Email (for invoice), and Shipping Address with PIN code.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Cryptographic Session Protection</div>
      <div class="step-desc">Upon placing the order, a cryptographically secure 64-character guest token is issued and stored in browser storage. Guests can track their specific order without seeing other customers' data.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Optional Account Creation</div>
      <div class="step-desc">Guests can choose to create a permanent account later from the order confirmation screen with one click.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <h2>06. Registered Customer Checkout & Account Portal</h2>
  <p>Returning customers can sign in to access their saved delivery addresses, order history, and re-order previous spice favorites with one click.</p>

  <div class="screenshot-box">
    <img src="${imgAccount}" class="screenshot-img" alt="Customer Account Portal" />
    <div class="screenshot-caption">Figure 6.1: Customer Account Dashboard showing order status history, saved addresses (Home, Office), and account profile details.</div>
  </div>

  <div class="screenshot-box">
    <img src="${imgLogin}" class="screenshot-img" alt="Sign In Portal" />
    <div class="screenshot-caption">Figure 6.2: Sign In screen supporting email and password authentication with self-service password reset.</div>
  </div>

  <div class="page-break"></div>

  <h2>07. Payment Options, Order Confirmation & Live Tracking</h2>
  <p>ZaDa Foods provides three payment channels tailored to Indian e-commerce buyers:</p>

  <table class="data-table">
    <thead>
      <tr>
        <th>Payment Method</th>
        <th>Processing Mechanism</th>
        <th>Customer Experience & Settlement</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Online Payment (Razorpay)</strong></td>
        <td>Instant gateway via UPI, Google Pay, PhonePe, Cards, Net Banking</td>
        <td>100% prepaid order. Order is immediately marked as <code>PAID</code> and scheduled for packing.</td>
      </tr>
      <tr>
        <td><strong>COD Advance + Doorstep Balance</strong></td>
        <td>Fixed or percentage advance (e.g. ₹60 or 15%) paid online; remainder at delivery</td>
        <td>Mitigates return-to-origin (RTO) risks. Marked as <code>ADVANCE_PAID</code> with remaining balance indicated on invoice.</td>
      </tr>
      <tr>
        <td><strong>WhatsApp Assisted Order</strong></td>
        <td>Pre-filled order summary dispatched to ZaDa WhatsApp (+91 75939 59235)</td>
        <td>Ideal for customers preferring manual bank transfer, custom requests, or regional Malayalam communication.</td>
      </tr>
    </tbody>
  </table>

  <div class="screenshot-box">
    <img src="${imgTracking}" class="screenshot-img" alt="Live Order Tracking Screen" />
    <div class="screenshot-caption">Figure 7.1: Live Order Tracking screen displaying five-stage progress bar (Placed, Confirmed, Packed, Shipped, Delivered) with courier tracking link.</div>
  </div>

  <div class="callout">
    <div class="callout-title">IDOR Security Protection on Order Tracking:</div>
    <p>Orders are protected against unauthorized viewing. A stranger guessing order numbers (e.g. <code>ord-1002</code>) is greeted by a <strong>"Protected Order"</strong> screen requiring either an account login or the unique cryptographic guest access token issued at checkout.</p>
  </div>

  <div class="page-break"></div>

  <h2>08. Mobile Experience & Direct WhatsApp Ordering</h2>
  <p>Over 75% of Indian e-commerce traffic originates from mobile devices. The ZaDa storefront features an app-like bottom navigation bar and integrated WhatsApp support.</p>

  <div class="screenshot-box" style="text-align: center;">
    <img src="${imgMobile}" class="screenshot-img" style="max-height: 480px; width: auto; margin: 0 auto;" alt="Mobile Storefront Viewport" />
    <div class="screenshot-caption">Figure 8.1: Mobile viewport showing sticky bottom navigation (Home, Shop, Offers, Cart, Account) and quick-action WhatsApp button.</div>
  </div>

  <div class="callout callout-gold">
    <div class="callout-title">Official WhatsApp Routing:</div>
    <p>Every WhatsApp link, assistance button, and order dispatch message is normalized to the official ZaDa WhatsApp number: <strong>+91 75939 59235</strong> (clean link: <code>https://wa.me/917593959235</code>). The message pre-fills customer name, item list, and delivery city for instant concierge response.</p>
  </div>

  <div class="page-break"></div>

  <!-- SECTION B -->
  <h1>SECTION B: ADMIN PANEL OPERATIONS GUIDE</h1>
  <p>This section is the definitive reference for ZaDa Foods administrators, store managers, and fulfillment personnel operating the back-office console.</p>

  <h2>09. Admin Authentication & Role-Based Access Control (RBAC)</h2>
  <p>The ZaDa Operations Console enforces strict Role-Based Access Control. Administrative access requires explicit cryptographic authorization.</p>

  <table class="data-table">
    <thead>
      <tr>
        <th>Role</th>
        <th>System Permissions</th>
        <th>Intended Operator</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-primary">Super Administrator</span></td>
        <td>Unrestricted access across all modules, including Staff User creation, Role elevation, Store Settings, Payment Keys, and Database Audit Logs.</td>
        <td>Business Owners & Principal Directors</td>
      </tr>
      <tr>
        <td><span class="badge badge-gold">Operations Admin</span></td>
        <td>Orders management, AWB courier entry, Inventory updates, Product catalogue adjustments, and Bulk enquiry resolution.</td>
        <td>Warehouse Managers & Dispatch Leads</td>
      </tr>
      <tr>
        <td><span class="badge badge-subtle">Content Admin</span></td>
        <td>CMS hero banners, Category promos, Festival themes, and Customer review moderation.</td>
        <td>Marketing Executives & Content Writers</td>
      </tr>
      <tr>
        <td><span class="badge" style="background:#DC2626;color:white;">Suspended User</span></td>
        <td>Zero access. Any existing active sessions are terminated immediately upon status toggle.</td>
        <td>Off-boarded Staff or Inactive Contractors</td>
      </tr>
    </tbody>
  </table>

  <div class="screenshot-box">
    <img src="${imgAdminDash}" class="screenshot-img" alt="Admin Operations Dashboard" />
    <div class="screenshot-caption">Figure 9.1: Operations Dashboard presenting real-time revenue, gross order metrics, pending fulfillment count, and low stock warnings.</div>
  </div>

  <div class="page-break"></div>

  <h2>10. Product Catalogue Management</h2>
  <p>Administrators have complete control over product listings, variants, pricing, packaging weights, and marketing badges.</p>

  <div class="screenshot-box">
    <img src="${imgAdminProd}" class="screenshot-img" alt="Product Catalogue Management" />
    <div class="screenshot-caption">Figure 10.1: Product catalogue table showing SKU codes, category tags, base prices, variant count, stock status, and edit/delete actions.</div>
  </div>

  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Adding a New Product</div>
      <div class="step-desc">Click "+ Add Product" at the top right. Enter Product Name, Category, Parent Subcategory, Description, and Shelf-Life details.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Configuring Weight Variants</div>
      <div class="step-desc">Define individual pack sizes (e.g. 100g, 250g, 500g, 1kg) with specific Selling Price, MRP, and initial stock count.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Assigning Promotional Badges</div>
      <div class="step-desc">Select badges such as <em>"Bestseller"</em>, <em>"Pure Malabar Spices"</em>, or <em>"Traditional"</em> to enhance customer visibility.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <h2>11. Category & Subcategory Hierarchy</h2>
  <p>The storefront organizes products into a clean two-level hierarchy: Parent Categories and Subcategories.</p>

  <div class="screenshot-box">
    <img src="${imgAdminSubcat}" class="screenshot-img" alt="Subcategory Hierarchy Management" />
    <div class="screenshot-caption">Figure 11.1: Category and Subcategory tree displaying parent assignments, display order, image thumbnails, and active visibility toggles.</div>
  </div>

  <div class="callout">
    <div class="callout-title">Catalogue Hierarchy Structure:</div>
    <ul>
      <li><strong>Spices & Blends (Parent):</strong> Whole Spices (Black Pepper, Cardamom, Cloves), Ground Spices (Kashmiri Chilli, Turmeric, Coriander), Traditional Masalas (Fish Curry Masala, Sambar Powder).</li>
      <li><strong>Traditional Essentials (Parent):</strong> Pure Cold-Pressed Coconut Oil, Malabar Tamarind (Kudampuli), Uruli-roasted seasonings.</li>
      <li><strong>Specialty Kerala Snacks (Parent):</strong> Traditional Nendran Banana Chips, Jackfruit Chips, Sharkara Upperi.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <h2>12. Real-Time Inventory & Stock Alerts</h2>
  <p>The inventory module protects the business from overselling and alerts operators before stocks run out.</p>

  <div class="screenshot-box">
    <img src="${imgAdminInv}" class="screenshot-img" alt="Inventory Management Module" />
    <div class="screenshot-caption">Figure 12.1: Inventory Management grid with SKU tracking, stock level badges, threshold monitors, and inline stock adjustment.</div>
  </div>

  <div class="callout callout-gold">
    <div class="callout-title">Inventory Thresholds:</div>
    <ul>
      <li><span class="badge badge-primary">Healthy Stock:</span> Quantity &gt; 10 units. Displays standard "In Stock" on customer site.</li>
      <li><span class="badge badge-gold">Low Stock Warning:</span> Quantity between 1 and 10 units. Triggered with warning text "Only X Left!".</li>
      <li><span class="badge" style="background:#DC2626;color:white;">Out of Stock:</span> Quantity = 0. Frontend disables purchase and prevents checkout errors.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <h2>13. Order Processing, Courier AWB & Status Updates</h2>
  <p>The order management console handles order verification, payment status tracking, and dispatch communications.</p>

  <div class="screenshot-box">
    <img src="${imgAdminOrd}" class="screenshot-img" alt="Order Processing Console" />
    <div class="screenshot-caption">Figure 13.1: Order Management screen showing filter tabs (All, Pending, Confirmed, Shipped, Delivered), customer contact, and courier update drawer.</div>
  </div>

  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Verify Payment Status</div>
      <div class="step-desc">Confirm that online orders show <code>PAID</code> or COD orders show <code>ADVANCE_PAID</code> before packing.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Enter Courier Name & AWB Tracking Number</div>
      <div class="step-desc">Select the courier partner (Delhivery, DTDC, India Post, Blue Dart) and paste the tracking AWB code into the order details panel.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Advance Order Status to "SHIPPED"</div>
      <div class="step-desc">Updating the status automatically updates the customer's live tracking timeline and prepares dispatch notifications.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <h2>14. Customers Directory & History</h2>
  <p>Administrators can look up customer profiles, total lifetime spending, past order references, and registered shipping addresses.</p>

  <div class="screenshot-box">
    <img src="${imgAdminCust}" class="screenshot-img" alt="Customer Profile Directory" />
    <div class="screenshot-caption">Figure 14.1: Customer Directory displaying registered names, verified mobile numbers, total completed orders, and lifetime value (LTV).</div>
  </div>

  <h2>15. Coupons, Automatic Discounts & Tiers</h2>
  <p>Create and monitor promotional coupon codes with flexible discount parameters.</p>

  <div class="screenshot-box">
    <img src="${imgAdminCoup}" class="screenshot-img" alt="Coupons and Discount Rules" />
    <div class="screenshot-caption">Figure 15.1: Coupon Management table with code definitions, percentage/flat discounts, minimum cart value requirements, and validity dates.</div>
  </div>

  <div class="page-break"></div>

  <h2>16. Combo Packs & Bundled Offers</h2>
  <p>Curate attractive gift boxes and multi-item spice bundles to increase Average Order Value (AOV).</p>

  <div class="screenshot-box">
    <img src="${imgAdminComb}" class="screenshot-img" alt="Combo Pack Builder" />
    <div class="screenshot-caption">Figure 16.1: Combo Builder module for assembling multi-item bundles (e.g. "Kerala Culinary Spice Box") with special bundle discounts.</div>
  </div>

  <h2>17. Content Management System (CMS) & Dynamic Banners</h2>
  <p>Update homepage hero slides, promotional strip text, and category showcase banners without touching any code.</p>

  <div class="screenshot-box">
    <img src="${imgAdminCms}" class="screenshot-img" alt="Homepage CMS and Banners" />
    <div class="screenshot-caption">Figure 17.1: CMS Editor for managing hero slides, button links, promotional subtext, and banner images with instant storefront updates.</div>
  </div>

  <div class="page-break"></div>

  <h2>18. Festival Themes & Seasonal Styling</h2>
  <p>Activate festive themes (Onam, Vishu, Diwali, Christmas) with one click to transform the storefront's atmosphere.</p>

  <div class="screenshot-box">
    <img src="${imgAdminFest}" class="screenshot-img" alt="Festival Themes and Styling" />
    <div class="screenshot-caption">Figure 18.1: Festival Themes dashboard for activating seasonal color accents, promotional greetings, countdown timers, and festive ribbons.</div>
  </div>

  <h2>19. Customer Review Moderation</h2>
  <p>Protect brand integrity by moderating incoming customer product reviews before they appear publicly on the storefront.</p>

  <div class="screenshot-box">
    <img src="${imgAdminRev}" class="screenshot-img" alt="Review Moderation Queue" />
    <div class="screenshot-caption">Figure 19.1: Review Moderation Queue showing submitted reviews, star ratings, reviewer status, and one-click Approve/Reject buttons.</div>
  </div>

  <div class="page-break"></div>

  <h2>20. Customer Inquiries & Bulk Orders</h2>
  <p>Centralized inbox for general customer contact inquiries and corporate wholesale leads.</p>

  <div class="screenshot-box">
    <img src="${imgAdminEnq}" class="screenshot-img" alt="Bulk Inquiries and Contact Messages" />
    <div class="screenshot-caption">Figure 20.1: Inquiries inbox displaying customer name, contact details, subject, inquiry message, and status tracking (Pending, Contacted, Resolved).</div>
  </div>

  <h2>21. Sales Analytics & Accounting Data Export</h2>
  <p>Generate financial and operational summaries with one-click CSV export for accounting and tax compliance.</p>

  <div class="screenshot-box">
    <img src="${imgAdminRep}" class="screenshot-img" alt="Reports and Data Export" />
    <div class="screenshot-caption">Figure 21.1: Reports module showing monthly revenue charts, top-selling spices, COD advance totals, and CSV export buttons.</div>
  </div>

  <div class="page-break"></div>

  <h2>22. Staff Admin Users & Role Elevation</h2>
  <p>Super Administrators can provision new staff accounts, assign granular role permissions, or revoke administrative access.</p>

  <div class="screenshot-box">
    <img src="${imgAdminMgmt}" class="screenshot-img" alt="Staff Admin Users & RBAC" />
    <div class="screenshot-caption">Figure 22.1: Staff Administration console displaying operator list, assigned permissions, role elevation triggers, and account suspension toggles.</div>
  </div>

  <h2>23. Store & Payment Settings Configuration</h2>
  <p>Configure business hours, courier rules, COD advance thresholds, and payment gateway keys.</p>

  <div class="screenshot-box">
    <img src="${imgAdminSet}" class="screenshot-img" alt="Store and Payment Settings" />
    <div class="screenshot-caption">Figure 23.1: Settings console for configuring store contact details, delivery fees, free shipping limits, and COD advance requirements.</div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION C -->
  <h1>SECTION C: OPERATIONAL RUNBOOKS & SOPs</h1>
  <p>This section provides step-by-step procedures and checklists for daily, weekly, and seasonal operations.</p>

  <h2>24. Daily Order Fulfillment Runbook</h2>
  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Morning Order Review (09:00 AM)</div>
      <div class="step-desc">Log in to the Admin Console &gt; Orders. Filter by <strong>Pending</strong> orders placed overnight. Verify payment status (Razorpay capture ID or COD advance confirmation).</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Generate Packing Slips & Pick Stock (10:00 AM)</div>
      <div class="step-desc">Pick items from the spice and snack inventory. Ensure all packs match weight specifications and have clean air-tight vacuum seals.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Package & Apply Shipping Labels (12:00 PM)</div>
      <div class="step-desc">Pack items in durable, food-grade corrugated boxes. For COD orders, attach the invoice highlighting the exact balance to collect at the doorstep.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">4</div>
    <div class="step-content">
      <div class="step-title">Courier Handover & AWB Entry (03:00 PM)</div>
      <div class="step-desc">Hand over parcels to the courier pickup executive. Enter the AWB tracking numbers into the Admin Orders panel and transition status to <strong>Shipped</strong>.</div>
    </div>
  </div>

  <h2>25. Handling COD Advance & Balance Collection</h2>
  <div class="callout">
    <div class="callout-title">Cash on Delivery Reconciliation Protocol:</div>
    <ul>
      <li><strong>Advance Collection:</strong> When a customer selects COD, the system collects a mandatory token advance (e.g. ₹60 or 15%) via UPI/Razorpay to confirm intent and prevent fake orders.</li>
      <li><strong>Invoice Balance Display:</strong> The customer invoice clearly states: <code>Total Amount: ₹850 | Advance Paid: ₹60 | Balance Due at Delivery: ₹790</code>.</li>
      <li><strong>Doorstep Collection:</strong> The courier delivery agent collects the remaining balance in cash or UPI QR upon delivery.</li>
      <li><strong>Reconciliation:</strong> Weekly courier remittance reports should be checked against the Admin Orders directory to confirm payment settlement.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <h2>26. Store Operator Maintenance Checklists</h2>

  <h3>Daily Checklist (Every Morning):</h3>
  <ul>
    <li>[ ] Review overnight orders and check for flagged or pending payments.</li>
    <li>[ ] Check <em>Inventory &gt; Low Stock Alerts</em> to schedule batch repacking for fast-moving spices.</li>
    <li>[ ] Check <em>Bulk Enquiries</em> and respond to wholesale buyers via phone or WhatsApp.</li>
    <li>[ ] Review customer WhatsApp inquiries at +91 75939 59235.</li>
    <li>[ ] Moderate pending customer reviews in <em>Reviews Moderation</em>.</li>
  </ul>

  <h3>Weekly Checklist (Every Monday):</h3>
  <ul>
    <li>[ ] Perform a physical stock count audit against system inventory counts.</li>
    <li>[ ] Export weekly sales CSV from <em>Reports</em> for bookkeeping.</li>
    <li>[ ] Reconcile courier COD remittance settlements against delivered orders.</li>
    <li>[ ] Review coupon code performance and deactivate expired promotional codes.</li>
  </ul>

  <h3>Emergency Troubleshooting & Escalation:</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th>Incident</th>
        <th>Immediate Action</th>
        <th>Escalation Contact</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Customer payment debited but order not created</strong></td>
        <td>Check Razorpay Dashboard with customer email/phone. If captured, manually create order or issue refund.</td>
        <td>accounts@zadafoods.com</td>
      </tr>
      <tr>
        <td><strong>Product out of stock physically but active online</strong></td>
        <td>Immediately set product variant stock to <code>0</code> in <em>Admin &gt; Inventory</em>. Contact affected customers to offer replacement or immediate refund.</td>
        <td>operations@zadafoods.com</td>
      </tr>
      <tr>
        <td><strong>Courier tracking link not updating after 48 hours</strong></td>
        <td>Raise support ticket with courier account manager using the AWB number. Update customer via WhatsApp concierge.</td>
        <td>care@zadafoods.com</td>
      </tr>
      <tr>
        <td><strong>Store Administrator password locked out</strong></td>
        <td>Use the "Forgot Password" self-service link on the login page or contact the Super Administrator.</td>
        <td>admin.zadafoods.superad@gmail.com</td>
      </tr>
    </tbody>
  </table>

  <div class="footer-note">
    ZaDa Foods Official Operations Manual — Confidential & Proprietary — For Internal Client Use Only.
  </div>

</body>
</html>`;
}

function buildQuickReferenceHtml() {
  const imgAdminDash = getBase64Image('manual_admin_01_dashboard.png');
  const imgAdminOrd = getBase64Image('manual_admin_05_orders.png');
  const imgAdminInv = getBase64Image('manual_admin_04_inventory.png');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ZaDa Foods — Admin Quick Reference Card</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 12mm 12mm 12mm;
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #FAF7F2;
      color: #1F2937;
      margin: 0;
      padding: 0;
      line-height: 1.45;
      font-size: 8.5pt;
    }
    h1, h2, h3 { color: #072C20; font-family: Georgia, serif; margin: 0 0 6pt 0; }
    h1 { font-size: 16pt; border-bottom: 2px solid #072C20; padding-bottom: 4pt; }
    h2 { font-size: 11pt; border-bottom: 1px solid #A67732; padding-bottom: 2pt; margin-top: 10pt; color: #A67732; }
    p { margin: 0 0 6pt 0; }
    ul { margin: 0 0 6pt 0; padding-left: 14pt; }
    li { margin-bottom: 2pt; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10pt; }
    .card { background: white; border: 1px solid #D1C7B7; border-radius: 6px; padding: 10px; }
    .card-title { font-weight: bold; color: #072C20; font-size: 9pt; margin-bottom: 4pt; border-bottom: 1px dashed #E5DECF; padding-bottom: 3pt; }
    .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 7pt; font-weight: bold; }
    .badge-primary { background: #072C20; color: white; }
    .badge-gold { background: #A67732; color: white; }
    table { width: 100%; border-collapse: collapse; font-size: 7.5pt; margin-top: 4pt; }
    th { background: #072C20; color: white; padding: 4px 6px; text-align: left; }
    td { padding: 4px 6px; border-bottom: 1px solid #EFE9DE; }
    .screenshot { width: 100%; height: auto; border: 1px solid #D1C7B7; border-radius: 4px; margin-top: 4pt; }
  </style>
</head>
<body>
  <h1>ZaDa Foods — Admin Quick Reference Card</h1>
  <p style="font-size: 8pt; color: #5C5245; margin-bottom: 8pt;">Essential daily workflows, order pipeline transitions, and operational contacts for store managers.</p>

  <div class="grid">
    <div class="card">
      <div class="card-title">1. Order Status Lifecycle</div>
      <table>
        <tr><th>Status</th><th>Meaning</th><th>Action Required</th></tr>
        <tr><td><strong>PENDING</strong></td><td>Awaiting verification</td><td>Confirm payment or customer WhatsApp</td></tr>
        <tr><td><strong>CONFIRMED</strong></td><td>Payment verified</td><td>Print packing slip & send to packaging</td></tr>
        <tr><td><strong>SHIPPED</strong></td><td>Dispatched with courier</td><td>Enter AWB tracking number</td></tr>
        <tr><td><strong>DELIVERED</strong></td><td>Delivered to customer</td><td>Reconcile COD remittance</td></tr>
        <tr><td><strong>CANCELLED</strong></td><td>Cancelled by customer</td><td>Stock automatically restored</td></tr>
      </table>
    </div>

    <div class="card">
      <div class="card-title">2. Inventory Stock Thresholds</div>
      <ul>
        <li><span class="badge badge-primary">In Stock (&gt;10 units)</span>: Normal sales active on website.</li>
        <li><span class="badge badge-gold">Low Stock (1-10 units)</span>: Automatic alert on dashboard; schedule repacking.</li>
        <li><span class="badge" style="background:#DC2626;color:white;">Out of Stock (0 units)</span>: Storefront disables "Add to Cart" automatically.</li>
      </ul>
      <p style="font-size: 7.5pt; color: #5C5245; margin-top: 6pt;">To adjust stock: Go to <strong>Inventory</strong> &gt; Click stock quantity &gt; Update value &gt; Click Checkmark.</p>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">3. Cash on Delivery (COD) Rules</div>
      <ul>
        <li><strong>Mandatory Advance:</strong> Token advance (₹60 or 15%) paid online via Razorpay before dispatch.</li>
        <li><strong>Invoice Notice:</strong> Package label clearly displays remaining doorstep balance.</li>
        <li><strong>Courier Remittance:</strong> Weekly courier payout must equal doorstep collected balance.</li>
      </ul>
    </div>

    <div class="card">
      <div class="card-title">4. Key Operations Contacts</div>
      <ul>
        <li><strong>Official WhatsApp Support:</strong> +91 75939 59235</li>
        <li><strong>Customer Care Email:</strong> care@zadafoods.com</li>
        <li><strong>Super Administrator:</strong> admin.zadafoods.superad@gmail.com</li>
        <li><strong>Escalations & Refunds:</strong> accounts@zadafoods.com</li>
      </ul>
    </div>
  </div>

  <div class="card">
    <div class="card-title">5. Operations Dashboard Snapshot</div>
    <img src="${imgAdminDash}" class="screenshot" alt="Operations Dashboard" />
  </div>

</body>
</html>`;
}

async function generatePdfs() {
  console.log('Generating ZaDa_Foods_Website_User_Manual.html...');
  const userManualHtml = buildUserManualHtml();
  const manualHtmlPath = path.join(ROOT_DIR, 'ZaDa_Foods_Website_User_Manual.html');
  fs.writeFileSync(manualHtmlPath, userManualHtml);
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'ZaDa_Foods_Website_User_Manual.html'), userManualHtml);

  console.log('Generating ZaDa_Foods_Admin_Quick_Reference.html...');
  const quickRefHtml = buildQuickReferenceHtml();
  const quickRefHtmlPath = path.join(ROOT_DIR, 'ZaDa_Foods_Admin_Quick_Reference.html');
  fs.writeFileSync(quickRefHtmlPath, quickRefHtml);
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'ZaDa_Foods_Admin_Quick_Reference.html'), quickRefHtml);

  console.log('Printing ZaDa_Foods_Website_User_Manual.pdf via Headless Chrome...');
  const manualPdfPath = path.join(ROOT_DIR, 'ZaDa_Foods_Website_User_Manual.pdf');
  const manualPdfArtifact = path.join(ARTIFACT_DIR, 'ZaDa_Foods_Website_User_Manual.pdf');

  cp.execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--print-to-pdf=${manualPdfPath}`,
    '--no-pdf-header-footer',
    manualHtmlPath
  ]);
  fs.copyFileSync(manualPdfPath, manualPdfArtifact);
  console.log(`✓ Generated ${manualPdfPath} (${fs.statSync(manualPdfPath).size} bytes)`);

  console.log('Printing ZaDa_Foods_Admin_Quick_Reference.pdf via Headless Chrome...');
  const quickRefPdfPath = path.join(ROOT_DIR, 'ZaDa_Foods_Admin_Quick_Reference.pdf');
  const quickRefPdfArtifact = path.join(ARTIFACT_DIR, 'ZaDa_Foods_Admin_Quick_Reference.pdf');

  cp.execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--print-to-pdf=${quickRefPdfPath}`,
    '--no-pdf-header-footer',
    quickRefHtmlPath
  ]);
  fs.copyFileSync(quickRefPdfPath, quickRefPdfArtifact);
  console.log(`✓ Generated ${quickRefPdfPath} (${fs.statSync(quickRefPdfPath).size} bytes)`);

  console.log('\n=============================================');
  console.log('PDF User Manual & Quick Reference Successfully Generated!');
  console.log('=============================================\n');
}

generatePdfs().catch(err => {
  console.error('Failed to generate PDFs:', err);
  process.exit(1);
});
