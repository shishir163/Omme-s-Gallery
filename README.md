# OMME'S GALLERY — Manager (Vol 8 · Firebase login + sync)

**Vol 7 = same app, now online.** Login with email + password (only the accounts you allow), and one shared database in Firebase, so a sale made on the laptop shows on the phone straight away. It still works offline: changes wait on the device and are sent when the internet is back.

## Files (all go in the GitHub repo together)
- `index.html` — the app
- `firebase-config.js` — your Firebase project settings (**fill this in once**)
- `firestore.rules` — who may read/write (paste into the Firebase console, not used by GitHub)
- `manifest.json`, `sw.js`, 4 icons — PWA
- `Code.gs` — old Google Sheets backend, not used any more

## One-time Firebase setup
1. console.firebase.google.com > **Add project** (name e.g. `ommes-gallery`, Google Analytics off).
2. **Authentication** > Get started > turn on **Email/Password**. Under **Users** add the admin and the other 2-3 accounts (email + password).
3. **Firestore Database** > Create database > production mode > location `asia-southeast1` (Singapore).
4. **Project settings** (gear) > Your apps > Web `</>` > register the app > copy the `firebaseConfig` values into `firebase-config.js`.
5. **Authentication** > Settings > **Authorized domains** > add `shishir163.github.io`.
6. **Firestore Database** > **Rules**: paste `firestore.rules` after replacing the 3 example emails with the real (lowercase) ones > **Publish**.
7. Upload `index.html`, `sw.js`, `firebase-config.js` (and the other files) to the GitHub repo, wait a minute, then open the live link and hard refresh (Cmd+Shift+R).

## First sign-in
- Sign in on the **same browser and same link** where the old data was entered. The app finds that old data and offers to upload it to Firebase (also under Settings > Old local data). Your local copy is not deleted.
- Do **not** clear this browser's data until you have checked the data shows on another device. Export a backup first (Settings > Export backup).

## Adding or removing a person
Add/delete the login under Authentication > Users, then edit the email list in the Firestore Rules and Publish. Admin = the owner of the Firebase project (you).

## How sync works (short)
- One Firestore collection per table (Products, Sales, SaleItems, ...), plus `meta/counters` (shared invoice / PO / return numbers) and `meta/shop` (shop info).
- Stock and FIFO lot quantities are saved as increments, so two devices selling at once never overwrite each other.
- Invoice numbers come from the shared counter. If a sale is made offline the number is taken on that device and the counter is bumped when it syncs (very rarely two offline devices could pick the same number).
- Free Firebase (Spark) plan is enough for a small shop: no image uploads in this app, so no Storage needed.

---

## Older notes (Vol 6 and before)
**এই সংস্করণে ডেটা তোমার ব্রাউজারেই (এই কম্পিউটারে) জমা থাকে — Google Sheets বা ইন্টারনেট লাগে না।** খুললেই সরাসরি অ্যাপ, কোনো URL/password নেই। তাৎক্ষণিক গতি।

Modules: **Dashboard · Sale/Invoice · Inventory · Customers · Reports · Purchases · Expenses · Returns · Settings**।

## ⚠️ সবচেয়ে জরুরি — Backup
ডেটা শুধু এই ব্রাউজারে (IndexedDB) থাকে। কম্পিউটার নষ্ট হলে বা ব্রাউজারের data মুছে গেলে সব হারাবে।
- **Settings ▸ Export backup** — সপ্তাহে অন্তত একবার চেপে ফাইলটা Google Drive/পেন-ড্রাইভে রাখো।
- ফিরিয়ে আনতে: **Settings ▸ Import backup** → ওই ফাইলটা বেছে নাও।

## Vol 6-এ যা বদলেছে (Vol 5 থেকে)
- Google Sheets/Apps Script backend **বাদ** — সব যুক্তি এখন ব্রাউজারে local ভাবে চলে (IndexedDB-তে জমা)।
- **`Code.gs` আর লাগে না** — Apps Script deploy/authorize কিছুই দরকার নেই।
- ছবি upload, barcode scan, camera — **বাদ** (শুধু ডেস্কটপ, একটাই ব্রাউজার)।
- Invoice-এ **JPEG ও PDF download** বাটন (html2canvas + jsPDF)।
- Settings-এ **Export / Import backup**।
- Dashboard-এর নতুন চেহারা — কালো background, জুয়েল-টোন রঙিন কার্ড, count-up animation, **Lato** ফন্ট।
- সব বিক্রি/লাভ/stock/due/return হিসাব Vol 5-এর মতোই — node দিয়ে টেস্ট করা।

## চালু করা (শুধু একটা ফাইল)
এটা একটা single-file অ্যাপ। যেভাবে চালাও:
- **GitHub Pages-এ:** এই চ্যাটের `index.html`, `manifest.json`, `sw.js`, ৪টা icon repo-তে replace করো (Code.gs লাগবে না) → লাইভ লিংকে **Ctrl/Cmd+Shift+R** দিয়ে hard refresh।
- **শুধু ফাইল হিসেবে:** `index.html` double-click করে খুললেও চলে (ইন্টারনেট শুধু প্রথমবার ফন্ট/চার্ট/PDF লাইব্রেরি নামাতে লাগে; একবার cache হলে offline-ও চলবে)।

> ব্রাউজার সবসময় একটাই ব্যবহার করো (যেমন Chrome)। ভিন্ন ব্রাউজার = ভিন্ন storage = আলাদা ডেটা।

## ফাইলগুলো (GitHub-এ সবগুলো একসাথে রাখতে হবে)
- `index.html` — অ্যাপ
- ~~`Code.gs`~~ — আর লাগে না (Vol 6 local edition)
- `manifest.json` — PWA তথ্য (install-এর জন্য)
- `sw.js` — service worker (offline)
- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` — অ্যাপ icon

---

## PART A — (OBSOLETE since Vol 6) Backend বসানো
1. নতুন **Google Sheet** খোলো (নাম: `OMME'S GALLERY DB`)।
2. **Extensions ▸ Apps Script** → সব মুছে **`Code.gs`** paste করো।
3. ৪ নম্বর লাইনে পাসওয়ার্ড বদলাও: `const APP_PASSWORD = '...'` → নিজের পাসওয়ার্ড।
4. ফাংশন-লিস্টে **`setup`** বেছে **Run** → permission চাইলে Allow। (৪টা tab তৈরি হবে)
5. **Deploy ▸ New deployment ▸ Web app** → Execute as: **Me**, Who has access: **Anyone** ▸ Deploy ▸ **`/exec` URL copy** করো (গোপন রাখো)।
- কোড বদলালে: Deploy ▸ Manage deployments ▸ pencil ▸ Version: New version ▸ Deploy (URL একই থাকে)।

### নতুন Vol বসানোর সময় (যেমন Vol 4)
1. Apps Script-এ পুরনো Code.gs মুছে **নতুন Code.gs** paste ▸ Save।
2. **Deploy ▸ Manage deployments ▸ pencil ▸ Version: New version ▸ Deploy** (URL একই)।
3. GitHub-এ **index.html** নতুনটা দিয়ে replace (নতুন থাকলে manifest/sw/icon-ও)।
4. অ্যাপ refresh করো — Reports/Purchases/Expenses চলে আসবে। নতুন Sheet tab নিজে তৈরি হবে, setup() আবার লাগবে না।

### ⚠️ Vol 5 চালু করতে একটা বাড়তি ধাপ (ছবি আপলোডের জন্য Drive অনুমতি)
Vol 5-এ product ছবি **Google Drive**-এ জমা হয়, তাই একবার Drive-এর অনুমতি দিতে হবে:
1. Apps Script-এ নতুন Code.gs paste ▸ Save।
2. ফাংশন-লিস্টে **`authorize`** বেছে **Run** → নতুন permission (Drive) চাইবে ▸ Advanced ▸ Allow।
3. তারপর **Deploy ▸ Manage deployments ▸ pencil ▸ New version ▸ Deploy**।
4. GitHub-এ **index.html** replace।
> অনুমতি না দিলে বাকি সব চলবে, শুধু ছবি আপলোড কাজ করবে না।

## PART B — অ্যাপ hosting (ফ্রি, HTTPS দরকার)
> **জরুরি:** PWA install ও offline **শুধু https লিংকে** কাজ করে — `index.html` সরাসরি ফাইল হিসেবে খুললে install হবে না। তাই GitHub Pages-এ (বা Netlify/Vercel) রাখো।
1. github.com → নতুন repository।
2. উপরের **সব ফাইল** upload করো (index.html, Code.gs লাগবে না hosting-এ কিন্তু রাখলে ক্ষতি নেই; manifest, sw.js, সব icon **অবশ্যই**)।
3. **Settings ▸ Pages ▸ Branch: main ▸ Save** → `https://...github.io/...` লিংক পাবে।
4. ওই লিংকই সবাই ব্যবহার করবে।

## PART C — (OBSOLETE since Vol 6) প্রথমবার connect
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
- **Purchases** → New purchase দিয়ে supplier থেকে মাল তোলো (stock নিজে বাড়ে); Due list-এ কার কত বাকি; Suppliers tab-এ supplier ব্যবস্থাপনা।
- **Expenses** → packaging, Facebook ad, website, rent ইত্যাদি খরচ লিপিবদ্ধ; category-ভিত্তিক মোট।

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

**Vol 3 — DONE ✅**  Reports & Analytics:
- Backend: নতুন `report(from,to)` action — date-range filter, summary (sales/profit/orders/items/COGS/margin/avg), best-sellers (product-wise), brand-wise, customer-wise, payment-wise, আর this-year vs last-year monthly (YoY)।
- Frontend: নতুন **Reports** nav + view — date presets (This month / Last month / This year / All time) + custom date range, ৩টা KPI card, YoY grouped bar chart, Profit/Loss statement (subtotal − COGS = gross − discount = net; delivery pass-through memo), best-selling products table, brand performance (+margin), top customers, payment breakdown।
- CSV export: sales (range), best-sellers, brand-performance — Excel/Bangla-safe (UTF-8 BOM)।
- সব হিসাব mock-data দিয়ে verify করা হয়েছে।

**Vol 4 — DONE ✅**  Expense + Supplier/Purchase:
- Backend: নতুন sheet — Suppliers, Expenses, Purchases, PurchaseItems (sh() এখন missing tab নিজে বানায়, তাই setup() আবার না চালালেও চলবে)। নতুন action — listSuppliers/saveSupplier/deleteSupplier, listExpenses/saveExpense/deleteExpense, listPurchases/getPurchase/createPurchase/updatePurchasePayment।
- Purchase (stock inward): পণ্য কিনলে **stock নিজে বেড়ে যায়**, আর product-এর BuyPrice সর্বশেষ কেনা দামে আপডেট হয়। Total/Paid/Due হিসাব; due থাকলে পরে payment update করে settle করা যায়।
- Frontend: sidebar-এ Purchases + Expenses; মোবাইলে "More (⋯)" menu (Reports/Purchases/Expenses)। Expenses ledger (category, date, amount, note; month/all total; by-category breakdown)। Purchases view — tabs: Purchases / Due list / Suppliers / New purchase (cart)। Supplier CRUD, purchase view + payment modal।
- Expense নোট: Buy price-এ যেহেতু packaging/delivery/ad খরচ ধরা আছে, Expense ledger আলাদা ট্র্যাকিং — sales profit থেকে আবার বাদ দেওয়া হয় না (double-count এড়াতে)।
- createPurchase/updatePayment mock-Sheet দিয়ে verify করা হয়েছে।

**Vol 7 — DONE ✅**  Firebase login + sync, live on GitHub Pages (login, 2–3 accounts, laptop/mobile sync, offline, old-data upload).

**Vol 9 — DONE ✅ (current)**  Pre-order, themes, search, new invoice:
- **Pre-order**: New sale has a ✅ প্রি-অর্ডার tick + expected date + Order status (Delivered / Pending). Stock and "sold out" behave as before. When the dress arrives: Customers ▸ History ▸ Edit, type the real **Buy ৳** per item → profit adjusts by itself, set status Delivered.
- **Buyer directory** shows Paid / Partial (due) / Due and the pre-order / Pending status per buyer; History shows the same per invoice. Advance / due use the existing "Received now" + Dues system.
- **Themes**: Mild, Deep (clearly tan now), Rose Blush, Peacock Teal, Lavender, Sunset, Dark, Night, Midnight Blue, Plum Wine, Charcoal Gold. The dashboard follows the theme (light themes get a light panel).
- **Dashboard tiles**: "This Month" and "Previous Month" profit (no month names); the All-time profit tile is replaced by **Pre-orders · This Month** (count, pending / delivered). Reports ▸ **Pre-orders** panel: totals for the chosen dates + a month-by-month stacked graph (Delivered / Pending) for this year.
- **Dashboard search**: customer name / mobile / address, dress name / SKU / brand, invoice no. → History / Edit / View buttons.
- **Invoice** uses the OMME'S GALLERY template (logo embedded, courier / zone / time / note editable before sharing). **Share** button opens the phone share sheet with the invoice picture (Messenger, WhatsApp…); "WhatsApp chat" opens the customer's chat; JPG / PDF download. Total Payable includes delivery; Due = Total Payable − Advance (0 when Full Paid).

**Vol 8 — DONE ✅**  App changes:
- Themes (Mild / Deep / Dark / Night) + fonts (Lato, Roboto, Poppins, League Spartan, Serif) in Settings ▸ Appearance (per device).
- Dashboard: this-month and last-month profit tiles. Recent Orders and Reports layout fixed (class clash `.pos` → `.posview`). Mobile top bar safe-area fix + visible Settings button. Returns screen removed from the UI (old data stays safe).
- **Delivery charge is invoice-only**: shown on the invoice (customer pays Subtotal − Discount + Delivery) but never counted in sales, profit, dues or reports. Sale amount = Subtotal − Discount (`saleNet()`), so old rows whose Total included delivery are counted correctly too.
- **Edit a sale** (Customers ▸ History ▸ Edit, or Dashboard ▸ Recent Orders ▸ Edit): customer, date, payment, discount, delivery, money received, each line's qty/price (qty 0 removes the line). Stock and FIFO lots are corrected, profit recalculated, the due row rebuilt. Cannot add a new product to an old invoice (make a new sale instead).

**পরের ধাপ:**
**Vol 5 — DONE ✅ (current)**  Extras:
- **Barcode/QR scan** — POS ও Inventory-তে ⌾ বোতাম, ক্যামেরায় SKU/QR স্ক্যান করে পণ্য খোঁজা/কার্টে যোগ (https দরকার)।
- **Product image upload** — product form-এ ছবি দিলে Drive-এ জমা, Inventory ও POS-এ thumbnail।
- **Return/Refund** — invoice দিয়ে ফেরত, stock ফেরত যায়, sales/profit থেকে বাদ যায়।
- **Due/credit** — POS-এ "Received now" কম দিলে বাকি ধরা হয়; Customers ▸ Dues tab-এ আদায়; Dashboard-এ "To collect" কার্ড।
- **Settings** — shop নাম/ফোন/ঠিকানা/invoice footer, connection বদল, install, disconnect।
- ব্যাকএন্ড টেস্টেড (due, return stock-back, dashboard/report net, payDue)।

Vol 5 শেষ। (Vol 6 = local edition, Vol 7 = Firebase login + sync — above.)
- **পরে (external খরচ):** SMS/WhatsApp notification।

> **Resume করতে:** শেষ Vol-এর `index.html` + `Code.gs` + (Vol 2+ থেকে) `manifest.json`, `sw.js`, iconগুলো + এই STATE অংশ paste করলেই আমি পরের Vol থেকে শুরু করব।

---

## Tech summary
Frontend vanilla HTML/CSS/JS + Chart.js (CDN)। Backend Apps Script web app (POST `text/plain`, CORS preflight এড়াতে)। DB Google Sheets। PWA: manifest + cache-first service worker (API bypass)। Auth (Vol 7): Firebase Auth email/password + Firestore rules. DB (Vol 7): Cloud Firestore.
