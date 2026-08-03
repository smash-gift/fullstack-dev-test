import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../models/suggestion_result.dart';
import 'api_exception.dart';

/// Thin API client responsible only for talking to the backend and translating
/// transport/HTTP concerns into either a [SuggestionResult] or an
/// [ApiException] with a user-safe message. It holds no UI or state logic.
class SuggestionApi {
  SuggestionApi({http.Client? client, String? baseUrl, String? authToken})
    : _client = client ?? http.Client(),
      _baseUrl = baseUrl ?? AppConfig.apiBaseUrl,
      _token = authToken;

  final http.Client _client;
  String _baseUrl;
  String? _token;

  static const Duration _timeout = Duration(seconds: 12);

  /// Updates the runtime connection settings (from the user's saved settings).
  /// Kept separate from the constructor so tests can pin a fixed base URL.
  void configure({String? baseUrl, String? authToken}) {
    if (baseUrl != null && baseUrl.trim().isNotEmpty) _baseUrl = baseUrl.trim();
    _token = authToken;
  }

  Future<SuggestionResult> fetchSuggestions({
    required String occasion,
    required String relationship,
    String? tone,
  }) async {
    final uri = Uri.parse('$_baseUrl/api/suggestions');

    http.Response response;
    try {
      response = await _client
          .post(
            uri,
            headers: {
              'Content-Type': 'application/json',
              if (_token != null && _token!.trim().isNotEmpty)
                'Authorization': 'Bearer ${_token!.trim()}',
            },
            body: jsonEncode({
              'occasion': occasion,
              'relationship': relationship,
              if (tone != null && tone.trim().isNotEmpty) 'tone': tone.trim(),
            }),
          )
          .timeout(_timeout);
    } on TimeoutException {
      throw const ApiException('The request took too long. Please try again.');
    } catch (_) {
      // Network/DNS/connection errors — keep the message generic and safe.
      throw const ApiException(
        'Could not reach the server. Check your connection and the API URL.',
      );
    }

    if (response.statusCode == 200) {
      try {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        return SuggestionResult.fromJson(json);
      } catch (_) {
        throw const ApiException(
          'Received an unexpected response from the server.',
        );
      }
    }

    if (response.statusCode == 400) {
      throw const ApiException(
        'Please enter a valid occasion and relationship.',
      );
    }
    if (response.statusCode == 401 || response.statusCode == 403) {
      throw const ApiException(
        'Authentication required. Add a valid access token in Settings.',
      );
    }
    if (response.statusCode == 429) {
      throw const ApiException(
        'Too many requests. Please wait a moment and try again.',
      );
    }
    throw const ApiException('Something went wrong. Please try again.');
  }

  void dispose() => _client.close();
}
