library permissions;

import 'package:core_models/core_models.dart';

enum AppPermission {
  // Sales / POS
  posCreateSale,
  posViewSales,
  posApproveRefund,
  posPriceOverride,

  // Inventory
  inventoryView,
  inventoryAdjustStock,
  inventoryManageProducts,

  // Purchasing & Receiving
  purchasingCreatePo,
  receivingRecordGoods,

  // Appointments
  appointmentsSchedule,
  appointmentsCheckIn,

  // Bridal
  bridalManageProjects,
  bridalViewQuotes,

  // Customers (CRM)
  customersManage,
  customersView,

  // Employees & HR
  employeesManage,
  attendanceClockInOut,
  attendanceApprove,

  // Finance & Cashup
  dayCloseExecute,
  expensesRecord,

  // Reports
  reportsViewSales,
  reportsViewInventory,
  reportsViewFinancialPnl,

  // Settings & System
  settingsManageSystem,
  userAccountsManage,
}

class PermissionManager {
  static final Map<UserRole, Set<AppPermission>> _roleMatrix = {
    UserRole.storeManager: AppPermission.values.toSet(),
    UserRole.systemAdmin: AppPermission.values.toSet(),

    UserRole.receptionist: {
      AppPermission.posCreateSale,
      AppPermission.posViewSales,
      AppPermission.inventoryView,
      AppPermission.appointmentsSchedule,
      AppPermission.appointmentsCheckIn,
      AppPermission.bridalViewQuotes,
      AppPermission.customersManage,
      AppPermission.customersView,
      AppPermission.attendanceClockInOut,
      AppPermission.reportsViewSales,
    },

    UserRole.cashier: {
      AppPermission.posCreateSale,
      AppPermission.posViewSales,
      AppPermission.inventoryView,
      AppPermission.attendanceClockInOut,
      AppPermission.dayCloseExecute,
      AppPermission.expensesRecord,
      AppPermission.reportsViewSales,
    },

    UserRole.inventoryManager: {
      AppPermission.posViewSales,
      AppPermission.inventoryView,
      AppPermission.inventoryAdjustStock,
      AppPermission.inventoryManageProducts,
      AppPermission.purchasingCreatePo,
      AppPermission.receivingRecordGoods,
      AppPermission.attendanceClockInOut,
      AppPermission.reportsViewInventory,
    },

    UserRole.bridalManager: {
      AppPermission.posViewSales,
      AppPermission.inventoryView,
      AppPermission.appointmentsSchedule,
      AppPermission.appointmentsCheckIn,
      AppPermission.bridalManageProjects,
      AppPermission.bridalViewQuotes,
      AppPermission.customersManage,
      AppPermission.customersView,
      AppPermission.attendanceClockInOut,
      AppPermission.reportsViewSales,
    },
  };

  static bool hasPermission(UserRole role, AppPermission permission) {
    final permissions = _roleMatrix[role];
    if (permissions == null) return false;
    return permissions.contains(permission);
  }

  static bool canApproveRefund(UserRole role) =>
      hasPermission(role, AppPermission.posApproveRefund);

  static bool canAdjustStock(UserRole role) =>
      hasPermission(role, AppPermission.inventoryAdjustStock);

  static bool canManageBridal(UserRole role) =>
      hasPermission(role, AppPermission.bridalManageProjects);

  static bool canAccessSettings(UserRole role) =>
      hasPermission(role, AppPermission.settingsManageSystem);
}
