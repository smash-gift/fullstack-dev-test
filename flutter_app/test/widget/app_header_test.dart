import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/app/core/theme/app_theme.dart';
import 'package:gift_card_suggester/modules/suggestions/presenter/widgets/app_header.dart';

import '../helpers/test_app.dart';

/// The brand mark in the header.
///
/// It used to be a gradient square drawn by hand, from before the app had an
/// icon — so the header showed one brand and the home screen another. These
/// hold it to the real asset, because "the icon is wrong" is exactly the kind
/// of regression that survives a green suite and is only caught by looking.
void main() {
  setUpAll(loadRealStrings);

  Future<void> pumpHeader(WidgetTester tester, {VoidCallback? onOpenSettings}) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(
          body: AppHeader(onOpenSettings: onOpenSettings ?? () {}),
        ),
      ),
    );
  }

  testWidgets('shows the real launcher icon, not a drawn stand-in', (tester) async {
    await pumpHeader(tester);

    final image = tester.widget<Image>(find.byType(Image));
    final provider = image.image as AssetImage;

    expect(provider.assetName, 'assets/brand/app_icon.png');
  });

  testWidgets('keeps the mark at the size the header was laid out for', (tester) async {
    await pumpHeader(tester);

    final image = tester.widget<Image>(find.byType(Image));

    expect(image.width, 24);
    expect(image.height, 24);
  });

  testWidgets('leaves the mark out of the semantics tree', (tester) async {
    // The title next to it already says the app's name. Announcing both makes
    // a screen reader repeat itself.
    await pumpHeader(tester);

    final image = tester.widget<Image>(find.byType(Image));

    expect(image.excludeFromSemantics, isTrue);
  });

  testWidgets('still opens the settings dialog from the header', (tester) async {
    var opened = 0;
    await pumpHeader(tester, onOpenSettings: () => opened += 1);

    await tester.tap(find.byType(IconButton));
    await tester.pump();

    expect(opened, 1);
  });
}
