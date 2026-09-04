import 'package:flutter/material.dart';

import '../../../../config/internationalization/app_localizations.dart';
import '../../../../config/internationalization/localizations_key.dart';
import '../stores/suggestions_store.dart';

/// The primary action, and the only place the brand colour is spent.
class GenerateButton extends StatelessWidget {
  const GenerateButton({required this.store, required this.onPressed, super.key});

  final SuggestionsStore store;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    if (store.isLoading) {
      return FilledButton(
        onPressed: null,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 15,
              height: 15,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Theme.of(context).colorScheme.onPrimary,
              ),
            ),
            const SizedBox(width: 9),
            Text(tr(L.actionWriting)),
          ],
        ),
      );
    }

    return FilledButton(
      onPressed: onPressed,
      child: Text(
        store.hasSuggestions ? tr(L.actionGenerateAgain) : tr(L.actionGenerate),
      ),
    );
  }
}
