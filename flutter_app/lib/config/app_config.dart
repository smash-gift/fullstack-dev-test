/// App configuration.
///
/// The backend base URL is configurable at build/run time via a Dart define,
/// so no code change is needed to point at a different backend:
///
///   flutter run --dart-define=API_BASE_URL=http://192.168.0.10:8080
///
/// Defaults target a locally running backend. Note that on the Android
/// emulator `localhost` refers to the emulator itself — use 10.0.2.2 to reach
/// the host machine (documented in the README).
class AppConfig {
  const AppConfig._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8080',
  );
}
