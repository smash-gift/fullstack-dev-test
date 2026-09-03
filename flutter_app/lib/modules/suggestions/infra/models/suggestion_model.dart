import '../../domain/entities/suggestion.dart';

/// Rule R3: the model extends the entity and knows how to read the wire
/// format. The domain keeps working with plain [Suggestion].
class SuggestionModel extends Suggestion {
  const SuggestionModel({required super.id, required super.text});

  factory SuggestionModel.fromJson(Map<String, Object?> json) {
    return SuggestionModel(
      id: json['id']?.toString() ?? '',
      text: json['text']?.toString() ?? '',
    );
  }
}
