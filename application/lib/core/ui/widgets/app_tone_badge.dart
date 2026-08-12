import 'package:flutter/material.dart';
import '../../themes/app_theme.dart';

/// Tone tag pill badge.
class AppToneBadge extends StatelessWidget {
  final String toneLabel;

  const AppToneBadge({super.key, required this.toneLabel});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xxs),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.15),
        borderRadius: AppRadius.borderRadiusLg,
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.auto_awesome, size: AppIconSize.xs, color: AppColors.secondary),
          const SizedBox(width: AppSpacing.xxs),
          Text(toneLabel, style: AppTypography.badge),
        ],
      ),
    );
  }
}
