import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:gift_message_suggester/data/models/suggestion_result.dart';
import 'package:gift_message_suggester/data/suggestion_api.dart';
import 'package:gift_message_suggester/data/suggestion_failure.dart';
import 'package:gift_message_suggester/state/suggester_controller.dart';
import 'package:gift_message_suggester/state/suggester_state.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

SuggesterController controllerReturning(http.Response response) {
  return SuggesterController(
    api: SuggestionApi(
      client: MockClient((_) async => response),
      baseUrl: 'http://test.local',
    ),
  );
}

http.Response jsonResponse(Map<String, dynamic> body, int status) {
  return http.Response(jsonEncode(body), status, headers: {'content-type': 'application/json'});
}

void main() {
  group('SuggesterController', () {
    test('should start idle', () {
      final controller = controllerReturning(jsonResponse(const {}, 200));

      expect(controller.state, isA<SuggesterIdle>());
    });

    test('should expose model suggestions on success', () async {
      final controller = controllerReturning(
        jsonResponse(const {
          'source': 'llm',
          'suggestions': [
            {'id': 's1', 'text': 'Happy birthday!'},
            {'id': 's2', 'text': 'Enjoy your day.'},
          ],
        }, 200),
      );

      await controller.requestSuggestions(occasion: 'Birthday', relationship: 'Friend');

      final state = controller.state as SuggesterLoaded;
      expect(state.result.source, SuggestionSource.llm);
      expect(state.result.isDegraded, isFalse);
      expect(state.result.suggestions, hasLength(2));
    });

    test('should mark the result as degraded when the backend used the fallback', () async {
      final controller = controllerReturning(
        jsonResponse(const {
          'source': 'fallback',
          'degradedReason': 'timeout',
          'suggestions': [
            {'id': 'f1', 'text': 'Wishing you all the best.'},
          ],
        }, 200),
      );

      await controller.requestSuggestions(occasion: 'Birthday', relationship: 'Friend');

      final state = controller.state as SuggesterLoaded;
      expect(state.result.isDegraded, isTrue);
      expect(state.result.degradedReason, 'timeout');
    });

    test('should surface an input failure for a 400 response', () async {
      final controller = controllerReturning(
        jsonResponse(const {
          'error': {'code': 'invalid_request', 'message': 'Occasion is invalid'},
        }, 400),
      );

      await controller.requestSuggestions(occasion: 'x', relationship: 'Friend');

      final state = controller.state as SuggesterFailed;
      expect(state.failure, isA<InvalidInputFailure>());
      expect(state.failure.message, 'Occasion is invalid');
    });

    test('should surface a rate limit failure for a 429 response', () async {
      final controller = controllerReturning(
        jsonResponse(const {
          'error': {'code': 'rate_limited', 'retryAfterSeconds': 42},
        }, 429),
      );

      await controller.requestSuggestions(occasion: 'Birthday', relationship: 'Friend');

      final state = controller.state as SuggesterFailed;
      expect((state.failure as RateLimitFailure).retryAfterSeconds, 42);
    });

    test('should surface a network failure when the request throws', () async {
      final controller = SuggesterController(
        api: SuggestionApi(
          client: MockClient((_) async => throw Exception('connection refused')),
          baseUrl: 'http://test.local',
        ),
      );

      await controller.requestSuggestions(occasion: 'Birthday', relationship: 'Friend');

      expect((controller.state as SuggesterFailed).failure, isA<NetworkFailure>());
    });

    test('should treat an empty suggestion list as a server failure', () async {
      final controller = controllerReturning(
        jsonResponse(const {'source': 'llm', 'suggestions': []}, 200),
      );

      await controller.requestSuggestions(occasion: 'Birthday', relationship: 'Friend');

      expect((controller.state as SuggesterFailed).failure, isA<ServerFailure>());
    });
  });
}
