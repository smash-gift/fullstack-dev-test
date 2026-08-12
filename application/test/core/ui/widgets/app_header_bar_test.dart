import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_app/core/ui/widgets/app_header_bar.dart';

void main() {
  Widget buildTestWidget({
    String currentLocale = 'pt',
    ValueChanged<String>? onLocaleChanged,
  }) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppHeaderBar(
          title: 'Gift Card AI',
          subtitle: 'Message Generator',
          sessionLabel: 'Guest Session #1234',
          currentLocale: currentLocale,
          onLocaleChanged: onLocaleChanged,
        ),
      ),
    );
  }

  testWidgets('AppHeaderBar renders title, subtitle, session label, and icon', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget());

    expect(find.text('Gift Card AI'), findsOneWidget);
    expect(find.text('Message Generator'), findsOneWidget);
    expect(find.text('Guest Session #1234'), findsOneWidget);
    expect(find.byIcon(Icons.card_giftcard), findsOneWidget);
    expect(find.byIcon(Icons.person_outline), findsOneWidget);
    expect(find.byIcon(Icons.language), findsOneWidget);
  });

  testWidgets('AppHeaderBar triggers onLocaleChanged when selecting another locale', (WidgetTester tester) async {
    String? changedLocale;

    await tester.pumpWidget(buildTestWidget(
      currentLocale: 'pt',
      onLocaleChanged: (val) => changedLocale = val,
    ));

    await tester.tap(find.byIcon(Icons.language));
    await tester.pumpAndSettle();

    final enOption = find.text('EN 🇺🇸').last;
    await tester.tap(enOption);
    await tester.pumpAndSettle();

    expect(changedLocale, equals('en'));
  });
}
