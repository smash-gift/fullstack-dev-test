import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';

import 'package:gift_message_suggester/screens/suggester_screen.dart';
import 'package:gift_message_suggester/services/suggestion_api.dart';
import 'package:gift_message_suggester/state/suggestion_controller.dart';

/// Wraps the screen with a controller whose API client uses a mocked HTTP
/// client, so the full UI→state→api flow is exercised without a real backend.
Widget buildTestApp(http.Client mockClient) {
  final api = SuggestionApi(client: mockClient, baseUrl: 'http://test.local');
  return ChangeNotifierProvider(
    create: (_) => SuggestionController(api),
    child: MaterialApp(home: const SuggesterScreen()),
  );
}

void main() {
  testWidgets('Birthday + Friend happy path shows suggestions end-to-end', (
    tester,
  ) async {
    final mockClient = MockClient((request) async {
      return http.Response(
        jsonEncode({
          'suggestions': [
            'Happy birthday, dear friend!',
            'Wishing you a wonderful year ahead.',
          ],
          'source': 'llm',
          'degraded': false,
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    });

    await tester.pumpWidget(buildTestApp(mockClient));

    // Pick Birthday + Friend via the quick chips.
    // The screen scrolls, so bring each target into view before tapping.
    await tester.ensureVisible(find.widgetWithText(ActionChip, 'Birthday'));
    await tester.tap(find.widgetWithText(ActionChip, 'Birthday'));
    await tester.ensureVisible(find.widgetWithText(ActionChip, 'Friend'));
    await tester.tap(find.widgetWithText(ActionChip, 'Friend'));
    await tester.pump();

    await tester.ensureVisible(
      find.widgetWithText(FilledButton, 'Suggest messages'),
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Suggest messages'));
    await tester.pump(); // start loading
    await tester.pumpAndSettle(); // finish request

    expect(find.text('Happy birthday, dear friend!'), findsOneWidget);
    expect(find.text('Wishing you a wonderful year ahead.'), findsOneWidget);
  });

  testWidgets('shows a friendly error when the backend fails', (tester) async {
    final mockClient = MockClient((request) async {
      return http.Response('{"error":"internal_error"}', 500);
    });

    await tester.pumpWidget(buildTestApp(mockClient));

    // The screen scrolls, so bring each target into view before tapping.
    await tester.ensureVisible(find.widgetWithText(ActionChip, 'Birthday'));
    await tester.tap(find.widgetWithText(ActionChip, 'Birthday'));
    await tester.ensureVisible(find.widgetWithText(ActionChip, 'Friend'));
    await tester.tap(find.widgetWithText(ActionChip, 'Friend'));
    await tester.pump();

    await tester.ensureVisible(
      find.widgetWithText(FilledButton, 'Suggest messages'),
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Suggest messages'));
    await tester.pumpAndSettle();

    expect(find.textContaining('Something went wrong'), findsOneWidget);
  });

  testWidgets('validates empty inputs before calling the API', (tester) async {
    var called = false;
    final mockClient = MockClient((request) async {
      called = true;
      return http.Response('{}', 200);
    });

    await tester.pumpWidget(buildTestApp(mockClient));

    await tester.ensureVisible(
      find.widgetWithText(FilledButton, 'Suggest messages'),
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Suggest messages'));
    await tester.pumpAndSettle();

    expect(called, isFalse);
    expect(find.textContaining('fill in both'), findsOneWidget);
  });
}
