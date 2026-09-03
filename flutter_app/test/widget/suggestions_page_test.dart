import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/app/core/config/settings_store.dart';
import 'package:gift_card_suggester/app/core/drivers/http/i_http_client.dart';
import 'package:gift_card_suggester/modules/suggestions/presenter/stores/suggestions_store.dart';
import 'package:gift_card_suggester/modules/suggestions/presenter/widgets/degraded_banner.dart';
import 'package:gift_card_suggester/modules/suggestions/presenter/widgets/empty_hint.dart';
import 'package:gift_card_suggester/modules/suggestions/presenter/widgets/failure_banner.dart';
import 'package:gift_card_suggester/modules/suggestions/presenter/widgets/loading_skeleton.dart';
import 'package:gift_card_suggester/modules/suggestions/presenter/widgets/suggestion_card.dart';

import '../helpers/fake_http_client.dart';
import '../helpers/test_app.dart';

/// The five states, each pumped as the real page with the real strings.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late FakeHttpClient client;
  late SuggestionsStore store;

  setUp(() {
    loadRealStrings();
    client = FakeHttpClient();
    store = buildStore(client);
  });

  tearDown(() => store.dispose());

  Future<void> fillAndSubmit(WidgetTester tester) async {
    await tester.enterText(find.byType(TextField).first, 'birthday');
    await tester.enterText(find.byType(TextField).last, 'best friend');
    await tester.tap(find.byType(FilledButton));
  }

  testWidgets('01 idle — the form, and nothing pretending to be a result', (tester) async {
    await pumpPage(tester, store: store);

    expect(find.text('What should the card say?'), findsOneWidget);
    expect(find.text('Occasion'.toUpperCase()), findsOneWidget);
    expect(find.text('Relationship'.toUpperCase()), findsOneWidget);
    expect(find.text('Write my messages'), findsOneWidget);
    expect(find.byType(EmptyHint), findsOneWidget);
    expect(find.byType(SuggestionCard), findsNothing);
    expect(find.byType(LoadingSkeleton), findsNothing);
  });

  testWidgets('02 loading — the button says so and placeholders hold the space', (tester) async {
    client.delay = const Duration(milliseconds: 60);
    await pumpPage(tester, store: store);

    await fillAndSubmit(tester);
    await tester.pump();

    expect(find.text('Writing…'), findsOneWidget);
    expect(find.byType(LoadingSkeleton), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    // The form is locked while a request is in flight.
    expect(tester.widget<FilledButton>(find.byType(FilledButton)).onPressed, isNull);

    await tester.pumpAndSettle();
  });

  testWidgets('03 success — three cards, no banner', (tester) async {
    await pumpPage(tester, store: store);

    await fillAndSubmit(tester);
    await tester.pumpAndSettle();

    expect(find.byType(SuggestionCard), findsNWidgets(3));
    expect(find.text('Happy birthday! So glad the world got you in it.'), findsOneWidget);
    expect(find.byType(DegradedBanner), findsNothing);
    expect(find.byType(FailureBanner), findsNothing);
    // The button changes its offer once there is something to replace.
    expect(find.text('Write three more'), findsOneWidget);
  });

  testWidgets('04 degraded — the banner explains, and the messages still show', (tester) async {
    client.body = FakeHttpClient.successBody(
      texts: const ['Wishing you a wonderful day.', 'Thinking of you today.'],
      degraded: true,
      reason: 'llm_timeout',
    );
    await pumpPage(tester, store: store);

    await fillAndSubmit(tester);
    await tester.pumpAndSettle();

    expect(find.byType(DegradedBanner), findsOneWidget);
    expect(find.text('Our writer is offline right now.'), findsOneWidget);
    expect(find.byType(SuggestionCard), findsNWidgets(2));
    // A degradation is not a failure, and must not be dressed as one.
    expect(find.byType(FailureBanner), findsNothing);
  });

  testWidgets('05 error — says what happened, where, and offers a way out', (tester) async {
    client.throwing = const HttpClientException(HttpFailureReason.unreachable);
    await pumpPage(tester, store: store);

    await fillAndSubmit(tester);
    await tester.pumpAndSettle();

    expect(find.byType(FailureBanner), findsOneWidget);
    expect(find.text("Can't reach the server."), findsOneWidget);
    // The address is named, because "can't connect" without it is unactionable.
    expect(
      find.textContaining('http://localhost:3000'),
      findsOneWidget,
    );
    expect(find.text('Try again'), findsOneWidget);
    expect(find.byType(SuggestionCard), findsNothing);
  });

  testWidgets('a validation error lands under the field, not in a banner', (tester) async {
    client
      ..statusCode = 400
      ..body = FakeHttpClient.errorBody(
        'VALIDATION_ERROR',
        details: [
          {'field': 'occasion', 'issue': 'occasion must be at least 2 characters'},
        ],
      );
    await pumpPage(tester, store: store);

    await fillAndSubmit(tester);
    await tester.pumpAndSettle();

    expect(find.byType(FailureBanner), findsNothing);
    expect(find.text('Add this before we can write.'), findsOneWidget);
  });

  testWidgets('the retry in the banner sends the request again', (tester) async {
    client.throwing = const HttpClientException(HttpFailureReason.unreachable);
    await pumpPage(tester, store: store);

    await fillAndSubmit(tester);
    await tester.pumpAndSettle();
    expect(client.callCount, 1);

    client.throwing = null;
    await tester.tap(find.text('Try again'));
    await tester.pumpAndSettle();

    expect(client.callCount, 2);
    expect(find.byType(SuggestionCard), findsNWidgets(3));
    expect(find.byType(FailureBanner), findsNothing);
  });

  testWidgets('the tone the user picks is the tone that is sent', (tester) async {
    await pumpPage(tester, store: store);

    await tester.tap(find.text('Funny'));
    await tester.pump();
    await fillAndSubmit(tester);
    await tester.pumpAndSettle();

    expect(client.lastBody!['tone'], 'funny');
  });

  testWidgets('the backend address can be changed without rebuilding', (tester) async {
    final settings = SettingsStore(initialBaseUrl: 'http://localhost:3000');
    store.dispose();
    store = buildStore(client, settings: settings);
    await pumpPage(tester, store: store, settings: settings);

    await tester.tap(find.byIcon(Icons.tune_rounded));
    await tester.pumpAndSettle();
    expect(find.text('Backend address'), findsWidgets);

    final dialogField = find.descendant(
      of: find.byType(AlertDialog),
      matching: find.byType(TextField),
    );
    await tester.enterText(dialogField, 'https://api.example.com');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    await fillAndSubmit(tester);
    await tester.pumpAndSettle();

    expect(client.lastUrl.toString(), 'https://api.example.com/api/v1/suggestions');
  });

  testWidgets('a bad address is refused with a reason, and the dialog stays open', (tester) async {
    final settings = SettingsStore(initialBaseUrl: 'http://localhost:3000');
    store.dispose();
    store = buildStore(client, settings: settings);
    await pumpPage(tester, store: store, settings: settings);

    await tester.tap(find.byIcon(Icons.tune_rounded));
    await tester.pumpAndSettle();

    final dialogField = find.descendant(
      of: find.byType(AlertDialog),
      matching: find.byType(TextField),
    );
    await tester.enterText(dialogField, 'localhost:3000');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(find.textContaining('Enter a full address'), findsOneWidget);
    expect(settings.baseUrl, 'http://localhost:3000');
  });

  testWidgets('renders in the dark theme without losing anything', (tester) async {
    await pumpPage(tester, store: store, brightness: Brightness.dark);

    await fillAndSubmit(tester);
    await tester.pumpAndSettle();

    expect(find.byType(SuggestionCard), findsNWidgets(3));
    expect(tester.takeException(), isNull);
  });
}
