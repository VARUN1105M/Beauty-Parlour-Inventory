import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:core_models/core_models.dart';
import 'package:auth/auth.dart';
import 'package:permissions/permissions.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: BridalPosDesktopApp()));
}

class BridalPosDesktopApp extends StatelessWidget {
  const BridalPosDesktopApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Royal Heritage - POS & Bridal ERP',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF8B1E3F), // Royal maroon / rose gold
          primary: const Color(0xFF8B1E3F),
          secondary: const Color(0xFFD4AF37), // Metallic Gold
          background: const Color(0xFFF9FAFB),
        ),
        fontFamily: 'Segoe UI',
      ),
      home: const DesktopMainNavigationShell(),
    );
  }
}

class DesktopMainNavigationShell extends StatefulWidget {
  const DesktopMainNavigationShell({super.key});

  @override
  State<DesktopMainNavigationShell> createState() => _DesktopMainNavigationShellState();
}

class _DesktopMainNavigationShellState extends State<DesktopMainNavigationShell> {
  int _selectedIndex = 0;
  UserRole _currentRole = UserRole.storeManager;

  final List<NavigationDestinationItem> _destinations = const [
    NavigationDestinationItem(title: 'Dashboard', icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard),
    NavigationDestinationItem(title: 'Sales (POS)', icon: Icons.point_of_sale_outlined, activeIcon: Icons.point_of_sale),
    NavigationDestinationItem(title: 'Inventory & Stock', icon: Icons.inventory_2_outlined, activeIcon: Icons.inventory_2),
    NavigationDestinationItem(title: 'Appointments', icon: Icons.calendar_month_outlined, activeIcon: Icons.calendar_month),
    NavigationDestinationItem(title: 'Bridal Projects', icon: Icons.diamond_outlined, activeIcon: Icons.diamond),
    NavigationDestinationItem(title: 'Purchasing & POs', icon: Icons.shopping_bag_outlined, activeIcon: Icons.shopping_bag),
    NavigationDestinationItem(title: 'Customers (CRM)', icon: Icons.people_outline, activeIcon: Icons.people),
    NavigationDestinationItem(title: 'Employees & Shifts', icon: Icons.badge_outlined, activeIcon: Icons.badge),
    NavigationDestinationItem(title: 'Day Close (Cashup)', icon: Icons.account_balance_wallet_outlined, activeIcon: Icons.account_balance_wallet),
    NavigationDestinationItem(title: 'Reports & P&L', icon: Icons.bar_chart_outlined, activeIcon: Icons.bar_chart),
    NavigationDestinationItem(title: 'Settings & Admin', icon: Icons.settings_outlined, activeIcon: Icons.settings),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          // Left Sidebar Desktop Navigation
          NavigationRail(
            selectedIndex: _selectedIndex,
            onDestinationSelected: (index) => setState(() => _selectedIndex = index),
            labelType: NavigationRailLabelType.all,
            leading: Column(
              children: [
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF8B1E3F),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.diamond, color: Color(0xFFD4AF37), size: 28),
                ),
                const SizedBox(height: 6),
                const Text(
                  'ROYAL HERITAGE',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 1),
                ),
                const SizedBox(height: 16),
              ],
            ),
            trailing: Expanded(
              child: Align(
                alignment: Alignment.bottomCenter,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: PopupMenuButton<UserRole>(
                    tooltip: 'Switch Role Profile',
                    icon: CircleAvatar(
                      backgroundColor: Colors.amber.shade100,
                      child: Text(
                        _currentRole.displayName.substring(0, 1),
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.brown),
                      ),
                    ),
                    onSelected: (role) => setState(() => _currentRole = role),
                    itemBuilder: (context) => UserRole.values.map((role) {
                      return PopupMenuItem(
                        value: role,
                        child: Text(role.displayName),
                      );
                    }).toList(),
                  ),
                ),
              ),
            ),
            destinations: _destinations.map((d) {
              return NavigationRailDestination(
                icon: Icon(d.icon),
                selectedIcon: Icon(d.activeIcon, color: const Color(0xFF8B1E3F)),
                label: Text(d.title, style: const TextStyle(fontSize: 11)),
              );
            }).toList(),
          ),
          const VerticalDivider(thickness: 1, width: 1),
          // Main Body Screen View
          Expanded(
            child: Column(
              children: [
                // Top App Bar with Hardware Status indicators
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
                  ),
                  child: Row(
                    children: [
                      Text(
                        _destinations[_selectedIndex].title,
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const Spacer(),
                      // Hardware status badges
                      _HardwarePill(icon: Icons.print, label: 'Epson TM-T88VI: Ready', isOnline: true),
                      const SizedBox(width: 8),
                      _HardwarePill(icon: Icons.qr_code_scanner, label: 'Honeywell 1900g: Ready', isOnline: true),
                      const SizedBox(width: 8),
                      _HardwarePill(icon: Icons.point_of_sale, label: 'Drawer: Monitored', isOnline: true),
                      const SizedBox(width: 16),
                      Chip(
                        avatar: const Icon(Icons.security, size: 16, color: Colors.white),
                        label: Text(_currentRole.displayName, style: const TextStyle(color: Colors.white, fontSize: 12)),
                        backgroundColor: const Color(0xFF8B1E3F),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      '${_destinations[_selectedIndex].title} Screen (Desktop App)',
                      style: const TextStyle(fontSize: 18, color: Colors.grey),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class NavigationDestinationItem {
  final String title;
  final IconData icon;
  final IconData activeIcon;

  const NavigationDestinationItem({
    required this.title,
    required this.icon,
    required this.activeIcon,
  });
}

class _HardwarePill extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isOnline;

  const _HardwarePill({required this.icon, required this.label, required this.isOnline});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isOnline ? Colors.green.shade50 : Colors.red.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isOnline ? Colors.green.shade200 : Colors.red.shade200),
      ),
      child: Row(
        children: [
          Icon(icon, size: 14, color: isOnline ? Colors.green.shade700 : Colors.red.shade700),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: isOnline ? Colors.green.shade800 : Colors.red.shade800,
            ),
          ),
        ],
      ),
    );
  }
}
