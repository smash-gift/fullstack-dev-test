/// Representation of an operation result, containing either a success [Ok] value
/// or a failure [Error] exception.
sealed class Result<T> {
  const Result();

  /// Creates a successful result holding [value].
  factory Result.ok(T value) = Ok<T>;

  /// Creates an error result holding [error].
  factory Result.error(Exception error) = Error<T>;

  /// Returns true if this is an [Ok] result.
  bool get isOk => this is Ok<T>;

  /// Returns true if this is an [Error] result.
  bool get isError => this is Error<T>;

  /// Returns the underlying [Ok] value if successful, or throws [StateError].
  T get asOk {
    if (this is Ok<T>) {
      return (this as Ok<T>).value;
    }
    throw StateError('Cannot call asOk on an Error Result.');
  }

  /// Returns the underlying [Error] exception if failed, or throws [StateError].
  Exception get asError {
    if (this is Error<T>) {
      return (this as Error<T>).error;
    }
    throw StateError('Cannot call asError on an Ok Result.');
  }
}

/// Successful result wrapper.
final class Ok<T> extends Result<T> {
  final T value;
  const Ok(this.value);

  @override
  String toString() => 'Result.ok($value)';
}

/// Error result wrapper.
final class Error<T> extends Result<T> {
  final Exception error;
  const Error(this.error);

  @override
  String toString() => 'Result.error($error)';
}
