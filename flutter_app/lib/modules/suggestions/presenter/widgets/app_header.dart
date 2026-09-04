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
        // The real launcher icon, not a stand-in for it. This was a gradient
        // square from before the app had an icon, which left the header
        // showing one brand and the home screen another.
        ClipRRect(
          borderRadius: BorderRadius.circular(7),
          child: Image.asset(
            'assets/brand/app_icon.png',
            width: 24,
            height: 24,
            // The mark carries meaning the title already states, so it is
            // decorative to a screen reader rather than a second reading of
            // the same name.
            excludeFromSemantics: true,
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
