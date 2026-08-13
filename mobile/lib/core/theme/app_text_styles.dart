import 'package:flutter/widgets.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// Espelha `docs/design/design-tokens.md` (seção "Tipografia").
///
/// Montserrat é usada para títulos/botões/labels; Poppins para conteúdo de leitura — conforme o
/// documento de tokens.
class AppTextStyles {
  const AppTextStyles._();

  static TextStyle get display => GoogleFonts.montserrat(
        fontSize: 40,
        fontWeight: FontWeight.w700,
        height: 1.1,
        color: AppColors.textPrimary,
      );

  static TextStyle get heading => GoogleFonts.montserrat(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        height: 1.2,
        color: AppColors.textPrimary,
      );

  static TextStyle get title => GoogleFonts.montserrat(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        height: 1.2,
        color: AppColors.textPrimary,
      );

  static TextStyle get titleSmall => GoogleFonts.montserrat(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        height: 1.2,
        color: AppColors.textPrimary,
      );

  static TextStyle get button => GoogleFonts.montserrat(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        height: 1.2,
      );

  static TextStyle get label => GoogleFonts.montserrat(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        height: 1.4,
        color: AppColors.textSecondary,
      );

  static TextStyle get bodyLarge => GoogleFonts.poppins(
        fontSize: 18,
        fontWeight: FontWeight.w400,
        height: 1.5,
        color: AppColors.textPrimary,
      );

  static TextStyle get body => GoogleFonts.poppins(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: 1.5,
        color: AppColors.textPrimary,
      );

  static TextStyle get small => GoogleFonts.poppins(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.4,
        color: AppColors.textSecondary,
      );

  static TextStyle get caption => GoogleFonts.poppins(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        height: 1.4,
        color: AppColors.textMuted,
      );
}
