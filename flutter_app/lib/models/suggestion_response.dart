/// Where the suggestions came from, as reported by the API.
enum SuggestionSource {
  llm,
  cache,
  fallback,
  unknown;

  static SuggestionSource parse(Object? value) {
    return switch (value) {
      'llm' => SuggestionSource.llm,
      'cache' => SuggestionSource.cache,
      'fallback' => SuggestionSource.fallback,
      // A source we do not recognise is not an error: the suggestions are still
      // usable, and a new value should never break an installed app.
      _ => SuggestionSource.unknown,
    };
  }
}

class SuggestionResponse {
  const SuggestionResponse({required this.suggestions, required this.source});

  final List<String> suggestions;
  final SuggestionSource source;

  /// True when the model could not be reached and the API served its curated
  /// list instead. The UI says so quietly rather than treating it as a failure.
  bool get isDegraded => source == SuggestionSource.fallback;

  factory SuggestionResponse.fromJson(Map<String, Object?> json) {
    final rawSuggestions = json['suggestions'];

    return SuggestionResponse(
      suggestions: rawSuggestions is List
          ? rawSuggestions.whereType<String>().toList(growable: false)
          : const <String>[],
      source: SuggestionSource.parse(json['source']),
    );
  }
}
