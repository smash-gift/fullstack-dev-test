import 'package:flutter_test/flutter_test.dart';
import 'package:smash_gift/features/message_form/widgets/free_text_field.dart';

void main() {
  group('validateFreeText', () {
    test('rejects null, empty and whitespace-only values', () {
      expect(validateFreeText(null), isNotNull);
      expect(validateFreeText(''), isNotNull);
      expect(validateFreeText('   '), isNotNull);
    });

    test('accepts a value at the minimum length (1 character after trim)', () {
      expect(validateFreeText('a'), isNull);
    });

    test('accepts a value at the maximum length (300 characters after trim)', () {
      expect(validateFreeText('a' * 300), isNull);
    });

    test('rejects a value over the maximum length (301 characters after trim)', () {
      expect(validateFreeText('a' * 301), isNotNull);
    });

    test('trims surrounding whitespace before validating length', () {
      final valueWithPadding = '  ${'a' * 300}  ';
      expect(validateFreeText(valueWithPadding), isNull);
    });
  });
}
