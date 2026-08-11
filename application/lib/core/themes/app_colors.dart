import 'package:flutter/material.dart';

/// Centralized color design tokens for DQR Tech Design System.
abstract class AppColors {
  // Brand Colors
  static const Color primary = Color(0xFFFC5C08);
  static const Color secondary = Color(0xFFFF8A00);
  static const Color brandGradientStart = Color(0xFFFC5C08);
  static const Color brandGradientEnd = Color(0xFFFF8A00);

  // Surface & Background Colors (Dark Theme Default)
  static const Color darkBackground = Color(0xFF131316);
  static const Color darkCardSurface = Color(0xFF1F1F22);
  static const Color darkSurfaceVariant = Color(0xFF353438);
  static const Color darkSurfaceHigh = Color(0xFF2A2A2D);

  // Surface & Background Colors (Light Theme)
  static const Color lightBackground = Color(0xFFF8F9FA);
  static const Color lightCardSurface = Color(0xFFFFFFFF);

  // Text Colors
  static const Color textPrimaryDark = Color(0xFFE4E1E6);
  static const Color textSecondaryDark = Color(0xFFE4BFB2);
  static const Color textMutedDark = Color(0x99FFFFFF); // ~60% white
  static const Color textSubtleDark = Color(0x61FFFFFF); // ~38% white
  static const Color textDisabledDark = Color(0x3DFFFFFF); // ~24% white
  static const Color textWhite = Colors.white;

  // Border & Divider Colors
  static const Color borderAccent = Color(0x33FC5C08);
  static const Color outline = Color(0xFFAB897E);
  static const Color borderSubtle = Color(0x1AFFFFFF); // ~10% white
  static const Color borderMedium = Color(0x3DFFFFFF); // ~24% white

  // Alert & Semantic Status Colors
  static const Color error = Colors.redAccent;
  static const Color errorSurface = Color(0x1FFE5252); // ~12% opacity red
  static const Color errorBorder = Color(0x66FE5252); // ~40% opacity red

  static const Color warning = Colors.amber;
  static const Color warningAccent = Colors.amberAccent;
  static const Color warningSurface = Color(0x26FFC107); // ~15% opacity amber
  static const Color warningBorder = Color(0x80FFC107); // ~50% opacity amber

  static const Color info = Colors.orange;
  static const Color infoSurface = Color(0x26FF9800);
  
  static const Color success = Color(0xFF4CAF50);
  static const Color successSurface = Color(0x264CAF50);

  // Brand Gradient Helper
  static LinearGradient get brandGradient => const LinearGradient(
        colors: [brandGradientStart, brandGradientEnd],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
}
