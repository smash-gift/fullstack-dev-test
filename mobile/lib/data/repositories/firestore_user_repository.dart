import 'package:cloud_firestore/cloud_firestore.dart';

import 'user_repository.dart';

/// Implementação de [UserRepository] via Firestore direto do cliente (sem passar pelo backend) —
/// ver `docs/contracts/firestore-schema.md`.
///
/// Só deve ser instanciada depois de `Firebase.initializeApp()` ter sido bem-sucedido em
/// `main.dart`.
class FirestoreUserRepository implements UserRepository {
  FirestoreUserRepository({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  static const _usersCollection = 'users';

  @override
  Future<void> upsertProfile({
    required String uid,
    String? displayName,
    String? email,
    String? photoUrl,
  }) async {
    final docRef = _firestore.collection(_usersCollection).doc(uid);
    final snapshot = await docRef.get();

    final data = <String, dynamic>{
      'displayName': displayName,
      'email': email,
      'photoUrl': photoUrl,
      'lastLoginAt': FieldValue.serverTimestamp(),
    };

    // `createdAt` só é definido na primeira escrita (primeiro login) — ver
    // `docs/contracts/firestore-schema.md`.
    if (!snapshot.exists) {
      data['createdAt'] = FieldValue.serverTimestamp();
    }

    await docRef.set(data, SetOptions(merge: true));
  }
}
