import 'package:flutter/foundation.dart';

import '../../../core/network/api_exceptions.dart';
import '../../../data/models/message_generation_request.dart';
import '../../../data/repositories/message_repository.dart';

enum MessageGenerationStatus { idle, loading, success, error }

/// Estado da chamada de geração de mensagens exibida em [MessageFormScreen].
///
/// `ChangeNotifier` nativo do Flutter — ver decisão de gerenciamento de estado na spec técnica do
/// mobile (`docs/specs/2026-08-12-mobile-technical-design.md`).
class MessageGenerationController extends ChangeNotifier {
  MessageGenerationController(this._repository);

  final MessageRepository _repository;

  MessageGenerationStatus _status = MessageGenerationStatus.idle;
  List<String> _messages = const [];
  String? _errorMessage;

  MessageGenerationStatus get status => _status;
  List<String> get messages => _messages;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _status == MessageGenerationStatus.loading;

  Future<void> generate({
    required String occasion,
    required String relationship,
    bool regenerate = false,
  }) async {
    _status = MessageGenerationStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _repository.generateMessages(
        MessageGenerationRequest(
          occasion: occasion,
          relationship: relationship,
          regenerate: regenerate,
        ),
      );
      _messages = result.messages;
      _status = MessageGenerationStatus.success;
    } on NetworkException {
      _status = MessageGenerationStatus.error;
      _errorMessage = 'Não foi possível conectar. Verifique sua internet e tente novamente.';
    } on ServerException {
      _status = MessageGenerationStatus.error;
      _errorMessage = 'Algo deu errado ao gerar suas mensagens. Tente novamente em instantes.';
    } on ApiException {
      _status = MessageGenerationStatus.error;
      _errorMessage = 'Recebemos uma resposta inesperada. Tente novamente.';
    }

    notifyListeners();
  }

  /// Volta ao estado inicial. Usado após consumir um resultado de sucesso (ex.: ao navegar para a
  /// tela de opções), para que o formulário volte a ficar pronto para uma nova tentativa.
  void reset() {
    _status = MessageGenerationStatus.idle;
    _messages = const [];
    _errorMessage = null;
    notifyListeners();
  }
}
