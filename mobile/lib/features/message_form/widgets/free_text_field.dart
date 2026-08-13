import 'package:flutter/material.dart';

import '../constants/form_field_limits.dart';

/// Validador de texto livre para os campos de ocasião/relacionamento do formulário.
///
/// Extraído como função top-level (em vez de um método privado do widget) para poder ser testado
/// isoladamente, sem precisar montar um widget — ver `docs/contracts/api-contracts.md` para os
/// limites de tamanho (1 a 300 caracteres após trim).
String? validateFreeText(String? value) {
  final trimmed = (value ?? '').trim();
  if (trimmed.length < FormFieldLimits.minLength) {
    return 'Conte pra gente com suas palavras.';
  }
  if (trimmed.length > FormFieldLimits.maxLength) {
    return 'Use no máximo ${FormFieldLimits.maxLength} caracteres.';
  }
  return null;
}

/// Campo de texto livre usado tanto para ocasião quanto para relacionamento no formulário.
///
/// Ocasião e relacionamento deixaram de ser uma lista fixa (dropdown) e passaram a ser texto
/// livre — o usuário escreve com as próprias palavras (ex.: "aniversário de 15 anos da minha
/// afilhada") — ver decisão registrada na spec técnica do mobile.
///
/// Altura mínima de 56px e largura total vêm do `InputDecorationTheme` global (ver
/// `core/theme/app_theme.dart`), conforme `docs/design/design-tokens.md` (seção "Inputs").
class FreeTextField extends StatelessWidget {
  const FreeTextField({
    super.key,
    required this.label,
    required this.hint,
    required this.controller,
    required this.enabled,
  });

  final String label;
  final String hint;
  final TextEditingController controller;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      enabled: enabled,
      minLines: 1,
      maxLines: 3,
      maxLength: FormFieldLimits.maxLength,
      textCapitalization: TextCapitalization.sentences,
      decoration: InputDecoration(labelText: label, hintText: hint),
      validator: validateFreeText,
    );
  }
}
