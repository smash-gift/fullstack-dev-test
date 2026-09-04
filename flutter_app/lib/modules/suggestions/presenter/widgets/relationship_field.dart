import 'package:flutter/material.dart';

import '../../../../app/core/widgets/labelled_field.dart';
import '../../../../config/internationalization/app_localizations.dart';
import '../../../../config/internationalization/localizations_key.dart';
import '../stores/suggestions_store.dart';

/// Who the card is for, relative to the sender.
class RelationshipField extends StatelessWidget {
  const RelationshipField({required this.store, super.key});

  final SuggestionsStore store;

  @override
  Widget build(BuildContext context) {
    final issue = store.fieldIssues['relationship'];

    return LabelledField(
      label: tr(L.fieldRelationshipLabel),
      child: TextField(
        controller: store.relationshipController,
        enabled: !store.isLoading,
        textInputAction: TextInputAction.done,
        maxLength: 60,
        buildCounter: (_, {required currentLength, required isFocused, maxLength}) => null,
        onChanged: (_) => store.clearFieldIssue('relationship'),
        decoration: InputDecoration(
          hintText: tr(L.fieldRelationshipHint),
          errorText: issue == null ? null : tr(L.fieldRequired),
        ),
      ),
    );
  }
}
