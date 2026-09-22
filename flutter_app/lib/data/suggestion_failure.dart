sealed class SuggestionFailure {
  const SuggestionFailure(this.message);

  /// Already written for a person to read: the UI renders it as is.
  final String message;
}

class NetworkFailure extends SuggestionFailure {
  const NetworkFailure()
      : super('Could not reach the server. Check that the backend is running and try again.');
}

class TimeoutFailure extends SuggestionFailure {
  const TimeoutFailure() : super('The server took too long to answer. Please try again.');
}

class InvalidInputFailure extends SuggestionFailure {
  const InvalidInputFailure(super.message);
}

class RateLimitFailure extends SuggestionFailure {
  const RateLimitFailure(this.retryAfterSeconds)
      : super('Too many requests. Please wait a moment and try again.');

  final int retryAfterSeconds;
}

class ServerFailure extends SuggestionFailure {
  const ServerFailure() : super('Something went wrong on our side. Please try again.');
}
