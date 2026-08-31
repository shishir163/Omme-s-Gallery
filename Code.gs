/**
 * OMME'S GALLERY — Backend API (Google Apps Script)
 * ---------------------------------------------------
 * The active Google Sheet is used as the database.
 * Deploy:  Extensions ▸ Apps Script ▸ paste this ▸ Run setup() once ▸
 *          Deploy ▸ New deployment ▸ Web app ▸
 *          Execute as: Me ▸ Who has access: Anyone ▸ Deploy ▸ copy the URL.
 *
 * IMPORTANT: change APP_PASSWORD below and use the same password in the app.
 */

const APP_PASSWORD = 'omme-change-me';   // <-- change this
const LOW_STOCK    = 3;                    // stock at or below this = low stock

const SHEETS = {
  Products:  ['ID','SKU','Name','Brand','Category','Size','BuyPrice','SalePrice','Stock','ImageURL','CreatedAt'],
  Customers: ['ID','Name','Phone','Address','Email','CreatedAt'],
  Sales:     ['InvoiceNo','Date','CustomerID','CustomerName','Subtotal','Discount','Delivery','Total','Profit','Payment','Status','Note'],
  SaleItems: ['InvoiceNo','ProductID','ProductName','Qty','SalePrice','BuyPrice','LineTotal','LineProfit'],
  Suppliers: ['ID','Name','Company','Phone','Address','Note','CreatedAt'],
  Expenses:  ['ID','Date','Category','Amount','Note','CreatedAt'],
  Purchases: ['PurchaseNo','Date','SupplierID','SupplierName','Total','Paid','Due','Status','Note'],
  PurchaseItems: ['PurchaseNo','ProductID','ProductName','Qty','BuyPrice','LineTotal'],
  Returns:   ['ReturnNo','Date','InvoiceNo','CustomerName','Amount','ProfitReversed','Note'],
  ReturnItems: ['ReturnNo','ProductID','ProductName','Qty','SalePrice','BuyPrice','LineTotal','LineProfit'],
  Dues:      ['ID','Date','InvoiceNo','CustomerID','CustomerName','Amount','Paid','Balance','Status','Note']
};

/** Run this ONCE from the Apps Script editor to build the sheet tabs. */
function setup(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(function(name){
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0){
      sh.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, SHEETS[name].length).setFontWeight('bold');
    }
  });
  const s1 = ss.getSheetByName('Sheet1');
  if (s1 && s1.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  return 'Setup complete. Now deploy as a Web app.';
}

function doGet(){ return json({ ok:true, service:"OMME'S GALLERY API" }); }

function doPost(e){
  try{
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (req.pass !== APP_PASSWORD) return json({ ok:false, error:'AUTH' });
    return json({ ok:true, data: route(req.action, req) });
  }catch(err){
    return json({ ok:false, error: String(err) });
  }
}

function route(action, req){
  switch(action){
    case 'dashboard':       return dashboard();
    case 'listProducts':    return readAll('Products');
    case 'saveProduct':     return saveRow('Products', req.item, 'P');
    case 'deleteProduct':   return deleteRow('Products', req.id);
    case 'listCustomers':   return readAll('Customers');
    case 'saveCustomer':    return saveRow('Customers', req.item, 'C');
    case 'deleteCustomer':  return deleteRow('Customers', req.id);
    case 'customerHistory': return customerHistory(req.id);
    case 'listSales':       return listSales();
    case 'getSale':         return getSale(req.invoiceNo);
    case 'createSale':      return createSale(req.sale, req.items);
    case 'report':          return report(req.from, req.to);
    case 'listSuppliers':   return readAll('Suppliers');
    case 'saveSupplier':    return saveRow('Suppliers', req.item, 'S');
    case 'deleteSupplier':  return deleteRow('Suppliers', req.id);
    case 'listExpenses':    return readAll('Expenses');
    case 'saveExpense':     return saveRow('Expenses', req.item, 'E');
    case 'deleteExpense':   return deleteRow('Expenses', req.id);
    case 'listPurchases':   return listPurchases();
    case 'getPurchase':     return getPurchase(req.purchaseNo);
    case 'createPurchase':  return createPurchase(req.purchase, req.items);
    case 'updatePurchasePayment': return updatePurchasePayment(req.purchaseNo, req.paid);
    case 'uploadImage':     return uploadImage(req.fileName, req.mimeType, req.data);
    case 'createReturn':    return createReturn(req.ret, req.items);
    case 'listReturns':     return listReturns();
    case 'listDues':        return listDues();
    case 'payDue':          return payDue(req.id, req.amount);
    default: throw 'Unknown action: ' + action;
  }
}

/* ---------- helpers ---------- */
function json(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
function sh(name){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(name);
  if (!s && SHEETS[name]){
    s = ss.insertSheet(name);
    s.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]);
    s.setFrozenRows(1);
    s.getRange(1, 1, 1, SHEETS[name].length).setFontWeight('bold');
  }
  return s;
}
function num(v){ return Number(v) || 0; }

function readAll(name){
  const s = sh(name);
  const values = s.getDataRange().getValues();
  if (values.length < 2) return [];
  const head = values.shift();
  return values
    .filter(function(r){ return r[0] !== '' && r[0] !== null; })
    .map(function(r){ const o = {}; head.forEach(function(h,i){ o[h] = r[i]; }); return o; });
}

function findRow(name, id){
  const s = sh(name);
  const last = s.getLastRow();
  if (last < 2) return -1;
  const ids = s.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++){
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

const NUM_FIELDS = ['BuyPrice','SalePrice','Stock','Amount'];
function coerce(item){
  NUM_FIELDS.forEach(function(f){ if (item[f] !== undefined && item[f] !== '') item[f] = Number(item[f]) || 0; });
  return item;
}

/** Insert or update a row keyed by ID. Prefix used to mint new IDs. */
function saveRow(name, item, prefix){
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try{
    coerce(item);
    const head = SHEETS[name];
    const s = sh(name);
    let id = item.ID;
    if (!id){
      id = prefix + Date.now().toString(36).toUpperCase();
      item.ID = id;
      item.CreatedAt = new Date().toISOString();
    }
    const rowArr = head.map(function(h){ return item[h] !== undefined ? item[h] : ''; });
    const idx = findRow(name, id);
    if (idx > 0){
      const existing = s.getRange(idx, 1, 1, head.length).getValues()[0];
      const cIdx = head.indexOf('CreatedAt');
      if (cIdx > -1) rowArr[cIdx] = existing[cIdx] || rowArr[cIdx];
      s.getRange(idx, 1, 1, head.length).setValues([rowArr]);
    } else {
      s.appendRow(rowArr);
    }
    return { id: id };
  } finally { lock.releaseLock(); }
}

function deleteRow(name, id){
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try{
    const idx = findRow(name, id);
    if (idx > 0) sh(name).deleteRow(idx);
    return { deleted: idx > 0 };
  } finally { lock.releaseLock(); }
}

function nextInvoice(){
  const s = sh('Sales');
  const seq = Math.max(s.getLastRow() - 1, 0) + 1;
  const d = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyMMdd');
  return 'OG' + d + '-' + ('000' + seq).slice(-3);
}

/** Create a sale: writes Sales + SaleItems, deducts stock, computes profit. */
function createSale(sale, items){
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try{
    items = items || [];
    const invNo = nextInvoice();
    const now = new Date();
    const prod = sh('Products');
    const stockCol = SHEETS.Products.indexOf('Stock') + 1;
    let subtotal = 0, profit = 0;

    items.forEach(function(it){
      const qty = Number(it.Qty) || 0;
      const sp  = Number(it.SalePrice) || 0;
      const bp  = Number(it.BuyPrice) || 0;
      it.LineTotal  = qty * sp;
      it.LineProfit = qty * (sp - bp);
      subtotal += it.LineTotal;
      profit   += it.LineProfit;
      if (it.ProductID){
        const idx = findRow('Products', it.ProductID);
        if (idx > 0){
          const cur = Number(prod.getRange(idx, stockCol).getValue()) || 0;
          prod.getRange(idx, stockCol).setValue(cur - qty);
        }
      }
    });

    const discount = Number(sale.Discount) || 0;
    const delivery = Number(sale.Delivery) || 0;
    const total    = subtotal - discount + delivery;
    const netProfit = profit - discount; // delivery treated as pass-through

    sh('Sales').appendRow([
      invNo, now.toISOString(), sale.CustomerID || '', sale.CustomerName || '',
      subtotal, discount, delivery, total, netProfit,
      sale.Payment || 'Cash', sale.Status || 'Delivered', sale.Note || ''
    ]);

    if (items.length){
      const rows = items.map(function(it){
        return [invNo, it.ProductID || '', it.ProductName || '',
                Number(it.Qty) || 0, Number(it.SalePrice) || 0, Number(it.BuyPrice) || 0,
                it.LineTotal, it.LineProfit];
      });
      const si = sh('SaleItems');
      si.getRange(si.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }

    // customer due (credit): if amount received is less than total
    const received = (sale.Paid === '' || sale.Paid == null) ? total : num(sale.Paid);
    let due = 0;
    if (received < total){
      due = total - received;
      sh('Dues').appendRow([
        'D' + Date.now().toString(36).toUpperCase(), now.toISOString(), invNo,
        sale.CustomerID || '', sale.CustomerName || '', due, 0, due, 'Due', ''
      ]);
    }
    return { invoiceNo: invNo, subtotal: subtotal, discount: discount, delivery: delivery, total: total, profit: netProfit, received: received, due: due };
  } finally { lock.releaseLock(); }
}

function listSales(){
  return readAll('Sales').sort(function(a,b){ return new Date(b.Date) - new Date(a.Date); });
}

function getSale(invoiceNo){
  const sale = readAll('Sales').filter(function(s){ return String(s.InvoiceNo) === String(invoiceNo); })[0];
  const items = readAll('SaleItems').filter(function(i){ return String(i.InvoiceNo) === String(invoiceNo); });
  return { sale: sale || null, items: items };
}

function customerHistory(id){
  const sales = readAll('Sales')
    .filter(function(s){ return String(s.CustomerID) === String(id); })
    .sort(function(a,b){ return new Date(b.Date) - new Date(a.Date); });
  let spent = 0, prof = 0;
  sales.forEach(function(s){ spent += Number(s.Total) || 0; prof += Number(s.Profit) || 0; });
  let due = 0;
  readAll('Dues').forEach(function(d){
    if (String(d.CustomerID) === String(id)) due += num(d.Balance);
  });
  return { sales: sales, orders: sales.length, totalSpent: spent, totalProfit: prof, due: due };
}

function dashboard(){
  const tz = Session.getScriptTimeZone();
  const sales = readAll('Sales');
  const products = readAll('Products');
  const returns = readAll('Returns');
  const dues = readAll('Dues');
  const todayStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const yr = Utilities.formatDate(new Date(), tz, 'yyyy');

  let tSales = 0, tProfit = 0, tOrders = 0, allSales = 0, allProfit = 0;
  const monthly = {};
  sales.forEach(function(s){
    const d = new Date(s.Date);
    const dStr = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    const total = num(s.Total), pf = num(s.Profit);
    allSales += total; allProfit += pf;
    if (dStr === todayStr){ tSales += total; tProfit += pf; tOrders++; }
    if (Utilities.formatDate(d, tz, 'yyyy') === yr){
      const m = Utilities.formatDate(d, tz, 'yyyy-MM');
      monthly[m] = (monthly[m] || 0) + total;
    }
  });

  // subtract returns (refunds)
  let tRet = 0, tRetProfit = 0, allRet = 0, allRetProfit = 0;
  returns.forEach(function(r){
    const d = new Date(r.Date);
    const dStr = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    const amt = num(r.Amount), rp = num(r.ProfitReversed);
    allRet += amt; allRetProfit += rp;
    if (dStr === todayStr){ tRet += amt; tRetProfit += rp; }
    if (Utilities.formatDate(d, tz, 'yyyy') === yr){
      const m = Utilities.formatDate(d, tz, 'yyyy-MM');
      monthly[m] = (monthly[m] || 0) - amt;
    }
  });

  let outstandingDue = 0;
  dues.forEach(function(x){ outstandingDue += num(x.Balance); });

  const recent = sales.slice()
    .sort(function(a,b){ return new Date(b.Date) - new Date(a.Date); })
    .slice(0, 8);
  const low = products.filter(function(p){ return num(p.Stock) <= LOW_STOCK; });

  return {
    today:   { sales: tSales - tRet, profit: tProfit - tRetProfit, orders: tOrders, returns: tRet },
    allTime: { sales: allSales - allRet, profit: allProfit - allRetProfit, orders: sales.length, returns: allRet },
    outstandingDue: outstandingDue,
    year: yr, monthly: monthly, recent: recent,
    lowStock: low, productCount: products.length, customerCount: readAll('Customers').length
  };
}

/** Reports & analytics for a date range (inclusive). from/to are 'yyyy-MM-dd' or ''. */
function report(from, to){
  const tz = Session.getScriptTimeZone();
  const sales = readAll('Sales');
  const items = readAll('SaleItems');
  const products = readAll('Products');

  const brandOf = {};
  products.forEach(function(p){ brandOf[p.ID] = p.Brand || '—'; });

  function dstr(v){ return Utilities.formatDate(new Date(v), tz, 'yyyy-MM-dd'); }
  function inRange(v){
    const ds = dstr(v);
    if (from && ds < from) return false;
    if (to && ds > to) return false;
    return true;
  }

  const S = sales.filter(function(s){ return s.Date && inRange(s.Date); });
  const invSet = {};
  S.forEach(function(s){ invSet[s.InvoiceNo] = true; });
  const I = items.filter(function(it){ return invSet[it.InvoiceNo]; });

  // summary
  let totalSales=0, totalProfit=0, totalDiscount=0, totalDelivery=0, subtotal=0;
  S.forEach(function(s){
    totalSales += num(s.Total); totalProfit += num(s.Profit);
    totalDiscount += num(s.Discount); totalDelivery += num(s.Delivery);
    subtotal += num(s.Subtotal);
  });
  let itemsSold=0, cogs=0;
  I.forEach(function(it){ itemsSold += num(it.Qty); cogs += num(it.Qty) * num(it.BuyPrice); });
  const orders = S.length;

  // returns (refunds) in range
  const retRows = readAll('Returns').filter(function(r){ return r.Date && inRange(r.Date); });
  let retAmount = 0, retProfit = 0;
  retRows.forEach(function(r){ retAmount += num(r.Amount); retProfit += num(r.ProfitReversed); });
  const netSales = totalSales - retAmount;
  const netProfit = totalProfit - retProfit;

  // best sellers by product
  const pAgg = {};
  I.forEach(function(it){
    const k = it.ProductID || it.ProductName;
    if (!pAgg[k]) pAgg[k] = { name: it.ProductName, brand: brandOf[it.ProductID] || '—', qty:0, revenue:0, profit:0 };
    pAgg[k].qty += num(it.Qty); pAgg[k].revenue += num(it.LineTotal); pAgg[k].profit += num(it.LineProfit);
  });
  const bestSellers = Object.keys(pAgg).map(function(k){ return pAgg[k]; })
    .sort(function(a,b){ return b.qty - a.qty; });

  // by brand
  const bAgg = {};
  I.forEach(function(it){
    const b = brandOf[it.ProductID] || '—';
    if (!bAgg[b]) bAgg[b] = { brand:b, qty:0, revenue:0, profit:0 };
    bAgg[b].qty += num(it.Qty); bAgg[b].revenue += num(it.LineTotal); bAgg[b].profit += num(it.LineProfit);
  });
  const byBrand = Object.keys(bAgg).map(function(k){ return bAgg[k]; })
    .sort(function(a,b){ return b.revenue - a.revenue; });

  // by customer
  const cAgg = {};
  S.forEach(function(s){
    const k = s.CustomerName || 'Walk-in';
    if (!cAgg[k]) cAgg[k] = { name:k, orders:0, spent:0, profit:0 };
    cAgg[k].orders++; cAgg[k].spent += num(s.Total); cAgg[k].profit += num(s.Profit);
  });
  const byCustomer = Object.keys(cAgg).map(function(k){ return cAgg[k]; })
    .sort(function(a,b){ return b.spent - a.spent; });

  // by payment
  const pay = {};
  S.forEach(function(s){ const k = s.Payment || 'Cash'; pay[k] = (pay[k] || 0) + num(s.Total); });

  // year-over-year monthly (full years, independent of range)
  const thisYear = Number(Utilities.formatDate(new Date(), tz, 'yyyy'));
  const cur = [], prev = [], prof = [];
  for (let i=0;i<12;i++){ cur.push(0); prev.push(0); prof.push(0); }
  sales.forEach(function(s){
    if (!s.Date) return;
    const d = new Date(s.Date);
    const y = Number(Utilities.formatDate(d, tz, 'yyyy'));
    const m = Number(Utilities.formatDate(d, tz, 'MM')) - 1;
    if (y === thisYear){ cur[m] += num(s.Total); prof[m] += num(s.Profit); }
    else if (y === thisYear - 1){ prev[m] += num(s.Total); }
  });
  readAll('Returns').forEach(function(r){
    if (!r.Date) return;
    const d = new Date(r.Date);
    const y = Number(Utilities.formatDate(d, tz, 'yyyy'));
    const m = Number(Utilities.formatDate(d, tz, 'MM')) - 1;
    if (y === thisYear){ cur[m] -= num(r.Amount); prof[m] -= num(r.ProfitReversed); }
    else if (y === thisYear - 1){ prev[m] -= num(r.Amount); }
  });

  return {
    range: { from: from || null, to: to || null },
    summary: {
      totalSales: netSales, totalProfit: netProfit, grossSales: totalSales,
      returns: retAmount, retProfit: retProfit,
      orders: orders, itemsSold: itemsSold,
      totalDiscount: totalDiscount, totalDelivery: totalDelivery, cogs: cogs, subtotal: subtotal,
      avgOrder: orders ? netSales / orders : 0,
      avgProfit: orders ? netProfit / orders : 0,
      margin: netSales ? (netProfit / netSales * 100) : 0
    },
    bestSellers: bestSellers, byBrand: byBrand, byCustomer: byCustomer, byPayment: pay,
    yoy: { year: thisYear, cur: cur, prev: prev, profit: prof }
  };
}

/* ---------- Purchases (stock inward) ---------- */
function nextPurchase(){
  const s = sh('Purchases');
  const seq = Math.max(s.getLastRow() - 1, 0) + 1;
  const d = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyMMdd');
  return 'PO' + d + '-' + ('000' + seq).slice(-3);
}

/** Create a purchase: writes Purchases + PurchaseItems, INCREASES stock,
    updates each product's BuyPrice to the latest purchase price. */
function createPurchase(pur, items){
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try{
    items = items || [];
    const no = nextPurchase();
    const now = new Date();
    const prod = sh('Products');
    const stockCol = SHEETS.Products.indexOf('Stock') + 1;
    const buyCol   = SHEETS.Products.indexOf('BuyPrice') + 1;
    let total = 0;

    items.forEach(function(it){
      const qty = num(it.Qty), bp = num(it.BuyPrice);
      it.LineTotal = qty * bp; total += it.LineTotal;
      if (it.ProductID){
        const idx = findRow('Products', it.ProductID);
        if (idx > 0){
          const cur = num(prod.getRange(idx, stockCol).getValue());
          prod.getRange(idx, stockCol).setValue(cur + qty);       // stock IN
          if (bp > 0) prod.getRange(idx, buyCol).setValue(bp);    // latest cost
        }
      }
    });

    const paid = num(pur.Paid);
    const due = total - paid;
    sh('Purchases').appendRow([
      no, now.toISOString(), pur.SupplierID || '', pur.SupplierName || '',
      total, paid, due, (due <= 0 ? 'Paid' : 'Due'), pur.Note || ''
    ]);

    if (items.length){
      const rows = items.map(function(it){
        return [no, it.ProductID || '', it.ProductName || '', num(it.Qty), num(it.BuyPrice), it.LineTotal];
      });
      const pi = sh('PurchaseItems');
      pi.getRange(pi.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }
    return { purchaseNo: no, total: total, paid: paid, due: due };
  } finally { lock.releaseLock(); }
}

function listPurchases(){
  return readAll('Purchases').sort(function(a,b){ return new Date(b.Date) - new Date(a.Date); });
}

function getPurchase(no){
  const p = readAll('Purchases').filter(function(x){ return String(x.PurchaseNo) === String(no); })[0];
  const items = readAll('PurchaseItems').filter(function(i){ return String(i.PurchaseNo) === String(no); });
  return { purchase: p || null, items: items };
}

/** Set the paid amount on a purchase and recompute due/status. */
function updatePurchasePayment(no, paid){
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try{
    const idx = findRow('Purchases', no);
    if (idx < 0) return { error: 'not found' };
    const head = SHEETS.Purchases;
    const s = sh('Purchases');
    const total = num(s.getRange(idx, head.indexOf('Total') + 1).getValue());
    const p = num(paid);
    const due = total - p;
    s.getRange(idx, head.indexOf('Paid') + 1).setValue(p);
    s.getRange(idx, head.indexOf('Due') + 1).setValue(due);
    s.getRange(idx, head.indexOf('Status') + 1).setValue(due <= 0 ? 'Paid' : 'Due');
    return { paid: p, due: due };
  } finally { lock.releaseLock(); }
}

/* ---------- Vol 5: image upload, returns, dues ---------- */

/** Run once from the editor for Vol 5 to grant Sheets + Drive access. */
function authorize(){
  setup();
  imageFolder();               // touches DriveApp -> requests Drive permission
  return 'Authorized (Sheets + Drive). Now Deploy a new version.';
}

function imageFolder(){
  const name = 'OMME Gallery Product Images';
  const it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

/** Save a base64 image to Drive, return a public thumbnail URL. */
function uploadImage(fileName, mimeType, dataB64){
  const folder = imageFolder();
  const bytes = Utilities.base64Decode(dataB64);
  const blob = Utilities.newBlob(bytes, mimeType || 'image/jpeg', fileName || ('img_' + Date.now()));
  const f = folder.createFile(blob);
  try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e){}
  const id = f.getId();
  return { id: id, url: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w600' };
}

function nextReturn(){
  const s = sh('Returns');
  const seq = Math.max(s.getLastRow() - 1, 0) + 1;
  const d = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyMMdd');
  return 'RT' + d + '-' + ('000' + seq).slice(-3);
}

/** Process a return/refund: puts stock BACK, records Returns + ReturnItems. */
function createReturn(ret, items){
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try{
    items = items || [];
    const no = nextReturn();
    const now = new Date();
    const prod = sh('Products');
    const stockCol = SHEETS.Products.indexOf('Stock') + 1;
    let amount = 0, profitRev = 0;

    items.forEach(function(it){
      const qty = num(it.Qty), sp = num(it.SalePrice), bp = num(it.BuyPrice);
      it.LineTotal = qty * sp;
      it.LineProfit = qty * (sp - bp);
      amount += it.LineTotal;
      profitRev += it.LineProfit;
      if (it.ProductID){
        const idx = findRow('Products', it.ProductID);
        if (idx > 0){
          const cur = num(prod.getRange(idx, stockCol).getValue());
          prod.getRange(idx, stockCol).setValue(cur + qty);     // stock back IN
        }
      }
    });

    sh('Returns').appendRow([
      no, now.toISOString(), ret.InvoiceNo || '', ret.CustomerName || '',
      amount, profitRev, ret.Note || ''
    ]);
    if (items.length){
      const rows = items.map(function(it){
        return [no, it.ProductID || '', it.ProductName || '', num(it.Qty),
                num(it.SalePrice), num(it.BuyPrice), it.LineTotal, it.LineProfit];
      });
      const ri = sh('ReturnItems');
      ri.getRange(ri.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }
    return { returnNo: no, amount: amount, profitReversed: profitRev };
  } finally { lock.releaseLock(); }
}

function listReturns(){
  return readAll('Returns').sort(function(a,b){ return new Date(b.Date) - new Date(a.Date); });
}

function listDues(){
  return readAll('Dues')
    .filter(function(d){ return num(d.Balance) > 0; })
    .sort(function(a,b){ return new Date(b.Date) - new Date(a.Date); });
}

/** Record a payment against a customer due; reduces balance. */
function payDue(id, amount){
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try{
    const idx = findRow('Dues', id);
    if (idx < 0) return { error: 'not found' };
    const head = SHEETS.Dues;
    const s = sh('Dues');
    const amt = num(s.getRange(idx, head.indexOf('Amount') + 1).getValue());
    const paidNow = num(s.getRange(idx, head.indexOf('Paid') + 1).getValue()) + num(amount);
    const bal = amt - paidNow;
    s.getRange(idx, head.indexOf('Paid') + 1).setValue(paidNow);
    s.getRange(idx, head.indexOf('Balance') + 1).setValue(bal);
    s.getRange(idx, head.indexOf('Status') + 1).setValue(bal <= 0 ? 'Paid' : 'Due');
    return { paid: paidNow, balance: bal };
  } finally { lock.releaseLock(); }
}
