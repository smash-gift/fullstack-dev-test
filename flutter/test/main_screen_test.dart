import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:giftmsg/main.dart';
import 'package:giftmsg/services/suggestion_service.dart';
import 'package:mockito/mockito.dart';
import 'package:provider/provider.dart';

// Mock do SuggestionService
class MockSuggestionService extends Mock implements SuggestionService {}

void main() {
  group('MainScreen Widget', () {
    testWidgets('Fluxo de sucesso exibe sugestões', (WidgetTester tester) async {
      // Mock do serviço
      final mockService = MockSuggestionService();
      when(mockService.getSuggestions(occasion: anyNamed('occasion'), relationship: anyNamed('relationship')))
          .thenAnswer((_) async => ['Sugestão 1', 'Sugestão 2']);

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) => Provider<SuggestionService>.value(
              value: mockService,
              child: const MyApp(),
            ),
          ),
        ),
      );

      // Seleciona ocasião e relacionamento (ajuste conforme widgets reais)
      await tester.enterText(find.byType(TextField).at(0), 'aniversario');
      await tester.enterText(find.byType(TextField).at(1), 'amigo');
      await tester.tap(find.text('Buscar sugestões'));
      await tester.pump(); // inicia loading
      await tester.pump(const Duration(seconds: 1)); // simula resposta

      expect(find.text('Sugestão 1'), findsOneWidget);
      expect(find.text('Sugestão 2'), findsOneWidget);
    });

    testWidgets('Fluxo de erro exibe mensagem de erro', (WidgetTester tester) async {
      final mockService = MockSuggestionService();
      when(mockService.getSuggestions(occasion: anyNamed('occasion'), relationship: anyNamed('relationship')))
          .thenThrow(Exception('Erro ao buscar sugestões'));

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) => Provider<SuggestionService>.value(
              value: mockService,
              child: const MyApp(),
            ),
          ),
        ),
      );

      await tester.enterText(find.byType(TextField).at(0), 'aniversario');
      await tester.enterText(find.byType(TextField).at(1), 'amigo');
      await tester.tap(find.text('Buscar sugestões'));
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));

      expect(find.textContaining('Erro ao buscar'), findsOneWidget);
    });
  });
}
