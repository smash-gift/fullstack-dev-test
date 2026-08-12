import 'package:flutter/material.dart';
import '../../themes/app_theme.dart';

/// Surface card container with dark styling and border glow.
class AppCardContainer extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final bool highlightBorder;

  const AppCardContainer({
    super.key,
    required this.child,
    this.padding = AppSpacing.paddingLg,
    this.highlightBorder = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.darkCardSurface,
        borderRadius: AppRadius.borderRadiusXxl,
        border: Border.all(
          color: highlightBorder ? AppColors.primary : AppColors.borderAccent,
          width: highlightBorder ? 1.5 : 1.0,
        ),
        boxShadow: highlightBorder
            ? [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  blurRadius: AppSpacing.md,
                  spreadRadius: 1,
                )
              ]
            : null,
      ),
      child: child,
    );
  }
}
