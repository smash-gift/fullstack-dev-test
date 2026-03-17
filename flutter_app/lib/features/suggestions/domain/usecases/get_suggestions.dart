import 'package:flutter_app/features/suggestions/domain/repositories/suggestions_repository.dart';
import 'package:flutter_app/features/suggestions/domain/entities/suggestion.dart';
import 'package:flutter_app/core/errors/failures.dart';

class GetSuggestions {
  final SuggestionsRepository _repository;

  const GetSuggestions(this._repository);

  Future<({SuggestionResult? data, Failure? failure})> call({
    required String occasion,
    required String relationship,
  }) {
    return _repository.getSuggestions(
      occasion: occasion,
      relationship: relationship,
    );
  }
}
