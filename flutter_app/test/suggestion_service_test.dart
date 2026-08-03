import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:gift_card_suggester/models/suggestion_result.dart';
import 'package:gift_card_suggester/services/suggestion_service.dart';

http.Client _mockClient(int status, Map<String, dynamic> body) {
  return MockClient((_) async => http.Response(jsonEncode(body), status));
}

void main() {
  group('SuggestionService', () {
    test('returns SuggestionResult on 200 response', () async {
      final client = _mockClient(200, {
        'suggestions': ['msg1', 'msg2', 'msg3'],
        'source': 'llm',
      });
      final service = SuggestionService(client: client);

      final result = await service.getSuggestions(
        occasion: 'birthday',
        relationship: 'friend',
      );

      expect(result.suggestions, ['msg1', 'msg2', 'msg3']);
      expect(result.source, SuggestionSource.llm);
    });

    test('maps source "cache" correctly', () async {
      final client = _mockClient(200, {
        'suggestions': ['msg1'],
        'source': 'cache',
      });
      final result =
          await SuggestionService(client: client).getSuggestions(
        occasion: 'birthday',
        relationship: 'friend',
      );
      expect(result.source, SuggestionSource.cache);
    });

    test('maps source "fallback" correctly', () async {
      final client = _mockClient(200, {
        'suggestions': ['fallback msg'],
        'source': 'fallback',
      });
      final result =
          await SuggestionService(client: client).getSuggestions(
        occasion: 'other',
        relationship: 'colleague',
      );
      expect(result.source, SuggestionSource.fallback);
    });

    test('throws ApiException with 429 message on rate limit', () async {
      final client = _mockClient(429, {'error': 'Rate limit exceeded'});
      final service = SuggestionService(client: client);

      expect(
        () => service.getSuggestions(
          occasion: 'birthday',
          relationship: 'friend',
        ),
        throwsA(
          isA<ApiException>().having(
            (e) => e.statusCode,
            'statusCode',
            429,
          ),
        ),
      );
    });

    test('throws ApiException on 400 with validation detail', () async {
      final client = _mockClient(400, {
        'error': 'Invalid input',
        'details': [
          {'field': 'occasion', 'message': 'occasion is required'},
        ],
      });
      final service = SuggestionService(client: client);

      expect(
        () => service.getSuggestions(occasion: '', relationship: 'friend'),
        throwsA(
          isA<ApiException>()
              .having((e) => e.statusCode, 'statusCode', 400)
              .having((e) => e.message, 'message', 'occasion is required'),
        ),
      );
    });

    test('throws ApiException on 500 server error', () async {
      final client = _mockClient(500, {'error': 'Internal server error'});
      final service = SuggestionService(client: client);

      expect(
        () => service.getSuggestions(
          occasion: 'birthday',
          relationship: 'friend',
        ),
        throwsA(isA<ApiException>().having(
          (e) => e.statusCode,
          'statusCode',
          500,
        )),
      );
    });
  });
}
