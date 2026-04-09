import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:giftmsg/app/gift_msg_app.dart';
import 'package:giftmsg/features/suggestions/data/suggestion_service.dart';
import 'package:giftmsg/features/suggestions/presentation/widgets/occasion_selector.dart';
import 'package:giftmsg/features/suggestions/presentation/widgets/relationship_selector.dart';

class IdleSuggestionService extends SuggestionService {}

void main() {
  testWidgets('Tela principal renderiza estado inicial', (WidgetTester tester) async {
    await tester.pumpWidget(GiftMsgApp(service: IdleSuggestionService()));

    expect(find.text('GiftMsg'), findsOneWidget);
    expect(find.text('OCASIÃO'), findsOneWidget);
    expect(find.textContaining('relacionamento'), findsOneWidget);
    expect(find.text('Gerar Sugestões'), findsOneWidget);
    expect(find.byType(OccasionSelector), findsOneWidget);
    expect(find.byType(RelationshipSelector), findsOneWidget);

    final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
    expect(button.onPressed, isNull);
  });
}
