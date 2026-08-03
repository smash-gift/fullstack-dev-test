/// Immutable model mirroring the backend response contract:
/// `{ suggestions: string[], source: 'llm'|'fallback'|'cache', degraded: bool }`.
class SuggestionResult {
  const SuggestionResult({
    required this.suggestions,
    required this.source,
    required this.degraded,
  });

  final List<String> suggestions;
  final String source;
  final bool degraded;

  factory SuggestionResult.fromJson(Map<String, dynamic> json) {
    final rawList = (json['suggestions'] as List<dynamic>? ?? const []);
    return SuggestionResult(
      suggestions: rawList.map((e) => e.toString()).toList(growable: false),
      source: (json['source'] ?? 'unknown').toString(),
      degraded: json['degraded'] == true,
    );
  }
}
