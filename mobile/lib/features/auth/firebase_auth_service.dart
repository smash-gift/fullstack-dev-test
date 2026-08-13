import 'package:firebase_auth/firebase_auth.dart' as fb_auth;
import 'package:google_sign_in/google_sign_in.dart';

import 'auth_service.dart';

/// Implementação real de [AuthService] via FlutterFire (`firebase_auth`) + `google_sign_in`.
///
/// Depende de um projeto Firebase real já inicializado (`Firebase.initializeApp()` bem-sucedido
/// em `main.dart`) — nunca deve ser instanciada fora desse caminho. Enquanto não houver um
/// projeto Firebase real configurado neste ambiente, `main.dart` usa [UnavailableAuthService] no
/// lugar.
///
/// Autenticação aqui apenas identifica o usuário perante o Firebase — nunca autoriza operações
/// protegidas (não há endpoints autenticados no backend ainda; ver `mobile/CLAUDE.md` e
/// `docs/contracts/api-contracts.md`). A integração com Firestore usa as Security Rules
/// documentadas em `docs/contracts/firestore-schema.md` como única camada de autorização.
///
/// `google_sign_in` 7.x (breaking change em relação à API usada quando este arquivo foi escrito
/// originalmente, contra 6.x) trocou `GoogleSignIn()` + `.signIn()` por um singleton
/// (`GoogleSignIn.instance`) que exige `initialize()` explícito, aguardado, antes de qualquer
/// outro método — chamar `initialize()` mais de uma vez tem comportamento indefinido segundo o
/// pacote, por isso a inicialização é memoizada de forma estática em [_googleSignInInitialization].
/// `.signIn()` foi substituído por `.authenticate()`, que não retorna mais `null` em caso de
/// cancelamento — em vez disso lança `GoogleSignInException` com
/// `GoogleSignInExceptionCode.canceled`, tratado abaixo para preservar o comportamento anterior
/// (cancelamento não é erro). `GoogleSignInAccount.authentication` também deixou de expor
/// `accessToken` (só `idToken` — obter um access token na v7 exige um passo de autorização
/// separado, via `authorizationClient`, que este app não precisa: `FirebaseAuth.signInWithCredential`
/// funciona apenas com o `idToken`, ver `GoogleAuthProvider.credential`).
class FirebaseAuthService implements AuthService {
  FirebaseAuthService({fb_auth.FirebaseAuth? firebaseAuth})
      : _firebaseAuth = firebaseAuth ?? fb_auth.FirebaseAuth.instance;

  final fb_auth.FirebaseAuth _firebaseAuth;
  final GoogleSignIn _googleSignIn = GoogleSignIn.instance;

  /// Memoizado como `static` (não por instância) porque `GoogleSignIn.instance` é um singleton
  /// compartilhado por todo o app — mesmo que mais de um [FirebaseAuthService] viesse a ser
  /// instanciado, `initialize()` só pode ser chamado uma única vez no processo inteiro.
  static Future<void>? _googleSignInInitialization;

  Future<void> _ensureGoogleSignInInitialized() {
    return _googleSignInInitialization ??= _googleSignIn.initialize();
  }

  @override
  bool get isAvailable => true;

  @override
  Stream<AuthUser?> get authStateChanges => _firebaseAuth.authStateChanges().map(_toAuthUser);

  @override
  Future<AuthUser?> signInWithGoogle() async {
    await _ensureGoogleSignInInitialized();

    final GoogleSignInAccount googleUser;
    try {
      googleUser = await _googleSignIn.authenticate();
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled) {
        // Usuário cancelou o fluxo no seletor de contas do Google — não é um erro.
        return null;
      }
      rethrow;
    }

    final credential = fb_auth.GoogleAuthProvider.credential(
      idToken: googleUser.authentication.idToken,
    );

    final userCredential = await _firebaseAuth.signInWithCredential(credential);
    return _toAuthUser(userCredential.user);
  }

  @override
  Future<void> signOut() async {
    await _ensureGoogleSignInInitialized();
    await Future.wait([
      _firebaseAuth.signOut(),
      _googleSignIn.signOut(),
    ]);
  }

  AuthUser? _toAuthUser(fb_auth.User? user) {
    if (user == null) return null;
    return AuthUser(
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoUrl: user.photoURL,
    );
  }
}
