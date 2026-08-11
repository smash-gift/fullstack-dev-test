import '../../domain/models/suggestion.dart';

/// Data Transfer Object representing suggestion payload returned by NestJS API.
class SuggestionModel {
  final String id;
  final String text;
  final String occasion;
  final String relationship;
  final String language;
  final String tone;
  final bool isFallback;

  const SuggestionModel({
    required this.id,
    required this.text,
    required this.occasion,
    required this.relationship,
    required this.language,
    this.tone = 'Warm',
    this.isFallback = false,
  });

  factory SuggestionModel.fromJson(Map<String, dynamic> json) {
    return SuggestionModel(
      id: json['id'] as String? ?? '',
      text: json['text'] as String? ?? '',
      occasion: json['occasion'] as String? ?? '',
      relationship: json['relationship'] as String? ?? '',
      language: json['language'] as String? ?? 'pt-BR',
      tone: json['tone'] as String? ?? 'Warm',
      isFallback: json['isFallback'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'occasion': occasion,
      'relationship': relationship,
      'language': language,
      'tone': tone,
      'isFallback': isFallback,
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
      tone: tone,
      isFallback: isFallback,
    );
  }
}
