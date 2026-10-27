enum TrackType { standard, serialized, weightBased }

class Product {
  final String id;
  final String sku;
  final String? barcode;
  final String name;
  final String? categoryId;
  final String? categoryName;
  final String? description;
  final TrackType trackType;
  final double costPrice;
  final double sellPrice;
  final double? mrp;
  final int stockOnHand;
  final int reorderThreshold;
  final bool isService;
  final bool isActive;

  Product({
    required this.id,
    required this.sku,
    this.barcode,
    required this.name,
    this.categoryId,
    this.categoryName,
    this.description,
    this.trackType = TrackType.standard,
    required this.costPrice,
    required this.sellPrice,
    this.mrp,
    required this.stockOnHand,
    this.reorderThreshold = 2,
    this.isService = false,
    this.isActive = true,
  });

  bool get isLowStock => !isService && stockOnHand <= reorderThreshold;

  factory Product.fromJson(Map<String, dynamic> json) {
    TrackType track = TrackType.standard;
    if (json['track_type'] == 'serialized') track = TrackType.serialized;
    if (json['track_type'] == 'weight_based') track = TrackType.weightBased;

    return Product(
      id: json['id'] as String,
      sku: json['sku'] as String,
      barcode: json['barcode'] as String?,
      name: json['name'] as String,
      categoryId: json['category_id'] as String?,
      categoryName: json['category_name'] as String?,
      description: json['description'] as String?,
      trackType: track,
      costPrice: (json['cost_price'] as num?)?.toDouble() ?? 0.0,
      sellPrice: (json['sell_price'] as num?)?.toDouble() ?? 0.0,
      mrp: (json['mrp'] as num?)?.toDouble(),
      stockOnHand: (json['stock_on_hand'] as num?)?.toInt() ?? 0,
      reorderThreshold: (json['reorder_threshold'] as num?)?.toInt() ?? 2,
      isService: json['is_service'] as bool? ?? false,
      isActive: json['is_active'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'sku': sku,
    'barcode': barcode,
    'name': name,
    'category_id': categoryId,
    'category_name': categoryName,
    'description': description,
    'track_type': trackType.name,
    'cost_price': costPrice,
    'sell_price': sellPrice,
    'mrp': mrp,
    'stock_on_hand': stockOnHand,
    'reorder_threshold': reorderThreshold,
    'is_service': isService,
    'is_active': isActive,
  };
}
