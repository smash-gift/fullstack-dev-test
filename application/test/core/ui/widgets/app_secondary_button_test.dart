import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_app/core/ui/widgets/app_secondary_button.dart';

void main() {
  Widget buildTestWidget({
    required String label,
    VoidCallback? onPressed,
    IconData? icon,
  }) {
    return MaterialApp(
      home: Scaffold(
        body: AppSecondaryButton(
          label: label,
          onPressed: onPressed,
          icon: icon,
        ),
      ),
    );
  }

  testWidgets('AppSecondaryButton renders label and triggers tap event', (WidgetTester tester) async {
    bool tapped = false;

    await tester.pumpWidget(buildTestWidget(
      label: 'Back',
      onPressed: () => tapped = true,
    ));

    expect(find.text('Back'), findsOneWidget);

    await tester.tap(find.byType(OutlinedButton));
    await tester.pump();

    expect(tapped, isTrue);
  });

  testWidgets('AppSecondaryButton renders icon when provided', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget(
      label: 'Back',
      onPressed: () {},
      icon: Icons.arrow_back,
    ));

    expect(find.byIcon(Icons.arrow_back), findsOneWidget);
  });

  testWidgets('AppSecondaryButton is disabled when onPressed is null', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget(
      label: 'Disabled',
      onPressed: null,
    ));

    final button = tester.widget<OutlinedButton>(find.byType(OutlinedButton));
    expect(button.onPressed, isNull);
  });
}
