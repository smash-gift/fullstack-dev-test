/// Uma entrada do histórico de mensagens de um usuário autenticado.
///
/// Espelha `docs/contracts/firestore-schema.md` (`users/{uid}/history/{entryId}`).
class HistoryEntry {
  const HistoryEntry({
    required this.occasion,
    required this.relationship,
    required this.messageOptions,
    required this.selectedMessage,
    required this.createdAt,
  });

  final String occasion;
  final String relationship;
  final List<String> messageOptions;
  final String selectedMessage;

  /// `null` quando o `serverTimestamp()` ainda não foi resolvido pelo servidor no momento da
  /// leitura (comum na primeira leitura otimista logo após `add`, antes do round-trip com o
  /// Firestore).
  final DateTime? createdAt;

  /// Constrói uma [HistoryEntry] a partir dos dados brutos de um documento Firestore
  /// (`doc.data()`), com `createdAt` já resolvido para `DateTime?` pelo chamador.
  ///
  /// Isolado como factory própria (em vez de inline na implementação do repositório) para poder
  /// ser testada sem depender do SDK do Firestore.
  factory HistoryEntry.fromFirestoreData(Map<String, dynamic> data, {DateTime? createdAt}) {
    final rawMessageOptions = data['messageOptions'];
    final messageOptions = rawMessageOptions is List
        ? rawMessageOptions.map((item) => item.toString()).toList(growable: false)
        : const <String>[];

    return HistoryEntry(
      occasion: data['occasion']?.toString() ?? '',
      relationship: data['relationship']?.toString() ?? '',
      messageOptions: messageOptions,
      selectedMessage: data['selectedMessage']?.toString() ?? '',
      createdAt: createdAt,
    );
  }
}
