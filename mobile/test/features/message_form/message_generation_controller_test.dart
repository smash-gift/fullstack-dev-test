import 'package:flutter_test/flutter_test.dart';
import 'package:smash_gift/core/network/api_exceptions.dart';
import 'package:smash_gift/data/models/message_generation_request.dart';
import 'package:smash_gift/data/models/message_generation_result.dart';
import 'package:smash_gift/data/repositories/message_repository.dart';
import 'package:smash_gift/features/message_form/controller/message_generation_controller.dart';

/// Repositório falso escrito à mão, sem depender de mockito/mocktail — ver estratégia de testes
/// na spec técnica do mobile.
class _FakeMessageRepository implements MessageRepository {
  _FakeMessageRepository.success(this._result) : _error = null;
  _FakeMessageRepository.failure(Object error)
      : _error = error,
        _result = null;

  final MessageGenerationResult? _result;
  final Object? _error;
  MessageGenerationRequest? lastRequest;

  @override
  Future<MessageGenerationResult> generateMessages(MessageGenerationRequest request) async {
    lastRequest = request;
    if (_error != null) throw _error;
    return _result!;
  }
}

void main() {
  group('MessageGenerationController', () {
    test('starts in idle state', () {
      final controller = MessageGenerationController(
        _FakeMessageRepository.success(const MessageGenerationResult(messages: [])),
      );

      expect(controller.status, MessageGenerationStatus.idle);
      expect(controller.messages, isEmpty);
      expect(controller.errorMessage, isNull);
    });

    test('transitions idle -> loading -> success and stores the messages', () async {
      final repository = _FakeMessageRepository.success(
        const MessageGenerationResult(messages: ['A', 'B', 'C']),
      );
      final controller = MessageGenerationController(repository);

      final statuses = <MessageGenerationStatus>[];
      controller.addListener(() => statuses.add(controller.status));

      await controller.generate(occasion: 'birthday', relationship: 'mother');

      expect(statuses, [MessageGenerationStatus.loading, MessageGenerationStatus.success]);
      expect(controller.messages, ['A', 'B', 'C']);
      expect(controller.errorMessage, isNull);
      expect(
        repository.lastRequest,
        isA<MessageGenerationRequest>()
            .having((r) => r.occasion, 'occasion', 'birthday')
            .having((r) => r.relationship, 'relationship', 'mother'),
      );
    });

    test('transitions to error with a friendly message on NetworkException', () async {
      final controller = MessageGenerationController(
        _FakeMessageRepository.failure(const NetworkException()),
      );

      await controller.generate(occasion: 'birthday', relationship: 'mother');

      expect(controller.status, MessageGenerationStatus.error);
      expect(controller.errorMessage, contains('conectar'));
    });

    test('transitions to error with a friendly message on ServerException', () async {
      final controller = MessageGenerationController(
        _FakeMessageRepository.failure(const ServerException(500)),
      );

      await controller.generate(occasion: 'birthday', relationship: 'mother');

      expect(controller.status, MessageGenerationStatus.error);
      expect(controller.errorMessage, isNotNull);
    });

    test('generate() defaults regenerate to false', () async {
      final repository = _FakeMessageRepository.success(
        const MessageGenerationResult(messages: ['A', 'B', 'C']),
      );
      final controller = MessageGenerationController(repository);

      await controller.generate(occasion: 'birthday', relationship: 'mother');

      expect(
        repository.lastRequest,
        isA<MessageGenerationRequest>().having((r) => r.regenerate, 'regenerate', false),
      );
    });

    test('generate(regenerate: true) forwards regenerate to the request', () async {
      final repository = _FakeMessageRepository.success(
        const MessageGenerationResult(messages: ['A', 'B', 'C']),
      );
      final controller = MessageGenerationController(repository);

      await controller.generate(occasion: 'birthday', relationship: 'mother', regenerate: true);

      expect(
        repository.lastRequest,
        isA<MessageGenerationRequest>().having((r) => r.regenerate, 'regenerate', true),
      );
    });

    test('reset() clears state back to idle', () async {
      final controller = MessageGenerationController(
        _FakeMessageRepository.success(const MessageGenerationResult(messages: ['A'])),
      );

      await controller.generate(occasion: 'birthday', relationship: 'mother');
      expect(controller.status, MessageGenerationStatus.success);

      controller.reset();

      expect(controller.status, MessageGenerationStatus.idle);
      expect(controller.messages, isEmpty);
      expect(controller.errorMessage, isNull);
    });
  });
}
