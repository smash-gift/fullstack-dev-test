import 'package:flutter/foundation.dart';

import 'app_config.dart';

/// Holds the backend address the app is currently pointing at.
///
/// Not persisted across launches, and that is a decision rather than an
/// omission: persistence would mean a storage dependency for a value that
/// `--dart-define` already sets permanently at build time. The dialog exists so
/// an evaluator can retarget a running app without rebuilding it.
class SettingsStore extends ChangeNotifier {
  SettingsStore({String? initialBaseUrl})
    : _baseUrl = initialBaseUrl ?? AppConfig.initialBaseUrl;

  String _baseUrl;

  String get baseUrl => _baseUrl;

  /// Returns false and changes nothing when the address is unusable, so the
  /// dialog can keep itself open and say why.
  bool setBaseUrl(String value) {
    final trimmed = value.trim();
    if (!AppConfig.isValidBaseUrl(trimmed)) return false;

    if (_baseUrl != trimmed) {
      _baseUrl = trimmed;
      notifyListeners();
    }
    return true;
  }

  void resetToDefault() {
    if (_baseUrl == AppConfig.initialBaseUrl) return;
    _baseUrl = AppConfig.initialBaseUrl;
    notifyListeners();
  }
}
