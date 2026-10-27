class InventoryUnit {
  final String id;
  final String productId;
  final String branchId;
  final String uniqueTag;
  final String status; // 'available', 'reserved', 'sold', 'in_bridal_trial'
  final double? grossWeightGrams;
  final double? netWeightGrams;
  final double? purchasedCost;

  InventoryUnit({
    required this.id,
    required this.productId,
    required this.branchId,
    required this.uniqueTag,
    this.status = 'available',
    this.grossWeightGrams,
    this.netWeightGrams,
    this.purchasedCost,
  });

  factory InventoryUnit.fromJson(Map<String, dynamic> json) {
    return InventoryUnit(
      id: json['id'] as String,
      productId: json['product_id'] as String,
      branchId: json['branch_id'] as String,
      uniqueTag: json['unique_tag'] as String,
      status: json['status'] as String? ?? 'available',
      grossWeightGrams: (json['gross_weight_grams'] as num?)?.toDouble(),
      netWeightGrams: (json['net_weight_grams'] as num?)?.toDouble(),
      purchasedCost: (json['purchased_cost'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'product_id': productId,
    'branch_id': branchId,
    'unique_tag': uniqueTag,
    'status': status,
    'gross_weight_grams': grossWeightGrams,
    'net_weight_grams': netWeightGrams,
    'purchased_cost': purchasedCost,
  };
}

class StockMovement {
  final String id;
  final String productId;
  final String? productName;
  final String? uniqueTag;
  final int changeQty;
  final int previousStock;
  final int newStock;
  final String reason;
  final String? refType;
  final String? refId;
  final String? notes;
  final DateTime createdAt;

  StockMovement({
    required this.id,
    required this.productId,
    this.productName,
    this.uniqueTag,
    required this.changeQty,
    required this.previousStock,
    required this.newStock,
    required this.reason,
    this.refType,
    this.refId,
    this.notes,
    required this.createdAt,
  });

  factory StockMovement.fromJson(Map<String, dynamic> json) {
    return StockMovement(
      id: json['id'] as String,
      productId: json['product_id'] as String,
      productName: json['product_name'] as String?,
      uniqueTag: json['unique_tag'] as String?,
      changeQty: (json['change_qty'] as num).toInt(),
      previousStock: (json['previous_stock'] as num).toInt(),
      newStock: (json['new_stock'] as num).toInt(),
      reason: json['reason'] as String,
      refType: json['ref_type'] as String?,
      refId: json['ref_id'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
