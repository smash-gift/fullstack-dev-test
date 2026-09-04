import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/app/core/theme/app_colors.dart';

/// `copyWith` and `lerp` are not ours to call — Flutter calls them, when a
/// theme animates from one brightness to the other. A field forgotten in either
/// one does not throw: it silently keeps the old theme's colour while every
/// other colour moves, and the bug looks like a rendering glitch.
///
/// The list of accessors is written out once and reused, so a colour added to
/// the palette without being carried through fails here.
void main() {
  final readers = <String, Color Function(AppPalette)>{
    'ink': (p) => p.ink,
    'body': (p) => p.body,
    'muted': (p) => p.muted,
    'line': (p) => p.line,
    'sunk': (p) => p.sunk,
    'warnBackground': (p) => p.warnBackground,
    'warnLine': (p) => p.warnLine,
    'warnInk': (p) => p.warnInk,
    'errorBackground': (p) => p.errorBackground,
    'errorLine': (p) => p.errorLine,
    'errorInk': (p) => p.errorInk,
  };

  test('the two palettes differ in every single colour', () {
    for (final entry in readers.entries) {
      expect(
        entry.value(AppPalette.light),
        isNot(entry.value(AppPalette.dark)),
        reason: '${entry.key} is the same in both themes',
      );
    }
  });

  group('copyWith', () {
    test('changing nothing changes nothing', () {
      final copy = AppPalette.light.copyWith();

      for (final entry in readers.entries) {
        expect(entry.value(copy), entry.value(AppPalette.light), reason: entry.key);
      }
    });

    test('each field can be replaced on its own, and carries the rest along', () {
      const sentinel = Color(0xFF00FF95);

      final copies = <String, AppPalette>{
        'ink': AppPalette.light.copyWith(ink: sentinel),
        'body': AppPalette.light.copyWith(body: sentinel),
        'muted': AppPalette.light.copyWith(muted: sentinel),
        'line': AppPalette.light.copyWith(line: sentinel),
        'sunk': AppPalette.light.copyWith(sunk: sentinel),
        'warnBackground': AppPalette.light.copyWith(warnBackground: sentinel),
        'warnLine': AppPalette.light.copyWith(warnLine: sentinel),
        'warnInk': AppPalette.light.copyWith(warnInk: sentinel),
        'errorBackground': AppPalette.light.copyWith(errorBackground: sentinel),
        'errorLine': AppPalette.light.copyWith(errorLine: sentinel),
        'errorInk': AppPalette.light.copyWith(errorInk: sentinel),
      };

      expect(copies.keys, unorderedEquals(readers.keys));

      for (final changed in copies.entries) {
        for (final reader in readers.entries) {
          final actual = reader.value(changed.value);
          if (reader.key == changed.key) {
            expect(actual, sentinel, reason: '${changed.key} was not replaced');
          } else {
            expect(
              actual,
              reader.value(AppPalette.light),
              reason: 'copyWith(${changed.key}) also moved ${reader.key}',
            );
          }
        }
      }
    });
  });

  group('lerp', () {
    test('at 0 it is the start, at 1 it is the destination', () {
      final start = AppPalette.light.lerp(AppPalette.dark, 0);
      final end = AppPalette.light.lerp(AppPalette.dark, 1);

      for (final entry in readers.entries) {
        expect(entry.value(start), entry.value(AppPalette.light), reason: entry.key);
        expect(entry.value(end), entry.value(AppPalette.dark), reason: entry.key);
      }
    });

    test('halfway, every colour has moved', () {
      final middle = AppPalette.light.lerp(AppPalette.dark, 0.5);

      for (final entry in readers.entries) {
        expect(entry.value(middle), isNot(entry.value(AppPalette.light)), reason: entry.key);
        expect(entry.value(middle), isNot(entry.value(AppPalette.dark)), reason: entry.key);
      }
    });

    // Flutter hands `lerp` whatever extension it is holding. Anything that is
    // not ours means there is nothing to interpolate towards, and keeping the
    // current palette is the only answer that does not throw mid-frame.
    test('a foreign extension leaves the palette untouched', () {
      expect(AppPalette.light.lerp(null, 0.5), same(AppPalette.light));
    });
  });
}
