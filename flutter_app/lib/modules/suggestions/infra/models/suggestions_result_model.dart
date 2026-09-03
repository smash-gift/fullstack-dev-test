import '../../domain/entities/suggestions_result.dart';
import 'suggestion_model.dart';

/// Reads the backend's success envelope: `{ data: {...}, meta: {...} }`.
///
/// Written defensively on purpose. This is the boundary where a response we do
/// not control becomes a typed value, and a field arriving in an unexpected
/// shape must produce a readable failure rather than a crash inside a widget.
class SuggestionsResultModel extends SuggestionsResult {
  const SuggestionsResultModel({
    required super.suggestions,
    required super.source,
    required super.degraded,
    required super.model,
    super.reason,
  });

  /// Throws [FormatException] when the payload is not the documented shape.
  /// The datasource turns that into a `ServerFailure`.
  factory SuggestionsResultModel.fromJson(Map<String, Object?> json) {
    final data = json['data'];
    final meta = json['meta'];
    if (data is! Map<String, Object?>) {
      throw const FormatException('response has no data object');
    }

    final rawSuggestions = data['suggestions'];
    if (rawSuggestions is! List || rawSuggestions.isEmpty) {
      throw const FormatException('response carries no suggestions');
    }

    final suggestions = <SuggestionModel>[];
    for (final entry in rawSuggestions) {
      if (entry is! Map<String, Object?>) {
        throw const FormatException('a suggestion is not an object');
      }
      final suggestion = SuggestionModel.fromJson(entry);
      if (suggestion.text.trim().isEmpty) {
        throw const FormatException('a suggestion has no text');
      }
      suggestions.add(suggestion);
    }

    final degraded = data['degraded'] == true;

    return SuggestionsResultModel(
      suggestions: suggestions,
      source: data['source'] == 'fallback'
          ? SuggestionSource.fallback
          : SuggestionSource.llm,
      degraded: degraded,
      model: data['model']?.toString(),
      reason: degraded
          ? _reasonFrom(meta is Map<String, Object?> ? meta['reason'] : null)
          : null,
    );
  }

  /// An unrecognised code becomes [DegradationReason.unknown] rather than an
  /// error: the backend may add a reason before this app is rebuilt, and the
  /// user still deserves to be told the answer was degraded.
  static DegradationReason _reasonFrom(Object? raw) {
    return switch (raw) {
      'llm_timeout' => DegradationReason.llmTimeout,
      'llm_rate_limited' => DegradationReason.llmRateLimited,
      'llm_unavailable' => DegradationReason.llmUnavailable,
      'llm_invalid_response' => DegradationReason.llmInvalidResponse,
      'llm_auth_error' => DegradationReason.llmAuthError,
      _ => DegradationReason.unknown,
    };
  }
}
