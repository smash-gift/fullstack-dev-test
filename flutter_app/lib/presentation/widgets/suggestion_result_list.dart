import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:gift_card_suggester/data/models/suggestion_response.dart';

/// Renders the list of returned suggestions. Each card can be copied to the
/// clipboard. When the messages came from the backend's deterministic
/// fallback, a subtle banner explains why the copy is more generic.
class SuggestionResultList extends StatelessWidget {
  const SuggestionResultList({
    required this.suggestions,
    required this.source,
    super.key,
  });

  final List<String> suggestions;
  final SuggestionSource source;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (source == SuggestionSource.fallback)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Semantics(
              label: 'Showing offline fallback suggestions',
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.secondaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.cloud_off_outlined,
                      size: 20,
                      color: theme.colorScheme.onSecondaryContainer,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'These are offline suggestions — our AI was '
                        'unavailable, so here are some safe classics.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSecondaryContainer,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        Padding(
          padding: const EdgeInsets.only(bottom: 8, left: 4),
          child: Text(
            'Suggestions',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        ...suggestions.asMap().entries.map(
              (entry) => _SuggestionCard(
                index: entry.key + 1,
                message: entry.value,
              ),
            ),
      ],
    );
  }
}

/// A single suggestion card with a copy-to-clipboard action. Shows a brief
/// "Copied" confirmation (icon + snackbar) after copying.
class _SuggestionCard extends StatefulWidget {
  const _SuggestionCard({required this.index, required this.message});

  final int index;
  final String message;

  @override
  State<_SuggestionCard> createState() => _SuggestionCardState();
}

class _SuggestionCardState extends State<_SuggestionCard> {
  bool _copied = false;

  Future<void> _copy() async {
    await Clipboard.setData(ClipboardData(text: widget.message));
    if (!mounted) return;

    setState(() => _copied = true);
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        const SnackBar(
          content: Text('Message copied to clipboard'),
          duration: Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
        ),
      );

    await Future<void>.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _copied = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      color: theme.colorScheme.surfaceContainerHighest,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 14,
              backgroundColor: theme.colorScheme.primary,
              child: Text(
                '${widget.index}',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: theme.colorScheme.onPrimary,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 4),
                child: SelectableText(
                  widget.message,
                  style: theme.textTheme.bodyLarge,
                ),
              ),
            ),
            const SizedBox(width: 4),
            IconButton(
              tooltip: _copied ? 'Copied' : 'Copy message',
              onPressed: _copy,
              icon: Icon(
                _copied ? Icons.check : Icons.copy_outlined,
                size: 20,
                color: _copied
                    ? theme.colorScheme.primary
                    : theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
