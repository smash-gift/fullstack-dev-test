import '../models/history_entry.dart';
import 'history_repository.dart';

/// Implementação inerte de [HistoryRepository], usada quando o Firebase não está disponível (sem
/// projeto real configurado neste ambiente) — ver composição de dependências em `main.dart`.
///
/// `watchHistory` devolve um stream vazio (nunca emite) em vez de lançar erro, para que
/// [HistoryScreen] nunca seja alcançável de fato nesse cenário (o botão "Histórico" só aparece
/// para usuário autenticado, e sem Firebase não há autenticação real).
class NoopHistoryRepository implements HistoryRepository {
  const NoopHistoryRepository();

  @override
  Future<void> addEntry({
    required String uid,
    required String occasion,
    required String relationship,
    required List<String> messageOptions,
    required String selectedMessage,
  }) async {}

  @override
  Stream<List<HistoryEntry>> watchHistory(String uid) => const Stream.empty();
}
