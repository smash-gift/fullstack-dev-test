import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../data/models/suggestion.dart';

class SuggestionCard extends StatelessWidget {
  const SuggestionCard({required this.index, required this.suggestion, super.key});

  final int index;
  final Suggestion suggestion;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: theme.colorScheme.outlineVariant),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          Clipboard.setData(ClipboardData(text: suggestion.text));
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(const SnackBar(content: Text('Message copied')));
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 14,
                backgroundColor: theme.colorScheme.secondaryContainer,
                child: Text('$index', style: theme.textTheme.labelMedium),
              ),
              const SizedBox(width: 12),
              Expanded(child: Text(suggestion.text, style: theme.textTheme.bodyLarge)),
              const SizedBox(width: 8),
              Icon(Icons.copy_rounded, size: 18, color: theme.colorScheme.outline),
            ],
          ),
        ),
      ),
    );
  }
}
