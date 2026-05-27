import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:classifly/theme.dart';

class ClassiflyBottomNav extends StatelessWidget {
  const ClassiflyBottomNav({super.key, required this.currentIndex});

  final int currentIndex;

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: currentIndex,
      type: BottomNavigationBarType.fixed,
      selectedItemColor: AppColors.primary,
      unselectedItemColor: AppColors.neutral500,
      showUnselectedLabels: true,
      onTap: (index) {
        switch (index) {
          case 0:
            context.go('/');
          case 1:
            context.go('/search');
          case 2:
            context.go('/sell');
          case 3:
            // TODO: chat list route
            break;
          case 4:
            context.go('/profile');
        }
      },
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Home'),
        BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Search'),
        BottomNavigationBarItem(
          icon: CircleAvatar(
            backgroundColor: AppColors.accent,
            radius: 18,
            child: Icon(Icons.add, color: Colors.white),
          ),
          label: 'Sell',
        ),
        BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), label: 'Chat'),
        BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
      ],
    );
  }
}
