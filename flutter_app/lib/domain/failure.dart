/// A typed, user-facing failure. Mirrors the backend error handling on the
/// client side: raw exceptions are translated into one of these so the UI can
/// show a clear, safe message instead of a stack trace.
enum FailureKind {
  network,
  timeout,
  rateLimited,
  badRequest,
  server,
  unknown,
}

class Failure implements Exception {
  const Failure(this.kind, this.message);

  final FailureKind kind;
  final String message;

  @override
  String toString() => 'Failure($kind, $message)';
}
