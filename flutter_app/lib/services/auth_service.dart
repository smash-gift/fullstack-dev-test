import 'package:firebase_auth/firebase_auth.dart';

/// Supplies the ID token the API requires.
///
/// An interface so the API client can be exercised without Firebase — the
/// widget tests inject a stub and never touch the network or the SDK.
abstract class AuthService {
  Future<String> idToken();
}

class FirebaseAuthService implements AuthService {
  FirebaseAuthService({FirebaseAuth? auth})
    : _auth = auth ?? FirebaseAuth.instance;

  final FirebaseAuth _auth;

  /// Signs in anonymously the first time a token is needed, then reuses the
  /// session.
  ///
  /// The user never sees a login screen: identity here exists so the backend
  /// can count requests against a person rather than an address, not to gate
  /// anything. `getIdToken` refreshes on its own once the token nears expiry.
  @override
  Future<String> idToken() async {
    final user = _auth.currentUser ?? (await _auth.signInAnonymously()).user;

    if (user == null) {
      throw StateError('Anonymous sign-in returned no user');
    }

    final token = await user.getIdToken();

    if (token == null || token.isEmpty) {
      throw StateError('Firebase returned an empty ID token');
    }

    return token;
  }
}
