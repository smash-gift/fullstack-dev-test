import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/modules/suggestions/presenter/stores/suggestions_store.dart';

import '../helpers/fake_http_client.dart';
import '../helpers/test_app.dart';

/// Layout, on the screens this app actually meets.
///
/// Flutter reports an overflow by painting a yellow stripe and recording an
/// exception; `tester.takeException()` is how a test catches that instead of a
/// human noticing it in a screenshot.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late FakeHttpClient client;
  late SuggestionsStore store;

  setUp(() {
    loadRealStrings();
    client = FakeHttpClient();
    store = buildStore(client);
  });

  tearDown(() => store.dispose());

  /// 320 is the narrowest phone still in use (iPhone SE 1st gen); 1440 is a
  /// desktop browser, where the risk is the opposite one — a form stretched
  /// across the window until it stops being readable.
  const surfaces = <String, Size>{
    'iPhone SE, 320 wide': Size(320, 900),
    'a typical phone, 390 wide': Size(390, 844),
    'a tablet, 834 wide': Size(834, 1112),
    'a desktop browser, 1440 wide': Size(1440, 900),
  };

  surfaces.forEach((label, size) {
    testWidgets('the idle screen fits on $label', (tester) async {
      await pumpPage(tester, store: store, surface: size);

      expect(tester.takeException(), isNull);
    });

    testWidgets('the results fit on $label', (tester) async {
      await pumpPage(tester, store: store, surface: size);

      await tester.enterText(find.byType(TextField).first, 'birthday');
      await tester.enterText(find.byType(TextField).last, 'best friend');
      await tester.tap(find.byType(FilledButton));
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
    });
  });

  testWidgets('a very long suggestion wraps rather than overflowing', (tester) async {
    client.body = FakeHttpClient.successBody(
      texts: const [
        'Wishing you the kind of birthday that you will still be telling '
            'stories about years from now, surrounded by every single person '
            'who has ever made you laugh until it actually hurt a little.',
        'Short one.',
      ],
    );
    await pumpPage(tester, store: store, surface: const Size(320, 1200));

    await tester.enterText(find.byType(TextField).first, 'birthday');
    await tester.enterText(find.byType(TextField).last, 'best friend');
    await tester.tap(find.byType(FilledButton));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
  });

  /// A card message stretched across a 1440px window stops being readable, so
  /// the content is capped and centred rather than filling the viewport.
  testWidgets('the form does not stretch across a desktop window', (tester) async {
    await pumpPage(tester, store: store, surface: const Size(1440, 900));

    final button = tester.getSize(find.byType(FilledButton));

    expect(button.width, lessThanOrEqualTo(460));
  });

  /// The tone chips are the row most likely to run out of room.
  testWidgets('the tone chips wrap on a narrow screen instead of overflowing', (tester) async {
    await pumpPage(tester, store: store, surface: const Size(320, 900));

    expect(find.text('Warm'), findsOneWidget);
    expect(find.text('Heartfelt'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
