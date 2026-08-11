import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_app/core/ui/widgets/app_chip_select.dart';

void main() {
  final options = ['Option 1', 'Option 2', 'Option 3'];

  Widget buildTestWidget({
    required String selectedOption,
    required ValueChanged<String> onSelected,
    IconData Function(String item)? iconBuilder,
  }) {
    return MaterialApp(
      home: Scaffold(
        body: AppChipSelect<String>(
          options: options,
          selectedOption: selectedOption,
          onSelected: onSelected,
          labelBuilder: (item) => item,
          iconBuilder: iconBuilder,
        ),
      ),
    );
  }

  testWidgets('AppChipSelect renders all chip labels correctly', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget(
      selectedOption: 'Option 1',
      onSelected: (_) {},
    ));

    expect(find.text('Option 1'), findsOneWidget);
    expect(find.text('Option 2'), findsOneWidget);
    expect(find.text('Option 3'), findsOneWidget);
    expect(find.byType(ChoiceChip), findsNWidgets(3));
  });

  testWidgets('AppChipSelect renders icons when iconBuilder is provided', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget(
      selectedOption: 'Option 1',
      onSelected: (_) {},
      iconBuilder: (item) => Icons.star,
    ));

    expect(find.byIcon(Icons.star), findsNWidgets(3));
  });

  testWidgets('AppChipSelect triggers onSelected callback when a chip is tapped', (WidgetTester tester) async {
    String? selected;

    await tester.pumpWidget(buildTestWidget(
      selectedOption: 'Option 1',
      onSelected: (val) => selected = val,
    ));

    await tester.tap(find.text('Option 2'));
    await tester.pump();

    expect(selected, equals('Option 2'));
  });
}
