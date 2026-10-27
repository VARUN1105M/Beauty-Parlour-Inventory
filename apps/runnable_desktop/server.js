const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// ============================================================================
// IN-MEMORY DATA STORE WITH RICH SEED DATA
// ============================================================================
const store = {
  business: {
    id: 'b-001',
    name: 'Royal Heritage Bridal & Jewellery Lounge',
    legalName: 'Royal Heritage Luxury Retail Pvt Ltd',
    gstin: '27AAAAA0000A1Z5',
    currency: '₹',
    phone: '+91 98200 12345',
    email: 'contact@royalheritagebridals.com',
    address: '45 Palace Road, Diamond District, Mumbai 400001',
    taxRate: 3.0, // 3% Jewellery GST
  },
  roles: [
    { code: 'store_manager', name: 'Store Manager', description: 'Full branch access, financial overrides & day closing' },
    { code: 'bridal_manager', name: 'Bridal Manager', description: 'Bridal packages, trial sessions, schedule artists' },
    { code: 'inventory_manager', name: 'Inventory Manager', description: 'Stock intake, POs, barcode management, adjustments' },
    { code: 'receptionist', name: 'Receptionist', description: 'Customer check-in, appointments booking & salon checkout' },
    { code: 'cashier', name: 'Cashier', description: 'High-speed POS billing, cash drawer & receipts' },
  ],
  employees: [
    { id: 'emp-1', code: 'EMP-001', name: 'Sunita Mehta', role: 'store_manager', phone: '+91 98201 11001', email: 'sunita@royalheritage.com', rate: 450, commission: 2.5, isBeautician: false },
    { id: 'emp-2', code: 'EMP-002', name: 'Priya Kapoor', role: 'bridal_manager', phone: '+91 98201 11002', email: 'priya@royalheritage.com', rate: 400, commission: 3.0, isBeautician: true, isStylist: true },
    { id: 'emp-3', code: 'EMP-003', name: 'Rajesh Verma', role: 'inventory_manager', phone: '+91 98201 11003', email: 'rajesh@royalheritage.com', rate: 350, commission: 1.0, isBeautician: false },
    { id: 'emp-4', code: 'EMP-004', name: 'Aanya Sharma', role: 'receptionist', phone: '+91 98201 11004', email: 'aanya@royalheritage.com', rate: 280, commission: 1.5, isBeautician: true },
    { id: 'emp-5', code: 'EMP-005', name: 'Karan Singhania', role: 'cashier', phone: '+91 98201 11005', email: 'karan@royalheritage.com', rate: 300, commission: 1.0, isBeautician: false },
  ],
  categories: [
    { id: 'cat-1', name: 'Bridal Jewellery Sets', type: 'jewellery', taxRate: 3.0 },
    { id: 'cat-2', name: 'Fashion & Semi-Precious Jewellery', type: 'jewellery', taxRate: 3.0 },
    { id: 'cat-3', name: 'Bridal Couture & Veils', type: 'bridal_wear', taxRate: 5.0 },
    { id: 'cat-4', name: 'Beauty & Skin Care Retail', type: 'beauty_retail', taxRate: 18.0 },
    { id: 'cat-5', name: 'Salon & Bridal Services', type: 'beauty_service', taxRate: 18.0 },
  ],
  products: [
    {
      id: 'p-1',
      sku: 'JWL-KUN-001',
      barcode: '8901234000011',
      name: 'Royal Kundan & Pearl Bridal Choker Set',
      categoryId: 'cat-1',
      categoryName: 'Bridal Jewellery Sets',
      trackType: 'serialized',
      costPrice: 18500,
      sellPrice: 29999,
      mrp: 34999,
      stockOnHand: 8,
      reorderThreshold: 3,
      isService: false,
    },
    {
      id: 'p-2',
      sku: 'JWL-POL-002',
      barcode: '8901234000028',
      name: 'Heritage Polki & Emerald Raani Haar',
      categoryId: 'cat-1',
      categoryName: 'Bridal Jewellery Sets',
      trackType: 'serialized',
      costPrice: 34000,
      sellPrice: 54500,
      mrp: 62000,
      stockOnHand: 4,
      reorderThreshold: 2,
      isService: false,
    },
    {
      id: 'p-3',
      sku: 'JWL-BAN-003',
      barcode: '8901234000035',
      name: 'Antique Jadau Bridal Kada Bangles (Set of 2)',
      categoryId: 'cat-2',
      categoryName: 'Fashion & Semi-Precious Jewellery',
      trackType: 'standard',
      costPrice: 7200,
      sellPrice: 12800,
      mrp: 15000,
      stockOnHand: 15,
      reorderThreshold: 4,
      isService: false,
    },
    {
      id: 'p-4',
      sku: 'JWL-MAT-004',
      barcode: '8901234000042',
      name: 'Crescent Pearl Bridal Matha Patti',
      categoryId: 'cat-2',
      categoryName: 'Fashion & Semi-Precious Jewellery',
      trackType: 'standard',
      costPrice: 2800,
      sellPrice: 4999,
      mrp: 5999,
      stockOnHand: 2, // Low stock alert!
      reorderThreshold: 3,
      isService: false,
    },
    {
      id: 'p-5',
      sku: 'COSM-FIX-005',
      barcode: '8901234000059',
      name: 'GlowLock Bridal Setting Mist 150ml',
      categoryId: 'cat-4',
      categoryName: 'Beauty & Skin Care Retail',
      trackType: 'standard',
      costPrice: 850,
      sellPrice: 1750,
      mrp: 1999,
      stockOnHand: 36,
      reorderThreshold: 10,
      isService: false,
    },
    {
      id: 'p-6',
      sku: 'COSM-SER-006',
      barcode: '8901234000066',
      name: '24K Gold Elixir Radiance Serum 30ml',
      categoryId: 'cat-4',
      categoryName: 'Beauty & Skin Care Retail',
      trackType: 'standard',
      costPrice: 1200,
      sellPrice: 2400,
      mrp: 2800,
      stockOnHand: 1, // Low stock alert!
      reorderThreshold: 5,
      isService: false,
    },
    // Services
    {
      id: 'srv-1',
      sku: 'SRV-HD-BRIDE',
      barcode: '9900000000010',
      name: 'Signature HD Bridal Makeup & Hair Styling',
      categoryId: 'cat-5',
      categoryName: 'Salon & Bridal Services',
      trackType: 'standard',
      costPrice: 5000,
      sellPrice: 25000,
      mrp: 28000,
      stockOnHand: 999,
      reorderThreshold: 0,
      isService: true,
      durationMinutes: 180,
    },
    {
      id: 'srv-2',
      sku: 'SRV-TRIAL-01',
      barcode: '9900000000027',
      name: 'Bridal Trial Makeup & Styling Consultation',
      categoryId: 'cat-5',
      categoryName: 'Salon & Bridal Services',
      trackType: 'standard',
      costPrice: 1200,
      sellPrice: 6000,
      mrp: 7500,
      stockOnHand: 999,
      reorderThreshold: 0,
      isService: true,
      durationMinutes: 120,
    },
    {
      id: 'srv-3',
      sku: 'SRV-GLOW-FACIAL',
      barcode: '9900000000034',
      name: 'Pre-Bridal Luxury Radiance Gold Facial',
      categoryId: 'cat-5',
      categoryName: 'Salon & Bridal Services',
      trackType: 'standard',
      costPrice: 800,
      sellPrice: 4500,
      mrp: 5000,
      stockOnHand: 999,
      reorderThreshold: 0,
      isService: true,
      durationMinutes: 90,
    },
  ],
  customers: [
    {
      id: 'cu-1',
      fullName: 'Ananya Deshmukh',
      phone: '+91 99887 76655',
      email: 'ananya.d@example.com',
      address: 'B-12 Sea View Apartments, Worli, Mumbai',
      loyaltyPoints: 340,
      storeCredit: 2500,
      weddingDate: '2026-12-18',
      skinHairNotes: 'Sensitive dry skin, allergic to harsh astringents',
      jewelryPreferences: 'Antique Temple gold and Emerald drops',
      totalSpent: 114500,
    },
    {
      id: 'cu-2',
      fullName: 'Rhea Malhotra',
      phone: '+91 98111 22334',
      email: 'rhea.m@example.com',
      address: 'Flat 402, Green Acres, Bandra West, Mumbai',
      loyaltyPoints: 120,
      storeCredit: 0,
      weddingDate: '2027-01-25',
      skinHairNotes: 'Combination skin, prefers dewy warm tones',
      jewelryPreferences: 'Polki choker sets, Diamond solitaire accessories',
      totalSpent: 45000,
    },
    {
      id: 'cu-3',
      fullName: 'Divya Patel',
      phone: '+91 98700 99887',
      email: 'divya.patel@example.com',
      address: '14 Sunrise Villa, Juhu, Mumbai',
      loyaltyPoints: 85,
      storeCredit: 0,
      weddingDate: null,
      skinHairNotes: 'Curly hair styling specialist preferred',
      jewelryPreferences: 'Fashion alloy bridal accessories, matha patti',
      totalSpent: 18500,
    },
  ],
  sales: [
    {
      id: 'sale-001',
      invoiceNumber: 'INV-20261025-0012',
      saleDate: new Date(Date.now() - 86400000).toISOString(),
      customerId: 'cu-1',
      customerName: 'Ananya Deshmukh',
      cashierName: 'Karan Singhania',
      subtotal: 34998,
      discountAmount: 1000,
      taxAmount: 1019.94,
      totalAmount: 35017.94,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      idempotencyKey: 'idem-sale-init-01',
      items: [
        { productId: 'p-1', productName: 'Royal Kundan & Pearl Bridal Choker Set', qty: 1, unitPrice: 29999, discount: 1000, taxRate: 3.0, lineTotal: 29868.97 },
        { productId: 'p-4', productName: 'Crescent Pearl Bridal Matha Patti', qty: 1, unitPrice: 4999, discount: 0, taxRate: 3.0, lineTotal: 5148.97 },
      ],
    },
  ],
  returns: [],
  stockMovements: [
    {
      id: 'sm-1',
      productName: 'Royal Kundan & Pearl Bridal Choker Set',
      changeQty: -1,
      previousStock: 9,
      newStock: 8,
      reason: 'sale',
      notes: 'Sold in invoice: INV-20261025-0012',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  suppliers: [
    { id: 'sup-1', companyName: 'Jaipur Royal Jewels Crafting Co.', contactPerson: 'Mahesh Soni', phone: '+91 94140 12345', email: 'info@jaipurjewels.example.com', address: 'Johari Bazaar, Jaipur' },
    { id: 'sup-2', companyName: 'Aura Luxury Cosmetics Supplies', contactPerson: 'Deepa Nair', phone: '+91 98222 33445', email: 'sales@auracosmetics.example.com', address: 'Andheri Industrial Estate, Mumbai' },
  ],
  purchaseOrders: [
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
        { productId: 'p-1', productName: 'Royal Kundan & Pearl Bridal Choker Set', orderedQty: 5, receivedQty: 0, unitCost: 18500, lineTotal: 92500 },
      ],
    },
  ],
  appointments: [
    {
      id: 'apt-1',
      appointmentNumber: 'APT-20261026-01',
      customerId: 'cu-1',
      customerName: 'Ananya Deshmukh',
      customerPhone: '+91 99887 76655',
      serviceId: 'srv-3',
      serviceName: 'Pre-Bridal Luxury Radiance Gold Facial',
      staffId: 'emp-4',
      staffName: 'Aanya Sharma',
      timeSlot: 'Today, 02:00 PM - 03:30 PM',
      scheduledStart: new Date(Date.now() + 1800000).toISOString(),
      status: 'confirmed',
      totalPrice: 4500,
      depositAmount: 1000,
      notes: 'First pre-bridal session of 3. Prefers calming tea.',
    },
    {
      id: 'apt-2',
      appointmentNumber: 'APT-20261026-02',
      customerId: 'cu-3',
      customerName: 'Divya Patel',
      customerPhone: '+91 98700 99887',
      serviceId: 'srv-2',
      serviceName: 'Bridal Trial Makeup & Styling Consultation',
      staffId: 'emp-2',
      staffName: 'Priya Kapoor',
      timeSlot: 'Today, 04:30 PM - 06:30 PM',
      scheduledStart: new Date(Date.now() + 7200000).toISOString(),
      status: 'scheduled',
      totalPrice: 6000,
      depositAmount: 0,
      notes: 'Trial for engagement function next month.',
    },
  ],
  bridalProjects: [
    {
      id: 'bp-1',
      projectCode: 'BP-2026-001',
      customerId: 'cu-1',
      customerName: 'Ananya Deshmukh',
      customerPhone: '+91 99887 76655',
      eventDate: '2026-12-18',
      venueAddress: 'Grand Ballroom, Taj Lands End, Bandra, Mumbai',
      packageName: 'The Grand Maharani Bridal Royale',
      status: 'confirmed',
      totalBudget: 85000,
      depositRequired: 25000,
      depositPaid: 25000,
      balanceDue: 60000,
      notes: 'Includes 3 ceremonies: Sangeet, Wedding Day & Reception. Luxury bridal jewellery rental included.',
      services: [
        { id: 'bps-1', serviceType: 'Bridal HD Airbrush Makeup', eventPhase: 'Wedding Day', assignedStaffName: 'Priya Kapoor', price: 25000, status: 'confirmed' },
        { id: 'bps-2', serviceType: 'Couture Hair Updo & Real Flowers', eventPhase: 'Wedding Day', assignedStaffName: 'Aanya Sharma', price: 8000, status: 'confirmed' },
        { id: 'bps-3', serviceType: 'Saree & Can-can Draping', eventPhase: 'Wedding Day', assignedStaffName: 'Priya Kapoor', price: 3500, status: 'confirmed' },
        { id: 'bps-4', serviceType: 'Sangeet Party Glow Makeup', eventPhase: 'Sangeet', assignedStaffName: 'Priya Kapoor', price: 12000, status: 'confirmed' },
      ],
    },
    {
      id: 'bp-2',
      projectCode: 'BP-2026-002',
      customerId: 'cu-2',
      customerName: 'Rhea Malhotra',
      customerPhone: '+91 98111 22334',
      eventDate: '2027-01-25',
      venueAddress: 'The St. Regis Mumbai, Lower Parel',
      packageName: 'Elegance Bridal Couture Package',
      status: 'trial_completed',
      totalBudget: 45000,
      depositRequired: 15000,
      depositPaid: 15000,
      balanceDue: 30000,
      notes: 'Trial completed on Oct 20. Bride loved the soft bronze glow.',
      services: [
        { id: 'bps-5', serviceType: 'HD Bridal Makeup & Lashes', eventPhase: 'Wedding Day', assignedStaffName: 'Priya Kapoor', price: 20000, status: 'scheduled' },
        { id: 'bps-6', serviceType: 'Hollywood Glam Waves', eventPhase: 'Wedding Day', assignedStaffName: 'Aanya Sharma', price: 7000, status: 'scheduled' },
      ],
    },
  ],
  shifts: [
    { id: 'sh-1', employeeName: 'Sunita Mehta', date: '2026-10-26', start: '09:30 AM', end: '07:30 PM', role: 'Store Manager' },
    { id: 'sh-2', employeeName: 'Priya Kapoor', date: '2026-10-26', start: '10:00 AM', end: '08:00 PM', role: 'Bridal Lead' },
    { id: 'sh-3', employeeName: 'Rajesh Verma', date: '2026-10-26', start: '09:30 AM', end: '06:30 PM', role: 'Inventory Mgr' },
    { id: 'sh-4', employeeName: 'Aanya Sharma', date: '2026-10-26', start: '09:00 AM', end: '06:00 PM', role: 'Receptionist' },
    { id: 'sh-5', employeeName: 'Karan Singhania', date: '2026-10-26', start: '10:30 AM', end: '08:30 PM', role: 'Cashier' },
  ],
  attendance: [
    { id: 'att-1', employeeName: 'Sunita Mehta', date: '2026-10-26', clockIn: '09:28 AM', clockOut: null, status: 'Clocked In' },
    { id: 'att-2', employeeName: 'Aanya Sharma', date: '2026-10-26', clockIn: '08:55 AM', clockOut: null, status: 'Clocked In' },
    { id: 'att-3', employeeName: 'Rajesh Verma', date: '2026-10-26', clockIn: '09:31 AM', clockOut: null, status: 'Clocked In' },
    { id: 'att-4', employeeName: 'Priya Kapoor', date: '2026-10-26', clockIn: '09:58 AM', clockOut: null, status: 'Clocked In' },
    { id: 'att-5', employeeName: 'Karan Singhania', date: '2026-10-26', clockIn: '10:25 AM', clockOut: null, status: 'Clocked In' },
  ],
  expenses: [
    { id: 'exp-1', category: 'Salon Supplies', amount: 1850, paymentMethod: 'cash', description: 'Fresh jasmine hair flowers & bobby pins for bridal trials', date: '2026-10-26' },
    { id: 'exp-2', category: 'Petty Cash', amount: 450, paymentMethod: 'cash', description: 'Courier charges for diamond certified appraisals', date: '2026-10-26' },
  ],
  dayClosings: [
    {
      id: 'dc-prev',
      date: '2026-10-25',
      openingFloat: 5000,
      totalSales: 35017.94,
      totalCard: 35017.94,
      totalCash: 0,
      totalRefunds: 0,
      expectedCash: 5000,
      actualCountedCash: 5000,
      discrepancy: 0,
      closedBy: 'Sunita Mehta',
      closedAt: '2026-10-25T20:45:00.000Z',
    },
  ],
  auditLogs: [
    { id: 'al-1', event: 'SYSTEM_STARTUP', details: 'POS server initialized with secure RLS and audit trail', timestamp: new Date().toISOString() },
  ],
  idempotencyStore: new Map(),
  hardwareStatus: {
    printer: { name: 'Epson TM-T88VI (Thermal)', status: 'Online & Ready', port: 'USB001' },
    scanner: { name: 'Honeywell 1900g (USB HID)', status: 'Connected', mode: 'Auto-Enter' },
    drawer: { name: 'APG Vasario RJ-11', status: 'Closed / Monitored', kicksToday: 1 },
    terminal: { name: 'Ingenico Lane/5000 PinPad', status: 'Online (UPI/EMV)', port: 'COM3' },
  },
};

// ============================================================================
// HTTP ROUTER & API HANDLERS
// ============================================================================
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Idempotency-Key, Authorization',
  });
  res.end(JSON.stringify(data));
}

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Idempotency-Key, Authorization',
    });
    return res.end();
  }

  // --------------------------------------------------------------------------
  // API ENDPOINTS
  // --------------------------------------------------------------------------
  try {
    // 1. Dashboard Metrics
    if (pathname === '/api/v1/dashboard' && method === 'GET') {
      const todaySales = store.sales.reduce((acc, s) => acc + s.totalAmount, 0);
      const lowStockCount = store.products.filter(p => !p.isService && p.stockOnHand <= p.reorderThreshold).length;
      const todayAppointments = store.appointments.length;
      const totalCashInDrawer = 5000 + store.sales
        .filter(s => s.paymentMethod === 'cash')
        .reduce((sum, s) => sum + s.totalAmount, 0) - store.expenses.reduce((sum, e) => sum + e.amount, 0);

      return sendJson(res, 200, {
        todaySales,
        lowStockCount,
        todayAppointments,
        totalCashInDrawer,
        activeProjects: store.bridalProjects.length,
        hardware: store.hardwareStatus,
      });
    }

    // 2. Products Catalog
    if (pathname === '/api/v1/products' && method === 'GET') {
      const query = (parsedUrl.query.search || '').toLowerCase();
      const cat = parsedUrl.query.category;
      let list = store.products;
      if (query) {
        list = list.filter(p =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          (p.barcode && p.barcode.includes(query))
        );
      }
      if (cat) {
        list = list.filter(p => p.categoryId === cat);
      }
      return sendJson(res, 200, list);
    }

    if (pathname === '/api/v1/products' && method === 'POST') {
      const body = await parseBody(req);
      const newProduct = {
        id: 'p-' + Date.now(),
        sku: body.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
        barcode: body.barcode || '890' + Math.floor(1000000000 + Math.random() * 9000000000),
        name: body.name,
        categoryId: body.categoryId || 'cat-1',
        categoryName: body.categoryName || 'Bridal Jewellery Sets',
        trackType: body.trackType || 'standard',
        costPrice: Number(body.costPrice || 0),
        sellPrice: Number(body.sellPrice || 0),
        mrp: Number(body.mrp || body.sellPrice * 1.15),
        stockOnHand: Number(body.stockOnHand || 0),
        reorderThreshold: Number(body.reorderThreshold || 2),
        isService: Boolean(body.isService),
      };
      store.products.unshift(newProduct);
      store.auditLogs.unshift({
        id: 'al-' + Date.now(),
        event: 'PRODUCT_CREATED',
        details: `Product created: ${newProduct.name} (${newProduct.sku})`,
        timestamp: new Date().toISOString(),
      });
      return sendJson(res, 201, newProduct);
    }

    // 3. Stock Adjustment
    if (pathname === '/api/v1/stock/adjust' && method === 'POST') {
      const body = await parseBody(req);
      const prod = store.products.find(p => p.id === body.productId);
      if (!prod) return sendJson(res, 404, { error: 'Product not found' });

      const change = Number(body.changeQty || 0);
      const prev = prod.stockOnHand;
      prod.stockOnHand = Math.max(0, prod.stockOnHand + change);

      const movement = {
        id: 'sm-' + Date.now(),
        productName: prod.name,
        changeQty: change,
        previousStock: prev,
        newStock: prod.stockOnHand,
        reason: body.reason || 'inventory_adjustment',
        notes: body.notes || 'Manual stock adjustment',
        createdAt: new Date().toISOString(),
      };
      store.stockMovements.unshift(movement);
      store.auditLogs.unshift({
        id: 'al-' + Date.now(),
        event: 'STOCK_ADJUSTMENT',
        details: `${prod.name}: ${change > 0 ? '+' : ''}${change} (Reason: ${movement.reason})`,
        timestamp: new Date().toISOString(),
      });
      return sendJson(res, 200, { success: true, product: prod, movement });
    }

    // 4. POS Checkout / Sale Transaction (With Idempotency & Stock Lock)
    if (pathname === '/api/v1/sales' && method === 'POST') {
      const body = await parseBody(req);
      const idempotencyKey = req.headers['idempotency-key'] || body.idempotencyKey || ('idem-' + Date.now());

      // Idempotency check
      if (store.idempotencyStore.has(idempotencyKey)) {
        return sendJson(res, 200, {
          isDuplicate: true,
          message: 'Sale already processed for this idempotency key',
          sale: store.idempotencyStore.get(idempotencyKey),
        });
      }

      const items = body.items || [];
      if (items.length === 0) {
        return sendJson(res, 400, { error: 'Cart must contain at least 1 item' });
      }

      // Check stock
      for (const it of items) {
        const p = store.products.find(prod => prod.id === it.productId);
        if (!p) return sendJson(res, 400, { error: `Product ID ${it.productId} not found` });
        if (!p.isService && p.stockOnHand < it.qty) {
          return sendJson(res, 400, { error: `Insufficient stock for ${p.name}. Stock available: ${p.stockOnHand}` });
        }
      }

      // Decrement stock and calculate totals
      let subtotal = 0;
      let totalDiscount = 0;
      let totalTax = 0;
      const processedItems = [];

      for (const it of items) {
        const p = store.products.find(prod => prod.id === it.productId);
        const lineSubtotal = (it.qty * it.unitPrice) - (it.discount || 0);
        const lineTax = Math.round(lineSubtotal * (store.business.taxRate / 100) * 100) / 100;
        const lineTotal = lineSubtotal + lineTax;

        subtotal += (it.qty * it.unitPrice);
        totalDiscount += (it.discount || 0);
        totalTax += lineTax;

        if (!p.isService) {
          const prevStock = p.stockOnHand;
          p.stockOnHand -= it.qty;
          store.stockMovements.unshift({
            id: 'sm-' + Date.now(),
            productName: p.name,
            changeQty: -it.qty,
            previousStock: prevStock,
            newStock: p.stockOnHand,
            reason: 'sale',
            notes: 'POS Checkout',
            createdAt: new Date().toISOString(),
          });
        }

        processedItems.push({
          productId: p.id,
          productName: p.name,
          qty: it.qty,
          unitPrice: it.unitPrice,
          discount: it.discount || 0,
          taxRate: store.business.taxRate,
          lineTotal,
        });
      }

      const totalAmount = Math.round((subtotal - totalDiscount + totalTax) * 100) / 100;
      const invoiceNumber = 'INV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

      const customer = store.customers.find(c => c.id === body.customerId);
      if (customer) {
        customer.loyaltyPoints += Math.floor(totalAmount / 100);
        customer.totalSpent += totalAmount;
      }

      const newSale = {
        id: 'sale-' + Date.now(),
        invoiceNumber,
        saleDate: new Date().toISOString(),
        customerId: body.customerId || null,
        customerName: customer ? customer.fullName : (body.customerName || 'Walk-in Guest'),
        cashierName: body.cashierName || 'Karan Singhania',
        subtotal,
        discountAmount: totalDiscount,
        taxAmount: totalTax,
        totalAmount,
        paymentMethod: body.paymentMethod || 'cash',
        paymentStatus: 'paid',
        idempotencyKey,
        items: processedItems,
      };

      store.sales.unshift(newSale);
      store.idempotencyStore.set(idempotencyKey, newSale);

      // Trigger drawer kick if cash
      if (newSale.paymentMethod === 'cash') {
        store.hardwareStatus.drawer.kicksToday++;
      }

      store.auditLogs.unshift({
        id: 'al-' + Date.now(),
        event: 'SALE_COMPLETED',
        details: `Invoice ${invoiceNumber}: ₹${totalAmount} (${newSale.paymentMethod.toUpperCase()})`,
        timestamp: new Date().toISOString(),
      });

      return sendJson(res, 201, { success: true, sale: newSale });
    }

    // 5. Sales Returns / Refunds
    if (pathname.startsWith('/api/v1/sales/') && pathname.endsWith('/return') && method === 'POST') {
      const saleId = pathname.split('/')[4];
      const body = await parseBody(req);
      const originalSale = store.sales.find(s => s.id === saleId);
      if (!originalSale) return sendJson(res, 404, { error: 'Original sale invoice not found' });

      let refundTotal = 0;
      for (const it of (body.items || [])) {
        refundTotal += (it.qty * it.refundUnitPrice);
        if (it.restock) {
          const prod = store.products.find(p => p.id === it.productId);
          if (prod && !prod.isService) {
            const prev = prod.stockOnHand;
            prod.stockOnHand += it.qty;
            store.stockMovements.unshift({
              id: 'sm-' + Date.now(),
              productName: prod.name,
              changeQty: it.qty,
              previousStock: prev,
              newStock: prod.stockOnHand,
              reason: 'customer_return',
              notes: 'Restocked from return for ' + originalSale.invoiceNumber,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      const returnRecord = {
        id: 'ret-' + Date.now(),
        returnNumber: 'RET-' + Math.floor(10000 + Math.random() * 90000),
        originalSaleInvoice: originalSale.invoiceNumber,
        refundAmount: refundTotal,
        refundMethod: body.refundMethod || 'cash',
        reason: body.reason || 'Customer Return',
        approvedBy: body.managerName || 'Sunita Mehta (Store Manager)',
        createdAt: new Date().toISOString(),
      };
      store.returns.unshift(returnRecord);
      originalSale.paymentStatus = 'refunded';

      store.auditLogs.unshift({
        id: 'al-' + Date.now(),
        event: 'SALE_REFUNDED',
        details: `Return ${returnRecord.returnNumber} for ${originalSale.invoiceNumber}: -₹${refundTotal}`,
        timestamp: new Date().toISOString(),
      });

      return sendJson(res, 201, { success: true, returnRecord });
    }

    // 6. Customers CRM
    if (pathname === '/api/v1/customers' && method === 'GET') {
      return sendJson(res, 200, store.customers);
    }
    if (pathname === '/api/v1/customers' && method === 'POST') {
      const body = await parseBody(req);
      const newCust = {
        id: 'cu-' + Date.now(),
        fullName: body.fullName,
        phone: body.phone,
        email: body.email || '',
        address: body.address || '',
        loyaltyPoints: 0,
        storeCredit: 0,
        weddingDate: body.weddingDate || null,
        skinHairNotes: body.skinHairNotes || '',
        jewelryPreferences: body.jewelryPreferences || '',
        totalSpent: 0,
      };
      store.customers.unshift(newCust);
      return sendJson(res, 201, newCust);
    }

    // 7. Appointments & Check-in
    if (pathname === '/api/v1/appointments' && method === 'GET') {
      return sendJson(res, 200, store.appointments);
    }
    if (pathname === '/api/v1/appointments' && method === 'POST') {
      const body = await parseBody(req);
      const newApt = {
        id: 'apt-' + Date.now(),
        appointmentNumber: 'APT-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(10 + Math.random() * 90),
        customerId: body.customerId,
        customerName: body.customerName,
        customerPhone: body.customerPhone || '',
        serviceId: body.serviceId,
        serviceName: body.serviceName,
        staffId: body.staffId,
        staffName: body.staffName,
        timeSlot: body.timeSlot || 'Scheduled Slot',
        scheduledStart: body.scheduledStart || new Date().toISOString(),
        status: 'confirmed',
        totalPrice: Number(body.totalPrice || 0),
        depositAmount: Number(body.depositAmount || 0),
        notes: body.notes || '',
      };
      store.appointments.unshift(newApt);
      return sendJson(res, 201, newApt);
    }
    if (pathname.startsWith('/api/v1/appointments/') && pathname.endsWith('/checkin') && method === 'POST') {
      const aptId = pathname.split('/')[4];
      const apt = store.appointments.find(a => a.id === aptId);
      if (!apt) return sendJson(res, 404, { error: 'Appointment not found' });
      apt.status = 'checked_in';
      apt.actualCheckIn = new Date().toISOString();
      return sendJson(res, 200, { success: true, appointment: apt });
    }

    // 8. Bridal Projects
    if (pathname === '/api/v1/bridal_projects' && method === 'GET') {
      return sendJson(res, 200, store.bridalProjects);
    }
    if (pathname === '/api/v1/bridal_projects' && method === 'POST') {
      const body = await parseBody(req);
      const newBp = {
        id: 'bp-' + Date.now(),
        projectCode: 'BP-2026-' + Math.floor(100 + Math.random() * 900),
        customerId: body.customerId,
        customerName: body.customerName,
        customerPhone: body.customerPhone || '',
        eventDate: body.eventDate,
        venueAddress: body.venueAddress || '',
        packageName: body.packageName || 'Bespoke Royal Bridal Package',
        status: 'confirmed',
        totalBudget: Number(body.totalBudget || 50000),
        depositRequired: Number(body.depositRequired || 20000),
        depositPaid: Number(body.depositPaid || 20000),
        balanceDue: Number(body.totalBudget || 50000) - Number(body.depositPaid || 20000),
        notes: body.notes || '',
        services: body.services || [],
      };
      store.bridalProjects.unshift(newBp);
      return sendJson(res, 201, newBp);
    }

    // 9. Purchasing & Goods Receipts (GRN)
    if (pathname === '/api/v1/suppliers' && method === 'GET') {
      return sendJson(res, 200, store.suppliers);
    }
    if (pathname === '/api/v1/suppliers' && method === 'POST') {
      const body = await parseBody(req);
      const newSup = {
        id: 'sup-' + Date.now(),
        companyName: body.companyName || 'New Supplier',
        contactPerson: body.contactPerson || '',
        phone: body.phone || '',
        email: body.email || '',
        address: body.address || '',
      };
      store.suppliers.push(newSup);
      return sendJson(res, 201, newSup);
    }
    if (pathname === '/api/v1/purchasing/orders' && method === 'GET') {
      return sendJson(res, 200, store.purchaseOrders);
    }
    if (pathname === '/api/v1/purchasing/orders' && method === 'POST') {
      const body = await parseBody(req);
      const newPo = {
        id: 'po-' + Date.now(),
        poNumber: 'PO-2026-' + Math.floor(1000 + Math.random() * 9000),
        supplierId: body.supplierId || 'sup-1',
        supplierName: body.supplierName || 'Jaipur Royal Jewels Crafting Co.',
        orderDate: new Date().toISOString().slice(0, 10),
        expectedDate: body.expectedDate || null,
        status: 'issued',
        totalAmount: Number(body.totalAmount || 0),
        items: body.items || [],
      };
      store.purchaseOrders.unshift(newPo);
      return sendJson(res, 201, newPo);
    }
    if (pathname === '/api/v1/goods_receipts' && method === 'POST') {
      const body = await parseBody(req);
      const grnNumber = 'GRN-' + Math.floor(10000 + Math.random() * 90000);
      let totalAmount = 0;

      for (const it of (body.items || [])) {
        const prod = store.products.find(p => p.id === it.productId);
        if (prod && !prod.isService) {
          const prev = prod.stockOnHand;
          const qty = Number(it.receivedQty || it.orderedQty || 1);
          const cost = Number(it.unitCost || prod.costPrice);
          prod.stockOnHand += qty;
          prod.costPrice = cost;
          totalAmount += (qty * cost);

          store.stockMovements.unshift({
            id: 'sm-' + Date.now(),
            productName: prod.name,
            changeQty: qty,
            previousStock: prev,
            newStock: prod.stockOnHand,
            reason: 'purchase_receipt',
            notes: `Goods received via ${grnNumber} (Invoice: ${body.supplierInvoiceRef || 'N/A'})`,
            createdAt: new Date().toISOString(),
          });
        }
      }

      if (body.poId) {
        const po = store.purchaseOrders.find(p => p.id === body.poId || p.poNumber === body.poId);
        if (po) po.status = 'completed';
      }

      return sendJson(res, 201, { success: true, grnNumber, totalAmount });
    }

    // 10. Shifts & Attendance
    if (pathname === '/api/v1/shifts' && method === 'GET') {
      return sendJson(res, 200, store.shifts);
    }
    if (pathname === '/api/v1/attendance' && method === 'GET') {
      return sendJson(res, 200, store.attendance);
    }
    if (pathname === '/api/v1/attendance/clockin' && method === 'POST') {
      const body = await parseBody(req);
      const emp = store.employees.find(e => e.name === body.employeeName) || store.employees[0];
      const record = {
        id: 'att-' + Date.now(),
        employeeName: emp.name,
        date: new Date().toISOString().slice(0, 10),
        clockIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clockOut: null,
        status: 'Clocked In',
      };
      store.attendance.unshift(record);
      return sendJson(res, 201, record);
    }
    if (pathname === '/api/v1/attendance/clockout' && method === 'POST') {
      const body = await parseBody(req);
      const record = store.attendance.find(a => a.employeeName === body.employeeName && !a.clockOut);
      if (record) {
        record.clockOut = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        record.status = 'Clocked Out';
      }
      return sendJson(res, 200, { success: true, record });
    }

    // 11. Expenses & Day Close (Cashup)
    if (pathname === '/api/v1/expenses' && method === 'GET') {
      return sendJson(res, 200, store.expenses);
    }
    if (pathname === '/api/v1/expenses' && method === 'POST') {
      const body = await parseBody(req);
      const newExp = {
        id: 'exp-' + Date.now(),
        category: body.category || 'Supplies',
        amount: Number(body.amount || 0),
        paymentMethod: body.paymentMethod || 'cash',
        description: body.description || '',
        date: new Date().toISOString().slice(0, 10),
      };
      store.expenses.unshift(newExp);
      return sendJson(res, 201, newExp);
    }
    if (pathname === '/api/v1/day_closings' && method === 'GET') {
      return sendJson(res, 200, store.dayClosings);
    }
    if (pathname === '/api/v1/day_closings' && method === 'POST') {
      const body = await parseBody(req);
      const opening = Number(body.openingFloat || 5000);
      const counted = Number(body.actualCountedCash || 0);

      const cashSales = store.sales
        .filter(s => s.paymentMethod === 'cash')
        .reduce((sum, s) => sum + s.totalAmount, 0);
      const cashRefunds = store.returns
        .filter(r => r.refundMethod === 'cash')
        .reduce((sum, r) => sum + r.refundAmount, 0);
      const cashExp = store.expenses
        .filter(e => e.paymentMethod === 'cash')
        .reduce((sum, e) => sum + e.amount, 0);

      const expected = opening + cashSales - cashRefunds - cashExp;
      const discrepancy = Math.round((counted - expected) * 100) / 100;

      const closing = {
        id: 'dc-' + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        openingFloat: opening,
        totalSales: store.sales.reduce((sum, s) => sum + s.totalAmount, 0),
        totalCash: cashSales,
        totalCard: store.sales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.totalAmount, 0),
        totalRefunds: cashRefunds,
        expectedCash: expected,
        actualCountedCash: counted,
        discrepancy,
        closedBy: body.managerName || 'Sunita Mehta (Store Manager)',
        closedAt: new Date().toISOString(),
        notes: body.notes || 'Register locked for day closing',
      };
      store.dayClosings.unshift(closing);
      return sendJson(res, 201, closing);
    }

    // 12. Hardware Emulators (Kick Drawer, ESC/POS Raw Generator)
    if (pathname === '/api/v1/hardware/drawer/kick' && method === 'POST') {
      store.hardwareStatus.drawer.kicksToday++;
      return sendJson(res, 200, {
        success: true,
        commandHex: '1B 70 00 19 FA',
        description: 'Pulse sent to RJ-11 Drawer Pin 2 (Kick)',
        kicksToday: store.hardwareStatus.drawer.kicksToday,
      });
    }

    // 13. Audit Logs
    if (pathname === '/api/v1/audit_logs' && method === 'GET') {
      return sendJson(res, 200, store.auditLogs);
    }

    // --------------------------------------------------------------------------
    // STATIC FILE SERVING
    // --------------------------------------------------------------------------
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
    };

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return sendFile(res, filePath, mimeTypes[ext] || 'application/octet-stream');
    }

    // Default SPA fallback
    const indexHtml = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexHtml)) {
      return sendFile(res, indexHtml, 'text/html');
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  } catch (err) {
    console.error('Server error:', err);
    sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`Royal Heritage POS & Retail ERP Desktop Server Running`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Environment: Windows Native Standalone (Zero External Dependencies)`);
  console.log(`================================================================`);
});
