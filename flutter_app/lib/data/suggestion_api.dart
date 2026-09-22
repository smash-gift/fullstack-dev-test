import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/app_config.dart';
import 'models/suggestion_result.dart';
import 'suggestion_failure.dart';

/// Thrown by [SuggestionApi] so the controller can turn transport problems into
/// states without knowing anything about HTTP.
class SuggestionApiException implements Exception {
  const SuggestionApiException(this.failure);

  final SuggestionFailure failure;
}

class SuggestionApi {
  SuggestionApi({http.Client? client, String? baseUrl, Duration? timeout})
      : _client = client ?? http.Client(),
        _baseUrl = baseUrl ?? AppConfig.apiBaseUrl,
        _timeout = timeout ?? AppConfig.requestTimeout;

  final http.Client _client;
  final String _baseUrl;
  final Duration _timeout;

  Future<SuggestionResult> suggest({
    required String occasion,
    required String relationship,
    String locale = 'en',
    int count = 3,
    bool refresh = false,
  }) async {
    final http.Response response;

    try {
      response = await _client
          .post(
            Uri.parse('$_baseUrl/v1/suggestions'),
            headers: const {'content-type': 'application/json'},
            body: jsonEncode({
              'occasion': occasion,
              'relationship': relationship,
              'locale': locale,
              'count': count,
              'refresh': refresh,
            }),
          )
          .timeout(_timeout);
    } on TimeoutException {
      throw const SuggestionApiException(TimeoutFailure());
    } catch (_) {
      throw const SuggestionApiException(NetworkFailure());
    }

    return _parse(response);
  }

  SuggestionResult _parse(http.Response response) {
    final Map<String, dynamic> body;
    try {
      body = jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      throw const SuggestionApiException(ServerFailure());
    }

    if (response.statusCode == 200) {
      final result = SuggestionResult.fromJson(body);
      if (result.suggestions.isEmpty) {
        throw const SuggestionApiException(ServerFailure());
      }
      return result;
    }

    final error = body['error'] as Map<String, dynamic>? ?? const {};

    throw SuggestionApiException(
      switch (response.statusCode) {
        400 => InvalidInputFailure(
            error['message'] as String? ?? 'Please review the occasion and the relationship.',
          ),
        429 => RateLimitFailure(error['retryAfterSeconds'] as int? ?? 30),
        _ => const ServerFailure(),
      },
    );
  }

  void dispose() => _client.close();
}
