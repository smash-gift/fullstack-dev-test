import '../../core/network/api_client.dart';
import '../models/message_generation_request.dart';
import '../models/message_generation_result.dart';
import 'message_repository.dart';

/// Implementação de [MessageRepository] via [ApiClient].
///
/// Path confirmado em `docs/contracts/api-contracts.md`: `POST /messages` (sem sufixo `/generate`).
class HttpMessageRepository implements MessageRepository {
  HttpMessageRepository(this._apiClient);

  final ApiClient _apiClient;

  static const _generateMessagesPath = '/messages';

  @override
  Future<MessageGenerationResult> generateMessages(MessageGenerationRequest request) async {
    final json = await _apiClient.post(_generateMessagesPath, request.toJson());
    return MessageGenerationResult.fromJson(json);
  }
}
