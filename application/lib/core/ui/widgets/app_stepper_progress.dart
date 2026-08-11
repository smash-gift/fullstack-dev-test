import 'package:flutter/material.dart';
import '../../themes/app_theme.dart';

/// Visual 3-step Wizard Stepper.
class AppStepperProgress extends StatelessWidget {
  final int currentStep; // 0, 1, 2
  final String step1Label;
  final String step2Label;
  final String step3Label;

  const AppStepperProgress({
    super.key,
    required this.currentStep,
    required this.step1Label,
    required this.step2Label,
    required this.step3Label,
  });

  Widget _buildStepItem(int stepIndex, String label, BuildContext context) {
    final isActive = stepIndex == currentStep;
    final isDone = stepIndex < currentStep;

    final Color badgeBg = isDone
        ? AppColors.primary
        : isActive
            ? AppColors.secondary
            : AppColors.darkSurfaceVariant;
    final Color textColor = isActive || isDone ? AppColors.textWhite : AppColors.textSubtleDark;

    return Expanded(
      child: Row(
        children: [
          CircleAvatar(
            radius: AppSpacing.md,
            backgroundColor: badgeBg,
            child: isDone
                ? const Icon(Icons.check, size: AppIconSize.sm, color: AppColors.textWhite)
                : Text('${stepIndex + 1}', style: AppTypography.badge),
          ),
          const SizedBox(width: AppSpacing.xs),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                color: textColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
      color: AppColors.darkBackground,
      child: Row(
        children: [
          _buildStepItem(0, step1Label, context),
          const Icon(Icons.chevron_right, color: AppColors.borderMedium, size: AppIconSize.lg),
          _buildStepItem(1, step2Label, context),
          const Icon(Icons.chevron_right, color: AppColors.borderMedium, size: AppIconSize.lg),
          _buildStepItem(2, step3Label, context),
        ],
      ),
    );
  }
}
