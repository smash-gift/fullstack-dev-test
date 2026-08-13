import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smash_gift/data/models/history_entry.dart';
import 'package:smash_gift/data/repositories/history_repository.dart';
import 'package:smash_gift/features/history/screens/history_screen.dart';

class _FakeHistoryRepository implements HistoryRepository {
  _FakeHistoryRepository({this.entries = const [], this.error});

  final List<HistoryEntry> entries;
  final Object? error;

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
    if (error != null) throw error!;
    yield entries;
  }
}

void main() {
  testWidgets('shows a loading indicator and then the list of entries', (tester) async {
    final entry = HistoryEntry.fromFirestoreData(
      {
        'occasion': 'aniversário de 15 anos',
        'relationship': 'afilhada',
        'messageOptions': ['A', 'B', 'C'],
        'selectedMessage': 'B',
      },
      createdAt: DateTime(2026, 8, 12, 10, 30),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: HistoryScreen(
          uid: 'uid-1',
          historyRepository: _FakeHistoryRepository(entries: [entry]),
        ),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await tester.pumpAndSettle();

    expect(find.textContaining('aniversário de 15 anos'), findsOneWidget);
    expect(find.text('B'), findsOneWidget);
  });

  testWidgets('shows an empty state when there is no history yet', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: HistoryScreen(uid: 'uid-1', historyRepository: _FakeHistoryRepository()),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Nenhum cartão por aqui ainda'), findsOneWidget);
  });

  testWidgets('shows an error state when the history stream fails', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: HistoryScreen(
          uid: 'uid-1',
          historyRepository: _FakeHistoryRepository(error: Exception('boom')),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Não foi possível carregar'), findsOneWidget);
  });
}
