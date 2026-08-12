import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_app/core/ui/widgets/app_stepper_progress.dart';

void main() {
  Widget buildTestWidget({required int currentStep}) {
    return MaterialApp(
      home: Scaffold(
        body: AppStepperProgress(
          currentStep: currentStep,
          step1Label: 'Step One',
          step2Label: 'Step Two',
          step3Label: 'Step Three',
        ),
      ),
    );
  }

  testWidgets('AppStepperProgress renders all step labels and icons', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget(currentStep: 0));

    expect(find.text('Step One'), findsOneWidget);
    expect(find.text('Step Two'), findsOneWidget);
    expect(find.text('Step Three'), findsOneWidget);
    expect(find.byIcon(Icons.chevron_right), findsNWidgets(2));
  });

  testWidgets('AppStepperProgress renders step status indicators correctly for active/done steps',
      (WidgetTester tester) async {
    // Current step 1 -> step 0 is done (showing check icon)
    await tester.pumpWidget(buildTestWidget(currentStep: 1));

    expect(find.byIcon(Icons.check), findsOneWidget);
    expect(find.text('2'), findsOneWidget);
    expect(find.text('3'), findsOneWidget);
  });
}
