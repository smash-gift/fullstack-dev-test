import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_message_suggester/data/suggestions_api.dart';
import 'package:gift_message_suggester/models/suggestion_response.dart';
import 'package:gift_message_suggester/presentation/suggestion_page.dart';

class FakeSuggestionsApi implements SuggestionsApi {
  FakeSuggestionsApi({this.shouldFail = false});

  final bool shouldFail;

  @override
  Future<SuggestionResponse> requestSuggestions({
    required String occasion,
    required String relationship,
  }) async {
    if (shouldFail) {
      throw const ApiException('Backend unavailable.');
    }

    return const SuggestionResponse(
      suggestions: ['Mensagem de teste 1', 'Mensagem de teste 2'],
      source: SuggestionSource.llm,
      isFallback: false,
    );
  }
}

void main() {
  testWidgets('generates and displays suggestions', (tester) async {
    await tester.pumpWidget(
      MaterialApp(home: SuggestionPage(api: FakeSuggestionsApi())),
    );

    await tester.tap(find.text('Gerar sugestões'));
    await tester.pumpAndSettle();

    expect(find.text('Mensagem de teste 1'), findsOneWidget);
    expect(find.text('Mensagem de teste 2'), findsOneWidget);
  });

  testWidgets('shows a friendly error when the backend fails', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
          home: SuggestionPage(api: FakeSuggestionsApi(shouldFail: true))),
    );

    await tester.tap(find.text('Gerar sugestões'));
    await tester.pumpAndSettle();

    expect(find.text('Backend unavailable.'), findsOneWidget);
  });

  testWidgets('shows validation feedback for empty fields', (tester) async {
    await tester.pumpWidget(
      MaterialApp(home: SuggestionPage(api: FakeSuggestionsApi())),
    );

    await tester.enterText(find.byType(TextField).at(0), '');
    await tester.enterText(find.byType(TextField).at(1), '');
    await tester.tap(find.text('Gerar sugestões'));
    await tester.pump();

    expect(find.text('Preencha ocasião e relacionamento.'), findsOneWidget);
  });
}
