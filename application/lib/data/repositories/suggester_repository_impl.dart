import 'package:flutter/foundation.dart';
import '../../domain/models/suggestion.dart';
import '../../utils/result.dart';
import '../services/api_service.dart';
import 'suggester_repository.dart';

/// Implementation of [SuggesterRepository] that fetches suggestions from [ApiService].
/// In debug mode ([kDebugMode]), it returns mock fake suggestions for testing and development.
class SuggesterRepositoryImpl implements SuggesterRepository {
  final ApiService _apiService;
  final bool enableDebugFakes;

  SuggesterRepositoryImpl({
    required ApiService apiService,
    bool? enableDebugFakes,
  })  : _apiService = apiService,
        enableDebugFakes = enableDebugFakes ?? kDebugMode;

  @override
  Future<Result<List<Suggestion>>> getSuggestions(
      SuggestionRequestParams params) async {
    if (enableDebugFakes) {
      return Result.ok(_getDebugFakeSuggestions(params));
    }

    try {
      final suggestions = await _apiService.fetchSuggestions(
        occasion: params.occasion,
        relationship: params.relationship,
        language: params.language,
        guestId: params.guestId,
      );
      final domainModels =
          suggestions.map((suggestion) => suggestion.toDomain()).toList();
      return Result.ok(domainModels);
    } on Exception catch (e) {
      return Result.error(e);
    } catch (e) {
      return Result.error(Exception(e.toString()));
    }
  }

  /// Generates dynamic fake suggestions tailored to the requested occasion and relationship in debug mode.
  List<Suggestion> _getDebugFakeSuggestions(SuggestionRequestParams params) {
    final occasion =
        params.occasion.isNotEmpty ? params.occasion : 'Aniversário';
    final relationship =
        params.relationship.isNotEmpty ? params.relationship : 'Amigo(a)';

    return [
      Suggestion(
        id: 'debug-fake-1',
        text:
            'Desejo a você um dia repleto de alegrias e celebrações inesquecíveis! Parabéns nesta ocasião de $occasion.',
        occasion: occasion,
        relationship: relationship,
        language: params.language,
        tone: 'Carinhoso',
        isFallback: false,
      ),
      Suggestion(
        id: 'debug-fake-2',
        text:
            'Que este momento especial traga sorrisos e memórias incríveis para um(a) grande $relationship!',
        occasion: occasion,
        relationship: relationship,
        language: params.language,
        tone: 'Alegre',
        isFallback: false,
      ),
      Suggestion(
        id: 'debug-fake-3',
        text:
            'Um brinde a você nesta data especial de $occasion! Que todos os seus desejos se realizem.',
        occasion: occasion,
        relationship: relationship,
        language: params.language,
        tone: 'Inspirador',
        isFallback: false,
      ),
    ];
  }
}
