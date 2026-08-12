import '../../domain/models/suggestion.dart';
import '../../utils/result.dart';
import 'suggestion_request_params.dart';

export 'suggester_repository_impl.dart';
export 'suggestion_request_params.dart';

/// Abstract repository contract for fetching gift card message suggestions.
abstract class SuggesterRepository {
  Future<Result<List<Suggestion>>> getSuggestions(
      SuggestionRequestParams params);
}
