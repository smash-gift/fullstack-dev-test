import 'suggestion.dart';

/// Where a set of suggestions came from.
enum SuggestionSource { llm, fallback }

/// Why the backend degraded. Stable codes, safe to switch on — unlike the
/// messages, which may be reworded.
enum DegradationReason {
  llmTimeout,
  llmRateLimited,
  llmUnavailable,
  llmInvalidResponse,
  llmAuthError,
  unknown,
}

/// A successful answer, which may or may not have come from the model.
///
/// [degraded] is carried all the way to the widget on purpose. The backend
/// answers `200` when it serves curated fallbacks, and a client that dropped
/// this flag would turn an honest degradation into a silent one — the user
/// would believe a model wrote their card.
class SuggestionsResult {
  const SuggestionsResult({
    required this.suggestions,
    required this.source,
    required this.degraded,
    required this.model,
    this.reason,
  });

  final List<Suggestion> suggestions;
  final SuggestionSource source;
  final bool degraded;

  /// Null when no model was involved.
  final String? model;

  /// Present only when [degraded] is true.
  final DegradationReason? reason;
}
