import 'package:flutter_app/features/suggestions/presentation/cubit/suggestions_state.dart';
import 'package:flutter_app/features/suggestions/domain/usecases/get_suggestions.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class SuggestionsCubit extends Cubit<SuggestionsState> {
  final GetSuggestions _getSuggestions;

  SuggestionsCubit(this._getSuggestions) : super(const SuggestionsInitial());

  Future<void> fetchSuggestions({
    required String occasion,
    required String relationship,
  }) async {
    emit(const SuggestionsLoading());

    final result = await _getSuggestions(
      occasion: occasion,
      relationship: relationship,
    );

    if (result.failure != null) {
      emit(SuggestionsError(result.failure!.message));
      return;
    }

    emit(SuggestionsSuccess(result.data!));
  }

  void reset() => emit(const SuggestionsInitial());
}
