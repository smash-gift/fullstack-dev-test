import 'package:flutter_app/features/suggestions/data/datasources/suggestions_remote_datasource.dart';
import 'package:flutter_app/features/suggestions/data/repositories/suggestions_repository_impl.dart';
import 'package:flutter_app/features/suggestions/data/models/suggestion_response_model.dart';
import 'package:flutter_app/core/errors/exceptions.dart';
import 'package:flutter_app/core/errors/failures.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockSuggestionsRemoteDatasource extends Mock
    implements SuggestionsRemoteDatasource {}

void main() {
  late MockSuggestionsRemoteDatasource mockDatasource;
  late SuggestionsRepositoryImpl repository;

  setUp(() {
    mockDatasource = MockSuggestionsRemoteDatasource();
    repository = SuggestionsRepositoryImpl(mockDatasource);
  });

  const tOccasion = 'Aniversário';
  const tRelationship = 'Amigo';

  const tModel = SuggestionResponseModel(
    suggestions: ['Msg 1', 'Msg 2', 'Msg 3'],
    source: 'ai',
  );

  const tFallbackModel = SuggestionResponseModel(
    suggestions: ['Msg 1', 'Msg 2', 'Msg 3'],
    source: 'fallback',
  );

  group('getSuggestions', () {
    test(
      'retorna SuggestionResult com isFromFallback=false quando source=ai',
      () async {
        when(
          () => mockDatasource.getSuggestions(
            occasion: tOccasion,
            relationship: tRelationship,
          ),
        ).thenAnswer((_) async => tModel);

        final result = await repository.getSuggestions(
          occasion: tOccasion,
          relationship: tRelationship,
        );

        expect(result.failure, isNull);
        expect(result.data?.isFromFallback, false);
        expect(result.data?.suggestions, ['Msg 1', 'Msg 2', 'Msg 3']);
      },
    );

    test(
      'retorna SuggestionResult com isFromFallback=true quando source=fallback',
      () async {
        when(
          () => mockDatasource.getSuggestions(
            occasion: tOccasion,
            relationship: tRelationship,
          ),
        ).thenAnswer((_) async => tFallbackModel);

        final result = await repository.getSuggestions(
          occasion: tOccasion,
          relationship: tRelationship,
        );

        expect(result.failure, isNull);
        expect(result.data?.isFromFallback, true);
      },
    );

    test(
      'retorna NetworkFailure quando datasource lança NetworkException',
      () async {
        when(
          () => mockDatasource.getSuggestions(
            occasion: tOccasion,
            relationship: tRelationship,
          ),
        ).thenThrow(const NetworkException('Sem conexão.'));

        final result = await repository.getSuggestions(
          occasion: tOccasion,
          relationship: tRelationship,
        );

        expect(result.data, isNull);
        expect(result.failure, isA<NetworkFailure>());
      },
    );

    test(
      'retorna ServerFailure quando datasource lança ServerException',
      () async {
        when(
          () => mockDatasource.getSuggestions(
            occasion: tOccasion,
            relationship: tRelationship,
          ),
        ).thenThrow(const ServerException(message: 'Erro no servidor.'));

        final result = await repository.getSuggestions(
          occasion: tOccasion,
          relationship: tRelationship,
        );

        expect(result.data, isNull);
        expect(result.failure, isA<ServerFailure>());
      },
    );
  });
}
