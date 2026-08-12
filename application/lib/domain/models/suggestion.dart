/// Pure Domain Model representing a gift card message suggestion.
class Suggestion {
  final String id;
  final String text;
  final String occasion;
  final String relationship;
  final String language;
  final String tone;
  final bool isFallback;

  const Suggestion({
    required this.id,
    required this.text,
    required this.occasion,
    required this.relationship,
    required this.language,
    this.tone = 'Warm',
    this.isFallback = false,
  });
}
