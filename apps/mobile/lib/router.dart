import 'package:go_router/go_router.dart';

import 'package:classifly/screens/home_screen.dart';
import 'package:classifly/screens/login_screen.dart';
import 'package:classifly/screens/listing_detail_screen.dart';
import 'package:classifly/screens/profile_screen.dart';
import 'package:classifly/screens/search_screen.dart';
import 'package:classifly/screens/sell_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),
    GoRoute(path: '/sell', builder: (_, __) => const SellScreen()),
    GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
    GoRoute(
      path: '/listings/:id',
      builder: (_, state) => ListingDetailScreen(id: state.pathParameters['id']!),
    ),
  ],
);
