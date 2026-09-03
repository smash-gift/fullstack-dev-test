/// What the application is allowed to know about HTTP.
///
/// Rule R1: no layer imports `package:http`. They depend on this interface, and
/// exactly one file implements it. Two things follow, and both are worth the
/// indirection:
///
/// * a widget test injects a fake client instead of starting a server or
///   installing `HttpOverrides`;
/// * replacing the package is one new file, not a change rippling through
///   every caller.
abstract interface class IHttpClient {
  /// Sends a JSON body and returns the raw response.
  ///
  /// Never throws for an HTTP status: a `429` is an answer, and the caller is
  /// the one that knows what it means. Transport problems — no network, DNS,
  /// timeout — arrive as [HttpClientException], because those are not answers.
  Future<HttpClientResponse> postJson({
    required Uri url,
    required Map<String, Object?> body,
    Duration timeout,
  });

  /// Releases the underlying connection pool.
  void close();
}

/// A response, stripped of anything package-specific.
class HttpClientResponse {
  const HttpClientResponse({
    required this.statusCode,
    required this.body,
  });

  final int statusCode;
  final String body;

  bool get isSuccess => statusCode >= 200 && statusCode < 300;
}

/// The request never produced a response.
///
/// Deliberately not carrying the underlying exception's message: it names
/// hosts, ports and package internals, none of which belongs on a user's
/// screen. The [reason] is a code the presentation layer can translate.
class HttpClientException implements Exception {
  const HttpClientException(this.reason);

  final HttpFailureReason reason;

  @override
  String toString() => 'HttpClientException(${reason.name})';
}

enum HttpFailureReason {
  /// The server did not answer in time.
  timeout,

  /// The host could not be reached at all.
  unreachable,
}
