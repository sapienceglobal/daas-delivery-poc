import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme.dart';
import '../../widgets/glass_container.dart';

class CustomerProfileScreen extends StatelessWidget {
  const CustomerProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    if (user == null) {
      return const Center(child: CircularProgressIndicator(color: BrandColors.cyan));
    }

    return Scaffold(
      backgroundColor: BrandColors.background,
      appBar: AppBar(
        title: const Text('My Profile'),
        backgroundColor: BrandColors.card,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: BrandColors.red),
            onPressed: () {
              auth.logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: CircleAvatar(
                radius: 40,
                backgroundColor: BrandColors.cyan,
                child: Text(user['name']?[0] ?? 'U', style: const TextStyle(fontSize: 32, color: BrandColors.background, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 16),
            Center(child: Text(user['name'] ?? '', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: BrandColors.textMain))),
            Center(child: Text(user['email'] ?? '', style: const TextStyle(color: BrandColors.textMuted))),
            
            const SizedBox(height: 32),
            GlassContainer(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Loyalty Program', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: BrandColors.textMain)),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Current Points:', style: TextStyle(color: BrandColors.textMuted)),
                      Text('${user['loyaltyPoints'] ?? 0}', style: const TextStyle(color: BrandColors.cyan, fontWeight: FontWeight.bold, fontSize: 18)),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 16),
            const Text('Saved Addresses', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: BrandColors.textMain)),
            const SizedBox(height: 8),
            ...(user['savedAddresses'] as List? ?? []).map((addr) {
              final String addrStr = addr is Map ? (addr['address'] ?? addr.toString()) : addr.toString();
              return GlassContainer(
                margin: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    const Icon(Icons.location_on, color: BrandColors.cyan),
                    const SizedBox(width: 16),
                    Expanded(child: Text(addrStr, style: const TextStyle(color: BrandColors.textMain))),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
