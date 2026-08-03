import 'package:flutter/foundation.dart';

import '../models/suggestion_result.dart';
import '../services/api_exception.dart';
import '../services/suggestion_api.dart';
import 'settings_controller.dart';

/// UI-facing status of the suggestion flow.
enum SuggestionStatus { idle, loading, success, error }

/// Holds screen state and coordinates the API call. Deliberately free of any
/// widget/`BuildContext` references so it stays testable and the UI layer only
/// reads from it.
class SuggestionController extends ChangeNotifier {
  SuggestionController(this._api, {this.settings});

  final SuggestionApi _api;
  final SettingsController? settings;

  SuggestionStatus _status = SuggestionStatus.idle;
  SuggestionResult? _result;
  String? _errorMessage;

  SuggestionStatus get status => _status;
  SuggestionResult? get result => _result;
  String? get errorMessage => _errorMessage;

  bool get isLoading => _status == SuggestionStatus.loading;

  Future<void> requestSuggestions({
    required String occasion,
    required String relationship,
    String? tone,
  }) async {
    if (occasion.trim().isEmpty || relationship.trim().isEmpty) {
      _status = SuggestionStatus.error;
      _errorMessage = 'Please fill in both occasion and relationship.';
      notifyListeners();
      return;
    }

    _status = SuggestionStatus.loading;
    _errorMessage = null;
    notifyListeners();

    // Apply the user's saved connection settings (base URL + access token) and
    // fall back to their default tone when the caller didn't specify one.
    final currentSettings = settings;
    if (currentSettings != null) {
      _api.configure(
        baseUrl: currentSettings.baseUrl,
        authToken: currentSettings.token.isEmpty ? null : currentSettings.token,
      );
    }
    final effectiveTone = (tone != null && tone.trim().isNotEmpty)
        ? tone
        : currentSettings?.tone;

    try {
      final result = await _api.fetchSuggestions(
        occasion: occasion,
        relationship: relationship,
        tone: effectiveTone,
      );
      _result = result;
      _status = SuggestionStatus.success;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _status = SuggestionStatus.error;
    } catch (_) {
      _errorMessage = 'Something went wrong. Please try again.';
      _status = SuggestionStatus.error;
    }
    notifyListeners();
  }

  void reset() {
    _status = SuggestionStatus.idle;
    _result = null;
    _errorMessage = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _api.dispose();
    super.dispose();
  }
}
