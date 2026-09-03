import 'package:flutter/material.dart';

import '../../../../app/core/theme/app_colors.dart';
import '../../../../app/core/theme/app_theme.dart';
import '../../../../config/internationalization/app_localizations.dart';
import '../../../../config/internationalization/localizations_key.dart';

/// Says the model was unavailable, without calling it a failure.
///
/// Amber, not red, and deliberately so: the request succeeded and the messages
/// are usable. Painting a perfectly good result as an error would teach the
/// user to distrust it.
class DegradedBanner extends StatelessWidget {
  const DegradedBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
      decoration: BoxDecoration(
        color: palette.warnBackground,
        border: Border.all(color: palette.warnLine),
        borderRadius: BorderRadius.circular(AppTheme.radius),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline_rounded, size: 17, color: palette.warnInk),
          const SizedBox(width: AppTheme.gapSm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tr(L.degradedTitle),
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: palette.warnInk,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  tr(L.degradedBody),
                  style: theme.textTheme.bodyMedium?.copyWith(color: palette.warnInk),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
