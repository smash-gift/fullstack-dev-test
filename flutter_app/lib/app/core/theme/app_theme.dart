import 'package:flutter/material.dart';

import 'app_colors.dart';

/// One radius, one spacing scale, two themes built from the same tokens.
abstract final class AppTheme {
  /// 10px is the radius smash.gifts uses on its own buttons.
  static const radius = 10.0;
  static const cardRadius = 12.0;

  static const gapXs = 6.0;
  static const gapSm = 10.0;
  static const gapMd = 16.0;
  static const gapLg = 24.0;

  /// Wide enough for a form, narrow enough that a card message stays readable
  /// on a desktop browser instead of stretching across the window.
  static const contentMaxWidth = 460.0;

  static ThemeData light() => _build(
    brightness: Brightness.light,
    palette: AppPalette.light,
    background: AppColors.lightBackground,
    surface: AppColors.lightSurface,
    action: AppColors.lightAction,
    onAction: AppColors.lightOnAction,
  );

  static ThemeData dark() => _build(
    brightness: Brightness.dark,
    palette: AppPalette.dark,
    background: AppColors.darkBackground,
    surface: AppColors.darkSurface,
    action: AppColors.darkAction,
    onAction: AppColors.darkOnAction,
  );

  static ThemeData _build({
    required Brightness brightness,
    required AppPalette palette,
    required Color background,
    required Color surface,
    required Color action,
    required Color onAction,
  }) {
    final base = ThemeData(brightness: brightness, useMaterial3: true);

    return base.copyWith(
      scaffoldBackgroundColor: background,
      colorScheme: ColorScheme.fromSeed(
        seedColor: action,
        brightness: brightness,
      ).copyWith(
        primary: action,
        onPrimary: onAction,
        surface: surface,
        onSurface: palette.ink,
        error: palette.errorInk,
      ),
      extensions: <ThemeExtension<dynamic>>[palette],
      textTheme: _textTheme(base.textTheme, palette),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 13, vertical: 14),
        border: _border(palette.line),
        enabledBorder: _border(palette.line),
        focusedBorder: _border(action, width: 2),
        errorBorder: _border(palette.errorLine),
        focusedErrorBorder: _border(palette.errorInk, width: 2),
        hintStyle: TextStyle(color: palette.muted, fontSize: 14),
        errorStyle: TextStyle(color: palette.errorInk, fontSize: 12, height: 1.4),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: action,
          foregroundColor: onAction,
          disabledBackgroundColor: Color.alphaBlend(
            action.withValues(alpha: 0.4),
            palette.sunk,
          ),
          disabledForegroundColor: onAction.withValues(alpha: 0.75),
          minimumSize: const Size.fromHeight(50),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
        ),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(cardRadius),
          side: BorderSide(color: palette.line),
        ),
      ),
      dividerTheme: DividerThemeData(color: palette.line, space: 1, thickness: 1),
      dialogTheme: DialogThemeData(
        backgroundColor: surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(cardRadius)),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: palette.ink,
        contentTextStyle: TextStyle(color: background, fontSize: 13),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
      ),
    );
  }

  static OutlineInputBorder _border(Color color, {double width = 1}) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(radius),
      borderSide: BorderSide(color: color, width: width),
    );
  }

  static TextTheme _textTheme(TextTheme base, AppPalette palette) {
    return base.copyWith(
      headlineSmall: base.headlineSmall?.copyWith(
        color: palette.ink,
        fontSize: 22,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.4,
        height: 1.25,
      ),
      titleMedium: base.titleMedium?.copyWith(
        color: palette.ink,
        fontSize: 15,
        fontWeight: FontWeight.w700,
      ),
      bodyLarge: base.bodyLarge?.copyWith(color: palette.ink, fontSize: 15, height: 1.5),
      bodyMedium: base.bodyMedium?.copyWith(color: palette.body, fontSize: 14, height: 1.5),
      bodySmall: base.bodySmall?.copyWith(color: palette.muted, fontSize: 13, height: 1.45),
      labelLarge: base.labelLarge?.copyWith(color: palette.ink, fontSize: 14),
      // Field labels: small, spaced, uppercase at the call site.
      labelSmall: base.labelSmall?.copyWith(
        color: palette.muted,
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.8,
      ),
    );
  }
}
