import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/data/models/suggestion_response.dart';

void main() {
  group('SuggestionSource.fromString', () {
    test('maps "llm" to llm', () {
      expect(SuggestionSource.fromString('llm'), SuggestionSource.llm);
    });

    test('maps "fallback" to fallback', () {
      expect(
        SuggestionSource.fromString('fallback'),
        SuggestionSource.fallback,
      );
    });

    test('defaults unknown / null to fallback', () {
      expect(SuggestionSource.fromString(null), SuggestionSource.fallback);
      expect(SuggestionSource.fromString('weird'), SuggestionSource.fallback);
    });
  });

  group('SuggestionResponse.fromJson', () {
    test('parses suggestions and source', () {
      final r = SuggestionResponse.fromJson(<String, dynamic>{
        'suggestions': ['a', 'b', 'c'],
        'source': 'llm',
      });
      expect(r.suggestions, ['a', 'b', 'c']);
      expect(r.source, SuggestionSource.llm);
    });

    test('handles a missing suggestions field gracefully', () {
      final r = SuggestionResponse.fromJson(<String, dynamic>{
        'source': 'fallback',
      });
      expect(r.suggestions, isEmpty);
      expect(r.source, SuggestionSource.fallback);
    });

    test('coerces non-string items to strings', () {
      final r = SuggestionResponse.fromJson(<String, dynamic>{
        'suggestions': [1, true, 'x'],
        'source': 'llm',
      });
      expect(r.suggestions, ['1', 'true', 'x']);
    });
  });
}
