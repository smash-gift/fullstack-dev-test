import 'package:flutter_test/flutter_test.dart';
import 'package:smash_gift/data/models/history_entry.dart';

void main() {
  group('HistoryEntry.fromFirestoreData', () {
    test('maps a valid document', () {
      final entry = HistoryEntry.fromFirestoreData(
        {
          'occasion': 'aniversário de 15 anos da minha afilhada',
          'relationship': 'afilhada',
          'messageOptions': ['A', 'B', 'C'],
          'selectedMessage': 'B',
        },
        createdAt: DateTime(2026, 8, 12),
      );

      expect(entry.occasion, 'aniversário de 15 anos da minha afilhada');
      expect(entry.relationship, 'afilhada');
      expect(entry.messageOptions, ['A', 'B', 'C']);
      expect(entry.selectedMessage, 'B');
      expect(entry.createdAt, DateTime(2026, 8, 12));
    });

    test('falls back to empty values when fields are missing', () {
      final entry = HistoryEntry.fromFirestoreData(const {});

      expect(entry.occasion, '');
      expect(entry.relationship, '');
      expect(entry.messageOptions, isEmpty);
      expect(entry.selectedMessage, '');
      expect(entry.createdAt, isNull);
    });

    test('createdAt is null when not provided (serverTimestamp not resolved yet)', () {
      final entry = HistoryEntry.fromFirestoreData({
        'occasion': 'aniversário',
        'relationship': 'mãe',
        'messageOptions': ['A'],
        'selectedMessage': 'A',
      });

      expect(entry.createdAt, isNull);
    });
  });
}
