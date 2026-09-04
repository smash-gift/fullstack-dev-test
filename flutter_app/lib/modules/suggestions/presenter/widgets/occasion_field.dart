import 'package:flutter/material.dart';

import '../../../../app/core/widgets/labelled_field.dart';
import '../../../../config/internationalization/app_localizations.dart';
import '../../../../config/internationalization/localizations_key.dart';
import '../stores/suggestions_store.dart';

/// What the card is for. Free text, because the brief says the user can
/// "choose or type" and the backend accepts any string within its limits.
class OccasionField extends StatelessWidget {
  const OccasionField({required this.store, super.key});

  final SuggestionsStore store;

  @override
  Widget build(BuildContext context) {
    final issue = store.fieldIssues['occasion'];

    return LabelledField(
      label: tr(L.fieldOccasionLabel),
      child: TextField(
        controller: store.occasionController,
        enabled: !store.isLoading,
        textInputAction: TextInputAction.next,
        maxLength: 60,
        // The counter is noise on a field this short; the limit still applies.
        buildCounter: (_, {required currentLength, required isFocused, maxLength}) => null,
        onChanged: (_) => store.clearFieldIssue('occasion'),
        decoration: InputDecoration(
          hintText: tr(L.fieldOccasionHint),
          errorText: issue == null ? null : tr(L.fieldRequired),
        ),
      ),
    );
  }
}
