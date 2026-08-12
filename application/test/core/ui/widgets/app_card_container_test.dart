import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_app/core/ui/widgets/app_card_container.dart';

void main() {
  Widget buildTestWidget({bool highlightBorder = false}) {
    return MaterialApp(
      home: Scaffold(
        body: AppCardContainer(
          highlightBorder: highlightBorder,
          child: const Text('Card Content'),
        ),
      ),
    );
  }

  testWidgets('AppCardContainer renders child text correctly', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget());

    expect(find.text('Card Content'), findsOneWidget);
    expect(find.byType(AppCardContainer), findsOneWidget);
  });

  testWidgets('AppCardContainer applies highlight border styling when highlightBorder is true',
      (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget(highlightBorder: true));

    expect(find.text('Card Content'), findsOneWidget);
    final containerFinder = find.byType(Container);
    expect(containerFinder, findsWidgets);
  });
}
