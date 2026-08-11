import 'package:flutter/material.dart';
import '../../themes/app_theme.dart';

/// Primary Gradient Action Button matching Stitch design.
class AppPrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;

  const AppPrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: AppHeights.buttonPrimary,
      decoration: BoxDecoration(
        gradient: onPressed == null || isLoading ? null : AppColors.brandGradient,
        color: onPressed == null || isLoading ? AppColors.darkSurfaceVariant : null,
        borderRadius: AppRadius.borderRadiusXl,
        boxShadow: onPressed != null && !isLoading
            ? [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.3),
                  blurRadius: AppSpacing.md,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: AppRadius.borderRadiusXl),
        ),
        child: isLoading
            ? const SizedBox(
                height: 22,
                width: 22,
                child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.textWhite),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, color: AppColors.textWhite, size: AppIconSize.xl),
                    const SizedBox(width: AppSpacing.sm),
                  ],
                  Text(label, style: AppTypography.buttonPrimary),
                ],
              ),
      ),
    );
  }
}
