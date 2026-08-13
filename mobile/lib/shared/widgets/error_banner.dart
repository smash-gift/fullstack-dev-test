import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_text_styles.dart';

/// Banner inline de erro, usado quando uma chamada ao backend falha.
///
/// `color.feedback.error` ainda não existe em `docs/design/design-tokens.md` ("a definir") — usa
/// um vermelho acessível provisório (`AppColors.feedbackError`/`feedbackErrorSoft`), sinalizado
/// no handoff como proposta de token.
class ErrorBanner extends StatelessWidget {
  const ErrorBanner({super.key, required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.s4),
      decoration: BoxDecoration(
        color: AppColors.feedbackErrorSoft,
        borderRadius: BorderRadius.circular(AppRadius.medium),
        border: Border.all(color: AppColors.feedbackError.withOpacity(0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline, color: AppColors.feedbackError),
          const SizedBox(width: AppSpacing.s3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  message,
                  style: AppTextStyles.small.copyWith(color: AppColors.feedbackError),
                ),
                if (onRetry != null) ...[
                  const SizedBox(height: AppSpacing.s2),
                  GestureDetector(
                    onTap: onRetry,
                    child: Text(
                      'Tentar novamente',
                      style: AppTextStyles.label.copyWith(
                        color: AppColors.feedbackError,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
