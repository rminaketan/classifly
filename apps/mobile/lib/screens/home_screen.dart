import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:classifly/theme.dart';
import 'package:classifly/widgets/bottom_nav.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: RichText(
          text: const TextSpan(
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 20,
              color: AppColors.primary,
            ),
            children: [
              TextSpan(text: 'Classifly'),
              TextSpan(text: '.in', style: TextStyle(color: AppColors.accent)),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => context.go('/search'),
          ),
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () => context.go('/profile'),
          ),
        ],
      ),
      body: const _HomeContent(),
      bottomNavigationBar: const ClassiflyBottomNav(currentIndex: 0),
    );
  }
}

class _HomeContent extends StatelessWidget {
  const _HomeContent();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(
          decoration: InputDecoration(
            hintText: 'Search Classifly',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: Container(
              margin: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.mic, color: Colors.white, size: 20),
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text('Browse categories', style: TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 4,
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          children: const [
            _CategoryTile(icon: Icons.smartphone, label: 'Mobiles'),
            _CategoryTile(icon: Icons.directions_car, label: 'Vehicles'),
            _CategoryTile(icon: Icons.home, label: 'Property'),
            _CategoryTile(icon: Icons.chair, label: 'Home'),
            _CategoryTile(icon: Icons.laptop, label: 'Electronics'),
            _CategoryTile(icon: Icons.work, label: 'Jobs'),
            _CategoryTile(icon: Icons.build, label: 'Services'),
            _CategoryTile(icon: Icons.sports_baseball, label: 'Sports'),
          ],
        ),
        const SizedBox(height: 24),
        const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 32),
            child: Text(
              'Listings will appear here once Supabase is wired in.\nSee SETUP.md.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.neutral500),
            ),
          ),
        ),
      ],
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.primary),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
