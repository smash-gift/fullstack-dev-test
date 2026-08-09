import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/controllers/suggestions_controller.dart';
import 'package:gift_card_suggester/models/suggestion_response.dart';
import 'package:gift_card_suggester/screens/suggestions_screen.dart';
import 'package:gift_card_suggester/widgets/suggestion_card.dart';

import 'support/fake_suggestions_api.dart';

/// No Firebase and no network here: the screen takes a controller, the
/// controller takes an API, and the test supplies both.
void main() {
  late FakeSuggestionsApi api;
  late SuggestionsController controller;

  setUp(() {
    api = FakeSuggestionsApi();
    controller = SuggestionsController(api: api);
  });

  Future<void> pumpScreen(WidgetTester tester) {
    return tester.pumpWidget(
      MaterialApp(home: SuggestionsScreen(controller: controller)),
    );
  }

  Future<void> fillForm(WidgetTester tester) async {
    await tester.enterText(find.byType(TextField).first, 'Birthday');
    await tester.enterText(find.byType(TextField).last, 'Friend');
    await tester.pump();
  }

  Finder submitButton() => find.widgetWithText(FilledButton, 'Get suggestions');

  testWidgets('opens with guidance rather than an empty area', (tester) async {
    await pumpScreen(tester);

    expect(find.text('Gift Card Message Suggester'), findsOneWidget);
    expect(find.textContaining('Tell us the occasion'), findsOneWidget);
    expect(find.byType(SuggestionCard), findsNothing);
  });

  testWidgets('keeps the button disabled until both fields are filled', (tester) async {
    await pumpScreen(tester);

    expect(tester.widget<FilledButton>(submitButton()).onPressed, isNull);

    await tester.enterText(find.byType(TextField).first, 'Birthday');
    await tester.pump();
    expect(
      tester.widget<FilledButton>(submitButton()).onPressed,
      isNull,
      reason: 'one field is not enough',
    );

    await tester.enterText(find.byType(TextField).last, 'Friend');
    await tester.pump();
    expect(tester.widget<FilledButton>(submitButton()).onPressed, isNotNull);
  });

  testWidgets('shows a spinner and blocks the button while loading', (tester) async {
    await pumpScreen(tester);
    await fillForm(tester);

    await tester.tap(submitButton());
    await tester.pump();

    expect(find.byType(CircularProgressIndicator), findsWidgets);
    expect(
      tester.widget<FilledButton>(find.byType(FilledButton)).onPressed,
      isNull,
      reason: 'a second tap must not start a second request',
    );

    api.succeed(['One.', 'Two.', 'Three.']);
    await tester.pumpAndSettle();
  });

  testWidgets('lists the three suggestions on success', (tester) async {
    await pumpScreen(tester);
    await fillForm(tester);

    await tester.tap(submitButton());
    await tester.pump();
    api.succeed(['First message.', 'Second message.', 'Third message.']);
    await tester.pumpAndSettle();

    expect(find.byType(SuggestionCard), findsNWidgets(3));
    expect(find.text('First message.'), findsOneWidget);
    expect(find.text('Third message.'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });

  testWidgets('shows the error with a way to retry', (tester) async {
    await pumpScreen(tester);
    await fillForm(tester);

    await tester.tap(submitButton());
    await tester.pump();
    api.failWithApiException('Could not reach the server.');
    await tester.pumpAndSettle();

    expect(find.text('Could not reach the server.'), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);
    expect(find.byType(SuggestionCard), findsNothing);

    await tester.tap(find.text('Try again'));
    await tester.pump();

    expect(api.calls, hasLength(2), reason: 'retry sends the request again');
    api.succeed(['One.', 'Two.', 'Three.']);
    await tester.pumpAndSettle();
  });

  testWidgets('tells the user when the answers are the generic ones', (tester) async {
    await pumpScreen(tester);
    await fillForm(tester);

    await tester.tap(submitButton());
    await tester.pump();
    api.succeed(
      ['One.', 'Two.', 'Three.'],
      source: SuggestionSource.fallback,
    );
    await tester.pumpAndSettle();

    // Still a success: three usable messages, plus a quiet explanation.
    expect(find.byType(SuggestionCard), findsNWidgets(3));
    expect(find.textContaining('general messages'), findsOneWidget);
    expect(find.text('Try again'), findsNothing, reason: 'this is not an error');
  });

  testWidgets('says nothing extra when the answers are personalised', (tester) async {
    await pumpScreen(tester);
    await fillForm(tester);

    await tester.tap(submitButton());
    await tester.pump();
    api.succeed(['One.', 'Two.', 'Three.']);
    await tester.pumpAndSettle();

    expect(find.textContaining('general messages'), findsNothing);
  });
}
