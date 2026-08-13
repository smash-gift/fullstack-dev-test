import 'package:flutter_test/flutter_test.dart';
import 'package:smash_gift/core/network/api_exceptions.dart';
import 'package:smash_gift/data/models/message_generation_result.dart';

void main() {
  group('MessageGenerationResult.fromJson', () {
    test('parses a valid payload', () {
      final result = MessageGenerationResult.fromJson({
        'messages': ['Feliz aniversário!', 'Parabéns!', 'Que seu dia seja incrível!'],
      });

      expect(result.messages, [
        'Feliz aniversário!',
        'Parabéns!',
        'Que seu dia seja incrível!',
      ]);
    });

    test('parses an empty list of messages', () {
      final result = MessageGenerationResult.fromJson({'messages': <String>[]});
      expect(result.messages, isEmpty);
    });

    test('throws UnexpectedResponseException when "messages" is missing', () {
      expect(
        () => MessageGenerationResult.fromJson({}),
        throwsA(isA<UnexpectedResponseException>()),
      );
    });

    test('throws UnexpectedResponseException when "messages" is not a list', () {
      expect(
        () => MessageGenerationResult.fromJson({'messages': 'not-a-list'}),
        throwsA(isA<UnexpectedResponseException>()),
      );
    });
  });
}
