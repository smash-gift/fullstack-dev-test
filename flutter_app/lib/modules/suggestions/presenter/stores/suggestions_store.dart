import 'package:flutter/widgets.dart';

import '../../domain/dtos/suggest_request_dto.dart';
import '../../domain/entities/suggestions_result.dart';
import '../../domain/errors/suggestions_failure.dart';
import '../../domain/usecases/get_suggestions_usecase.dart';

/// What the screen is doing right now.
enum SuggestionsStatus { idle, loading, success, failure }

/// All of the screen's state, in one place that is not a widget.
///
/// The page is a `StatelessWidget` because of this: there is no `setState`
/// anywhere in the presentation layer, which is what keeps every visual piece
/// testable on its own and the screen's behaviour testable without pumping a
/// single frame.
///
/// The text controllers live here too. They are state, and state that sits in
/// the page is state a test has to reach through the widget tree to inspect.
class SuggestionsStore extends ChangeNotifier {
  SuggestionsStore(this._useCase);

  final GetSuggestionsUseCase _useCase;

  final occasionController = TextEditingController();
  final relationshipController = TextEditingController();

  SuggestionsStatus _status = SuggestionsStatus.idle;
  SuggestionsResult? _result;
  SuggestionsFailure? _failure;
  SuggestionTone _tone = SuggestionTone.warm;

  SuggestionsStatus get status => _status;
  SuggestionsResult? get result => _result;
  SuggestionsFailure? get failure => _failure;
  SuggestionTone get tone => _tone;

  bool get isLoading => _status == SuggestionsStatus.loading;
  bool get hasSuggestions => _result != null && _result!.suggestions.isNotEmpty;

  /// True when the last answer was served from the curated catalogue because
  /// the model could not be used. The request still succeeded.
  bool get isDegraded => _result?.degraded ?? false;

  /// Field name to issue code, for the message that belongs under an input
  /// rather than in a banner.
  Map<String, String> get fieldIssues =>
      switch (_failure) { ValidationFailure(:final fieldIssues) => fieldIssues, _ => const {} };

  /// A failure worth a banner. Validation problems are excluded because they
  /// are already shown on the fields themselves — saying it twice reads as two
  /// separate problems.
  SuggestionsFailure? get bannerFailure =>
      _failure is ValidationFailure ? null : _failure;

  void setTone(SuggestionTone value) {
    if (_tone == value) return;
    _tone = value;
    notifyListeners();
  }

  /// Clears a field's error as soon as the user starts fixing it. Leaving it up
  /// while they type says the app is not paying attention.
  void clearFieldIssue(String field) {
    final current = _failure;
    if (current is! ValidationFailure) return;
    if (!current.fieldIssues.containsKey(field)) return;

    final remaining = Map<String, String>.from(current.fieldIssues)..remove(field);
    _failure = remaining.isEmpty ? null : ValidationFailure(remaining);
    if (_failure == null && _status == SuggestionsStatus.failure) {
      _status = hasSuggestions ? SuggestionsStatus.success : SuggestionsStatus.idle;
    }
    notifyListeners();
  }

  Future<void> submit({required String language}) async {
    if (_status == SuggestionsStatus.loading) return;

    _status = SuggestionsStatus.loading;
    _failure = null;
    notifyListeners();

    final request = SuggestRequestDto(
      occasion: occasionController.text.trim(),
      relationship: relationshipController.text.trim(),
      tone: _tone,
      language: language,
    );

    final outcome = await _useCase(request);

    outcome.fold(
      (value) {
        _result = value;
        _failure = null;
        _status = SuggestionsStatus.success;
      },
      (failure) {
        _failure = failure;
        _status = SuggestionsStatus.failure;
        // The previous suggestions are kept on purpose. Taking away a usable
        // result because a retry failed would punish the user for trying.
      },
    );

    notifyListeners();
  }

  @override
  void dispose() {
    occasionController.dispose();
    relationshipController.dispose();
    super.dispose();
  }
}
