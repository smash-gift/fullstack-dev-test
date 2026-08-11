import 'package:gift_card_app/data/repositories/suggester_repository.dart';
import 'package:gift_card_app/domain/models/suggestion.dart';
import 'package:gift_card_app/utils/result.dart';

class FakeSuggesterRepository implements SuggesterRepository {
  List<Suggestion> mockSuggestions = [
    const Suggestion(
      id: 'mock-1',
      text: 'Parabéns pelo seu dia especial!',
      occasion: 'Aniversário',
      relationship: 'Amigo',
      language: 'pt-BR',
    ),
  ];

  bool shouldReturnError = false;
  Exception errorToReturn = Exception('Mock Repository Failure');

  @override
  Future<Result<List<Suggestion>>> getSuggestions(SuggestionRequestParams params) async {
    if (shouldReturnError) {
      return Result.error(errorToReturn);
    }
    return Result.ok(mockSuggestions);
  }
}
