import 'package:flutter/material.dart';

import 'package:classifly/widgets/bottom_nav.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Profile screen scaffolded.\n\nMirror docs/03-ui-wireframes/prototype.html (Mobile → Profile) — coloured header, KYC card, action grid, settings list.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
      bottomNavigationBar: const ClassiflyBottomNav(currentIndex: 4),
    );
  }
}
