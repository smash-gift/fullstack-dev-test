import 'package:flutter/foundation.dart';

/// Where the app looks for the backend.
///
/// Override at build time with
/// `--dart-define=API_BASE_URL=http://192.168.0.10:3000`. The default already
/// accounts for the Android emulator, which cannot reach the host through
/// `localhost`.
abstract final class AppConfig {
  static const String _override = String.fromEnvironment('API_BASE_URL');

  static String get apiBaseUrl {
    if (_override.isNotEmpty) return _override;
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
  }

  static const Duration requestTimeout = Duration(seconds: 12);
}
