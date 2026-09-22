import 'suggestion.dart';

enum SuggestionSource { llm, cache, fallback, unknown }

class SuggestionResult {
  const SuggestionResult({
    required this.suggestions,
    required this.source,
    this.degradedReason,
  });

  final List<Suggestion> suggestions;
  final SuggestionSource source;
  final String? degradedReason;

  /// True when the backend could not reach the model and answered from its
  /// curated catalog. The messages are still usable, so this is a notice and
  /// not an error state.
  bool get isDegraded => source == SuggestionSource.fallback;

  factory SuggestionResult.fromJson(Map<String, dynamic> json) {
    final rawSuggestions = json['suggestions'] as List<dynamic>? ?? const [];

    return SuggestionResult(
      suggestions: rawSuggestions
          .whereType<Map<String, dynamic>>()
          .map(Suggestion.fromJson)
          .where((suggestion) => suggestion.text.isNotEmpty)
          .toList(growable: false),
      source: switch (json['source']) {
        'llm' => SuggestionSource.llm,
        'cache' => SuggestionSource.cache,
        'fallback' => SuggestionSource.fallback,
        _ => SuggestionSource.unknown,
      },
      degradedReason: json['degradedReason'] as String?,
    );
  }
}
