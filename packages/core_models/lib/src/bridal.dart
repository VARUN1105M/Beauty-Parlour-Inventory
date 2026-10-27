enum BridalProjectStatus {
  enquiry,
  quoteSent,
  confirmed,
  trialCompleted,
  inExecution,
  completed,
  cancelled;

  static BridalProjectStatus fromString(String val) {
    switch (val.toLowerCase().replaceAll('-', '_')) {
      case 'quote_sent':
      case 'quotesent':
        return BridalProjectStatus.quoteSent;
      case 'confirmed':
        return BridalProjectStatus.confirmed;
      case 'trial_completed':
      case 'trialcompleted':
        return BridalProjectStatus.trialCompleted;
      case 'in_execution':
      case 'inexecution':
        return BridalProjectStatus.inExecution;
      case 'completed':
        return BridalProjectStatus.completed;
      case 'cancelled':
        return BridalProjectStatus.cancelled;
      case 'enquiry':
      default:
        return BridalProjectStatus.enquiry;
    }
  }

  String get displayName {
    switch (this) {
      case BridalProjectStatus.enquiry:
        return 'Enquiry / Lead';
      case BridalProjectStatus.quoteSent:
        return 'Quote Sent';
      case BridalProjectStatus.confirmed:
        return 'Confirmed';
      case BridalProjectStatus.trialCompleted:
        return 'Trial Completed';
      case BridalProjectStatus.inExecution:
        return 'Wedding In Execution';
      case BridalProjectStatus.completed:
        return 'Completed';
      case BridalProjectStatus.cancelled:
        return 'Cancelled';
    }
  }
}

class BridalServiceItem {
  final String id;
  final String serviceType;
  final String eventPhase; // 'Sangeet', 'Wedding Day', etc.
  final String? assignedStaffName;
  final DateTime? startTime;
  final double price;
  final String status;

  BridalServiceItem({
    required this.id,
    required this.serviceType,
    required this.eventPhase,
    this.assignedStaffName,
    this.startTime,
    required this.price,
    this.status = 'pending',
  });

  factory BridalServiceItem.fromJson(Map<String, dynamic> json) => BridalServiceItem(
    id: json['id'] as String,
    serviceType: json['service_type'] as String,
    eventPhase: json['event_phase'] as String,
    assignedStaffName: json['assigned_staff_name'] as String?,
    startTime: json['start_time'] != null ? DateTime.tryParse(json['start_time'] as String) : null,
    price: (json['price'] as num).toDouble(),
    status: json['status'] as String? ?? 'pending',
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'service_type': serviceType,
    'event_phase': eventPhase,
    'assigned_staff_name': assignedStaffName,
    'start_time': startTime?.toIso8601String(),
    'price': price,
    'status': status,
  };
}

class BridalProject {
  final String id;
  final String projectCode;
  final String customerId;
  final String customerName;
  final String? customerPhone;
  final DateTime eventDate;
  final String? venueAddress;
  final String packageName;
  final BridalProjectStatus status;
  final double totalBudget;
  final double depositRequired;
  final double depositPaid;
  final double balanceDue;
  final String? notes;
  final List<BridalServiceItem> services;

  BridalProject({
    required this.id,
    required this.projectCode,
    required this.customerId,
    required this.customerName,
    this.customerPhone,
    required this.eventDate,
    this.venueAddress,
    required this.packageName,
    this.status = BridalProjectStatus.enquiry,
    required this.totalBudget,
    this.depositRequired = 0.0,
    this.depositPaid = 0.0,
    required this.balanceDue,
    this.notes,
    this.services = const [],
  });

  factory BridalProject.fromJson(Map<String, dynamic> json) {
    final list = (json['services'] as List<dynamic>?) ?? [];
    return BridalProject(
      id: json['id'] as String,
      projectCode: json['project_code'] as String,
      customerId: json['customer_id'] as String,
      customerName: json['customer_name'] as String? ?? 'Bride',
      customerPhone: json['customer_phone'] as String?,
      eventDate: DateTime.parse(json['event_date'] as String),
      venueAddress: json['venue_address'] as String?,
      packageName: json['package_name'] as String,
      status: BridalProjectStatus.fromString(json['status'] as String? ?? 'enquiry'),
      totalBudget: (json['total_budget'] as num).toDouble(),
      depositRequired: (json['deposit_required'] as num?)?.toDouble() ?? 0.0,
      depositPaid: (json['deposit_paid'] as num?)?.toDouble() ?? 0.0,
      balanceDue: (json['balance_due'] as num).toDouble(),
      notes: json['notes'] as String?,
      services: list.map((e) => BridalServiceItem.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'project_code': projectCode,
    'customer_id': customerId,
    'customer_name': customerName,
    'customer_phone': customerPhone,
    'event_date': eventDate.toIso8601String().substring(0, 10),
    'venue_address': venueAddress,
    'package_name': packageName,
    'status': status.name,
    'total_budget': totalBudget,
    'deposit_required': depositRequired,
    'deposit_paid': depositPaid,
    'balance_due': balanceDue,
    'notes': notes,
    'services': services.map((s) => s.toJson()).toList(),
  };
}
