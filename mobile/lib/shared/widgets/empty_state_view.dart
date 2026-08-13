import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_text_styles.dart';
import 'primary_button.dart';

/// Estado vazio genérico, usado quando o backend responde sem nenhuma mensagem gerada.
class EmptyStateView extends StatelessWidget {
  const EmptyStateView({
    super.key,
    required this.title,
    required this.description,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String description;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.s8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.card_giftcard_outlined, size: 48, color: AppColors.textMuted),
            const SizedBox(height: AppSpacing.s4),
            Text(
              title,
              textAlign: TextAlign.center,
              style: AppTextStyles.titleSmall,
            ),
            const SizedBox(height: AppSpacing.s2),
            Text(
              description,
              textAlign: TextAlign.center,
              style: AppTextStyles.small,
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: AppSpacing.s6),
              PrimaryButton(label: actionLabel!, onPressed: onAction),
            ],
          ],
        ),
      ),
    );
  }
}
