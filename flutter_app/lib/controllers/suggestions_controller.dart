import 'package:flutter/foundation.dart';

import '../models/suggestion_response.dart';
import '../services/api_client.dart';

enum SuggestionsStatus { idle, loading, success, failure }

/// Holds the screen's state and nothing else.
///
/// A plain [ChangeNotifier]: with four states and one action, a state
/// management package would be ceremony. It knows nothing about widgets or
/// `BuildContext`, and it takes its API through the constructor, which is what
/// lets the tests drive it with a stub.
class SuggestionsController extends ChangeNotifier {
  SuggestionsController({required SuggestionsApi api}) : _api = api;

  final SuggestionsApi _api;

  SuggestionsStatus _status = SuggestionsStatus.idle;
  List<String> _suggestions = const [];
  SuggestionSource _source = SuggestionSource.unknown;
  String? _errorMessage;

  SuggestionsStatus get status => _status;
  List<String> get suggestions => _suggestions;
  SuggestionSource get source => _source;
  String? get errorMessage => _errorMessage;

  bool get isLoading => _status == SuggestionsStatus.loading;

  /// True when the API served its curated list because the model was
  /// unreachable. Worth telling the user, but not as an error.
  bool get isDegraded =>
      _status == SuggestionsStatus.success && _source == SuggestionSource.fallback;

  Future<void> fetchSuggestions({
    required String occasion,
    required String relationship,
  }) async {
    // Ignoring a second press while one request is in flight is simpler and
    // more predictable than cancelling the first.
    if (_status == SuggestionsStatus.loading) {
      return;
    }

    _status = SuggestionsStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.fetchSuggestions(
        occasion: occasion.trim(),
        relationship: relationship.trim(),
      );

      _suggestions = response.suggestions;
      _source = response.source;
      _status = SuggestionsStatus.success;
    } on ApiException catch (error) {
      _errorMessage = error.message;
      _status = SuggestionsStatus.failure;
    } catch (_) {
      // Nothing unexpected should reach here, but a blank screen would be the
      // worst possible outcome if it did.
      _errorMessage = 'Something went wrong. Please try again.';
      _status = SuggestionsStatus.failure;
    }

    notifyListeners();
  }
}
