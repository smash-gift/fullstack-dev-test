import 'package:gift_card_app/domain/models/suggestion.dart';

class SuggestionFixtures {
  static Suggestion sampleSuggestion({
    String id = 'sugg-123',
    String text = 'Que seu dia seja repleto de alegrias e realizações!',
    String occasion = 'Aniversário',
    String relationship = 'Amigo',
    String language = 'pt-BR',
  }) {
    return Suggestion(
      id: id,
      text: text,
      occasion: occasion,
      relationship: relationship,
      language: language,
    );
  }
}
