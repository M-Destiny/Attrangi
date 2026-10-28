/**
 * Attrangii CRM - Main Entrance
 * Vanilla JS Application
 */
import './index.css';
import { supabase } from './lib/supabase';
import { inject } from '@vercel/analytics';

inject(); // Vercel Web Analytics (page views)
// @ts-ignore
import html2pdf from 'html2pdf.js';
import logoUrl from './assets/logo.png';

// --- Assets ---
const ICONS = {
  dashboard: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-dashboard"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>',
  inventory: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package-2"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>',
  invoices: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-receipt-text"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/></svg>',
  analytics: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bar-chart-3"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
  add: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M12 5v14"/><path d="M12 12h7"/></svg>',
  search: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  settings: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2l-.28 1.29a4.8 4.8 0 0 1-1 .28l-1.29-.28a2 2 0 0 0-2 2v.44a2 2 0 0 0 2 2l1.29.28a4.8 4.8 0 0 1 .28 1l-.28 1.29a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2l.28-1.29a4.8 4.8 0 0 1 1-.28l1.29.28a2 2 0 0 0 2-2v-.44a2 2 0 0 0-2-2l-1.29-.28a4.8 4.8 0 0 1-.28-1l.28-1.29a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  logout: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',
};

const utils = {
  renderSearchItem: (res: any) => `
    <div class="card flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer">
       <div class="flex items-center gap-4">
          <div class="rounded-lg overflow-hidden bg-surface-container-highest" style="width:44px;height:44px;flex:none">
             ${res.image ? `<img src="${res.image}" style="width:44px;height:44px;min-width:44px;max-width:44px;object-fit:cover;border-radius:8px;flex:none;display:block;background:#eee" loading="lazy" decoding="async" onerror="this.style.visibility='hidden'">` : `<div class="w-full h-full flex items-center justify-center opacity-40">${res.type === 'Product' ? ICONS.inventory : ICONS.invoices}</div>`}
          </div>
          <div>
             <p class="font-bold">${res.title}</p>
             <p class="text-xs text-on-surface-variant">${res.subtitle}</p>
             ${res.type === 'Product' ? `
               <div class="flex gap-2 mt-1">
                 <span class="text-[9px] px-1.5 py-0.5 rounded ${res.stock > 10 ? 'bg-secondary-container text-secondary' : 'bg-error-container text-error'} font-black uppercase">Stock: ${res.stock}</span>
                 <span class="text-[9px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-black">₹${res.price.toLocaleString('en-IN')}</span>
               </div>
             ` : ''}
          </div>
       </div>
       <div class="text-right">
          <p class="font-bold">${res.meta}</p>
          <p class="text-[10px] font-black uppercase tracking-widest opacity-40">${res.type}</p>
       </div>
    </div>
  `,
  calculateInvoiceTotals: (inv: any) => {
    const subtotal = inv.items.reduce((acc: any, item: any) => acc + (item.qty * (item.price || 0)), 0);
    const taxAmount = (subtotal - (inv.discount || 0)) * ((inv.taxRate || 0) / 100);
    const total = subtotal - (inv.discount || 0) + taxAmount + (inv.shipping || 0);
    return { subtotal, taxAmount, total };
  },
  updateInvoiceSummaryUI: () => {
    const { subtotal, total } = utils.calculateInvoiceTotals(state.currentInvoice);
    const elements = {
      'summary-subtotal': `₹${subtotal.toLocaleString('en-IN')}`,
      'summary-total': `₹${total.toLocaleString('en-IN')}`,
      'preview-total': `₹${total.toLocaleString('en-IN')}`
    };
    Object.entries(elements).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.innerText = val;
    });
    
    // Update individual item row totals if possible
    state.currentInvoice.items.forEach((item: any) => {
       const el = document.getElementById(`item-total-${item.id}`);
       if (el) el.innerText = `₹${(item.qty * (item.price || 0)).toLocaleString('en-IN')}`;
    });
  }
};

// --- Application State ---
// Distinct product categories (trimmed, case-insensitive dedupe keeping first-seen spelling, sorted).
function categoryList(): string[] {
  const seen = new Map<string, string>();
  ((state.products || []) as any[]).forEach(p => {
    const c = String(p.category || '').trim();
    if (c && !seen.has(c.toLowerCase())) seen.set(c.toLowerCase(), c);
  });
  return [...seen.values()].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}
const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// --- Invoice PDF template (A4) ---
function amountInWords(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const below100 = (x: number) => x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : '');
  const below1000 = (x: number) => (x >= 100 ? ones[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' : '') : '') + (x % 100 ? below100(x % 100) : '');
  const total = Math.round(Math.max(0, Number(n) || 0) * 100);
  const rupees = Math.floor(total / 100), paise = total % 100;
  const parts: string[] = [];
  let rest = rupees;
  const crore = Math.floor(rest / 10000000); rest %= 10000000;
  const lakh = Math.floor(rest / 100000); rest %= 100000;
  const thousand = Math.floor(rest / 1000); rest %= 1000;
  if (crore) parts.push(below1000(crore) + ' Crore');
  if (lakh) parts.push(below100(lakh) + ' Lakh');
  if (thousand) parts.push(below100(thousand) + ' Thousand');
  if (rest) parts.push(below1000(rest));
  let out = 'Rupees ' + (parts.join(' ') || 'Zero');
  if (paise) out += ' and ' + below100(paise) + ' Paise';
  return out + ' Only';
}

function buildInvoiceHtml(inv: any, logoSrc: string): string {
  const fmtDmy = (v: any) => { const d = new Date(v); return isNaN(d.getTime()) ? String(v ?? '') : d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }); };
  const money = (v: any) => '₹' + (Number(v) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const items: any[] = inv.items || [];
  const { subtotal, taxAmount, total: calcTotal } = utils.calculateInvoiceTotals({ ...inv, items });
  const total = Number.isFinite(calcTotal) ? calcTotal : (Number(inv.amount) || 0);
  const discount = Number(inv.discount) || 0, shipping = Number(inv.shipping) || 0, taxRate = Number(inv.taxRate) || 0;
  const status = String(inv.status || '').toLowerCase().replace(/[\s-]+/g, '_');
  const pill: Record<string, [string, string, string]> = {
    paid: ['PAID', '#E3F6EA', '#1E8E4E'], unpaid: ['UNPAID', '#FDE8E8', '#C0392B'], overdue: ['OVERDUE', '#FDE8E8', '#C0392B'],
    partially_paid: ['PARTIAL', '#FFF3D6', '#B7791F'], cancelled: ['CANCELLED', '#ECECEC', '#666']
  };
  const [pLabel, pBg, pFg] = pill[status] || [esc(String(inv.status || '').toUpperCase()), '#ECECEC', '#666'];
  const billed = [inv.customer_phone && '📞 ' + esc(inv.customer_phone), inv.customer_email && esc(inv.customer_email), inv.customer_address && esc(inv.customer_address)]
    .filter(Boolean).map(l => `<div class="line">${l}</div>`).join('');
  const meta = (label: string, val: string) => `<div class="meta"><span>${label}</span><b>${val}</b></div>`;
  const row = (label: string, val: string) => `<div class="trow"><span>${label}</span><b>${val}</b></div>`;
  return `
<style>
.inv{width:794px;box-sizing:border-box;background:#fff;color:#222;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.45;display:flex;flex-direction:column;min-height:1100px}
.inv *{box-sizing:border-box}.inv .in{padding:0 44px 24px;flex:1}
.inv h1,.inv h2,.inv .brand{font-family:'Epilogue','Plus Jakarta Sans','Segoe UI',Arial,sans-serif;margin:0}
.inv .band{display:flex;justify-content:space-between;align-items:center;padding:30px 44px 22px;border-bottom:3px solid #E87AAE;background:#FFF6FA}
.inv .logo{display:flex;align-items:center;gap:14px}.inv .logo img{height:58px;width:auto;object-fit:contain}
.inv .brand{font-size:28px;font-weight:800;color:#222;letter-spacing:-.5px}.inv .tag{font-size:12px;color:#5FA8C9;font-weight:600;letter-spacing:.5px}
.inv .contact{text-align:right;font-size:11.5px;color:#555;line-height:1.7}
.inv .title{display:flex;justify-content:space-between;align-items:flex-start;margin-top:26px}
.inv h1{font-size:38px;font-weight:800;color:#E87AAE;letter-spacing:1px;line-height:1}
.inv .num{font-size:14px;font-weight:700;margin-top:8px;color:#222}
.inv .meta{display:flex;justify-content:flex-end;gap:10px;font-size:12px;color:#777;margin-bottom:3px}.inv .meta b{color:#222;min-width:90px;text-align:right}
.inv .pill{display:inline-block;padding:4px 16px;border-radius:99px;font-size:11px;font-weight:800;letter-spacing:1px;margin-top:6px}
.inv .recv{font-size:11.5px;color:#777;margin-top:4px}
.inv .bill{margin-top:22px;border:1px solid #F3D3E3;border-radius:10px;padding:14px 18px;width:55%;background:#fff;page-break-inside:avoid}
.inv .lbl{display:inline-block;font-size:10px;font-weight:800;letter-spacing:1.5px;color:#5FA8C9;text-transform:uppercase;margin-bottom:8px;padding-bottom:3px;border-bottom:2px solid #F4D21F}
.inv .cname{font-family:'Epilogue','Plus Jakarta Sans',Arial,sans-serif;font-size:17px;font-weight:700}.inv .line{font-size:12px;color:#555;margin-top:2px}
.inv table{width:100%;border-collapse:collapse;margin-top:24px}
.inv thead{display:table-header-group}
.inv th{background:#E87AAE;color:#fff;font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:10px 12px;text-align:left}
.inv td{padding:10px 12px;font-size:12.5px;border-bottom:1px solid #F4E4EC;vertical-align:top}
.inv tr{page-break-inside:avoid;break-inside:avoid}.inv tbody tr:nth-child(even) td{background:#FFF6FA}
.inv .r{text-align:right}.inv .c{text-align:center}
.inv .bottom{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-top:20px;page-break-inside:avoid;break-inside:avoid}
.inv .words{flex:1;font-size:12px;color:#555;padding-top:6px}.inv .words b{display:block;color:#222;font-size:12.5px;margin-top:3px}
.inv .tot{width:270px}.inv .trow{display:flex;justify-content:space-between;padding:6px 4px;font-size:12.5px;color:#555;border-bottom:1px dashed #eee}.inv .trow b{color:#222}
.inv .grand{margin-top:10px;background:#E87AAE;color:#fff;border-radius:10px;padding:13px 16px;display:flex;justify-content:space-between;align-items:center}
.inv .grand span{font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase}.inv .grand b{font-family:'Epilogue','Plus Jakarta Sans',Arial,sans-serif;font-size:22px;font-weight:800}
.inv .foot{margin-top:46px;text-align:center;page-break-inside:avoid;break-inside:avoid}
.inv .thanks{font-family:'Epilogue','Plus Jakarta Sans',Arial,sans-serif;font-size:15px;font-weight:700;color:#E87AAE}
.inv .sub{font-size:10.5px;color:#999;margin-top:5px}
.inv .stripe{display:flex;flex:none;height:6px;margin-top:auto}.inv .stripe i{flex:1;display:block;height:6px}
</style>
<div class="inv">
  <div class="band">
    <div class="logo"><img src="${logoSrc}" alt="Attrangii"><div><div class="brand">Attrangii</div><div class="tag">Toys &amp; collectibles</div></div></div>
    <div class="contact">📞 7506131372<br>Instagram @attrangii_<br>attrangii-store.vercel.app</div>
  </div>
  <div class="in">
    <div class="title">
      <div><h1>INVOICE</h1><div class="num">${esc(inv.id)}</div></div>
      <div style="text-align:right">
        ${meta('Issue date', esc(fmtDmy(inv.date)))}${inv.due_date ? meta('Due date', esc(fmtDmy(inv.due_date))) : ''}
        <span class="pill" style="background:${pBg};color:${pFg}">${pLabel}</span>
        ${status === 'paid' && inv.paid_to ? `<div class="recv">Received by <b>${esc(inv.paid_to)}</b></div>` : ''}
      </div>
    </div>
    <div class="bill"><div class="lbl">Billed to</div><div class="cname">${esc(inv.customer || 'Walk-in Client')}</div>${billed}</div>
    <table>
      <thead><tr><th style="width:36px">#</th><th>Item</th><th class="c" style="width:50px">Qty</th><th class="r" style="width:100px">Rate</th><th class="r" style="width:110px">Amount</th></tr></thead>
      <tbody>${items.map((it, i) => {
        const q = Number(it.quantity ?? it.qty) || 0, p = Number(it.unit_price ?? it.price) || 0;
        return `<tr><td>${i + 1}</td><td>${esc(it.description || 'Item')}</td><td class="c">${q}</td><td class="r">${money(p)}</td><td class="r"><b>${money(it.total_price ?? q * p)}</b></td></tr>`;
      }).join('')}</tbody>
    </table>
    <div class="bottom">
      <div class="words">Amount in words<b>${amountInWords(total)}</b></div>
      <div class="tot">
        ${row('Subtotal', money(subtotal))}
        ${discount > 0 ? row('Discount', '− ' + money(discount)) : ''}
        ${taxRate > 0 ? row(`Tax (${taxRate}%)`, money(taxAmount)) : ''}
        ${shipping > 0 ? row('Shipping', money(shipping)) : ''}
        <div class="grand"><span>Total</span><b>${money(total)}</b></div>
      </div>
    </div>
    <div class="foot">
      <div class="thanks">Thank you for shopping with Attrangii!</div>
      <div class="sub">This is a computer-generated invoice</div>
      <div class="sub">Made with ❤️ by Destiny</div>
    </div>
  </div>
  <div class="stripe"><i style="background:#E87AAE"></i><i style="background:#F4D21F"></i><i style="background:#5FA8C9"></i></div>
</div>`;
}

function categoryFieldHtml(): string {
  const cats = categoryList();
  let cur = String(state.newProduct.category || '').trim();
  if (!cur && !state.editingProductId && cats.length) cur = state.newProduct.category = cats[0];
  const inList = cats.some(c => c.toLowerCase() === cur.toLowerCase());
  if (cur && !inList) cats.push(cur);
  const sel = cats.find(c => c.toLowerCase() === cur.toLowerCase());
  const noneYet = !cur && !cats.length;
  return `
    <select id="catSelect" class="w-full" onchange="app.handlers.pickCategory(this)">
      ${!cur && state.editingProductId ? `<option value="" selected>Uncategorized</option>` : ''}
      ${cats.map(c => `<option value="${esc(c)}" ${c === sel && !noneYet ? 'selected' : ''}>${esc(c)}</option>`).join('')}
      <option value="__new__" ${noneYet ? 'selected' : ''}>+ Create new category…</option>
    </select>
    <input id="newCatInput" type="text" maxlength="40" placeholder="New category name" class="w-full" style="margin-top:0.5rem;display:${noneYet ? 'block' : 'none'}" onchange="app.handlers.newCategoryTyped(this)">`;
}
const CAT_COLORS = ['var(--primary)', 'var(--secondary)', 'var(--tertiary)', 'var(--error)', '#8e6bbf', '#2a9d8f', '#e9a23b', '#4f7cac'];

const state: any = {
  currentView: 'dashboard', 
  user: null,
  theme: 'light',
  editingProductId: null,
  isInitializing: false,
  stats: {
    inventoryValue: 0,
    salesMtd: 0,
    lowStock: 0,
    topSelling: [],
    chartData: [],
    categorySplit: [],
    paidTo: [],
    paymentBreakdown: { paid: 0, pending: 0, paidPct: 0, pendingPct: 0 }
  },
  products: [],
  invoices: [],
  customers: [],
  availableProducts: [],
  searchResults: [],
  searchQuery: '',
  searchTimeout: null,
  uploadingImages: false,
  pendingImageRemovals: [] as string[],
  newProduct: {
    images: [] as string[],
    show_on_storefront: true,
    name: '',
    sku: '',
    selling_price: 0,
    stock_level: 0,
    category: ''
  },
  currentInvoice: {
    items: [],
    discount: 0,
    taxRate: 0,
  },
  invoiceProductSearch: '',
  editingInvoiceDbId: null,
  editingInvoiceNumber: null,
  analyticsFilters: {
    member: 'All',
    dateRange: 'All',
    startDate: '',
    endDate: ''
  },
  dashboardFilters: {
    dateRange: 'Month',
    startDate: '',
    endDate: ''
  },
};

// --- View Definitions ---
const views: any = {
  dashboard: () => {
     const dateRangeFilter = state.dashboardFilters?.dateRange || 'Month';
     
     // Calculate dynamic greeting based on local time
     const hour = new Date().getHours();
     let greeting = 'Morning';
     if (hour >= 12 && hour < 17) {
        greeting = 'Afternoon';
     } else if (hour >= 17 || hour < 5) {
        greeting = 'Evening';
     }

     // 1. Filter Invoices based on dashboard date range
     let filteredInvoices = [...state.invoices];
     const now = new Date();
     
     if (dateRangeFilter === 'Month') {
        filteredInvoices = filteredInvoices.filter((inv: any) => {
           if (!inv.raw_date) return false;
           const d = new Date(inv.raw_date);
           return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
     } else if (dateRangeFilter === '30Days') {
        filteredInvoices = filteredInvoices.filter((inv: any) => {
           if (!inv.raw_date) return false;
           const d = new Date(inv.raw_date);
           return (now.getTime() - d.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        });
     } else if (dateRangeFilter === '6Months') {
        filteredInvoices = filteredInvoices.filter((inv: any) => {
           if (!inv.raw_date) return false;
           const d = new Date(inv.raw_date);
           return (now.getTime() - d.getTime()) <= 6 * 30 * 24 * 60 * 60 * 1000;
        });
     } else if (dateRangeFilter === 'Custom') {
        const start = state.dashboardFilters?.startDate ? new Date(state.dashboardFilters.startDate) : null;
        const end = state.dashboardFilters?.endDate ? new Date(state.dashboardFilters.endDate) : null;
        filteredInvoices = filteredInvoices.filter((inv: any) => {
           if (!inv.raw_date) return false;
           const d = new Date(inv.raw_date);
           const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
           if (start && end) {
              const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
              const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
              return dTime >= startTime && dTime <= endTime;
           } else if (start) {
              const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
              return dTime >= startTime;
           } else if (end) {
              const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
              return dTime <= endTime;
           }
           return true;
        });
     }
     
     // 2. Calculate Sales performance for selected period
     const periodSales = filteredInvoices.reduce((acc: any, inv: any) => acc + Number(inv.amount || 0), 0);
     
     // 3. Recalculate Top Selling based on filtered invoices
     const itemCounts: any = {};
     filteredInvoices.forEach((inv: any) => {
        (inv.items || []).forEach((item: any) => {
           itemCounts[item.product_id] = (itemCounts[item.product_id] || 0) + item.quantity;
        });
     });
     let topSelling = Object.entries(itemCounts)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 3)
        .map(([pid, qty]) => {
           const p = state.products.find((prod: any) => prod.id === pid);
           return p ? { name: p.name, qty, price: p.selling_price, image: p.image_url } : null;
        })
        .filter(Boolean);
        
     // Fallback to general top selling
     if (topSelling.length === 0) {
        topSelling = state.stats.topSelling || [];
     }
     
     // 4. Recalculate Monthly Sales Overview based on filtered invoices
     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
     const chartData = [];
     let maxMonthSales = 0;
     for (let i = 5; i >= 0; i--) {
         const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
         const monthSales = filteredInvoices.reduce((acc: any, inv: any) => {
            if (!inv.raw_date) return acc;
            const idate = new Date(inv.raw_date);
            if (idate.getMonth() === d.getMonth() && idate.getFullYear() === d.getFullYear()) return acc + Number(inv.amount || 0);
            return acc;
         }, 0);
         if (monthSales > maxMonthSales) maxMonthSales = monthSales;
         chartData.push({ label: months[d.getMonth()], sales: monthSales, isCurrent: i === 0 });
     }
     const dynamicChartData = chartData.map((d: any) => ({ ...d, height: maxMonthSales > 0 ? (d.sales / maxMonthSales * 100) : 0 }));

     // Date label for stat card
     const dateLabels: any = {
        All: 'All Time Revenue',
        Month: 'Current MTD Sales',
        '30Days': 'Last 30 Days Sales',
        '6Months': 'Last 6 Months Sales',
        Custom: 'Custom Range Sales'
     };
     const salesStatLabel = dateLabels[dateRangeFilter];

     return `
    <div class="view-header flex justify-between items-start md:items-end flex-wrap gap-4">
      <div>
        <h2 class="font-black text-4xl md:text-5xl">${greeting}, ${state.user?.email?.split('@')[0] || 'Admin'}.</h2>
        <p class="text-on-surface-variant mt-2">Here is the pulse of your inventory and sales today.</p>
      </div>
      
      <!-- Premium Filter Controls -->
      <div class="flex items-center flex-wrap bg-surface-container border border-outline rounded-3xl p-4 gap-4 w-full md:w-auto" style="gap: 1rem; justify-content: flex-start;">
         <div class="flex flex-col gap-1 w-full md:w-44" style="min-width: 130px;">
            <label class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Date Filter</label>
            <select class="bg-surface-container-low border-none font-bold text-xs" style="padding: 0.5rem 1rem; border-radius: 0.75rem; width: 100%;" onchange="app.handlers.handleSetDashboardFilter('dateRange', this.value)">
               <option value="Month" ${dateRangeFilter === 'Month' ? 'selected' : ''}>This Month</option>
               <option value="30Days" ${dateRangeFilter === '30Days' ? 'selected' : ''}>Last 30 Days</option>
               <option value="6Months" ${dateRangeFilter === '6Months' ? 'selected' : ''}>Last 6 Months</option>
               <option value="All" ${dateRangeFilter === 'All' ? 'selected' : ''}>All Time</option>
               <option value="Custom" ${dateRangeFilter === 'Custom' ? 'selected' : ''}>Custom Range</option>
            </select>
         </div>
         
         ${dateRangeFilter === 'Custom' ? `
            <div class="flex flex-col gap-1 w-full md:w-40" style="min-width: 130px;">
               <label class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Start Date</label>
               <input type="date" value="${state.dashboardFilters?.startDate || ''}" class="bg-surface-container-low border-none font-bold text-xs text-on-surface" style="padding: 0.4rem 0.8rem; border-radius: 0.75rem; border: 1px solid var(--outline); color: var(--on-surface); background: var(--surface-container-low); width: 100%;" onchange="app.handlers.handleSetDashboardFilter('startDate', this.value)">
            </div>
            <div class="flex flex-col gap-1 w-full md:w-40" style="min-width: 130px;">
               <label class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">End Date</label>
               <input type="date" value="${state.dashboardFilters?.endDate || ''}" class="bg-surface-container-low border-none font-bold text-xs text-on-surface" style="padding: 0.4rem 0.8rem; border-radius: 0.75rem; border: 1px solid var(--outline); color: var(--on-surface); background: var(--surface-container-low); width: 100%;" onchange="app.handlers.handleSetDashboardFilter('endDate', this.value)">
            </div>
         ` : ''}
      </div>
    </div>

    <div class="stats-grid mt-8">
      <div class="stat-card">
        <div class="flex justify-between items-center mb-4">
          <div class="stat-icon" style="background: var(--secondary-container); color: var(--secondary)">${ICONS.inventory}</div>
          <span class="text-xs font-bold" style="color: var(--secondary)">+12% tracking</span>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Inventory Value</p>
          <p class="headline text-2xl font-black">₹${state.stats.inventoryValue.toLocaleString('en-IN')}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="flex justify-between items-center mb-4">
          <div class="stat-icon" style="background: var(--primary-container); color: var(--primary)">${ICONS.analytics}</div>
          <span class="text-xs font-bold" style="color: var(--primary)">Dynamic Range</span>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">${salesStatLabel}</p>
          <p class="headline text-2xl font-black">₹${periodSales.toLocaleString('en-IN')}</p>
        </div>
      </div>
      <div class="stat-card" style="background: var(--tertiary); color: white">
        <div class="flex justify-between items-center mb-4">
          <div class="stat-icon" style="background: rgba(255,255,255,0.2); color: white">${ICONS.dashboard}</div>
          <span class="text-xs font-bold uppercase tracking-wider">Urgent</span>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest opacity-60">Low Stock Alerts</p>
          <p class="headline text-2xl font-black">${state.stats.lowStock} Items</p>
        </div>
      </div>
    </div>

    <!-- Analytics Chart -->
    <div class="card mt-8">
       <div class="flex justify-between items-center mb-8" style="margin-bottom: 1.5rem;">
          <h3 class="font-bold text-xl">Monthly Sales Overview</h3>
          <button class="btn btn-outline" onclick="app.router.navigate('analytics')">View Full Report</button>
       </div>
       <div class="bar-chart">
          ${(dynamicChartData || []).map((d: any) => `
             <div class="bar ${d.isCurrent ? 'active' : ''}" style="height: ${Math.max(5, d.height)}%" data-label="${d.label}"></div>
          `).join('')}
       </div>
    </div>

    <div class="mt-8 flex gap-8 flex-col md:flex-row" style="gap: 2rem;">
       <div class="card overflow-hidden" style="flex: 2">
          <div class="flex justify-between items-center mb-6" style="margin-bottom: 1.5rem;">
            <h3 class="font-bold text-xl">Recent Orders</h3>
            <button class="btn btn-outline" onclick="app.router.navigate('invoices')">View All</button>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table">
               <thead>
                 <tr>
                   <th>Customer</th>
                   <th>Order ID</th>
                   <th>Amount</th>
                   <th>Status</th>
                 </tr>
               </thead>
               <tbody>
                 ${filteredInvoices.length === 0 ? '<tr><td colspan="4" class="text-center opacity-30 py-8">No matching activity</td></tr>' : 
                   filteredInvoices.slice(0, 5).map((inv: any) => `
                     <tr>
                       <td class="font-bold">${inv.customer}</td>
                       <td class="text-on-surface-variant font-mono text-xs">${inv.id}</td>
                       <td class="font-bold">₹${inv.amount.toLocaleString('en-IN')}</td>
                       <td><span class="text-xs px-2 py-1 rounded-full" style="background: ${inv.status === 'Paid' ? 'var(--secondary-container)' : 'var(--tertiary-container)'}">${inv.status}</span></td>
                     </tr>
                   `).join('')}
               </tbody>
            </table>
          </div>
       </div>
       <div class="card" style="flex: 1">
          <h3 class="font-bold text-xl mb-6" style="margin-bottom: 1.5rem;">Top Selling</h3>
          <ul class="flex flex-col gap-4" style="display: flex; flex-direction: column; gap: 1rem;">
             ${(topSelling || []).map((ts: any) => `
               <li class="flex items-center gap-4" style="display: flex; align-items: center; gap: 1rem;">
                  <div class="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary overflow-hidden" style="width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-center; overflow: hidden; flex-shrink: 0;">
                      ${ts.image ? `<img src="${ts.image}" style="width:44px;height:44px;min-width:44px;max-width:44px;object-fit:cover;border-radius:8px;flex:none;display:block;background:#eee" loading="lazy" decoding="async" onerror="this.style.visibility='hidden'">` : ICONS.inventory}
                  </div>
                  <div>
                     <p class="font-bold text-sm">${ts.name}</p>
                     <p class="text-xs text-on-surface-variant">${ts.qty > 0 ? `${ts.qty} sold` : 'New arrival'}</p>
                  </div>
                  <div class="ml-auto font-bold" style="margin-left: auto;">₹${ts.price.toLocaleString('en-IN')}</div>
               </li>
             `).join('')}
          </ul>
       </div>
    </div>
  `;
  },
  products: () => `
<div class="view-header flex justify-between items-start md:items-end">
  <div>
    <h2 class="font-black text-4xl md:text-5xl">Inventory Ledger</h2>
    <p class="text-on-surface-variant mt-2">Manage your premium product catalogue.</p>
  </div>
  <button class="btn btn-primary w-full md:w-auto" onclick="app.router.navigate('add-product')">${ICONS.add} New Product</button>
</div>
    <div class="card mt-8 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Supplier</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
             ${state.products.map((p: any) => `
               <tr>
                  <td class="font-bold"><div style="display:flex;align-items:center;gap:.75rem">
                     <div class="rounded-lg bg-surface-container-highest overflow-hidden" style="width:44px;height:44px;min-width:44px;flex:none">
                        ${(p.image_url || (p.images ?? [])[0]) ? `<img src="${p.image_url || (p.images ?? [])[0]}" style="width:44px;height:44px;min-width:44px;max-width:44px;object-fit:cover;border-radius:8px;flex:none;display:block;background:#eee" loading="lazy" decoding="async" onerror="this.style.visibility='hidden'">` : `<div class="w-full h-full flex items-center justify-center opacity-40">${ICONS.inventory}</div>`}
                     </div>
                     ${p.name}${p.show_on_storefront === false ? ' <span style="font-size:.65rem;font-weight:600;padding:.1rem .5rem;border-radius:999px;background:#e5e7eb;color:#4b5563;white-space:nowrap">Hidden on website</span>' : ''}</div>
                  </td>
                  <td class="font-mono text-xs">${p.sku}</td>
                  <td><span class="text-xs px-2 py-1 rounded-full" style="background: var(--surface-container-highest)">${esc(p.category)}</span></td>
                  <td>${p.brand || 'Luxury'}</td>
                  <td class="font-bold">₹${(p.selling_price || 0).toLocaleString('en-IN')}</td>
                  <td><span class="text-xs px-2 py-1 rounded-full" style="background: var(--surface-container); color: ${p.stock_level < p.low_stock_threshold ? 'var(--error)' : 'var(--secondary)'}">${p.stock_level} in stock</span></td>
                  <td><button class="btn btn-outline small" onclick="app.handlers.handleEditProduct('${p.id}')">Edit</button></td>
               </tr>
             `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `,
  'add-product': () => `
    <div class="view-header">
      <h2 class="font-black text-4xl md:text-5xl">${state.editingProductId ? 'Edit Product' : 'New Entry'}</h2>
      <p class="text-on-surface-variant mt-2">${state.editingProductId ? 'Updating existing inventory specifications.' : 'Populating core inventory catalog.'}</p>
    </div>
    <div class="flex flex-col md:flex-row gap-8 mt-8">
      <div class="flex-1 space-y-8">
        <div class="card">
          <h3 class="font-bold text-xl mb-6">Core Identity</h3>
          <div class="flex flex-col gap-4">
             <div class="flex flex-col gap-1">
                <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Product Name</label>
                <input type="text" placeholder="e.g. Vintage Leather Messenger Bag" class="w-full" value="${state.newProduct.name}" oninput="state.newProduct.name = this.value">
             </div>
             <div class="flex flex-col sm:flex-row gap-4">
                <div class="flex flex-col gap-1 flex-1">
                    <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">SKU</label>
                    <input type="text" placeholder="BAG-LTH-001" class="w-full" value="${state.newProduct.sku}" oninput="state.newProduct.sku = this.value">
                </div>
                <div class="flex flex-col gap-1 flex-1">
                    <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Category</label>
                    ${categoryFieldHtml()}
                </div>
             </div>
          </div>
        </div>
        <div class="card">
           <h3 class="font-bold text-xl mb-6">Media Gallery</h3>
           <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(8.5rem,1fr));gap:1rem">
              ${(state.newProduct.images || []).map((u: string, i: number) => `
                <div class="rounded-2xl overflow-hidden bg-surface-container-low" style="border:1px solid var(--outline-variant, #ddd)">
                  <div style="position:relative;aspect-ratio:1/1">
                    <img src="${u}" class="w-full h-full object-cover" style="width:100%;height:100%;object-fit:cover">
                    ${i === 0 ? `<span style="position:absolute;top:.4rem;left:.4rem;background:var(--primary,#E87AAE);color:#fff;font-size:.6rem;font-weight:900;padding:.1rem .5rem;border-radius:999px">Main</span>` : ''}
                  </div>
                  <div class="flex gap-1 p-2">
                    ${i !== 0 ? `<button class="btn btn-outline small" style="flex:1" onclick="app.handlers.handleMakeMainImage(${i})">Make main</button>` : ''}
                    <button class="btn btn-outline small" style="flex:1" onclick="app.handlers.handleRemoveImage(${i})">Remove</button>
                  </div>
                </div>`).join('')}
           </div>
           <button class="btn btn-primary mt-4" ${state.uploadingImages ? 'disabled' : ''} onclick="app.handlers.uploadImage()">${state.uploadingImages ? 'Uploading...' : `${ICONS.add} Add images`}</button>
           <p class="text-[10px] opacity-60 mt-2">JPEG, PNG or WebP, max 5MB each. First image is the main image.</p>
        </div>
      </div>
      <div class="md:w-25rem space-y-8">
        <div class="card bg-surface-container-low border-primary/20">
           <h3 class="font-black text-xl mb-6 tracking-tight text-primary">Economics</h3>
           <div class="space-y-4">
              <div>
                 <label class="text-[10px] opacity-60 font-black uppercase tracking-widest text-on-surface-variant">Selling Price Strategy</label>
                 <div class="flex items-center gap-2 mt-2">
                    <span class="text-3xl opacity-40 font-black text-on-surface">₹</span>
                    <input type="number" placeholder="0.00" class="w-full bg-transparent border-none text-4xl font-black text-on-surface focus:ring-0 p-0 placeholder:opacity-20" value="${state.newProduct.selling_price || ''}" oninput="state.newProduct.selling_price = parseFloat(this.value) || 0;">
                 </div>
              </div>
           </div>
        </div>
        <div class="card">
           <h3 class="font-bold text-xl mb-6">Logistics</h3>
           <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-1">
                 <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Initial Stock</label>
                 <input type="number" class="w-full" value="${state.newProduct.stock_level}" oninput="state.newProduct.stock_level = parseInt(this.value) || 0">
              </div>
              <label style="display:flex;align-items:flex-start;gap:.5rem;cursor:pointer">
                 <input type="checkbox" style="margin-top:.2rem" ${state.newProduct.show_on_storefront !== false ? 'checked' : ''} onchange="state.newProduct.show_on_storefront = this.checked">
                 <span><span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Show on website</span><br><span class="text-xs text-on-surface-variant">Untick to hide this product from the public store; it stays in inventory.</span></span>
              </label>
           </div>
        </div>
        <button class="btn btn-primary w-full py-4 text-sm" onclick="app.handlers.handleSaveProduct()">Save Specifications</button>
      </div>
    </div>
  `,
  invoices: () => `
<div class="view-header flex justify-between items-start md:items-end">
  <div>
    <h2 class="font-black text-4xl md:text-5xl">Billing & Invoices</h2>
    <p class="text-on-surface-variant mt-2">Professional invoice generation and tracking.</p>
  </div>
  <button class="btn btn-primary w-full md:w-auto" onclick="app.handlers.handleNewInvoice()">${ICONS.add} Create Invoice</button>
</div>
    <div class="card mt-8 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="data-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status / Paid To</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
           ${state.invoices.map((inv: any) => `
             <tr>
                <td class="font-bold">${inv.id}</td>
                <td>${inv.customer}</td>
                <td>${inv.date}</td>
                <td class="font-bold">₹${inv.amount.toLocaleString('en-IN')}</td>
                <td>
                  <div class="flex gap-2 items-center">
                    <select onchange="app.handlers.handleUpdateInvoiceStatus('${inv.id}', this.value)" class="text-xs px-2 py-1 rounded-full border-none font-bold" style="background: ${inv.status === 'Paid' ? 'var(--secondary-container)' : inv.status === 'Unpaid' ? 'var(--error-container)' : 'var(--surface-container-highest)'}">
                      <option value="Paid" ${inv.status === 'Paid' ? 'selected' : ''}>Paid</option>
                      <option value="Unpaid" ${inv.status === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
                      <option value="Partial" ${inv.status === 'Partial' ? 'selected' : ''}>Partial</option>
                      <option value="Draft" ${inv.status === 'Draft' ? 'selected' : ''}>Draft</option>
                    </select>
                    ${inv.status === 'Paid' ? `
                    <select onchange="app.handlers.handleUpdateInvoicePaidTo('${inv.id}', this.value)" class="text-xs px-2 py-1 rounded-full border-none font-bold bg-surface-container-highest max-w-[100px]">
                      <option value="">Paid To</option>
                      <option value="MEHUL" ${inv.paid_to === 'MEHUL' ? 'selected' : ''}>MEHUL</option>
                      <option value="SIMARPREET" ${inv.paid_to === 'SIMARPREET' ? 'selected' : ''}>SIMARPREET</option>
                      <option value="DALBIR" ${inv.paid_to === 'DALBIR' ? 'selected' : ''}>DALBIR</option>
                    </select>
                    ` : ''}
                  </div>
                </td>
                 <td>
                  <div class="flex gap-2 items-center">
                    <button class="btn btn-outline btn-xs opacity-80 hover:opacity-100" onclick="app.handlers.handleSelectInvoice('${inv.id}')">View</button>
                    <button class="btn btn-outline btn-xs opacity-80 hover:opacity-100" onclick="app.handlers.handleEditInvoice('${inv.id}')">Edit</button>
                    <button class="btn btn-error btn-xs opacity-85 hover:opacity-100" onclick="app.handlers.handleDeleteInvoice('${inv.id}')">Delete</button>
                  </div>
                 </td>
             </tr>
           `).join('')}
        </tbody>
      </table>
      </div>
    </div>
  `,
  'view-invoice': () => {
    const invId = state.selectedInvoice || state.invoices[0]?.id;
    const inv = state.invoices.find((i: any) => i.id === invId);
    if (!inv) return `<div class="p-20 text-center">Invoice not found</div>`;

    return `
      <div class="view-header flex justify-between items-start md:items-end">
        <div>
          <button class="mb-4 text-primary font-bold text-xs uppercase flex items-center gap-2" onclick="app.router.navigate('invoices')">← Back to Invoices</button>
          <h2 class="font-black text-4xl md:text-5xl">Invoice ${inv.id}</h2>
          <p class="text-on-surface-variant mt-2">Client: ${inv.customer} • Issued on ${inv.date}</p>
        </div>
        <div class="flex gap-4 w-full md:w-auto mt-4 md:mt-0 flex-wrap">
           <button class="btn btn-outline flex-1 md:flex-none" onclick="window.print()">Print</button>
           <button class="btn btn-outline flex-1 md:flex-none" onclick="app.handlers.handleEditInvoice('${inv.id}')">Edit Invoice</button>
           <button class="btn btn-error flex-1 md:flex-none" onclick="app.handlers.handleDeleteInvoice('${inv.id}')">Delete</button>
           <button class="btn btn-primary flex-1 md:flex-none" onclick="app.handlers.handleGeneratePDF('${inv.id}')">Generate PDF</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8" id="invoice-view-container">
         <div class="md:col-span-2 space-y-8">
            <div class="card">
               <div class="flex justify-between items-center mb-6">
                  <h3 class="font-bold text-xl">Payment Status</h3>
                  <span class="text-xs px-3 py-1 rounded-full font-black uppercase tracking-widest" style="background: ${inv.status === 'Paid' ? 'var(--secondary-container)' : 'var(--error-container)'}; color: ${inv.status === 'Paid' ? 'var(--secondary)' : 'var(--error)'}">${inv.status}</span>
               </div>
               <div class="flex gap-4">
                  <button class="btn flex-1 ${inv.status === 'Unpaid' ? 'btn-primary' : 'btn-outline'}" onclick="app.handlers.handleUpdateInvoiceStatus('${inv.id}', 'Unpaid')">Unpaid</button>
                  <button class="btn flex-1 ${inv.status === 'Partial' ? 'btn-primary' : 'btn-outline'}" onclick="app.handlers.handleUpdateInvoiceStatus('${inv.id}', 'Partial')">Partial</button>
                  <button class="btn flex-1 ${inv.status === 'Paid' ? 'btn-primary' : 'btn-outline'}" onclick="app.handlers.handleUpdateInvoiceStatus('${inv.id}', 'Paid')">Paid</button>
               </div>
               ${inv.status === 'Paid' ? `
               <div class="mt-6 pt-6 border-t border-outline-variant">
                  <label class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-2 block">Paid To</label>
                  <select class="w-full bg-surface-container-highest/40 border-none rounded-xl px-4 py-3 font-bold" onchange="app.handlers.handleUpdateInvoicePaidTo('${inv.id}', this.value)">
                     <option value="">-- Select Receiver --</option>
                     <option value="MEHUL" ${inv.paid_to === 'MEHUL' ? 'selected' : ''}>MEHUL</option>
                     <option value="SIMARPREET" ${inv.paid_to === 'SIMARPREET' ? 'selected' : ''}>SIMARPREET</option>
                     <option value="DALBIR" ${inv.paid_to === 'DALBIR' ? 'selected' : ''}>DALBIR</option>
                  </select>
               </div>
               ` : ''}
            </div>
            
            <div class="card overflow-hidden">
               <h3 class="font-bold text-xl mb-6">Items</h3>
               <div class="overflow-x-auto">
                 <table class="data-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th class="text-center">Qty</th>
                      <th class="text-right">Price</th>
                      <th class="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(inv.items || []).length === 0 ? `
                      <tr><td colspan="4" class="text-center py-4 opacity-50">No items on this invoice</td></tr>
                    ` : (inv.items || []).map((item: any) => `
                    <tr>
                      <td class="font-bold">${item.description}</td>
                      <td class="text-center">${item.quantity}</td>
                      <td class="text-right">₹${item.unit_price.toLocaleString('en-IN')}</td>
                      <td class="text-right font-black text-primary">₹${item.total_price.toLocaleString('en-IN')}</td>
                    </tr>
                    `).join('')}
                  </tbody>
               </table>
               </div>
            </div>
         </div>

         <div class="space-y-8">
            <div class="card">
               <h3 class="font-bold text-xl mb-6">Summary</h3>
               <div class="space-y-4">
                  <div class="flex justify-between">
                     <span class="text-on-surface-variant">Subtotal</span>
                     <span class="font-bold">₹${(inv.amount - (inv.shipping || 0)).toLocaleString('en-IN')}</span>
                  </div>
                  ${inv.shipping > 0 ? `<div class="flex justify-between">
                     <span class="text-on-surface-variant">Shipping</span>
                     <span class="font-bold">₹${inv.shipping.toLocaleString('en-IN')}</span>
                  </div>` : ''}
                  <div class="flex justify-between">
                     <span class="text-on-surface-variant">Tax</span>
                     <span class="font-bold">₹0</span>
                  </div>
                  <div class="pt-4 border-t border-outline-variant flex justify-between items-end">
                     <div>
                        <p class="text-[10px] font-black uppercase tracking-widest opacity-40">Grand Total</p>
                        <span class="font-black text-3xl">₹${inv.amount.toLocaleString('en-IN')}</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    `;
  },
  search: () => `
    <div class="view-header">
      <h2 class="font-black text-4xl md:text-5xl">Smart Search.</h2>
      <div class="mt-8 flex flex-col md:flex-row gap-4 search-bar-container">
        <div class="flex items-center px-4 text-primary w-full md:w-auto">
          ${ICONS.search}
          <input type="text" id="search-input" value="${state.searchQuery}" class="search-input" placeholder="Explore inventory..." onkeyup="app.handlers.handleSearch(this.value)">
        </div>
        <button class="btn btn-primary rounded-xl" onclick="app.handlers.handleSearch(document.getElementById('search-input').value)">Search Database</button>
      </div>
    </div>
    <div class="mt-8">
      <h3 class="font-bold text-xl mb-6" id="search-count-header">${state.searchQuery ? `Search results for "${state.searchQuery}"` : 'Quick Actions'}</h3>
      
      <div id="search-results-root">
        ${state.searchQuery === '' ? `
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
           <div class="card hover:border-primary transition-all cursor-pointer group" onclick="app.router.navigate('add-product')">
              <div class="stat-icon mb-4 group-hover:scale-110 transition-transform" style="background: var(--primary-container); color: var(--primary)">${ICONS.add}</div>
              <p class="font-bold">Add New Product</p>
              <p class="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">Direct Catalog Entry</p>
           </div>
           <div class="card hover:border-primary transition-all cursor-pointer group" onclick="app.handlers.handleNewInvoice()">
              <div class="stat-icon mb-4 group-hover:scale-110 transition-transform" style="background: var(--secondary-container); color: var(--secondary)">${ICONS.invoices}</div>
              <p class="font-bold">Create Invoice</p>
              <p class="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">Financial Billing</p>
           </div>
           <div class="card hover:border-primary transition-all cursor-pointer group" onclick="app.router.navigate('products')">
              <div class="stat-icon mb-4 group-hover:scale-110 transition-transform" style="background: var(--tertiary-container); color: var(--tertiary)">${ICONS.inventory}</div>
              <p class="font-bold">Check Stock</p>
              <p class="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">Logistics Sync</p>
           </div>
        </div>
      ` : `
        <div class="space-y-4">
           ${state.searchResults.length === 0 ? `
              <div class="flex items-center justify-center p-20 opacity-30 flex-col">
                 ${ICONS.search}
                 <p class="mt-4">No results found for "${state.searchQuery}"</p>
              </div>
           ` : state.searchResults.map((res: any) => utils.renderSearchItem(res)).join('')}
        </div>
      `}
      </div>
    </div>
  `,
  analytics: () => {
     const memberFilter = state.analyticsFilters?.member || 'All';
     const dateRangeFilter = state.analyticsFilters?.dateRange || 'All';
     
     // 1. Filter Invoices
     let filteredInvoices = [...state.invoices];
     
     // Filter by date range first
     const now = new Date();
     if (dateRangeFilter === 'Month') {
        filteredInvoices = filteredInvoices.filter((inv: any) => {
           if (!inv.raw_date) return false;
           const d = new Date(inv.raw_date);
           return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
     } else if (dateRangeFilter === '30Days') {
        filteredInvoices = filteredInvoices.filter((inv: any) => {
           if (!inv.raw_date) return false;
           const d = new Date(inv.raw_date);
           return (now.getTime() - d.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        });
     } else if (dateRangeFilter === '6Months') {
        filteredInvoices = filteredInvoices.filter((inv: any) => {
           if (!inv.raw_date) return false;
           const d = new Date(inv.raw_date);
           return (now.getTime() - d.getTime()) <= 6 * 30 * 24 * 60 * 60 * 1000;
        });
     } else if (dateRangeFilter === 'Custom') {
        const start = state.analyticsFilters?.startDate ? new Date(state.analyticsFilters.startDate) : null;
        const end = state.analyticsFilters?.endDate ? new Date(state.analyticsFilters.endDate) : null;
        filteredInvoices = filteredInvoices.filter((inv: any) => {
           if (!inv.raw_date) return false;
           const d = new Date(inv.raw_date);
           const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
           if (start && end) {
              const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
              const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
              return dTime >= startTime && dTime <= endTime;
           } else if (start) {
              const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
              return dTime >= startTime;
           } else if (end) {
              const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
              return dTime <= endTime;
           }
           return true;
        });
     }
     
     // Filter by member (paid_to) - for charts other than Member Payments
     let memberFilteredInvoices = [...filteredInvoices];
     if (memberFilter !== 'All') {
        memberFilteredInvoices = memberFilteredInvoices.filter((inv: any) => {
           if (memberFilter === 'Others') {
              return inv.status === 'Paid' && (!inv.paid_to || !['MEHUL', 'SIMARPREET', 'DALBIR'].includes(inv.paid_to.toUpperCase()));
           }
           return inv.status === 'Paid' && inv.paid_to && inv.paid_to.toUpperCase() === memberFilter.toUpperCase();
        });
     }

     // 2. Recalculate Revenue Momentum based on memberFilteredInvoices sales
     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
     const chartData = [];
     let maxMonthSales = 0;
     for (let i = 5; i >= 0; i--) {
         const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
         const monthSales = memberFilteredInvoices.reduce((acc: any, inv: any) => {
            if (!inv.raw_date) return acc;
            const idate = new Date(inv.raw_date);
            if (idate.getMonth() === d.getMonth() && idate.getFullYear() === d.getFullYear()) return acc + Number(inv.amount || 0);
            return acc;
         }, 0);
         if (monthSales > maxMonthSales) maxMonthSales = monthSales;
         chartData.push({ label: months[d.getMonth()], sales: monthSales, isCurrent: i === 0 });
     }
     const dynamicChartData = chartData.map((d: any) => ({ ...d, height: maxMonthSales > 0 ? (d.sales / maxMonthSales * 100) : 0 }));

     // 3. Recalculate Category Split based on memberFilteredInvoices sales
     const categoryValue: any = {};
     let totalVal = 0;
     memberFilteredInvoices.forEach((inv: any) => {
        (inv.items || []).forEach((item: any) => {
           const prod = state.products.find((p: any) => p.id === item.product_id);
           const cat = prod?.category || 'Uncategorized';
           const val = Number(item.total_price || item.unit_price * item.quantity || 0);
           categoryValue[cat] = (categoryValue[cat] || 0) + val;
           totalVal += val;
        });
     });
     
     let dynamicCategorySplit = Object.entries(categoryValue).map(([name, val]) => {
        const pct = totalVal > 0 ? Math.round((val as number) / totalVal * 100) : 0;
        return { name, pct, value: val };
     }).sort((a: any, b: any) => (b.value as number) - (a.value as number));

     if (totalVal === 0) {
        dynamicCategorySplit = state.stats.categorySplit || [];
     }

     // 4. Recalculate Member Payments collections based on date-filtered invoices
     const paidToData: any = {
        'MEHUL': 0,
        'SIMARPREET': 0,
        'DALBIR': 0,
        'Others': 0
     };
     let totalPaid = 0;
     filteredInvoices.forEach((inv: any) => {
        if (inv.status === 'Paid') {
           const amt = Number(inv.amount || 0);
           const receiver = inv.paid_to ? inv.paid_to.toUpperCase() : 'Others';
           if (paidToData[receiver] !== undefined) {
              paidToData[receiver] += amt;
           } else {
              paidToData[receiver] = amt;
           }
           totalPaid += amt;
        }
     });
     const dynamicPaidTo = Object.entries(paidToData)
        .map(([name, amount]) => {
           const pct = totalPaid > 0 ? Math.round((amount as number) / totalPaid * 100) : 0;
           return { name, amount, pct };
        })
        .sort((a: any, b: any) => (b.amount as number) - (a.amount as number))
        .filter(x => (x.amount as number) > 0 || ['MEHUL', 'SIMARPREET', 'DALBIR'].includes(x.name));

     // 5. Recalculate Paid vs Pending balance split based on memberFilteredInvoices
     let totalPaidAmount = 0;
     let totalPendingAmount = 0;
     memberFilteredInvoices.forEach((inv: any) => {
        const amt = Number(inv.amount || 0);
        if (inv.status === 'Paid') {
           totalPaidAmount += amt;
        } else {
           totalPendingAmount += amt;
        }
     });
     const totalOverall = totalPaidAmount + totalPendingAmount;
     const dynamicPaymentBreakdown = {
        paid: totalPaidAmount,
        pending: totalPendingAmount,
        paidPct: totalOverall > 0 ? Math.round(totalPaidAmount / totalOverall * 100) : 0,
        pendingPct: totalOverall > 0 ? Math.round(totalPendingAmount / totalOverall * 100) : 0
     };

     return `
    <div class="view-header flex justify-between items-start md:items-end flex-wrap gap-4" style="margin-bottom: 2rem;">
      <div>
        <h2 class="font-black text-4xl md:text-5xl">Performance Depth.</h2>
        <p class="text-on-surface-variant mt-2">Historical trends and predictive sales data.</p>
      </div>
      
      <!-- Premium Filter Controls -->
      <div class="flex items-center flex-wrap bg-surface-container border border-outline rounded-3xl p-4 gap-4 w-full md:w-auto" style="gap: 1rem; justify-content: flex-start;">
         <div class="flex flex-col gap-1 w-full md:w-44" style="min-width: 130px;">
            <label class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Member Filter</label>
            <select class="bg-surface-container-low border-none font-bold text-xs" style="padding: 0.5rem 1rem; border-radius: 0.75rem; width: 100%;" onchange="app.handlers.handleSetAnalyticsFilter('member', this.value)">
               <option value="All" ${memberFilter === 'All' ? 'selected' : ''}>All Members</option>
               <option value="MEHUL" ${memberFilter === 'MEHUL' ? 'selected' : ''}>MEHUL</option>
               <option value="SIMARPREET" ${memberFilter === 'SIMARPREET' ? 'selected' : ''}>SIMARPREET</option>
               <option value="DALBIR" ${memberFilter === 'DALBIR' ? 'selected' : ''}>DALBIR</option>
               <option value="Others" ${memberFilter === 'Others' ? 'selected' : ''}>Others</option>
            </select>
         </div>
         
         <div class="flex flex-col gap-1 w-full md:w-44" style="min-width: 130px;">
            <label class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Date Range</label>
            <select class="bg-surface-container-low border-none font-bold text-xs" style="padding: 0.5rem 1rem; border-radius: 0.75rem; width: 100%;" onchange="app.handlers.handleSetAnalyticsFilter('dateRange', this.value)">
               <option value="All" ${dateRangeFilter === 'All' ? 'selected' : ''}>All Time</option>
               <option value="Month" ${dateRangeFilter === 'Month' ? 'selected' : ''}>This Month</option>
               <option value="30Days" ${dateRangeFilter === '30Days' ? 'selected' : ''}>Last 30 Days</option>
               <option value="6Months" ${dateRangeFilter === '6Months' ? 'selected' : ''}>Last 6 Months</option>
               <option value="Custom" ${dateRangeFilter === 'Custom' ? 'selected' : ''}>Custom Range</option>
            </select>
         </div>
         
         ${dateRangeFilter === 'Custom' ? `
            <div class="flex flex-col gap-1 w-full md:w-40" style="min-width: 130px;">
               <label class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Start Date</label>
               <input type="date" value="${state.analyticsFilters?.startDate || ''}" class="bg-surface-container-low border-none font-bold text-xs text-on-surface" style="padding: 0.4rem 0.8rem; border-radius: 0.75rem; border: 1px solid var(--outline); color: var(--on-surface); background: var(--surface-container-low); width: 100%;" onchange="app.handlers.handleSetAnalyticsFilter('startDate', this.value)">
            </div>
            <div class="flex flex-col gap-1 w-full md:w-40" style="min-width: 130px;">
               <label class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">End Date</label>
               <input type="date" value="${state.analyticsFilters?.endDate || ''}" class="bg-surface-container-low border-none font-bold text-xs text-on-surface" style="padding: 0.4rem 0.8rem; border-radius: 0.75rem; border: 1px solid var(--outline); color: var(--on-surface); background: var(--surface-container-low); width: 100%;" onchange="app.handlers.handleSetAnalyticsFilter('endDate', this.value)">
            </div>
         ` : ''}
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 mt-8" style="gap: 2.5rem;">
       <!-- Revenue Momentum -->
       <div class="card">
          <h3 class="font-bold text-xl mb-6">Revenue Momentum</h3>
          <div class="bar-chart">
             ${(dynamicChartData || []).map((d: any) => `
                <div class="bar ${d.isCurrent ? 'active' : ''}" style="height: ${Math.max(5, d.height)}%" data-label="${d.label}"></div>
             `).join('')}
          </div>
       </div>

       <!-- Category Split -->
       <div class="card">
          <h3 class="font-bold text-xl mb-6">Category Split</h3>
          <div class="flex flex-col" style="gap: 1.5rem;">
             ${(dynamicCategorySplit || []).length === 0 ? `
                <div class="flex flex-col items-center justify-center py-8 opacity-40">
                   <p class="text-xs font-bold">No product inventory categorized yet</p>
                </div>
             ` : (dynamicCategorySplit || []).map((cat: any, index: number) => {
                const color = CAT_COLORS[index % CAT_COLORS.length];
                return `
                   <div class="flex flex-col" style="gap: 0.5rem;">
                      <div class="flex justify-between text-xs font-bold uppercase opacity-60">
                         <span>${esc(cat.name)}</span>
                         <span>${cat.pct}%</span>
                      </div>
                      <div style="width: 100%; height: 8px; background: var(--surface-container-highest); border-radius: 9999px; overflow: hidden;">
                         <div style="height: 100%; border-radius: 9999px; background: ${color}; width: ${cat.pct}%"></div>
                      </div>
                   </div>
                `;
             }).join('')}
          </div>
       </div>

       <!-- Member Payments -->
       <div class="card">
          <h3 class="font-bold text-xl mb-6">Member Payments (Collections)</h3>
          <div class="flex flex-col" style="gap: 1.5rem;">
             ${(dynamicPaidTo || []).length === 0 ? `
                <div class="flex flex-col items-center justify-center py-8 opacity-40">
                   <p class="text-xs font-bold">No payment collections tracked yet</p>
                </div>
             ` : (dynamicPaidTo || []).map((agent: any, index: number) => {
                const colors = ['var(--secondary)', 'var(--primary)', 'var(--tertiary)', 'var(--error)'];
                const color = colors[index % colors.length];
                return `
                   <div class="flex flex-col" style="gap: 0.5rem;">
                      <div class="flex justify-between text-xs font-bold uppercase opacity-60">
                         <span>${agent.name}</span>
                         <span>₹${agent.amount.toLocaleString('en-IN')} (${agent.pct}%)</span>
                      </div>
                      <div style="width: 100%; height: 8px; background: var(--surface-container-highest); border-radius: 9999px; overflow: hidden;">
                         <div style="height: 100%; border-radius: 9999px; background: ${color}; width: ${agent.pct}%"></div>
                      </div>
                   </div>
                `;
             }).join('')}
          </div>
       </div>

       <!-- Paid vs Pending breakdown -->
       <div class="card">
          <h3 class="font-bold text-xl mb-6">Outstanding Balance Breakdown</h3>
          <div class="flex flex-col" style="gap: 1.5rem;">
             <div class="flex justify-between items-center flex-wrap gap-2 text-xs font-bold uppercase opacity-60">
                <span>Payment Summary</span>
                <span class="text-xs font-mono font-bold">Total Sales: ₹${((dynamicPaymentBreakdown?.paid || 0) + (dynamicPaymentBreakdown?.pending || 0)).toLocaleString('en-IN')}</span>
             </div>
             
             <!-- Multi-segment progress bar representing split -->
             <div style="width: 100%; height: 16px; background: var(--surface-container-highest); border-radius: 9999px; overflow: hidden; display: flex;">
                <div class="transition-all" style="background: var(--secondary); width: ${dynamicPaymentBreakdown?.paidPct || 0}%; height: 100%;" title="Paid"></div>
                <div class="transition-all" style="background: var(--error); width: ${dynamicPaymentBreakdown?.pendingPct || 0}%; height: 100%;" title="Pending"></div>
             </div>
             
             <div class="flex justify-between items-center flex-wrap text-xs" style="gap: 1rem;">
                <div class="flex items-center gap-2 flex-wrap" style="display: flex; align-items: center; gap: 0.5rem;">
                   <div style="background: var(--secondary); width: 12px; height: 12px; border-radius: 50%; display: inline-block;"></div>
                   <span class="font-bold text-on-surface-variant">Paid:</span>
                   <span class="font-black">₹${(dynamicPaymentBreakdown?.paid || 0).toLocaleString('en-IN')} (${dynamicPaymentBreakdown?.paidPct || 0}%)</span>
                </div>
                <div class="flex items-center gap-2 flex-wrap" style="display: flex; align-items: center; gap: 0.5rem;">
                   <div style="background: var(--error); width: 12px; height: 12px; border-radius: 50%; display: inline-block;"></div>
                   <span class="font-bold text-on-surface-variant">Pending:</span>
                   <span class="font-black">₹${(dynamicPaymentBreakdown?.pending || 0).toLocaleString('en-IN')} (${dynamicPaymentBreakdown?.pendingPct || 0}%)</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  `;
  },
  auth: () => `
    <div class="auth-container">
       <div class="auth-card">
          <div class="text-center mb-10">
             <div class="brand-title text-4xl mb-2">Attrangii</div>
             <p class="text-on-surface-variant font-bold text-[10px] uppercase tracking-[0.2em]">Premium Executive Portal</p>
          </div>
          
          <div id="auth-error" class="hidden mb-6 p-4 rounded-xl text-[11px] font-bold" style="background: var(--error-container); color: var(--error); border: 1px solid var(--error)"></div>

          <form onsubmit="event.preventDefault(); app.handlers.handleAuth(this);" class="space-y-6">
             <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Professional Identity</label>
                  <input type="email" name="email" required placeholder="name@attrangii.com" class="w-full">
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Security Key</label>
                  <input type="password" name="password" required placeholder="••••••••" class="w-full">
                </div>
             </div>
             <button type="submit" class="btn btn-primary w-full py-4 rounded-xl" id="auth-submit">Enter Workspace</button>
          </form>

          <!-- 
          <div class="mt-12 pt-8 border-t border-outline-variant text-center">
             <p class="text-[10px] text-on-surface-variant mb-6 font-black uppercase tracking-widest opacity-60">System Provisioning</p>
             <button onclick="app.handlers.seedInitialUsers()" class="btn w-full" style="border: 1px solid var(--outline); font-size: 0.65rem; border-radius: 1rem; padding: 1rem;">
                Provision Requested Accounts
             </button>
             <div class="mt-6 flex flex-wrap justify-center gap-2">
                <span class="text-[9px] px-2 py-1 rounded bg-surface-container-highest opacity-50">Destiny</span>
                <span class="text-[9px] px-2 py-1 rounded bg-surface-container-highest opacity-50">Popu</span>
                <span class="text-[9px] px-2 py-1 rounded bg-surface-container-highest opacity-50">Squeaky</span>
             </div>
             <p class="text-[10px] mt-6 opacity-40 font-bold">Standard Password: attrangii123</p>
          </div>
          -->
       </div>
    </div>
  `,
  'create-invoice': () => {
    const inv = state.currentInvoice;
    const { subtotal, total } = utils.calculateInvoiceTotals(inv);

    return `
    <div class="view-header flex justify-between items-start md:items-end p-6 bg-surface-container-low rounded-3xl mb-8">
      <div>
        <h2 class="font-black text-4xl md:text-5xl">${state.editingInvoiceDbId ? 'Edit Invoice' : 'Create Invoice'}</h2>
        <p class="text-on-surface-variant mt-2">${state.editingInvoiceDbId ? `Modifying Invoice #${state.editingInvoiceNumber}` : 'Professional Financial Instrument • Draft Session'}</p>
      </div>
      <div class="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
         <button class="btn btn-outline flex-1 md:flex-none" onclick="app.router.navigate('invoices')">Cancel</button>
         <button class="btn btn-primary flex-1 md:flex-none shadow-lg shadow-primary/20" id="save-invoice-btn" onclick="app.handlers.handleSaveInvoice()">${state.editingInvoiceDbId ? 'Update & Save' : 'Confirm & Send'}</button>
      </div>
    </div>

    <div class="flex flex-col xl:flex-row gap-8 mt-8">
      <div class="flex-1 space-y-8 min-w-0">
        <!-- Client Card -->
        <div class="card overflow-hidden">
          <div class="flex items-center gap-3 mb-8">
             <div class="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-primary">${ICONS.dashboard}</div>
             <h3 class="font-black text-xl tracking-tight">Client Credentials</h3>
          </div>
          <div class="flex flex-col gap-6">
             <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="group">
                   <label class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 mb-2 block">Choose from Repository</label>
                   <select class="w-full bg-surface-container-highest/40 border-none rounded-xl px-4 py-3 font-bold" onchange="app.handlers.handleUpdateInvoiceHeader('customer_id', this.value)">
                      <option value="">-- Existing Customer --</option>
                      ${state.customers.map((c: any) => `
                        <option value="${c.id}" ${inv.customer_id === c.id ? 'selected' : ''}>${c.name}</option>
                      `).join('')}
                   </select>
                </div>
                <div class="group">
                   <label class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 mb-2 block">Create New Entry</label>
                   <input type="text" placeholder="Full Client Name" value="${inv.new_customer_name || ''}" class="w-full bg-surface-container-highest/40 border-none rounded-xl px-4 py-3 font-bold" oninput="app.handlers.handleUpdateInvoiceHeader('new_customer_name', this.value, true)">
                </div>
             </div>
             <div>
                <label class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 mb-2 block">Billing Directives / Location</label>
                <textarea placeholder="Enter full address or specialized billing instructions..." class="w-full bg-surface-container-highest/40 border-none rounded-xl px-4 py-3 font-bold" rows="2" style="resize: none;" oninput="app.handlers.handleUpdateInvoiceHeader('notes', this.value, true)">${inv.notes || ''}</textarea>
             </div>
          </div>
        </div>

        <!-- Line Items Card -->
        <div class="card bg-surface overflow-visible">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
             <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-secondary">${ICONS.inventory}</div>
                <h3 class="font-black text-xl tracking-tight whitespace-nowrap">Line Items</h3>
             </div>
             <div class="flex items-center gap-3 flex-1 w-full max-w-md relative">
                <input list="invoice-product-list" placeholder="Search inventory or select to add..." class="w-full bg-surface-container-highest/20 border-none rounded-xl px-4 py-2 text-xs font-bold" onchange="const p = state.availableProducts.find(x => x.name === this.value); if(p) { app.handlers.handleAddProductToInvoice(p.id); this.value = ''; }">
                <datalist id="invoice-product-list">
                   ${state.availableProducts.map((p: any) => `<option value="${p.name}">${p.sku} - ₹${p.selling_price.toLocaleString('en-IN')}</option>`).join('')}
                </datalist>
             </div>
             <button class="btn btn-outline text-xs h-10 px-6 rounded-xl shrink-0" onclick="app.handlers.handleAddInvoiceItem()">${ICONS.add} Custom</button>
          </div>

          <div class="space-y-1">
            <!-- Table Header - Desktop Only -->
            <div class="hidden md:flex gap-4 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40 border-b border-outline-variant/10">
               <div class="flex-1">Product Description</div>
               <div class="w-20 text-center">Qty</div>
               <div class="w-32 text-right">Unit Price</div>
               <div class="w-32 text-right">Total</div>
               <div class="w-10"></div>
            </div>

            <div id="invoice-items" class="divide-y divide-outline-variant/10">
              ${inv.items.length === 0 ? `
                <div class="flex flex-col items-center justify-center py-24 border-2 border-dashed border-outline-variant/20 rounded-3xl opacity-20">
                   <div class="w-16 h-16 rounded-3xl bg-surface-container-highest flex items-center justify-center mb-4">${ICONS.inventory}</div>
                   <p class="font-bold tracking-tight text-center px-6">Your transaction list is currently empty.</p>
                </div>
              ` : inv.items.map((item: any) => `
                <div class="flex flex-col md:flex-row gap-4 md:gap-4 items-start md:items-center p-6 md:p-3 md:px-6 rounded-3xl md:rounded-none bg-surface-container-low/30 md:bg-transparent hover:bg-surface-container-highest/20 transition-all group border-b border-outline-variant/5 last:border-b-0">
                  <!-- Product Name -->
                  <div class="w-full md:flex-1 relative">
                    <label class="md:hidden text-[9px] font-black uppercase tracking-widest opacity-40 mb-2 block">Item Specification</label>
                    <input list="products-list-${item.id}" 
                           placeholder="Scan SKU or Search..." 
                           class="w-full bg-surface-container-highest/40 md:bg-transparent border-none md:border-b md:border-outline-variant/20 rounded-xl md:rounded-none px-4 md:px-0 py-3 md:py-1 font-bold focus:ring-0 focus:border-primary text-sm" 
                           value="${item.description}"
                           onchange="const prod = state.availableProducts.find(p => p.name === this.value); if(prod) app.handlers.handleUpdateInvoiceItem(${item.id}, 'product_id', prod.id);">
                    <datalist id="products-list-${item.id}">
                       ${state.availableProducts.map((p: any) => `
                         <option value="${p.name}">${p.sku} • Stock: ${p.stock_level}</option>
                       `).join('')}
                    </datalist>
                  </div>
                  
                  <!-- Quantity -->
                  <div class="w-full md:w-20">
                       <label class="md:hidden text-[9px] font-black uppercase tracking-widest opacity-40 mb-2 block text-center">Qty</label>
                       <input type="number" value="${item.qty}" class="w-full md:bg-transparent border-none md:border-b md:border-outline-variant/20 rounded-xl md:rounded-none px-2 py-3 md:py-1 font-black text-center focus:ring-0 focus:border-primary text-sm" oninput="app.handlers.handleUpdateInvoiceItem(${item.id}, 'qty', parseInt(this.value) || 0, true)">
                  </div>

                  <!-- Unit Price -->
                  <div class="w-full md:w-32 relative">
                       <label class="md:hidden text-[9px] font-black uppercase tracking-widest opacity-40 mb-2 block text-right">Unit Val (₹)</label>
                       <input type="number" value="${item.price}" class="w-full md:bg-transparent border-none md:border-b md:border-outline-variant/20 rounded-xl md:rounded-none px-4 md:px-0 py-3 md:py-1 font-black text-right focus:ring-0 focus:border-primary text-sm" oninput="app.handlers.handleUpdateInvoiceItem(${item.id}, 'price', parseFloat(this.value) || 0, true)">
                  </div>

                  <!-- Item Total -->
                  <div class="w-full md:w-32 text-right">
                     <label class="md:hidden text-[9px] font-black uppercase tracking-widest opacity-40 mb-2 block">Line Net</label>
                     <div class="font-black px-4 md:px-0 py-3 md:py-1 text-primary text-sm" id="item-total-${item.id}">₹${(item.qty * (item.price || 0)).toLocaleString('en-IN')}</div>
                  </div>

                  <!-- Action -->
                  <div class="w-full md:w-10 flex justify-end">
                    <button class="bg-surface-container-highest hover:bg-error-container hover:text-error w-10 h-10 md:w-8 md:h-8 rounded-xl lg:rounded-lg transition-all flex items-center justify-center font-bold md:opacity-0 group-hover:md:opacity-100" onclick="app.handlers.handleRemoveInvoiceItem(${item.id})">×</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Panel -->
      <div class="xl:w-25rem space-y-8">
        <div class="card bg-secondary/5 border-2 border-secondary/10">
           <h3 class="font-black text-xl mb-8 tracking-tight">Financial Summary</h3>
           <div class="space-y-6">
              <div class="flex justify-between items-center opacity-60">
                 <span class="text-[10px] font-black uppercase tracking-[0.2em]">Gross Subtotal</span>
                 <span class="font-black" id="summary-subtotal">₹${subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div class="flex justify-between items-center group">
                 <div class="flex flex-col">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Discount Factor</span>
                    <span class="text-[9px] font-bold text-on-surface-variant">Applied Deduction</span>
                 </div>
                 <div class="flex items-center gap-2 bg-surface-container-highest/40 rounded-xl px-3 py-1">
                    <span class="text-xs opacity-40 font-bold">₹</span>
                    <input type="number" value="${inv.discount || 0}" style="width: 6rem; text-align: right; border: none; font-weight: 900; background: transparent; padding: 0.5rem 0;" oninput="app.handlers.handleUpdateInvoiceHeader('discount', parseFloat(this.value) || 0, true)">
                 </div>
              </div>
              <div class="flex justify-between items-center group">
                 <div class="flex flex-col">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Tax (GST) Integration</span>
                    <span class="text-[9px] font-bold text-on-surface-variant">Standard Percentage</span>
                 </div>
                 <div class="flex items-center gap-2 bg-surface-container-highest/40 rounded-xl px-3 py-1">
                    <input type="number" value="${inv.taxRate !== undefined ? inv.taxRate : 0}" style="width: 3rem; text-align: right; border: none; font-weight: 900; background: transparent; padding: 0.5rem 0;" oninput="app.handlers.handleUpdateInvoiceHeader('taxRate', parseFloat(this.value) || 0, true)">
                    <span class="text-xs opacity-40 font-bold">%</span>
                 </div>
              </div>
              <div class="flex justify-between items-center group">
                 <div class="flex flex-col">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Shipping charges (₹)</span>
                    <span class="text-[9px] font-bold text-on-surface-variant">Not taxed</span>
                 </div>
                 <div class="flex items-center gap-2 bg-surface-container-highest/40 rounded-xl px-3 py-1">
                    <span class="text-xs opacity-40 font-bold">₹</span>
                    <input type="number" min="0" step="1" value="${inv.shipping || 0}" style="width: 6rem; text-align: right; border: none; font-weight: 900; background: transparent; padding: 0.5rem 0;" oninput="app.handlers.handleUpdateInvoiceHeader('shipping', parseFloat(this.value) || 0, true)">
                 </div>
              </div>
              <div class="pt-8 border-t border-outline-variant flex justify-between items-end">
                 <span class="font-black text-secondary text-2xl uppercase tracking-tighter">Net Total</span>
                 <span class="font-black text-4xl" id="summary-total">₹${total.toLocaleString('en-IN')}</span>
              </div>
           </div>
        </div>

        <div class="card p-0 overflow-hidden bg-primary-container/20 border-primary-container">
           <div class="p-8 text-center bg-primary text-white">
              <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Transaction Estimate</p>
              <div class="font-black text-4xl" id="preview-total">₹${total.toLocaleString('en-IN')}</div>
           </div>
           <div class="p-8">
              <div class="flex items-center gap-4 mb-8 bg-white/50 p-4 rounded-2xl">
                 <div class="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-primary font-black text-xl">A</div>
                 <div class="text-left">
                    <p class="font-black text-sm uppercase tracking-tight">Executive Auth</p>
                    <p class="text-[10px] opacity-60">Session #2024-X</p>
                 </div>
              </div>
              <button class="btn btn-primary w-full py-5 rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-3" onclick="app.handlers.handleSaveInvoice()">
                 <span>${state.editingInvoiceDbId ? 'Update & Save' : 'Finalize & Persist Entry'}</span>
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
           </div>
        </div>
      </div>
    </div>
    `;
  },
};

// --- Application Logic ---
const app = {
  init: async () => {
    // Check session
    const { data: { session } } = await supabase.auth.getSession();
    state.user = session?.user || null;
    
    // Listen for changes
    supabase.auth.onAuthStateChange((_event, session) => {
      state.user = session?.user || null;
      if (!state.user) {
        app.router.navigate('auth');
      } else if (state.currentView === 'auth') {
        app.router.navigate('dashboard');
      }
      app.render();
    });

    if (state.user) {
      app.handlers.handleInitializeData();
    }

    app.render();
    app.router.init();
  },

  render: () => {
    const root = document.getElementById('root');
    if (!root) return;

    if (!state.user && state.currentView !== 'auth') {
       state.currentView = 'auth';
    }

    if (state.currentView === 'auth') {
       root.innerHTML = views.auth();
       return;
    }

    // Optimization: If shell exists, only update the view root and nav states
    let appContainer = root.querySelector('.app-container');
    if (appContainer) {
      // Update active nav links
      document.querySelectorAll('.nav-link').forEach(link => {
        const view = link.getAttribute('data-view');
        if (view) {
          link.classList.toggle('active', state.currentView === view || (view === 'products' && state.currentView === 'add-product') || (view === 'invoices' && state.currentView === 'create-invoice'));
        }
      });
      document.querySelectorAll('.bottom-nav > div').forEach(link => {
        const view = link.getAttribute('data-view');
        if (view) {
          link.classList.toggle('active', state.currentView === view);
        }
      });

      // Update theme icon
      const themeIcon = document.getElementById('theme-icon');
      if (themeIcon) themeIcon.textContent = state.theme === 'dark' ? '☀️' : '🌙';

      // Update the main content
      const viewRoot = document.getElementById('view-root');
      if (viewRoot) viewRoot.innerHTML = views[state.currentView]();
      return;
    }

    root.innerHTML = `
      <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="brand-container flex justify-between items-center">
            <div class="brand-title">Attrangii</div>
            <button onclick="app.handlers.toggleTheme()" class="btn btn-outline p-2">
              <span id="theme-icon">${state.theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>
          </div>
          
          <nav class="flex-1 overflow-y-auto">
            <ul class="flex flex-col">
              <li>
                <button onclick="app.router.navigate('dashboard')" data-view="dashboard" class="nav-link w-full text-left ${state.currentView === 'dashboard' ? 'active' : ''}">
                  ${ICONS.dashboard} <span>Dashboard</span>
                </button>
              </li>
              <li>
                <button onclick="app.router.navigate('products')" data-view="products" class="nav-link w-full text-left ${state.currentView === 'products' || state.currentView === 'add-product' ? 'active' : ''}">
                  ${ICONS.inventory} <span>Inventory</span>
                </button>
              </li>
              <li>
                <button onclick="app.router.navigate('invoices')" data-view="invoices" class="nav-link w-full text-left ${state.currentView === 'invoices' || state.currentView === 'create-invoice' ? 'active' : ''}">
                  ${ICONS.invoices} <span>Invoices</span>
                </button>
              </li>
              <li>
                <button onclick="app.router.navigate('analytics')" data-view="analytics" class="nav-link w-full text-left ${state.currentView === 'analytics' ? 'active' : ''}">
                  ${ICONS.analytics} <span>Reports</span>
                </button>
              </li>
              <li>
                <button onclick="app.router.navigate('search')" data-view="search" class="nav-link w-full text-left ${state.currentView === 'search' ? 'active' : ''}">
                  ${ICONS.search} <span>Smart Search</span>
                </button>
              </li>
            </ul>
          </nav>

          <div class="mt-auto px-6 space-y-4">
            <div class="flex items-center gap-2 text-[10px] uppercase tracking-wider text-on-surface-variant opacity-80">
               <div class="status-dot"></div>
               <span>Supabase Connected</span>
            </div>
            
            <button onclick="app.handlers.handleLogout()" class="nav-link px-0 opacity-60 hover:opacity-100 w-full text-left">
               ${ICONS.logout} <span>Logout</span>
            </button>
          </div>
        </aside>

        <!-- Main Area -->
        <main class="main-content flex flex-col min-h-[100dvh]">
          <div id="view-root" class="flex-1">
             ${views[state.currentView]()}
          </div>
          <footer class="py-8 mt-12 text-center text-xs opacity-40 hover:opacity-100 transition-opacity font-bold tracking-widest uppercase">
            Made with ❤️ by <a href="https://github.com/M-Destiny" target="_blank" class="text-primary underline decoration-primary/30 underline-offset-4">Destiny</a>
          </footer>
        </main>

        <!-- Bottom Nav (Mobile) -->
        <nav class="bottom-nav">
           <div class="${state.currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard" onclick="app.router.navigate('dashboard')">
              ${ICONS.dashboard}
              <span class="text-[10px] font-bold">Home</span>
           </div>
           <div class="${state.currentView === 'products' ? 'active' : ''}" data-view="products" onclick="app.router.navigate('products')">
              ${ICONS.inventory}
              <span class="text-[10px] font-bold">Stock</span>
           </div>
           <div class="${state.currentView === 'invoices' ? 'active' : ''}" data-view="invoices" onclick="app.router.navigate('invoices')">
              ${ICONS.invoices}
              <span class="text-[10px] font-bold">Billing</span>
           </div>
           <div class="${state.currentView === 'analytics' ? 'active' : ''}" data-view="analytics" onclick="app.router.navigate('analytics')">
              ${ICONS.analytics}
              <span class="text-[10px] font-bold">Reports</span>
           </div>
           <div class="${state.currentView === 'search' ? 'active' : ''}" data-view="search" onclick="app.router.navigate('search')">
              ${ICONS.search}
              <span class="text-[10px] font-bold">Search</span>
           </div>
        </nav>
      </div>
    `;
  },

  router: {
    init: () => {
      window.addEventListener('popstate', () => {
        const path = window.location.hash.replace('#', '') || 'dashboard';
        app.router.navigate(path, false);
      });
      
      const path = window.location.hash.replace('#', '') || (state.user ? 'dashboard' : 'auth');
      app.router.navigate(path, true);
    },

    navigate: (view: string, push = true) => {
      if (!views[view]) return;
      state.currentView = view;
      if (push) window.location.hash = view;

      // Reset specific view states
      if (view !== 'add-product') {
        state.editingProductId = null;
        state.newProduct = { name: '', sku: '', selling_price: 0, stock_level: 0, category: '', images: [], show_on_storefront: true };
        state.pendingImageRemovals = [];
      }

      if (view === 'create-invoice') {
        app.handlers.handleFetchInvoiceResources();
      }
      
      app.render();
      window.scrollTo(0, 0);
    }
  },

  handlers: {
    handleAuth: async (form: HTMLFormElement) => {
      const email = form.email.value;
      const password = form.password.value;
      const errorEl = document.getElementById('auth-error');
      const submitBtn = document.getElementById('auth-submit');

      if (errorEl) errorEl.classList.add('hidden');
      if (submitBtn) submitBtn.innerText = 'Verifying Credentials...';

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (errorEl) {
          errorEl.innerText = error.message;
          errorEl.classList.remove('hidden');
        }
        if (submitBtn) submitBtn.innerText = 'Enter Workspace';
      } else {
        app.router.navigate('dashboard');
      }
    },

    seedInitialUsers: async () => {
      const users = [
        { email: 'Destiny@attrangi.com', pass: 'attrangii123' },
        { email: 'popu@attrangi.com', pass: 'attrangii123' },
        { email: 'Squeaky@attrangi.com', pass: 'attrangii123' }
      ];

      alert('Provisioning system accounts for Destiny, Popu, and Squeaky. This will attempt to create the requested users.');

      for (const u of users) {
        const { error } = await supabase.auth.signUp({ 
          email: u.email, 
          password: u.pass,
          options: {
            data: { display_name: u.email.split('@')[0] }
          }
        });
        if (error) console.log(`Note for ${u.email}: ${error.message}`);
      }

      alert('Account Provisioning complete. You can now login.');
    },

    handleLogout: async () => {
      await supabase.auth.signOut();
      app.router.navigate('auth');
    },

    handleEditProduct: (id: string) => {
      const prod = state.products.find((p: any) => p.id === id);
      if (prod) {
        state.newProduct = {
          name: prod.name,
          sku: prod.sku,
          selling_price: prod.selling_price,
          stock_level: prod.stock_level,
          category: prod.category,
          images: (prod.images && prod.images.length ? prod.images : (prod.image_url ? [prod.image_url] : [])),
          show_on_storefront: prod.show_on_storefront !== false
        };
      }
      state.editingProductId = id;
      app.router.navigate('add-product');
    },

    toggleTheme: () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', state.theme);
      app.render();
    },

    handleInitializeData: async () => {
      // Products
      const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      state.products = prods || [];
      state.availableProducts = state.products;

      // Invoices
      const { data: invs } = await supabase.from('invoices').select(`
        *,
        customers (name, phone, email, address)
      `).order('created_at', { ascending: false });
      // Fetch items for top selling logic and invoice view
      const { data: items } = await supabase.from('invoice_items').select('*');
      
      state.invoices = (invs || []).map((i: any) => ({
         id: i.invoice_number,
         db_id: i.id,
         customer: i.customers?.name || 'Walk-in Client',
         customer_id: i.customer_id,
         customer_phone: i.customers?.phone || '',
         customer_email: i.customers?.email || '',
         customer_address: i.customers?.address || '',
         due_date: i.due_date ? new Date(i.due_date).toLocaleDateString() : '',
         discount: i.discount_amount || 0,
         taxRate: i.tax_rate || 0,
         shipping: Number(i.shipping_fee) || 0,
         date: new Date(i.issue_date).toLocaleDateString(),
         raw_date: i.issue_date,
         amount: i.total_amount,
         status: i.status.charAt(0).toUpperCase() + i.status.slice(1),
         paid_to: i.paid_to,
         items: (items || []).filter((item: any) => item.invoice_id === i.id).map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            description: item.description || (state.products.find((p: any) => p.id === item.product_id)?.name || 'Unknown Product'),
            quantity: item.quantity,
            qty: item.quantity,
            unit_price: item.unit_price,
            price: item.unit_price,
            total_price: item.total_price
         }))
      }));

      // Stats calculation
      state.stats.inventoryValue = (prods || []).reduce((acc: any, p: any) => acc + (p.selling_price * p.stock_level), 0);
      state.stats.lowStock = (prods || []).filter((p: any) => p.stock_level < p.low_stock_threshold).length;
      
      // Calculate MTD Sales
      const now = new Date();
      state.stats.salesMtd = (invs || []).reduce((acc: any, inv: any) => {
         const d = new Date(inv.issue_date);
         if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
             return acc + Number(inv.total_amount || 0);
         }
         return acc;
      }, 0);

      // Top Selling
      const itemCounts: any = {};
      (items || []).forEach((item: any) => {
         itemCounts[item.product_id] = (itemCounts[item.product_id] || 0) + item.quantity;
      });
      state.stats.topSelling = Object.entries(itemCounts)
         .sort((a: any, b: any) => b[1] - a[1])
         .slice(0, 3)
         .map(([pid, qty]) => {
            const p = state.products.find((prod: any) => prod.id === pid);
            return p ? { name: p.name, qty, price: p.selling_price, image: p.image_url } : null;
         })
         .filter(Boolean);
      
      // Fallback
      if (state.stats.topSelling.length === 0) {
         state.stats.topSelling = [...state.products].sort((a: any, b: any) => b.selling_price - a.selling_price).slice(0, 3).map((p: any) => ({
            name: p.name, qty: 0, price: p.selling_price, image: p.image_url
         }));
      }

      // Chart Data (Last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const chartData = [];
      let maxMonthSales = 0;
      for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthSales = (invs || []).reduce((acc: any, inv: any) => {
             const idate = new Date(inv.issue_date);
             if (idate.getMonth() === d.getMonth() && idate.getFullYear() === d.getFullYear()) return acc + Number(inv.total_amount || 0);
             return acc;
          }, 0);
          if (monthSales > maxMonthSales) maxMonthSales = monthSales;
          chartData.push({ label: months[d.getMonth()], sales: monthSales, isCurrent: i === 0 });
      }
      state.stats.chartData = chartData.map((d: any) => ({ ...d, height: maxMonthSales > 0 ? (d.sales / maxMonthSales * 100) : 0 }));
      
      // 1. Category Split calculation
      const categoryValue: any = {};
      let totalVal = 0;
      (prods || []).forEach((p: any) => {
         const cat = p.category || 'Uncategorized';
         const val = (p.selling_price || 0) * (p.stock_level || 0);
         categoryValue[cat] = (categoryValue[cat] || 0) + val;
         totalVal += val;
      });
      
      let categorySplit = Object.entries(categoryValue).map(([name, val]) => {
         const pct = totalVal > 0 ? Math.round((val as number) / totalVal * 100) : 0;
         return { name, pct, value: val };
      }).sort((a: any, b: any) => (b.value as number) - (a.value as number));

      if (totalVal === 0) {
         const categoryCount: any = {};
         (prods || []).forEach((p: any) => {
            const cat = p.category || 'Uncategorized';
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
         });
         const totalCount = (prods || []).length;
         categorySplit = Object.entries(categoryCount).map(([name, count]) => {
            const pct = totalCount > 0 ? Math.round((count as number) / totalCount * 100) : 0;
            return { name, pct, value: count };
         }).sort((a: any, b: any) => (b.value as number) - (a.value as number));
      }
      state.stats.categorySplit = categorySplit;

      // 2. Agent payments calculation (paid to who)
      const paidToData: any = {
         'MEHUL': 0,
         'SIMARPREET': 0,
         'DALBIR': 0
      };
      let totalPaid = 0;
      state.invoices.forEach((inv: any) => {
         if (inv.status === 'Paid') {
            const amt = Number(inv.amount || 0);
            const receiver = inv.paid_to ? inv.paid_to.toUpperCase() : null;
            if (receiver && paidToData[receiver] !== undefined) {
               paidToData[receiver] += amt;
               totalPaid += amt;
            } else if (receiver) {
               paidToData[receiver] = amt;
               totalPaid += amt;
            } else {
               paidToData['Others'] = (paidToData['Others'] || 0) + amt;
               totalPaid += amt;
            }
         }
      });
      state.stats.paidTo = Object.entries(paidToData)
         .map(([name, amount]) => {
            const pct = totalPaid > 0 ? Math.round((amount as number) / totalPaid * 100) : 0;
            return { name, amount, pct };
         })
         .sort((a: any, b: any) => (b.amount as number) - (a.amount as number));

      // 3. Paid vs Pending breakdown
      let totalPaidAmount = 0;
      let totalPendingAmount = 0;
      state.invoices.forEach((inv: any) => {
         const amt = Number(inv.amount || 0);
         if (inv.status === 'Paid') {
            totalPaidAmount += amt;
         } else {
            totalPendingAmount += amt;
         }
      });
      const totalOverall = totalPaidAmount + totalPendingAmount;
      state.stats.paymentBreakdown = {
         paid: totalPaidAmount,
         pending: totalPendingAmount,
         paidPct: totalOverall > 0 ? Math.round(totalPaidAmount / totalOverall * 100) : 0,
         pendingPct: totalOverall > 0 ? Math.round(totalPendingAmount / totalOverall * 100) : 0
      };
      
      app.render();
    },

    handleNewInvoice: () => {
      state.currentInvoice = {
        items: [],
        discount: 0,
        taxRate: 0,
        shipping: 0,
      };
      state.editingInvoiceDbId = null;
      state.editingInvoiceNumber = null;
      app.router.navigate('create-invoice');
    },

    handleEditInvoice: (invoiceNumber: string) => {
      const inv = state.invoices.find((i: any) => i.id === invoiceNumber);
      if (!inv) return;

      // Populate draft fields
      state.currentInvoice = {
        customer_id: inv.customer_id || '',
        new_customer_name: '',
        discount: inv.discount || 0,
        taxRate: inv.taxRate || 0,
        shipping: inv.shipping || 0,
        items: inv.items.map((item: any) => ({
          id: item.id || Date.now() + Math.random(),
          description: item.description,
          qty: item.qty || item.quantity,
          price: item.price || item.unit_price,
          product_id: item.product_id
        }))
      };

      state.editingInvoiceDbId = inv.db_id;
      state.editingInvoiceNumber = inv.id;

      app.router.navigate('create-invoice');
    },

    handleDeleteInvoice: async (invoiceNumber: string) => {
      const inv = state.invoices.find((i: any) => i.id === invoiceNumber);
      if (!inv) return;

      if (!confirm(`Are you absolutely sure you want to delete Invoice ${invoiceNumber}? This action is irreversible and will restore all items back to stock.`)) {
        return;
      }

      try {
        // 1. Add back the stock for all invoice items
        if (inv.items) {
          for (const item of inv.items) {
            const qty = item.qty || item.quantity || 0;
            if (item.product_id && qty > 0) {
              const { data: prod } = await supabase.from('products').select('stock_level').eq('id', item.product_id).single();
              if (prod) {
                const restoredStock = prod.stock_level + qty;
                await supabase.from('products').update({ stock_level: restoredStock }).eq('id', item.product_id);
              }
            }
          }
        }

        // 2. Delete the invoice from database (invoice_items deletes cascade)
        const { error } = await supabase.from('invoices').delete().eq('id', inv.db_id);
        if (error) throw error;

        alert(`Invoice ${invoiceNumber} deleted successfully and stock has been restored!`);

        // Refresh local data
        app.handlers.handleInitializeData();

        // Redirect back to invoices list if we are currently viewing the deleted invoice
        if (state.currentView === 'view-invoice') {
          app.router.navigate('invoices');
        }
      } catch (err: any) {
        alert(`Failed to delete invoice: ${err.message}`);
      }
    },

    handleFetchInvoiceResources: async () => {
      // Fetch customers
      const { data: custs } = await supabase.from('customers').select('*');
      state.customers = custs || [];
      
      // Fetch products for inventory picklist
      const { data: prods } = await supabase.from('products').select('*');
      state.availableProducts = prods || [];
      
      app.render();
    },

    handleAddInvoiceItem: () => {
      state.currentInvoice.items.push({ id: Date.now(), description: '', qty: 1, price: 0, product_id: null });
      app.render();
    },

    handleRemoveInvoiceItem: (id: number) => {
      state.currentInvoice.items = state.currentInvoice.items.filter((i: any) => i.id !== id);
      app.render();
    },

    handleSearchInvoiceProduct: (query: string) => {
      state.invoiceProductSearch = query;
      const resultsEl = document.getElementById('invoice-product-search-results');
      if (!resultsEl) return;

      if (!query) {
        resultsEl.classList.add('hidden');
        return;
      }

      const matches = state.availableProducts.filter((p: any) => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.sku.toLowerCase().includes(query.toLowerCase())
      );

      if (matches.length === 0) {
        resultsEl.innerHTML = '<div class="p-4 text-center opacity-30 text-xs font-bold">No assets found</div>';
      } else {
        resultsEl.innerHTML = matches.map((p: any) => `
          <div class="p-3 hover:bg-surface-container-highest rounded-xl cursor-pointer flex justify-between items-center transition-colors group" onclick="app.handlers.handleAddProductToInvoice('${p.id}')">
            <div>
              <p class="font-bold text-xs">${p.name}</p>
              <p class="text-[10px] opacity-40 uppercase font-black">${p.sku}</p>
            </div>
            <div class="text-right">
              <p class="font-black text-xs text-primary">₹${p.selling_price.toLocaleString('en-IN')}</p>
              <p class="text-[9px] opacity-40 font-bold">${p.stock_level} in stock</p>
            </div>
          </div>
        `).join('');
      }
      resultsEl.classList.remove('hidden');
    },

    handleInvoiceProductSearch: (val: string) => {
      app.handlers.handleSearchInvoiceProduct(val);
    },

    handleAddProductToInvoice: (productId: string) => {
      const prod = state.availableProducts.find((p: any) => p.id === productId);
      if (prod) {
        state.currentInvoice.items.push({
          id: Date.now(),
          description: prod.name,
          qty: 1,
          price: prod.selling_price,
          product_id: productId
        });
        state.invoiceProductSearch = '';
        const searchInput = document.getElementById('invoice-product-search') as HTMLInputElement;
        if (searchInput) searchInput.value = '';
        const resultsEl = document.getElementById('invoice-product-search-results');
        if (resultsEl) resultsEl.classList.add('hidden');
        app.render();
      }
    },

    handleUpdateInvoiceItem: (id: number, field: string, value: any, targeted = false) => {
      const item = state.currentInvoice.items.find((i: any) => i.id === id);
      if (item) {
        if (field === 'product_id') {
          const prod = state.availableProducts.find((p: any) => p.id === value);
          if (prod) {
            item.description = prod.name;
            item.price = prod.selling_price;
            item.product_id = value;
          }
          app.render(); // Need full re-render when row structural changes happen (product switch)
        } else {
          item[field] = value;
          if (targeted) {
            utils.updateInvoiceSummaryUI();
          } else {
            app.render();
          }
        }
      }
    },

    handleUpdateInvoiceHeader: (field: string, value: any, targeted = false) => {
      state.currentInvoice[field] = value;
      if (targeted) {
        utils.updateInvoiceSummaryUI();
      } else {
        app.render();
      }
    },

    handleSaveInvoice: async () => {
      if (!state.currentInvoice.customer_id && !state.currentInvoice.new_customer_name) {
        alert('Please select or enter a customer name.');
        return;
      }

      const submitBtn = document.getElementById('save-invoice-btn');
      if (submitBtn) (submitBtn as HTMLButtonElement).disabled = true;

      // Check stock levels
      const outOfStockItems = [];
      for (const item of state.currentInvoice.items) {
         if (!item.product_id) continue;
         const prod = state.products.find((p: any) => p.id === item.product_id);
         
         // If editing, we adjust the stock check.
         // We should allow the quantity that was already allocated to this invoice!
         let allocatedQty = 0;
         if (state.editingInvoiceDbId) {
           const origInvoice = state.invoices.find((i: any) => i.db_id === state.editingInvoiceDbId);
           if (origInvoice) {
             const origItem = origInvoice.items.find((i: any) => i.product_id === item.product_id);
             if (origItem) {
               allocatedQty = origItem.qty || origItem.quantity || 0;
             }
           }
         }

         if (prod && item.qty > (prod.stock_level + allocatedQty)) {
            outOfStockItems.push(`${prod.name} (Requested: ${item.qty}, Available: ${prod.stock_level + allocatedQty})`);
         }
      }

      if (outOfStockItems.length > 0) {
         const msg = "The following items exceed available stock:\n" + outOfStockItems.join('\n') + "\n\nCreate invoice anyway?";
         if (!confirm(msg)) {
            if (submitBtn) (submitBtn as HTMLButtonElement).disabled = false;
            return;
         }
      }

      try {
        let customerId = state.currentInvoice.customer_id;

        // If it's a new customer name, create customer first
        if (!customerId && state.currentInvoice.new_customer_name) {
          const { data: newCust, error: custErr } = await supabase
            .from('customers')
            .insert([{ name: state.currentInvoice.new_customer_name }])
            .select()
            .single();
          
          if (custErr) throw custErr;
          customerId = newCust.id;
        }

        const subtotal = state.currentInvoice.items.reduce((acc: any, item: any) => acc + (item.qty * item.price), 0);
        const taxAmount = (subtotal - state.currentInvoice.discount) * (state.currentInvoice.taxRate / 100);
        const shipping = Number(state.currentInvoice.shipping) || 0;
        const total = subtotal - state.currentInvoice.discount + taxAmount + shipping;
        // Retry once without shipping_fee if the column is missing
        const withShipFallback = async (run: (extra: any) => PromiseLike<any>) => {
          let res = await run({ shipping_fee: shipping });
          if (res.error && /shipping_fee/i.test(res.error.message || '')) res = await run({});
          return res;
        };

        if (state.editingInvoiceDbId) {
          // UPDATE MODE
          
          // 1. Restore stock of original items first
          const origInvoice = state.invoices.find((i: any) => i.db_id === state.editingInvoiceDbId);
          if (origInvoice && origInvoice.items) {
            for (const orig of origInvoice.items) {
              const origQty = orig.qty || orig.quantity || 0;
              if (orig.product_id && origQty > 0) {
                const { data: prod } = await supabase.from('products').select('stock_level').eq('id', orig.product_id).single();
                if (prod) {
                  const restoredStock = prod.stock_level + origQty;
                  await supabase.from('products').update({ stock_level: restoredStock }).eq('id', orig.product_id);
                }
              }
            }
          }

          // 2. Update invoice header
          const { error: invErr } = await withShipFallback((extra) => supabase
            .from('invoices')
            .update({
              customer_id: customerId,
              subtotal,
              tax_rate: state.currentInvoice.taxRate,
              tax_amount: taxAmount,
              discount_amount: state.currentInvoice.discount,
              total_amount: total,
              ...extra
            })
            .eq('id', state.editingInvoiceDbId));

          if (invErr) throw invErr;

          // 3. Delete old invoice items
          const { error: deleteErr } = await supabase
             .from('invoice_items')
             .delete()
             .eq('invoice_id', state.editingInvoiceDbId);
          if (deleteErr) throw deleteErr;

          // 4. Insert new invoice items
          const itemsToInsert = state.currentInvoice.items.map((item: any) => ({
            invoice_id: state.editingInvoiceDbId,
            product_id: item.product_id,
            description: item.description,
            quantity: item.qty,
            unit_price: item.price,
            total_price: item.qty * item.price
          }));

          const { error: itemsErr } = await supabase.from('invoice_items').insert(itemsToInsert);
          if (itemsErr) throw itemsErr;

          // 5. Subtract stock of new items
          for (const item of state.currentInvoice.items) {
             if (!item.product_id) continue;
             const { data: prod } = await supabase.from('products').select('stock_level').eq('id', item.product_id).single();
             if (prod) {
                const newStock = Math.max(0, prod.stock_level - item.qty);
                await supabase.from('products').update({ stock_level: newStock }).eq('id', item.product_id);
             }
          }

          alert('Invoice updated successfully! Persisted to database.');

        } else {
          // CREATE MODE
          const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
          const { data: invoice, error: invErr } = await withShipFallback((extra) => supabase
            .from('invoices')
            .insert([{
              invoice_number: invoiceNumber,
              customer_id: customerId,
              subtotal,
              tax_rate: state.currentInvoice.taxRate,
              tax_amount: taxAmount,
              discount_amount: state.currentInvoice.discount,
              total_amount: total,
              status: 'unpaid',
              ...extra
            }])
            .select()
            .single());

          if (invErr) throw invErr;

          const itemsToInsert = state.currentInvoice.items.map((item: any) => ({
            invoice_id: invoice.id,
            product_id: item.product_id,
            description: item.description,
            quantity: item.qty,
            unit_price: item.price,
            total_price: item.qty * item.price
          }));

          const { error: itemsErr } = await supabase.from('invoice_items').insert(itemsToInsert);
          if (itemsErr) throw itemsErr;

          // Update stock levels
          for (const item of state.currentInvoice.items) {
             if (!item.product_id) continue;
             const prod = state.products.find((p: any) => p.id === item.product_id);
             if (prod) {
                const newStock = Math.max(0, prod.stock_level - item.qty);
                await supabase.from('products').update({ stock_level: newStock }).eq('id', prod.id);
                prod.stock_level = newStock;
             }
          }

          alert('Invoice created successfully! Persisted to database.');
        }
        
        // Refresh local data to show new invoice on dashboard
        app.handlers.handleInitializeData();
        
        // Reset state
        state.currentInvoice = {
          items: [],
          discount: 0,
          taxRate: 0,
          shipping: 0,
        };
        state.editingInvoiceDbId = null;
        state.editingInvoiceNumber = null;

        app.router.navigate('invoices');
      } catch (err: any) {
        alert(`Failed to save invoice: ${err.message}`);
        if (submitBtn) (submitBtn as HTMLButtonElement).disabled = false;
      }
    },

    handleUpdateInvoiceStatus: async (id: string, status: string) => {
      // Update locally
      const invIndex = state.invoices.findIndex((i: any) => i.id === id);
      if (invIndex !== -1) {
        state.invoices[invIndex].status = status;
      }

      // Update Supabase if connected
      try {
        await supabase.from('invoices').update({ status: status.toLowerCase() }).eq('invoice_number', id);
      } catch (e) {
        console.error("DB Update failed (expected if table not synced yet):", e);
      }
      
      app.render();
    },

    handleUpdateInvoicePaidTo: async (id: string, paidTo: string) => {
      // Update locally
      const invIndex = state.invoices.findIndex((i: any) => i.id === id);
      if (invIndex !== -1) {
        state.invoices[invIndex].paid_to = paidTo;
      }

      // Update Supabase
      try {
        await supabase.from('invoices').update({ paid_to: paidTo }).eq('invoice_number', id);
      } catch (e) {
        console.error("DB Update failed:", e);
      }
      
      app.render();
    },

    handleSelectInvoice: (id: string) => {
      state.selectedInvoice = id;
      app.router.navigate('view-invoice');
    },

    handleSearch: async (query: string) => {
      state.searchQuery = query.trim();
      
      // Debounce logic
      if (state.searchTimeout) clearTimeout(state.searchTimeout);

      if (!state.searchQuery) {
        state.searchResults = [];
        app.render(); // Need full render or at least results clear
        return;
      }

      state.searchTimeout = setTimeout(async () => {
        const q = state.searchQuery.toLowerCase();
        
        // Show indicator in results root if possible, avoiding full render
        const resultsRoot = document.getElementById('search-results-root');
        if (resultsRoot) {
          resultsRoot.innerHTML = '<div class="flex items-center justify-center p-20 opacity-30">Searching...</div>';
        }

        try {
          // Real search from Database
          const { data: dbProducts, error } = await supabase
            .from('products')
            .select('*')
            .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
            .limit(10);

          if (error) throw error;

          const results = (dbProducts || []).map((p: any) => ({
            type: 'Product',
            title: p.name,
            subtitle: p.sku || 'No SKU',
            meta: `₹${(p.selling_price || 0).toLocaleString('en-IN')}`,
            stock: p.stock_level,
            price: p.selling_price,
            image: p.image_url
          }));

          // Fallback to state search if DB returned nothing or to merge results
          if (results.length === 0) {
            state.products.forEach((p: any) => {
              if (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) {
                results.push({
                  type: 'Product',
                  title: p.name,
                  subtitle: p.sku,
                  meta: `₹${(p.price || 0).toLocaleString('en-IN')}`,
                  stock: p.stock || 0,
                  price: p.price || 0,
                  image: null
                });
              }
            });
          }

          // Search Invoices from state (for immediate UX)
          state.invoices.forEach((inv: any) => {
            if (inv.id.toLowerCase().includes(q) || inv.customer.toLowerCase().includes(q)) {
              results.push({
                type: 'Invoice',
                title: inv.id,
                subtitle: inv.customer,
                meta: `₹${inv.amount.toLocaleString('en-IN')}`,
                stock: undefined,
                price: inv.amount,
                image: null
              });
            }
          });

          state.searchResults = results;
        } catch (err) {
          console.error("Search failed:", err);
        }
        
        // Final update - if resultsRoot exists, update only that to preserve input focus
        if (resultsRoot) {
          const header = document.getElementById('search-count-header');
          if (header) header.textContent = `Search results for "${state.searchQuery}"`;
          
          resultsRoot.innerHTML = state.searchResults.length === 0 ? `
              <div class="flex items-center justify-center p-20 opacity-30 flex-col">
                 ${ICONS.search}
                 <p class="mt-4">No results found for "${state.searchQuery}"</p>
              </div>
          ` : state.searchResults.map((res: any) => utils.renderSearchItem(res)).join('');
        } else {
          app.render();
        }
      }, 300);
    },

    handleGeneratePDF: async (id: string) => {
      const inv = state.invoices.find((i: any) => i.id === id);
      if (!inv) return;

      // Inline the logo as a data URL so html2canvas always has it loaded.
      let logoSrc = logoUrl;
      try {
        const blob = await (await fetch(logoUrl)).blob();
        logoSrc = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(blob); });
      } catch { /* fall back to the plain URL */ }

      const element = document.createElement('div');
      element.style.cssText = 'width:794px;margin:0;padding:0;background:#fff;';
      element.innerHTML = buildInvoiceHtml(inv, logoSrc);

      const opt: any = {
        margin: 0,
        filename: `Invoice_${inv.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' }
      };

      html2pdf().from(element).set(opt).save();
    },

    uploadImage: () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      input.multiple = true;
      input.onchange = async () => {
        const files = Array.from(input.files || []);
        const okTypes = ['image/jpeg', 'image/png', 'image/webp'];
        state.uploadingImages = true;
        app.render();
        const errors: string[] = [];
        for (const file of files) {
          if (!okTypes.includes(file.type)) { errors.push(`${file.name}: only JPEG, PNG or WebP allowed`); continue; }
          if (file.size > 5 * 1024 * 1024) { errors.push(`${file.name}: larger than 5MB`); continue; }
          try {
            // Downscale to max 1200px JPEG q0.82 (falls back to the original file on any failure)
            let body: Blob = file, ext = file.name.split('.').pop()?.toLowerCase() || 'jpg', type = file.type;
            try {
              const bmp = await createImageBitmap(file);
              const k = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
              const c = document.createElement('canvas');
              c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
              const ctx = c.getContext('2d')!;
              ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
              ctx.drawImage(bmp, 0, 0, c.width, c.height);
              const blob: Blob | null = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.82));
              if (blob) { body = blob; ext = 'jpg'; type = 'image/jpeg'; }
            } catch (_) { /* keep original */ }
            const base = (state.newProduct.sku || state.editingProductId || 'product').toString().replace(/[^A-Za-z0-9_-]/g, '_');
            const path = `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
            const { error } = await supabase.storage.from('product-images').upload(path, body, { contentType: type, upsert: false, cacheControl: '31536000' });
            if (error) throw error;
            state.newProduct.images.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl);
          } catch (err: any) {
            errors.push(`${file.name}: ${err.message}`);
          }
        }
        state.uploadingImages = false;
        app.render();
        if (errors.length) alert(`Upload failed: ${errors.join('; ')}`);
      };
      input.click();
    },

    handleMakeMainImage: (i: number) => {
      const [u] = state.newProduct.images.splice(i, 1);
      state.newProduct.images.unshift(u);
      app.render();
    },

    handleRemoveImage: (i: number) => {
      const [u] = state.newProduct.images.splice(i, 1);
      state.pendingImageRemovals.push(u); // storage delete deferred until the product is saved
      app.render();
    },

    pickCategory: (sel: HTMLSelectElement) => {
      const inp = document.getElementById('newCatInput') as HTMLInputElement;
      const isNew = sel.value === '__new__';
      inp.style.display = isNew ? 'block' : 'none';
      if (isNew) { inp.value = ''; state.newProduct.category = ''; inp.focus(); }
      else state.newProduct.category = sel.value;
    },
    newCategoryTyped: (inp: HTMLInputElement) => {
      const v = inp.value.replace(/[<>]/g, '').trim().slice(0, 40); // markup characters are never valid in a category name
      const existing = categoryList().find(c => c.toLowerCase() === v.toLowerCase());
      if (v && existing) {
        // duplicate: switch to the existing category
        const sel = document.getElementById('catSelect') as HTMLSelectElement;
        sel.value = existing; inp.style.display = 'none'; state.newProduct.category = existing;
      } else state.newProduct.category = v;
    },
    handleSaveProduct: async () => {
      const newCat = document.getElementById('newCatInput') as HTMLInputElement | null;
      if (newCat && newCat.style.display !== 'none') app.handlers.newCategoryTyped(newCat);
      if (!String(state.newProduct.category || '').trim() && !state.editingProductId) {
        alert('Please choose or create a category.');
        return;
      }
      const btn = event?.target as HTMLButtonElement;
      if (btn) btn.disabled = true;

      try {
        const imgs: string[] = state.newProduct.images || [];
        const row: any = {
          ...(state.editingProductId ? { id: state.editingProductId } : {}),
          name: state.newProduct.name,
          sku: state.newProduct.sku,
          selling_price: state.newProduct.selling_price,
          stock_level: state.newProduct.stock_level,
          category: state.newProduct.category,
          brand: 'Attrangii Premium',
          image_url: imgs[0] ?? null,
          images: imgs,
          show_on_storefront: state.newProduct.show_on_storefront !== false
        };
        let { error } = await supabase.from('products').upsert([row]);
        if (error && /show_on_storefront/i.test(error.message || '')) {
          // column missing (migration not run): retry without it
          delete row.show_on_storefront;
          ({ error } = await supabase.from('products').upsert([row]));
        }
        if (error && /images/i.test(error.message || '')) {
          // `images` column missing (migration not run): retry without it
          delete row.images;
          ({ error } = await supabase.from('products').upsert([row]));
        }
        if (error) throw error;

        // Best-effort cleanup of removed images that live in our bucket
        const marker = '/product-images/';
        const paths = state.pendingImageRemovals
          .filter((u: string) => !imgs.includes(u) && u.includes(marker))
          .map((u: string) => decodeURIComponent(u.split(marker)[1].split('?')[0]));
        state.pendingImageRemovals = [];
        if (paths.length) await supabase.storage.from('product-images').remove(paths).catch(() => {});

        alert('Product specification successfully persisted.');
        app.handlers.handleInitializeData();
        app.router.navigate('products');
      } catch (err: any) {
        alert(`Storage Failure: ${err.message}`);
        if (btn) btn.disabled = false;
      }
    },

    handleSetAnalyticsFilter: (field: string, value: string) => {
      state.analyticsFilters[field] = value;
      app.render();
    },

    handleSetDashboardFilter: (field: string, value: string) => {
      state.dashboardFilters[field] = value;
      app.render();
    }
  }
};

// Expose to global for HTML event handlers
(window as any).app = app;
(window as any).state = state;

// Start
app.init();
