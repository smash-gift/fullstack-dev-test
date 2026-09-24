import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/data/models/suggestion_response.dart';
import 'package:gift_card_suggester/data/suggestion_api_client.dart';
import 'package:gift_card_suggester/domain/failure.dart';

/// A dio adapter that returns a canned success body.
class _SuccessAdapter implements HttpClientAdapter {
  _SuccessAdapter(this.body);
  final Map<String, dynamic> body;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    return ResponseBody.fromString(
      jsonEncode(body),
      200,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

/// A dio adapter that always throws the given DioException.
class _ThrowingAdapter implements HttpClientAdapter {
  _ThrowingAdapter(this.build);
  final DioException Function(RequestOptions o) build;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    throw build(options);
  }

  @override
  void close({bool force = false}) {}
}

SuggestionApiClient clientWith(HttpClientAdapter adapter) {
  final dio = Dio(BaseOptions(baseUrl: 'http://test'))..httpClientAdapter = adapter;
  return SuggestionApiClient(baseUrl: 'http://test', dio: dio);
}

Future<SuggestionResponse> call(SuggestionApiClient c) => c.fetchSuggestions(
      occasion: 'birthday',
      relationship: 'friend',
    );

void main() {
  test('parses a successful response', () async {
    final client = clientWith(
      _SuccessAdapter(<String, dynamic>{
        'suggestions': ['Happy birthday!'],
        'source': 'llm',
      }),
    );
    final res = await call(client);
    expect(res.suggestions, ['Happy birthday!']);
    expect(res.source, SuggestionSource.llm);
  });

  test('maps a timeout to FailureKind.timeout', () async {
    final client = clientWith(
      _ThrowingAdapter(
        (o) => DioException(
          requestOptions: o,
          type: DioExceptionType.receiveTimeout,
        ),
      ),
    );
    await expectLater(
      call(client),
      throwsA(
        isA<Failure>().having((f) => f.kind, 'kind', FailureKind.timeout),
      ),
    );
  });

  test('maps a connection error to FailureKind.network', () async {
    final client = clientWith(
      _ThrowingAdapter(
        (o) => DioException(
          requestOptions: o,
          type: DioExceptionType.connectionError,
        ),
      ),
    );
    await expectLater(
      call(client),
      throwsA(
        isA<Failure>().having((f) => f.kind, 'kind', FailureKind.network),
      ),
    );
  });

  test('maps HTTP 429 to FailureKind.rateLimited', () async {
    final client = clientWith(
      _ThrowingAdapter(
        (o) => DioException(
          requestOptions: o,
          type: DioExceptionType.badResponse,
          response: Response<dynamic>(requestOptions: o, statusCode: 429),
        ),
      ),
    );
    await expectLater(
      call(client),
      throwsA(
        isA<Failure>().having((f) => f.kind, 'kind', FailureKind.rateLimited),
      ),
    );
  });

  test('maps HTTP 400 to FailureKind.badRequest', () async {
    final client = clientWith(
      _ThrowingAdapter(
        (o) => DioException(
          requestOptions: o,
          type: DioExceptionType.badResponse,
          response: Response<dynamic>(requestOptions: o, statusCode: 400),
        ),
      ),
    );
    await expectLater(
      call(client),
      throwsA(
        isA<Failure>().having((f) => f.kind, 'kind', FailureKind.badRequest),
      ),
    );
  });

  test('maps HTTP 500 to FailureKind.server', () async {
    final client = clientWith(
      _ThrowingAdapter(
        (o) => DioException(
          requestOptions: o,
          type: DioExceptionType.badResponse,
          response: Response<dynamic>(requestOptions: o, statusCode: 500),
        ),
      ),
    );
    await expectLater(
      call(client),
      throwsA(
        isA<Failure>().having((f) => f.kind, 'kind', FailureKind.server),
      ),
    );
  });
}
