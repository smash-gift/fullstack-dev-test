class SuggestionResponseModel {
  final List<String> suggestions;
  final String source;

  const SuggestionResponseModel({
    required this.suggestions,
    required this.source,
  });

  factory SuggestionResponseModel.fromJson(Map<String, dynamic> json) {
    return SuggestionResponseModel(
      suggestions: List<String>.from(json['suggestions'] as List),
      source: json['source'] as String,
    );
  }
}
