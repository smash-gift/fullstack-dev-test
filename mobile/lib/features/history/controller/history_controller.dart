import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../../data/models/history_entry.dart';
import '../../../data/repositories/history_repository.dart';

enum HistoryLoadStatus { loading, success, error }

/// Estado da listagem de histórico de um usuário autenticado, alimentado por
/// [HistoryRepository.watchHistory] (Firestore em tempo real).
///
/// `ChangeNotifier` nativo, mesmo padrão dos demais controllers do app — ver spec técnica do
/// mobile. Pertence a [HistoryScreen] (criado no `initState`, descartado no `dispose`), como
/// `MessageGenerationController` pertence a `MessageFormScreen`.
class HistoryController extends ChangeNotifier {
  HistoryController({required HistoryRepository repository, required String uid})
      : _repository = repository,
        _uid = uid {
    _subscription = _repository.watchHistory(_uid).listen(_handleEntries, onError: _handleError);
  }

  final HistoryRepository _repository;
  final String _uid;
  StreamSubscription<List<HistoryEntry>>? _subscription;

  HistoryLoadStatus _status = HistoryLoadStatus.loading;
  List<HistoryEntry> _entries = const [];
  String? _errorMessage;

  HistoryLoadStatus get status => _status;
  List<HistoryEntry> get entries => _entries;
  String? get errorMessage => _errorMessage;

  void _handleEntries(List<HistoryEntry> entries) {
    _entries = entries;
    _status = HistoryLoadStatus.success;
    _errorMessage = null;
    notifyListeners();
  }

  void _handleError(Object error) {
    _status = HistoryLoadStatus.error;
    _errorMessage = 'Não foi possível carregar seu histórico agora.';
    notifyListeners();
  }

  @override
  void dispose() {
    unawaited(_subscription?.cancel());
    super.dispose();
  }
}
