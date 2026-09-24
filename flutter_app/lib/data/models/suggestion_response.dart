/// Where the returned suggestions came from, as reported by the backend.
enum SuggestionSource {
  llm,
  fallback;

  static SuggestionSource fromString(String? value) {
    return value == 'llm' ? SuggestionSource.llm : SuggestionSource.fallback;
  }
}

/// Immutable model mirroring the backend response contract:
/// `{ "suggestions": string[], "source": "llm" | "fallback" }`.
class SuggestionResponse {
  const SuggestionResponse({
    required this.suggestions,
    required this.source,
  });

  factory SuggestionResponse.fromJson(Map<String, dynamic> json) {
    final rawList = (json['suggestions'] as List<dynamic>? ?? <dynamic>[])
        .map((dynamic e) => e.toString())
        .toList();
    return SuggestionResponse(
      suggestions: rawList,
      source: SuggestionSource.fromString(json['source'] as String?),
    );
  }

  final List<String> suggestions;
  final SuggestionSource source;
}
