import 'auth_service.dart';

/// Implementação stub de [AuthService], usada enquanto não há projeto Firebase real configurado.
///
/// Ver pendência documentada na spec técnica do mobile e no handoff de implementação: ativar o
/// login real requer `firebase_options.dart` (gerado via `flutterfire configure`) e as
/// credenciais nativas do Google Sign-In.
class UnavailableAuthService implements AuthService {
  const UnavailableAuthService();

  @override
  bool get isAvailable => false;

  @override
  Stream<AuthUser?> get authStateChanges => Stream<AuthUser?>.value(null);

  @override
  Future<AuthUser?> signInWithGoogle() {
    throw const AuthNotAvailableException();
  }

  @override
  Future<void> signOut() async {}
}
