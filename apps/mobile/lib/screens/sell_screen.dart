import 'package:flutter/material.dart';

import 'package:classifly/widgets/bottom_nav.dart';

class SellScreen extends StatelessWidget {
  const SellScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Post your ad')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Post-ad wizard scaffolded.\n\nMirror the 4-step flow from docs/03-ui-wireframes/prototype.html (Mobile → Post-ad).',
            textAlign: TextAlign.center,
          ),
        ),
      ),
      bottomNavigationBar: const ClassiflyBottomNav(currentIndex: 2),
    );
  }
}
