/**
 * Attrangii CRM - Main Entrance
 * Vanilla JS Application
 */
import './index.css';
import { supabase } from './lib/supabase';
// @ts-ignore
import html2pdf from 'html2pdf.js';

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
          <div class="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-highest">
             ${res.image ? `<img src="${res.image}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center opacity-40">${res.type === 'Product' ? ICONS.inventory : ICONS.invoices}</div>`}
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
    const total = subtotal - (inv.discount || 0) + taxAmount;
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
    chartData: []
  },
  products: [],
  invoices: [],
  customers: [],
  availableProducts: [],
  searchResults: [],
  searchQuery: '',
  searchTimeout: null,
  newProduct: {
    name: '',
    sku: '',
    selling_price: 0,
    stock_level: 0,
    category: 'Jewelry'
  },
  currentInvoice: {
    items: [],
    discount: 0,
    taxRate: 18,
  },
  invoiceProductSearch: '',
};

// --- View Definitions ---
const views: any = {
  dashboard: () => `
    <div class="view-header flex justify-between items-start md:items-end">
      <div>
        <h2 class="font-black text-4xl md:text-5xl">Morning, ${state.user?.email?.split('@')[0] || 'Admin'}.</h2>
        <p class="text-on-surface-variant mt-2">Here is the pulse of your inventory and sales today.</p>
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
          <span class="text-xs font-bold" style="color: var(--primary)">Current MTD</span>
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Sales Performance</p>
          <p class="headline text-2xl font-black">₹${state.stats.salesMtd.toLocaleString('en-IN')}</p>
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
       <div class="flex justify-between items-center mb-8">
          <h3 class="font-bold text-xl">Monthly Sales Overview</h3>
          <button class="btn btn-outline" onclick="app.router.navigate('analytics')">View Full Report</button>
       </div>
       <div class="bar-chart">
          ${(state.stats.chartData || []).map((d: any) => `
             <div class="bar ${d.isCurrent ? 'active' : ''}" style="height: ${Math.max(5, d.height)}%" data-label="${d.label}"></div>
          `).join('')}
       </div>
    </div>

    <div class="mt-8 flex gap-8 flex-col md:flex-row">
       <div class="card overflow-hidden" style="flex: 2">
          <div class="flex justify-between items-center mb-6">
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
                ${state.invoices.length === 0 ? '<tr><td colspan="4" class="text-center opacity-30 py-8">No recent activity</td></tr>' : 
                  state.invoices.slice(0, 5).map((inv: any) => `
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
   </div>
       <div class="card" style="flex: 1">
          <h3 class="font-bold text-xl mb-6">Top Selling</h3>
          <ul class="flex flex-col gap-4">
             ${(state.stats.topSelling || []).map((ts: any) => `
               <li class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary overflow-hidden">
                      ${ts.image ? `<img src="${ts.image}" class="w-full h-full object-cover">` : ICONS.inventory}
                  </div>
                  <div>
                     <p class="font-bold text-sm">${ts.name}</p>
                     <p class="text-xs text-on-surface-variant">${ts.qty > 0 ? `${ts.qty} sold` : 'New arrival'}</p>
                  </div>
                  <div class="ml-auto font-bold">₹${ts.price.toLocaleString('en-IN')}</div>
               </li>
             `).join('')}
          </ul>
       </div>
    </div>
  `,
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
                  <td class="font-bold flex items-center gap-3">
                     <div class="w-8 h-8 rounded bg-surface-container-highest overflow-hidden">
                        ${p.image_url ? `<img src="${p.image_url}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center opacity-40">${ICONS.inventory}</div>`}
                     </div>
                     ${p.name}
                  </td>
                  <td class="font-mono text-xs">${p.sku}</td>
                  <td><span class="text-xs px-2 py-1 rounded-full" style="background: var(--surface-container-highest)">${p.category}</span></td>
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
                    <label class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Serial Number</label>
                    <input type="text" placeholder="Optional" class="w-full">
                </div>
             </div>
          </div>
        </div>
        <div class="card">
           <h3 class="font-bold text-xl mb-6">Media Gallery</h3>
           <div class="flex flex-wrap gap-4">
              <div id="image-upload-drop" class="w-full sm:w-60 h-60 border-2 dashed border-outline rounded-3xl flex items-center justify-center bg-surface-container-low cursor-pointer" onclick="app.handlers.uploadImage()">
                 <div class="text-center">
                    <div class="bg-primary w-12 h-12 rounded-full flex items-center justify-center mx-auto color-white">${ICONS.add}</div>
                    <p class="font-bold mt-2 text-sm">Upload Photo</p>
                    <p class="text-[10px] opacity-40 mt-1">Supabase Storage Ready</p>
                 </div>
              </div>
           </div>
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
  <button class="btn btn-primary w-full md:w-auto" onclick="app.router.navigate('create-invoice')">${ICONS.add} Create Invoice</button>
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
            <th>Status</th>
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
                  <select onchange="app.handlers.handleUpdateInvoiceStatus('${inv.id}', this.value)" class="text-xs px-2 py-1 rounded-full border-none font-bold" style="background: ${inv.status === 'Paid' ? 'var(--secondary-container)' : inv.status === 'Unpaid' ? 'var(--error-container)' : 'var(--surface-container-highest)'}">
                    <option value="Paid" ${inv.status === 'Paid' ? 'selected' : ''}>Paid</option>
                    <option value="Unpaid" ${inv.status === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
                    <option value="Partial" ${inv.status === 'Partial' ? 'selected' : ''}>Partial</option>
                    <option value="Draft" ${inv.status === 'Draft' ? 'selected' : ''}>Draft</option>
                  </select>
                </td>
                <td>
                  <button class="btn opacity-60 hover:opacity-100" onclick="app.handlers.handleSelectInvoice('${inv.id}')">
                    View
                  </button>
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
        <div class="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
           <button class="btn btn-outline flex-1 md:flex-none" onclick="window.print()">Print</button>
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
                    <tr>
                      <td>Premium CRM Access</td>
                      <td class="text-center">1</td>
                      <td class="text-right">₹${inv.amount.toLocaleString('en-IN')}</td>
                      <td class="text-right font-bold">₹${inv.amount.toLocaleString('en-IN')}</td>
                    </tr>
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
                     <span class="font-bold">₹${inv.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div class="flex justify-between">
                     <span class="text-on-surface-variant">Tax (18%)</span>
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
           <div class="card hover:border-primary transition-all cursor-pointer group" onclick="app.router.navigate('create-invoice')">
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
  analytics: () => `
    <div class="view-header">
      <h2 class="font-black text-4xl md:text-5xl">Performance Depth.</h2>
      <p class="text-on-surface-variant mt-2">Historical trends and predictive sales data.</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
       <div class="card">
          <h3 class="font-bold text-xl mb-8">Revenue Momentum</h3>
          <div class="bar-chart">
            <div class="bar" style="height: 30%" data-label="Oct"></div>
            <div class="bar" style="height: 50%" data-label="Nov"></div>
            <div class="bar" style="height: 80%" data-label="Dec"></div>
            <div class="bar active" style="height: 95%" data-label="Jan"></div>
          </div>
       </div>
       <div class="card">
          <h3 class="font-bold text-xl mb-8">Category Split</h3>
          <div class="flex flex-col gap-6">
             <div class="space-y-2">
                <div class="flex justify-between text-xs font-bold uppercase opacity-60">
                   <span>Jewelry</span>
                   <span>65%</span>
                </div>
                <div class="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                   <div class="h-full bg-primary" style="width: 65%"></div>
                </div>
             </div>
             <div class="space-y-2">
                <div class="flex justify-between text-xs font-bold uppercase opacity-60">
                   <span>Accessories</span>
                   <span>25%</span>
                </div>
                <div class="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                   <div class="h-full bg-secondary" style="width: 25%"></div>
                </div>
             </div>
             <div class="space-y-2">
                <div class="flex justify-between text-xs font-bold uppercase opacity-60">
                   <span>Apparel</span>
                   <span>10%</span>
                </div>
                <div class="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                   <div class="h-full bg-tertiary" style="width: 10%"></div>
                </div>
             </div>
          </div>
       </div>
    </div>
  `,
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
       </div>
    </div>
  `,
  'create-invoice': () => {
    const inv = state.currentInvoice;
    const { subtotal, total } = utils.calculateInvoiceTotals(inv);

    return `
    <div class="view-header flex justify-between items-start md:items-end p-6 bg-surface-container-low rounded-3xl mb-8">
      <div>
        <h2 class="font-black text-4xl md:text-5xl">Create Invoice</h2>
        <p class="text-on-surface-variant mt-2">Professional Financial Instrument • Draft Session</p>
      </div>
      <div class="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
         <button class="btn btn-outline flex-1 md:flex-none" onclick="app.router.navigate('invoices')">Cancel</button>
         <button class="btn btn-primary flex-1 md:flex-none shadow-lg shadow-primary/20" id="save-invoice-btn" onclick="app.handlers.handleSaveInvoice()">Confirm & Send</button>
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
                    <input type="number" value="${inv.taxRate || 18}" style="width: 3rem; text-align: right; border: none; font-weight: 900; background: transparent; padding: 0.5rem 0;" oninput="app.handlers.handleUpdateInvoiceHeader('taxRate', parseFloat(this.value) || 0, true)">
                    <span class="text-xs opacity-40 font-bold">%</span>
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
                 <span>Finalize & Persist Entry</span>
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
        <main class="main-content">
          <div id="view-root">
             ${views[state.currentView]()}
          </div>
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
        state.newProduct = { name: '', sku: '', selling_price: 0, stock_level: 0, category: 'Jewelry' };
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
          category: prod.category
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
        customers (name)
      `).order('created_at', { ascending: false });
      
      state.invoices = (invs || []).map((i: any) => ({
         id: i.invoice_number,
         db_id: i.id,
         customer: i.customers?.name || 'Walk-in Client',
         date: new Date(i.issue_date).toLocaleDateString(),
         amount: i.total_amount,
         status: i.status.charAt(0).toUpperCase() + i.status.slice(1),
         paid_to: i.paid_to
      }));

      // Fetch items for top selling logic
      const { data: items } = await supabase.from('invoice_items').select('*');

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
      
      app.render();
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
        const total = subtotal - state.currentInvoice.discount + taxAmount;

        const { data: invoice, error: invErr } = await supabase
          .from('invoices')
          .insert([{
            invoice_number: `INV-${Date.now().toString().slice(-6)}`,
            customer_id: customerId,
            subtotal,
            tax_rate: state.currentInvoice.taxRate,
            tax_amount: taxAmount,
            discount_amount: state.currentInvoice.discount,
            total_amount: total,
            status: 'unpaid'
          }])
          .select()
          .single();

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

        alert('Invoice created successfully! Persisted to database.');
        
        // Refresh local data to show new invoice on dashboard
        app.handlers.handleInitializeData();
        
        // Reset state
        state.currentInvoice = {
          items: [{ id: Date.now(), description: 'Executive Consultation', qty: 1, price: 12000 }],
          discount: 0,
          taxRate: 18,
        };

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

    handleGeneratePDF: (id: string) => {
      const inv = state.invoices.find((i: any) => i.id === id);
      if (!inv) return;

      const element = document.createElement('div');
      element.className = 'printable-invoice';
      element.innerHTML = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4rem; border-bottom: 8px solid #E87AAE; padding-bottom: 2rem;">
            <div>
              <h1 style="font-size: 3rem; font-weight: 900; letter-spacing: -2px; margin: 0; color: #1a1a1a;">ATTRANGII</h1>
              <p style="color: #666; font-size: 0.7rem; text-transform: uppercase; tracking: 0.2em; margin: 0.5rem 0 0;">Executive Enterprise Portal</p>
              <div style="margin-top: 2rem; font-size: 0.8rem; color: #444;">
                <p>123 Business Avenue, Suite 500</p>
                <p>Digital District, Mumbai - 400001</p>
                <p>GSTIN: 27AAAAA0000A1Z5</p>
              </div>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 1.2rem; font-weight: 900; color: #E87AAE; margin: 0;">TAX INVOICE</h2>
              <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.25rem;">
                <p style="margin: 0; font-size: 0.7rem; color: #999; font-weight: 700;">INVOICE NUMBER</p>
                <p style="margin: 0; font-weight: 900; font-size: 1.2rem;">${inv.id}</p>
                <p style="margin: 1rem 0 0.25rem; font-size: 0.7rem; color: #999; font-weight: 700;">DATE OF ISSUE</p>
                <p style="margin: 0; font-weight: 800;">${inv.date}</p>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; margin-bottom: 4rem;">
            <div style="background: #F8F9FA; padding: 2rem; border-radius: 1rem;">
              <p style="text-transform: uppercase; font-size: 0.6rem; color: #999; font-weight: 900; tracking: 0.1em; margin-bottom: 1rem;">Recipient Information</p>
              <p style="font-weight: 800; font-size: 1.25rem; margin-bottom: 0.5rem;">${inv.customer}</p>
              <p style="color: #666; font-size: 0.85rem; line-height: 1.6;">Client ID: CID-009822<br>Premium Membership Level: Platinum<br>Email: billing@client.com</p>
            </div>
            <div style="padding: 2rem;">
              <p style="text-transform: uppercase; font-size: 0.6rem; color: #999; font-weight: 900; tracking: 0.1em; margin-bottom: 1rem;">Payment Details</p>
              <p style="font-size: 0.85rem; color: #444;">Bank Name: HDFC Bank Limited<br>A/C No: 50200012345678<br>IFSC: HDFC0001234<br>Branch: Nariman Point, Mumbai</p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 3rem;">
            <thead>
              <tr style="border-bottom: 2px solid #1a1a1a;">
                <th style="padding: 1.5rem 1rem; text-align: left; font-size: 0.65rem; font-weight: 900; color: #999;">DESCRIPTION</th>
                <th style="padding: 1.5rem 1rem; text-align: center; font-size: 0.65rem; font-weight: 900; color: #999;">QTY</th>
                <th style="padding: 1.5rem 1rem; text-align: right; font-size: 0.65rem; font-weight: 900; color: #999;">UNIT PRICE</th>
                <th style="padding: 1.5rem 1rem; text-align: right; font-size: 0.65rem; font-weight: 900; color: #999;">TOTAL AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 2rem 1rem; border-bottom: 1px solid #eee;">
                  <p style="font-weight: 800; font-size: 1rem; margin: 0;">Premium CRM Cloud Suite</p>
                  <p style="font-size: 0.75rem; color: #666; margin: 0.25rem 0 0;">Annual Enterprise Subscription (Multi-User License)</p>
                </td>
                <td style="padding: 2rem 1rem; text-align: center; border-bottom: 1px solid #eee; font-weight: 800;">1</td>
                <td style="padding: 2rem 1rem; text-align: right; border-bottom: 1px solid #eee; font-weight: 800;">₹${inv.amount.toLocaleString('en-IN')}</td>
                <td style="padding: 2rem 1rem; text-align: right; border-bottom: 1px solid #eee; font-weight: 900; font-size: 1.1rem;">₹${inv.amount.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div style="display: flex; justify-content: flex-end; margin-top: 2rem;">
            <div style="width: 22rem;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; padding: 0 1rem;">
                 <p style="color: #666; font-size: 0.9rem;">Subtotal</p>
                 <p style="font-weight: 800; font-size: 0.9rem;">₹${inv.amount.toLocaleString('en-IN')}</p>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem; padding: 0 1rem;">
                 <p style="color: #666; font-size: 0.9rem;">Tax / GST (18%)</p>
                 <p style="font-weight: 800; font-size: 0.9rem;">₹0.00</p>
              </div>
              <div style="background: #1a1a1a; color: white; padding: 2rem; border-radius: 1rem; display: flex; justify-content: space-between; align-items: center;">
                 <div>
                   <p style="text-transform: uppercase; font-size: 0.6rem; font-weight: 900; margin: 0; opacity: 0.6;">Grand Total Due</p>
                   <p style="font-size: 0.75rem; margin: 0.25rem 0 0; opacity: 0.4;">Includes all applicable taxes</p>
                 </div>
                 <p style="font-weight: 900; font-size: 2rem; margin: 0;">₹${inv.amount.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          <div style="margin-top: 4rem; padding: 2rem; border: 1px dashed #eee; border-radius: 1rem;">
            <p style="font-size: 0.75rem; font-weight: 800; margin-bottom: 0.5rem; text-transform: uppercase; tracking: 0.1em;">Terms & Conditions</p>
            <p style="font-size: 0.65rem; color: #888; line-height: 1.6;">
              1. This invoice is subject to Attrangii's Master Service Agreement.<br>
              2. Payment is due within 15 days of the invoice date.<br>
              3. Late payments may incur interest charges as per standard industry norms.<br>
              4. All disputes are subject to Mumbai Jurisdiction.
            </p>
          </div>

          <div style="margin-top: 6rem; text-align: center;">
             <p style="font-size: 0.75rem; color: #999; font-weight: 700;">Thank you for choice ATTRANGII for your executive CRM needs.</p>
             <div style="width: 4rem; height: 4px; background: #E87AAE; margin: 1.5rem auto 0;"></div>
          </div>
        </div>
      `;

      const opt: any = {
        margin: 0,
        filename: `Invoice_${inv.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().from(element).set(opt).save();
    },

    uploadImage: async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
          alert(`Uploading ${file.name} to Supabase Storage...`);
          // Implementation using supabase.storage.from('products').upload()
        }
      };
      input.click();
    },
    
    handleSaveProduct: async () => {
      const btn = event?.target as HTMLButtonElement;
      if (btn) btn.disabled = true;
      
      try {
        const { error } = await supabase.from('products').upsert([
          {
            ...(state.editingProductId ? { id: state.editingProductId } : {}),
            name: state.newProduct.name,
            sku: state.newProduct.sku,
            selling_price: state.newProduct.selling_price,
            stock_level: state.newProduct.stock_level,
            category: state.newProduct.category,
            brand: 'Attrangii Premium'
          }
        ]);
        
        if (error) throw error;
        
        alert('Product specification successfully persisted.');
        app.handlers.handleInitializeData();
        app.router.navigate('products');
      } catch (err: any) {
        alert(`Storage Failure: ${err.message}`);
        if (btn) btn.disabled = false;
      }
    }
  }
};

// Expose to global for HTML event handlers
(window as any).app = app;
(window as any).state = state;

// Start
app.init();
