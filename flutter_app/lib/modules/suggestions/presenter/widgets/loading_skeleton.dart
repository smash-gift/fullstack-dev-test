import 'package:flutter/material.dart';

import '../../../../app/core/theme/app_colors.dart';
import '../../../../app/core/theme/app_theme.dart';
import '../../../../app/core/widgets/section_label.dart';
import '../../../../config/internationalization/app_localizations.dart';
import '../../../../config/internationalization/localizations_key.dart';

/// Placeholder cards while the request is in flight.
///
/// Three of them, the same shape and roughly the same size as the real thing,
/// so the layout does not jump when the answer arrives.
class LoadingSkeleton extends StatelessWidget {
  const LoadingSkeleton({this.count = 3, super.key});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionLabel(tr(L.resultsTitle)),
        const SizedBox(height: AppTheme.gapXs),
        for (var index = 0; index < count; index++) ...[
          const _SkeletonCard(),
          const SizedBox(height: AppTheme.gapSm),
        ],
      ],
    );
  }
}

/// Private to this file rather than to a page: it is one visual idea used in
/// one place, and splitting it further would be filing for its own sake.
class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard();

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(13),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _Bar(widthFactor: 1, color: palette.sunk),
            const SizedBox(height: AppTheme.gapSm),
            _Bar(widthFactor: 0.68, color: palette.sunk),
          ],
        ),
      ),
    );
  }
}

class _Bar extends StatelessWidget {
  const _Bar({required this.widthFactor, required this.color});

  final double widthFactor;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return FractionallySizedBox(
      widthFactor: widthFactor,
      alignment: Alignment.centerLeft,
      child: Container(
        height: 10,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(999),
        ),
      ),
    );
  }
}
