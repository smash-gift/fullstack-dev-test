import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_radius.dart';
import 'app_text_styles.dart';

/// Monta o `ThemeData` do app a partir dos tokens espelhados de
/// `docs/design/design-tokens.md`.
ThemeData buildAppTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: AppColors.brandPrimary,
    brightness: Brightness.light,
    primary: AppColors.actionPrimary,
    onPrimary: AppColors.actionPrimaryText,
    secondary: AppColors.brandPrimary,
    onSecondary: AppColors.actionSecondaryText,
    surface: AppColors.backgroundPrimary,
    onSurface: AppColors.textPrimary,
    error: AppColors.feedbackError,
    onError: AppColors.textInverse,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: AppColors.backgroundPrimary,
    fontFamily: AppTextStyles.body.fontFamily,
    textTheme: TextTheme(
      displayLarge: AppTextStyles.display,
      headlineLarge: AppTextStyles.heading,
      titleLarge: AppTextStyles.title,
      titleMedium: AppTextStyles.titleSmall,
      labelLarge: AppTextStyles.button,
      bodyLarge: AppTextStyles.bodyLarge,
      bodyMedium: AppTextStyles.body,
      bodySmall: AppTextStyles.small,
      labelSmall: AppTextStyles.caption,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.backgroundPrimary,
      foregroundColor: AppColors.textPrimary,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: AppTextStyles.title,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.backgroundSecondary,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      labelStyle: AppTextStyles.label,
      hintStyle: AppTextStyles.body.copyWith(color: AppColors.textMuted),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.small),
        borderSide: const BorderSide(color: AppColors.borderDefault),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.small),
        borderSide: const BorderSide(color: AppColors.borderDefault),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.small),
        borderSide: const BorderSide(color: AppColors.borderFocus, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.small),
        borderSide: const BorderSide(color: AppColors.feedbackError),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.actionPrimary,
        foregroundColor: AppColors.actionPrimaryText,
        disabledBackgroundColor: AppColors.actionPrimary.withOpacity(0.4),
        disabledForegroundColor: AppColors.actionPrimaryText.withOpacity(0.8),
        minimumSize: const Size.fromHeight(56),
        padding: const EdgeInsets.symmetric(horizontal: 24),
        textStyle: AppTextStyles.button,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.small),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.actionSecondaryText,
        side: const BorderSide(color: AppColors.borderDefault),
        minimumSize: const Size.fromHeight(56),
        padding: const EdgeInsets.symmetric(horizontal: 24),
        textStyle: AppTextStyles.button,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.small),
        ),
      ),
    ),
    cardTheme: CardThemeData(
      color: AppColors.backgroundPrimary,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.large),
        side: const BorderSide(color: AppColors.borderSoft),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: AppColors.brandAccent,
      contentTextStyle: AppTextStyles.body.copyWith(color: AppColors.textInverse),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.small),
      ),
    ),
  );
}
