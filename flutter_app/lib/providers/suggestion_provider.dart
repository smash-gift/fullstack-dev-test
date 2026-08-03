import 'package:flutter/foundation.dart';
import '../models/suggestion_result.dart';
import '../services/suggestion_service.dart';

enum SuggestionState { idle, loading, success, error }

class SuggestionProvider extends ChangeNotifier {
  final SuggestionService _service;

  SuggestionProvider({SuggestionService? service})
      : _service = service ?? SuggestionService();

  SuggestionState _state = SuggestionState.idle;
  SuggestionResult? _result;
  String? _errorMessage;

  SuggestionState get state => _state;
  SuggestionResult? get result => _result;
  String? get errorMessage => _errorMessage;

  Future<void> submit({
    required String occasion,
    required String relationship,
  }) async {
    _state = SuggestionState.loading;
    _result = null;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _service.getSuggestions(
        occasion: occasion,
        relationship: relationship,
      );
      _result = result;
      _state = SuggestionState.success;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _state = SuggestionState.error;
    } catch (_) {
      _errorMessage = 'An unexpected error occurred. Please try again.';
      _state = SuggestionState.error;
    }

    notifyListeners();
  }

  void reset() {
    _state = SuggestionState.idle;
    _result = null;
    _errorMessage = null;
    notifyListeners();
  }

  void debugSetLoadingForTest() {
    _state = SuggestionState.loading;
    notifyListeners();
  }

  void debugSetErrorForTest(String message) {
    _state = SuggestionState.error;
    _errorMessage = message;
    notifyListeners();
  }
}
