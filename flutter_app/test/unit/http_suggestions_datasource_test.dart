import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/app/core/drivers/http/i_http_client.dart';
import 'package:gift_card_suggester/modules/suggestions/domain/dtos/suggest_request_dto.dart';
import 'package:gift_card_suggester/modules/suggestions/external/datasources/http_suggestions_datasource.dart';
import 'package:gift_card_suggester/modules/suggestions/infra/datasources/i_suggestions_datasource.dart';

/// The two paths the fake client cannot reach: a base URL the user typed with
/// a trailing slash, and an error body that is not JSON at all.
///
/// Both are things a real deployment hands you — a copied address, a proxy's
/// HTML error page — and both used to be untested.
void main() {
  const request = SuggestRequestDto(
    occasion: 'birthday',
    relationship: 'friend',
    tone: SuggestionTone.warm,
    language: 'en',
  );

  HttpSuggestionsDatasource datasourceFor(_RawClient client, String baseUrl) {
    return HttpSuggestionsDatasource(httpClient: client, baseUrlResolver: () => baseUrl);
  }

  group('the address the user typed', () {
    test('a trailing slash does not become a double slash', () async {
      final client = _RawClient(200, _successBody);

      await datasourceFor(client, 'http://localhost:3000/').fetchSuggestions(request);

      expect(client.lastUrl.toString(), 'http://localhost:3000/api/v1/suggestions');
    });

    test('an address without one is left exactly as it is', () async {
      final client = _RawClient(200, _successBody);

      await datasourceFor(client, 'http://localhost:3000').fetchSuggestions(request);

      expect(client.lastUrl.toString(), 'http://localhost:3000/api/v1/suggestions');
    });

    test('surrounding whitespace is trimmed off', () async {
      final client = _RawClient(200, _successBody);

      await datasourceFor(client, '  http://localhost:3000  ').fetchSuggestions(request);

      expect(client.lastUrl.toString(), 'http://localhost:3000/api/v1/suggestions');
    });
  });

  group('an error body we cannot read', () {
    // A proxy or load balancer in front of the API answers with HTML. There is
    // no `error.code` to route on, and guessing one would invent a reason the
    // server never gave.
    test('an HTML error page lands in the generic server failure', () async {
      final client = _RawClient(502, '<html><body>Bad Gateway</body></html>');

      await expectLater(
        datasourceFor(client, 'http://localhost:3000').fetchSuggestions(request),
        throwsA(
          isA<SuggestionsDatasourceException>().having(
            (e) => e.kind,
            'kind',
            DatasourceFailureKind.server,
          ),
        ),
      );
    });

    test('an empty error body does the same', () async {
      final client = _RawClient(500, '');

      await expectLater(
        datasourceFor(client, 'http://localhost:3000').fetchSuggestions(request),
        throwsA(isA<SuggestionsDatasourceException>()),
      );
    });

    test('valid JSON without an error object does the same', () async {
      final client = _RawClient(503, '{"message":"unavailable"}');

      await expectLater(
        datasourceFor(client, 'http://localhost:3000').fetchSuggestions(request),
        throwsA(
          isA<SuggestionsDatasourceException>().having(
            (e) => e.kind,
            'kind',
            DatasourceFailureKind.server,
          ),
        ),
      );
    });
  });

  // The failure travels as a kind, never as a message: `toString` is what ends
  // up in a log line, and it must not start carrying server prose.
  test('the exception names its kind and nothing else', () {
    const failure = SuggestionsDatasourceException(DatasourceFailureKind.rateLimited);

    expect(failure.toString(), 'SuggestionsDatasourceException(rateLimited)');
  });
}

const _successBody =
    '{"data":{"suggestions":[{"id":"s1","text":"one"},{"id":"s2","text":"two"}],'
    '"source":"llm","model":"gpt-4o-mini","degraded":false},'
    '"meta":{"requestId":"req_1","generatedAt":"2026-09-03T00:00:00.000Z","cached":false}}';

/// Answers with a body the test writes verbatim, so a response that is not JSON
/// can be exercised. The shared fake always encodes a map, which is exactly the
/// case that never needed testing.
class _RawClient implements IHttpClient {
  _RawClient(this.statusCode, this.body);

  final int statusCode;
  final String body;
  late Uri lastUrl;

  @override
  Future<HttpClientResponse> postJson({
    required Uri url,
    required Map<String, Object?> body,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    lastUrl = url;
    return HttpClientResponse(statusCode: statusCode, body: this.body);
  }

  @override
  void close() {}
}
