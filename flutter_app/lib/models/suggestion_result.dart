enum SuggestionSource { llm, cache, fallback }

class SuggestionResult {
  final List<String> suggestions;
  final SuggestionSource source;

  const SuggestionResult({
    required this.suggestions,
    required this.source,
  });

  factory SuggestionResult.fromJson(Map<String, dynamic> json) {
    final rawSource = json['source'] as String? ?? 'fallback';
    final source = switch (rawSource) {
      'llm' => SuggestionSource.llm,
      'cache' => SuggestionSource.cache,
      _ => SuggestionSource.fallback,
    };

    final suggestions = (json['suggestions'] as List<dynamic>? ?? [])
        .map((e) => e.toString())
        .toList();

    return SuggestionResult(suggestions: suggestions, source: source);
  }
}
