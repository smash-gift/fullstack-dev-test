import '../../../../app/core/result/result.dart';
import '../dtos/suggest_request_dto.dart';
import '../entities/suggestions_result.dart';
import '../errors/suggestions_failure.dart';

/// The contract the domain depends on. Implemented in `infra`, so nothing in
/// this folder knows that HTTP, or a backend, exists at all.
abstract interface class ISuggestionsRepository {
  Future<Result<SuggestionsResult, SuggestionsFailure>> getSuggestions(
    SuggestRequestDto request,
  );
}
