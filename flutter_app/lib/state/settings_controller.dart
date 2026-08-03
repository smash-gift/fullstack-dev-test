import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/app_config.dart';

/// Holds the user-editable app settings and persists them across launches.
///
/// These are *client* settings only — the backend base URL, an optional access
/// token (Bearer, for an auth-protected backend), and a default message tone.
/// The LLM API key is deliberately NOT here: it is a server-side secret and
/// must never live in the client.
class SettingsController extends ChangeNotifier {
  static const _kBaseUrl = 'api_base_url';
  static const _kToken = 'auth_token';
  static const _kTone = 'default_tone';
  static const _kConfigured = 'configured';

  String baseUrl = AppConfig.apiBaseUrl;
  String token = '';
  String tone = '';

  bool _initialized = false;
  bool _isFirstRun = true;

  /// True once [load] has finished reading persisted values.
  bool get initialized => _initialized;

  /// True until the user saves settings for the first time — drives the initial
  /// setup screen.
  bool get isFirstRun => _isFirstRun;

  /// Loads persisted settings. Missing values fall back to sensible defaults
  /// (the compile-time base URL, empty token/tone).
  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _isFirstRun = !(prefs.getBool(_kConfigured) ?? false);
    baseUrl = prefs.getString(_kBaseUrl) ?? AppConfig.apiBaseUrl;
    token = prefs.getString(_kToken) ?? '';
    tone = prefs.getString(_kTone) ?? '';
    _initialized = true;
    notifyListeners();
  }

  /// Persists the given values. An empty base URL falls back to the default.
  Future<void> save({
    required String baseUrl,
    required String token,
    required String tone,
  }) async {
    this.baseUrl = baseUrl.trim().isEmpty
        ? AppConfig.apiBaseUrl
        : baseUrl.trim();
    this.token = token.trim();
    this.tone = tone.trim();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kBaseUrl, this.baseUrl);
    await prefs.setString(_kToken, this.token);
    await prefs.setString(_kTone, this.tone);
    await prefs.setBool(_kConfigured, true);

    _isFirstRun = false;
    notifyListeners();
  }
}
