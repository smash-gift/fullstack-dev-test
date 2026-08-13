import '../../core/network/api_exceptions.dart';

/// Resultado da geração de mensagens, espelhando o exemplo de response em
/// `docs/contracts/api-contracts.md`: `{messages: string[]}`.
class MessageGenerationResult {
  const MessageGenerationResult({required this.messages});

  final List<String> messages;

  factory MessageGenerationResult.fromJson(Map<String, dynamic> json) {
    final rawMessages = json['messages'];
    if (rawMessages is! List) {
      throw const UnexpectedResponseException(
        'O campo "messages" está ausente ou em formato inválido na resposta do servidor.',
      );
    }

    final messages = rawMessages.map((item) => item.toString()).toList(growable: false);
    return MessageGenerationResult(messages: messages);
  }
}
