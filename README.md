# OMME'S GALLERY — Manager (Vol 3)

Google Sheets = database. Responsive web app + **PWA** (হোম-স্ক্রিনে install হয়, offline-এ shell চলে)।
Modules: **Dashboard · New sale/Invoice · Inventory · Customers · Reports**।

## ফাইলগুলো (GitHub-এ সবগুলো একসাথে রাখতে হবে)
- `index.html` — অ্যাপ
- `Code.gs` — backend (Google Apps Script)
- `manifest.json` — PWA তথ্য (install-এর জন্য)
- `sw.js` — service worker (offline)
- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` — অ্যাপ icon

---

## PART A — Backend বসানো (একবারই, ~১০ মিনিট)
1. নতুন **Google Sheet** খোলো (নাম: `OMME'S GALLERY DB`)।
2. **Extensions ▸ Apps Script** → সব মুছে **`Code.gs`** paste করো।
3. ৪ নম্বর লাইনে পাসওয়ার্ড বদলাও: `const APP_PASSWORD = '...'` → নিজের পাসওয়ার্ড।
4. ফাংশন-লিস্টে **`setup`** বেছে **Run** → permission চাইলে Allow। (৪টা tab তৈরি হবে)
5. **Deploy ▸ New deployment ▸ Web app** → Execute as: **Me**, Who has access: **Anyone** ▸ Deploy ▸ **`/exec` URL copy** করো (গোপন রাখো)।
- কোড বদলালে: Deploy ▸ Manage deployments ▸ pencil ▸ Version: New version ▸ Deploy (URL একই থাকে)।

## PART B — অ্যাপ hosting (ফ্রি, HTTPS দরকার)
> **জরুরি:** PWA install ও offline **শুধু https লিংকে** কাজ করে — `index.html` সরাসরি ফাইল হিসেবে খুললে install হবে না। তাই GitHub Pages-এ (বা Netlify/Vercel) রাখো।
1. github.com → নতুন repository।
2. উপরের **সব ফাইল** upload করো (index.html, Code.gs লাগবে না hosting-এ কিন্তু রাখলে ক্ষতি নেই; manifest, sw.js, সব icon **অবশ্যই**)।
3. **Settings ▸ Pages ▸ Branch: main ▸ Save** → `https://...github.io/...` লিংক পাবে।
4. ওই লিংকই সবাই ব্যবহার করবে।

## PART C — প্রথমবার connect
- অ্যাপ খুললে setup স্ক্রিন → **Web app URL** (`/exec`) + **Password** বসাও → shop name/phone/address → **Save & connect**।
- একবার connect হলে ওই device-এ মনে থাকে।

## PART D — হোম-স্ক্রিনে install (অ্যাপের মতো)
- **Android/Chrome:** setup স্ক্রিনে বা sidebar-এ **“⤓ Install app”** বাটন আসবে → চাপো। (অথবা browser menu ▸ Install app)
- **iPhone/Safari:** **Share ▸ Add to Home Screen**। (setup স্ক্রিনে hint দেখাবে)
- install-এর পর নিজের icon সহ full-screen খুলবে, browser bar থাকবে না। net না থাকলেও অ্যাপ খুলবে (তবে নতুন data সেভ/লোড করতে net লাগবে — বিক্রির হিসাব Google-এ যায়)।

---

## দৈনিক ব্যবহার
- **Inventory** → ＋ Add product (Buy, Sale, Stock)। Stock ≤ 3 = লাল "low"।
- **New sale** → পণ্য খুঁজে ＋ → customer/Walk-in → discount/delivery/payment → **Save & invoice** → Print/PDF। Stock নিজে কমে।
- **Customers** → History দিয়ে কে কত কিনেছে।
- **Dashboard** → আজকের বিক্রি/প্রফিট, মাসিক chart, recent orders, low stock।
- **Reports** → date range/preset বেছে: KPI, this-year vs last-year chart, profit/loss, best-seller, brand ও customer report, CSV export।

**Profit:** `Σ(Qty×(Sale−Buy)) − Discount`। Delivery pass-through।

## পুরনো data (2025/2026)
পরে বললে তোমার CSV আমি Products/Sales/Customers ফরম্যাটে সাজিয়ে দেব (2026 ফাইলে newline সমস্যা আগে clean লাগবে)।

---

## VERSION ROADMAP + STATE  ⟵ resume করার key

**Vol 1 — DONE ✅**  Backend (setup, doPost router, dashboard/products/customers/sales actions, LockService, password) + Frontend 4 module (Dashboard chart+recent+lowstock, POS cart+invoice+print, Inventory CRUD, Customers CRUD+history), localStorage config, responsive। POS search bug fixed।

**Vol 2 — DONE ✅**  PWA যোগ হলো:
- নতুন ফাইল: `manifest.json`, `sw.js`, 4টা icon (logo-স্টাইল: broken ring + OMME'S + GALLERY bar)।
- `index.html`-এ: manifest+apple meta tags, service-worker registration, `beforeinstallprompt` capture + “Install app” বাটন (setup + sidebar), iOS manual-install hint, appinstalled toast।
- offline: app shell + Chart.js cache হয়; API POST কখনো cache হয় না (সবসময় net)।

**Vol 3 — DONE ✅ (current)**  Reports & Analytics:
- Backend: নতুন `report(from,to)` action — date-range filter, summary (sales/profit/orders/items/COGS/margin/avg), best-sellers (product-wise), brand-wise, customer-wise, payment-wise, আর this-year vs last-year monthly (YoY)।
- Frontend: নতুন **Reports** nav + view — date presets (This month / Last month / This year / All time) + custom date range, ৩টা KPI card, YoY grouped bar chart, Profit/Loss statement (subtotal − COGS = gross − discount = net; delivery pass-through memo), best-selling products table, brand performance (+margin), top customers, payment breakdown।
- CSV export: sales (range), best-sellers, brand-performance — Excel/Bangla-safe (UTF-8 BOM)।
- সব হিসাব mock-data দিয়ে verify করা হয়েছে।

**পরের ধাপ:**
- **Vol 4 — Expense + Supplier/Purchase:** expense category, supplier, purchase order, stock inward, due list।
- **Vol 5 — Extras:** barcode/QR scan (camera), product image upload, return/refund, due/credit, full Settings।
- **পরে (external খরচ):** SMS/WhatsApp notification।

> **Resume করতে:** শেষ Vol-এর `index.html` + `Code.gs` + (Vol 2+ থেকে) `manifest.json`, `sw.js`, iconগুলো + এই STATE অংশ paste করলেই আমি পরের Vol থেকে শুরু করব।

---

## Tech summary
Frontend vanilla HTML/CSS/JS + Chart.js (CDN)। Backend Apps Script web app (POST `text/plain`, CORS preflight এড়াতে)। DB Google Sheets। PWA: manifest + cache-first service worker (API bypass)। Auth: shared password + secret URL।
