import 'package:flutter_app/features/suggestions/presentation/cubit/suggestions_state.dart';
import 'package:flutter_app/features/suggestions/presentation/cubit/suggestions_cubit.dart';
import 'package:flutter_app/features/suggestions/domain/usecases/get_suggestions.dart';
import 'package:flutter_app/features/suggestions/domain/entities/suggestion.dart';
import 'package:flutter_app/core/errors/failures.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bloc_test/bloc_test.dart';
import 'package:mocktail/mocktail.dart';

class MockGetSuggestions extends Mock implements GetSuggestions {}

void main() {
  late MockGetSuggestions mockGetSuggestions;
  late SuggestionsCubit cubit;

  setUp(() {
    mockGetSuggestions = MockGetSuggestions();
    cubit = SuggestionsCubit(mockGetSuggestions);
  });

  tearDown(() => cubit.close());

  const tOccasion = 'Aniversário';
  const tRelationship = 'Amigo';

  const tResult = SuggestionResult(
    suggestions: [
      'Feliz aniversário!',
      'Que seu dia seja incrível!',
      'Com muito carinho!',
    ],
    isFromFallback: false,
  );

  const tFallbackResult = SuggestionResult(
    suggestions: [
      'Mensagem padrão 1',
      'Mensagem padrão 2',
      'Mensagem padrão 3',
    ],
    isFromFallback: true,
  );

  group('fetchSuggestions', () {
    blocTest<SuggestionsCubit, SuggestionsState>(
      'emite [Loading, Success] quando usecase retorna dados da IA',
      build: () {
        when(
          () => mockGetSuggestions(
            occasion: tOccasion,
            relationship: tRelationship,
          ),
        ).thenAnswer((_) async => (data: tResult, failure: null));
        return cubit;
      },
      act: (cubit) => cubit.fetchSuggestions(
        occasion: tOccasion,
        relationship: tRelationship,
      ),
      expect: () => [
        const SuggestionsLoading(),
        const SuggestionsSuccess(tResult),
      ],
    );

    blocTest<SuggestionsCubit, SuggestionsState>(
      'emite [Loading, Success] com isFromFallback=true quando backend usa fallback',
      build: () {
        when(
          () => mockGetSuggestions(
            occasion: tOccasion,
            relationship: tRelationship,
          ),
        ).thenAnswer((_) async => (data: tFallbackResult, failure: null));
        return cubit;
      },
      act: (cubit) => cubit.fetchSuggestions(
        occasion: tOccasion,
        relationship: tRelationship,
      ),
      expect: () => [
        const SuggestionsLoading(),
        const SuggestionsSuccess(tFallbackResult),
      ],
    );

    blocTest<SuggestionsCubit, SuggestionsState>(
      'emite [Loading, Error] quando usecase retorna NetworkFailure',
      build: () {
        when(
          () => mockGetSuggestions(
            occasion: tOccasion,
            relationship: tRelationship,
          ),
        ).thenAnswer(
          (_) async => (
            data: null,
            failure: const NetworkFailure('Sem conexão com o servidor.'),
          ),
        );
        return cubit;
      },
      act: (cubit) => cubit.fetchSuggestions(
        occasion: tOccasion,
        relationship: tRelationship,
      ),
      expect: () => [
        const SuggestionsLoading(),
        const SuggestionsError('Sem conexão com o servidor.'),
      ],
    );

    blocTest<SuggestionsCubit, SuggestionsState>(
      'emite [Loading, Error] quando usecase retorna ServerFailure',
      build: () {
        when(
          () => mockGetSuggestions(
            occasion: tOccasion,
            relationship: tRelationship,
          ),
        ).thenAnswer(
          (_) async => (
            data: null,
            failure: const ServerFailure('Erro interno no servidor.'),
          ),
        );
        return cubit;
      },
      act: (cubit) => cubit.fetchSuggestions(
        occasion: tOccasion,
        relationship: tRelationship,
      ),
      expect: () => [
        const SuggestionsLoading(),
        const SuggestionsError('Erro interno no servidor.'),
      ],
    );
  });

  group('reset', () {
    blocTest<SuggestionsCubit, SuggestionsState>(
      'emite [Initial] quando reset é chamado',
      build: () => cubit,
      seed: () => const SuggestionsSuccess(tResult),
      act: (cubit) => cubit.reset(),
      expect: () => [const SuggestionsInitial()],
    );
  });
}
