import 'package:flutter/material.dart';

import '../../../../app/core/theme/app_colors.dart';
import '../../../../app/core/theme/app_theme.dart';
import '../../../../config/internationalization/app_localizations.dart';
import '../../../../config/internationalization/localizations_key.dart';

/// Title, brand mark, and the way into the backend address.
class AppHeader extends StatelessWidget {
  const AppHeader({required this.onOpenSettings, super.key});

  final VoidCallback onOpenSettings;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(7),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [AppColors.brandViolet, AppColors.brandPink],
            ),
          ),
        ),
        const SizedBox(width: AppTheme.gapSm),
        Expanded(
          child: Text(
            tr(L.appTitle),
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
        IconButton(
          onPressed: onOpenSettings,
          icon: const Icon(Icons.tune_rounded, size: 20),
          color: context.palette.muted,
          tooltip: tr(L.actionSettings),
          visualDensity: VisualDensity.compact,
        ),
      ],
    );
  }
}
