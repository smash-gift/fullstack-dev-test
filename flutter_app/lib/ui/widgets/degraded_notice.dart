import 'package:flutter/material.dart';

/// Shown when the backend answered from its curated catalog. The messages are
/// still usable, so this stays a low-key notice rather than an error.
class DegradedNotice extends StatelessWidget {
  const DegradedNotice({required this.reason, this.onRetry, super.key});

  final String? reason;
  final VoidCallback? onRetry;

  static const Map<String, String> _explanations = {
    'not_configured': 'the AI model is not configured on the server',
    'timeout': 'the AI model took too long to answer',
    'rate_limited': 'the AI model is rate limiting us right now',
    'upstream_error': 'the AI model is unavailable right now',
    'invalid_output': 'the AI model returned something we could not use',
    'unsafe_output': 'the AI model returned something we could not use',
    'budget_exhausted': 'the daily AI budget for this environment is spent',
  };

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final explanation = _explanations[reason] ?? 'the AI model is unavailable right now';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.tertiaryContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, size: 20, color: theme.colorScheme.onTertiaryContainer),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Showing curated messages because $explanation.',
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: theme.colorScheme.onTertiaryContainer),
            ),
          ),
          if (onRetry != null)
            TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
