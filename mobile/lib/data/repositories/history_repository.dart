import '../models/history_entry.dart';

/// Abstração de acesso ao histórico de mensagens do usuário autenticado no Firestore.
///
/// Espelha `docs/contracts/firestore-schema.md` (`users/{uid}/history/{entryId}`). Existe como
/// interface para permitir testar [HistoryController] e as telas com uma implementação falsa,
/// sem depender do SDK real do Firestore — mesmo padrão de
/// [MessageRepository]/[HttpMessageRepository].
abstract class HistoryRepository {
  /// Grava uma entrada em `users/{uid}/history` (`add`, criação apenas).
  Future<void> addEntry({
    required String uid,
    required String occasion,
    required String relationship,
    required List<String> messageOptions,
    required String selectedMessage,
  });

  /// Stream do histórico de `users/{uid}/history`, ordenado por `createdAt` desc.
  Stream<List<HistoryEntry>> watchHistory(String uid);
}
