import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:giftmsg/app/gift_msg_app.dart';
import 'package:giftmsg/features/suggestions/data/suggestion_service.dart';

class FakeSuggestionService extends SuggestionService {
  FakeSuggestionService(this._handler);

  final Future<List<String>> Function({
    required String occasion,
    required String relationship,
  }) _handler;

  @override
  Future<List<String>> getSuggestions({
    required String occasion,
    required String relationship,
  }) {
    return _handler(occasion: occasion, relationship: relationship);
  }
}

void main() {
  group('MainScreen Widget', () {
    testWidgets('Fluxo de sucesso exibe sugestões', (WidgetTester tester) async {
      final completer = Completer<List<String>>();
      final fakeService = FakeSuggestionService(({
        required String occasion,
        required String relationship,
      }) {
        expect(occasion, 'aniversario');
        expect(relationship, 'amigo');
        return completer.future;
      });

      await tester.pumpWidget(GiftMsgApp(service: fakeService));

      await tester.tap(find.text('Aniversário'));
      await tester.pump();
      await tester.tap(find.text('Amigo(a)'));
      await tester.pump();
      await tester.tap(find.text('Gerar Sugestões'));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(
        find.textContaining('buscamos sugestões personalizadas'),
        findsOneWidget,
      );

      completer.complete(['Sugestão 1', 'Sugestão 2']);
      await tester.pumpAndSettle();

      expect(find.text('Sugestão 1'), findsOneWidget);
      expect(find.text('Sugestão 2'), findsOneWidget);
      expect(
        find.textContaining('buscamos sugestões personalizadas'),
        findsNothing,
      );
    });

    testWidgets('Fluxo de erro exibe mensagem de erro', (WidgetTester tester) async {
      final fakeService = FakeSuggestionService(({
        required String occasion,
        required String relationship,
      }) async {
        throw Exception('Erro ao buscar sugestões');
      });

      await tester.pumpWidget(GiftMsgApp(service: fakeService));

      await tester.tap(find.text('Aniversário'));
      await tester.pump();
      await tester.tap(find.text('Amigo(a)'));
      await tester.pump();
      await tester.tap(find.text('Gerar Sugestões'));
      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.textContaining('Erro ao buscar'), findsOneWidget);
    });
  });
}
