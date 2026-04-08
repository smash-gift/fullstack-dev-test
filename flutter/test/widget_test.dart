import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:giftmsg/main.dart';
import 'package:giftmsg/services/suggestion_service.dart';

class IdleSuggestionService extends SuggestionService {}

void main() {
  testWidgets('Tela principal renderiza estado inicial', (WidgetTester tester) async {
    await tester.pumpWidget(GiftMsgApp(service: IdleSuggestionService()));

    expect(find.text('Mensagens para Cartões-Presente'), findsOneWidget);
    expect(find.text('OCASIÃO'), findsOneWidget);
    expect(find.text('RELACIONAMENTO'), findsOneWidget);
    expect(find.text('Gerar Sugestões'), findsOneWidget);

    final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
    expect(button.onPressed, isNull);
  });
}
