import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_spacing.dart';

export 'app_colors.dart';
export 'app_spacing.dart';
export 'app_typography.dart';

/// DQR Tech design system theme configuration matching Stitch design tokens.
class AppTheme {
  // Backward compatibility getters pointing to AppColors tokens
  static const Color primaryColor = AppColors.primary;
  static const Color secondaryColor = AppColors.secondary;
  static const Color brandGradientStart = AppColors.brandGradientStart;
  static const Color brandGradientEnd = AppColors.brandGradientEnd;

  static const Color darkBackground = AppColors.darkBackground;
  static const Color darkCardSurface = AppColors.darkCardSurface;
  static const Color darkSurfaceVariant = AppColors.darkSurfaceVariant;
  static const Color darkSurfaceHigh = AppColors.darkSurfaceHigh;

  static const Color lightBackground = AppColors.lightBackground;
  static const Color lightCardSurface = AppColors.lightCardSurface;

  static const Color textPrimaryDark = AppColors.textPrimaryDark;
  static const Color textSecondaryDark = AppColors.textSecondaryDark;
  static const Color borderAccent = AppColors.borderAccent;
  static const Color outlineColor = AppColors.outline;

  static LinearGradient get brandGradient => AppColors.brandGradient;

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: AppColors.darkBackground,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.darkCardSurface,
        onSurface: AppColors.textPrimaryDark,
        outline: AppColors.outline,
        error: AppColors.error,
      ),
      cardTheme: CardThemeData(
        color: AppColors.darkCardSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.borderRadiusXxl,
          side: const BorderSide(color: AppColors.borderAccent, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkSurfaceVariant,
        border: OutlineInputBorder(
          borderRadius: AppRadius.borderRadiusLg,
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppRadius.borderRadiusLg,
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        labelStyle: const TextStyle(color: AppColors.textSecondaryDark),
        hintStyle: const TextStyle(color: AppColors.textSubtleDark),
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: AppColors.lightBackground,
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.lightCardSurface,
        error: AppColors.error,
      ),
      cardTheme: CardThemeData(
        color: AppColors.lightCardSurface,
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.borderRadiusXxl,
        ),
      ),
    );
  }
}
