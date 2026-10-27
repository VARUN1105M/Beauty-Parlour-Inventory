library auth;

import 'package:core_models/core_models.dart';
import 'package:permissions/permissions.dart';

class AuthSession {
  final User user;
  final String token;
  final DateTime expiresAt;

  AuthSession({
    required this.user,
    required this.token,
    required this.expiresAt,
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);
}

abstract class AuthRepository {
  Future<AuthSession> signIn({required String username, required String password});
  Future<void> signOut();
  AuthSession? get currentSession;
  bool hasPermission(AppPermission permission);
}

class AuthService implements AuthRepository {
  AuthSession? _currentSession;

  @override
  AuthSession? get currentSession => _currentSession;

  @override
  bool hasPermission(AppPermission permission) {
    if (_currentSession == null) return false;
    return PermissionManager.hasPermission(_currentSession!.user.role, permission);
  }

  @override
  Future<AuthSession> signIn({required String username, required String password}) async {
    // In production this connects to Supabase auth or POST /auth/signin
    // Mock authentication for development and demo
    UserRole role = UserRole.storeManager;
    String name = 'Store Manager';
    if (username.contains('reception')) {
      role = UserRole.receptionist;
      name = 'Aanya Sharma (Reception)';
    } else if (username.contains('cash')) {
      role = UserRole.cashier;
      name = 'Karan Singhania (Cashier)';
    } else if (username.contains('inventory')) {
      role = UserRole.inventoryManager;
      name = 'Rajesh Verma (Inventory)';
    } else if (username.contains('bridal')) {
      role = UserRole.bridalManager;
      name = 'Priya Kapoor (Bridal Lead)';
    }

    final user = User(
      id: 'u-${DateTime.now().millisecondsSinceEpoch}',
      username: username,
      role: role,
      branchId: 'c0000000-0000-0000-0000-000000000001',
      fullName: name,
    );

    _currentSession = AuthSession(
      user: user,
      token: 'jwt-pos-demo-${DateTime.now().millisecondsSinceEpoch}',
      expiresAt: DateTime.now().add(const Duration(hours: 12)),
    );

    return _currentSession!;
  }

  @override
  Future<void> signOut() async {
    _currentSession = null;
  }

  void switchRole(UserRole newRole) {
    if (_currentSession != null) {
      _currentSession = AuthSession(
        user: User(
          id: _currentSession!.user.id,
          username: _currentSession!.user.username,
          role: newRole,
          branchId: _currentSession!.user.branchId,
          fullName: '${newRole.displayName} (Active Profile)',
        ),
        token: _currentSession!.token,
        expiresAt: _currentSession!.expiresAt,
      );
    }
  }
}
