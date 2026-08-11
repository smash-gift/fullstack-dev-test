import 'package:flutter/foundation.dart';
import '../../../data/repositories/suggester_repository.dart';
import '../../../domain/models/suggestion.dart';
import '../../../utils/command.dart';
import '../../../utils/result.dart';

class SuggesterViewModel extends ChangeNotifier {
  final SuggesterRepository _repository;

  SuggesterViewModel({required SuggesterRepository repository})
      : _repository = repository {
    generateCommand = Command1(_generateSuggestions);
  }

  late final Command1<List<Suggestion>, SuggestionRequestParams> generateCommand;

  Future<Result<List<Suggestion>>> _generateSuggestions(SuggestionRequestParams params) async {
    return await _repository.getSuggestions(params);
  }
}
