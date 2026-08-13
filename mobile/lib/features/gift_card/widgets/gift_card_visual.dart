import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';

/// O "cartão" de presente com a mensagem escolhida — o momento central e mais afetivo do fluxo.
///
/// Usa um gradiente suave entre `color.brand.secondary` e `color.background.brandSoft` (ambos já
/// tokens existentes em `docs/design/design-tokens.md`; não é um valor novo, é uma composição dos
/// tokens existentes) e um selo decorativo simples (ícone de coração), sem depender de nenhum
/// asset de imagem.
class GiftCardVisual extends StatelessWidget {
  const GiftCardVisual({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.s8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.large),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.brandSecondary, AppColors.backgroundBrandSoft],
        ),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 40,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: AppColors.backgroundPrimary,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.favorite, color: AppColors.brandAccent, size: 20),
          ),
          const SizedBox(height: AppSpacing.s6),
          Text(
            message,
            textAlign: TextAlign.center,
            style: AppTextStyles.bodyLarge.copyWith(height: 1.6),
          ),
        ],
      ),
    );
  }
}
