import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_app/config/app_config.dart';
import 'package:gift_card_app/data/repositories/suggester_repository.dart';
import 'package:gift_card_app/data/services/api_service.dart';

void main() {
  group('SuggesterRepositoryImpl Tests', () {
    late ApiService apiService;

    setUp(() {
      apiService = ApiService(
        config: AppConfig.development(),
      );
    });

    test('returns fake suggestions when enableDebugFakes is true', () async {
      final repository = SuggesterRepositoryImpl(
        apiService: apiService,
        enableDebugFakes: true,
      );

      const params = SuggestionRequestParams(
        occasion: 'Aniversário',
        relationship: 'Amigo',
        language: 'pt-BR',
        guestId: 'guest-123',
      );

      final result = await repository.getSuggestions(params);

      expect(result.isOk, isTrue);
      final suggestions = result.asOk;
      expect(suggestions.length, equals(3));
      expect(suggestions.first.id, startsWith('debug-fake-'));
      expect(suggestions.first.occasion, equals('Aniversário'));
    });
  });
}
