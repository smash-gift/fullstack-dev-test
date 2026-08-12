import 'package:flutter/material.dart';
import '../../themes/app_theme.dart';

/// Top Application Header with Brand Logo, Guest Session badge, and Language Selector.
class AppHeaderBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final String subtitle;
  final String sessionLabel;
  final String currentLocale;
  final ValueChanged<String>? onLocaleChanged;

  const AppHeaderBar({
    super.key,
    required this.title,
    required this.subtitle,
    required this.sessionLabel,
    required this.currentLocale,
    this.onLocaleChanged,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: AppColors.darkBackground,
      elevation: 0,
      centerTitle: false,
      title: Row(
        children: [
          Container(
            padding: AppSpacing.paddingSm,
            decoration: BoxDecoration(
              gradient: AppColors.brandGradient,
              borderRadius: AppRadius.borderRadiusMd,
            ),
            child: const Icon(Icons.card_giftcard, color: AppColors.textWhite, size: AppIconSize.xl),
          ),
          const SizedBox(width: AppSpacing.md),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(title, style: AppTypography.titleMedium),
              Text(subtitle, style: AppTypography.badgeSubtle),
            ],
          ),
        ],
      ),
      actions: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xxs),
          decoration: BoxDecoration(
            color: AppColors.darkSurfaceVariant,
            borderRadius: AppRadius.borderRadiusPill,
            border: Border.all(color: AppColors.borderAccent),
          ),
          child: Row(
            children: [
              const Icon(Icons.person_outline, size: AppIconSize.sm, color: AppColors.secondary),
              const SizedBox(width: AppSpacing.xxs),
              Text(sessionLabel, style: AppTypography.badge),
            ],
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: currentLocale,
            dropdownColor: AppColors.darkCardSurface,
            icon: const Icon(Icons.language, color: AppColors.textMutedDark, size: AppIconSize.lg),
            items: const [
              DropdownMenuItem(value: 'pt', child: Text('PT 🇧🇷', style: AppTypography.caption)),
              DropdownMenuItem(value: 'en', child: Text('EN 🇺🇸', style: AppTypography.caption)),
            ],
            onChanged: (val) {
              if (val != null && onLocaleChanged != null) {
                onLocaleChanged!(val);
              }
            },
          ),
        ),
        const SizedBox(width: AppSpacing.md),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(AppHeights.appBarHeight);
}
