import 'package:flutter/foundation.dart';

/// Where the app looks for the backend, and nothing else.
///
/// There is no API key here, and there is no place to put one. A credential
/// shipped in a client is extractable from the bundle no matter how it is
/// stored, so the key lives on the server and this app only ever knows an
/// address.
abstract final class AppConfig {
  /// Overridden at build time:
  ///
  /// ```
  /// flutter run --dart-define=API_BASE_URL=https://api.example.com
  /// ```
  static const _defineValue = String.fromEnvironment('API_BASE_URL');

  /// The address to use when nothing was defined at build time.
  ///
  /// Android is the exception that makes this a function instead of a
  /// constant: an emulator reaches the host machine at `10.0.2.2`, and
  /// `localhost` there means the emulator itself — a mistake that costs an
  /// afternoon the first time it happens.
  static String get defaultBaseUrl {
    if (kIsWeb) return 'http://localhost:3000';
    return defaultTargetPlatform == TargetPlatform.android
        ? 'http://10.0.2.2:3000'
        : 'http://localhost:3000';
  }

  static String get initialBaseUrl =>
      _defineValue.isEmpty ? defaultBaseUrl : _defineValue;

  /// Whether the address looks usable. Checked before it is saved, so a typo
  /// fails in the dialog instead of as a connection error later.
  static bool isValidBaseUrl(String value) {
    final uri = Uri.tryParse(value.trim());
    return uri != null &&
        uri.hasScheme &&
        (uri.scheme == 'http' || uri.scheme == 'https') &&
        uri.host.isNotEmpty;
  }
}
