import 'package:flutter/foundation.dart';

import '../data/suggestion_api.dart';
import '../data/suggestion_failure.dart';
import 'suggester_state.dart';

class SuggesterController extends ChangeNotifier {
  SuggesterController({required SuggestionApi api}) : _api = api;

  final SuggestionApi _api;

  SuggesterState _state = const SuggesterIdle();
  SuggesterState get state => _state;

  bool get isLoading => _state is SuggesterLoading;

  /// Guards against a second tap while a request is in flight and against a
  /// late response arriving after the widget is gone.
  int _requestSequence = 0;
  bool _disposed = false;

  Future<void> requestSuggestions({
    required String occasion,
    required String relationship,
    String locale = 'en',
    bool refresh = false,
  }) async {
    if (isLoading) return;

    final sequence = ++_requestSequence;
    _emit(const SuggesterLoading());

    try {
      final result = await _api.suggest(
        occasion: occasion.trim(),
        relationship: relationship.trim(),
        locale: locale,
        refresh: refresh,
      );
      if (sequence != _requestSequence) return;
      _emit(SuggesterLoaded(result));
    } on SuggestionApiException catch (exception) {
      if (sequence != _requestSequence) return;
      _emit(SuggesterFailed(exception.failure));
    } catch (_) {
      if (sequence != _requestSequence) return;
      _emit(const SuggesterFailed(ServerFailure()));
    }
  }

  void reset() => _emit(const SuggesterIdle());

  void _emit(SuggesterState next) {
    if (_disposed) return;
    _state = next;
    notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _api.dispose();
    super.dispose();
  }
}
