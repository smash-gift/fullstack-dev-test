/// Usuário autenticado, independente do provedor (hoje só Google, via FlutterFire).
class AuthUser {
  const AuthUser({required this.uid, this.displayName, this.email, this.photoUrl});

  final String uid;
  final String? displayName;
  final String? email;
  final String? photoUrl;
}

/// Lançada quando login é tentado sem uma implementação de [AuthService] configurada.
class AuthNotAvailableException implements Exception {
  const AuthNotAvailableException([
    this.message = 'Login com Google ainda não está disponível nesta versão.',
  ]);

  final String message;

  @override
  String toString() => message;
}

/// Abstração de autenticação client-side (FlutterFire + Google), consumida pela UI.
///
/// Autenticação aqui apenas identifica o usuário — nunca autoriza operações protegidas. Ver
/// `mobile/CLAUDE.md`. A implementação real (`firebase_auth` + `google_sign_in`) depende de um
/// projeto Firebase configurado (`flutterfire configure`); enquanto isso não existir, o app usa
/// [UnavailableAuthService] como stub.
abstract class AuthService {
  bool get isAvailable;

  Stream<AuthUser?> get authStateChanges;

  Future<AuthUser?> signInWithGoogle();

  Future<void> signOut();
}
