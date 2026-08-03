import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:gift_card_suggester/providers/suggestion_provider.dart';
import 'package:gift_card_suggester/screens/home_screen.dart';

Widget _buildTestApp(SuggestionProvider provider) {
  return ChangeNotifierProvider<SuggestionProvider>.value(
    value: provider,
    child: const MaterialApp(home: HomeScreen()),
  );
}

void main() {
  group('HomeScreen widget tests', () {
    testWidgets('renders input fields and submit button', (tester) async {
      final provider = SuggestionProvider();
      await tester.pumpWidget(_buildTestApp(provider));

      expect(find.text('Occasion'), findsOneWidget);
      expect(find.text('Relationship'), findsOneWidget);
      expect(find.text('Get Suggestions'), findsOneWidget);
    });

    testWidgets('shows validation errors when submitting empty fields',
        (tester) async {
      final provider = SuggestionProvider();
      await tester.pumpWidget(_buildTestApp(provider));

      await tester.tap(find.text('Get Suggestions'));
      await tester.pump();

      expect(find.text('Please enter an occasion'), findsOneWidget);
      expect(find.text('Please enter a relationship'), findsOneWidget);
    });

    testWidgets('shows idle hint on initial state', (tester) async {
      final provider = SuggestionProvider();
      await tester.pumpWidget(_buildTestApp(provider));

      expect(find.text('Your suggestions will appear here.'), findsOneWidget);
    });

    testWidgets('shows loading indicator when state is loading', (tester) async {
      final provider = SuggestionProvider();
      await tester.pumpWidget(_buildTestApp(provider));

      provider.debugSetLoadingForTest();
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsWidgets);
      expect(find.text('Generating…'), findsOneWidget);
    });

    testWidgets('shows error message when state is error', (tester) async {
      final provider = SuggestionProvider();
      await tester.pumpWidget(_buildTestApp(provider));

      provider.debugSetErrorForTest('Could not reach the server.');
      await tester.pump();

      expect(find.text('Could not reach the server.'), findsOneWidget);
    });
  });
}
