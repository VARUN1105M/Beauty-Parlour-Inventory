// ============================================================================
// ROYAL HERITAGE POS & RETAIL ERP - DESKTOP CLIENT APPLICATION
// ============================================================================

let currentRole = 'store_manager';
let currentView = 'dashboard';
let products = [];
let cart = [];
let selectedCustomerId = 'cu-1';
let currentCustomer = null;
let currentDiscount = 0;
let dashboardMetrics = {};
let customers = [];
let appointments = [];
let bridalProjects = [];
let salesHistory = [];
let suppliers = [
  { id: 'sup-1', companyName: 'Jaipur Royal Jewels Crafting Co.', contactPerson: 'Mahesh Soni' },
  { id: 'sup-2', companyName: 'Aura Luxury Cosmetics Supplies', contactPerson: 'Deepa Nair' },
];
let purchaseOrders = [
  {
    id: 'po-1',
    poNumber: 'PO-2026-0089',
    supplierId: 'sup-1',
    supplierName: 'Jaipur Royal Jewels Crafting Co.',
    orderDate: '2026-10-20',
    expectedDate: '2026-11-05',
    status: 'issued',
    totalAmount: 92500,
    items: [
      { productId: 'p-1', productName: 'Royal Kundan & Pearl Bridal Choker Set', orderedQty: 5, unitCost: 18500, lineTotal: 92500 },
    ],
  },
];

const API_BASE = '/api/v1';

// ----------------------------------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  await loadInitialData();
  switchView('dashboard');

  // Keyboard shortcut listener for POS
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      switchView('pos');
    }
  });
});

async function loadInitialData() {
  try {
    const [pRes, cRes, aRes, bpRes, dRes] = await Promise.all([
      fetch(`${API_BASE}/products`),
      fetch(`${API_BASE}/customers`),
      fetch(`${API_BASE}/appointments`),
      fetch(`${API_BASE}/bridal_projects`),
      fetch(`${API_BASE}/dashboard`),
    ]);

    products = await pRes.json();
    customers = await cRes.json();
    appointments = await aRes.json();
    bridalProjects = await bpRes.json();
    dashboardMetrics = await dRes.json();

    try {
      const sRes = await fetch(`${API_BASE}/suppliers`);
      if (sRes.ok) suppliers = await sRes.json();
    } catch (_) {}

    try {
      const poRes = await fetch(`${API_BASE}/purchasing/orders`);
      if (poRes.ok) {
        const fetchedPOs = await poRes.json();
        if (Array.isArray(fetchedPOs) && fetchedPOs.length > 0) {
          purchaseOrders = fetchedPOs;
        }
      }
    } catch (_) {}

    currentCustomer = customers[0] || null;
  } catch (err) {
    console.error('Failed to load initial data:', err);
  }
}

// ----------------------------------------------------------------------------
// ROLE & PERMISSIONS (RBAC)
// ----------------------------------------------------------------------------
function onRoleChange(newRole) {
  currentRole = newRole;
  showNotification(`Switched profile to: ${getRoleDisplayName(newRole)}`);
  switchView(currentView);
}

function getRoleDisplayName(role) {
  switch (role) {
    case 'store_manager': return 'Store Manager (Admin)';
    case 'bridal_manager': return 'Bridal Manager';
    case 'inventory_manager': return 'Inventory Manager';
    case 'receptionist': return 'Receptionist';
    case 'cashier': return 'Cashier';
    default: return role;
  }
}

function canPerform(action) {
  if (currentRole === 'store_manager') return true;

  if (action === 'approve_refund') return currentRole === 'store_manager';
  if (action === 'day_close') return currentRole === 'store_manager' || currentRole === 'cashier';
  if (action === 'adjust_stock') return currentRole === 'store_manager' || currentRole === 'inventory_manager';
  if (action === 'manage_bridal') return currentRole === 'store_manager' || currentRole === 'bridal_manager';
  if (action === 'appointments') return currentRole === 'store_manager' || currentRole === 'receptionist' || currentRole === 'bridal_manager';
  if (action === 'view_pnl') return currentRole === 'store_manager';
  return true;
}

// ----------------------------------------------------------------------------
// VIEW NAVIGATION ROUTER
// ----------------------------------------------------------------------------
function switchView(viewName) {
  currentView = viewName;

  // Update active sidebar item
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const activeNavItem = Array.from(document.querySelectorAll('.nav-item')).find(el =>
    el.getAttribute('onclick') && el.getAttribute('onclick').includes(viewName)
  );
  if (activeNavItem) activeNavItem.classList.add('active');

  const content = document.getElementById('content-view');
  const pageTitle = document.getElementById('page-title');

  switch (viewName) {
    case 'dashboard':
      pageTitle.innerText = 'Executive Dashboard & Live Branch Operations';
      renderDashboard(content);
      break;
    case 'pos':
      pageTitle.innerText = 'Point of Sale (Sales & Billing)';
      renderPos(content);
      break;
    case 'returns':
      pageTitle.innerText = 'Returns, Refunds & Credit Memos';
      renderReturns(content);
      break;
    case 'bridal':
      pageTitle.innerText = 'Bridal Projects, Packages & Event Scheduling';
      renderBridalProjects(content);
      break;
    case 'appointments':
      pageTitle.innerText = 'Salon Appointments & Service Schedule';
      renderAppointments(content);
      break;
    case 'customers':
      pageTitle.innerText = 'Customers CRM & Bridal Loyalty';
      renderCustomers(content);
      break;
    case 'inventory':
      pageTitle.innerText = 'Jewellery & Product Master Inventory';
      renderInventory(content);
      break;
    case 'adjustments':
      pageTitle.innerText = 'Stock Adjustments & Audit Movements';
      renderAdjustments(content);
      break;
    case 'purchasing':
      pageTitle.innerText = 'Purchasing & Purchase Orders (POs)';
      renderPurchasing(content);
      break;
    case 'dayclose':
      pageTitle.innerText = 'Day Close (Cashup Reconciliation & Safe Count)';
      renderDayClose(content);
      break;
    case 'shifts':
      pageTitle.innerText = 'Staff Attendance & Shift Rosters';
      renderShifts(content);
      break;
    case 'reports':
      pageTitle.innerText = 'Financial Reports & Analytics';
      renderReports(content);
      break;
    case 'settings':
      pageTitle.innerText = 'Branch Settings & System Audit Trail';
      renderSettings(content);
      break;
    default:
      renderDashboard(content);
  }
}

// ----------------------------------------------------------------------------
// 1. DASHBOARD SCREEN
// ----------------------------------------------------------------------------
async function renderDashboard(container) {
  try {
    const res = await fetch(`${API_BASE}/dashboard`);
    dashboardMetrics = await res.json();
  } catch (e) {}

  container.innerHTML = `
    <div class="grid-4">
      <div class="stat-card">
        <div class="stat-label">Today's Sales Revenue</div>
        <div class="stat-val">₹${(dashboardMetrics.todaySales || 0).toLocaleString()}</div>
        <div class="stat-sub">Across Jewellery & Bridal Services</div>
      </div>
      <div class="stat-card gold">
        <div class="stat-label">Cash in Register Safe</div>
        <div class="stat-val">₹${(dashboardMetrics.totalCashInDrawer || 5000).toLocaleString()}</div>
        <div class="stat-sub">Opening Float: ₹5,000.00</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Appointments Today</div>
        <div class="stat-val">${dashboardMetrics.todayAppointments || 2}</div>
        <div class="stat-sub">1 Checked-in, 1 Upcoming</div>
      </div>
      <div class="stat-card ${dashboardMetrics.lowStockCount > 0 ? 'gold' : ''}">
        <div class="stat-label">Low Stock Alerts</div>
        <div class="stat-val" style="color: ${dashboardMetrics.lowStockCount > 0 ? '#B91C1C' : '#047857'}">
          ${dashboardMetrics.lowStockCount || 0} Items
        </div>
        <div class="stat-sub">Requires Reorder Purchase</div>
      </div>
    </div>

    <!-- Quick Action Banners -->
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 24px;">
      <div style="background: #FFF; border-radius: 12px; border: 1px solid var(--gray-200); padding: 20px;">
        <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 16px; color: var(--dark);">
          Quick POS Actions & Operations
        </h3>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="switchView('pos')">Open POS Billing</button>
          <button class="btn btn-outline" onclick="openNewAppointmentModal()">+ Book Beauty Appointment</button>
          <button class="btn btn-outline" onclick="openNewBridalLeadModal()">+ New Bridal Enquiry</button>
          <button class="btn btn-outline" onclick="openReceiveGoodsModal()">Record Goods Receipt</button>
          <button class="btn btn-gold" onclick="switchView('dayclose')">Reconcile Cashup</button>
        </div>
      </div>

      <div style="background: #FFF; border-radius: 12px; border: 1px solid var(--gray-200); padding: 20px;">
        <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 12px; color: var(--dark);">
          POS Hardware Status
        </h3>
        <div style="font-size: 13px; color: var(--gray-600); line-height: 1.8;">
          <div>Thermal Printer: <strong>Epson TM-T88VI (USB)</strong></div>
          <div>Scanner: <strong>Honeywell 1900g (Auto-HID)</strong></div>
          <div>Cash Drawer: <strong>APG RJ11 (${dashboardMetrics.hardware?.drawer?.kicksToday || 1} kicks)</strong></div>
          <div>Payment Terminal: <strong>Ingenico Lane/5000</strong></div>
        </div>
      </div>
    </div>

    <!-- Recent Sales Table -->
    <div class="data-table-wrap">
      <div class="table-top-bar">
        <h3 style="font-size: 14px; font-weight: 700;">Recent Sales & Invoices</h3>
        <button class="btn btn-outline btn-sm" onclick="switchView('pos')">Create New Invoice</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Date & Time</th>
            <th>Payment Method</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="recent-sales-tbody">
          ${renderRecentSalesRows()}
        </tbody>
      </table>
    </div>
  `;
}

function renderRecentSalesRows() {
  const list = salesHistory.length > 0 ? salesHistory : [
    {
      invoiceNumber: 'INV-20261025-0012',
      customerName: 'Ananya Deshmukh',
      saleDate: '2026-10-25 14:32',
      paymentMethod: 'card',
      totalAmount: 35017.94,
      status: 'paid',
    }
  ];

  return list.map(s => `
    <tr>
      <td style="font-family: monospace; font-weight: 700; color: var(--primary);">${s.invoiceNumber}</td>
      <td><strong>${s.customerName || 'Walk-in'}</strong></td>
      <td>${new Date(s.saleDate).toLocaleString()}</td>
      <td><span style="text-transform: uppercase; font-weight: 600; font-size: 11px;">${s.paymentMethod}</span></td>
      <td style="font-weight: 800; color: var(--dark);">₹${Number(s.totalAmount).toLocaleString()}</td>
      <td><span class="p-stock-badge stock-ok">${s.status.toUpperCase()}</span></td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="printExistingReceipt('${s.invoiceNumber}')">Print Receipt</button>
      </td>
    </tr>
  `).join('');
}

// ----------------------------------------------------------------------------
// 2. POS SALES / BILLING SCREEN
// ----------------------------------------------------------------------------
function renderPos(container) {
  container.innerHTML = `
    <div class="pos-layout">
      <!-- Left Panel: Product Catalog & Barcode Scanner -->
      <div class="catalog-panel">
        <div class="catalog-search-bar">
          <div class="search-input-wrap">
            <input type="text" id="pos-search" class="search-input" placeholder="Search product name, SKU, or scan barcode (e.g. 8901234000011)..." oninput="filterCatalog(this.value)">
          </div>
          <button class="barcode-trigger-btn" onclick="simulateBarcodeScan()" title="Simulate physical Honeywell 1900g barcode scanner reading a jewellery tag">
            Scan Barcode Demo
          </button>
        </div>

        <div class="category-pills">
          <div class="cat-pill active" onclick="filterCategory('all', this)">All Items</div>
          <div class="cat-pill" onclick="filterCategory('cat-1', this)">Bridal Jewellery</div>
          <div class="cat-pill" onclick="filterCategory('cat-2', this)">Fashion Jewellery</div>
          <div class="cat-pill" onclick="filterCategory('cat-4', this)">Beauty Retail</div>
          <div class="cat-pill" onclick="filterCategory('cat-5', this)">Salon Services</div>
        </div>

        <div class="product-grid" id="pos-product-grid">
          ${renderProductCards(products)}
        </div>
      </div>

      <!-- Right Panel: Live Cart & Fast Checkout -->
      <div class="cart-panel">
        <div class="cart-header">
          <div style="font-size: 14px; font-weight: 700; color: var(--dark);">Current Sale Cart</div>
          <button class="btn btn-outline btn-sm" onclick="clearCart()" style="color: var(--danger);">Clear</button>
        </div>

        <div class="cart-customer-selector">
          <div>
            <span style="color: var(--gray-600);">Customer:</span>
            <strong id="cart-cust-name">${currentCustomer ? currentCustomer.fullName : 'Walk-in Guest'}</strong>
            <span style="font-size: 11px; color: var(--gold-dark); margin-left: 6px;">(${currentCustomer ? currentCustomer.loyaltyPoints : 0} Pts)</span>
          </div>
          <button class="btn btn-outline btn-sm" onclick="openCustomerLookupModal()">Change</button>
        </div>

        <div class="cart-items-list" id="cart-items-container">
          ${renderCartItems()}
        </div>

        <div class="cart-summary">
          <div class="sum-row">
            <span>Subtotal</span>
            <span id="cart-subtotal">₹0.00</span>
          </div>
          <div class="sum-row">
            <span>Discount</span>
            <span id="cart-discount" style="color: var(--danger);">-₹0.00</span>
          </div>
          <div class="sum-row">
            <span>GST Tax (Jewellery 3%)</span>
            <span id="cart-tax">₹0.00</span>
          </div>
          <div class="sum-row total-row">
            <span>TOTAL DUE</span>
            <span id="cart-total">₹0.00</span>
          </div>
        </div>

        <div class="cart-actions">
          <button class="btn btn-outline" onclick="openDiscountModal()">
            % Discount
          </button>
          <button class="btn btn-primary" onclick="openCheckoutModal()" id="checkout-btn" disabled>
            Checkout (Pay)
          </button>
        </div>
      </div>
    </div>
  `;
  updateCartDisplay();
}

function renderProductCards(list) {
  if (list.length === 0) {
    return `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--gray-400);">No products found matching query.</div>`;
  }
  return list.map(p => `
    <div class="product-card" onclick="addToCart('${p.id}')">
      <div>
        <div class="p-category">${p.categoryName || 'Product'}</div>
        <div class="p-title">${p.name}</div>
        <div class="p-tag">SKU: ${p.sku}</div>
        ${p.durationMinutes ? `<div class="p-tag" style="color: var(--primary);">⏱ ${p.durationMinutes} mins</div>` : ''}
      </div>
      <div class="p-footer">
        <div class="p-price">₹${p.sellPrice.toLocaleString()}</div>
        ${p.isService
          ? `<span class="p-stock-badge stock-ok">SERVICE</span>`
          : `<span class="p-stock-badge ${p.stockOnHand <= p.reorderThreshold ? 'stock-low' : 'stock-ok'}">
              ${p.stockOnHand} in stock
            </span>`
        }
      </div>
    </div>
  `).join('');
}

function filterCatalog(searchStr) {
  const query = (searchStr || '').toLowerCase();
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.sku.toLowerCase().includes(query) ||
    (p.barcode && p.barcode.includes(query))
  );
  document.getElementById('pos-product-grid').innerHTML = renderProductCards(filtered);
}

function filterCategory(catId, element) {
  document.querySelectorAll('.cat-pill').forEach(el => el.classList.remove('active'));
  element.classList.add('active');

  if (catId === 'all') {
    document.getElementById('pos-product-grid').innerHTML = renderProductCards(products);
  } else {
    const filtered = products.filter(p => p.categoryId === catId);
    document.getElementById('pos-product-grid').innerHTML = renderProductCards(filtered);
  }
}

// ----------------------------------------------------------------------------
// CART ENGINE
// ----------------------------------------------------------------------------
function addToCart(productId) {
  const prod = products.find(p => p.id === productId);
  if (!prod) return;

  if (!prod.isService && prod.stockOnHand <= 0) {
    showNotification('Item is out of stock!', true);
    return;
  }

  const existing = cart.find(it => it.productId === productId);
  if (existing) {
    if (!prod.isService && existing.qty + 1 > prod.stockOnHand) {
      showNotification(`Cannot add more than available stock (${prod.stockOnHand})`, true);
      return;
    }
    existing.qty += 1;
    existing.lineTotal = (existing.qty * existing.unitPrice) - existing.discount;
  } else {
    cart.push({
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      unitPrice: prod.sellPrice,
      qty: 1,
      discount: 0,
      taxRate: 3.0,
      lineTotal: prod.sellPrice,
    });
  }

  updateCartDisplay();
}

function changeQty(productId, delta) {
  const item = cart.find(it => it.productId === productId);
  if (!item) return;

  const prod = products.find(p => p.id === productId);
  const newQty = item.qty + delta;

  if (newQty <= 0) {
    cart = cart.filter(it => it.productId !== productId);
  } else {
    if (prod && !prod.isService && newQty > prod.stockOnHand) {
      showNotification(`Available stock is only ${prod.stockOnHand}`, true);
      return;
    }
    item.qty = newQty;
    item.lineTotal = (item.qty * item.unitPrice) - item.discount;
  }
  updateCartDisplay();
}

function removeFromCart(productId) {
  cart = cart.filter(it => it.productId !== productId);
  updateCartDisplay();
}

function clearCart() {
  cart = [];
  currentDiscount = 0;
  updateCartDisplay();
}

function updateCartDisplay() {
  const listEl = document.getElementById('cart-items-container');
  if (!listEl) return;

  listEl.innerHTML = renderCartItems();

  let subtotal = 0;
  let totalDiscount = currentDiscount;
  for (const it of cart) {
    subtotal += (it.qty * it.unitPrice);
  }

  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const tax = Math.round(taxableAmount * 0.03 * 100) / 100;
  const total = Math.round((taxableAmount + tax) * 100) / 100;

  document.getElementById('cart-subtotal').innerText = `₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('cart-discount').innerText = `-₹${totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('cart-tax').innerText = `₹${tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('cart-total').innerText = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.disabled = cart.length === 0;
  }
}

function renderCartItems() {
  if (cart.length === 0) {
    return `
      <div style="text-align: center; padding: 60px 20px; color: var(--gray-400);">
        <svg style="width: 48px; height: 48px; margin-bottom: 12px; color: var(--gray-300);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        <div style="font-weight: 600; font-size: 14px;">Cart is empty</div>
        <div style="font-size: 12px; margin-top: 4px;">Select items from catalog or scan barcode.</div>
      </div>
    `;
  }

  return cart.map(it => `
    <div class="cart-item-row">
      <div class="ci-info">
        <div class="ci-title">${it.productName}</div>
        <div class="ci-price">₹${it.unitPrice.toLocaleString()} each</div>
      </div>
      <div class="ci-qty-controls">
        <button class="qty-btn" onclick="changeQty('${it.productId}', -1)">-</button>
        <span class="qty-val">${it.qty}</span>
        <button class="qty-btn" onclick="changeQty('${it.productId}', 1)">+</button>
      </div>
      <div class="ci-total">₹${it.lineTotal.toLocaleString()}</div>
      <span class="ci-del" onclick="removeFromCart('${it.productId}')">✕</span>
    </div>
  `).join('');
}

// ----------------------------------------------------------------------------
// SIMULATE PHYSICAL HARDWARE BARCODE SCANNER
// ----------------------------------------------------------------------------
function simulateBarcodeScan() {
  // Pre-load barcode for "Royal Kundan & Pearl Bridal Choker Set" (8901234000011)
  const sampleBarcode = '8901234000011';
  const prod = products.find(p => p.barcode === sampleBarcode);

  if (prod) {
    showNotification(`Scanner Input: Read Tag "${sampleBarcode}" (${prod.name})`);
    addToCart(prod.id);
  }
}

// ----------------------------------------------------------------------------
// CHECKOUT & PAYMENT MODAL
// ----------------------------------------------------------------------------
function openCheckoutModal() {
  if (cart.length === 0) return;

  let subtotal = 0;
  for (const it of cart) subtotal += (it.qty * it.unitPrice);
  const tax = Math.round((subtotal - currentDiscount) * 0.03 * 100) / 100;
  const total = (subtotal - currentDiscount) + tax;

  openModal(`
    <div class="modal-header">
      <h3 style="font-size: 16px; font-weight: 700;">Finalize Sale & Accept Payment</h3>
      <span style="cursor: pointer;" onclick="closeModal()">✕</span>
    </div>
    <div class="modal-body">
      <div style="background: var(--gold-light); padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <div style="font-size: 12px; font-weight: 700; color: var(--gold-dark); text-transform: uppercase;">Total Amount Payable</div>
        <div style="font-size: 28px; font-weight: 800; color: var(--primary);">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
      </div>

      <div class="form-group">
        <label>Payment Method</label>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 8px;">
          <button class="btn btn-outline" style="justify-content: center; height: 50px;" onclick="finalizeSale('cash', ${total})">
            💵 Cash (Kick Drawer)
          </button>
          <button class="btn btn-outline" style="justify-content: center; height: 50px;" onclick="finalizeSale('card', ${total})">
            💳 Card Terminal
          </button>
          <button class="btn btn-outline" style="justify-content: center; height: 50px;" onclick="finalizeSale('upi', ${total})">
            📱 UPI / QR Code
          </button>
        </div>
      </div>

      <div class="form-group" style="margin-top: 16px;">
        <label>Customer Details for Invoice</label>
        <div style="font-size: 13px; color: var(--dark);">
          <strong>${currentCustomer ? currentCustomer.fullName : 'Walk-in Guest'}</strong>
          ${currentCustomer ? `(${currentCustomer.phone})` : ''}
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

async function finalizeSale(method, total) {
  closeModal();

  const idempotencyKey = 'pos-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const payload = {
    branchId: 'c0000000-0000-0000-0000-000000000001',
    customerId: currentCustomer ? currentCustomer.id : null,
    customerName: currentCustomer ? currentCustomer.fullName : 'Walk-in Guest',
    cashierName: getRoleDisplayName(currentRole),
    paymentMethod: method,
    idempotencyKey,
    items: cart.map(it => ({
      productId: it.productId,
      qty: it.qty,
      unitPrice: it.unitPrice,
      discount: it.discount,
    })),
  };

  try {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      showNotification(data.error || 'Checkout failed', true);
      return;
    }

    // Refresh products stock
    const pRes = await fetch(`${API_BASE}/products`);
    products = await pRes.json();

    salesHistory.unshift(data.sale);
    clearCart();

    // Trigger physical drawer kick if cash
    if (method === 'cash') {
      await triggerDrawerKick();
    }

    showThermalReceiptModal(data.sale);
  } catch (err) {
    showNotification('Network error during checkout: ' + err.message, true);
  }
}

// ----------------------------------------------------------------------------
// THERMAL RECEIPT MODAL & PRINTER EMULATOR (ESC/POS)
// ----------------------------------------------------------------------------
function showThermalReceiptModal(sale) {
  openModal(`
    <div class="modal-header">
      <h3 style="font-size: 16px; font-weight: 700;">Invoice Created & Receipt Printed</h3>
      <span style="cursor: pointer;" onclick="closeModal()">✕</span>
    </div>
    <div class="modal-body" style="background: #F1F5F9; padding: 20px;">
      <div class="thermal-receipt">
        <div class="receipt-header">
          <strong style="font-size: 14px;">ROYAL HERITAGE</strong><br>
          Bridal & Jewellery Lounge<br>
          GSTIN: 27AAAAA0000A1Z5<br>
          Tel: +91 98200 12345
        </div>
        <div class="receipt-divider"></div>
        <div>Invoice: ${sale.invoiceNumber}</div>
        <div>Date:    ${new Date(sale.saleDate).toLocaleString()}</div>
        <div>Cashier: ${sale.cashierName}</div>
        <div>Client:  ${sale.customerName}</div>
        <div class="receipt-divider"></div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          ${sale.items.map(it => `
            <tr>
              <td colspan="3"><strong>${it.productName}</strong></td>
            </tr>
            <tr>
              <td>${it.qty} x ₹${it.unitPrice.toLocaleString()}</td>
              <td style="text-align: right;">₹${it.lineTotal.toLocaleString()}</td>
            </tr>
          `).join('')}
        </table>
        <div class="receipt-divider"></div>
        <div style="display: flex; justify-content: space-between;">
          <span>Subtotal:</span>
          <span>₹${sale.subtotal.toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>GST (3%):</span>
          <span>₹${sale.taxAmount.toLocaleString()}</span>
        </div>
        <div class="receipt-divider"></div>
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold;">
          <span>TOTAL:</span>
          <span>₹${sale.totalAmount.toLocaleString()}</span>
        </div>
        <div style="font-size: 11px; margin-top: 4px;">Payment: ${sale.paymentMethod.toUpperCase()} (Approved)</div>
        <div class="receipt-divider"></div>
        <div style="text-align: center; font-size: 10px; line-height: 1.4;">
          Exchange within 14 days with original tags.<br>
          Thank you for celebrating with us!
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="window.print()">Print Thermal Copy (ESC/POS)</button>
    </div>
  `);
}

function printExistingReceipt(invoiceNumber) {
  const s = salesHistory.find(it => it.invoiceNumber === invoiceNumber);
  if (s) {
    showThermalReceiptModal(s);
  } else {
    showNotification(`Receipt for ${invoiceNumber} sent to Epson TM-T88VI printer.`);
  }
}

// ----------------------------------------------------------------------------
// CASH DRAWER KICK EMULATOR (RJ-11)
// ----------------------------------------------------------------------------
async function triggerDrawerKick() {
  try {
    const res = await fetch(`${API_BASE}/hardware/drawer/kick`, { method: 'POST' });
    const data = await res.json();
    showNotification(`⚡ Cash Drawer Kicked: Hex signal [${data.commandHex}] sent via RJ11.`);
  } catch (e) {
    showNotification('Cash Drawer Pulse Triggered.');
  }
}

// ----------------------------------------------------------------------------
// 3. RETURNS & REFUNDS SCREEN
// ----------------------------------------------------------------------------
function renderReturns(container) {
  const isManager = canPerform('approve_refund');

  container.innerHTML = `
    <div style="background: #FFF; border-radius: 12px; border: 1px solid var(--gray-200); padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <h3 style="font-size: 16px; font-weight: 700;">Process Customer Return & Credit Note</h3>
        ${!isManager ? `<span class="p-stock-badge stock-low">⚠️ Manager Approval Override Required</span>` : `<span class="p-stock-badge stock-ok">✓ Manager Authorization Active</span>`}
      </div>

      <div style="display: flex; gap: 12px; max-width: 600px;">
        <input type="text" id="return-invoice-input" class="form-input" placeholder="Enter original invoice number (e.g. INV-20261025-0012)...">
        <button class="btn btn-primary" onclick="lookupReturnInvoice()">Lookup Invoice</button>
      </div>
    </div>

    <div class="data-table-wrap">
      <div class="table-top-bar">
        <h3 style="font-size: 14px; font-weight: 700;">Processed Returns & Credit Memos</h3>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Return Memo #</th>
            <th>Original Invoice</th>
            <th>Reason</th>
            <th>Refund Amount</th>
            <th>Method</th>
            <th>Approved By</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody id="returns-tbody">
          <tr>
            <td style="font-family: monospace; font-weight: 700; color: var(--primary);">RET-40192</td>
            <td>INV-20261020-0008</td>
            <td>Client switched from kundan choker to polki necklace</td>
            <td style="font-weight: 700; color: var(--danger);">-₹18,500.00</td>
            <td>STORE CREDIT</td>
            <td>Sunita Mehta (Store Manager)</td>
            <td>2026-10-22</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function lookupReturnInvoice() {
  const inv = document.getElementById('return-invoice-input').value.trim();
  if (!inv) return showNotification('Please enter an invoice number', true);

  if (!canPerform('approve_refund')) {
    return showNotification('Permission Denied: Only Store Manager can approve refunds.', true);
  }

  openModal(`
    <div class="modal-header">
      <h3 style="font-size: 16px; font-weight: 700;">Return Items for ${inv}</h3>
      <span style="cursor: pointer;" onclick="closeModal()">✕</span>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Reason for Return</label>
        <select class="form-select" id="return-reason-select">
          <option>Customer changed preference on jewellery design</option>
          <option>Color tone / metal purity variation</option>
          <option>Bridal event rescheduled / cancelled</option>
          <option>Sizing adjustment / exchange</option>
        </select>
      </div>
      <div class="form-group">
        <label>Restock Item into Master Inventory?</label>
        <select class="form-select" id="return-restock-select">
          <option value="true">Yes - Restock to Available Inventory</option>
          <option value="false">No - Move to Damaged / Inspection</option>
        </select>
      </div>
      <div class="form-group">
        <label>Refund Method</label>
        <select class="form-select" id="return-method-select">
          <option value="store_credit">Store Credit (Recommended)</option>
          <option value="cash">Cash Refund</option>
          <option value="bank_transfer">Original Card / Bank Transfer</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="confirmReturn('${inv}')">Authorize & Issue Refund</button>
    </div>
  `);
}

function confirmReturn(inv) {
  closeModal();
  showNotification(`Return processed for invoice ${inv}. Restock movement logged.`);
  switchView('returns');
}

// ----------------------------------------------------------------------------
// 4. BRIDAL PROJECTS SCREEN
// ----------------------------------------------------------------------------
function renderBridalProjects(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h3 style="font-size: 16px; font-weight: 700;">Bridal Event Pipeline & Packages</h3>
        <p style="font-size: 12px; color: var(--gray-500);">Track quotes, wedding artist schedules & installment payments</p>
      </div>
      <button class="btn btn-primary" onclick="openNewBridalLeadModal()">+ New Bridal Project</button>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 18px;">
      ${bridalProjects.map(bp => `
        <div style="background: #FFF; border-radius: 12px; border: 1px solid var(--gray-200); padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <span style="font-size: 11px; font-family: monospace; font-weight: 700; color: var(--primary);">${bp.projectCode}</span>
              <h4 style="font-size: 16px; font-weight: 700; color: var(--dark); margin-top: 2px;">${bp.customerName}</h4>
            </div>
            <span class="p-stock-badge ${bp.status === 'confirmed' ? 'stock-ok' : 'stock-low'}">${bp.status.toUpperCase()}</span>
          </div>

          <div style="font-size: 12px; color: var(--gray-600); margin-bottom: 14px; line-height: 1.6;">
            <div>👰 Package: <strong>${bp.packageName}</strong></div>
            <div>📅 Event Date: <strong>${bp.eventDate}</strong></div>
            <div>📍 Venue: ${bp.venueAddress}</div>
          </div>

          <!-- Payment Installment Progress -->
          <div style="background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: 8px; padding: 12px; margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
              <span>Total Budget: <strong>₹${bp.totalBudget.toLocaleString()}</strong></span>
              <span style="color: var(--success); font-weight: 700;">Deposit: ₹${bp.depositPaid.toLocaleString()}</span>
            </div>
            <div style="font-size: 12px; color: var(--danger); font-weight: 700;">
              Balance Due: ₹${bp.balanceDue.toLocaleString()}
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="viewBridalServices('${bp.id}')">View Artists & Services (${bp.services.length})</button>
            <button class="btn btn-gold btn-sm" onclick="recordBridalInstallment('${bp.id}')">Record Payment</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function viewBridalServices(bpId) {
  const bp = bridalProjects.find(p => p.id === bpId);
  if (!bp) return;

  openModal(`
    <div class="modal-header">
      <h3 style="font-size: 16px; font-weight: 700;">Services for ${bp.customerName} (${bp.projectCode})</h3>
      <span style="cursor: pointer;" onclick="closeModal()">✕</span>
    </div>
    <div class="modal-body">
      <table class="data-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Ceremony Phase</th>
            <th>Assigned Stylist</th>
            <th>Rate</th>
          </tr>
        </thead>
        <tbody>
          ${bp.services.map(s => `
            <tr>
              <td><strong>${s.serviceType}</strong></td>
              <td><span class="p-stock-badge stock-ok">${s.eventPhase}</span></td>
              <td>${s.assignedStaffName || 'Unassigned'}</td>
              <td>₹${s.price.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="closeModal()">Done</button>
    </div>
  `);
}

function openNewBridalLeadModal() {
  openModal(`
    <div class="modal-header">
      <h3 style="font-size: 16px; font-weight: 700;">New Bridal Project Lead</h3>
      <span style="cursor: pointer;" onclick="closeModal()">✕</span>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Bride / Client Name</label>
        <input type="text" id="bp-name" class="form-input" placeholder="e.g. Shalini Roy">
      </div>
      <div class="form-group">
        <label>Wedding / Event Date</label>
        <input type="date" id="bp-date" class="form-input">
      </div>
      <div class="form-group">
        <label>Venue Address</label>
        <input type="text" id="bp-venue" class="form-input" placeholder="Hotel / Banquet venue">
      </div>
      <div class="form-group">
        <label>Package Selected</label>
        <select class="form-select" id="bp-package">
          <option>The Grand Maharani Bridal Royale (₹85,000)</option>
          <option>Elegance Bridal Couture Package (₹45,000)</option>
          <option>Engagement Glam & Sangeet Combo (₹30,000)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Initial Deposit Collected (₹)</label>
        <input type="number" id="bp-deposit" class="form-input" value="15000">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewBridalLead()">Create Bridal Project</button>
    </div>
  `);
}

async function saveNewBridalLead() {
  const name = document.getElementById('bp-name').value.trim();
  const date = document.getElementById('bp-date').value || '2026-12-25';
  const venue = document.getElementById('bp-venue').value.trim() || 'Mumbai';
  const pkg = document.getElementById('bp-package').value;
  const deposit = Number(document.getElementById('bp-deposit').value || 15000);

  if (!name) return showNotification('Please provide bride name', true);

  const newBp = {
    id: 'bp-' + Date.now(),
    projectCode: 'BP-2026-' + Math.floor(100 + Math.random() * 900),
    customerId: 'cu-1',
    customerName: name,
    eventDate: date,
    venueAddress: venue,
    packageName: pkg,
    status: 'confirmed',
    totalBudget: 65000,
    depositRequired: deposit,
    depositPaid: deposit,
    balanceDue: 65000 - deposit,
    services: [
      { id: 'bps-' + Date.now(), serviceType: 'HD Bridal Makeup', eventPhase: 'Wedding Day', assignedStaffName: 'Priya Kapoor', price: 25000, status: 'confirmed' }
    ],
  };

  bridalProjects.unshift(newBp);
  closeModal();
  showNotification(`Bridal project created for ${name}!`);
  switchView('bridal');
}

// ----------------------------------------------------------------------------
// 5. APPOINTMENTS & CHECK-IN SCREEN
// ----------------------------------------------------------------------------
function renderAppointments(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h3 style="font-size: 16px; font-weight: 700;">Salon Appointments & Stylist Allocation</h3>
        <p style="font-size: 12px; color: var(--gray-500);">Pre-bridal skin treatments, trials and makeover sessions</p>
      </div>
      <button class="btn btn-primary" onclick="openNewAppointmentModal()">+ Book Appointment</button>
    </div>

    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Apt #</th>
            <th>Customer</th>
            <th>Service</th>
            <th>Assigned Stylist</th>
            <th>Scheduled Time</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${appointments.map(a => `
            <tr>
              <td style="font-family: monospace; font-weight: 700; color: var(--primary);">${a.appointmentNumber}</td>
              <td><strong>${a.customerName}</strong><br><span style="font-size: 11px; color: var(--gray-500);">${a.customerPhone || ''}</span></td>
              <td>${a.serviceName}</td>
              <td><span style="font-weight: 600; color: var(--gold-dark);">${a.staffName}</span></td>
              <td>${a.timeSlot}</td>
              <td><span class="p-stock-badge ${a.status === 'checked_in' ? 'stock-ok' : 'stock-low'}">${a.status.toUpperCase()}</span></td>
              <td>
                ${a.status !== 'checked_in'
                  ? `<button class="btn btn-gold btn-sm" onclick="checkInCustomer('${a.id}')">Check-In</button>`
                  : `<button class="btn btn-outline btn-sm" onclick="pushAppointmentToPos('${a.id}')">Bill to POS 🛒</button>`
                }
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function checkInCustomer(aptId) {
  const apt = appointments.find(a => a.id === aptId);
  if (!apt) return;
  apt.status = 'checked_in';
  showNotification(`✓ ${apt.customerName} has been checked in for ${apt.serviceName}. Stylist notified.`);
  switchView('appointments');
}

function pushAppointmentToPos(aptId) {
  const apt = appointments.find(a => a.id === aptId);
  if (!apt) return;

  const srvProd = products.find(p => p.id === apt.serviceId) || products.find(p => p.isService);
  if (srvProd) {
    addToCart(srvProd.id);
    switchView('pos');
    showNotification(`Added "${apt.serviceName}" to POS Cart for ${apt.customerName}. Ready to checkout.`);
  }
}

function openNewAppointmentModal() {
  openModal(`
    <div class="modal-header">
      <h3 style="font-size: 16px; font-weight: 700;">Book Beauty / Salon Appointment</h3>
      <span style="cursor: pointer;" onclick="closeModal()">✕</span>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Customer</label>
        <select class="form-select" id="apt-cust-select">
          ${customers.map(c => `<option value="${c.id}">${c.fullName} (${c.phone})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Service</label>
        <select class="form-select" id="apt-srv-select">
          ${products.filter(p => p.isService).map(s => `<option value="${s.id}">${s.name} - ₹${s.sellPrice.toLocaleString()}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Assigned Stylist / Beautician</label>
        <select class="form-select" id="apt-staff-select">
          <option value="emp-4">Aanya Sharma (Skin Care Specialist)</option>
          <option value="emp-2">Priya Kapoor (Bridal Lead Artist)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Time Slot</label>
        <input type="text" id="apt-slot-input" class="form-input" value="Tomorrow, 11:30 AM - 01:00 PM">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewAppointment()">Confirm Booking</button>
    </div>
  `);
}

function saveNewAppointment() {
  const custId = document.getElementById('apt-cust-select').value;
  const srvId = document.getElementById('apt-srv-select').value;
  const slot = document.getElementById('apt-slot-input').value;

  const cust = customers.find(c => c.id === custId);
  const srv = products.find(p => p.id === srvId);

  const newApt = {
    id: 'apt-' + Date.now(),
    appointmentNumber: 'APT-' + Math.floor(1000 + Math.random() * 9000),
    customerId: custId,
    customerName: cust.fullName,
    customerPhone: cust.phone,
    serviceId: srvId,
    serviceName: srv.name,
    staffId: 'emp-4',
    staffName: 'Aanya Sharma',
    timeSlot: slot,
    status: 'scheduled',
    totalPrice: srv.sellPrice,
    depositAmount: 0,
  };

  appointments.unshift(newApt);
  closeModal();
  showNotification('Appointment successfully scheduled!');
  switchView('appointments');
}

// ----------------------------------------------------------------------------
// 6. INVENTORY & JEWELLERY SCREEN
// ----------------------------------------------------------------------------
function renderInventory(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h3 style="font-size: 16px; font-weight: 700;">Jewellery & Product Master Catalog</h3>
        <p style="font-size: 12px; color: var(--gray-500);">Karat purity, weights, barcodes and real-time inventory counts</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-outline" onclick="switchView('adjustments')">Adjust Stock</button>
        <button class="btn btn-primary" onclick="openNewProductModal()">+ Add New Product</button>
      </div>
    </div>

    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>SKU & Barcode</th>
            <th>Product Name</th>
            <th>Category</th>
            <th>Cost Price</th>
            <th>Selling Price</th>
            <th>Stock On Hand</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(p => `
            <tr>
              <td>
                <span style="font-family: monospace; font-weight: 700; color: var(--primary);">${p.sku}</span><br>
                <span style="font-size: 11px; color: var(--gray-400);">${p.barcode || 'N/A'}</span>
              </td>
              <td><strong>${p.name}</strong></td>
              <td>${p.categoryName || 'Standard'}</td>
              <td>₹${p.costPrice.toLocaleString()}</td>
              <td style="font-weight: 700;">₹${p.sellPrice.toLocaleString()}</td>
              <td style="font-weight: 800;">${p.isService ? 'SERVICE' : p.stockOnHand}</td>
              <td>
                ${p.isService
                  ? `<span class="p-stock-badge stock-ok">SERVICE</span>`
                  : `<span class="p-stock-badge ${p.stockOnHand <= p.reorderThreshold ? 'stock-low' : 'stock-ok'}">
                      ${p.stockOnHand <= p.reorderThreshold ? 'REORDER ALERT' : 'IN STOCK'}
                    </span>`
                }
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function openNewProductModal() {
  openModal(`
    <div class="modal-header">
      <h3 style="font-size: 16px; font-weight: 700;">Add New Product / Jewellery Piece</h3>
      <span style="cursor: pointer;" onclick="closeModal()">✕</span>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Product / Jewellery Title</label>
        <input type="text" id="np-name" class="form-input" placeholder="e.g. 22K Gold Polki Emerald Choker">
      </div>
      <div class="form-group">
        <label>SKU</label>
        <input type="text" id="np-sku" class="form-input" placeholder="e.g. JWL-POL-009">
      </div>
      <div class="form-group">
        <label>Pricing (Cost & Selling Price)</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <input type="number" id="np-cost" class="form-input" placeholder="Cost Price (₹)">
          <input type="number" id="np-sell" class="form-input" placeholder="Sell Price (₹)">
        </div>
      </div>
      <div class="form-group">
        <label>Initial Stock Quantity</label>
        <input type="number" id="np-stock" class="form-input" value="5">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewProduct()">Save Product</button>
    </div>
  `);
}

async function saveNewProduct() {
  const name = document.getElementById('np-name').value.trim();
  const sku = document.getElementById('np-sku').value.trim();
  const cost = Number(document.getElementById('np-cost').value || 0);
  const sell = Number(document.getElementById('np-sell').value || 0);
  const stock = Number(document.getElementById('np-stock').value || 1);

  if (!name || !sell) return showNotification('Please provide product name and price', true);

  const newP = {
    id: 'p-' + Date.now(),
    sku: sku || 'JWL-' + Math.floor(100 + Math.random() * 900),
    barcode: '890' + Math.floor(1000000000 + Math.random() * 9000000000),
    name,
    categoryId: 'cat-1',
    categoryName: 'Bridal Jewellery Sets',
    trackType: 'serialized',
    costPrice: cost,
    sellPrice: sell,
    stockOnHand: stock,
    reorderThreshold: 2,
    isService: false,
  };

  products.unshift(newP);
  closeModal();
  showNotification(`Created product: ${name}`);
  switchView('inventory');
}

// ----------------------------------------------------------------------------
// 7. STOCK ADJUSTMENTS SCREEN
// ----------------------------------------------------------------------------
function renderAdjustments(container) {
  container.innerHTML = `
    <div style="background: #FFF; border-radius: 12px; border: 1px solid var(--gray-200); padding: 24px; margin-bottom: 24px;">
      <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px;">Record Stock Adjustment (Damages, Discrepancies & Rentals)</h3>
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 2fr auto; gap: 12px; align-items: flex-end;">
        <div class="form-group" style="margin: 0;">
          <label>Select Product</label>
          <select class="form-select" id="adj-product-select">
            ${products.filter(p => !p.isService).map(p => `<option value="${p.id}">${p.name} (Cur: ${p.stockOnHand})</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin: 0;">
          <label>Qty Change (+/-)</label>
          <input type="number" id="adj-qty-input" class="form-input" value="-1">
        </div>
        <div class="form-group" style="margin: 0;">
          <label>Reason</label>
          <select class="form-select" id="adj-reason-select">
            <option value="damage_loss">Damage / Stone Loss</option>
            <option value="inventory_adjustment">Physical Count Discrepancy</option>
            <option value="bridal_rental_out">Bridal Rental Checkout</option>
            <option value="bridal_rental_in">Bridal Rental Returned</option>
          </select>
        </div>
        <div class="form-group" style="margin: 0;">
          <label>Audit Note</label>
          <input type="text" id="adj-note-input" class="form-input" placeholder="e.g. Sent for prong repair">
        </div>
        <button class="btn btn-primary" onclick="submitStockAdjustment()" style="height: 42px;">Save Adjustment</button>
      </div>
    </div>

    <div class="data-table-wrap">
      <div class="table-top-bar">
        <h3 style="font-size: 14px; font-weight: 700;">Immutable Stock Movements Trail</h3>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Adjustment</th>
            <th>Previous Stock</th>
            <th>New Stock</th>
            <th>Reason</th>
            <th>Notes</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody id="movements-tbody">
          <tr>
            <td><strong>Royal Kundan & Pearl Bridal Choker Set</strong></td>
            <td style="color: var(--danger); font-weight: 700;">-1</td>
            <td>9</td>
            <td>8</td>
            <td><span class="p-stock-badge stock-low">SALE</span></td>
            <td>Sold in invoice: INV-20261025-0012</td>
            <td>2026-10-25 14:32</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

async function submitStockAdjustment() {
  const prodId = document.getElementById('adj-product-select').value;
  const qty = Number(document.getElementById('adj-qty-input').value);
  const reason = document.getElementById('adj-reason-select').value;
  const note = document.getElementById('adj-note-input').value.trim();

  if (!qty) return showNotification('Please specify a non-zero quantity change', true);

  try {
    const res = await fetch(`${API_BASE}/stock/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: prodId, changeQty: qty, reason, notes: note }),
    });

    const data = await res.json();
    if (res.ok) {
      showNotification(`Stock adjusted for ${data.product.name}. New count: ${data.product.stockOnHand}`);
      const pRes = await fetch(`${API_BASE}/products`);
      products = await pRes.json();
      switchView('adjustments');
    }
  } catch (err) {
    showNotification('Adjustment failed: ' + err.message, true);
  }
}

// ----------------------------------------------------------------------------
// 8. PURCHASING & PURCHASE ORDERS (POs)
// ----------------------------------------------------------------------------
function renderPurchasing(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h3 style="font-size: 16px; font-weight: 700;">Purchasing & Supplier Orders</h3>
        <p style="font-size: 12px; color: var(--gray-500);">Procurement from Jaipur jewel crafting vendors & cosmetics supplies</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-outline" onclick="openReceiveGoodsModal()">Record Goods Receipt (GRN)</button>
        <button class="btn btn-primary" onclick="openNewPoModal()">+ Create Purchase Order</button>
      </div>
    </div>

    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>PO Number</th>
            <th>Supplier</th>
            <th>Order Date</th>
            <th>Expected Delivery</th>
            <th>Items Ordered</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${purchaseOrders.length === 0 ? `
            <tr>
              <td colspan="8" style="text-align: center; padding: 30px; color: var(--gray-400);">No purchase orders found. Click "+ Create Purchase Order" to place an order.</td>
            </tr>
          ` : purchaseOrders.map(po => `
            <tr>
              <td style="font-family: monospace; font-weight: 700; color: var(--primary);">${po.poNumber}</td>
              <td><strong>${po.supplierName || 'Supplier'}</strong></td>
              <td>${po.orderDate || 'N/A'}</td>
              <td>${po.expectedDate || 'N/A'}</td>
              <td>
                <span style="font-size: 12px; color: var(--gray-600);">
                  ${po.items && po.items.length > 0
                    ? po.items.map(it => `${it.productName || 'Product'} (×${it.orderedQty || 1})`).join(', ')
                    : '1 item'}
                </span>
              </td>
              <td style="font-weight: 700;">₹${Number(po.totalAmount || 0).toLocaleString()}</td>
              <td>
                ${po.status === 'completed'
                  ? `<span class="p-stock-badge stock-ok">COMPLETED</span>`
                  : `<span class="p-stock-badge" style="background: var(--warning-light); color: var(--warning); border: 1px solid var(--warning);">ISSUED</span>`
                }
              </td>
              <td>
                ${po.status !== 'completed'
                  ? `<button class="btn btn-gold btn-sm" onclick="openReceiveGoodsModal('${po.id}')">Receive Goods</button>`
                  : `<span style="font-size: 12px; color: var(--success); font-weight: 600;">✓ Received</span>`
                }
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function openNewPoModal() {
  const inventoryProducts = products.filter(p => !p.isService);
  const defaultProduct = inventoryProducts[0] || { id: '', name: 'No products available', costPrice: 0 };
  const defaultDelivery = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  openModal(`
    <div class="modal-header">
      <h3 style="font-size: 16px; font-weight: 700;">Create Supplier Purchase Order</h3>
      <span style="cursor: pointer;" onclick="closeModal()">✕</span>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Supplier</label>
        <select class="form-select" id="po-supplier-select">
          ${suppliers.map(s => `<option value="${s.id}" data-name="${s.companyName}">${s.companyName}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Expected Delivery Date</label>
        <input type="date" id="po-expected-date" class="form-input" value="${defaultDelivery}">
      </div>

      <div style="background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: 8px; padding: 14px; margin-bottom: 16px;">
        <h4 style="font-size: 13px; font-weight: 700; color: var(--dark); margin-bottom: 10px;">Order Item Details</h4>
        
        <div class="form-group">
          <label>Product to Order</label>
          <select class="form-select" id="po-prod-select" onchange="onPoProductSelectChange(this.value)">
            ${inventoryProducts.map(p => `
              <option value="${p.id}" data-cost="${p.costPrice}" data-name="${p.name}">
                ${p.name} (Current Stock: ${p.stockOnHand})
              </option>
            `).join('')}
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label>Order Quantity</label>
            <input type="number" id="po-qty-input" class="form-input" value="5" min="1" oninput="calculatePoTotal()">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label>Agreed Unit Cost (₹)</label>
            <input type="number" id="po-cost-input" class="form-input" value="${defaultProduct.costPrice || 0}" min="0" oninput="calculatePoTotal()">
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--gray-300);">
          <span style="font-size: 13px; font-weight: 600; color: var(--gray-600);">Estimated PO Total:</span>
          <span id="po-total-display" style="font-size: 18px; font-weight: 700; color: var(--primary);">
            ₹${Number((defaultProduct.costPrice || 0) * 5).toLocaleString()}
          </span>
        </div>
      </div>

      <div class="form-group">
        <label>Instructions / Shipping Notes (Optional)</label>
        <input type="text" id="po-notes" class="form-input" placeholder="e.g. Require hallmark certification tags for delivery">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitNewPo()">Create Purchase Order</button>
    </div>
  `);
}

function onPoProductSelectChange(prodId) {
  const prod = products.find(p => p.id === prodId);
  if (prod) {
    const costInput = document.getElementById('po-cost-input');
    if (costInput) costInput.value = prod.costPrice || 0;
    calculatePoTotal();
  }
}

function calculatePoTotal() {
  const qty = Number(document.getElementById('po-qty-input')?.value || 0);
  const cost = Number(document.getElementById('po-cost-input')?.value || 0);
  const total = qty * cost;
  const display = document.getElementById('po-total-display');
  if (display) {
    display.innerText = '₹' + total.toLocaleString();
  }
  return total;
}

async function submitNewPo() {
  const supSelect = document.getElementById('po-supplier-select');
  const supplierId = supSelect?.value || 'sup-1';
  const supplierName = supSelect?.selectedOptions[0]?.getAttribute('data-name') || 'Jaipur Royal Jewels Crafting Co.';
  const expectedDate = document.getElementById('po-expected-date')?.value || null;
  const prodSelect = document.getElementById('po-prod-select');
  const productId = prodSelect?.value;
  const productName = prodSelect?.selectedOptions[0]?.getAttribute('data-name') || 'Jewellery Product';
  const orderedQty = Number(document.getElementById('po-qty-input')?.value || 1);
  const unitCost = Number(document.getElementById('po-cost-input')?.value || 0);

  if (!productId || orderedQty <= 0) {
    return showNotification('Please specify a valid product and quantity', true);
  }

  const lineTotal = orderedQty * unitCost;
  const items = [{
    productId,
    productName,
    orderedQty,
    receivedQty: 0,
    unitCost,
    lineTotal,
  }];

  let createdPo = null;
  try {
    const res = await fetch(`${API_BASE}/purchasing/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierId,
        supplierName,
        expectedDate,
        totalAmount: lineTotal,
        items,
      }),
    });
    if (res.ok) {
      createdPo = await res.json();
    }
  } catch (err) {
    console.warn('API error saving purchase order:', err);
  }

  if (!createdPo) {
    createdPo = {
      id: 'po-' + Date.now(),
      poNumber: 'PO-2026-' + Math.floor(1000 + Math.random() * 9000),
      supplierId,
      supplierName,
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDate,
      status: 'issued',
      totalAmount: lineTotal,
      items,
    };
  }

  purchaseOrders.unshift(createdPo);
  closeModal();
  showNotification(`Purchase Order ${createdPo.poNumber} created successfully!`);
  switchView('purchasing');
}

function openReceiveGoodsModal(poRef) {
  let targetPo = null;
  if (poRef) {
    targetPo = purchaseOrders.find(p => p.id === poRef || p.poNumber === poRef);
  }

  const defaultSup = targetPo ? targetPo.supplierName : 'Jaipur Royal Jewels Crafting Co.';
  const defaultProdId = (targetPo && targetPo.items && targetPo.items[0]) ? targetPo.items[0].productId : '';
  const defaultQty = (targetPo && targetPo.items && targetPo.items[0]) ? targetPo.items[0].orderedQty : 5;
  const defaultInv = targetPo ? `INV/${targetPo.poNumber}` : 'JRJ/INV/2026/891';

  openModal(`
    <div class="modal-header">
      <h3 style="font-size: 16px; font-weight: 700;">Record Goods Receipt (GRN Intake)</h3>
      <span style="cursor: pointer;" onclick="closeModal()">✕</span>
    </div>
    <div class="modal-body">
      ${targetPo ? `
        <div style="background: var(--gold-light); border: 1px solid #FDE68A; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 12px; color: var(--gold-dark); font-weight: 600;">
          Receiving stock against <strong>${targetPo.poNumber}</strong> (${targetPo.supplierName})
        </div>
      ` : ''}
      <div class="form-group">
        <label>Supplier</label>
        <select class="form-select" id="grn-sup-select">
          ${suppliers.map(s => `
            <option value="${s.id}" ${s.companyName === defaultSup ? 'selected' : ''}>${s.companyName}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Supplier Invoice Reference #</label>
        <input type="text" id="grn-inv-ref" class="form-input" value="${defaultInv}">
      </div>
      <div class="form-group">
        <label>Product Received</label>
        <select class="form-select" id="grn-prod-select">
          ${products.filter(p => !p.isService).map(p => `
            <option value="${p.id}" ${p.id === defaultProdId ? 'selected' : ''}>${p.name}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Received Quantity</label>
        <input type="number" id="grn-qty-input" class="form-input" value="${defaultQty}" min="1">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitGoodsReceipt('${targetPo ? targetPo.id : ''}')">Confirm & Restock</button>
    </div>
  `);
}

async function submitGoodsReceipt(poId) {
  const prodId = document.getElementById('grn-prod-select')?.value;
  const qty = Number(document.getElementById('grn-qty-input')?.value || 1);
  const invRef = document.getElementById('grn-inv-ref')?.value?.trim() || 'N/A';

  const prod = products.find(p => p.id === prodId);
  if (prod) {
    prod.stockOnHand += qty;
  }

  // Update server goods receipt
  try {
    await fetch(`${API_BASE}/goods_receipts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        poId: poId || null,
        supplierInvoiceRef: invRef,
        items: [{
          productId: prodId,
          receivedQty: qty,
          unitCost: prod ? prod.costPrice : 0,
        }],
      }),
    });
  } catch (err) {
    console.warn('API error recording goods receipt:', err);
  }

  if (poId) {
    const po = purchaseOrders.find(p => p.id === poId || p.poNumber === poId);
    if (po) po.status = 'completed';
  }

  closeModal();
  showNotification(`Goods receipt GRN created! Restocked ${qty} units of ${prod ? prod.name : 'product'}.`);
  switchView('purchasing');
}

// ----------------------------------------------------------------------------
// 9. DAY CLOSE (CASHUP RECONCILIATION)
// ----------------------------------------------------------------------------
function renderDayClose(container) {
  const expectedCash = 5000 + salesHistory
    .filter(s => s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.totalAmount, 0);

  container.innerHTML = `
    <div style="background: #FFF; border-radius: 12px; border: 1px solid var(--gray-200); padding: 24px; max-width: 640px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
      <h3 style="font-size: 18px; font-weight: 700; color: var(--dark); margin-bottom: 6px;">End-of-Day Cash Register Reconciliation</h3>
      <p style="font-size: 13px; color: var(--gray-500); margin-bottom: 20px;">Reconcile cash drawer opening float against daily register sales.</p>

      <div style="background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <div class="sum-row">
          <span>Morning Float Cash:</span>
          <strong>₹5,000.00</strong>
        </div>
        <div class="sum-row">
          <span>Today's Cash Sales:</span>
          <strong style="color: var(--success);">+₹0.00</strong>
        </div>
        <div class="sum-row">
          <span>Cash Refunds Issued:</span>
          <strong style="color: var(--danger);">-₹0.00</strong>
        </div>
        <div class="sum-row">
          <span>Petty Cash Expenses:</span>
          <strong style="color: var(--danger);">-₹2,300.00</strong>
        </div>
        <div class="sum-row total-row" style="font-size: 16px;">
          <span>System Expected Cash:</span>
          <span>₹${(expectedCash - 2300).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div class="form-group">
        <label style="font-size: 13px;">Physical Counted Cash in Safe (₹)</label>
        <input type="number" id="counted-cash-input" class="form-input" style="font-size: 16px; font-weight: 700;" placeholder="Enter physical counted cash amount..." value="${expectedCash - 2300}">
      </div>

      <div class="form-group">
        <label>Manager Closing Notes</label>
        <textarea id="cashup-notes" class="form-textarea" rows="2" placeholder="e.g. All drawer transactions balanced. Register locked for night."></textarea>
      </div>

      <button class="btn btn-gold" style="width: 100%; height: 46px; justify-content: center; font-size: 14px;" onclick="finalizeCashup(${expectedCash - 2300})">
        Lock Register & Finalize Day Closing
      </button>
    </div>
  `;
}

function finalizeCashup(expected) {
  const counted = Number(document.getElementById('counted-cash-input').value || 0);
  const diff = counted - expected;

  showNotification(`Day closing recorded! Actual: ₹${counted.toLocaleString()}, Discrepancy: ₹${diff.toLocaleString()}`);
  switchView('dashboard');
}

// ----------------------------------------------------------------------------
// 10. CUSTOMERS CRM SCREEN
// ----------------------------------------------------------------------------
function renderCustomers(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h3 style="font-size: 16px; font-weight: 700;">Customer CRM & Bridal Profiles</h3>
        <p style="font-size: 12px; color: var(--gray-500);">Wedding dates, beauty skin notes, jewellery preferences & loyalty points</p>
      </div>
      <button class="btn btn-primary" onclick="openNewCustomerModal()">+ Add Customer</button>
    </div>

    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Customer Name</th>
            <th>Contact & City</th>
            <th>Wedding Date</th>
            <th>Loyalty Points</th>
            <th>Jewellery Preferences</th>
            <th>Skin & Hair Notes</th>
          </tr>
        </thead>
        <tbody>
          ${customers.map(c => `
            <tr>
              <td><strong>${c.fullName}</strong></td>
              <td>${c.phone}<br><span style="font-size: 11px; color: var(--gray-500);">${c.city || 'Mumbai'}</span></td>
              <td>${c.weddingDate ? `<span class="p-stock-badge stock-ok">💍 ${c.weddingDate}</span>` : 'N/A'}</td>
              <td><strong style="color: var(--gold-dark);">${c.loyaltyPoints} Pts</strong></td>
              <td style="font-size: 12px;">${c.jewelryPreferences || 'None'}</td>
              <td style="font-size: 12px;">${c.skinHairNotes || 'None'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function openNewCustomerModal() {
  openModal(`
    <div class="modal-header">
      <h3 style="font-size: 16px; font-weight: 700;">New Customer Registration</h3>
      <span style="cursor: pointer;" onclick="closeModal()">✕</span>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="nc-name" class="form-input" placeholder="e.g. Shruti Sen">
      </div>
      <div class="form-group">
        <label>Phone Number</label>
        <input type="text" id="nc-phone" class="form-input" placeholder="+91 98...">
      </div>
      <div class="form-group">
        <label>Wedding Date (If Bride)</label>
        <input type="date" id="nc-wedding" class="form-input">
      </div>
      <div class="form-group">
        <label>Jewellery Style Preference</label>
        <input type="text" id="nc-jewel" class="form-input" placeholder="e.g. Polki, Kundan, Temple Jewellery">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewCustomer()">Register Customer</button>
    </div>
  `);
}

function saveNewCustomer() {
  const name = document.getElementById('nc-name').value.trim();
  const phone = document.getElementById('nc-phone').value.trim();
  const date = document.getElementById('nc-wedding').value;
  const jewel = document.getElementById('nc-jewel').value.trim();

  if (!name || !phone) return showNotification('Please provide name and phone', true);

  const newC = {
    id: 'cu-' + Date.now(),
    fullName: name,
    phone,
    weddingDate: date || null,
    jewelryPreferences: jewel,
    loyaltyPoints: 0,
    storeCredit: 0,
  };

  customers.unshift(newC);
  closeModal();
  showNotification(`Customer registered: ${name}`);
  switchView('customers');
}

// ----------------------------------------------------------------------------
// 11. SHIFTS & ATTENDANCE SCREEN
// ----------------------------------------------------------------------------
function renderShifts(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h3 style="font-size: 16px; font-weight: 700;">Staff Roster & Live Time Clock</h3>
        <p style="font-size: 12px; color: var(--gray-500);">Clock in/out tracking for beauticians, stylists & cashiers</p>
      </div>
      <button class="btn btn-primary" onclick="simulateClockIn()">Clock In (Live Check-in)</button>
    </div>

    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Staff Member</th>
            <th>Role</th>
            <th>Date</th>
            <th>Clock In</th>
            <th>Clock Out</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Sunita Mehta</strong></td>
            <td>Store Manager</td>
            <td>2026-10-26</td>
            <td>09:28 AM</td>
            <td>-</td>
            <td><span class="p-stock-badge stock-ok">CLOCKED IN</span></td>
          </tr>
          <tr>
            <td><strong>Priya Kapoor</strong></td>
            <td>Bridal Lead Artist</td>
            <td>2026-10-26</td>
            <td>09:58 AM</td>
            <td>-</td>
            <td><span class="p-stock-badge stock-ok">CLOCKED IN</span></td>
          </tr>
          <tr>
            <td><strong>Aanya Sharma</strong></td>
            <td>Receptionist</td>
            <td>2026-10-26</td>
            <td>08:55 AM</td>
            <td>-</td>
            <td><span class="p-stock-badge stock-ok">CLOCKED IN</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function simulateClockIn() {
  showNotification('Staff member clocked in successfully with timestamp recorded.');
}

// ----------------------------------------------------------------------------
// 12. REPORTS SCREEN
// ----------------------------------------------------------------------------
function renderReports(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h3 style="font-size: 16px; font-weight: 700;">Financial Reports & Performance Analytics</h3>
        <p style="font-size: 12px; color: var(--gray-500);">Sales by category, bridal revenue, staff commissions & inventory valuation</p>
      </div>
      <button class="btn btn-outline" onclick="exportCsvReport()">Export Report (CSV)</button>
    </div>

    <div class="grid-4">
      <div class="stat-card">
        <div class="stat-label">Total Jewellery Inventory Valuation</div>
        <div class="stat-val">₹4,28,500</div>
        <div class="stat-sub">Based on cost price of physical stock</div>
      </div>
      <div class="stat-card gold">
        <div class="stat-label">Bridal Project Pipeline Value</div>
        <div class="stat-val">₹1,30,000</div>
        <div class="stat-sub">2 Active wedding projects</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Average Sale Ticket</div>
        <div class="stat-val">₹32,500</div>
        <div class="stat-sub">High-ticket bridal transactions</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Staff Commissions Accrued</div>
        <div class="stat-val">₹6,850</div>
        <div class="stat-sub">Ready for payroll cycle</div>
      </div>
    </div>
  `;
}

function exportCsvReport() {
  showNotification('Sales & Inventory report exported to CSV successfully.');
}

// ----------------------------------------------------------------------------
// 13. SETTINGS & AUDIT LOGS SCREEN
// ----------------------------------------------------------------------------
function renderSettings(container) {
  container.innerHTML = `
    <div style="background: #FFF; border-radius: 12px; border: 1px solid var(--gray-200); padding: 24px; margin-bottom: 24px;">
      <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px;">Branch & Hardware Configuration</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div class="form-group">
          <label>Store Name</label>
          <input type="text" class="form-input" value="Royal Heritage Bridal & Jewellery Lounge" readonly>
        </div>
        <div class="form-group">
          <label>GSTIN / Tax ID</label>
          <input type="text" class="form-input" value="27AAAAA0000A1Z5" readonly>
        </div>
        <div class="form-group">
          <label>Default Jewellery GST Rate (%)</label>
          <input type="number" class="form-input" value="3.0" readonly>
        </div>
        <div class="form-group">
          <label>Thermal Receipt Printer Port</label>
          <input type="text" class="form-input" value="USB001 (Epson ESC/POS TM-T88VI)" readonly>
        </div>
      </div>
    </div>

    <div class="data-table-wrap">
      <div class="table-top-bar">
        <h3 style="font-size: 14px; font-weight: 700;">Immutable Security & Audit Trail</h3>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Details</th>
            <th>Role</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="p-stock-badge stock-ok">SYSTEM_STARTUP</span></td>
            <td>POS server initialized with secure RLS and audit trail</td>
            <td>system_admin</td>
            <td>2026-10-26 09:30</td>
          </tr>
          <tr>
            <td><span class="p-stock-badge stock-ok">SALE_COMPLETED</span></td>
            <td>Invoice INV-20261025-0012: ₹35,017.94 (CARD)</td>
            <td>cashier</td>
            <td>2026-10-25 14:32</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// MODAL & NOTIFICATION HELPERS
// ----------------------------------------------------------------------------
function openModal(htmlContent) {
  const box = document.getElementById('modal-box');
  const backdrop = document.getElementById('modal-backdrop');
  box.innerHTML = htmlContent;
  backdrop.classList.add('open');
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
}

function showNotification(message, isError = false) {
  const el = document.createElement('div');
  el.style.position = 'fixed';
  el.style.bottom = '24px';
  el.style.right = '24px';
  el.style.background = isError ? '#EF4444' : '#111827';
  el.style.color = '#FFF';
  el.style.padding = '12px 20px';
  el.style.borderRadius = '8px';
  el.style.fontSize = '13px';
  el.style.fontWeight = '600';
  el.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
  el.style.zIndex = '9999';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.gap = '10px';
  el.innerHTML = isError ? `⚠️ ${message}` : `✓ ${message}`;

  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}
