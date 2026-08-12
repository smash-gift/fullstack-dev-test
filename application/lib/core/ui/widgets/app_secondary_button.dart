import 'package:flutter/material.dart';
import '../../themes/app_theme.dart';

/// Secondary Outline / Surface Action Button.
class AppSecondaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  const AppSecondaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: AppHeights.buttonSecondary,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppColors.borderAccent, width: 1.5),
          shape: RoundedRectangleBorder(borderRadius: AppRadius.borderRadiusXl),
          backgroundColor: AppColors.darkSurfaceVariant.withValues(alpha: 0.5),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(icon, color: AppColors.secondary, size: AppIconSize.lg),
              const SizedBox(width: AppSpacing.sm),
            ],
            Text(label, style: AppTypography.buttonSecondary),
          ],
        ),
      ),
    );
  }
}
