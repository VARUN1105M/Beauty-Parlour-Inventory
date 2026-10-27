enum UserRole {
  receptionist,
  cashier,
  inventoryManager,
  bridalManager,
  storeManager,
  systemAdmin;

  static UserRole fromString(String val) {
    switch (val.toLowerCase().replaceAll(' ', '_')) {
      case 'receptionist':
        return UserRole.receptionist;
      case 'cashier':
        return UserRole.cashier;
      case 'inventory_manager':
      case 'inventorymanager':
        return UserRole.inventoryManager;
      case 'bridal_manager':
      case 'bridalmanager':
        return UserRole.bridalManager;
      case 'store_manager':
      case 'storemanager':
        return UserRole.storeManager;
      case 'system_admin':
      case 'systemadmin':
        return UserRole.systemAdmin;
      default:
        return UserRole.cashier;
    }
  }

  String get code {
    switch (this) {
      case UserRole.receptionist:
        return 'receptionist';
      case UserRole.cashier:
        return 'cashier';
      case UserRole.inventoryManager:
        return 'inventory_manager';
      case UserRole.bridalManager:
        return 'bridal_manager';
      case UserRole.storeManager:
        return 'store_manager';
      case UserRole.systemAdmin:
        return 'system_admin';
    }
  }

  String get displayName {
    switch (this) {
      case UserRole.receptionist:
        return 'Receptionist';
      case UserRole.cashier:
        return 'Cashier';
      case UserRole.inventoryManager:
        return 'Inventory Manager';
      case UserRole.bridalManager:
        return 'Bridal Manager';
      case UserRole.storeManager:
        return 'Store Manager';
      case UserRole.systemAdmin:
        return 'System Admin';
    }
  }
}

class User {
  final String id;
  final String username;
  final UserRole role;
  final String branchId;
  final String? employeeId;
  final String? fullName;
  final bool isActive;

  User({
    required this.id,
    required this.username,
    required this.role,
    required this.branchId,
    this.employeeId,
    this.fullName,
    this.isActive = true,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      username: json['username'] as String,
      role: UserRole.fromString(json['role_code'] as String? ?? 'cashier'),
      branchId: json['branch_id'] as String,
      employeeId: json['employee_id'] as String?,
      fullName: json['full_name'] as String?,
      isActive: json['is_active'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'username': username,
    'role_code': role.code,
    'branch_id': branchId,
    'employee_id': employeeId,
    'full_name': fullName,
    'is_active': isActive,
  };
}
