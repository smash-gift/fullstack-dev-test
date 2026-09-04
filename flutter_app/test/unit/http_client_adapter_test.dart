import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
// The adapter is the one file allowed to know `package:http` exists, and this
// is the one test allowed to drive it through the real package. Everything
// else in the suite talks to `IHttpClient`.
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:gift_card_suggester/app/core/drivers/http/http_client_adapter.dart';
import 'package:gift_card_suggester/app/core/drivers/http/i_http_client.dart';

void main() {
  final url = Uri.parse('http://localhost:3000/api/v1/suggestions');
  const body = {'occasion': 'birthday', 'relationship': 'friend'};

  group('the request that leaves the app', () {
    test('sends the body as JSON, with the JSON content type', () async {
      late http.Request sent;
      final adapter = HttpClientAdapter(
        MockClient((request) async {
          sent = request;
          return http.Response('{}', 200);
        }),
      );

      await adapter.postJson(url: url, body: body);

      expect(sent.method, 'POST');
      expect(sent.url, url);
      expect(sent.headers['Content-Type'], contains('application/json'));
      expect(jsonDecode(sent.body), body);
    });
  });

  group('what comes back', () {
    test('a 200 arrives as a successful response, body untouched', () async {
      final adapter = HttpClientAdapter(
        MockClient((_) async => http.Response('{"data":{"suggestions":[]}}', 200)),
      );

      final response = await adapter.postJson(url: url, body: body);

      expect(response.statusCode, 200);
      expect(response.body, '{"data":{"suggestions":[]}}');
      expect(response.isSuccess, isTrue);
    });

    // A status is an answer, and the caller is what knows how to read it. An
    // adapter that threw here would turn `429` into a network error and lose
    // the `Retry-After` the user needs to be told about.
    test('a 429 is returned, not thrown', () async {
      final adapter = HttpClientAdapter(
        MockClient((_) async => http.Response('{"error":{"code":"RATE_LIMITED"}}', 429)),
      );

      final response = await adapter.postJson(url: url, body: body);

      expect(response.statusCode, 429);
      expect(response.isSuccess, isFalse);
    });

    test('a 500 is returned, not thrown', () async {
      final adapter = HttpClientAdapter(MockClient((_) async => http.Response('boom', 500)));

      final response = await adapter.postJson(url: url, body: body);

      expect(response.statusCode, 500);
      expect(response.isSuccess, isFalse);
    });

    test('the 2xx boundary is closed at both ends', () {
      expect(const HttpClientResponse(statusCode: 199, body: '').isSuccess, isFalse);
      expect(const HttpClientResponse(statusCode: 200, body: '').isSuccess, isTrue);
      expect(const HttpClientResponse(statusCode: 299, body: '').isSuccess, isTrue);
      expect(const HttpClientResponse(statusCode: 300, body: '').isSuccess, isFalse);
    });
  });

  group('a request that never produced a response', () {
    test('a slow server becomes a timeout reason', () async {
      final adapter = HttpClientAdapter(
        MockClient((_) async {
          await Future<void>.delayed(const Duration(milliseconds: 200));
          return http.Response('{}', 200);
        }),
      );

      await expectLater(
        adapter.postJson(url: url, body: body, timeout: const Duration(milliseconds: 10)),
        throwsA(
          isA<HttpClientException>().having(
            (e) => e.reason,
            'reason',
            HttpFailureReason.timeout,
          ),
        ),
      );
    });

    test('an unreachable host becomes an unreachable reason', () async {
      final adapter = HttpClientAdapter(
        MockClient((_) async => throw http.ClientException('Connection refused', url)),
      );

      await expectLater(
        adapter.postJson(url: url, body: body),
        throwsA(
          isA<HttpClientException>().having(
            (e) => e.reason,
            'reason',
            HttpFailureReason.unreachable,
          ),
        ),
      );
    });

    // The message from `package:http` names the host and the port. It stops at
    // this boundary on purpose, so the failure that travels upwards is a code
    // the presentation layer translates, never an address on someone's screen.
    test('the underlying message never travels with the failure', () async {
      final adapter = HttpClientAdapter(
        MockClient(
          (_) async => throw http.ClientException(
            'Connection refused: 192.168.0.42:3000',
            url,
          ),
        ),
      );

      try {
        await adapter.postJson(url: url, body: body);
        fail('the adapter should have thrown');
      } on HttpClientException catch (error) {
        expect(error.toString(), 'HttpClientException(unreachable)');
        expect(error.toString(), isNot(contains('192.168')));
        expect(error.toString(), isNot(contains('3000')));
      }
    });
  });

  // Built without `const` on purpose. Every other use in the app is a constant
  // expression, folded at compile time, so the constructor body itself was
  // never actually run by the suite.
  test('the failure carries its reason and nothing more', () {
    final timeout = HttpClientException(HttpFailureReason.timeout);
    final unreachable = HttpClientException(HttpFailureReason.unreachable);

    expect(timeout.reason, HttpFailureReason.timeout);
    expect(unreachable.reason, HttpFailureReason.unreachable);
    expect(timeout.toString(), 'HttpClientException(timeout)');
    expect(unreachable.toString(), 'HttpClientException(unreachable)');
  });

  test('closing the adapter closes the client underneath it', () {
    final client = _RecordingClient();
    final adapter = HttpClientAdapter(client);

    expect(client.closeCount, 0);
    adapter.close();

    expect(client.closeCount, 1);
  });
}

/// Records `close`, which `MockClient` does not expose. The connection pool
/// outliving the screen that opened it is a leak the adapter is responsible
/// for, so the call has to be observable.
class _RecordingClient extends http.BaseClient {
  int closeCount = 0;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    return http.StreamedResponse(const Stream<List<int>>.empty(), 200);
  }

  @override
  void close() {
    closeCount++;
    super.close();
  }
}
