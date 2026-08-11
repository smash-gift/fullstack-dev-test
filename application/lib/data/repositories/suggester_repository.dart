import '../../domain/models/suggestion.dart';
import '../../utils/result.dart';
import '../services/api_service.dart';

class SuggestionRequestParams {
  final String occasion;
  final String relationship;
  final String language;
  final String guestId;

  const SuggestionRequestParams({
    required this.occasion,
    required this.relationship,
    required this.language,
    required this.guestId,
  });
}

abstract class SuggesterRepository {
  Future<Result<List<Suggestion>>> getSuggestions(SuggestionRequestParams params);
}

class SuggesterRepositoryImpl implements SuggesterRepository {
  final ApiService _apiService;

  SuggesterRepositoryImpl({required ApiService apiService}) : _apiService = apiService;

  @override
  Future<Result<List<Suggestion>>> getSuggestions(SuggestionRequestParams params) async {
    try {
      final dtos = await _apiService.fetchSuggestions(
        occasion: params.occasion,
        relationship: params.relationship,
        language: params.language,
        guestId: params.guestId,
      );
      final domainModels = dtos.map((dto) => dto.toDomain()).toList();
      return Result.ok(domainModels);
    } on Exception catch (e) {
      return Result.error(e);
    } catch (e) {
      return Result.error(Exception(e.toString()));
    }
  }
}
