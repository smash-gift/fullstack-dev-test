import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/controllers/suggestions_controller.dart';
import 'package:gift_card_suggester/models/suggestion_response.dart';

import 'support/fake_suggestions_api.dart';

void main() {
  late FakeSuggestionsApi api;
  late SuggestionsController controller;
  late List<SuggestionsStatus> observed;

  setUp(() {
    api = FakeSuggestionsApi();
    controller = SuggestionsController(api: api);
    observed = [];
    controller.addListener(() => observed.add(controller.status));
  });

  test('starts idle with nothing to show', () {
    expect(controller.status, SuggestionsStatus.idle);
    expect(controller.suggestions, isEmpty);
    expect(controller.errorMessage, isNull);
  });

  test('goes idle to loading to success', () async {
    final request = controller.fetchSuggestions(
      occasion: 'Birthday',
      relationship: 'Friend',
    );

    expect(controller.status, SuggestionsStatus.loading);
    expect(controller.isLoading, isTrue);

    api.succeed(['One.', 'Two.', 'Three.']);
    await request;

    expect(observed, [SuggestionsStatus.loading, SuggestionsStatus.success]);
    expect(controller.suggestions, ['One.', 'Two.', 'Three.']);
    expect(controller.errorMessage, isNull);
  });

  test('goes idle to loading to failure, keeping the message', () async {
    final request = controller.fetchSuggestions(
      occasion: 'Birthday',
      relationship: 'Friend',
    );

    api.failWithApiException('Could not reach the server.');
    await request;

    expect(observed, [SuggestionsStatus.loading, SuggestionsStatus.failure]);
    expect(controller.errorMessage, 'Could not reach the server.');
  });

  test('reports something usable even for an error it did not expect', () async {
    final request = controller.fetchSuggestions(
      occasion: 'Birthday',
      relationship: 'Friend',
    );

    api.failUnexpectedly();
    await request;

    expect(controller.status, SuggestionsStatus.failure);
    expect(controller.errorMessage, isNotNull);
    expect(controller.errorMessage, isNot(contains('StateError')));
  });

  test('clears the previous error when a new request starts', () async {
    final failed = controller.fetchSuggestions(
      occasion: 'Birthday',
      relationship: 'Friend',
    );
    api.failWithApiException('Could not reach the server.');
    await failed;

    final retried = controller.fetchSuggestions(
      occasion: 'Birthday',
      relationship: 'Friend',
    );

    expect(controller.errorMessage, isNull, reason: 'a retry should not show the old error');

    api.succeed(['One.', 'Two.', 'Three.']);
    await retried;
  });

  test('ignores a second press while a request is in flight', () async {
    final first = controller.fetchSuggestions(
      occasion: 'Birthday',
      relationship: 'Friend',
    );
    await controller.fetchSuggestions(occasion: 'Wedding', relationship: 'Colleague');

    expect(api.calls, hasLength(1));
    expect(api.calls.single.occasion, 'Birthday');

    api.succeed(['One.', 'Two.', 'Three.']);
    await first;
  });

  test('trims what the user typed before sending it', () async {
    final request = controller.fetchSuggestions(
      occasion: '  Birthday  ',
      relationship: ' Friend ',
    );

    expect(api.calls.single.occasion, 'Birthday');
    expect(api.calls.single.relationship, 'Friend');

    api.succeed(['One.', 'Two.', 'Three.']);
    await request;
  });

  test('flags a fallback answer as degraded without calling it a failure', () async {
    final request = controller.fetchSuggestions(
      occasion: 'Birthday',
      relationship: 'Friend',
    );

    api.succeed(['One.', 'Two.', 'Three.'], source: SuggestionSource.fallback);
    await request;

    expect(controller.status, SuggestionsStatus.success);
    expect(controller.isDegraded, isTrue);
  });

  test('does not flag a normal answer as degraded', () async {
    final request = controller.fetchSuggestions(
      occasion: 'Birthday',
      relationship: 'Friend',
    );

    api.succeed(['One.', 'Two.', 'Three.']);
    await request;

    expect(controller.isDegraded, isFalse);
  });
}
