import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_app/core/ui/core_widgets.dart';

void main() {
  testWidgets('WidgetPreviews creates AppCardContainer preview', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WidgetPreviews.buildCardContainerPreview(highlight: true, text: 'Test Content'),
        ),
      ),
    );

    expect(find.text('Test Content'), findsOneWidget);
    expect(find.byType(AppCardContainer), findsOneWidget);
  });

  testWidgets('WidgetPreviews creates AppChipSelect preview', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WidgetPreviews.buildChipSelectPreview<String>(
            options: ['A', 'B'],
            selectedOption: 'A',
            onSelected: (_) {},
            labelBuilder: (item) => item,
          ),
        ),
      ),
    );

    expect(find.text('A'), findsOneWidget);
    expect(find.text('B'), findsOneWidget);
  });

  testWidgets('WidgetPreviews creates AppHeaderBar preview', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          appBar: WidgetPreviews.buildHeaderBarPreview() as PreferredSizeWidget,
        ),
      ),
    );

    expect(find.text('Gift Card AI'), findsOneWidget);
  });

  testWidgets('WidgetPreviews creates AppPrimaryButton preview', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WidgetPreviews.buildPrimaryButtonPreview(label: 'Test Primary'),
        ),
      ),
    );

    expect(find.text('Test Primary'), findsOneWidget);
  });

  testWidgets('WidgetPreviews creates AppSecondaryButton preview', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WidgetPreviews.buildSecondaryButtonPreview(label: 'Test Secondary'),
        ),
      ),
    );

    expect(find.text('Test Secondary'), findsOneWidget);
  });

  testWidgets('WidgetPreviews creates AppStepperProgress preview', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WidgetPreviews.buildStepperProgressPreview(currentStep: 1),
        ),
      ),
    );

    expect(find.text('Ocasião'), findsOneWidget);
    expect(find.text('Mensagem'), findsOneWidget);
  });

  testWidgets('WidgetPreviews creates AppToneBadge preview', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WidgetPreviews.buildToneBadgePreview(toneLabel: 'Engraçado'),
        ),
      ),
    );

    expect(find.text('Engraçado'), findsOneWidget);
  });
}
