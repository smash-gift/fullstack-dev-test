import '../data/models/suggestion_result.dart';
import '../data/suggestion_failure.dart';

sealed class SuggesterState {
  const SuggesterState();
}

class SuggesterIdle extends SuggesterState {
  const SuggesterIdle();
}

class SuggesterLoading extends SuggesterState {
  const SuggesterLoading();
}

class SuggesterLoaded extends SuggesterState {
  const SuggesterLoaded(this.result);

  final SuggestionResult result;
}

class SuggesterFailed extends SuggesterState {
  const SuggesterFailed(this.failure);

  final SuggestionFailure failure;
}
