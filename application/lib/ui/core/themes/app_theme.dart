import 'package:flutter/material.dart';

/// DQR Tech design system theme configuration.
class AppTheme {
  static const Color primaryColor = Color(0xFFFC5C08);
  static const Color secondaryColor = Color(0xFFFF8A00);
  static const Color darkBackground = Color(0xFF0F0F12);
  static const Color darkCardSurface = Color(0xFF18181C);
  static const Color lightBackground = Color(0xFFF8F9FA);
  static const Color lightCardSurface = Color(0xFFFFFFFF);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: darkBackground,
      colorScheme: const ColorScheme.dark(
        primary: primaryColor,
        secondary: secondaryColor,
        surface: darkCardSurface,
      ),
      cardTheme: const CardThemeData(
        color: darkCardSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: lightBackground,
      colorScheme: const ColorScheme.light(
        primary: primaryColor,
        secondary: secondaryColor,
        surface: lightCardSurface,
      ),
      cardTheme: const CardThemeData(
        color: lightCardSurface,
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
      ),
    );
  }
}
