import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Centralized Typography design tokens for DQR Tech Design System.
abstract class AppTypography {
  // Title Styles
  static const TextStyle displayLarge = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: AppColors.textWhite,
  );

  static const TextStyle titleLarge = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: AppColors.textWhite,
  );

  static const TextStyle titleMedium = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: AppColors.textWhite,
  );

  static const TextStyle titleSmall = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.bold,
    color: AppColors.textPrimaryDark,
  );

  static const TextStyle sectionHeader = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.bold,
    color: AppColors.textMutedDark,
  );

  // Body Styles
  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    height: 1.4,
    fontWeight: FontWeight.w600,
    color: AppColors.textWhite,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontSize: 15,
    height: 1.4,
    color: AppColors.textWhite,
  );

  static const TextStyle bodyMediumItalic = TextStyle(
    fontSize: 15,
    height: 1.4,
    fontStyle: FontStyle.italic,
    color: AppColors.textWhite,
  );

  static const TextStyle bodySmall = TextStyle(
    fontSize: 13,
    height: 1.4,
    color: AppColors.textMutedDark,
  );

  static const TextStyle bodySmallBold = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.bold,
    color: AppColors.textMutedDark,
  );

  // Caption & Badge Styles
  static const TextStyle caption = TextStyle(
    fontSize: 12,
    color: AppColors.textMutedDark,
  );

  static const TextStyle captionBold = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.bold,
    color: AppColors.info,
  );

  static const TextStyle badge = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: AppColors.secondary,
  );

  static const TextStyle badgeSubtle = TextStyle(
    fontSize: 11,
    color: AppColors.textSubtleDark,
  );

  static const TextStyle buttonPrimary = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.bold,
    color: AppColors.textWhite,
  );

  static const TextStyle buttonSecondary = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: AppColors.textWhite,
  );
}
