import '../../../../app/core/result/result.dart';
import '../dtos/suggest_request_dto.dart';
import '../entities/suggestions_result.dart';
import '../errors/suggestions_failure.dart';
import '../repositories/i_suggestions_repository.dart';

/// Asks for suggestions, and refuses to bother the server with a request that
/// cannot succeed.
///
/// The local check mirrors the backend's own rule rather than replacing it: the
/// server still validates, because a client is not a security boundary. What
/// this buys is a user who gets told immediately instead of after a round trip.
class GetSuggestionsUseCase {
  const GetSuggestionsUseCase(this._repository);

  final ISuggestionsRepository _repository;

  static const minFieldLength = 2;
  static const maxFieldLength = 60;

  Future<Result<SuggestionsResult, SuggestionsFailure>> call(
    SuggestRequestDto request,
  ) async {
    final issues = _localIssues(request);
    if (issues.isNotEmpty) {
      return Failure(ValidationFailure(issues));
    }

    return _repository.getSuggestions(request);
  }

  Map<String, String> _localIssues(SuggestRequestDto request) {
    return {
      for (final entry in {
        'occasion': request.occasion,
        'relationship': request.relationship,
      }.entries)
        if (entry.value.trim().length < minFieldLength ||
            entry.value.trim().length > maxFieldLength)
          entry.key: 'length',
    };
  }
}
