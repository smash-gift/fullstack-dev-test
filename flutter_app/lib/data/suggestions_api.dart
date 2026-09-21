import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/suggestion_response.dart';

abstract interface class SuggestionsApi {
  Future<SuggestionResponse> requestSuggestions({
    required String occasion,
    required String relationship,
  });
}

class SuggestionsApiClient implements SuggestionsApi {
  SuggestionsApiClient({required this.baseUrl, http.Client? client})
      : _client = client ?? http.Client();

  final Uri baseUrl;
  final http.Client _client;

  Uri get _suggestionsUri => baseUrl.resolve('api/suggestions');

  @override
  Future<SuggestionResponse> requestSuggestions({
    required String occasion,
    required String relationship,
  }) async {
    try {
      final response = await _client
          .post(
            _suggestionsUri,
            headers: const {'content-type': 'application/json'},
            body: jsonEncode({
              'occasion': occasion,
              'relationship': relationship,
            }),
          )
          .timeout(const Duration(seconds: 15));

      final decoded = jsonDecode(response.body);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        String? message;
        if (decoded is Map<String, dynamic>) {
          final error = decoded['error'];
          if (error is Map<String, dynamic> && error['message'] is String) {
            message = error['message'] as String;
          }
        }
        throw ApiException(
            message is String ? message : 'Unable to generate suggestions.');
      }

      if (decoded is! Map<String, dynamic>) {
        throw const ApiException('The server returned an invalid response.');
      }

      return SuggestionResponse.fromJson(decoded);
    } on ApiException {
      rethrow;
    } on TimeoutException {
      throw const ApiException('The request took too long. Please try again.');
    } on http.ClientException {
      throw const ApiException(
          'Could not connect to the backend. Check the API URL.');
    } on FormatException {
      throw const ApiException('The server returned an invalid response.');
    }
  }

  void dispose() => _client.close();
}

class ApiException implements Exception {
  const ApiException(this.message);

  final String message;

  @override
  String toString() => message;
}
