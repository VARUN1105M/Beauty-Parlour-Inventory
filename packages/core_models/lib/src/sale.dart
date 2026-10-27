class SaleItem {
  final String productId;
  final String productName;
  final String? sku;
  final String? barcode;
  final String? inventoryUnitId;
  final String? staffId;
  final int qty;
  final double unitPrice;
  final double discount;
  final double taxRate;
  final double lineTotal;

  SaleItem({
    required this.productId,
    required this.productName,
    this.sku,
    this.barcode,
    this.inventoryUnitId,
    this.staffId,
    required this.qty,
    required this.unitPrice,
    this.discount = 0.0,
    this.taxRate = 3.0,
    required this.lineTotal,
  });

  factory SaleItem.fromJson(Map<String, dynamic> json) {
    return SaleItem(
      productId: json['product_id'] as String,
      productName: json['product_name'] as String? ?? 'Item',
      sku: json['sku'] as String?,
      barcode: json['barcode'] as String?,
      inventoryUnitId: json['inventory_unit_id'] as String?,
      staffId: json['staff_id'] as String?,
      qty: (json['qty'] as num).toInt(),
      unitPrice: (json['unit_price'] as num).toDouble(),
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      taxRate: (json['tax_rate'] as num?)?.toDouble() ?? 3.0,
      lineTotal: (json['line_total'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
    'product_id': productId,
    'product_name': productName,
    'sku': sku,
    'barcode': barcode,
    'inventory_unit_id': inventoryUnitId,
    'staff_id': staffId,
    'qty': qty,
    'unit_price': unitPrice,
    'discount': discount,
    'tax_rate': taxRate,
    'line_total': lineTotal,
  };
}

class Sale {
  final String id;
  final String invoiceNumber;
  final String branchId;
  final String? customerId;
  final String? customerName;
  final String cashierId;
  final DateTime saleDate;
  final String status;
  final double subtotal;
  final double discountAmount;
  final double taxAmount;
  final double totalAmount;
  final String paymentStatus;
  final String idempotencyKey;
  final List<SaleItem> items;

  Sale({
    required this.id,
    required this.invoiceNumber,
    required this.branchId,
    this.customerId,
    this.customerName,
    required this.cashierId,
    required this.saleDate,
    this.status = 'completed',
    required this.subtotal,
    this.discountAmount = 0.0,
    required this.taxAmount,
    required this.totalAmount,
    this.paymentStatus = 'paid',
    required this.idempotencyKey,
    this.items = const [],
  });

  factory Sale.fromJson(Map<String, dynamic> json) {
    final list = (json['items'] as List<dynamic>?) ?? [];
    return Sale(
      id: json['id'] as String,
      invoiceNumber: json['invoice_number'] as String,
      branchId: json['branch_id'] as String,
      customerId: json['customer_id'] as String?,
      customerName: json['customer_name'] as String?,
      cashierId: json['cashier_id'] as String,
      saleDate: DateTime.parse(json['sale_date'] as String),
      status: json['status'] as String? ?? 'completed',
      subtotal: (json['subtotal'] as num).toDouble(),
      discountAmount: (json['discount_amount'] as num?)?.toDouble() ?? 0.0,
      taxAmount: (json['tax_amount'] as num).toDouble(),
      totalAmount: (json['total_amount'] as num).toDouble(),
      paymentStatus: json['payment_status'] as String? ?? 'paid',
      idempotencyKey: json['idempotency_key'] as String,
      items: list.map((e) => SaleItem.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'invoice_number': invoiceNumber,
    'branch_id': branchId,
    'customer_id': customerId,
    'customer_name': customerName,
    'cashier_id': cashierId,
    'sale_date': saleDate.toIso8601String(),
    'status': status,
    'subtotal': subtotal,
    'discount_amount': discountAmount,
    'tax_amount': taxAmount,
    'total_amount': totalAmount,
    'payment_status': paymentStatus,
    'idempotency_key': idempotencyKey,
    'items': items.map((i) => i.toJson()).toList(),
  };
}
