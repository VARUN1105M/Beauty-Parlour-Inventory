class Shift {
  final String id;
  final String employeeId;
  final String employeeName;
  final DateTime shiftDate;
  final String startTime;
  final String endTime;
  final String? notes;

  Shift({
    required this.id,
    required this.employeeId,
    required this.employeeName,
    required this.shiftDate,
    required this.startTime,
    required this.endTime,
    this.notes,
  });

  factory Shift.fromJson(Map<String, dynamic> json) => Shift(
    id: json['id'] as String,
    employeeId: json['employee_id'] as String,
    employeeName: json['employee_name'] as String? ?? 'Staff',
    shiftDate: DateTime.parse(json['shift_date'] as String),
    startTime: json['start_time'] as String,
    endTime: json['end_time'] as String,
    notes: json['notes'] as String?,
  );
}

class AttendanceRecord {
  final String id;
  final String employeeId;
  final String employeeName;
  final DateTime workDate;
  final DateTime clockIn;
  final DateTime? clockOut;
  final int breakMinutes;
  final String? notes;

  AttendanceRecord({
    required this.id,
    required this.employeeId,
    required this.employeeName,
    required this.workDate,
    required this.clockIn,
    this.clockOut,
    this.breakMinutes = 0,
    this.notes,
  });

  bool get isClockedIn => clockOut == null;

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) => AttendanceRecord(
    id: json['id'] as String,
    employeeId: json['employee_id'] as String,
    employeeName: json['employee_name'] as String? ?? 'Staff',
    workDate: DateTime.parse(json['work_date'] as String),
    clockIn: DateTime.parse(json['clock_in'] as String),
    clockOut: json['clock_out'] != null ? DateTime.tryParse(json['clock_out'] as String) : null,
    breakMinutes: (json['break_duration_mins'] as num?)?.toInt() ?? 0,
    notes: json['notes'] as String?,
  );
}
