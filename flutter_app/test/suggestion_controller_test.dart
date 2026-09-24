import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/data/models/suggestion_response.dart';
import 'package:gift_card_suggester/data/suggestion_api_client.dart';
import 'package:gift_card_suggester/domain/failure.dart';
import 'package:gift_card_suggester/domain/suggestion_state.dart';
import 'package:gift_card_suggester/presentation/providers/suggestion_provider.dart';

class _OkClient extends SuggestionApiClient {
  _OkClient() : super(baseUrl: 'http://test', dio: Dio());

  @override
  Future<SuggestionResponse> fetchSuggestions({
    required String occasion,
    required String relationship,
  }) async {
    return const SuggestionResponse(
      suggestions: ['Happy birthday!'],
      source: SuggestionSource.fallback,
    );
  }
}

class _FailClient extends SuggestionApiClient {
  _FailClient() : super(baseUrl: 'http://test', dio: Dio());

  @override
  Future<SuggestionResponse> fetchSuggestions({
    required String occasion,
    required String relationship,
  }) async {
    throw const Failure(FailureKind.server, 'boom');
  }
}

void main() {
  test('starts in the idle state', () {
    final c = SuggestionController(_OkClient());
    SuggestionState? current;
    c.addListener((s) => current = s);
    expect(current, isA<SuggestionIdle>());
  });

  test('emits loading then success, preserving source', () async {
    final c = SuggestionController(_OkClient());
    final states = <SuggestionState>[];
    c.addListener(states.add, fireImmediately: false);

    await c.fetch(occasion: 'birthday', relationship: 'friend');

    expect(states.first, isA<SuggestionLoading>());
    expect(states.last, isA<SuggestionSuccess>());
    final success = states.last as SuggestionSuccess;
    expect(success.suggestions, ['Happy birthday!']);
    expect(success.source, SuggestionSource.fallback);
  });

  test('emits loading then error with the typed failure', () async {
    final c = SuggestionController(_FailClient());
    final states = <SuggestionState>[];
    c.addListener(states.add, fireImmediately: false);

    await c.fetch(occasion: 'birthday', relationship: 'friend');

    expect(states.first, isA<SuggestionLoading>());
    expect(states.last, isA<SuggestionError>());
    expect((states.last as SuggestionError).failure.kind, FailureKind.server);
  });

  test('reset returns to idle', () async {
    final c = SuggestionController(_OkClient());
    SuggestionState? current;
    c.addListener((s) => current = s);
    await c.fetch(occasion: 'birthday', relationship: 'friend');
    c.reset();
    expect(current, isA<SuggestionIdle>());
  });
}
