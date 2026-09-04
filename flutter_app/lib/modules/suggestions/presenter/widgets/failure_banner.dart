import 'package:flutter/material.dart';

import '../../../../app/core/theme/app_colors.dart';
import '../../../../app/core/theme/app_theme.dart';
import '../../../../config/internationalization/app_localizations.dart';
import '../../../../config/internationalization/localizations_key.dart';
import '../../domain/errors/suggestions_failure.dart';

/// Explains a failure in terms of what went wrong and what to do next.
///
/// Every branch names a cause and an action. "Something went wrong" with no
/// next step leaves the user with nothing to try, which is the failure mode
/// this screen exists to avoid.
class FailureBanner extends StatelessWidget {
  const FailureBanner({
    required this.failure,
    required this.baseUrl,
    required this.onRetry,
    super.key,
  });

  final SuggestionsFailure failure;
  final String baseUrl;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final theme = Theme.of(context);
    final (title, body) = _copy();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
      decoration: BoxDecoration(
        color: palette.errorBackground,
        border: Border.all(color: palette.errorLine),
        borderRadius: BorderRadius.circular(AppTheme.radius),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.error_outline_rounded, size: 17, color: palette.errorInk),
          const SizedBox(width: AppTheme.gapSm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: palette.errorInk,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  body,
                  style: theme.textTheme.bodyMedium?.copyWith(color: palette.errorInk),
                ),
                const SizedBox(height: AppTheme.gapXs),
                OutlinedButton(
                  onPressed: onRetry,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: palette.errorInk,
                    side: BorderSide(color: palette.errorInk.withValues(alpha: 0.5)),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    minimumSize: const Size(0, 34),
                    textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Text(tr(L.actionTryAgain)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  (String, String) _copy() {
    return switch (failure) {
      ConnectionFailure() => (
        tr(L.errorConnectionTitle),
        tr(L.errorConnectionBody).withValue('url', baseUrl),
      ),
      TimeoutFailure() => (tr(L.errorTimeoutTitle), tr(L.errorTimeoutBody)),
      RateLimitedFailure(:final retryAfterSeconds) => (
        tr(L.errorRateLimitedTitle),
        tr(L.errorRateLimitedBody).withValue('seconds', retryAfterSeconds.toString()),
      ),
      // Reachable only if the page ever passes one in; validation problems are
      // shown on the fields. Kept exhaustive so a new failure type cannot be
      // added without deciding what the user is told.
      ValidationFailure() => (tr(L.errorValidationTitle), ''),
      ServerFailure() => (tr(L.errorServerTitle), tr(L.errorServerBody)),
    };
  }
}
