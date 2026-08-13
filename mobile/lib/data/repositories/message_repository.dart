import '../models/message_generation_request.dart';
import '../models/message_generation_result.dart';

/// Abstração da fonte de mensagens geradas, usada pelos controllers/telas.
///
/// Existe como interface para permitir testar `MessageGenerationController` com uma
/// implementação falsa, sem depender de HTTP real.
abstract class MessageRepository {
  Future<MessageGenerationResult> generateMessages(MessageGenerationRequest request);
}
