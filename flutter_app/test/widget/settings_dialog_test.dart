import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/app/core/config/app_config.dart';
import 'package:gift_card_suggester/app/core/config/settings_store.dart';
import 'package:gift_card_suggester/app/core/theme/app_theme.dart';
import 'package:gift_card_suggester/modules/suggestions/presenter/widgets/settings_dialog.dart';

import '../helpers/test_app.dart';

/// The three ways out of this dialog — save, cancel, reset — plus the keyboard.
///
/// It is the only stateful widget in the presentation layer, so the paths that
/// change its state are the ones worth pinning: an evaluator retargeting a
/// running app is the whole reason it exists.
void main() {
  setUpAll(loadRealStrings);

  Future<SettingsStore> pumpDialog(
    WidgetTester tester, {
    String initial = 'http://localhost:3000',
  }) async {
    final settings = SettingsStore(initialBaseUrl: initial);

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(
          body: Builder(
            builder: (context) => TextButton(
              onPressed: () => SettingsDialog.show(context, settings),
              child: const Text('open'),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();

    return settings;
  }

  testWidgets('opens showing the address currently in use', (tester) async {
    await pumpDialog(tester, initial: 'http://10.0.2.2:3000');

    expect(_field(tester).controller?.text, 'http://10.0.2.2:3000');
  });

  testWidgets('saving a valid address stores it and closes', (tester) async {
    final settings = await pumpDialog(tester);

    await tester.enterText(find.byType(TextField), 'http://192.168.0.42:3000');
    await tester.tap(find.byType(FilledButton));
    await tester.pumpAndSettle();

    expect(settings.baseUrl, 'http://192.168.0.42:3000');
    expect(find.byType(SettingsDialog), findsNothing);
  });

  // The keyboard path is the one a person actually uses, and it went through a
  // different callback than the button.
  testWidgets('submitting from the keyboard saves, exactly like the button', (tester) async {
    final settings = await pumpDialog(tester);

    await tester.enterText(find.byType(TextField), 'http://192.168.0.7:3000');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();

    expect(settings.baseUrl, 'http://192.168.0.7:3000');
    expect(find.byType(SettingsDialog), findsNothing);
  });

  testWidgets('an unusable address keeps the dialog open and says why', (tester) async {
    final settings = await pumpDialog(tester);

    await tester.enterText(find.byType(TextField), 'not a url');
    await tester.tap(find.byType(FilledButton));
    await tester.pumpAndSettle();

    expect(settings.baseUrl, 'http://localhost:3000');
    expect(find.byType(SettingsDialog), findsOneWidget);

    expect(_field(tester).decoration?.errorText, isNotNull);
  });

  testWidgets('typing again clears the error, before saving anything', (tester) async {
    await pumpDialog(tester);

    await tester.enterText(find.byType(TextField), 'not a url');
    await tester.tap(find.byType(FilledButton));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'http://localhost:4000');
    await tester.pump();

    expect(_field(tester).decoration?.errorText, isNull);
  });

  testWidgets('cancel closes without changing the address', (tester) async {
    final settings = await pumpDialog(tester);

    await tester.enterText(find.byType(TextField), 'http://192.168.0.99:3000');
    await tester.tap(_action(1));
    await tester.pumpAndSettle();

    expect(settings.baseUrl, 'http://localhost:3000');
    expect(find.byType(SettingsDialog), findsNothing);
  });

  testWidgets('reset puts the default back, in the field and in the store', (tester) async {
    final settings = await pumpDialog(tester, initial: 'http://192.168.0.42:3000');

    await tester.tap(_action(0));
    await tester.pumpAndSettle();

    expect(settings.baseUrl, AppConfig.initialBaseUrl);
    expect(_field(tester).controller?.text, AppConfig.initialBaseUrl);
    expect(find.byType(SettingsDialog), findsOneWidget);
  });

  testWidgets('reset also clears an error left on screen', (tester) async {
    await pumpDialog(tester, initial: 'http://192.168.0.42:3000');

    await tester.enterText(find.byType(TextField), 'not a url');
    await tester.tap(find.byType(FilledButton));
    await tester.pumpAndSettle();

    await tester.tap(_action(0));
    await tester.pumpAndSettle();

    expect(_field(tester).decoration?.errorText, isNull);
  });
}

/// The reset and cancel labels come from the shipped strings, so the test reads
/// them off the rendered buttons instead of restating them and drifting.
///
/// Scoped to the dialog on purpose: the button that opens it is a `TextButton`
/// too, and counting from the whole tree made "cancel" tap "reset" - a test
/// that passed while exercising the wrong path.
Finder _action(int index) {
  return find
      .descendant(of: find.byType(AlertDialog), matching: find.byType(TextButton))
      .at(index);
}

TextField _field(WidgetTester tester) {
  return tester.widget<TextField>(
    find.descendant(of: find.byType(AlertDialog), matching: find.byType(TextField)),
  );
}
