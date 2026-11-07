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

function buildHtml() {
  const emblemPath = path.join(ROOT_DIR, 'public', 'assets', 'brand-emblem.png');
  const imgEmblem = fs.existsSync(emblemPath)
    ? `data:image/png;base64,${fs.readFileSync(emblemPath).toString('base64')}`
    : '';
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
  <title>ZaDa Foods — The Ultra-Simple Admin Manual</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 10mm 14mm 10mm;
      @bottom-right {
        content: "Page " counter(page);
        font-size: 8pt;
        color: #7A7265;
        font-family: sans-serif;
      }
      @bottom-left {
        content: "ZaDa Foods Admin Guide • Plain English Edition";
        font-size: 8pt;
        color: #7A7265;
        font-family: sans-serif;
      }
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #FAF7F2;
      color: #1F2937;
      margin: 0;
      padding: 0;
      line-height: 1.48;
      font-size: 8.8pt;
    }
    h1, h2, h3, h4 {
      color: #072C20;
      font-family: Georgia, serif;
      margin-top: 0;
    }
    h1 { font-size: 21pt; line-height: 1.2; margin-bottom: 6pt; }
    h2 {
      font-size: 13pt;
      border-bottom: 2px solid #D1C7B7;
      padding-bottom: 3pt;
      margin-top: 14pt;
      margin-bottom: 8pt;
      color: #072C20;
      page-break-after: avoid;
    }
    h3 {
      font-size: 10.5pt;
      color: #A67732;
      margin-top: 8pt;
      margin-bottom: 3pt;
      page-break-after: avoid;
    }
    p { margin: 0 0 6pt 0; }
    ul, ol { margin: 0 0 8pt 0; padding-left: 18pt; }
    li { margin-bottom: 3pt; }
    .page-break { page-break-before: always; }
    .avoid-break { page-break-inside: avoid; }

    /* Cover Page */
    .cover {
      min-height: 980px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(180deg, #FAF7F2 0%, #F4EFE6 100%);
      border: 5px double #072C20;
      padding: 40px 25px;
      margin: 8px;
    }
    .cover-pill {
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
      margin-bottom: 4px;
      font-family: Georgia, serif;
    }
    .cover-tagline {
      font-size: 13pt;
      font-style: italic;
      color: #A67732;
      margin-bottom: 20px;
    }
    .cover-divider {
      width: 90px;
      height: 3px;
      background-color: #A67732;
      margin: 15px auto;
    }
    .cover-title {
      font-size: 22pt;
      color: #072C20;
      font-weight: bold;
      margin-top: 15px;
      margin-bottom: 10px;
    }
    .cover-subtitle {
      font-size: 11pt;
      color: #4B5563;
      max-width: 540px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .cover-box {
      margin-top: 30px;
      padding: 16px 20px;
      background: white;
      border: 1px solid #D1C7B7;
      border-radius: 8px;
      font-size: 8.5pt;
      color: #374151;
      text-align: left;
      width: 440px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.04);
    }
    .cover-box table { width: 100%; border-collapse: collapse; }
    .cover-box td { padding: 4px 6px; }
    .cover-box td.bold { font-weight: bold; color: #072C20; width: 140px; }

    /* Screenshot Display */
    .screen-card {
      margin: 8pt 0 10pt 0;
      border: 1px solid #D1C7B7;
      border-radius: 6px;
      overflow: hidden;
      background: #FFFFFF;
      box-shadow: 0 2px 4px rgba(0,0,0,0.06);
      page-break-inside: avoid;
    }
    .screen-img {
      width: 100%;
      height: auto;
      display: block;
      max-height: 330px;
      object-fit: contain;
      background: #FDFBF7;
    }
    .screen-caption {
      background: #F4EFE6;
      border-top: 1px solid #E5DECF;
      padding: 5px 12px;
      font-size: 7.5pt;
      color: #5C5245;
      font-style: italic;
    }

    /* Cards & Callouts */
    .simple-words {
      background: #FDFBF7;
      border: 1px solid #E5DECF;
      border-left: 4px solid #A67732;
      border-radius: 0 6px 6px 0;
      padding: 8pt 12pt;
      margin: 6pt 0 10pt 0;
      font-size: 8.5pt;
    }
    .simple-words strong { color: #A67732; text-transform: uppercase; font-size: 8pt; letter-spacing: 0.5px; }

    .step-card {
      display: flex;
      gap: 10px;
      margin-bottom: 6pt;
      background: white;
      padding: 8pt 10pt;
      border: 1px solid #E5DECF;
      border-radius: 6px;
      page-break-inside: avoid;
    }
    .step-badge {
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
      margin-top: 1px;
    }
    .step-text { flex-grow: 1; }
    .step-text strong { color: #072C20; font-size: 8.8pt; display: block; margin-bottom: 2pt; }
    .step-text p { margin: 0; font-size: 8pt; color: #4B5563; }

    .callout-box {
      padding: 7pt 10pt;
      border-radius: 6px;
      margin: 6pt 0;
      font-size: 8pt;
      page-break-inside: avoid;
    }
    .callout-pro { background: #ECFDF5; border-left: 3px solid #059669; color: #065F46; }
    .callout-warn { background: #FEF2F2; border-left: 3px solid #DC2626; color: #991B1B; }
    .callout-example { background: #EFF6FF; border-left: 3px solid #2563EB; color: #1E40AF; }

    .pill {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 7pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    .pill-green { background: #059669; color: white; }
    .pill-gold { background: #A67732; color: white; }
    .pill-red { background: #DC2626; color: white; }
    .pill-dark { background: #072C20; color: white; }

    table.simple-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6pt 0 10pt 0;
      font-size: 7.8pt;
      background: white;
      border: 1px solid #D1C7B7;
      page-break-inside: avoid;
    }
    table.simple-table th {
      background: #072C20;
      color: white;
      padding: 5px 8px;
      text-align: left;
      font-weight: 600;
    }
    table.simple-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #EFE9DE;
      color: #374151;
      vertical-align: top;
    }
    table.simple-table tr:nth-child(even) td { background: #FAF7F2; }

    .toc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 18px;
      background: white;
      padding: 16px 20px;
      border: 1px solid #E5DECF;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .toc-row {
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      border-bottom: 1px dashed #E5DECF;
      padding-bottom: 2px;
    }
    .toc-idx { color: #A67732; font-weight: bold; width: 22px; }
    .toc-txt { flex-grow: 1; color: #374151; font-weight: 500; }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover">
    <div class="cover-pill">CLIENT HANDOVER & LEARNING GUIDE</div>
    ${imgEmblem ? `<img src="${imgEmblem}" style="width: 90px; height: 90px; object-fit: contain; margin-bottom: 14px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.18));" alt="ZaDa Foods Emblem" />` : ''}
    <div class="cover-brand">ZaDa FOODS</div>
    <div class="cover-tagline">"Authentic Kerala Flavours, Rooted in Tradition"</div>
    <div class="cover-divider"></div>
    <div class="cover-title">THE ULTIMATE ADMIN MANUAL</div>
    <div class="cover-subtitle">
      A 100% simple, visual, step-by-step handbook to help you run your online store. 
      Learn everything—adding products, packing orders, updating stock, creating coupons, and editing banners—in a single easy read!
    </div>

    <div class="cover-box">
      <table>
        <tr><td class="bold">Store Brand:</td><td>ZaDa Foods</td></tr>
        <tr><td class="bold">Admin Website:</td><td>yourdomain.com/admin (or /login)</td></tr>
        <tr><td class="bold">Official WhatsApp:</td><td>+91 75939 59235</td></tr>
        <tr><td class="bold">Official Email:</td><td>Zadafoods4@gmail.com</td></tr>
        <tr><td class="bold">FSSAI License:</td><td>21326145000345</td></tr>
        <tr><td class="bold">Who This Is For:</td><td>Store Owners, Managers, Family & Warehouse Staff</td></tr>
      </table>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- TABLE OF CONTENTS -->
  <h2>TABLE OF CONTENTS</h2>
  <div class="toc-grid">
    <div class="toc-row"><span class="toc-idx">01</span><span class="toc-txt">How to Login & Meet Your Admin Screen</span></div>
    <div class="toc-row"><span class="toc-idx">02</span><span class="toc-txt">The Dashboard (What Every Box & Number Means)</span></div>
    <div class="toc-row"><span class="toc-idx">03</span><span class="toc-txt">Products (How to Add a New Spice or Snack)</span></div>
    <div class="toc-row"><span class="toc-idx">04</span><span class="toc-txt">Weight Variants (Selling 100g, 250g, 500g, 1kg)</span></div>
    <div class="toc-row"><span class="toc-idx">05</span><span class="toc-txt">Subcategories (How Items Are Organized)</span></div>
    <div class="toc-row"><span class="toc-idx">06</span><span class="toc-txt">Inventory (How to Change Stock in 3 Clicks)</span></div>
    <div class="toc-row"><span class="toc-idx">07</span><span class="toc-txt">Orders (From Customer Click to Courier Box)</span></div>
    <div class="toc-row"><span class="toc-idx">08</span><span class="toc-txt">How to Dispatch & Put Courier Tracking (AWB)</span></div>
    <div class="toc-row"><span class="toc-idx">09</span><span class="toc-txt">Printing Invoices & Packaging Slips</span></div>
    <div class="toc-row"><span class="toc-idx">10</span><span class="toc-txt">Customer Directory (See Who Bought What)</span></div>
    <div class="toc-row"><span class="toc-idx">11</span><span class="toc-txt">Coupons (How to Make a Discount Code)</span></div>
    <div class="toc-row"><span class="toc-idx">12</span><span class="toc-txt">Combo Packs (Selling 3 Spices in a Gift Box)</span></div>
    <div class="toc-row"><span class="toc-idx">13</span><span class="toc-txt">Homepage CMS (Change Banners Without Code)</span></div>
    <div class="toc-row"><span class="toc-idx">14</span><span class="toc-txt">Festival Themes (Turn on Onam/Diwali with 1 Click)</span></div>
    <div class="toc-row"><span class="toc-idx">15</span><span class="toc-txt">Customer Reviews (Approve Good Ones, Block Spam)</span></div>
    <div class="toc-row"><span class="toc-idx">16</span><span class="toc-txt">Bulk Orders (Wholesale & Wedding Inquiries)</span></div>
    <div class="toc-row"><span class="toc-idx">17</span><span class="toc-txt">Reports & CSV (Give This to Your Accountant)</span></div>
    <div class="toc-row"><span class="toc-idx">18</span><span class="toc-txt">Staff Accounts (Give Access to Workers Safely)</span></div>
    <div class="toc-row"><span class="toc-idx">19</span><span class="toc-txt">Store Settings (Delivery Fees & WhatsApp Number)</span></div>
    <div class="toc-row"><span class="toc-idx">20</span><span class="toc-txt">Your Daily 10-Minute Routine & Emergency FAQs</span></div>
  </div>

  <!-- LESSON 1 -->
  <h2>01. How to Login & Meet Your Admin Screen</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    Think of the Admin Panel as the private back-office of your shop. Customers only see the front shelves, but you sit in the back office to count the money, add new items, and pack deliveries.
  </div>

  <div class="screen-card">
    <img src="${imgLogin}" class="screen-img" alt="Login Screen" />
    <div class="screen-caption">Figure 1.1: The Login Screen. Type your email and password here.</div>
  </div>

  <div class="step-card">
    <div class="step-badge">1</div>
    <div class="step-text">
      <strong>Go to the Website</strong>
      <p>Open your browser (on phone or laptop) and type: <code>yourdomain.com/login</code> (or <code>/admin</code>).</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">2</div>
    <div class="step-text">
      <strong>Type Your Admin Email & Password</strong>
      <p>Type your store email (e.g. <code>admin@zadafoods.com</code>) and your password. Then click the green button that says <strong>"Sign In"</strong>.</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">3</div>
    <div class="step-text">
      <strong>You're In!</strong>
      <p>The screen immediately opens your private <strong>Operations Console</strong>. Look on the left side: that dark green bar is your <strong>Menu</strong> where you can jump to Products, Orders, Inventory, and Settings with a single tap.</p>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- LESSON 2 -->
  <h2>02. The Dashboard (What Every Box & Number Means)</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    The Dashboard is like the dashboard of your car. It tells you your speed, how much fuel you have, and if any red warning lights are blinking.
  </div>

  <div class="screen-card">
    <img src="${imgDash}" class="screen-img" alt="Operations Dashboard" />
    <div class="screen-caption">Figure 2.1: The Dashboard screen. Everything important in one glance!</div>
  </div>

  <table class="simple-table">
    <thead>
      <tr>
        <th>What You See</th>
        <th>What It Really Means</th>
        <th>What You Should Do</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Gross Revenue (₹)</strong></td>
        <td>Total money your shop made from all successful orders.</td>
        <td>Smile! Your store is growing.</td>
      </tr>
      <tr>
        <td><strong>Total Orders</strong></td>
        <td>How many times a customer bought something.</td>
        <td>Watch this number go up every week.</td>
      </tr>
      <tr>
        <td><strong>Pending Fulfillment (<span class="pill pill-gold">ACTION NEEDED</span>)</strong></td>
        <td>Orders waiting to be packed into boxes and sent to customers!</td>
        <td><strong>Click this immediately!</strong> Pack those boxes and give them to the courier.</td>
      </tr>
      <tr>
        <td><strong>Low Stock Warning (<span class="pill pill-red">LOOK HERE</span>)</strong></td>
        <td>Items with fewer than 10 packets left in your storage.</td>
        <td>Make or pack a fresh batch before the item runs out.</td>
      </tr>
    </tbody>
  </table>

  <div class="callout-box callout-pro">
    💡 <strong>Pro-Tip:</strong> Check the Dashboard every morning at 9:00 AM. If you see a number next to <em>"Fulfill Orders"</em>, that means real customers are waiting for their spices!
  </div>

  <div class="page-break"></div>

  <!-- LESSON 3 & 4 -->
  <h2>03. Products (How to Add a New Spice or Snack)</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    This is where you tell the website what you want to sell. Whenever you make a new batch of cardamom, black pepper, or banana chips, you put it here so customers can buy it.
  </div>

  <div class="screen-card">
    <img src="${imgProd}" class="screen-img" alt="Products Catalogue" />
    <div class="screen-caption">Figure 3.1: Products Catalogue. All your products in a neat, organized list.</div>
  </div>

  <h3>How to Add a Product in 5 Simple Steps:</h3>
  <div class="step-card">
    <div class="step-badge">1</div>
    <div class="step-text">
      <strong>Click the "+ Add Product" Button</strong>
      <p>Look at the top-right corner. Tap the gold/green button that says <strong>"+ Add Product"</strong>. A window pops open.</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">2</div>
    <div class="step-text">
      <strong>Type the Product Name & Description</strong>
      <p>Name: e.g. <em>"Wayanad Black Pepper (Whole Bold)"</em>.<br />
      Description: e.g. <em>"Freshly hand-harvested black pepper from the misty hills of Wayanad. Sun-dried with intense aroma and authentic heat."</em></p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">3</div>
    <div class="step-text">
      <strong>Pick the Category</strong>
      <p>Choose <strong>Spices & Blends</strong> or <strong>Authentic Kerala Snacks</strong> from the dropdown.</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">4</div>
    <div class="step-text">
      <strong>Set Pack Sizes (Weight Variants) & Prices</strong>
      <p>Click <strong>"+ Add Variant"</strong> to set sizes:
      <br />• <strong>Weight:</strong> Type <code>250g</code> (or <code>500g</code>, <code>1kg</code>)
      <br />• <strong>Selling Price:</strong> What customer pays (e.g. <code>₹280</code>)
      <br />• <strong>MRP (Crossed Out):</strong> Normal price (e.g. <code>₹320</code>). The website automatically calculates a discount tag!
      <br />• <strong>Stock:</strong> How many packets you have ready (e.g. <code>50</code>)</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">5</div>
    <div class="step-text">
      <strong>Click "Save Product"</strong>
      <p>Tap the big green <strong>"Save"</strong> button. That's it! Open your website on your phone, and your new product is live for anyone in India to buy!</p>
    </div>
  </div>

  <div class="callout-box callout-warn">
    ⚠️ <strong>What NOT to do:</strong> Never delete a product if you just ran out of stock. Instead, just set stock to <code>0</code>! That way you don't lose customer reviews or product photos.
  </div>

  <div class="page-break"></div>

  <!-- LESSON 5 & 6 -->
  <h2>04. Subcategories (How Items Are Organized)</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    Think of a grocery store. Spices are in one aisle, snacks are in another. Subcategories are the shelves inside that aisle so customers don't get lost.
  </div>

  <div class="screen-card">
    <img src="${imgSubcat}" class="screen-img" alt="Subcategories Screen" />
    <div class="screen-caption">Figure 4.1: Managing your shelves: Whole Spices, Ground Spices, Traditional Masalas.</div>
  </div>

  <p>ZaDa Foods has 3 main parent categories:</p>
  <ul>
    <li><strong>Spices & Blends:</strong> Has subcategories for <em>Whole Spices</em> (Pepper, Cardamom, Cloves), <em>Ground Spices</em> (Turmeric, Chilli), and <em>Traditional Masalas</em> (Fish Curry Podi, Sambar Powder).</li>
    <li><strong>Traditional Ingredients & Essentials:</strong> Pure Cold-Pressed Coconut Oil, Malabar Kudampuli (Tamarind), Seasoning salts.</li>
    <li><strong>Authentic Kerala Snacks:</strong> Nendran Banana Chips, Spicy Banana Chips, Sharkara Upperi (Jaggery chips).</li>
  </ul>

  <h2>05. Inventory & Stock (How to Change Stock in 3 Clicks)</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    When you pack a new batch of 30 packets, you come here and add 30. When customers buy online, the website automatically subtracts them. You never have to do math in your head!
  </div>

  <div class="screen-card">
    <img src="${imgInv}" class="screen-img" alt="Inventory Screen" />
    <div class="screen-caption">Figure 5.1: The Inventory screen. Look at the color badges: Green, Yellow, Red.</div>
  </div>

  <table class="simple-table">
    <thead>
      <tr>
        <th>Badge Color</th>
        <th>Stock Level</th>
        <th>What the Customer Sees Online</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="pill pill-green">In Stock</span></td>
        <td>11 or more packets</td>
        <td>Green badge: <em>"In Stock — Fresh Batch Ready"</em>. Customer can order freely.</td>
      </tr>
      <tr>
        <td><span class="pill pill-gold">Low Stock</span></td>
        <td>1 to 10 packets</td>
        <td>Yellow urgency badge: <em>"Only X left in stock!"</em> Prompts customer to buy fast.</td>
      </tr>
      <tr>
        <td><span class="pill pill-red">Out of Stock</span></td>
        <td>0 packets</td>
        <td>Button changes to <em>"Out of Stock"</em> (disabled). Protects you from taking orders you don't have!</td>
      </tr>
    </tbody>
  </table>

  <h3>How to Update Stock When a New Batch Arrives:</h3>
  <div class="step-card">
    <div class="step-badge">1</div>
    <div class="step-text">
      <strong>Find the Item</strong>
      <p>Type the product name in the search bar on the Inventory page.</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">2</div>
    <div class="step-text">
      <strong>Click "Adjust Stock"</strong>
      <p>Select <strong>ADD</strong>. Type the number of packets you just made (e.g. <code>25</code>).</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">3</div>
    <div class="step-text">
      <strong>Click "Save"</strong>
      <p>Done! The website immediately updates the stock count.</p>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- LESSON 7 & 8 -->
  <h2>06. Orders (From Customer Click to Courier Box)</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    When a customer buys on your website, a new order appears here immediately. This screen tells you their name, phone number, address, and what spices they ordered.
  </div>

  <div class="screen-card">
    <img src="${imgOrd}" class="screen-img" alt="Orders Screen" />
    <div class="screen-caption">Figure 6.1: The Orders list. Click on any row to open the customer's order.</div>
  </div>

  <h3>The 5 Steps of an Order's Life:</h3>
  <ol>
    <li><span class="pill pill-dark">PENDING</span>: Order just arrived. You check that payment is verified.</li>
    <li><span class="pill pill-gold">CONFIRMED</span>: Payment is confirmed! Send the order details to your packing team.</li>
    <li><span class="pill pill-gold">PACKED</span>: Spices are weighed, air-tight sealed, and packed in a clean corrugated cardboard box.</li>
    <li><span class="pill pill-dark">SHIPPED</span>: You gave the box to DTDC / Delhivery / India Post. You put the tracking number here.</li>
    <li><span class="pill pill-green">DELIVERED</span>: The courier handed the box to the customer. All done!</li>
  </ol>

  <h2>07. How to Dispatch & Put Courier Tracking (AWB)</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    Customers love tracking their parcel. When you hand the parcel to DTDC, they give you a receipt with a number (like <code>DT123456789IN</code>). Put that number here, and the customer can track their box live on their phone!
  </div>

  <div class="step-card">
    <div class="step-badge">1</div>
    <div class="step-text">
      <strong>Click the Order in the List</strong>
      <p>Tap on the order row. The details panel slides out from the right.</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">2</div>
    <div class="step-text">
      <strong>Select Your Courier</strong>
      <p>Pick from the dropdown: <em>DTDC Express, Delhivery, India Post, or Blue Dart</em>.</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">3</div>
    <div class="step-text">
      <strong>Paste the Tracking Number (AWB)</strong>
      <p>Type or paste the tracking code from your courier receipt.</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">4</div>
    <div class="step-text">
      <strong>Change Status to "SHIPPED" and Click Save</strong>
      <p>The system automatically updates the customer's tracking screen!</p>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- LESSON 9 & 10 -->
  <h2>08. Printing Invoices & Packaging Slips</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    Every parcel needs a bill inside. With one click, your computer prepares a beautiful, professional A4 invoice with your FSSAI number (21326145000345) and store address.
  </div>

  <div class="step-card">
    <div class="step-badge">1</div>
    <div class="step-text">
      <strong>Click the "Print Bill" Button on the Order</strong>
      <p>Look for the button with the printer icon. Click it.</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">2</div>
    <div class="step-text">
      <strong>Print or Save as PDF</strong>
      <p>Your browser print window opens. Click <strong>Print</strong>. Put this bill inside the parcel, and stick the shipping address on the outside of the box!</p>
    </div>
  </div>

  <h2>09. Customer Directory (See Who Bought What)</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    This is your digital customer phonebook. It keeps track of all your repeat buyers, their total spend, and delivery addresses.
  </div>

  <div class="screen-card">
    <img src="${imgCust}" class="screen-img" alt="Customers Directory" />
    <div class="screen-caption">Figure 9.1: The Customers Directory. Find any customer in seconds.</div>
  </div>

  <p>If a customer calls you saying: <em>"Hi, I ordered black pepper last month, I want the same one again!"</em> — just type their name or mobile number in this search bar. You will immediately see their past orders and favorite items!</p>

  <div class="page-break"></div>

  <!-- LESSON 11 & 12 -->
  <h2>10. Coupons (How to Make a Discount Code)</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    Want to run a festival sale? Create a coupon code like <code>DIWALI10</code> or <code>FREESHIP</code> in 4 clicks.
  </div>

  <div class="screen-card">
    <img src="${imgCoup}" class="screen-img" alt="Coupons Management" />
    <div class="screen-caption">Figure 10.1: Coupons and discount rules table.</div>
  </div>

  <h3>How to Create a New Coupon:</h3>
  <div class="step-card">
    <div class="step-badge">1</div>
    <div class="step-text">
      <strong>Click "+ Create Coupon"</strong>
      <p>Located at the top right of the Coupons page.</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">2</div>
    <div class="step-text">
      <strong>Choose Your Code Name</strong>
      <p>Type in CAPITAL LETTERS without spaces, e.g. <code>FESTIVE15</code> or <code>KERALA50</code>.</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">3</div>
    <div class="step-text">
      <strong>Pick the Discount Type</strong>
      <p>• <strong>Percentage (%):</strong> e.g. <code>15</code> (gives 15% off).<br />
      • <strong>Flat (₹):</strong> e.g. <code>50</code> (gives ₹50 off the bill).</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">4</div>
    <div class="step-text">
      <strong>Set Minimum Cart Value</strong>
      <p>Type <code>499</code> so the customer must buy at least ₹499 worth of spices to use the discount!</p>
    </div>
  </div>

  <h2>11. Combo Packs (Selling 3 Spices in a Gift Box)</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    Instead of selling 1 spice at ₹180, bundle Cardamom + Black Pepper + Turmeric in a "Kerala Culinary Spice Box" for ₹650. Customers love gift boxes, and your sales jump higher!
  </div>

  <div class="screen-card">
    <img src="${imgComb}" class="screen-img" alt="Combo Builder" />
    <div class="screen-caption">Figure 11.1: The Combo Builder screen for making multi-pack bundles.</div>
  </div>

  <div class="page-break"></div>

  <!-- LESSON 13 & 14 -->
  <h2>12. Homepage CMS (Change Banners Without Code)</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    You don't need a software programmer to change the pictures or headings on the website. You can do it all right here with a simple click!
  </div>

  <div class="screen-card">
    <img src="${imgCms}" class="screen-img" alt="Homepage CMS" />
    <div class="screen-caption">Figure 12.1: Homepage CMS. Change hero banner slides, titles, and buttons.</div>
  </div>

  <div class="step-card">
    <div class="step-badge">1</div>
    <div class="step-text">
      <strong>Click "Hero Banners"</strong>
      <p>You will see the active slides running on your homepage.</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">2</div>
    <div class="step-text">
      <strong>Click "Edit" on Any Banner</strong>
      <p>Change the main headline (e.g. <em>"Authentic Wayanad Hill Spices"</em>) and change the button link to <code>/shop</code>.</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">3</div>
    <div class="step-text">
      <strong>Click Save</strong>
      <p>The homepage updates instantly. No computer reboot or code change required!</p>
    </div>
  </div>

  <h2>13. Festival Themes (Turn on Onam/Diwali with 1 Click)</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    During Onam, Vishu, or Diwali, you can dress up your website with festive gold ribbons, celebration greetings, and festival offers in 5 seconds.
  </div>

  <div class="screen-card">
    <img src="${imgFest}" class="screen-img" alt="Festival Themes" />
    <div class="screen-caption">Figure 13.1: 1-Click Festival Themes: Onam, Vishu, Diwali, Christmas.</div>
  </div>

  <p>To turn on a festival: Click <strong>"Activate Theme"</strong> next to Onam or Diwali. When the holiday finishes, click <strong>"Deactivate"</strong> to go back to the standard green and ivory theme!</p>

  <div class="page-break"></div>

  <!-- LESSON 15 & 16 -->
  <h2>14. Customer Reviews (Approve Good Ones, Block Spam)</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    When customers write reviews on your spices, they wait here first. You read them, approve the genuine ones, and block any inappropriate or spam messages before the public sees them.
  </div>

  <div class="screen-card">
    <img src="${imgRev}" class="screen-img" alt="Reviews Moderation" />
    <div class="screen-caption">Figure 14.1: Review Moderation Queue. Click green checkmark to approve!</div>
  </div>

  <h2>15. Bulk Orders (Wholesale & Wedding Inquiries)</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    When a restaurant, caterer, or wedding planner wants 50 kg of spices, they fill the Bulk Order form. Their message lands here with their phone number so you can call them directly!
  </div>

  <div class="screen-card">
    <img src="${imgEnq}" class="screen-img" alt="Bulk Enquiries" />
    <div class="screen-caption">Figure 15.1: Bulk wholesale enquiries inbox.</div>
  </div>

  <div class="callout-box callout-example">
    📞 <strong>Action:</strong> When a bulk lead comes in, click their phone number to call them or tap WhatsApp (+91 75939 59235) to send a wholesale quote.
  </div>

  <div class="page-break"></div>

  <!-- LESSON 17 & 18 -->
  <h2>16. Reports & CSV (Give This to Your Accountant)</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    At the end of every month, your accountant or tax advisor needs your sales figures for GST filing. Instead of typing everything manually, click one button here and download an Excel spreadsheet!
  </div>

  <div class="screen-card">
    <img src="${imgRep}" class="screen-img" alt="Reports & CSV Export" />
    <div class="screen-caption">Figure 16.1: Monthly revenue graphs and the green "Export Orders CSV" button.</div>
  </div>

  <h2>17. Staff Accounts (Give Access to Workers Safely)</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    Never share your master Super Admin password with anyone. Instead, create a separate login for your warehouse staff so they can only see orders and packaging, without seeing bank settings!
  </div>

  <div class="screen-card">
    <img src="${imgMgmt}" class="screen-img" alt="Staff Management" />
    <div class="screen-caption">Figure 17.1: Staff Administration and role permissions.</div>
  </div>

  <table class="simple-table">
    <thead>
      <tr>
        <th>Role</th>
        <th>What This Person Can Do</th>
        <th>Who Should Have It</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="pill pill-dark">Super Admin</span></td>
        <td>Everything! Can change bank keys, add/remove staff, delete items.</td>
        <td>Store Owner / Primary Director only</td>
      </tr>
      <tr>
        <td><span class="pill pill-gold">Operations Admin</span></td>
        <td>Can see orders, pack items, enter tracking AWBs, adjust stock.</td>
        <td>Warehouse Manager / Packaging Staff</td>
      </tr>
      <tr>
        <td><span class="pill pill-green">Marketing Admin</span></td>
        <td>Can create coupons, edit banners, activate festival themes.</td>
        <td>Social Media / Marketing Executive</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- LESSON 19 & 20 -->
  <h2>18. Store Settings (Delivery Fees & WhatsApp Number)</h2>
  <div class="simple-words">
    <strong>IN SIMPLE WORDS:</strong>
    This is where your store rules live: Free delivery threshold, standard shipping charge, and your official WhatsApp customer support number.
  </div>

  <div class="screen-card">
    <img src="${imgSet}" class="screen-img" alt="Store Settings" />
    <div class="screen-caption">Figure 18.1: Store and payment settings console.</div>
  </div>

  <div class="callout-box callout-pro">
    📌 <strong>Your Store's Official Rules:</strong>
    <ul>
      <li><strong>Free Shipping:</strong> Automatically given on orders above <strong>₹499</strong>.</li>
      <li><strong>Standard Delivery Fee:</strong> <strong>₹40</strong> on orders below ₹499.</li>
      <li><strong>Official WhatsApp Number:</strong> <code>+91 75939 59235</code> (All customer help messages go here).</li>
      <li><strong>Official Support Email:</strong> <code>Zadafoods4@gmail.com</code></li>
      <li><strong>Official FSSAI License:</strong> <code>21326145000345</code></li>
      <li><strong>Official Manufacturer Address:</strong> ZADA FOODS, Punalur, Kollam (Dist), Kerala – 691305.</li>
    </ul>
  </div>

  <h2>19. Your Daily 10-Minute Routine (Cheatsheet)</h2>
  <div class="step-card">
    <div class="step-badge">1</div>
    <div class="step-text">
      <strong>09:00 AM — Morning Check (3 Minutes)</strong>
      <p>Log in at <code>/admin</code>. Click <strong>Orders</strong>. Look for orders marked <em>CONFIRMED</em>. Click <strong>Print Bill</strong> for each one and give them to your packing team.</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">2</div>
    <div class="step-text">
      <strong>11:00 AM — Stock Check (2 Minutes)</strong>
      <p>Click <strong>Inventory</strong>. If any item is in Yellow or Red, schedule a fresh packaging batch.</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-badge">3</div>
    <div class="step-text">
      <strong>04:00 PM — Courier Dispatch (5 Minutes)</strong>
      <p>When the courier pickup arrives, open each order, type the AWB tracking code, and set status to <strong>SHIPPED</strong>. Done for the day!</p>
    </div>
  </div>

  <h2>20. Emergency FAQ ("What do I do if...?")</h2>
  <table class="simple-table">
    <thead>
      <tr>
        <th>Problem</th>
        <th>Simple 10-Second Solution</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>I ran out of an item today physically!</strong></td>
        <td>Go to <em>Inventory</em> &gt; Adjust Stock &gt; Select <strong>OVERRIDE</strong> &gt; Enter <code>0</code> &gt; Save. Website stops selling it immediately.</td>
      </tr>
      <tr>
        <td><strong>Customer says they paid online, but order says Pending?</strong></td>
        <td>Open the order. If Razorpay says payment captured, change Payment Status dropdown to <strong>PAID</strong> and click Save.</td>
      </tr>
      <tr>
        <td><strong>I forgot my admin password!</strong></td>
        <td>On the login screen, click <em>"Forgot password?"</em>. Type your email and check your inbox for the reset link.</td>
      </tr>
      <tr>
        <td><strong>Customer gave wrong address and wants to change it?</strong></td>
        <td>Open their order. Read the new address from their WhatsApp message. Write the new address on the courier shipping label!</td>
      </tr>
    </tbody>
  </table>

  <div style="text-align: center; font-size: 7.5pt; color: #7A7265; margin-top: 15pt; border-top: 1px solid #E5DECF; padding-top: 6pt;">
    ZaDa Foods — The Ultra-Simple Client Admin Manual • Confidential • For Store Staff Use Only.
  </div>

</body>
</html>`;
}

async function run() {
  console.log('Generating ZaDa_Foods_Ultimate_Admin_Guide.html...');
  const html = buildHtml();
  const htmlPath = path.join(ROOT_DIR, 'ZaDa_Foods_Ultimate_Admin_Guide.html');
  const artifactHtmlPath = path.join(ARTIFACT_DIR, 'ZaDa_Foods_Ultimate_Admin_Guide.html');
  fs.writeFileSync(htmlPath, html);
  fs.writeFileSync(artifactHtmlPath, html);

  console.log('Printing ZaDa_Foods_Ultimate_Admin_Guide.pdf via Headless Chrome...');
  const pdfPath = path.join(ROOT_DIR, 'ZaDa_Foods_Ultimate_Admin_Guide.pdf');
  const artifactPdfPath = path.join(ARTIFACT_DIR, 'ZaDa_Foods_Ultimate_Admin_Guide.pdf');

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
  console.log('Ultimate Ultra-Simple Admin Manual PDF Created!');
  console.log('=============================================\n');
}

run().catch(err => {
  console.error('Failed to generate ultimate admin manual:', err);
  process.exit(1);
});
