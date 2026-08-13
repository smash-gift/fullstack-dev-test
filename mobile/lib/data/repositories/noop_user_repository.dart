import 'user_repository.dart';

/// Implementação inerte de [UserRepository], usada quando o Firebase não está disponível (sem
/// projeto real configurado neste ambiente) — ver composição de dependências em `main.dart`.
///
/// Na prática nunca deveria ser chamada de fato: enquanto o Firebase não inicializa,
/// `UnavailableAuthService` nunca emite um usuário autenticado, então [AuthController] nunca
/// chama `upsertProfile`. Existe apenas para que a composição de dependências em `main.dart` não
/// precise de um valor nulo/`late` para [UserRepository].
class NoopUserRepository implements UserRepository {
  const NoopUserRepository();

  @override
  Future<void> upsertProfile({
    required String uid,
    String? displayName,
    String? email,
    String? photoUrl,
  }) async {}
}
