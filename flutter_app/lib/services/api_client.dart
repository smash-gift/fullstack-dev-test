import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../models/suggestion_response.dart';
import 'auth_service.dart';

/// A failure already phrased for a person to read.
///
/// The screen renders `message` directly, so nothing technical reaches the UI
/// by accident.
class ApiException implements Exception {
  const ApiException(this.message);

  final String message;

  @override
  String toString() => 'ApiException: $message';
}

/// What the controller depends on. The concrete client below is one
/// implementation; tests provide another.
abstract class SuggestionsApi {
  Future<SuggestionResponse> fetchSuggestions({
    required String occasion,
    required String relationship,
  });
}

class HttpSuggestionsApi implements SuggestionsApi {
  HttpSuggestionsApi({
    required AuthService authService,
    http.Client? httpClient,
    Uri? endpoint,
  }) : _authService = authService,
       _httpClient = httpClient ?? http.Client(),
       _endpoint = endpoint ?? AppConfig.suggestionsUri;

  final AuthService _authService;
  final http.Client _httpClient;
  final Uri _endpoint;

  /// Comfortably longer than the server's own budget.
  ///
  /// The API spends up to 8s on the model, then up to 8s more on a single
  /// retry. Giving up sooner would abandon a request that was about to answer
  /// with the fallback anyway.
  static const Duration _timeout = Duration(seconds: 20);

  @override
  Future<SuggestionResponse> fetchSuggestions({
    required String occasion,
    required String relationship,
  }) async {
    final http.Response response;

    try {
      final token = await _authService.idToken();

      response = await _httpClient
          .post(
            _endpoint,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: jsonEncode({
              'occasion': occasion,
              'relationship': relationship,
            }),
          )
          .timeout(_timeout);
    } on TimeoutException {
      throw const ApiException(
        'The request took too long. Check that the backend is running and try again.',
      );
    } catch (_) {
      // Connection refused, DNS, TLS, a failed sign-in. The cause is useful in
      // a log, never on screen.
      throw const ApiException(
        'Could not reach the server. Check that the backend is running and try again.',
      );
    }

    return _readBody(response);
  }

  SuggestionResponse _readBody(http.Response response) {
    final Map<String, Object?> body;
    try {
      body = jsonDecode(response.body) as Map<String, Object?>;
    } catch (_) {
      throw const ApiException('The server sent something unexpected.');
    }

    if (response.statusCode == 200) {
      final parsed = SuggestionResponse.fromJson(body);

      if (parsed.suggestions.isEmpty) {
        throw const ApiException('The server sent no suggestions.');
      }

      return parsed;
    }

    throw ApiException(_messageForError(response, body));
  }

  /// Turns an error response into a sentence.
  ///
  /// The `400` message is written by our own API and is safe to show; the rest
  /// get wording chosen here, so the screen never depends on server phrasing.
  String _messageForError(http.Response response, Map<String, Object?> body) {
    final error = body['error'];
    final serverMessage = error is Map<String, Object?> ? error['message'] : null;

    return switch (response.statusCode) {
      400 =>
        serverMessage is String ? serverMessage : 'Please check what you typed.',
      401 => 'Your session expired. Reopen the app and try again.',
      429 => _rateLimitMessage(response),
      _ => 'Something went wrong on our side. Please try again.',
    };
  }

  String _rateLimitMessage(http.Response response) {
    final retryAfter = int.tryParse(response.headers['retry-after'] ?? '');

    return retryAfter == null
        ? 'Too many requests. Please wait a moment and try again.'
        : 'Too many requests. Please try again in $retryAfter seconds.';
  }
}
