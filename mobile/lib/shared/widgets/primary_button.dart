import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Botão de ação principal — 100% de largura, altura de 56px, com estado de loading.
/// Ver `docs/design/design-tokens.md`, seção "Botões".
class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        child: isLoading
            ? const SizedBox(
                height: 22,
                width: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.actionPrimaryText),
                ),
              )
            : Text(label),
      ),
    );
  }
}
