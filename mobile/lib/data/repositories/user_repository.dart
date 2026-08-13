/// Abstração de upsert do perfil do usuário autenticado em `users/{uid}` (Firestore).
///
/// Espelha `docs/contracts/firestore-schema.md`. Existe como interface (em vez de depender
/// diretamente de `cloud_firestore`) para permitir testar [AuthController] com uma implementação
/// falsa — mesmo padrão de [MessageRepository]/[HttpMessageRepository]. Recebe campos primitivos
/// (em vez do tipo `AuthUser` de `features/auth`) para que a camada `data/` não precise depender
/// da camada `features/`.
abstract class UserRepository {
  Future<void> upsertProfile({
    required String uid,
    String? displayName,
    String? email,
    String? photoUrl,
  });
}
