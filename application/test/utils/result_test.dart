import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_app/utils/result.dart';

void main() {
  group('Result', () {
    test('Ok holds value and reports isOk == true', () {
      final result = Result.ok('hello');
      expect(result.isOk, isTrue);
      expect(result.isError, isFalse);
      expect(result.asOk, equals('hello'));
    });

    test('Error holds exception and reports isError == true', () {
      final exception = Exception('Something failed');
      final result = Result<String>.error(exception);
      expect(result.isError, isTrue);
      expect(result.isOk, isFalse);
      expect(result.asError, equals(exception));
    });
  });
}
