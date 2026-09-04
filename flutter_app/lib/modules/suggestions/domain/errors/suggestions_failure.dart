/// Why a request did not produce suggestions.
///
/// A degraded response is **not** here: it is a success carrying
/// `degraded: true`. Modelling it as a failure would be the client
/// contradicting the contract the backend was built around.
sealed class SuggestionsFailure {
  const SuggestionsFailure();
}

/// The server was never reached.
class ConnectionFailure extends SuggestionsFailure {
  const ConnectionFailure();
}

/// The server was reached and did not answer in time.
class TimeoutFailure extends SuggestionsFailure {
  const TimeoutFailure();
}

/// The backend rejected the input. [fieldIssues] maps a field name to what is
/// wrong with it, so the message lands on the field instead of in a banner.
class ValidationFailure extends SuggestionsFailure {
  const ValidationFailure(this.fieldIssues);
  final Map<String, String> fieldIssues;
}

/// The rate limit was exceeded. Deliberately never degrades: `429` is a signal
/// to slow down, and showing suggestions anyway would teach the user that
/// insisting works.
class RateLimitedFailure extends SuggestionsFailure {
  const RateLimitedFailure(this.retryAfterSeconds);
  final int retryAfterSeconds;
}

/// Anything else the server said, plus any answer we could not read.
class ServerFailure extends SuggestionsFailure {
  const ServerFailure();
}
