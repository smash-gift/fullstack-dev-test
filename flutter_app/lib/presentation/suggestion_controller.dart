import 'package:flutter/foundation.dart';

import '../data/suggestions_api.dart';
import '../models/suggestion_response.dart';

enum SuggestionStatus { idle, loading, success, error }

class SuggestionController extends ChangeNotifier {
  SuggestionController(this._api);

  final SuggestionsApi _api;

  SuggestionStatus status = SuggestionStatus.idle;
  SuggestionResponse? response;
  String? errorMessage;

  bool get isLoading => status == SuggestionStatus.loading;

  Future<void> load(
      {required String occasion, required String relationship}) async {
    if (isLoading) return;

    status = SuggestionStatus.loading;
    response = null;
    errorMessage = null;
    notifyListeners();

    try {
      response = await _api.requestSuggestions(
        occasion: occasion,
        relationship: relationship,
      );
      status = SuggestionStatus.success;
    } on ApiException catch (error) {
      status = SuggestionStatus.error;
      errorMessage = error.message;
    } catch (_) {
      status = SuggestionStatus.error;
      errorMessage = 'Something went wrong. Please try again.';
    }

    notifyListeners();
  }
}
