import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_message_suggester/data/suggestion_api.dart';
import 'package:gift_message_suggester/state/suggester_controller.dart';
import 'package:gift_message_suggester/ui/suggester_page.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

Widget pageWith(http.Response response, {Duration delay = Duration.zero}) {
  final controller = SuggesterController(
    api: SuggestionApi(
      client: MockClient((_) async {
        if (delay > Duration.zero) await Future<void>.delayed(delay);
        return response;
      }),
      baseUrl: 'http://test.local',
    ),
  );

  return MaterialApp(home: SuggesterPage(controller: controller));
}

http.Response jsonResponse(Map<String, dynamic> body, int status) {
  return http.Response(jsonEncode(body), status, headers: {'content-type': 'application/json'});
}

final _successBody = {
  'source': 'llm',
  'suggestions': [
    {'id': 's1', 'text': 'Happy birthday, my friend!'},
    {'id': 's2', 'text': 'Hope your day is wonderful.'},
  ],
};

Future<void> fillForm(WidgetTester tester) async {
  await tester.enterText(find.byKey(const ValueKey('occasion-field')), 'Birthday');
  await tester.enterText(find.byKey(const ValueKey('relationship-field')), 'Friend');
}

void main() {
  group('SuggesterPage', () {
    testWidgets('should show the empty hint before any request', (tester) async {
      await tester.pumpWidget(pageWith(jsonResponse(_successBody, 200)));

      expect(find.text('Tell us the occasion and who it is for.'), findsOneWidget);
    });

    testWidgets('should validate empty inputs instead of calling the backend', (tester) async {
      await tester.pumpWidget(pageWith(jsonResponse(_successBody, 200)));

      await tester.tap(find.byKey(const ValueKey('submit-button')));
      await tester.pumpAndSettle();

      expect(find.text('Please enter at least 2 characters'), findsNWidgets(2));
    });

    testWidgets('should render suggestions for the birthday and friend flow', (tester) async {
      await tester.pumpWidget(pageWith(jsonResponse(_successBody, 200)));

      await fillForm(tester);
      await tester.tap(find.byKey(const ValueKey('submit-button')));
      await tester.pumpAndSettle();

      expect(find.text('Happy birthday, my friend!'), findsOneWidget);
      expect(find.text('Hope your day is wonderful.'), findsOneWidget);
    });

    testWidgets('should show a loading indicator while the request is in flight', (tester) async {
      await tester.pumpWidget(
        pageWith(jsonResponse(_successBody, 200), delay: const Duration(milliseconds: 200)),
      );

      await fillForm(tester);
      await tester.tap(find.byKey(const ValueKey('submit-button')));
      await tester.pump();

      expect(find.text('Writing...'), findsOneWidget);
      await tester.pumpAndSettle();
    });

    testWidgets('should show the degraded notice when the backend used the fallback',
        (tester) async {
      await tester.pumpWidget(
        pageWith(
          jsonResponse(const {
            'source': 'fallback',
            'degradedReason': 'timeout',
            'suggestions': [
              {'id': 'f1', 'text': 'Wishing you all the best.'},
            ],
          }, 200),
        ),
      );

      await fillForm(tester);
      await tester.tap(find.byKey(const ValueKey('submit-button')));
      await tester.pumpAndSettle();

      expect(find.textContaining('Showing curated messages'), findsOneWidget);
      expect(find.text('Wishing you all the best.'), findsOneWidget);
    });

    testWidgets('should show an error with a retry action when the backend is unreachable',
        (tester) async {
      final controller = SuggesterController(
        api: SuggestionApi(
          client: MockClient((_) async => throw Exception('connection refused')),
          baseUrl: 'http://test.local',
        ),
      );
      await tester.pumpWidget(MaterialApp(home: SuggesterPage(controller: controller)));

      await fillForm(tester);
      await tester.tap(find.byKey(const ValueKey('submit-button')));
      await tester.pumpAndSettle();

      expect(find.textContaining('Could not reach the server'), findsOneWidget);
      expect(find.byKey(const ValueKey('retry-button')), findsOneWidget);
    });

    testWidgets('should fill the occasion field from a preset chip', (tester) async {
      await tester.pumpWidget(pageWith(jsonResponse(_successBody, 200)));

      await tester.tap(find.widgetWithText(ActionChip, 'Wedding'));
      await tester.pumpAndSettle();

      final field = tester.widget<TextFormField>(find.byKey(const ValueKey('occasion-field')));
      expect(field.controller?.text, 'Wedding');
    });
  });
}
