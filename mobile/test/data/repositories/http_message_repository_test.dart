import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:smash_gift/core/config/app_config.dart';
import 'package:smash_gift/core/network/api_client.dart';
import 'package:smash_gift/core/network/api_exceptions.dart';
import 'package:smash_gift/data/models/message_generation_request.dart';
import 'package:smash_gift/data/repositories/http_message_repository.dart';

void main() {
  const config = AppConfig(apiBaseUrl: 'https://api.example.com');

  test('sends occasion/relationship to /messages and maps the response', () async {
    final mockClient = MockClient((request) async {
      expect(request.method, 'POST');
      expect(request.url.path, '/messages');
      expect(jsonDecode(request.body), {
        'occasion': 'birthday',
        'relationship': 'mother',
        'regenerate': false,
      });

      return http.Response(
        jsonEncode({
          'messages': ['Mensagem 1', 'Mensagem 2', 'Mensagem 3'],
        }),
        200,
      );
    });

    final repository = HttpMessageRepository(ApiClient(config: config, httpClient: mockClient));

    final result = await repository.generateMessages(
      const MessageGenerationRequest(occasion: 'birthday', relationship: 'mother'),
    );

    expect(result.messages, ['Mensagem 1', 'Mensagem 2', 'Mensagem 3']);
  });

  test('propagates ServerException from the API client on failure', () async {
    final mockClient = MockClient((request) async {
      return http.Response('error', 502);
    });
    final repository = HttpMessageRepository(ApiClient(config: config, httpClient: mockClient));

    expect(
      () => repository.generateMessages(
        const MessageGenerationRequest(occasion: 'birthday', relationship: 'mother'),
      ),
      throwsA(isA<ServerException>()),
    );
  });
}
