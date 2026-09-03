import 'package:flutter/material.dart';

import '../../../../app/core/theme/app_colors.dart';
import '../../../../app/core/theme/app_theme.dart';
import '../../../../app/core/widgets/section_label.dart';
import '../../../../config/internationalization/app_localizations.dart';
import '../../../../config/internationalization/localizations_key.dart';
import '../../domain/entities/suggestion.dart';
import 'suggestion_card.dart';

/// The results, with a header that says how many there are.
class SuggestionsList extends StatelessWidget {
  const SuggestionsList({required this.suggestions, super.key});

  final List<Suggestion> suggestions;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            SectionLabel(tr(L.resultsTitle)),
            Text(
              tr(L.resultsCount).withValue('count', suggestions.length.toString()),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontSize: 11,
                color: context.palette.muted,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppTheme.gapXs),
        for (final suggestion in suggestions) ...[
          SuggestionCard(suggestion: suggestion),
          const SizedBox(height: AppTheme.gapSm),
        ],
      ],
    );
  }
}
