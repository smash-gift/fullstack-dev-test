import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gift_card_suggester/core/config/app_config.dart';
import 'package:gift_card_suggester/data/suggestion_api_client.dart';
import 'package:gift_card_suggester/domain/failure.dart';
import 'package:gift_card_suggester/domain/suggestion_state.dart';

/// Exposes the API client. Overridable in tests with a fake implementation.
final suggestionApiClientProvider = Provider<SuggestionApiClient>((ref) {
  return SuggestionApiClient(baseUrl: AppConfig.apiBaseUrl);
});

/// Holds and drives the suggester screen state.
final suggestionControllerProvider =
    StateNotifierProvider<SuggestionController, SuggestionState>((ref) {
  return SuggestionController(ref.watch(suggestionApiClientProvider));
});

/// Orchestrates a suggestion request and exposes the resulting
/// [SuggestionState]. Keeps all async/error handling out of the widget layer.
class SuggestionController extends StateNotifier<SuggestionState> {
  SuggestionController(this._client) : super(const SuggestionIdle());

  final SuggestionApiClient _client;

  /// Fetches suggestions and transitions the state accordingly.
  Future<void> fetch({
    required String occasion,
    required String relationship,
  }) async {
    state = const SuggestionLoading();
    try {
      final response = await _client.fetchSuggestions(
        occasion: occasion,
        relationship: relationship,
      );
      state = SuggestionSuccess(response.suggestions, response.source);
    } on Failure catch (failure) {
      state = SuggestionError(failure);
    } catch (_) {
      state = const SuggestionError(
        Failure(FailureKind.unknown, 'Something went wrong. Please try again.'),
      );
    }
  }

  /// Resets to the idle state.
  void reset() => state = const SuggestionIdle();
}
