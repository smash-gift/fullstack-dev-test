import 'package:flutter/widgets.dart';

/// Espelha `docs/design/design-tokens.md` (seção "Cores").
///
/// Não adicione uma cor aqui sem que ela já exista nesse documento — ver skill
/// `design-consistency`. Se precisar de um valor novo, sinalize no handoff para o orquestrador
/// atualizar o documento antes de usá-lo no código.
class AppColors {
  const AppColors._();

  // Paleta base
  static const brandPrimary = Color(0xFFF4ACB7);
  static const brandSecondary = Color(0xFFFFCAD4);
  static const brandAccent = Color(0xFF9D8189);

  // Background
  static const backgroundPrimary = Color(0xFFFFFFFF);
  static const backgroundSecondary = Color(0xFFF8FAF9);
  static const backgroundSoft = Color(0xFFD8E2DC);
  static const backgroundBrandSoft = Color(0xFFFFF1F4);

  // Texto
  static const textPrimary = Color(0xFF332C2F);
  static const textSecondary = Color(0xFF6F6267);
  static const textMuted = Color(0xFF9D8189);
  static const textInverse = Color(0xFFFFFFFF);

  // Ações
  static const actionPrimary = Color(0xFF9D8189);
  static const actionPrimaryText = Color(0xFFFFFFFF);
  static const actionSecondary = Color(0xFFF4ACB7);
  static const actionSecondaryText = Color(0xFF4A3C41);
  static const actionSoft = Color(0xFFFFCAD4);

  // Bordas
  static const borderDefault = Color(0xFFE7DDDF);
  static const borderSoft = Color(0xFFF1E8EA);
  static const borderFocus = Color(0xFFF4ACB7);

  // Feedback — não definido ainda em design-tokens.md ("a definir"). Usamos valores acessíveis
  // e neutros até que o token oficial exista; ver handoff.
  static const feedbackError = Color(0xFFB3261E);
  static const feedbackErrorSoft = Color(0xFFFBEAEA);
}
