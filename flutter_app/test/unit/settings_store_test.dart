import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/app/core/config/app_config.dart';
import 'package:gift_card_suggester/app/core/config/settings_store.dart';

void main() {
  group('the backend address', () {
    test('starts at the build-time value', () {
      expect(SettingsStore().baseUrl, AppConfig.initialBaseUrl);
    });

    test('accepts a full http address', () {
      final settings = SettingsStore(initialBaseUrl: 'http://localhost:3000');

      expect(settings.setBaseUrl('https://api.example.com'), isTrue);
      expect(settings.baseUrl, 'https://api.example.com');
    });

    test('trims what the user pasted', () {
      final settings = SettingsStore(initialBaseUrl: 'http://localhost:3000');

      settings.setBaseUrl('  https://api.example.com  ');

      expect(settings.baseUrl, 'https://api.example.com');
    });

    test('tells the caller when the address is unusable, and changes nothing', () {
      final settings = SettingsStore(initialBaseUrl: 'http://localhost:3000');

      for (final bad in ['', 'localhost:3000', 'ftp://x.test', 'not a url', 'http://']) {
        expect(settings.setBaseUrl(bad), isFalse, reason: bad);
        expect(settings.baseUrl, 'http://localhost:3000');
      }
    });

    test('notifies listeners so the next request uses the new address', () {
      final settings = SettingsStore(initialBaseUrl: 'http://localhost:3000');
      var notifications = 0;
      settings.addListener(() => notifications += 1);

      settings.setBaseUrl('https://api.example.com');
      // Setting the same value again is not a change.
      settings.setBaseUrl('https://api.example.com');

      expect(notifications, 1);
    });

    test('can be put back', () {
      final settings = SettingsStore(initialBaseUrl: 'http://localhost:3000');
      settings.setBaseUrl('https://api.example.com');

      settings.resetToDefault();

      expect(settings.baseUrl, AppConfig.initialBaseUrl);
    });
  });

  group('address validation', () {
    test('accepts what a developer actually types', () {
      for (final url in [
        'http://localhost:3000',
        'http://10.0.2.2:3000',
        'http://192.168.1.20:3000',
        'https://api.example.com',
        'https://api.example.com/',
      ]) {
        expect(AppConfig.isValidBaseUrl(url), isTrue, reason: url);
      }
    });

    test('rejects anything that is not a reachable http address', () {
      for (final url in ['', '   ', 'example.com', 'file:///etc/passwd', 'javascript:alert(1)']) {
        expect(AppConfig.isValidBaseUrl(url), isFalse, reason: url);
      }
    });
  });
}
