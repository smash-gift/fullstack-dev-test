import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// One suggestion, with a way to take it.
///
/// Copying is the whole point of the screen — the messages exist to be pasted
/// into a card — so the action sits on the card rather than in a menu.
class SuggestionCard extends StatelessWidget {
  const SuggestionCard({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: theme.colorScheme.primary.withValues(alpha: 0.4)),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(child: Text(message, style: theme.textTheme.bodyLarge)),
            IconButton(
              icon: const Icon(Icons.copy_outlined),
              tooltip: 'Copy',
              onPressed: () => _copy(context),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _copy(BuildContext context) async {
    await Clipboard.setData(ClipboardData(text: message));

    if (!context.mounted) {
      return;
    }

    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(const SnackBar(content: Text('Copied to clipboard')));
  }
}
