import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_app/core/ui/widgets/app_primary_button.dart';

void main() {
  Widget buildTestWidget({
    required String label,
    VoidCallback? onPressed,
    bool isLoading = false,
    IconData? icon,
  }) {
    return MaterialApp(
      home: Scaffold(
        body: AppPrimaryButton(
          label: label,
          onPressed: onPressed,
          isLoading: isLoading,
          icon: icon,
        ),
      ),
    );
  }

  testWidgets('AppPrimaryButton renders label and handles tap event', (WidgetTester tester) async {
    bool tapped = false;

    await tester.pumpWidget(buildTestWidget(
      label: 'Generate Suggestion',
      onPressed: () => tapped = true,
    ));

    expect(find.text('Generate Suggestion'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsNothing);

    await tester.tap(find.byType(ElevatedButton));
    await tester.pump();

    expect(tapped, isTrue);
  });

  testWidgets('AppPrimaryButton renders optional icon when provided', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget(
      label: 'Generate',
      onPressed: () {},
      icon: Icons.auto_awesome,
    ));

    expect(find.byIcon(Icons.auto_awesome), findsOneWidget);
  });

  testWidgets('AppPrimaryButton displays loading indicator and disables tap when isLoading is true',
      (WidgetTester tester) async {
    bool tapped = false;

    await tester.pumpWidget(buildTestWidget(
      label: 'Submit',
      onPressed: () => tapped = true,
      isLoading: true,
    ));

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.text('Submit'), findsNothing);

    await tester.tap(find.byType(ElevatedButton));
    await tester.pump();

    expect(tapped, isFalse);
  });

  testWidgets('AppPrimaryButton is disabled when onPressed is null', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget(
      label: 'Disabled Button',
      onPressed: null,
    ));

    final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
    expect(button.onPressed, isNull);
  });
}
