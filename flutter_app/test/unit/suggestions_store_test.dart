import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/app/core/drivers/http/i_http_client.dart';
import 'package:gift_card_suggester/modules/suggestions/domain/dtos/suggest_request_dto.dart';
import 'package:gift_card_suggester/modules/suggestions/domain/entities/suggestions_result.dart';
import 'package:gift_card_suggester/modules/suggestions/domain/errors/suggestions_failure.dart';
import 'package:gift_card_suggester/modules/suggestions/presenter/stores/suggestions_store.dart';

import '../helpers/fake_http_client.dart';
import '../helpers/test_app.dart';

void main() {
  late FakeHttpClient client;
  late SuggestionsStore store;

  setUp(() {
    client = FakeHttpClient();
    store = buildStore(client);
    store.occasionController.text = 'birthday';
    store.relationshipController.text = 'best friend';
  });

  tearDown(() => store.dispose());

  group('the happy path', () {
    test('starts idle', () {
      expect(store.status, SuggestionsStatus.idle);
      expect(store.hasSuggestions, isFalse);
      expect(store.isDegraded, isFalse);
    });

    test('reports loading before it reports success', () async {
      final seen = <SuggestionsStatus>[];
      store.addListener(() => seen.add(store.status));

      await store.submit(language: 'en');

      expect(seen.first, SuggestionsStatus.loading);
      expect(seen.last, SuggestionsStatus.success);
    });

    test('publishes the suggestions the backend sent', () async {
      await store.submit(language: 'en');

      expect(store.result!.suggestions, hasLength(3));
      expect(store.result!.suggestions.first.text, contains('Happy birthday'));
      expect(store.result!.source, SuggestionSource.llm);
    });

    test('sends what the user typed, trimmed, with the chosen tone', () async {
      store.occasionController.text = '  graduation  ';
      store.setTone(SuggestionTone.funny);

      await store.submit(language: 'pt');

      expect(client.lastBody!['occasion'], 'graduation');
      expect(client.lastBody!['tone'], 'funny');
      expect(client.lastBody!['language'], 'pt');
    });

    test('posts to the configured address', () async {
      await store.submit(language: 'en');

      expect(client.lastUrl.toString(), 'http://localhost:3000/api/v1/suggestions');
    });

    /// A second tap while the first request is in flight would leave two
    /// answers racing to be the one displayed.
    test('ignores a second submit while one is running', () async {
      client.delay = const Duration(milliseconds: 40);

      final first = store.submit(language: 'en');
      await store.submit(language: 'en');
      await first;

      expect(client.callCount, 1);
    });
  });

  group('the fallback path', () {
    test('carries degraded all the way to the screen', () async {
      client.body = FakeHttpClient.successBody(
        texts: const ['Wishing you a wonderful day.', 'Thinking of you today.'],
        degraded: true,
        reason: 'llm_timeout',
      );

      await store.submit(language: 'en');

      expect(store.status, SuggestionsStatus.success);
      expect(store.isDegraded, isTrue);
      expect(store.result!.source, SuggestionSource.fallback);
      expect(store.result!.model, isNull);
      expect(store.result!.reason, DegradationReason.llmTimeout);
      expect(store.bannerFailure, isNull, reason: 'a degradation is not a failure');
    });

    /// The backend may add a reason before this app is rebuilt. The user still
    /// has to be told the answer was degraded.
    test('accepts a reason it has never heard of', () async {
      client.body = FakeHttpClient.successBody(degraded: true, reason: 'llm_moon_phase');

      await store.submit(language: 'en');

      expect(store.isDegraded, isTrue);
      expect(store.result!.reason, DegradationReason.unknown);
    });
  });

  group('failures', () {
    test('an unreachable server becomes a connection failure', () async {
      client.throwing = const HttpClientException(HttpFailureReason.unreachable);

      await store.submit(language: 'en');

      expect(store.status, SuggestionsStatus.failure);
      expect(store.bannerFailure, isA<ConnectionFailure>());
    });

    test('a timeout is told apart from an unreachable server', () async {
      client.throwing = const HttpClientException(HttpFailureReason.timeout);

      await store.submit(language: 'en');

      expect(store.bannerFailure, isA<TimeoutFailure>());
    });

    test('a 429 carries the seconds to wait', () async {
      client
        ..statusCode = 429
        ..body = FakeHttpClient.errorBody(
          'RATE_LIMITED',
          details: {'retryAfterSeconds': 143},
        );

      await store.submit(language: 'en');

      final failure = store.bannerFailure;
      expect(failure, isA<RateLimitedFailure>());
      expect((failure! as RateLimitedFailure).retryAfterSeconds, 143);
    });

    /// 429 must never show suggestions. Serving them would teach the client
    /// that insisting works, which is what the limit exists to prevent.
    test('a 429 does not produce suggestions', () async {
      client
        ..statusCode = 429
        ..body = FakeHttpClient.errorBody('RATE_LIMITED');

      await store.submit(language: 'en');

      expect(store.hasSuggestions, isFalse);
    });

    test('a validation error lands on the field, not in a banner', () async {
      client
        ..statusCode = 400
        ..body = FakeHttpClient.errorBody(
          'VALIDATION_ERROR',
          details: [
            {'field': 'occasion', 'issue': 'occasion must be at least 2 characters'},
          ],
        );

      await store.submit(language: 'en');

      expect(store.fieldIssues.keys, contains('occasion'));
      expect(store.bannerFailure, isNull);
    });

    test('a 500 becomes a server failure without echoing the message', () async {
      client
        ..statusCode = 500
        ..body = FakeHttpClient.errorBody('INTERNAL_ERROR');

      await store.submit(language: 'en');

      expect(store.bannerFailure, isA<ServerFailure>());
    });

    test('a 200 the client cannot read is a server failure, not a crash', () async {
      client.body = {'data': 'this is not the documented shape'};

      await store.submit(language: 'en');

      expect(store.status, SuggestionsStatus.failure);
      expect(store.bannerFailure, isA<ServerFailure>());
    });

    /// Taking away a usable answer because a retry failed would punish the
    /// user for trying again.
    test('keeps the previous suggestions when a retry fails', () async {
      await store.submit(language: 'en');
      expect(store.hasSuggestions, isTrue);

      client.throwing = const HttpClientException(HttpFailureReason.unreachable);
      await store.submit(language: 'en');

      expect(store.status, SuggestionsStatus.failure);
      expect(store.hasSuggestions, isTrue);
    });
  });

  group('local validation saves a round trip', () {
    test('a field that is too short never reaches the network', () async {
      store.occasionController.text = 'a';

      await store.submit(language: 'en');

      expect(client.callCount, 0);
      expect(store.fieldIssues.keys, contains('occasion'));
    });

    test('a field that is too long never reaches the network', () async {
      store.relationshipController.text = 'x' * 61;

      await store.submit(language: 'en');

      expect(client.callCount, 0);
      expect(store.fieldIssues.keys, contains('relationship'));
    });

    test('clears a field error as soon as the user starts fixing it', () async {
      store.occasionController.text = 'a';
      await store.submit(language: 'en');
      expect(store.fieldIssues, isNotEmpty);

      store.clearFieldIssue('occasion');

      expect(store.fieldIssues, isEmpty);
      expect(store.status, SuggestionsStatus.idle);
    });
    // `bannerFailure` hides validation problems, because the fields already
    // show them. `failure` is the unfiltered one, and something has to assert
    // that the difference between the two is deliberate.
    test('the raw failure keeps what the banner deliberately hides', () async {
      expect(store.failure, isNull);

      store.occasionController.text = 'a';
      await store.submit(language: 'en');

      expect(store.failure, isA<ValidationFailure>());
      expect(store.bannerFailure, isNull);
    });

    test('a failure worth a banner shows up in both', () async {
      store.occasionController.text = 'birthday';
      store.relationshipController.text = 'friend';
      client.throwing = const HttpClientException(HttpFailureReason.unreachable);

      await store.submit(language: 'en');

      expect(store.failure, isA<ConnectionFailure>());
      expect(store.bannerFailure, same(store.failure));
    });

    test('a success clears the failure that came before it', () async {
      store.occasionController.text = 'birthday';
      store.relationshipController.text = 'friend';
      client.throwing = const HttpClientException(HttpFailureReason.unreachable);
      await store.submit(language: 'en');
      expect(store.failure, isNotNull);

      client.throwing = null;
      await store.submit(language: 'en');

      expect(store.failure, isNull);
    });
  });
}