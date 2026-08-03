import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/suggestion_result.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  const ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class SuggestionService {
  final http.Client _client;

  SuggestionService({http.Client? client}) : _client = client ?? http.Client();

  Future<SuggestionResult> getSuggestions({
    required String occasion,
    required String relationship,
  }) async {
    final Uri uri = Uri.parse(AppConfig.suggestionsEndpoint);

    try {
      final response = await _client
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'occasion': occasion.trim(),
              'relationship': relationship.trim(),
            }),
          )
          .timeout(const Duration(seconds: 15));

      final body = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200) {
        return SuggestionResult.fromJson(body);
      }

      if (response.statusCode == 429) {
        throw const ApiException(
          'Too many requests. Please wait a moment and try again.',
          statusCode: 429,
        );
      }

      if (response.statusCode == 400) {
        final details = body['details'] as List<dynamic>?;
        final msg = details?.isNotEmpty == true
            ? (details!.first as Map)['message'] as String? ?? 'Invalid input.'
            : 'Invalid input.';
        throw ApiException(msg, statusCode: 400);
      }

      throw ApiException(
        'Server error (${response.statusCode}). Please try again.',
        statusCode: response.statusCode,
      );
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        'Could not reach the server. Check your connection and try again.',
      );
    }
  }
}
