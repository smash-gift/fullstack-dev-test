import '../../../../app/core/result/result.dart';
import '../../domain/dtos/suggest_request_dto.dart';
import '../../domain/entities/suggestions_result.dart';
import '../../domain/errors/suggestions_failure.dart';
import '../../domain/repositories/i_suggestions_repository.dart';
import '../datasources/i_suggestions_datasource.dart';

/// Turns transport exceptions into domain failures.
///
/// This is the layer's whole job, and it is the reason nothing above it ever
/// sees a thrown exception: from here up, a failure is a value.
class SuggestionsRepositoryImpl implements ISuggestionsRepository {
  const SuggestionsRepositoryImpl(this._datasource);

  final ISuggestionsDatasource _datasource;

  @override
  Future<Result<SuggestionsResult, SuggestionsFailure>> getSuggestions(
    SuggestRequestDto request,
  ) async {
    try {
      final result = await _datasource.fetchSuggestions(request);
      return Success(result);
    } on SuggestionsDatasourceException catch (exception) {
      return Failure(_map(exception));
    }
  }

  SuggestionsFailure _map(SuggestionsDatasourceException exception) {
    return switch (exception.kind) {
      DatasourceFailureKind.unreachable => const ConnectionFailure(),
      DatasourceFailureKind.timeout => const TimeoutFailure(),
      DatasourceFailureKind.invalidRequest => ValidationFailure(
        exception.fieldIssues,
      ),
      DatasourceFailureKind.rateLimited => RateLimitedFailure(
        exception.retryAfterSeconds,
      ),
      DatasourceFailureKind.server => const ServerFailure(),
      DatasourceFailureKind.unreadableResponse => const ServerFailure(),
    };
  }
}
