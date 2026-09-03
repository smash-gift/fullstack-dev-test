import 'package:flutter/material.dart';

/// The palette, taken from smash.gifts' own production stylesheet.
///
/// The grounds are a near-neutral scale — paper and charcoal with only a
/// whisper of violet — so the same family carries both themes without being
/// inverted. The brand colour is spent in one place, the primary action, which
/// is what makes it read as a decision instead of decoration.
abstract final class AppColors {
  // Brand tokens, verbatim from their CSS variable names.
  /// `--roxo-logo`
  static const brandDeep = Color(0xFF29034F);

  /// `--roxo-claro-botão`
  static const brandViolet = Color(0xFF933DF9);

  /// `--rosa-cintilante-linda`
  static const brandPink = Color(0xFFFF005C);

  /// `--amarelo`
  static const brandAmber = Color(0xFFFEC261);

  // ---- Light ----
  static const lightBackground = Color(0xFFF7F6F9);
  static const lightSurface = Color(0xFFFFFFFF);
  static const lightSurfaceSunk = Color(0xFFF1F0F4);
  static const lightInk = Color(0xFF211F29);
  static const lightBody = Color(0xFF4C4858);
  static const lightMuted = Color(0xFF807C8C);
  static const lightLine = Color(0xFFE4E2E9);
  static const lightAction = Color(0xFF7C2FDB);
  static const lightOnAction = Color(0xFFFFFFFF);
  static const lightWarnBackground = Color(0xFFFDF6E8);
  static const lightWarnLine = Color(0xFFECD6A4);
  static const lightWarnInk = Color(0xFF6D5010);
  static const lightErrorBackground = Color(0xFFFDF0F3);
  static const lightErrorLine = Color(0xFFF0C3CE);
  static const lightErrorInk = Color(0xFFA3123C);

  // ---- Dark ----
  static const darkBackground = Color(0xFF131218);
  static const darkSurface = Color(0xFF1C1B23);
  static const darkSurfaceSunk = Color(0xFF17161D);
  static const darkInk = Color(0xFFF3F2F6);
  static const darkBody = Color(0xFFC7C4D0);
  static const darkMuted = Color(0xFF8E8A9B);
  static const darkLine = Color(0xFF302E3A);
  static const darkAction = Color(0xFFA56CF0);
  static const darkOnAction = Color(0xFF14131A);
  static const darkWarnBackground = Color(0xFF2E2716);
  static const darkWarnLine = Color(0xFF574A2A);
  static const darkWarnInk = Color(0xFFF0D093);
  static const darkErrorBackground = Color(0xFF2E161E);
  static const darkErrorLine = Color(0xFF5A2C38);
  static const darkErrorInk = Color(0xFFF4A8BB);
}

/// Colours the Material scheme has no slot for.
///
/// An extension rather than a global lookup: a widget reads them from its own
/// `Theme.of(context)`, so a test can build either theme and the widget follows
/// without knowing which one it got.
@immutable
class AppPalette extends ThemeExtension<AppPalette> {
  const AppPalette({
    required this.ink,
    required this.body,
    required this.muted,
    required this.line,
    required this.sunk,
    required this.warnBackground,
    required this.warnLine,
    required this.warnInk,
    required this.errorBackground,
    required this.errorLine,
    required this.errorInk,
  });

  final Color ink;
  final Color body;
  final Color muted;
  final Color line;
  final Color sunk;
  final Color warnBackground;
  final Color warnLine;
  final Color warnInk;
  final Color errorBackground;
  final Color errorLine;
  final Color errorInk;

  static const light = AppPalette(
    ink: AppColors.lightInk,
    body: AppColors.lightBody,
    muted: AppColors.lightMuted,
    line: AppColors.lightLine,
    sunk: AppColors.lightSurfaceSunk,
    warnBackground: AppColors.lightWarnBackground,
    warnLine: AppColors.lightWarnLine,
    warnInk: AppColors.lightWarnInk,
    errorBackground: AppColors.lightErrorBackground,
    errorLine: AppColors.lightErrorLine,
    errorInk: AppColors.lightErrorInk,
  );

  static const dark = AppPalette(
    ink: AppColors.darkInk,
    body: AppColors.darkBody,
    muted: AppColors.darkMuted,
    line: AppColors.darkLine,
    sunk: AppColors.darkSurfaceSunk,
    warnBackground: AppColors.darkWarnBackground,
    warnLine: AppColors.darkWarnLine,
    warnInk: AppColors.darkWarnInk,
    errorBackground: AppColors.darkErrorBackground,
    errorLine: AppColors.darkErrorLine,
    errorInk: AppColors.darkErrorInk,
  );

  @override
  AppPalette copyWith({
    Color? ink,
    Color? body,
    Color? muted,
    Color? line,
    Color? sunk,
    Color? warnBackground,
    Color? warnLine,
    Color? warnInk,
    Color? errorBackground,
    Color? errorLine,
    Color? errorInk,
  }) {
    return AppPalette(
      ink: ink ?? this.ink,
      body: body ?? this.body,
      muted: muted ?? this.muted,
      line: line ?? this.line,
      sunk: sunk ?? this.sunk,
      warnBackground: warnBackground ?? this.warnBackground,
      warnLine: warnLine ?? this.warnLine,
      warnInk: warnInk ?? this.warnInk,
      errorBackground: errorBackground ?? this.errorBackground,
      errorLine: errorLine ?? this.errorLine,
      errorInk: errorInk ?? this.errorInk,
    );
  }

  @override
  AppPalette lerp(ThemeExtension<AppPalette>? other, double t) {
    if (other is! AppPalette) return this;
    return AppPalette(
      ink: Color.lerp(ink, other.ink, t)!,
      body: Color.lerp(body, other.body, t)!,
      muted: Color.lerp(muted, other.muted, t)!,
      line: Color.lerp(line, other.line, t)!,
      sunk: Color.lerp(sunk, other.sunk, t)!,
      warnBackground: Color.lerp(warnBackground, other.warnBackground, t)!,
      warnLine: Color.lerp(warnLine, other.warnLine, t)!,
      warnInk: Color.lerp(warnInk, other.warnInk, t)!,
      errorBackground: Color.lerp(errorBackground, other.errorBackground, t)!,
      errorLine: Color.lerp(errorLine, other.errorLine, t)!,
      errorInk: Color.lerp(errorInk, other.errorInk, t)!,
    );
  }
}

/// Reads the palette without repeating the lookup in every widget.
extension AppPaletteAccess on BuildContext {
  AppPalette get palette => Theme.of(this).extension<AppPalette>()!;
}
