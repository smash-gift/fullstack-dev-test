/// Error surfaced by the API client. Carries a user-safe message; the UI shows
/// [message] directly, so it must never contain raw/internal details.
class ApiException implements Exception {
  const ApiException(this.message);
  final String message;

  @override
  String toString() => 'ApiException: $message';
}
