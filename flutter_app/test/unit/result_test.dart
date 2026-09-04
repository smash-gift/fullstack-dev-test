import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/app/core/result/result.dart';

/// The one type that crosses every layer. Its whole job is to make a caller
/// deal with the failure before it can read the payload, so both sides of
/// every accessor are exercised here — an accessor that is only ever tested on
/// its happy side is exactly how a `null` reaches a screen.
void main() {
  const success = Success<int, String>(42);
  const failure = Failure<int, String>('llm_unavailable');

  group('which side am I on', () {
    test('a success knows it succeeded', () {
      expect(success.isSuccess, isTrue);
      expect(success.isFailure, isFalse);
    });

    test('a failure knows it failed', () {
      expect(failure.isFailure, isTrue);
      expect(failure.isSuccess, isFalse);
    });
  });

  group('reading the value', () {
    test('a success carries its value and no failure', () {
      expect(success.successOrNull, 42);
      expect(success.failureOrNull, isNull);
    });

    test('a failure carries its failure and no value', () {
      expect(failure.failureOrNull, 'llm_unavailable');
      expect(failure.successOrNull, isNull);
    });

    test('the value is reachable directly when the branch is known', () {
      expect(const Success<int, String>(7).value, 7);
      expect(const Failure<int, String>('boom').failure, 'boom');
    });
  });

  group('fold', () {
    test('runs the success branch, and only that one', () {
      var failureRan = false;

      final folded = success.fold(
        (value) => 'ok:$value',
        (_) {
          failureRan = true;
          return 'never';
        },
      );

      expect(folded, 'ok:42');
      expect(failureRan, isFalse);
    });

    test('runs the failure branch, and only that one', () {
      var successRan = false;

      final folded = failure.fold(
        (_) {
          successRan = true;
          return 'never';
        },
        (reason) => 'failed:$reason',
      );

      expect(folded, 'failed:llm_unavailable');
      expect(successRan, isFalse);
    });

    test('can change the type on the way out', () {
      expect(success.fold<int>((value) => value * 2, (_) => -1), 84);
      expect(failure.fold<int>((value) => value * 2, (_) => -1), -1);
    });
  });

  test('a nullable success value is not mistaken for a failure', () {
    const empty = Success<String?, String>(null);

    expect(empty.isSuccess, isTrue);
    expect(empty.successOrNull, isNull);
    expect(empty.failureOrNull, isNull);
  });
}
