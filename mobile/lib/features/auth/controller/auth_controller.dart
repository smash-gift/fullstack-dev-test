import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../../data/repositories/user_repository.dart';
import '../auth_service.dart';

/// Estado de autenticação do app, compartilhado entre as telas que precisam saber se há um
/// usuário logado (formulário, opções de mensagem, histórico).
///
/// `ChangeNotifier` nativo, mesmo padrão dos demais controllers do app (ex.:
/// `MessageGenerationController`) — ver decisão de gerenciamento de estado na spec técnica do
/// mobile. Diferente dos controllers de tela (que pertencem a uma única tela e são criados no
/// `initState`), este é criado uma vez em `main.dart` (composition root) e passado via construtor
/// para as telas que precisam do estado de auth — ainda injeção manual, sem estado global
/// implícito via `InheritedWidget`/`Provider`.
class AuthController extends ChangeNotifier {
  AuthController(this._authService, this._userRepository) {
    _subscription = _authService.authStateChanges.listen(_handleAuthChanged);
  }

  final AuthService _authService;
  final UserRepository _userRepository;
  StreamSubscription<AuthUser?>? _subscription;

  AuthUser? _currentUser;
  bool _isSigningIn = false;
  String? _errorMessage;

  AuthUser? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isSigningIn => _isSigningIn;
  String? get errorMessage => _errorMessage;

  Future<void> _handleAuthChanged(AuthUser? user) async {
    _currentUser = user;
    notifyListeners();

    if (user != null) {
      try {
        await _userRepository.upsertProfile(
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoUrl: user.photoUrl,
        );
      } catch (_) {
        // Falha ao gravar o perfil não deve derrubar o estado de autenticação já resolvido pelo
        // Firebase Auth — o usuário continua logado mesmo que o upsert de perfil falhe.
      }
    }
  }

  /// Dispara o fluxo de login Google. Erros (inclusive [AuthNotAvailableException], quando não há
  /// projeto Firebase configurado) ficam disponíveis em [errorMessage] para a UI exibir — não são
  /// relançados, para que o chamador não precise de try/catch.
  Future<void> signInWithGoogle() async {
    _isSigningIn = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _authService.signInWithGoogle();
    } on AuthNotAvailableException catch (error) {
      _errorMessage = error.message;
    } catch (_) {
      _errorMessage = 'Não foi possível entrar com o Google. Tente novamente.';
    } finally {
      _isSigningIn = false;
      notifyListeners();
    }
  }

  Future<void> signOut() => _authService.signOut();

  @override
  void dispose() {
    unawaited(_subscription?.cancel());
    super.dispose();
  }
}
