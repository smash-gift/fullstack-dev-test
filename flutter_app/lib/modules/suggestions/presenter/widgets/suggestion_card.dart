import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../app/core/theme/app_colors.dart';
import '../../../../app/core/theme/app_theme.dart';
import '../../../../config/internationalization/app_localizations.dart';
import '../../../../config/internationalization/localizations_key.dart';
import '../../domain/entities/suggestion.dart';

/// One suggestion, with the action the user actually wants.
///
/// ## Security: layer 4 of the prompt-injection defence
///
/// The text comes from a language model, and the model's output is influenced
/// by whatever someone typed into the form. It is rendered with [Text] and
/// nothing else — never `flutter_html`, never `flutter_markdown`, never a
/// linkifier.
///
/// The backend's output guard already rejects URLs, markup and contact details,
/// so this is the second line rather than the first. Its job is that anything
/// which ever escapes that guard is **displayed**, not **tappable** — the
/// difference between an ugly suggestion and a working phishing link.
class SuggestionCard extends StatelessWidget {
  const SuggestionCard({required this.suggestion, super.key});

  final Suggestion suggestion;

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(13, 13, 13, 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Plain Text. See the class doc before changing this line.
            Text(suggestion.text, style: theme.textTheme.bodyLarge),
            const SizedBox(height: AppTheme.gapSm),
            Divider(color: palette.line, height: 1),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  tr(L.resultsLength).withValue(
                    'count',
                    suggestion.text.characters.length.toString(),
                  ),
                  style: theme.textTheme.bodySmall?.copyWith(fontSize: 11),
                ),
                TextButton.icon(
                  onPressed: () => _copy(context),
                  icon: const Icon(Icons.copy_rounded, size: 14),
                  label: Text(tr(L.actionCopy)),
                  style: TextButton.styleFrom(
                    foregroundColor: theme.colorScheme.primary,
                    textStyle: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    minimumSize: const Size(0, 36),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// Copying is the point of the screen: the text's destination is another app
  /// or a physical card, and selecting by hand on a phone is miserable.
  Future<void> _copy(BuildContext context) async {
    final messenger = ScaffoldMessenger.of(context);
    await Clipboard.setData(ClipboardData(text: suggestion.text));

    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(tr(L.actionCopied)),
          duration: const Duration(seconds: 2),
        ),
      );
  }
}
