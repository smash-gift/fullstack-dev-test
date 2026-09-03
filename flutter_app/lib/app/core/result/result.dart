/// A success-or-failure value, so a caller cannot read the payload without
/// having dealt with the failure first.
///
/// Hand-written rather than pulled from `result_dart` or `dartz`: it is thirty
/// lines, it is the one type that touches every layer, and adding a dependency
/// for it would put a third-party type in the domain's public signatures.
sealed class Result<S, F> {
  const Result();

  bool get isSuccess => this is Success<S, F>;
  bool get isFailure => this is Failure<S, F>;

  /// The success value, or null. Named so that reading it looks like the
  /// deliberate act it is.
  S? get successOrNull => switch (this) {
    Success<S, F>(:final value) => value,
    Failure<S, F>() => null,
  };

  F? get failureOrNull => switch (this) {
    Success<S, F>() => null,
    Failure<S, F>(:final failure) => failure,
  };

  T fold<T>(T Function(S value) onSuccess, T Function(F failure) onFailure) {
    return switch (this) {
      Success<S, F>(:final value) => onSuccess(value),
      Failure<S, F>(:final failure) => onFailure(failure),
    };
  }
}

final class Success<S, F> extends Result<S, F> {
  const Success(this.value);
  final S value;
}

final class Failure<S, F> extends Result<S, F> {
  const Failure(this.failure);
  final F failure;
}
