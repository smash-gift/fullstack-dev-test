import 'dart:convert';

import 'package:gift_card_suggester/app/core/drivers/http/i_http_client.dart';

/// An [IHttpClient] a test controls completely.
///
/// This is the payoff of rule R1: no server, no `HttpOverrides`, no waiting on
/// a socket. The whole client stack runs in a unit test at full speed because
/// the one replaceable package sits behind an interface.
class FakeHttpClient implements IHttpClient {
  FakeHttpClient({
    this.statusCode = 200,
    Map<String, Object?>? body,
    this.throwing,
    this.delay = Duration.zero,
  }) : body = body ?? successBody();

  int statusCode;
  Map<String, Object?> body;

  /// When set, [postJson] throws this instead of answering.
  HttpClientException? throwing;
  Duration delay;

  Uri? lastUrl;
  Map<String, Object?>? lastBody;
  int callCount = 0;

  @override
  Future<HttpClientResponse> postJson({
    required Uri url,
    required Map<String, Object?> body,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    callCount += 1;
    lastUrl = url;
    lastBody = body;

    if (delay > Duration.zero) await Future<void>.delayed(delay);
    final failure = throwing;
    if (failure != null) throw failure;

    return HttpClientResponse(statusCode: statusCode, body: jsonEncode(this.body));
  }

  @override
  void close() {}

  static Map<String, Object?> successBody({
    List<String> texts = const [
      'Happy birthday! So glad the world got you in it.',
      'Wishing you a year as bright and generous as you are.',
      'Another trip around the sun, and still my favourite person.',
    ],
    bool degraded = false,
    String? model = 'gpt-4o-mini',
    String? reason,
  }) {
    return {
      'data': {
        'suggestions': [
          for (var index = 0; index < texts.length; index++)
            {'id': 'sug_$index', 'text': texts[index]},
        ],
        'source': degraded ? 'fallback' : 'llm',
        'model': degraded ? null : model,
        'degraded': degraded,
      },
      'meta': {
        'requestId': 'req_test',
        'generatedAt': '2026-09-03T18:20:00.000Z',
        'cached': false,
        'reason': ?reason,
      },
    };
  }

  static Map<String, Object?> errorBody(
    String code, {
    Object? details,
  }) {
    return {
      'error': {
        'code': code,
        'message': 'something the client must not display verbatim',
        'details': ?details,
      },
      'meta': {'requestId': 'req_test', 'timestamp': '2026-09-03T18:20:00.000Z'},
    };
  }
}
