import 'package:flutter/material.dart';

void main() {
  runApp(const BridalMobileCompanionApp());
}

class BridalMobileCompanionApp extends StatelessWidget {
  const BridalMobileCompanionApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Royal Heritage - Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF8B1E3F)),
      ),
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Royal Heritage Client & Owner Portal'),
          backgroundColor: const Color(0xFF8B1E3F),
          foregroundColor: Colors.white,
        ),
        body: const Center(
          child: Text('Mobile Client & Owner App'),
        ),
      ),
    );
  }
}
