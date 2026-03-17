import 'package:flutter_app/features/suggestions/data/datasources/suggestions_remote_datasource.dart';
import 'package:flutter_app/features/suggestions/domain/repositories/suggestions_repository.dart';
import 'package:flutter_app/features/suggestions/domain/entities/suggestion.dart';
import 'package:flutter_app/core/errors/exceptions.dart';
import 'package:flutter_app/core/errors/failures.dart';

class SuggestionsRepositoryImpl implements SuggestionsRepository {
  final SuggestionsRemoteDatasource _datasource;

  const SuggestionsRepositoryImpl(this._datasource);

  @override
  Future<({SuggestionResult? data, Failure? failure})> getSuggestions({
    required String occasion,
    required String relationship,
  }) async {
    try {
      final model = await _datasource.getSuggestions(
        occasion: occasion,
        relationship: relationship,
      );

      return (
        data: SuggestionResult(
          suggestions: model.suggestions,
          isFromFallback: model.source == 'fallback',
        ),
        failure: null,
      );
    } on NetworkException catch (e) {
      return (data: null, failure: NetworkFailure(e.message));
    } on ServerException catch (e) {
      return (data: null, failure: ServerFailure(e.message));
    } catch (_) {
      return (data: null, failure: const UnexpectedFailure('Erro inesperado.'));
    }
  }
}
