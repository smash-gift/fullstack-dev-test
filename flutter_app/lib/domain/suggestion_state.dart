import 'package:gift_card_suggester/data/models/suggestion_response.dart';
import 'package:gift_card_suggester/domain/failure.dart';

/// The UI state for the suggester screen. A sealed hierarchy gives the widget
/// layer exhaustive, type-safe handling of every state (idle/loading/success/
/// error) with no room for an unhandled case.
sealed class SuggestionState {
  const SuggestionState();
}

/// Nothing requested yet.
class SuggestionIdle extends SuggestionState {
  const SuggestionIdle();
}

/// A request is in flight.
class SuggestionLoading extends SuggestionState {
  const SuggestionLoading();
}

/// Suggestions were returned. [source] tells whether they came from the LLM or
/// the backend's deterministic fallback.
class SuggestionSuccess extends SuggestionState {
  const SuggestionSuccess(this.suggestions, this.source);

  final List<String> suggestions;
  final SuggestionSource source;
}

/// The request failed with a typed, user-facing [failure].
class SuggestionError extends SuggestionState {
  const SuggestionError(this.failure);

  final Failure failure;
}
