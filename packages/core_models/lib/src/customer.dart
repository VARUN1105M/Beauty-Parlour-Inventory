class Customer {
  final String id;
  final String fullName;
  final String phone;
  final String? email;
  final String? address;
  final String? city;
  final int loyaltyPoints;
  final double storeCredit;
  final DateTime? weddingDate;
  final String? skinHairNotes;
  final String? jewelryPreferences;
  final double totalSpent;

  Customer({
    required this.id,
    required this.fullName,
    required this.phone,
    this.email,
    this.address,
    this.city,
    this.loyaltyPoints = 0,
    this.storeCredit = 0.00,
    this.weddingDate,
    this.skinHairNotes,
    this.jewelryPreferences,
    this.totalSpent = 0.00,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id'] as String,
      fullName: json['full_name'] as String,
      phone: json['phone'] as String,
      email: json['email'] as String?,
      address: json['address'] as String?,
      city: json['city'] as String?,
      loyaltyPoints: json['loyalty_points'] as int? ?? 0,
      storeCredit: (json['store_credit'] as num?)?.toDouble() ?? 0.00,
      weddingDate: json['wedding_date'] != null
          ? DateTime.tryParse(json['wedding_date'] as String)
          : null,
      skinHairNotes: json['skin_hair_notes'] as String?,
      jewelryPreferences: json['jewelry_preferences'] as String?,
      totalSpent: (json['total_spent'] as num?)?.toDouble() ?? 0.00,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'full_name': fullName,
    'phone': phone,
    'email': email,
    'address': address,
    'city': city,
    'loyalty_points': loyaltyPoints,
    'store_credit': storeCredit,
    'wedding_date': weddingDate?.toIso8601String().substring(0, 10),
    'skin_hair_notes': skinHairNotes,
    'jewelry_preferences': jewelryPreferences,
    'total_spent': totalSpent,
  };
}
