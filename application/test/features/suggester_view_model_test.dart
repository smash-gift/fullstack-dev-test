import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_app/data/repositories/suggester_repository.dart';
import 'package:gift_card_app/domain/models/suggestion.dart';
import 'package:gift_card_app/features/suggester/view_models/suggester_view_model.dart';
import 'package:gift_card_app/utils/result.dart';

class FakeSuggesterRepository implements SuggesterRepository {
  final bool shouldFail;

  FakeSuggesterRepository({this.shouldFail = false});

  @override
  Future<Result<List<Suggestion>>> getSuggestions(SuggestionRequestParams params) async {
    if (shouldFail) {
      return Result.error(Exception('API error'));
    }
    return Result.ok([
      Suggestion(
        id: '1',
        text: 'Feliz Aniversário!',
        occasion: params.occasion,
        relationship: params.relationship,
        language: params.language,
        tone: 'Warm',
      ),
    ]);
  }
}

void main() {
  group('SuggesterViewModel Tests', () {
    test('initial values are set correctly', () {
      final repo = FakeSuggesterRepository();
      final vm = SuggesterViewModel(repository: repo);

      expect(vm.currentStep, equals(0));
      expect(vm.currentLocale, equals('pt'));
      expect(vm.selectedOccasion, equals('Aniversário'));
    });

    test('locale and step change updates state', () {
      final repo = FakeSuggesterRepository();
      final vm = SuggesterViewModel(repository: repo);

      vm.setLocale('en');
      expect(vm.currentLocale, equals('en'));

      vm.setStep(2);
      expect(vm.currentStep, equals(2));
    });

    test('generate suggestions success moves to step 1', () async {
      final repo = FakeSuggesterRepository(shouldFail: false);
      final vm = SuggesterViewModel(repository: repo);

      await vm.generateCommand.execute(
        const SuggestionRequestParams(
          occasion: 'Aniversário',
          relationship: 'Amigo(a)',
          language: 'pt',
          guestId: 'guest-1',
        ),
      );

      expect(vm.generateCommand.completed, isTrue);
      expect(vm.suggestions.length, equals(1));
      expect(vm.currentStep, equals(1));
    });

    test('generate suggestions failure triggers offline fallback and step 3', () async {
      final repo = FakeSuggesterRepository(shouldFail: true);
      final vm = SuggesterViewModel(repository: repo);

      await vm.generateCommand.execute(
        const SuggestionRequestParams(
          occasion: 'Aniversário',
          relationship: 'Amigo(a)',
          language: 'pt',
          guestId: 'guest-1',
        ),
      );

      expect(vm.suggestions.isNotEmpty, isTrue);
      expect(vm.suggestions.first.isFallback, isTrue);
      expect(vm.currentStep, equals(3));
    });
  });
}
