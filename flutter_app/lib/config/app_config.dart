import 'package:firebase_core/firebase_core.dart';

/// Everything that changes between machines, in one place.
///
/// All of it is compile-time configuration, passed with `--dart-define`, so a
/// build carries its own settings and there is no runtime file to forget to
/// ship.
class AppConfig {
  const AppConfig._();

  /// Where the Firebase emulators are reachable.
  ///
  /// `127.0.0.1` for Chrome, desktop and the iOS simulator. The Android
  /// emulator runs in its own network namespace and reaches the host machine at
  /// `10.0.2.2`, so builds for it must pass
  /// `--dart-define=EMULATOR_HOST=10.0.2.2`. A physical device needs the
  /// machine's address on the local network.
  static const String emulatorHost = String.fromEnvironment(
    'EMULATOR_HOST',
    defaultValue: '127.0.0.1',
  );

  /// Base URL of the deployed API, if there is one.
  ///
  /// Empty by default, which means "use the local emulator". Set it to point
  /// the app at a real deployment without touching any code.
  static const String apiBaseUrl = String.fromEnvironment('API_BASE_URL');

  static const String projectId = 'demo-gift-card';
  static const int functionsPort = 5001;
  static const int authEmulatorPort = 9099;

  static bool get usesEmulator => apiBaseUrl.isEmpty;

  static Uri get suggestionsUri => Uri.parse(
    usesEmulator
        ? 'http://$emulatorHost:$functionsPort/$projectId/us-central1/suggestions'
        : '$apiBaseUrl/suggestions',
  );

  /// Placeholder credentials.
  ///
  /// The project id starts with `demo-`, which puts the emulator suite in fully
  /// offline mode: no Firebase project exists, no real key is involved, and
  /// nothing here is a secret. Pointing the app at a real project means
  /// replacing these with that project's values.
  static const FirebaseOptions firebaseOptions = FirebaseOptions(
    apiKey: 'demo-key',
    appId: '1:1:web:demo',
    messagingSenderId: '1',
    projectId: projectId,
  );
}
