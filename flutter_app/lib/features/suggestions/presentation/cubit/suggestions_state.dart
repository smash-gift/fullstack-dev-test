import 'package:flutter_app/features/suggestions/domain/entities/suggestion.dart';
import 'package:equatable/equatable.dart';

abstract class SuggestionsState extends Equatable {
  const SuggestionsState();

  @override
  List<Object?> get props => [];
}

class SuggestionsInitial extends SuggestionsState {
  const SuggestionsInitial();
}

class SuggestionsLoading extends SuggestionsState {
  const SuggestionsLoading();
}

class SuggestionsSuccess extends SuggestionsState {
  final SuggestionResult result;

  const SuggestionsSuccess(this.result);

  @override
  List<Object?> get props => [result];
}

class SuggestionsError extends SuggestionsState {
  final String message;

  const SuggestionsError(this.message);

  @override
  List<Object?> get props => [message];
}
