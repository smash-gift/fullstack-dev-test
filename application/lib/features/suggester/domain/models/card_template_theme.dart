import 'package:flutter/material.dart';
import '../../../../core/themes/app_colors.dart';
import '../../../../core/themes/app_spacing.dart';

/// Card theme decoration domain model encapsulating template styling properties.
class CardTemplateTheme {
  final String key;
  final BoxDecoration decoration;

  const CardTemplateTheme({
    required this.key,
    required this.decoration,
  });

  static const CardTemplateTheme birthdaySparkle = CardTemplateTheme(
    key: 'sparkle',
    decoration: BoxDecoration(
      borderRadius: BorderRadius.all(Radius.circular(AppRadius.card)),
      gradient: LinearGradient(
        colors: [Color(0xFFFC5C08), Color(0xFFFF8A00), Color(0xFFFFB77F)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      boxShadow: [
        BoxShadow(
          color: Color(0x66FC5C08),
          blurRadius: AppSpacing.xl,
          spreadRadius: 2,
        )
      ],
    ),
  );

  static const CardTemplateTheme darkLuxury = CardTemplateTheme(
    key: 'darkLuxury',
    decoration: BoxDecoration(
      borderRadius: BorderRadius.all(Radius.circular(AppRadius.card)),
      gradient: LinearGradient(
        colors: [Color(0xFF1E1E24), Color(0xFF2A2A35), Color(0xFF121216)],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ),
      border: Border.fromBorderSide(BorderSide(color: Color(0xFFFFB77F), width: 1.5)),
    ),
  );

  static const CardTemplateTheme pastelJoy = CardTemplateTheme(
    key: 'pastelJoy',
    decoration: BoxDecoration(
      borderRadius: BorderRadius.all(Radius.circular(AppRadius.card)),
      gradient: LinearGradient(
        colors: [Color(0xFFA0C9FF), Color(0xFFFFDCC4), Color(0xFFFFB4AB)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
  );

  static const CardTemplateTheme neonGlow = CardTemplateTheme(
    key: 'neonGlow',
    decoration: BoxDecoration(
      borderRadius: BorderRadius.all(Radius.circular(AppRadius.card)),
      gradient: LinearGradient(
        colors: [Color(0xFF0095FB), Color(0xFFFC5C08)],
        begin: Alignment.topRight,
        end: Alignment.bottomLeft,
      ),
    ),
  );

  static const CardTemplateTheme minimal = CardTemplateTheme(
    key: 'minimal',
    decoration: BoxDecoration(
      borderRadius: BorderRadius.all(Radius.circular(AppRadius.card)),
      color: AppColors.darkCardSurface,
      border: Border.fromBorderSide(BorderSide(color: AppColors.borderMedium)),
    ),
  );

  static CardTemplateTheme fromString(String themeName) {
    if (themeName.contains('Sparkle') || themeName.contains('Brilhante')) {
      return birthdaySparkle;
    } else if (themeName.contains('Luxury') || themeName.contains('Escuro')) {
      return darkLuxury;
    } else if (themeName.contains('Pastel')) {
      return pastelJoy;
    } else if (themeName.contains('Neon')) {
      return neonGlow;
    }
    return minimal;
  }
}
