import 'package:flutter_app/features/suggestions/domain/entities/suggestion.dart';
import 'package:flutter_app/core/errors/failures.dart';

abstract interface class SuggestionsRepository {
  Future<({SuggestionResult? data, Failure? failure})> getSuggestions({
    required String occasion,
    required String relationship,
  });
}
