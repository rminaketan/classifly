import 'package:flutter/material.dart';

import 'package:classifly/widgets/bottom_nav.dart';

class SearchScreen extends StatelessWidget {
  const SearchScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Search')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Search screen scaffolded — wire to Supabase search_listings RPC.\n\nSee web app at apps/web/src/app/search/page.tsx for the API pattern to mirror.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
      bottomNavigationBar: const ClassiflyBottomNav(currentIndex: 1),
    );
  }
}
