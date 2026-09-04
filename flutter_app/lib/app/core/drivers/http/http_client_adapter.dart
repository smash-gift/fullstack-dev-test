import 'dart:async';
import 'dart:convert';

// The one and only import of package:http in this project. Rule R1 exists so
// that this line has exactly one home, and a test can assert that by grep.
import 'package:http/http.dart' as http;

import 'i_http_client.dart';

/// Adapts `package:http` to [IHttpClient].
///
/// Nothing above this file knows the package exists.
class HttpClientAdapter implements IHttpClient {
  HttpClientAdapter(this._client);

  final http.Client _client;

  @override
  Future<HttpClientResponse> postJson({
    required Uri url,
    required Map<String, Object?> body,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    try {
      final response = await _client
          .post(
            url,
            headers: const {'Content-Type': 'application/json'},
            body: jsonEncode(body),
          )
          .timeout(timeout);

      return HttpClientResponse(
        statusCode: response.statusCode,
        body: response.body,
      );
    } on TimeoutException {
      // Handled, not swallowed: a timeout becomes a reason the UI can explain,
      // and the original message — which carries the host and port — stops
      // here.
      throw const HttpClientException(HttpFailureReason.timeout);
    } on http.ClientException {
      // DNS failure, connection refused, CORS rejection on web. All of them
      // mean the same thing to the user: the server could not be reached.
      throw const HttpClientException(HttpFailureReason.unreachable);
    }
  }

  @override
  void close() => _client.close();
}
