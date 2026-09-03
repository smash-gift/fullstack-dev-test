import 'package:flutter/material.dart';

import '../../../../app/core/theme/app_colors.dart';
import '../../../../app/core/widgets/labelled_field.dart';
import '../../../../config/internationalization/app_localizations.dart';
import '../../../../config/internationalization/localizations_key.dart';
import '../../domain/dtos/suggest_request_dto.dart';
import '../stores/suggestions_store.dart';

/// Picks the voice of the message.
///
/// The backend has accepted `tone` since phase 02; leaving it out of the screen
/// would have shipped a contract nobody could exercise.
class ToneSelector extends StatelessWidget {
  const ToneSelector({required this.store, super.key});

  final SuggestionsStore store;

  static const _labels = <SuggestionTone, String>{
    SuggestionTone.warm: L.toneWarm,
    SuggestionTone.funny: L.toneFunny,
    SuggestionTone.formal: L.toneFormal,
    SuggestionTone.heartfelt: L.toneHeartfelt,
  };

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final theme = Theme.of(context);

    return LabelledField(
      label: tr(L.fieldToneLabel),
      child: Wrap(
        spacing: 6,
        runSpacing: 6,
        children: [
          for (final entry in _labels.entries)
            ChoiceChip(
              label: Text(tr(entry.value)),
              selected: store.tone == entry.key,
              onSelected: store.isLoading ? null : (_) => store.setTone(entry.key),
              showCheckmark: false,
              labelStyle: TextStyle(
                fontSize: 13,
                fontWeight: store.tone == entry.key ? FontWeight.w600 : FontWeight.w400,
                color: store.tone == entry.key
                    ? theme.colorScheme.onPrimary
                    : palette.body,
              ),
              backgroundColor: theme.colorScheme.surface,
              selectedColor: theme.colorScheme.primary,
              side: BorderSide(
                color: store.tone == entry.key
                    ? theme.colorScheme.primary
                    : palette.line,
              ),
              shape: const StadiumBorder(),
            ),
        ],
      ),
    );
  }
}
