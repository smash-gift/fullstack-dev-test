import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:gift_message_suggester/config/app_config.dart';
import 'package:gift_message_suggester/screens/settings_screen.dart';
import 'package:gift_message_suggester/state/settings_controller.dart';

Widget _wrap(SettingsController settings, {bool isSetup = false}) {
  return ChangeNotifierProvider<SettingsController>.value(
    value: settings,
    child: MaterialApp(home: SettingsScreen(isSetup: isSetup)),
  );
}

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('setup screen pre-fills the default base URL and saves edits', (
    tester,
  ) async {
    final settings = SettingsController();
    await settings.load();
    expect(settings.isFirstRun, isTrue);

    await tester.pumpWidget(_wrap(settings, isSetup: true));

    // Base URL field comes pre-filled with the compile-time default.
    final baseUrlField = tester.widget<TextField>(find.byType(TextField).first);
    expect(baseUrlField.controller!.text, AppConfig.apiBaseUrl);

    // Edit the base URL and the token, then save.
    await tester.enterText(find.byType(TextField).first, 'http://example.test:9000');
    await tester.enterText(find.byType(TextField).at(1), 'demo-token');
    // The screen scrolls; bring the button into view before tapping.
    await tester.ensureVisible(find.widgetWithText(FilledButton, 'Get started'));
    await tester.tap(find.widgetWithText(FilledButton, 'Get started'));
    await tester.pumpAndSettle();

    expect(settings.baseUrl, 'http://example.test:9000');
    expect(settings.token, 'demo-token');
    expect(settings.isFirstRun, isFalse);
  });

  testWidgets('saved settings persist and come pre-filled on reload', (
    tester,
  ) async {
    // First controller saves values.
    final first = SettingsController();
    await first.load();
    await first.save(
      baseUrl: 'http://saved.test:8080',
      token: 'saved-token',
      tone: 'heartfelt',
    );

    // A fresh controller reads them back from persistence.
    final reloaded = SettingsController();
    await reloaded.load();
    expect(reloaded.isFirstRun, isFalse);
    expect(reloaded.baseUrl, 'http://saved.test:8080');
    expect(reloaded.token, 'saved-token');
    expect(reloaded.tone, 'heartfelt');

    await tester.pumpWidget(_wrap(reloaded));
    final baseUrlField = tester.widget<TextField>(find.byType(TextField).first);
    expect(baseUrlField.controller!.text, 'http://saved.test:8080');
  });
}
