import 'dart:async';

import 'package:gift_card_suggester/models/suggestion_response.dart';
import 'package:gift_card_suggester/services/api_client.dart';

typedef RecordedCall = ({String occasion, String relationship});

/// A [SuggestionsApi] whose answer is decided by the test, and only when the
/// test says so.
///
/// Holding the future open is what makes the loading state observable: the
/// assertions happen between the call and its completion, which is exactly the
/// window a real user sees.
class FakeSuggestionsApi implements SuggestionsApi {
  final List<RecordedCall> calls = [];

  Completer<SuggestionResponse> _completer = Completer<SuggestionResponse>();

  @override
  Future<SuggestionResponse> fetchSuggestions({
    required String occasion,
    required String relationship,
  }) {
    calls.add((occasion: occasion, relationship: relationship));
    _completer = Completer<SuggestionResponse>();
    return _completer.future;
  }

  void succeed(
    List<String> suggestions, {
    SuggestionSource source = SuggestionSource.llm,
  }) {
    _completer.complete(
      SuggestionResponse(suggestions: suggestions, source: source),
    );
  }

  void failWithApiException(String message) {
    _completer.completeError(ApiException(message));
  }

  /// Something the client was never supposed to throw, to prove the controller
  /// still leaves the screen in a state the user can act on.
  void failUnexpectedly() {
    _completer.completeError(StateError('not an ApiException'));
  }
}
