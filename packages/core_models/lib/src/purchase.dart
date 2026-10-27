class Supplier {
  final String id;
  final String companyName;
  final String? contactPerson;
  final String? phone;
  final String? email;
  final String? address;

  Supplier({
    required this.id,
    required this.companyName,
    this.contactPerson,
    this.phone,
    this.email,
    this.address,
  });

  factory Supplier.fromJson(Map<String, dynamic> json) => Supplier(
    id: json['id'] as String,
    companyName: json['company_name'] as String,
    contactPerson: json['contact_person'] as String?,
    phone: json['phone'] as String?,
    email: json['email'] as String?,
    address: json['address'] as String?,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'company_name': companyName,
    'contact_person': contactPerson,
    'phone': phone,
    'email': email,
    'address': address,
  };
}

class PurchaseOrderItem {
  final String productId;
  final String productName;
  final int orderedQty;
  final int receivedQty;
  final double unitCost;
  final double lineTotal;

  PurchaseOrderItem({
    required this.productId,
    required this.productName,
    required this.orderedQty,
    this.receivedQty = 0,
    required this.unitCost,
    required this.lineTotal,
  });

  factory PurchaseOrderItem.fromJson(Map<String, dynamic> json) => PurchaseOrderItem(
    productId: json['product_id'] as String,
    productName: json['product_name'] as String? ?? 'Item',
    orderedQty: (json['ordered_qty'] as num).toInt(),
    receivedQty: (json['received_qty'] as num?)?.toInt() ?? 0,
    unitCost: (json['unit_cost'] as num).toDouble(),
    lineTotal: (json['line_total'] as num).toDouble(),
  );

  Map<String, dynamic> toJson() => {
    'product_id': productId,
    'product_name': productName,
    'ordered_qty': orderedQty,
    'received_qty': receivedQty,
    'unit_cost': unitCost,
    'line_total': lineTotal,
  };
}

class PurchaseOrder {
  final String id;
  final String poNumber;
  final String supplierId;
  final String? supplierName;
  final DateTime orderDate;
  final DateTime? expectedDeliveryDate;
  final String status; // 'draft', 'issued', 'completed'
  final double totalAmount;
  final List<PurchaseOrderItem> items;

  PurchaseOrder({
    required this.id,
    required this.poNumber,
    required this.supplierId,
    this.supplierName,
    required this.orderDate,
    this.expectedDeliveryDate,
    this.status = 'draft',
    required this.totalAmount,
    this.items = const [],
  });

  factory PurchaseOrder.fromJson(Map<String, dynamic> json) {
    final list = (json['items'] as List<dynamic>?) ?? [];
    return PurchaseOrder(
      id: json['id'] as String,
      poNumber: json['po_number'] as String,
      supplierId: json['supplier_id'] as String,
      supplierName: json['supplier_name'] as String?,
      orderDate: DateTime.parse(json['order_date'] as String),
      expectedDeliveryDate: json['expected_delivery_date'] != null
          ? DateTime.tryParse(json['expected_delivery_date'] as String)
          : null,
      status: json['status'] as String? ?? 'draft',
      totalAmount: (json['total_amount'] as num).toDouble(),
      items: list.map((e) => PurchaseOrderItem.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }
}
