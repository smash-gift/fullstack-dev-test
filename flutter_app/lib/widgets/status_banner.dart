import 'package:flutter/material.dart';

/// A single line of explanation above the results.
///
/// Used for two different situations that must not look the same: a request
/// that failed, and a request that succeeded with the API's curated messages
/// because the model was unreachable. The second is not an error, and colouring
/// it like one would tell the user something untrue.
class StatusBanner extends StatelessWidget {
  const StatusBanner({
    super.key,
    required this.message,
    required this.icon,
    required this.background,
    required this.foreground,
    this.onRetry,
  });

  const StatusBanner.error({
    super.key,
    required this.message,
    this.onRetry,
  }) : icon = Icons.error_outline,
       background = const Color(0xFFFDECEA),
       foreground = const Color(0xFFB3261E);

  const StatusBanner.notice({super.key, required this.message})
    : icon = Icons.info_outline,
      background = const Color(0xFFFFF4E5),
      foreground = const Color(0xFF8A5300),
      onRetry = null;

  final String message;
  final IconData icon;
  final Color background;
  final Color foreground;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: foreground, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(message, style: TextStyle(color: foreground)),
          ),
          if (onRetry != null)
            TextButton(
              onPressed: onRetry,
              style: TextButton.styleFrom(foregroundColor: foreground),
              child: const Text('Try again'),
            ),
        ],
      ),
    );
  }
}
