import 'package:flutter/material.dart';

/// Centralized visual language, aligned with the Smash brand
/// (https://www.smash.gifts): a light, airy canvas with a soft purple glow,
/// deep-indigo headings, muted lavender-gray body text, and pill-shaped
/// controls in the brand purple. Kept in one place so both light and dark
/// themes stay in sync.
class AppTheme {
  const AppTheme._();

  /// Smash brand purple (`rgb(147, 61, 249)`).
  static const Color purple = Color(0xFF933DF9);

  /// A lighter purple used for subtle gradient accents.
  static const Color purpleLight = Color(0xFFB15CFF);

  /// Deep indigo used for headings (`rgb(62, 56, 91)`).
  static const Color ink = Color(0xFF3E385B);

  /// Muted lavender-gray used for secondary text (`rgb(129, 129, 172)`).
  static const Color muted = Color(0xFF8181AC);

  static ThemeData light() => _build(Brightness.light);
  static ThemeData dark() => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isLight = brightness == Brightness.light;
    final seeded = ColorScheme.fromSeed(
      seedColor: purple,
      brightness: brightness,
    );
    final scheme = isLight
        ? seeded.copyWith(
            primary: purple,
            onPrimary: Colors.white,
            surface: Colors.white,
            onSurface: ink,
            onSurfaceVariant: muted,
          )
        : seeded.copyWith(primary: purpleLight, onPrimary: Colors.white);

    final base = ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      brightness: brightness,
    );

    return base.copyWith(
      scaffoldBackgroundColor: Colors.transparent,
      textTheme: base.textTheme.copyWith(
        headlineMedium: base.textTheme.headlineMedium?.copyWith(
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
          color: isLight ? ink : null,
        ),
        titleMedium: base.textTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.w700,
          color: isLight ? ink : null,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isLight
            ? const Color(0xFFF4F1FB)
            : scheme.surfaceContainerHighest.withValues(alpha: 0.4),
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 15,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(
            color: scheme.outlineVariant.withValues(alpha: 0.5),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: purple, width: 1.6),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: purple,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(56),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          // Pill shape, matching the Smash CTA buttons.
          shape: const StadiumBorder(),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  /// Full-screen background: an airy white canvas with a soft purple glow in the
  /// top-right corner (light), or a deep purple-tinted gradient (dark).
  static Gradient backgroundGradient(Brightness brightness) {
    if (brightness == Brightness.dark) {
      return const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF1C1526), Color(0xFF241A33), Color(0xFF15111C)],
      );
    }
    return const RadialGradient(
      center: Alignment(0.9, -1.0),
      radius: 1.35,
      colors: [Color(0x33933DF9), Color(0xFFF7F4FF), Color(0xFFFFFFFF)],
      stops: [0.0, 0.42, 1.0],
    );
  }

  /// Brand gradient for the hero badge and small accents.
  static LinearGradient get brandGradient => const LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [purple, purpleLight],
  );
}
