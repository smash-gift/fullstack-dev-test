import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_app/utils/command.dart';
import 'package:gift_card_app/utils/result.dart';

void main() {
  group('Command0', () {
    test('executes action and notifies listeners on start and finish', () async {
      final command = Command0<String>(() async {
        return Result.ok('success');
      });

      int notifyCount = 0;
      command.addListener(() {
        notifyCount++;
      });

      expect(command.running, isFalse);
      expect(command.completed, isFalse);

      final future = command.execute();
      expect(command.running, isTrue);

      await future;

      expect(command.running, isFalse);
      expect(command.completed, isTrue);
      expect(command.result?.asOk, equals('success'));
      expect(notifyCount, equals(2));
    });
  });

  group('Command1', () {
    test('passes parameter to action and stores result', () async {
      final command = Command1<int, int>((param) async {
        return Result.ok(param * 2);
      });

      await command.execute(21);

      expect(command.completed, isTrue);
      expect(command.result?.asOk, equals(42));
    });
  });
}
