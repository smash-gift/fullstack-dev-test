import 'package:flutter/foundation.dart';
import 'result.dart';

typedef Action0<T> = Future<Result<T>> Function();
typedef Action1<T, P> = Future<Result<T>> Function(P param);

/// Base class encapsulating an asynchronous action as a Command.
///
/// Exposes state changes reactively to listeners via [ChangeNotifier].
abstract class Command<T> extends ChangeNotifier {
  bool _running = false;
  Result<T>? _result;

  /// Whether the command is currently executing an async action.
  bool get running => _running;

  /// Whether the command has finished executing at least once.
  bool get completed => _result != null;

  /// Whether the command completed with an error.
  bool get error => _result != null && _result!.isError;

  /// The result of the last execution, or `null` if not executed yet.
  Result<T>? get result => _result;

  /// Resets the command state by clearing the stored result.
  void clearResult() {
    _result = null;
    notifyListeners();
  }

  /// Internal helper to execute action with state notifications.
  Future<void> _run(Future<Result<T>> Function() action) async {
    if (_running) return;

    _running = true;
    _result = null;
    notifyListeners();

    try {
      _result = await action();
    } catch (e) {
      _result = Result.error(e is Exception ? e : Exception(e.toString()));
    } finally {
      _running = false;
      notifyListeners();
    }
  }
}

/// Command taking **no parameters** for asynchronous operations.
class Command0<T> extends Command<T> {
  final Action0<T> _action;

  Command0(this._action);

  /// Executes the underlying parameterless action.
  Future<void> execute() async {
    await _run(() => _action());
  }
}

/// Command taking **one parameter** of type [P] for asynchronous operations.
class Command1<T, P> extends Command<T> {
  final Action1<T, P> _action;

  Command1(this._action);

  /// Executes the underlying action with the given [param].
  Future<void> execute(P param) async {
    await _run(() => _action(param));
  }
}
