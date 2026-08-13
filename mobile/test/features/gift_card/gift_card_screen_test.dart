import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smash_gift/features/gift_card/screens/gift_card_screen.dart';

void main() {
  testWidgets('displays the chosen message and pops back to the root on restart',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: Center(
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const GiftCardScreen(message: 'Feliz aniversário, mãe!'),
                  ),
                ),
                child: const Text('open'),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();

    expect(find.text('Feliz aniversário, mãe!'), findsOneWidget);

    await tester.tap(find.widgetWithText(ElevatedButton, 'Criar outro cartão'));
    await tester.pumpAndSettle();

    expect(find.text('open'), findsOneWidget);
    expect(find.byType(GiftCardScreen), findsNothing);
  });
}
