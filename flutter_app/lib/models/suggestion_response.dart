enum SuggestionSource { llm, fallback }

class SuggestionResponse {
  const SuggestionResponse({
    required this.suggestions,
    required this.source,
    required this.isFallback,
  });

  final List<String> suggestions;
  final SuggestionSource source;
  final bool isFallback;

  factory SuggestionResponse.fromJson(Map<String, dynamic> json) {
    final rawSuggestions = json['suggestions'];
    if (rawSuggestions is! List) {
      throw const FormatException('Invalid suggestions response.');
    }

    final suggestions =
        rawSuggestions.whereType<String>().toList(growable: false);
    if (suggestions.isEmpty) {
      throw const FormatException('The response did not contain suggestions.');
    }

    return SuggestionResponse(
      suggestions: suggestions,
      source: json['source'] == 'llm'
          ? SuggestionSource.llm
          : SuggestionSource.fallback,
      isFallback: json['fallback'] == true,
    );
  }
}
