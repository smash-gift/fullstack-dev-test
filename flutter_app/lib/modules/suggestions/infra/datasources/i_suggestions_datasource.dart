import '../../domain/dtos/suggest_request_dto.dart';
import '../../domain/entities/suggestions_result.dart';

/// The contract the repository depends on.
///
/// Separate from the repository so the transport can be replaced — a cache, a
/// local stub for a demo, a different protocol — without the domain noticing.
abstract interface class ISuggestionsDatasource {
  /// Returns the parsed result, or throws a [SuggestionsDatasourceException].
  Future<SuggestionsResult> fetchSuggestions(SuggestRequestDto request);
}

/// What the transport failed at, in terms the repository can map to a domain
/// failure without knowing anything about HTTP.
enum DatasourceFailureKind {
  unreachable,
  timeout,
  invalidRequest,
  rateLimited,
  server,
  unreadableResponse,
}

class SuggestionsDatasourceException implements Exception {
  const SuggestionsDatasourceException(
    this.kind, {
    this.fieldIssues = const {},
    this.retryAfterSeconds = 0,
  });

  final DatasourceFailureKind kind;

  /// Field name to issue, when the backend rejected the input.
  final Map<String, String> fieldIssues;
  final int retryAfterSeconds;

  @override
  String toString() => 'SuggestionsDatasourceException(${kind.name})';
}
