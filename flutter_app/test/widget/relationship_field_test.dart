import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/app/core/theme/app_theme.dart';
import 'package:gift_card_suggester/modules/suggestions/presenter/stores/suggestions_store.dart';
import 'package:gift_card_suggester/modules/suggestions/presenter/widgets/relationship_field.dart';

import '../helpers/fake_http_client.dart';
import '../helpers/test_app.dart';

/// The field's own error line, which is where a rejected `relationship` is
/// supposed to land — the banner deliberately stays silent for validation, so
/// if this line never renders the user is told nothing at all.
void main() {
  setUpAll(loadRealStrings);

  Future<void> pumpField(WidgetTester tester, SuggestionsStore store) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(body: RelationshipField(store: store)),
      ),
    );
  }

  TextField field(WidgetTester tester) => tester.widget<TextField>(find.byType(TextField));

  // The local check mirrors the backend's rule so the user is told at once. It
  // is also the path that reaches this error line most often, so it is pinned
  // here alongside the server's answer.
  testWidgets('an empty field is caught before any request leaves', (tester) async {
    final client = FakeHttpClient();
    final store = buildStore(client);
    store.occasionController.text = 'birthday';

    await store.submit();
    await pumpField(tester, store);

    expect(field(tester).decoration?.errorText, isNotNull);
    expect(client.callCount, 0);
  });

  testWidgets('shows no error before anything is submitted', (tester) async {
    await pumpField(tester, buildStore(FakeHttpClient()));

    expect(field(tester).decoration?.errorText, isNull);
  });

  testWidgets('shows the error when the backend rejects this field', (tester) async {
    final client = FakeHttpClient()
      ..statusCode = 400
      ..body = FakeHttpClient.errorBody(
        'VALIDATION_ERROR',
        details: [
          {'field': 'relationship', 'issue': 'relationship must be at least 2 characters'},
        ],
      );
    final store = buildStore(client);
    _fillBothFields(store);
    await store.submit();

    await pumpField(tester, store);

    expect(field(tester).decoration?.errorText, isNotNull);
  });

  // The issue text from the server is not shown. It is written for a developer,
  // and the user gets the app's own sentence in their own language instead.
  testWidgets('shows our sentence, not the backend message', (tester) async {
    final client = FakeHttpClient()
      ..statusCode = 400
      ..body = FakeHttpClient.errorBody(
        'VALIDATION_ERROR',
        details: [
          {'field': 'relationship', 'issue': 'relationship must be at least 2 characters'},
        ],
      );
    final store = buildStore(client);
    _fillBothFields(store);
    await store.submit();

    await pumpField(tester, store);

    expect(field(tester).decoration?.errorText, isNot(contains('at least 2 characters')));
  });

  testWidgets('an error on the other field leaves this one clean', (tester) async {
    final client = FakeHttpClient()
      ..statusCode = 400
      ..body = FakeHttpClient.errorBody(
        'VALIDATION_ERROR',
        details: [
          {'field': 'occasion', 'issue': 'occasion must be at least 2 characters'},
        ],
      );
    final store = buildStore(client);
    _fillBothFields(store);
    await store.submit();

    await pumpField(tester, store);

    expect(field(tester).decoration?.errorText, isNull);
  });

  testWidgets('typing clears the error without another request', (tester) async {
    final client = FakeHttpClient()
      ..statusCode = 400
      ..body = FakeHttpClient.errorBody(
        'VALIDATION_ERROR',
        details: [
          {'field': 'relationship', 'issue': 'relationship must be at least 2 characters'},
        ],
      );
    final store = buildStore(client);
    _fillBothFields(store);
    await store.submit();
    final callsAfterSubmit = client.callCount;

    await pumpField(tester, store);
    await tester.enterText(find.byType(TextField), 'best friend');
    await tester.pump();

    expect(store.fieldIssues, isEmpty);
    expect(client.callCount, callsAfterSubmit);
  });
}

/// Both fields carry a usable value, so the local check passes and the
/// backend's answer is what the test is actually observing.
void _fillBothFields(SuggestionsStore store) {
  store.occasionController.text = 'birthday';
  store.relationshipController.text = 'friend';
}
