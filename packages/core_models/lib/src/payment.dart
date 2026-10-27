enum PaymentMethod {
  cash,
  card,
  upi,
  bankTransfer,
  storeCredit,
  split;

  static PaymentMethod fromString(String val) {
    switch (val.toLowerCase().replaceAll('_', '')) {
      case 'card':
        return PaymentMethod.card;
      case 'upi':
        return PaymentMethod.upi;
      case 'banktransfer':
        return PaymentMethod.bankTransfer;
      case 'storecredit':
        return PaymentMethod.storeCredit;
      case 'split':
        return PaymentMethod.split;
      case 'cash':
      default:
        return PaymentMethod.cash;
    }
  }

  String get displayName {
    switch (this) {
      case PaymentMethod.cash:
        return 'Cash';
      case PaymentMethod.card:
        return 'Card / POS Terminal';
      case PaymentMethod.upi:
        return 'UPI / QR Code';
      case PaymentMethod.bankTransfer:
        return 'Bank Transfer / NEFT';
      case PaymentMethod.storeCredit:
        return 'Store Credit';
      case PaymentMethod.split:
        return 'Split Payment';
    }
  }
}

class Payment {
  final String id;
  final String? saleId;
  final String? customerId;
  final double amount;
  final PaymentMethod method;
  final String? transactionRef;
  final DateTime paidAt;
  final String processedBy;

  Payment({
    required this.id,
    this.saleId,
    this.customerId,
    required this.amount,
    required this.method,
    this.transactionRef,
    required this.paidAt,
    required this.processedBy,
  });

  factory Payment.fromJson(Map<String, dynamic> json) => Payment(
    id: json['id'] as String,
    saleId: json['sale_id'] as String?,
    customerId: json['customer_id'] as String?,
    amount: (json['amount'] as num).toDouble(),
    method: PaymentMethod.fromString(json['method'] as String? ?? 'cash'),
    transactionRef: json['transaction_ref'] as String?,
    paidAt: DateTime.parse(json['paid_at'] as String),
    processedBy: json['processed_by'] as String? ?? 'System',
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'sale_id': saleId,
    'customer_id': customerId,
    'amount': amount,
    'method': method.name,
    'transaction_ref': transactionRef,
    'paid_at': paidAt.toIso8601String(),
    'processed_by': processedBy,
  };
}

class Expense {
  final String id;
  final String category;
  final double amount;
  final String paymentMethod;
  final DateTime expenseDate;
  final String description;

  Expense({
    required this.id,
    required this.category,
    required this.amount,
    this.paymentMethod = 'cash',
    required this.expenseDate,
    required this.description,
  });

  factory Expense.fromJson(Map<String, dynamic> json) => Expense(
    id: json['id'] as String,
    category: json['category'] as String,
    amount: (json['amount'] as num).toDouble(),
    paymentMethod: json['payment_method'] as String? ?? 'cash',
    expenseDate: DateTime.parse(json['expense_date'] as String),
    description: json['description'] as String,
  );
}
