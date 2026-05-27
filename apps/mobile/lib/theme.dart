import 'package:flutter/material.dart';

/// Design tokens — mirror of packages/ui/src/tokens.ts.
/// Single source of truth for colors / type / radius / shadows used by Flutter.
class AppColors {
  AppColors._();
  static const primary = Color(0xFF1F3A5F);
  static const primary50 = Color(0xFFF0F4F9);
  static const primary100 = Color(0xFFD9E2EE);
  static const primary700 = Color(0xFF172E4B);

  static const accent = Color(0xFFFF6B35);
  static const accent50 = Color(0xFFFFF4EF);
  static const accent700 = Color(0xFFC24016);

  static const success = Color(0xFF16A34A);
  static const warning = Color(0xFFF59E0B);
  static const danger = Color(0xFFDC2626);
  static const verified = Color(0xFF0EA5E9);

  static const neutral0 = Color(0xFFFFFFFF);
  static const neutral50 = Color(0xFFF8FAFC);
  static const neutral100 = Color(0xFFF1F5F9);
  static const neutral200 = Color(0xFFE2E8F0);
  static const neutral500 = Color(0xFF64748B);
  static const neutral700 = Color(0xFF334155);
  static const neutral900 = Color(0xFF0F172A);
}

ThemeData buildLightTheme() {
  return ThemeData(
    useMaterial3: true,
    colorScheme: const ColorScheme.light(
      primary: AppColors.primary,
      secondary: AppColors.accent,
      surface: AppColors.neutral0,
      error: AppColors.danger,
    ),
    scaffoldBackgroundColor: AppColors.neutral50,
    fontFamily: 'Inter',
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.neutral0,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      foregroundColor: AppColors.neutral900,
      centerTitle: false,
    ),
    cardTheme: CardTheme(
      elevation: 0,
      color: AppColors.neutral0,
      shape: RoundedRectangleBorder(
        side: const BorderSide(color: AppColors.neutral200),
        borderRadius: BorderRadius.circular(12),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.neutral0,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.neutral0,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.neutral200),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.neutral200),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.primary, width: 2),
      ),
    ),
  );
}

ThemeData buildDarkTheme() {
  return buildLightTheme().copyWith(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: AppColors.neutral900,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.primary,
      secondary: AppColors.accent,
      surface: Color(0xFF1E293B),
      error: AppColors.danger,
    ),
  );
}
