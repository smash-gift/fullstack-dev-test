import 'dart:convert';
import 'dart:ui';

import 'package:flutter/services.dart' show rootBundle;

/// The supported languages, in fallback order. `en` is first because it is the
/// fallback for anything else.
const supportedLanguages = <String>['en', 'pt', 'es'];

/// Loads the translation table and answers lookups.
///
/// A singleton loaded once at startup rather than an `InheritedWidget`: the app
/// has one locale for its whole life — the device's — and there is no language
/// picker to change it at runtime. Wiring a full delegate would buy nothing and
/// would put a `BuildContext` requirement on code that has no widget.
class AppLocalizations {
  AppLocalizations._();

  static final AppLocalizations instance = AppLocalizations._();

  Map<String, String> _table = const {};
  String _language = 'en';

  /// Which language actually loaded, for the interface alone.
  ///
  /// Deliberately not sent to the API any more: the card follows the words the
  /// user typed, not the language of the buttons around them.
  String get language => _language;

  /// Resolves [locale] against [supportedLanguages] and loads that table.
  ///
  /// Falls back to `en` for any locale we do not ship, which is the whole
  /// reason the resolution is explicit rather than left to the asset loader.
  Future<void> load(Locale locale) async {
    _language = supportedLanguages.contains(locale.languageCode)
        ? locale.languageCode
        : supportedLanguages.first;

    final raw = await rootBundle.loadString('assets/lang/$_language.json');
    final decoded = jsonDecode(raw) as Map<String, Object?>;
    _table = decoded.map((key, value) => MapEntry(key, value.toString()));
  }

  /// Replaces the table directly. Only for tests, which must not depend on the
  /// asset bundle to assert what a widget renders.
  void loadForTest(Map<String, String> table, {String language = 'en'}) {
    _table = Map.unmodifiable(table);
    _language = language;
  }

  /// Returns the translation, or the key itself when it is missing.
  ///
  /// Returning the key is deliberate: a missing string shows up as
  /// `field_tone_label` on screen, which is impossible to miss in review — far
  /// better than an empty space nobody notices.
  String translate(String key) => _table[key] ?? key;
}

/// The call-site helper: `Text(tr(L.appTitle))`.
String tr(String key) => AppLocalizations.instance.translate(key);

/// Substitutes a single named placeholder: `tr(L.resultsLength).withValue('count', '48')`.
extension TranslationValues on String {
  String withValue(String name, String value) => replaceAll('{$name}', value);
}
