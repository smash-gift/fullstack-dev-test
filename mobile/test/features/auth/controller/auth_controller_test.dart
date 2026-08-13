import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:smash_gift/data/repositories/user_repository.dart';
import 'package:smash_gift/features/auth/auth_service.dart';
import 'package:smash_gift/features/auth/controller/auth_controller.dart';

/// [AuthService] falso escrito à mão. `authStateChanges` é implementado com `async*` para emitir
/// [initialUser] assim que alguém se inscrever (aqui, [AuthController]) e depois continuar
/// repassando os eventos manuais de [_controller] (sign-in/sign-out simulados) — evita depender
/// de timing de `StreamController.broadcast()` para a primeira emissão.
class _FakeAuthService implements AuthService {
  _FakeAuthService({this.initialUser});

  final AuthUser? initialUser;
  final _controller = StreamController<AuthUser?>.broadcast();

  bool signInCalled = false;
  bool signOutCalled = false;
  Object? signInError;
  AuthUser? signInResult;

  @override
  bool get isAvailable => true;

  @override
  Stream<AuthUser?> get authStateChanges async* {
    yield initialUser;
    yield* _controller.stream;
  }

  @override
  Future<AuthUser?> signInWithGoogle() async {
    signInCalled = true;
    if (signInError != null) throw signInError!;
    if (signInResult != null) _controller.add(signInResult);
    return signInResult;
  }

  @override
  Future<void> signOut() async {
    signOutCalled = true;
    _controller.add(null);
  }
}

class _FakeUserRepository implements UserRepository {
  final List<String> upsertedUids = [];

  @override
  Future<void> upsertProfile({
    required String uid,
    String? displayName,
    String? email,
    String? photoUrl,
  }) async {
    upsertedUids.add(uid);
  }
}

void main() {
  group('AuthController', () {
    test('starts unauthenticated when authStateChanges emits null first', () async {
      final controller = AuthController(_FakeAuthService(), _FakeUserRepository());

      await Future<void>.delayed(Duration.zero);

      expect(controller.isAuthenticated, isFalse);
      expect(controller.currentUser, isNull);
    });

    test('becomes authenticated and upserts the profile when the auth service emits a user',
        () async {
      const user = AuthUser(uid: 'uid-1', displayName: 'Ana', email: 'ana@example.com');
      final authService = _FakeAuthService(initialUser: user);
      final userRepository = _FakeUserRepository();
      final controller = AuthController(authService, userRepository);

      await Future<void>.delayed(Duration.zero);

      expect(controller.isAuthenticated, isTrue);
      expect(controller.currentUser?.uid, 'uid-1');
      expect(userRepository.upsertedUids, ['uid-1']);
    });

    test('signInWithGoogle toggles isSigningIn during the call', () async {
      const user = AuthUser(uid: 'uid-2');
      final authService = _FakeAuthService()..signInResult = user;
      final controller = AuthController(authService, _FakeUserRepository());
      await Future<void>.delayed(Duration.zero);

      final signingInStates = <bool>[];
      controller.addListener(() => signingInStates.add(controller.isSigningIn));

      await controller.signInWithGoogle();

      expect(authService.signInCalled, isTrue);
      expect(signingInStates.first, isTrue);
      expect(controller.isSigningIn, isFalse);
      expect(controller.errorMessage, isNull);
    });

    test('signInWithGoogle stores a friendly error message on AuthNotAvailableException',
        () async {
      final authService = _FakeAuthService()..signInError = const AuthNotAvailableException();
      final controller = AuthController(authService, _FakeUserRepository());
      await Future<void>.delayed(Duration.zero);

      await controller.signInWithGoogle();

      expect(controller.errorMessage, isNotNull);
      expect(controller.isAuthenticated, isFalse);
    });

    test('signOut delegates to the auth service and clears the current user', () async {
      const user = AuthUser(uid: 'uid-3');
      final authService = _FakeAuthService(initialUser: user);
      final controller = AuthController(authService, _FakeUserRepository());
      await Future<void>.delayed(Duration.zero);
      expect(controller.isAuthenticated, isTrue);

      await controller.signOut();
      await Future<void>.delayed(Duration.zero);

      expect(authService.signOutCalled, isTrue);
      expect(controller.isAuthenticated, isFalse);
    });
  });
}
