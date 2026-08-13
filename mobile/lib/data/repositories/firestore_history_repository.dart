import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/history_entry.dart';
import 'history_repository.dart';

/// Implementação de [HistoryRepository] via Firestore direto do cliente (sem passar pelo
/// backend) — ver `docs/contracts/firestore-schema.md`.
///
/// Só deve ser instanciada depois de `Firebase.initializeApp()` ter sido bem-sucedido em
/// `main.dart`.
class FirestoreHistoryRepository implements HistoryRepository {
  FirestoreHistoryRepository({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  static const _usersCollection = 'users';
  static const _historySubcollection = 'history';
  static const _createdAtField = 'createdAt';

  CollectionReference<Map<String, dynamic>> _historyCollection(String uid) =>
      _firestore.collection(_usersCollection).doc(uid).collection(_historySubcollection);

  @override
  Future<void> addEntry({
    required String uid,
    required String occasion,
    required String relationship,
    required List<String> messageOptions,
    required String selectedMessage,
  }) async {
    await _historyCollection(uid).add({
      'occasion': occasion,
      'relationship': relationship,
      'messageOptions': messageOptions,
      'selectedMessage': selectedMessage,
      _createdAtField: FieldValue.serverTimestamp(),
    });
  }

  @override
  Stream<List<HistoryEntry>> watchHistory(String uid) {
    return _historyCollection(uid)
        .orderBy(_createdAtField, descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map(_mapDocument).toList(growable: false));
  }

  HistoryEntry _mapDocument(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data();
    final timestamp = data[_createdAtField];
    return HistoryEntry.fromFirestoreData(
      data,
      createdAt: timestamp is Timestamp ? timestamp.toDate() : null,
    );
  }
}
