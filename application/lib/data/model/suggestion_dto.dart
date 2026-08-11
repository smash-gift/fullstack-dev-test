import '../../domain/models/suggestion.dart';

/// Data Transfer Object representing suggestion payload returned by NestJS API.
class SuggestionDto {
  final String id;
  final String text;
  final String occasion;
  final String relationship;
  final String language;

  const SuggestionDto({
    required this.id,
    required this.text,
    required this.occasion,
    required this.relationship,
    required this.language,
  });

  factory SuggestionDto.fromJson(Map<String, dynamic> json) {
    return SuggestionDto(
      id: json['id'] as String? ?? '',
      text: json['text'] as String? ?? '',
      occasion: json['occasion'] as String? ?? '',
      relationship: json['relationship'] as String? ?? '',
      language: json['language'] as String? ?? 'pt-BR',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'occasion': occasion,
      'relationship': relationship,
      'language': language,
    };
  }

  /// Maps DTO to Domain Model entity.
  Suggestion toDomain() {
    return Suggestion(
      id: id,
      text: text,
      occasion: occasion,
      relationship: relationship,
      language: language,
    );
  }
}
