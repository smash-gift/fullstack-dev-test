/// Application-level configuration.
///
/// The backend base URL is provided at build/run time via `--dart-define` so
/// the same binary can target local dev, staging, or production without code
/// changes:
///
/// ```sh
/// flutter run --dart-define=API_BASE_URL=http://localhost:8080
/// ```
abstract final class AppConfig {
  /// Base URL of the suggestions backend. Defaults to localhost:8080.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8080',
  );
}
