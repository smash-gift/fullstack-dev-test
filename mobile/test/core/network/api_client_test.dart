import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:smash_gift/core/config/app_config.dart';
import 'package:smash_gift/core/network/api_client.dart';
import 'package:smash_gift/core/network/api_exceptions.dart';

void main() {
  const config = AppConfig(apiBaseUrl: 'https://api.example.com');

  group('ApiClient.post', () {
    test('decodes the JSON body when the response is 2xx', () async {
      final mockClient = MockClient((request) async {
        expect(request.url.toString(), 'https://api.example.com/messages');
        expect(request.headers['Content-Type'], 'application/json');
        expect(jsonDecode(request.body), {'occasion': 'birthday', 'relationship': 'mother'});

        return http.Response(
          jsonEncode({
            'messages': ['a', 'b', 'c'],
          }),
          200,
        );
      });

      final client = ApiClient(config: config, httpClient: mockClient);

      final result = await client.post(
        '/messages',
        {'occasion': 'birthday', 'relationship': 'mother'},
      );

      expect(result, {
        'messages': ['a', 'b', 'c'],
      });
    });

    test('throws ServerException when the status code is not 2xx', () async {
      final mockClient = MockClient((request) async {
        return http.Response('{"error": "boom"}', 500);
      });
      final client = ApiClient(config: config, httpClient: mockClient);

      expect(
        () => client.post('/messages', {}),
        throwsA(isA<ServerException>().having((e) => e.statusCode, 'statusCode', 500)),
      );
    });

    test(
      'throws ServerException with code/message/details when the body follows the documented '
      'error format',
      () async {
        final mockClient = MockClient((request) async {
          return http.Response(
            jsonEncode({
              'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Descrição legível do erro.',
                'details': ['occasion is required'],
              },
            }),
            400,
          );
        });
        final client = ApiClient(config: config, httpClient: mockClient);

        expect(
          () => client.post('/messages', {}),
          throwsA(
            isA<ServerException>()
                .having((e) => e.statusCode, 'statusCode', 400)
                .having((e) => e.code, 'code', 'VALIDATION_ERROR')
                .having((e) => e.message, 'message', 'Descrição legível do erro.')
                .having((e) => e.details, 'details', ['occasion is required']),
          ),
        );
      },
    );

    test(
      'falls back to the generic ServerException when the error body does not match the '
      'documented format',
      () async {
        final mockClient = MockClient((request) async {
          return http.Response('not json', 502);
        });
        final client = ApiClient(config: config, httpClient: mockClient);

        expect(
          () => client.post('/messages', {}),
          throwsA(
            isA<ServerException>()
                .having((e) => e.statusCode, 'statusCode', 502)
                .having((e) => e.code, 'code', isNull)
                .having((e) => e.message, 'message', 'O servidor retornou um erro.'),
          ),
        );
      },
    );

    test('throws UnexpectedResponseException when the body is not valid JSON', () async {
      final mockClient = MockClient((request) async {
        return http.Response('not json', 200);
      });
      final client = ApiClient(config: config, httpClient: mockClient);

      expect(
        () => client.post('/messages', {}),
        throwsA(isA<UnexpectedResponseException>()),
      );
    });

    test('throws UnexpectedResponseException when the body is a JSON array', () async {
      final mockClient = MockClient((request) async {
        return http.Response('[1, 2, 3]', 200);
      });
      final client = ApiClient(config: config, httpClient: mockClient);

      expect(
        () => client.post('/messages', {}),
        throwsA(isA<UnexpectedResponseException>()),
      );
    });

    test('throws NetworkException when the request fails to complete', () async {
      final mockClient = MockClient((request) async {
        throw const SocketExceptionStub();
      });
      final client = ApiClient(config: config, httpClient: mockClient);

      expect(
        () => client.post('/messages', {}),
        throwsA(isA<NetworkException>()),
      );
    });
  });
}

/// Stub simples de uma falha de rede (ex.: SocketException), sem depender de dart:io em testes.
class SocketExceptionStub implements Exception {
  const SocketExceptionStub();
}
