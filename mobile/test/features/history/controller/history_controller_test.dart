import 'package:flutter_test/flutter_test.dart';
import 'package:smash_gift/data/models/history_entry.dart';
import 'package:smash_gift/data/repositories/history_repository.dart';
import 'package:smash_gift/features/history/controller/history_controller.dart';

class _FakeHistoryRepository implements HistoryRepository {
  _FakeHistoryRepository({List<HistoryEntry>? initialEntries, this.watchError})
      : _entries = initialEntries ?? const [];

  final List<HistoryEntry> _entries;
  final Object? watchError;

  @override
  Future<void> addEntry({
    required String uid,
    required String occasion,
    required String relationship,
    required List<String> messageOptions,
    required String selectedMessage,
  }) async {}

  @override
  Stream<List<HistoryEntry>> watchHistory(String uid) async* {
    if (watchError != null) {
      throw watchError!;
    }
    yield _entries;
  }
}

void main() {
  group('HistoryController', () {
    test('starts in loading state', () {
      final controller = HistoryController(repository: _FakeHistoryRepository(), uid: 'uid-1');

      expect(controller.status, HistoryLoadStatus.loading);
    });

    test('moves to success with the entries from the repository', () async {
      final entries = [
        const HistoryEntry(
          occasion: 'aniversário',
          relationship: 'mãe',
          messageOptions: ['A', 'B', 'C'],
          selectedMessage: 'A',
          createdAt: null,
        ),
      ];
      final controller = HistoryController(
        repository: _FakeHistoryRepository(initialEntries: entries),
        uid: 'uid-1',
      );

      await Future<void>.delayed(Duration.zero);

      expect(controller.status, HistoryLoadStatus.success);
      expect(controller.entries, entries);
    });

    test('moves to error when the repository stream fails', () async {
      final controller = HistoryController(
        repository: _FakeHistoryRepository(watchError: Exception('boom')),
        uid: 'uid-1',
      );

      await Future<void>.delayed(Duration.zero);

      expect(controller.status, HistoryLoadStatus.error);
      expect(controller.errorMessage, isNotNull);
    });
  });
}
