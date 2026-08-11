import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_app/core/ui/widgets/app_tone_badge.dart';

void main() {
  Widget buildTestWidget({required String toneLabel}) {
    return MaterialApp(
      home: Scaffold(
        body: AppToneBadge(toneLabel: toneLabel),
      ),
    );
  }

  testWidgets('AppToneBadge renders tone text and icon', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget(toneLabel: 'Carinhoso'));

    expect(find.text('Carinhoso'), findsOneWidget);
    expect(find.byIcon(Icons.auto_awesome), findsOneWidget);
  });
}
