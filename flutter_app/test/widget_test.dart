import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/data/models/suggestion_response.dart';
import 'package:gift_card_suggester/data/suggestion_api_client.dart';
import 'package:gift_card_suggester/domain/failure.dart';
import 'package:gift_card_suggester/presentation/providers/suggestion_provider.dart';
import 'package:gift_card_suggester/presentation/suggester_screen.dart';

/// Fake client that returns a canned success without any real network call.
class _SuccessClient extends SuggestionApiClient {
  _SuccessClient() : super(baseUrl: 'http://test', dio: Dio());

  @override
  Future<SuggestionResponse> fetchSuggestions({
    required String occasion,
    required String relationship,
  }) async {
    return const SuggestionResponse(
      suggestions: ['Happy birthday, friend!', 'Have a wonderful day!'],
      source: SuggestionSource.llm,
    );
  }
}

/// Fake client that always fails with a typed [Failure].
class _FailingClient extends SuggestionApiClient {
  _FailingClient() : super(baseUrl: 'http://test', dio: Dio());

  @override
  Future<SuggestionResponse> fetchSuggestions({
    required String occasion,
    required String relationship,
  }) async {
    throw const Failure(FailureKind.network, 'Could not reach the server.');
  }
}

Widget _wrap(SuggestionApiClient client) {
  return ProviderScope(
    overrides: [
      suggestionApiClientProvider.overrideWithValue(client),
    ],
    child: const MaterialApp(home: SuggesterScreen()),
  );
}

void main() {
  testWidgets('shows suggestions on a successful request', (tester) async {
    await tester.pumpWidget(_wrap(_SuccessClient()));

    await tester.enterText(find.byType(TextFormField).at(0), 'Birthday');
    await tester.enterText(find.byType(TextFormField).at(1), 'Friend');

    final button = find.text('Get suggestions');
    await tester.ensureVisible(button);
    await tester.tap(button);
    await tester.pump(); // loading frame
    await tester.pumpAndSettle(); // success frame

    expect(find.text('Happy birthday, friend!'), findsOneWidget);
    expect(find.text('Have a wonderful day!'), findsOneWidget);
  });

  testWidgets('shows an error message and a retry button on failure',
      (tester) async {
    await tester.pumpWidget(_wrap(_FailingClient()));

    await tester.enterText(find.byType(TextFormField).at(0), 'Birthday');
    await tester.enterText(find.byType(TextFormField).at(1), 'Friend');

    final button = find.text('Get suggestions');
    await tester.ensureVisible(button);
    await tester.tap(button);
    await tester.pump();
    await tester.pumpAndSettle();

    expect(find.text('Could not reach the server.'), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);
  });

  testWidgets('validates empty inputs before requesting', (tester) async {
    await tester.pumpWidget(_wrap(_SuccessClient()));

    final button = find.text('Get suggestions');
    await tester.ensureVisible(button);
    await tester.tap(button);
    await tester.pumpAndSettle();

    expect(find.text('Please enter occasion.'), findsOneWidget);
    expect(find.text('Please enter relationship.'), findsOneWidget);
  });

  testWidgets('copies a suggestion to the clipboard', (tester) async {
    // Capture the platform clipboard call without touching a real clipboard.
    final copied = <String>[];
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      (call) async {
        if (call.method == 'Clipboard.setData') {
          final args = call.arguments as Map<dynamic, dynamic>;
          copied.add(args['text'] as String);
        }
        return null;
      },
    );
    addTearDown(
      () => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        SystemChannels.platform,
        null,
      ),
    );

    await tester.pumpWidget(_wrap(_SuccessClient()));
    await tester.enterText(find.byType(TextFormField).at(0), 'Birthday');
    await tester.enterText(find.byType(TextFormField).at(1), 'Friend');

    final button = find.text('Get suggestions');
    await tester.ensureVisible(button);
    await tester.tap(button);
    await tester.pumpAndSettle();

    final copyButton = find.byIcon(Icons.copy_outlined).first;
    await tester.ensureVisible(copyButton);
    await tester.tap(copyButton);
    await tester.pump();

    expect(copied, contains('Happy birthday, friend!'));
    expect(find.text('Message copied to clipboard'), findsOneWidget);

    // Let the "copied" reset timer and snackbar finish so no timer outlives
    // the test tree.
    await tester.pumpAndSettle(const Duration(seconds: 3));
  });
}
