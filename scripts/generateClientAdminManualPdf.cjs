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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ZaDa Foods — Client Admin Panel Operations & Learning Manual</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 12mm 14mm 12mm;
      @bottom-right {
        content: "Page " counter(page);
        font-size: 8pt;
        color: #7A7265;
        font-family: sans-serif;
      }
      @bottom-left {
        content: "ZaDa Foods Admin Manual • Confidential";
        font-size: 8pt;
        color: #7A7265;
        font-family: sans-serif;
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
      font-size: 9pt;
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
      font-size: 10.5pt;
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
      min-height: 980px;
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
      padding: 5px 14px;
      border-radius: 20px;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .cover-brand {
      font-size: 36pt;
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
      margin-bottom: 24px;
    }
    .cover-divider {
      width: 100px;
      height: 3px;
      background-color: #A67732;
      margin: 15px auto;
    }
    .cover-title {
      font-size: 22pt;
      color: #072C20;
      font-weight: bold;
      margin-top: 20px;
      margin-bottom: 12px;
    }
    .cover-subtitle {
      font-size: 11pt;
      color: #4B5563;
      max-width: 540px;
      line-height: 1.6;
      margin-bottom: 35px;
    }
    .cover-meta {
      margin-top: 40px;
      padding: 16px 22px;
      background: white;
      border: 1px solid #D1C7B7;
      border-radius: 8px;
      font-size: 8.5pt;
      color: #374151;
      text-align: left;
      width: 420px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.04);
    }
    .cover-meta table { width: 100%; border-collapse: collapse; }
    .cover-meta td { padding: 4px 6px; }
    .cover-meta td.bold { font-weight: bold; color: #072C20; width: 150px; }

    /* Table of Contents */
    .toc-container {
      background: white;
      border: 1px solid #E5DECF;
      border-radius: 8px;
      padding: 20px 24px;
      margin-bottom: 18px;
    }
    .toc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
    }
    .toc-item {
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      border-bottom: 1px dashed #E5DECF;
      padding-bottom: 3px;
    }
    .toc-num { color: #A67732; font-weight: bold; width: 28px; }
    .toc-name { flex-grow: 1; color: #374151; font-weight: 500; }

    /* UI Screenshots */
    .screenshot-box {
      margin: 8pt 0 12pt 0;
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
      max-height: 340px;
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
      padding: 8pt 12pt;
      border-radius: 0 6px 6px 0;
      margin: 8pt 0;
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
      font-size: 9pt;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Step Cards */
    .step-box {
      display: flex;
      gap: 10px;
      margin-bottom: 6pt;
      background: white;
      padding: 8pt 12pt;
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
    .step-content {
      flex-grow: 1;
    }
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
      margin: 8pt 0;
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
      margin-top: 24pt;
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
      A step-by-step practical visual guide to help your team master the ZaDa Foods Admin Operations Console: Products, Orders, Inventory, Coupons, CMS & Daily Workflows.
    </div>

    <div class="cover-meta">
      <table>
        <tr><td class="bold">Store Brand:</td><td>ZaDa Foods</td></tr>
        <tr><td class="bold">Admin URL:</td><td>yourdomain.com/admin (or /login)</td></tr>
        <tr><td class="bold">Official WhatsApp:</td><td>+91 75939 59235</td></tr>
        <tr><td class="bold">Admin Support:</td><td>care@zadafoods.com</td></tr>
        <tr><td class="bold">Console Edition:</td><td>ZaDa Operations Console v2.4</td></tr>
        <tr><td class="bold">Intended For:</td><td>Store Owners, Managers & Operations Staff</td></tr>
      </table>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- TABLE OF CONTENTS -->
  <h2>TABLE OF CONTENTS</h2>
  <div class="toc-container">
    <div class="toc-grid">
      <div class="toc-item"><span class="toc-num">01</span><span class="toc-name">Quick-Start: Your First 15 Minutes as Admin</span></div>
      <div class="toc-item"><span class="toc-num">02</span><span class="toc-name">Signing In & Navigation Menu Tour</span></div>
      <div class="toc-item"><span class="toc-num">03</span><span class="toc-name">Operations Dashboard & Real-Time Metrics</span></div>
      <div class="toc-item"><span class="toc-num">04</span><span class="toc-name">Managing Products & Weight Variants</span></div>
      <div class="toc-item"><span class="toc-num">05</span><span class="toc-name">Organizing Categories & Subcategories</span></div>
      <div class="toc-item"><span class="toc-num">06</span><span class="toc-name">Inventory Management & Low-Stock Alerts</span></div>
      <div class="toc-item"><span class="toc-num">07</span><span class="toc-name">Fulfilling Orders & Dispatching Courier AWBs</span></div>
      <div class="toc-item"><span class="toc-num">08</span><span class="toc-name">Customer Directory & Lifetime Spend</span></div>
      <div class="toc-item"><span class="toc-num">09</span><span class="toc-name">Coupons, Discounts & Automatic Pricing Rules</span></div>
      <div class="toc-item"><span class="toc-num">10</span><span class="toc-name">Building Combo Packs & Gift Bundles</span></div>
      <div class="toc-item"><span class="toc-num">11</span><span class="toc-name">Homepage CMS: Editing Hero Banners & Strips</span></div>
      <div class="toc-item"><span class="toc-num">12</span><span class="toc-name">Activating Festival Themes (Onam, Diwali, etc.)</span></div>
      <div class="toc-item"><span class="toc-num">13</span><span class="toc-name">Moderating Customer Product Reviews</span></div>
      <div class="toc-item"><span class="toc-num">14</span><span class="toc-name">Handling Wholesale & Bulk Order Enquiries</span></div>
      <div class="toc-item"><span class="toc-num">15</span><span class="toc-name">Sales Reports & Accounting CSV Data Export</span></div>
      <div class="toc-item"><span class="toc-num">16</span><span class="toc-name">Staff Admin Users & Permission Roles</span></div>
      <div class="toc-item"><span class="toc-num">17</span><span class="toc-name">Store Logistics, Delivery Charges & COD Advance</span></div>
      <div class="toc-item"><span class="toc-num">18</span><span class="toc-name">Daily & Weekly Store Manager Checklists</span></div>
    </div>
  </div>

  <!-- MODULE 1 -->
  <h2>01. Quick-Start: Your First 15 Minutes as Admin</h2>
  <p>Welcome to the ZaDa Foods Operations Console! You can manage your entire e-commerce store—adding fresh spices, fulfilling customer orders, adjusting stock, and creating discount coupons—without writing a single line of code.</p>

  <div class="callout callout-tip">
    <div class="callout-title">The 4 Simple Daily Tasks of a Store Manager:</div>
    <ol>
      <li><strong>Check Pending Orders:</strong> Confirm customer orders placed overnight and print packing slips.</li>
      <li><strong>Handover Parcels to Courier:</strong> Paste the Courier Tracking Number (AWB) so the customer tracks their delivery live.</li>
      <li><strong>Review Stock Levels:</strong> Check if fast-moving spices or banana chips need small-batch replenishment.</li>
      <li><strong>Respond to WhatsApp/Enquiries:</strong> Chat with wholesale buyers and assist customers directly on WhatsApp (+91 75939 59235).</li>
    </ol>
  </div>

  <h2>02. Signing In & Navigation Menu Tour</h2>
  <p>To access the console, navigate to <code>/login</code> or <code>/admin</code>. Enter your authorized administrator email address and password.</p>

  <div class="screenshot-box">
    <img src="${imgLogin}" class="screenshot-img" alt="Admin Sign In" />
    <div class="screenshot-caption">Figure 2.1: Sign In portal for administrators and staff.</div>
  </div>

  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Enter Admin Credentials</div>
      <div class="step-desc">Type your store management email (e.g. <code>admin@zadafoods.com</code>) and secure password. Click <strong>"Sign In"</strong>.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Automatic Role Routing</div>
      <div class="step-desc">The system verifies your administrative privileges and automatically redirects you directly into the <strong>Operations Console</strong>. Ordinary customers are strictly prohibited from this section.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 3 -->
  <h2>03. Operations Dashboard & Real-Time Metrics</h2>
  <p>The Dashboard provides an instant snapshot of your store's commercial and fulfillment health.</p>

  <div class="screenshot-box">
    <img src="${imgDash}" class="screenshot-img" alt="Operations Dashboard" />
    <div class="screenshot-caption">Figure 3.1: Operations Dashboard showing gross revenue, gross orders, pending fulfillment counter, and quick action shortcuts.</div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th>Dashboard Card</th>
        <th>What It Means</th>
        <th>Recommended Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Gross Revenue (₹)</strong></td>
        <td>Total successful sales generated across online payments and verified COD orders.</td>
        <td>Monitor weekly sales growth and campaign effectiveness.</td>
      </tr>
      <tr>
        <td><strong>Total Orders</strong></td>
        <td>All customer orders placed in the system.</td>
        <td>Check order volume trends over time.</td>
      </tr>
      <tr>
        <td><strong>Pending Fulfillment (<span class="badge badge-gold">ACTION REQUIRED</span>)</strong></td>
        <td>Orders that have been confirmed and paid but are waiting to be packed and dispatched.</td>
        <td>Click <strong>"Fulfill Orders"</strong> immediately to process parcels.</td>
      </tr>
      <tr>
        <td><strong>Low Stock Items (<span class="badge badge-danger">WARNING</span>)</strong></td>
        <td>Products with fewer than 10 units remaining in warehouse inventory.</td>
        <td>Click <strong>"Full Inventory"</strong> to restock before items sell out.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- MODULE 4 -->
  <h2>04. Managing Products & Weight Variants</h2>
  <p>The Product Catalogue is where you add new products, edit descriptions, adjust retail prices, configure pack sizes (variants), and manage promotional badges.</p>

  <div class="screenshot-box">
    <img src="${imgProd}" class="screenshot-img" alt="Product Catalogue" />
    <div class="screenshot-caption">Figure 4.1: Product catalogue table showing search bar, category filters, variant details, and Edit/Delete buttons.</div>
  </div>

  <h3>How to Add a Brand New Product (Step-by-Step):</h3>
  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Click "+ Add Product"</div>
      <div class="step-desc">Located at the top right of the Products page. A modal form will appear.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Enter Product Basic Info</div>
      <div class="step-desc">Provide the <strong>Product Title</strong> (e.g. <em>"Wayanad Black Pepper (Whole Bold)"</em>), select the <strong>Parent Category</strong> (e.g. <em>Spices & Blends</em>) and <strong>Subcategory</strong> (e.g. <em>Whole Spices</em>).</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Add High-Resolution Image URLs</div>
      <div class="step-desc">Paste your product photo URL. Clean, well-lit photos on ivory or white backgrounds work best for high conversion.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">4</div>
    <div class="step-content">
      <div class="step-title">Configure Pack Sizes & Variants</div>
      <div class="step-desc">Click <strong>"+ Add Variant"</strong> to specify pack sizes:
        <ul>
          <li><strong>Weight Label:</strong> e.g. <code>250g</code>, <code>500g</code>, or <code>1kg</code></li>
          <li><strong>Selling Price (₹):</strong> The actual discounted price the customer pays (e.g. ₹280)</li>
          <li><strong>MRP (Crossed-out Price ₹):</strong> e.g. ₹320 (shows customers savings)</li>
          <li><strong>Initial Stock Quantity:</strong> e.g. 50 units</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">5</div>
    <div class="step-content">
      <div class="step-title">Assign Promotional Badges (Optional)</div>
      <div class="step-desc">Pick a badge: <em>"Bestseller"</em>, <em>"Pure Malabar Spices"</em>, or <em>"Traditional"</em> to make the product stand out on the shop page.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">6</div>
    <div class="step-content">
      <div class="step-title">Click "Save Product"</div>
      <div class="step-desc">The item is instantly published live on your storefront!</div>
    </div>
  </div>

  <div class="callout callout-gold">
    <div class="callout-title">Publish vs Delete:</div>
    <p>If an item is temporarily seasonal or out of stock, click the <strong>Eye Icon</strong> to hide it from customers without deleting your descriptions or photos. Only use the <strong>Trash Can</strong> if a product is discontinued permanently.</p>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 5 -->
  <h2>05. Organizing Categories & Subcategories</h2>
  <p>ZaDa Foods utilizes an intuitive 2-level hierarchy to help customers explore products effortlessly.</p>

  <div class="screenshot-box">
    <img src="${imgSubcat}" class="screenshot-img" alt="Subcategory Hierarchy" />
    <div class="screenshot-caption">Figure 5.1: Categories and Subcategories management table.</div>
  </div>

  <div class="callout">
    <div class="callout-title">The Recommended Store Structure:</div>
    <ul>
      <li><strong>Spices & Blends (Parent):</strong>
        <ul>
          <li><em>Whole Spices:</em> Tellicherry Black Pepper, Green Cardamom, Cloves, Cinnamon.</li>
          <li><em>Ground Spices:</em> Kashmiri Chilli Powder, Malabar Turmeric, Coriander.</li>
          <li><em>Traditional Masalas:</em> Kerala Fish Curry Masala, Sambar Powder, Rasam Podi.</li>
        </ul>
      </li>
      <li><strong>Traditional Ingredients & Essentials (Parent):</strong>
        <ul>
          <li>Pure Cold-Pressed Coconut Oil, Malabar Tamarind (Kudampuli), Uruli-roasted salt seasonings.</li>
        </ul>
      </li>
      <li><strong>Authentic Kerala Snacks (Parent):</strong>
        <ul>
          <li>Traditional Nendran Banana Chips (Coconut Oil Fried), Spicy Banana Chips, Sharkara Upperi (Jaggery-coated).</li>
        </ul>
      </li>
    </ul>
  </div>

  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Adding a New Subcategory</div>
      <div class="step-desc">Click <strong>"+ Add Subcategory"</strong>. Select the parent category, type the subcategory title, and upload a thumbnail icon.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 6 -->
  <h2>06. Inventory Management & Low-Stock Alerts</h2>
  <p>The Inventory console keeps your physical warehouse in perfect sync with what customers see online, preventing accidental overselling.</p>

  <div class="screenshot-box">
    <img src="${imgInv}" class="screenshot-img" alt="Inventory Console" />
    <div class="screenshot-caption">Figure 6.1: Real-time inventory grid with stock status badges and quick stock adjustment controls.</div>
  </div>

  <h3>Understanding Stock Status Indicators:</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th>Indicator Badge</th>
        <th>Stock Range</th>
        <th>Customer Storefront Experience</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-success">In Stock</span></td>
        <td>11+ units</td>
        <td>Green badge "In Stock — Fresh Batch Ready". Customers can add to bag freely.</td>
      </tr>
      <tr>
        <td><span class="badge badge-gold">Low Stock</span></td>
        <td>1 to 10 units</td>
        <td>Urgency alert: <em>"Only X left in stock!"</em> Encourages immediate checkout.</td>
      </tr>
      <tr>
        <td><span class="badge badge-danger">Out of Stock</span></td>
        <td>0 units</td>
        <td>"Add to Bag" button is automatically disabled. Protects you from taking orders you cannot fulfill.</td>
      </tr>
    </tbody>
  </table>

  <h3>How to Update Stock in 3 Clicks:</h3>
  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Find the Product Variant</div>
      <div class="step-desc">Search by product title or SKU (e.g. <code>WBP-500G</code>) in the search bar.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Click "Adjust Stock"</div>
      <div class="step-desc">Choose your action:
        <ul>
          <li><strong>ADD:</strong> e.g. Received a new batch of 30 packets. Type <code>30</code>.</li>
          <li><strong>DEDUCT:</strong> e.g. 2 packs damaged or used for store tasting. Type <code>2</code>.</li>
          <li><strong>OVERRIDE:</strong> e.g. Counted physical stock and there are exactly 45 packets. Type <code>45</code>.</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Select Reason & Confirm</div>
      <div class="step-desc">Choose reason: <em>Purchase Order, Restock, Correction, or Damaged</em>. Click <strong>"Save Adjustment"</strong>. The website updates immediately.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 7 -->
  <h2>07. Fulfilling Orders & Dispatching Courier AWBs</h2>
  <p>The Order Management console is your fulfillment command center. Here you review incoming orders, verify payments, print invoices, and update delivery tracking.</p>

  <div class="screenshot-box">
    <img src="${imgOrd}" class="screenshot-img" alt="Orders Console" />
    <div class="screenshot-caption">Figure 7.1: Order Management screen showing status tabs, customer details, and the courier update drawer.</div>
  </div>

  <h3>The Complete 5-Stage Order Lifecycle:</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th>Status</th>
        <th>Meaning</th>
        <th>What the Manager Does</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-subtle">PENDING</span></td>
        <td>Order placed, awaiting confirmation</td>
        <td>Verify payment. For WhatsApp assisted orders, confirm via chat.</td>
      </tr>
      <tr>
        <td><span class="badge badge-primary">CONFIRMED</span></td>
        <td>Payment verified (Razorpay or COD Advance)</td>
        <td>Print invoice/packing slip and send to the packing team.</td>
      </tr>
      <tr>
        <td><span class="badge badge-gold">PACKED</span></td>
        <td>Items packed in sealed food-grade carton</td>
        <td>Attach shipping address label and prepare for courier pickup.</td>
      </tr>
      <tr>
        <td><span class="badge badge-primary">SHIPPED</span></td>
        <td>Handed over to courier partner</td>
        <td><strong>Enter Courier Name & AWB Tracking Number.</strong> Status updates for customer.</td>
      </tr>
      <tr>
        <td><span class="badge badge-success">DELIVERED</span></td>
        <td>Successfully delivered to customer's door</td>
        <td>For COD orders, verify doorstep balance was collected.</td>
      </tr>
    </tbody>
  </table>

  <h3>How to Dispatch an Order (Step-by-Step):</h3>
  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Click on the Order Row</div>
      <div class="step-desc">Opens the Order Details drawer displaying item list, weights, customer phone, and shipping address.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Select Courier Partner</div>
      <div class="step-desc">Select your courier from the dropdown: <em>DTDC Express, Delhivery, India Post, Blue Dart, or Professional Couriers</em>.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Paste the AWB Tracking Number</div>
      <div class="step-desc">Enter the Air Waybill (AWB) number provided on the courier receipt (e.g. <code>DEL123456789IN</code>).</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">4</div>
    <div class="step-content">
      <div class="step-title">Set Status to "SHIPPED" & Save</div>
      <div class="step-desc">Click <strong>"Update Order"</strong>. The customer's live tracking link is immediately updated with courier tracking.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 8 & 9 -->
  <h2>08. Customer Directory & Lifetime Spend</h2>
  <p>Access your customer list to see loyal buyers, total orders placed, and contact details.</p>

  <div class="screenshot-box">
    <img src="${imgCust}" class="screenshot-img" alt="Customers Directory" />
    <div class="screenshot-caption">Figure 8.1: Customer Directory displaying registered names, verified phones, order count, and lifetime value.</div>
  </div>

  <h2>09. Coupons, Discounts & Automatic Pricing Rules</h2>
  <p>Create attractive promotional offers to boost festival sales and reward first-time visitors.</p>

  <div class="screenshot-box">
    <img src="${imgCoup}" class="screenshot-img" alt="Coupons Management" />
    <div class="screenshot-caption">Figure 9.1: Coupons and discount rules table.</div>
  </div>

  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Creating a New Coupon Code</div>
      <div class="step-desc">Click <strong>"+ Create Coupon"</strong>.
        <ul>
          <li><strong>Coupon Code:</strong> e.g. <code>FESTIVE15</code> or <code>WELCOME50</code> (uppercase, no spaces).</li>
          <li><strong>Discount Type:</strong> <em>Percentage (%)</em> (e.g. 15% off) or <em>Flat (₹)</em> (e.g. ₹50 off).</li>
          <li><strong>Minimum Order Value:</strong> e.g. ₹499 (customer must have ₹499 in cart to apply).</li>
          <li><strong>Maximum Discount Cap:</strong> e.g. ₹150 (prevents massive losses on huge orders).</li>
          <li><strong>First Order Only:</strong> Toggle on if this is exclusively a welcome gift for new buyers.</li>
          <li><strong>Expiry Date:</strong> Set when the promotion ends.</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 10 & 11 -->
  <h2>10. Building Combo Packs & Gift Bundles</h2>
  <p>Combo packs encourage customers to buy multiple spices together, increasing your Average Order Value (AOV).</p>

  <div class="screenshot-box">
    <img src="${imgComb}" class="screenshot-img" alt="Combo Pack Builder" />
    <div class="screenshot-caption">Figure 10.1: Combo Builder module for assembling multi-item gift sets.</div>
  </div>

  <h2>11. Homepage CMS: Editing Hero Banners & Strips</h2>
  <p>Keep your storefront fresh! Change homepage hero banners, promotional texts, and button links anytime without needing a developer.</p>

  <div class="screenshot-box">
    <img src="${imgCms}" class="screenshot-img" alt="Homepage CMS" />
    <div class="screenshot-caption">Figure 11.1: Content Management System for editing banners, promo strips, and button links.</div>
  </div>

  <div class="callout callout-tip">
    <div class="callout-title">Hero Banner Best Practices:</div>
    <ul>
      <li><strong>Recommended Dimensions:</strong> 1920 × 800 pixels (desktop) or clean horizontal landscape photos.</li>
      <li><strong>Text Overlay:</strong> Keep headings short (3–6 words, e.g. <em>"Freshly Ground Malabar Spices"</em>).</li>
      <li><strong>Button Link:</strong> Point to <code>/shop</code> or a specific category such as <code>/category/spices</code>.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 12 & 13 -->
  <h2>12. Activating Festival Themes (Onam, Diwali, etc.)</h2>
  <p>Celebrate Kerala and Indian festivals! Transform your storefront atmosphere with 1-click festive themes.</p>

  <div class="screenshot-box">
    <img src="${imgFest}" class="screenshot-img" alt="Festival Themes" />
    <div class="screenshot-caption">Figure 12.1: Festival Themes dashboard for seasonal theme activation and countdown popups.</div>
  </div>

  <div class="step-box">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Pick a Festival Campaign</div>
      <div class="step-desc">Choose from <em>Onam Grand Celebration, Vishu Kani, Diwali Festival of Lights, or Christmas / New Year</em>.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Click "Activate Theme"</div>
      <div class="step-desc">The storefront instantly applies festive gold ribbons, themed promotional banners, and holiday countdown timers.</div>
    </div>
  </div>
  <div class="step-box">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Deactivate When Festival Concludes</div>
      <div class="step-desc">Click <strong>"Deactivate"</strong> to seamlessly revert the website to the classic ZaDa Foods ivory and green heritage branding.</div>
    </div>
  </div>

  <h2>13. Moderating Customer Product Reviews</h2>
  <p>Maintain brand credibility by moderating customer feedback before it appears publicly on product pages.</p>

  <div class="screenshot-box">
    <img src="${imgRev}" class="screenshot-img" alt="Reviews Moderation" />
    <div class="screenshot-caption">Figure 13.1: Review Moderation Queue showing user ratings, comments, and Approve/Reject buttons.</div>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 14 & 15 -->
  <h2>14. Handling Wholesale & Bulk Order Enquiries</h2>
  <p>Catering businesses, restaurants, and wedding planners often require bulk quantities (&gt;15 kg). Their inquiries arrive directly in this inbox.</p>

  <div class="screenshot-box">
    <img src="${imgEnq}" class="screenshot-img" alt="Bulk Enquiries" />
    <div class="screenshot-caption">Figure 14.1: Wholesale and bulk inquiries management screen.</div>
  </div>

  <h2>15. Sales Reports & Accounting CSV Data Export</h2>
  <p>Download your complete financial records with one click for bookkeeping, GST calculations, and sales analysis.</p>

  <div class="screenshot-box">
    <img src="${imgRep}" class="screenshot-img" alt="Sales Reports" />
    <div class="screenshot-caption">Figure 15.1: Reports module showing monthly revenue charts and CSV export triggers.</div>
  </div>

  <div class="callout callout-tip">
    <div class="callout-title">How to Export for Accounting:</div>
    <p>Click <strong>"Export Orders CSV"</strong>. Open the downloaded file in Microsoft Excel or Google Sheets. It includes Order Numbers, Dates, Customer Names, Items, Quantities, Taxes, Shipping Fees, and Payment Modes.</p>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 16 & 17 -->
  <h2>16. Staff Admin Users & Permission Roles</h2>
  <p>Safely grant dashboard access to your team without sharing your master Super Admin password.</p>

  <div class="screenshot-box">
    <img src="${imgMgmt}" class="screenshot-img" alt="Staff Management" />
    <div class="screenshot-caption">Figure 16.1: Staff Administration console for role assignment and account suspension.</div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th>Role Type</th>
        <th>What They Can See & Do</th>
        <th>Ideal Team Member</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-primary">Super Administrator</span></td>
        <td>Full master access: can change payment keys, manage staff, delete records.</td>
        <td>Business Owner / Director</td>
      </tr>
      <tr>
        <td><span class="badge badge-gold">Operations Admin</span></td>
        <td>Can fulfill orders, enter courier AWBs, update inventory, and view customer contacts.</td>
        <td>Warehouse / Dispatch Manager</td>
      </tr>
      <tr>
        <td><span class="badge badge-subtle">Marketing Admin</span></td>
        <td>Can create coupons, edit CMS banners, activate festival themes, and moderate reviews.</td>
        <td>Social Media / Marketing Staff</td>
      </tr>
      <tr>
        <td><span class="badge badge-danger">Suspended</span></td>
        <td>Access completely locked. Cannot log in.</td>
        <td>Former employees / inactive contractors</td>
      </tr>
    </tbody>
  </table>

  <h2>17. Store Logistics, Delivery Charges & COD Advance</h2>
  <p>Configure your shipping rates, free delivery thresholds, and Cash on Delivery rules in one central panel.</p>

  <div class="screenshot-box">
    <img src="${imgSet}" class="screenshot-img" alt="Store Settings" />
    <div class="screenshot-caption">Figure 17.1: Store and payment settings console.</div>
  </div>

  <div class="callout callout-gold">
    <div class="callout-title">Key Settings Every Store Owner Should Know:</div>
    <ul>
      <li><strong>Free Shipping Threshold:</strong> e.g. ₹500 (orders above this amount receive free delivery automatically).</li>
      <li><strong>Standard Delivery Fee:</strong> e.g. ₹40 (applied to orders below the free shipping limit).</li>
      <li><strong>COD Advance Token:</strong> Optional small online advance (e.g. ₹60 or 15%) paid at checkout to prevent fake COD orders, with the remaining balance collected at the doorstep.</li>
      <li><strong>Official WhatsApp Number:</strong> Set to <code>917593959235</code> (+91 75939 59235) for instant customer routing.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <!-- MODULE 18 -->
  <h2>18. Daily & Weekly Store Manager Checklists</h2>

  <div class="callout callout-tip">
    <div class="callout-title">Daily Morning Routine (10 Minutes):</div>
    <ul>
      <li>[ ] <strong>Step 1:</strong> Log in to the Admin Console at <code>/admin</code>.</li>
      <li>[ ] <strong>Step 2:</strong> Check the <strong>Pending Fulfillment</strong> count on the Dashboard.</li>
      <li>[ ] <strong>Step 3:</strong> Open <em>Orders</em>, print packing slips, and hand them to your packing team.</li>
      <li>[ ] <strong>Step 4:</strong> Check <em>Inventory &gt; Low Stock</em> to see if any spice packs need repacking.</li>
      <li>[ ] <strong>Step 5:</strong> Check <em>Bulk Enquiries</em> and respond to wholesale buyers on WhatsApp (+91 75939 59235).</li>
    </ul>
  </div>

  <div class="callout">
    <div class="callout-title">Daily Afternoon Dispatch Routine:</div>
    <ul>
      <li>[ ] Hand over packed cartons to the courier pickup executive.</li>
      <li>[ ] Open each dispatched order in <em>Orders</em>, enter the Courier Name (e.g. DTDC) & AWB Tracking Number.</li>
      <li>[ ] Click <strong>"Update to SHIPPED"</strong> so your customers receive tracking updates.</li>
    </ul>
  </div>

  <div class="callout callout-gold">
    <div class="callout-title">Weekly Monday Review:</div>
    <ul>
      <li>[ ] Audit physical inventory against recorded quantities in <em>Inventory</em>.</li>
      <li>[ ] Export the weekly orders CSV from <em>Reports</em> for your accountant.</li>
      <li>[ ] Reconcile courier COD remittance settlements against delivered orders.</li>
      <li>[ ] Review customer reviews in <em>Reviews Moderation</em> and approve genuine feedback.</li>
    </ul>
  </div>

  <h2>19. Frequently Asked Questions & Troubleshooting</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th>Question / Incident</th>
        <th>Solution</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>How do I mark an item out of stock immediately?</strong></td>
        <td>Go to <em>Inventory</em>, search the item, click Adjust Stock, select <strong>OVERRIDE</strong>, enter <code>0</code>, and save. The website disables buying immediately.</td>
      </tr>
      <tr>
        <td><strong>Customer says payment succeeded but order is pending?</strong></td>
        <td>Check the payment reference ID in the order drawer. If Razorpay confirmed payment, click the Payment Status dropdown, select <strong>PAID</strong>, and save.</td>
      </tr>
      <tr>
        <td><strong>How to temporarily pause Cash on Delivery (COD)?</strong></td>
        <td>Go to <em>Store Settings</em> &gt; uncheck <strong>"Enable Cash on Delivery"</strong> &gt; click Save. Customers will only see online prepaid options.</td>
      </tr>
      <tr>
        <td><strong>Customer wants to change their shipping address after ordering?</strong></td>
        <td>Open the order in <em>Orders</em>, review the address notes, paste the updated address, and ensure the courier shipping label reflects the new destination before dispatch.</td>
      </tr>
      <tr>
        <td><strong>Forgot Admin Password?</strong></td>
        <td>On the login screen, click <strong>"Forgot password?"</strong>, enter your email, and follow the password reset link sent to your inbox.</td>
      </tr>
    </tbody>
  </table>

  <div class="footer-note">
    ZaDa Foods Client Admin Operations Manual — Confidential & Proprietary — Prepared for Client Handover.
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
  fs.writeFileSync(artifactHtmlPath, html);

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

  fs.copyFileSync(pdfPath, artifactPdfPath);
  console.log(`✓ Generated ${pdfPath} (${fs.statSync(pdfPath).size} bytes)`);

  console.log('\n=============================================');
  console.log('Client Admin Manual PDF Successfully Created!');
  console.log('=============================================\n');
}

run().catch(err => {
  console.error('Failed to generate client admin manual:', err);
  process.exit(1);
});
