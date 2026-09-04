import 'dart:convert';

import '../../../../app/core/drivers/http/i_http_client.dart';
import '../../domain/dtos/suggest_request_dto.dart';
import '../../domain/entities/suggestions_result.dart';
import '../../infra/datasources/i_suggestions_datasource.dart';
import '../../infra/models/suggestions_result_model.dart';

/// Talks to the backend over HTTP.
///
/// The base URL is resolved per call rather than captured at construction:
/// changing it in the settings dialog has to take effect on the next request,
/// not on the next app launch.
class HttpSuggestionsDatasource implements ISuggestionsDatasource {
  const HttpSuggestionsDatasource({
    required IHttpClient httpClient,
    required String Function() baseUrlResolver,
  }) : _client = httpClient,
       _baseUrl = baseUrlResolver;

  final IHttpClient _client;
  final String Function() _baseUrl;

  static const _path = '/api/v1/suggestions';

  @override
  Future<SuggestionsResult> fetchSuggestions(SuggestRequestDto request) async {
    final url = _resolve();

    final HttpClientResponse response;
    try {
      response = await _client.postJson(url: url, body: request.toJson());
    } on HttpClientException catch (exception) {
      // Handled, not rethrown raw: the driver's reason becomes a datasource
      // kind, so nothing above this line has to know what a socket is.
      throw SuggestionsDatasourceException(
        switch (exception.reason) {
          HttpFailureReason.timeout => DatasourceFailureKind.timeout,
          HttpFailureReason.unreachable => DatasourceFailureKind.unreachable,
        },
      );
    }

    if (response.isSuccess) {
      return _parseSuccess(response.body);
    }
    throw _failureFor(response);
  }

  Uri _resolve() {
    final base = _baseUrl().trim();
    final normalised = base.endsWith('/')
        ? base.substring(0, base.length - 1)
        : base;
    return Uri.parse('$normalised$_path');
  }

  SuggestionsResult _parseSuccess(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is! Map<String, Object?>) {
        throw const FormatException('response is not an object');
      }
      return SuggestionsResultModel.fromJson(decoded);
    } on FormatException {
      // A 200 we cannot read is a server problem, not a user problem.
      throw const SuggestionsDatasourceException(
        DatasourceFailureKind.unreadableResponse,
      );
    }
  }

  /// Maps the backend's documented error envelope. The stable `code` is what is
  /// switched on — never the message, which the contract says may be reworded.
  SuggestionsDatasourceException _failureFor(HttpClientResponse response) {
    final error = _errorObject(response.body);
    final code = error?['code']?.toString();

    return switch (code) {
      'VALIDATION_ERROR' => SuggestionsDatasourceException(
        DatasourceFailureKind.invalidRequest,
        fieldIssues: _fieldIssues(error?['details']),
      ),
      'RATE_LIMITED' => SuggestionsDatasourceException(
        DatasourceFailureKind.rateLimited,
        retryAfterSeconds: _retryAfter(error?['details']),
      ),
      _ => const SuggestionsDatasourceException(DatasourceFailureKind.server),
    };
  }

  Map<String, Object?>? _errorObject(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, Object?> &&
          decoded['error'] is Map<String, Object?>) {
        return decoded['error']! as Map<String, Object?>;
      }
      return null;
    } on FormatException {
      // An error body that is not JSON — a proxy's HTML page, most likely.
      // Returning null lands it in the generic server branch, which is right.
      return null;
    }
  }

  Map<String, String> _fieldIssues(Object? details) {
    if (details is! List) return const {};

    final issues = <String, String>{};
    for (final entry in details) {
      if (entry is Map<String, Object?>) {
        final field = entry['field']?.toString();
        final issue = entry['issue']?.toString();
        if (field != null && issue != null) issues[field] = issue;
      }
    }
    return issues;
  }

  int _retryAfter(Object? details) {
    if (details is Map<String, Object?>) {
      final seconds = details['retryAfterSeconds'];
      if (seconds is num) return seconds.round();
    }
    return 0;
  }
}
