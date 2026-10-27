enum AppointmentStatus {
  scheduled,
  confirmed,
  checkedIn,
  inProgress,
  completed,
  cancelled,
  noShow;

  static AppointmentStatus fromString(String val) {
    switch (val.toLowerCase().replaceAll('-', '_')) {
      case 'confirmed':
        return AppointmentStatus.confirmed;
      case 'checked_in':
      case 'checkedin':
        return AppointmentStatus.checkedIn;
      case 'in_progress':
      case 'inprogress':
        return AppointmentStatus.inProgress;
      case 'completed':
        return AppointmentStatus.completed;
      case 'cancelled':
        return AppointmentStatus.cancelled;
      case 'no_show':
        return AppointmentStatus.noShow;
      case 'scheduled':
      default:
        return AppointmentStatus.scheduled;
    }
  }

  String get displayName {
    switch (this) {
      case AppointmentStatus.scheduled:
        return 'Scheduled';
      case AppointmentStatus.confirmed:
        return 'Confirmed';
      case AppointmentStatus.checkedIn:
        return 'Checked-In';
      case AppointmentStatus.inProgress:
        return 'In Service';
      case AppointmentStatus.completed:
        return 'Completed';
      case AppointmentStatus.cancelled:
        return 'Cancelled';
      case AppointmentStatus.noShow:
        return 'No-Show';
    }
  }
}

class Appointment {
  final String id;
  final String appointmentNumber;
  final String branchId;
  final String customerId;
  final String customerName;
  final String? customerPhone;
  final String serviceId;
  final String serviceName;
  final String staffId;
  final String staffName;
  final DateTime scheduledStart;
  final DateTime scheduledEnd;
  final DateTime? actualCheckIn;
  final DateTime? actualCompleted;
  final AppointmentStatus status;
  final double totalPrice;
  final double depositAmount;
  final String? notes;

  Appointment({
    required this.id,
    required this.appointmentNumber,
    required this.branchId,
    required this.customerId,
    required this.customerName,
    this.customerPhone,
    required this.serviceId,
    required this.serviceName,
    required this.staffId,
    required this.staffName,
    required this.scheduledStart,
    required this.scheduledEnd,
    this.actualCheckIn,
    this.actualCompleted,
    this.status = AppointmentStatus.scheduled,
    required this.totalPrice,
    this.depositAmount = 0.0,
    this.notes,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'] as String,
      appointmentNumber: json['appointment_number'] as String,
      branchId: json['branch_id'] as String,
      customerId: json['customer_id'] as String,
      customerName: json['customer_name'] as String? ?? 'Customer',
      customerPhone: json['customer_phone'] as String?,
      serviceId: json['service_id'] as String,
      serviceName: json['service_name'] as String? ?? 'Service',
      staffId: json['staff_id'] as String,
      staffName: json['staff_name'] as String? ?? 'Staff',
      scheduledStart: DateTime.parse(json['scheduled_start'] as String),
      scheduledEnd: DateTime.parse(json['scheduled_end'] as String),
      actualCheckIn: json['actual_check_in'] != null
          ? DateTime.tryParse(json['actual_check_in'] as String)
          : null,
      actualCompleted: json['actual_completed'] != null
          ? DateTime.tryParse(json['actual_completed'] as String)
          : null,
      status: AppointmentStatus.fromString(json['status'] as String? ?? 'scheduled'),
      totalPrice: (json['total_price'] as num).toDouble(),
      depositAmount: (json['deposit_amount'] as num?)?.toDouble() ?? 0.0,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'appointment_number': appointmentNumber,
    'branch_id': branchId,
    'customer_id': customerId,
    'customer_name': customerName,
    'customer_phone': customerPhone,
    'service_id': serviceId,
    'service_name': serviceName,
    'staff_id': staffId,
    'staff_name': staffName,
    'scheduled_start': scheduledStart.toIso8601String(),
    'scheduled_end': scheduledEnd.toIso8601String(),
    'actual_check_in': actualCheckIn?.toIso8601String(),
    'actual_completed': actualCompleted?.toIso8601String(),
    'status': status.name,
    'total_price': totalPrice,
    'deposit_amount': depositAmount,
    'notes': notes,
  };
}
