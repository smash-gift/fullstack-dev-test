import 'package:flutter/material.dart';
import '../../themes/app_theme.dart';

/// Generic Selectable Chip Grid (for occasions, tones, relationships).
class AppChipSelect<T> extends StatelessWidget {
  final List<T> options;
  final T selectedOption;
  final ValueChanged<T> onSelected;
  final String Function(T item) labelBuilder;
  final IconData Function(T item)? iconBuilder;

  const AppChipSelect({
    super.key,
    required this.options,
    required this.selectedOption,
    required this.onSelected,
    required this.labelBuilder,
    this.iconBuilder,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      children: options.map((item) {
        final isSelected = item == selectedOption;
        return ChoiceChip(
          checkmarkColor: isSelected ? AppColors.textWhite : AppColors.textPrimaryDark,
          label: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (iconBuilder != null) ...[
                Icon(
                  iconBuilder!(item),
                  size: AppIconSize.md,
                  color: isSelected ? AppColors.textWhite : AppColors.secondary,
                ),
                const SizedBox(width: AppSpacing.xs),
              ],
              Text(
                labelBuilder(item),
                style: TextStyle(
                  color: isSelected ? AppColors.textWhite : AppColors.textPrimaryDark,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          selected: isSelected,
          selectedColor: AppColors.primary,
          backgroundColor: AppColors.darkSurfaceVariant,
          shape: RoundedRectangleBorder(
            borderRadius: AppRadius.borderRadiusCard,
            side: BorderSide(
              color: isSelected ? AppColors.primary : AppColors.borderSubtle,
            ),
          ),
          onSelected: (_) => onSelected(item),
        );
      }).toList(),
    );
  }
}
