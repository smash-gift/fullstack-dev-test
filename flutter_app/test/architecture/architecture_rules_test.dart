import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// The rules this project states about itself, checked by machine.
///
/// Three of these close items that phase 06 deliberately left unticked because
/// no Flutter project existed to verify them. Marking them done back then would
/// have been claiming a check that never happened.
void main() {
  final libFiles = Directory('lib')
      .listSync(recursive: true)
      .whereType<File>()
      .where((file) => file.path.endsWith('.dart'))
      .toList();

  String read(File file) => file.readAsStringSync();

  /// Source with comments removed.
  ///
  /// The first version of these rules matched raw text and failed on four of
  /// this project's own doc comments — the entity that says "it has no
  /// `toJson`", the manifest that says "note what is NOT here". A rule about
  /// what the code does has to read the code, not the prose around it.
  String code(File file) => _stripDartComments(read(file));

  test('finds source files, so a broken glob cannot pass silently', () {
    expect(libFiles.length, greaterThan(20));
  });

  group('R1 — a replaceable package is reachable from one file', () {
    test('package:http is imported by exactly one file', () {
      final importers = libFiles
          .where((file) => read(file).contains("import 'package:http/"))
          .map((file) => file.path)
          .toList();

      expect(importers, [
        'lib/app/core/drivers/http/http_client_adapter.dart',
        'lib/app/injector.dart',
      ]);
    });

    test('no layer below the composition root touches the package', () {
      final offenders = libFiles
          .where((file) => !file.path.contains('http_client_adapter'))
          .where((file) => !file.path.endsWith('injector.dart'))
          .where((file) => code(file).contains("import 'package:http/"))
          .map((file) => file.path);

      expect(offenders, isEmpty);
    });
  });

  group('R2 — pages compose, they do not declare widgets', () {
    final pages = libFiles.where((file) => file.path.contains('/pages/'));

    test('finds the pages it is meant to check', () {
      expect(pages, isNotEmpty);
    });

    test('no page declares a widget class', () {
      for (final page in pages) {
        final content = read(page);
        final declarations = RegExp(
          r'class\s+\w+\s+extends\s+(StatelessWidget|StatefulWidget|State<)',
        ).allMatches(content);
        // Exactly one: the page itself.
        expect(declarations.length, 1, reason: page.path);
      }
    });

    test('no page has a _buildSomething method', () {
      for (final page in pages) {
        expect(RegExp(r'Widget\s+_build\w*\(').hasMatch(read(page)), isFalse, reason: page.path);
      }
    });

    test('no page calls setState', () {
      for (final page in pages) {
        expect(read(page).contains('setState('), isFalse, reason: page.path);
      }
    });
  });

  group('R3 — an entity arrives, a DTO departs', () {
    test('no entity can serialise itself', () {
      final entities = libFiles.where((file) => file.path.contains('/entities/'));
      expect(entities, isNotEmpty);
      for (final entity in entities) {
        expect(code(entity).contains('toJson'), isFalse, reason: entity.path);
      }
    });

    test('no DTO can deserialise itself', () {
      final dtos = libFiles.where((file) => file.path.contains('/dtos/'));
      expect(dtos, isNotEmpty);
      for (final dto in dtos) {
        expect(code(dto).contains('fromJson'), isFalse, reason: dto.path);
      }
    });
  });

  group('the dependency arrows point inward', () {
    test('the domain knows nothing about infra, external or presenter', () {
      final domain = libFiles.where((file) => file.path.contains('/domain/'));
      expect(domain, isNotEmpty);

      for (final file in domain) {
        final content = code(file);
        for (final forbidden in ['/infra/', '/external/', '/presenter/']) {
          expect(content.contains(forbidden), isFalse, reason: '${file.path} -> $forbidden');
        }
      }
    });

    test('the domain does not import Flutter widgets', () {
      final domain = libFiles.where((file) => file.path.contains('/domain/'));
      for (final file in domain) {
        expect(code(file).contains('package:flutter/'), isFalse, reason: file.path);
      }
    });

    test('the store never reaches into infra or external', () {
      final stores = libFiles.where((file) => file.path.contains('/stores/'));
      expect(stores, isNotEmpty);
      for (final file in stores) {
        expect(code(file).contains('/infra/'), isFalse, reason: file.path);
        expect(code(file).contains('/external/'), isFalse, reason: file.path);
      }
    });
  });

  group('security — layer 4 of the prompt-injection defence', () {
    /// The backend's output guard rejects URLs and markup. This is the second
    /// line: anything that ever escapes it must be displayed, not tappable.
    test('no widget that interprets markup is anywhere in the project', () {
      final pubspec = File('pubspec.yaml').readAsStringSync();
      for (final package in [
        'flutter_html',
        'flutter_markdown',
        'flutter_linkify',
        'url_launcher',
        'webview_flutter',
      ]) {
        expect(pubspec.contains(package), isFalse, reason: package);
      }

      for (final file in libFiles) {
        final content = code(file);
        for (final symbol in ['Html(', 'Markdown(', 'Linkify(', 'SelectableLinkify']) {
          expect(content.contains(symbol), isFalse, reason: '${file.path} -> $symbol');
        }
      }
    });

    test('the suggestion card renders with Text and nothing else', () {
      final card = File(
        'lib/modules/suggestions/presenter/widgets/suggestion_card.dart',
      ).readAsStringSync();

      expect(card.contains('Text(suggestion.text'), isTrue);
      expect(card.contains('RichText'), isFalse);
      expect(card.contains('TextSpan'), isFalse);
    });
  });

  group('security — no credential lives in this app', () {
    test('nothing in lib looks like an API key', () {
      final pattern = RegExp(
        r'sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|sk-or-v1-[A-Za-z0-9]{20,}|AQ\.[A-Za-z0-9]{20,}',
      );
      final offenders = libFiles
          .where((file) => pattern.hasMatch(read(file)))
          .map((file) => file.path);

      expect(offenders, isEmpty);
    });

    test('nothing in lib even names a credential', () {
      final pattern = RegExp(
        r'\b(apiKey|api_key|secret|bearer|authorization)\b',
        caseSensitive: false,
      );
      final offenders = libFiles
          .where((file) => pattern.hasMatch(code(file)))
          .map((file) => file.path);

      expect(offenders, isEmpty);
    });

    test('the app knows an address and nothing more', () {
      final config = File('lib/app/core/config/app_config.dart').readAsStringSync();
      expect(config.contains('API_BASE_URL'), isTrue);
      expect(RegExp('KEY|TOKEN|SECRET').hasMatch(config), isFalse);
    });
  });

  group('security — cleartext HTTP is confined to debug builds', () {
    test('the Android release manifest permits no cleartext', () {
      final manifest = _stripXmlComments(
        File('android/app/src/main/AndroidManifest.xml').readAsStringSync(),
      );

      expect(manifest.contains('usesCleartextTraffic'), isFalse);
      expect(manifest.contains('networkSecurityConfig'), isFalse);
      // A network client that ships without this permission installs fine and
      // then fails every request.
      expect(manifest.contains('android.permission.INTERNET'), isTrue);
    });

    test('the Android cleartext exception exists only under src/debug', () {
      expect(
        File('android/app/src/debug/res/xml/network_security_config.xml').existsSync(),
        isTrue,
      );
      expect(
        File('android/app/src/main/res/xml/network_security_config.xml').existsSync(),
        isFalse,
      );
      expect(
        File(
          'android/app/src/debug/AndroidManifest.xml',
        ).readAsStringSync().contains('networkSecurityConfig'),
        isTrue,
      );
    });

    test('the iOS release plist carries no ATS exception', () {
      final plist = _stripXmlComments(File('ios/Runner/Info.plist').readAsStringSync());

      expect(plist.contains('NSAppTransportSecurity'), isFalse);
      expect(plist.contains('NSAllowsArbitraryLoads'), isFalse);
    });

    /// Two plists can drift. This asserts the only thing that differs is the
    /// exception itself — the same reasoning that guards `.env.example`
    /// against the backend's schema.
    test('the two iOS plists differ only by the ATS block', () {
      final release = _stripXmlComments(File('ios/Runner/Info.plist').readAsStringSync());
      final debug = _stripXmlComments(File('ios/Runner/Info-Debug.plist').readAsStringSync());

      expect(debug.contains('NSAllowsLocalNetworking'), isTrue);
      // Never the blanket exception, not even in debug.
      expect(debug.contains('NSAllowsArbitraryLoads'), isFalse);

      // Remove the exception from the debug copy; what is left must be the
      // release file, byte for byte.
      final withoutAts = debug.replaceFirst(
        RegExp(r'\s*<key>NSAppTransportSecurity</key>\s*<dict>[\s\S]*?</dict>'),
        '',
      );
      expect(_squashBlankLines(withoutAts), _squashBlankLines(release));
    });

    test('each build configuration is pinned to its own plist', () {
      final project = File('ios/Runner.xcodeproj/project.pbxproj').readAsStringSync();

      expect(
        RegExp(
          RegExp.escape('INFOPLIST_FILE = Runner/Info-Debug.plist;'),
        ).allMatches(project).length,
        1,
      );
      expect(project.contains('INFOPLIST_FILE = Runner/Info.plist;'), isTrue);
    });
  });
}

String _stripDartComments(String source) {
  return source
      .replaceAll(RegExp(r'/\*[\s\S]*?\*/'), '')
      .split('\n')
      .map((line) {
        final index = line.indexOf('//');
        return index == -1 ? line : line.substring(0, index);
      })
      .join('\n');
}

String _stripXmlComments(String source) => source.replaceAll(RegExp(r'<!--[\s\S]*?-->'), '');

/// Stripping comments leaves blank lines behind; they are not a difference
/// worth failing over.
String _squashBlankLines(String source) =>
    source.split('\n').where((line) => line.trim().isNotEmpty).join('\n');
