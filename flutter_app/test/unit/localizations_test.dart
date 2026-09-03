import 'dart:convert';
import 'dart:io';
import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/config/internationalization/app_localizations.dart';
import 'package:gift_card_suggester/config/internationalization/localizations_key.dart';

/// Three language files and one list of keys can drift apart in four
/// directions. This closes all of them, the same way `.env.example` is kept
/// honest against the backend's schema.
void main() {
  // Loading a language reads the asset bundle, which needs the binding.
  TestWidgetsFlutterBinding.ensureInitialized();

  Map<String, String> load(String language) {
    final raw = File('assets/lang/$language.json').readAsStringSync();
    final decoded = jsonDecode(raw) as Map<String, Object?>;
    return decoded.map((key, value) => MapEntry(key, value.toString()));
  }

  final tables = {for (final code in supportedLanguages) code: load(code)};

  test('ships the three languages the project standard asks for', () {
    expect(supportedLanguages, ['en', 'pt', 'es']);
    for (final code in supportedLanguages) {
      expect(File('assets/lang/$code.json').existsSync(), isTrue, reason: code);
    }
  });

  for (final code in supportedLanguages) {
    group(code, () {
      test('defines every key the code asks for', () {
        final missing = L.all.where((key) => !tables[code]!.containsKey(key));
        expect(missing, isEmpty);
      });

      test('defines no key the code never asks for', () {
        final extra = tables[code]!.keys.where((key) => !L.all.contains(key));
        expect(extra, isEmpty);
      });

      test('has no empty translation', () {
        final blank = tables[code]!.entries.where((entry) => entry.value.trim().isEmpty);
        expect(blank.map((entry) => entry.key), isEmpty);
      });

      /// A placeholder present in one language and missing in another means the
      /// value silently disappears for those users.
      test('carries the same placeholders as English', () {
        final placeholder = RegExp(r'\{(\w+)\}');
        for (final key in L.all) {
          final english = placeholder
              .allMatches(tables['en']![key]!)
              .map((match) => match.group(1))
              .toSet();
          final translated = placeholder
              .allMatches(tables[code]![key]!)
              .map((match) => match.group(1))
              .toSet();
          expect(translated, english, reason: '$key in $code');
        }
      });
    });
  }

  group('lookup', () {
    test('falls back to English for a language we do not ship', () async {
      await AppLocalizations.instance.load(const Locale('de'));
      expect(AppLocalizations.instance.language, 'en');
    });

    test('resolves a supported language', () async {
      await AppLocalizations.instance.load(const Locale('pt', 'BR'));
      expect(AppLocalizations.instance.language, 'pt');
    });

    /// A missing string shows as its own key, which is impossible to miss in
    /// review — unlike an empty space.
    test('returns the key when a string is missing', () {
      AppLocalizations.instance.loadForTest(const {});
      expect(tr('nothing_here'), 'nothing_here');
    });

    test('substitutes a named value', () {
      AppLocalizations.instance.loadForTest(const {'x': '{count} characters'});
      expect(tr('x').withValue('count', '48'), '48 characters');
    });
  });
}
