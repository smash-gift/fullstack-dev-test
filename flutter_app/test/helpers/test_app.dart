import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/app/core/config/settings_store.dart';
import 'package:gift_card_suggester/app/core/drivers/http/i_http_client.dart';
import 'package:gift_card_suggester/app/core/theme/app_theme.dart';
import 'package:gift_card_suggester/config/internationalization/app_localizations.dart';
import 'package:gift_card_suggester/modules/suggestions/domain/usecases/get_suggestions_usecase.dart';
import 'package:gift_card_suggester/modules/suggestions/external/datasources/http_suggestions_datasource.dart';
import 'package:gift_card_suggester/modules/suggestions/infra/repositories/suggestions_repository_impl.dart';
import 'package:gift_card_suggester/modules/suggestions/presenter/pages/suggestions_page.dart';
import 'package:gift_card_suggester/modules/suggestions/presenter/stores/suggestions_store.dart';

/// Loads the real English strings from disk.
///
/// Read from the shipped asset rather than a table invented in the test, so a
/// string that disappears from `en.json` breaks a widget test instead of
/// silently rendering a key.
void loadRealStrings() {
  final raw = File('assets/lang/en.json').readAsStringSync();
  final decoded = jsonDecode(raw) as Map<String, Object?>;
  AppLocalizations.instance.loadForTest(
    decoded.map((key, value) => MapEntry(key, value.toString())),
  );
}

/// Builds the store the way `Injector` does.
///
/// The first version of this helper resolved the base URL from a captured
/// string instead of the settings store, so the test that changes the address
/// in the dialog could never observe it. A helper that wires things differently
/// from production tests a system that does not ship.
SuggestionsStore buildStore(IHttpClient client, {SettingsStore? settings}) {
  final resolved = settings ?? SettingsStore(initialBaseUrl: 'http://localhost:3000');

  return SuggestionsStore(
    GetSuggestionsUseCase(
      SuggestionsRepositoryImpl(
        HttpSuggestionsDatasource(
          httpClient: client,
          baseUrlResolver: () => resolved.baseUrl,
        ),
      ),
    ),
  );
}

/// Pumps the real page, in the real theme, with the real strings.
///
/// The surface is deliberately taller than a phone. The page is a `ListView`,
/// which builds lazily, so on a short surface a card below the fold simply
/// does not exist and `findsNWidgets` reports a layout accident as a missing
/// widget. A tall viewport keeps these tests about behaviour; the layout on a
/// small screen has its own test.
Future<void> pumpPage(
  WidgetTester tester, {
  required SuggestionsStore store,
  SettingsStore? settings,
  Brightness brightness = Brightness.light,
  Size surface = const Size(430, 1800),
}) async {
  tester.view
    ..physicalSize = surface
    ..devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    MaterialApp(
      theme: brightness == Brightness.light ? AppTheme.light() : AppTheme.dark(),
      home: SuggestionsPage(
        store: store,
        settings: settings ?? SettingsStore(initialBaseUrl: 'http://localhost:3000'),
      ),
    ),
  );
}
