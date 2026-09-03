/// The tones the backend accepts. Kept as an enum so an unsupported value
/// cannot be built, and mapped to the wire name in one place.
enum SuggestionTone {
  warm('warm'),
  funny('funny'),
  formal('formal'),
  heartfelt('heartfelt');

  const SuggestionTone(this.wireName);
  final String wireName;
}

/// What goes to the backend.
///
/// Rule R3: a DTO describes what is sent. It has `toJson` and no `fromJson`.
///
/// The use case takes this object rather than loose parameters, so adding a
/// field is one class changing — not a signature edit rippling through the
/// store, the use case, the repository and the datasource.
class SuggestRequestDto {
  const SuggestRequestDto({
    required this.occasion,
    required this.relationship,
    required this.tone,
    required this.language,
    this.count = 3,
  });

  final String occasion;
  final String relationship;
  final SuggestionTone tone;

  /// Matches the interface language, so the card reads like the app around it.
  final String language;
  final int count;

  Map<String, Object?> toJson() => {
    'occasion': occasion,
    'relationship': relationship,
    'tone': tone.wireName,
    'language': language,
    'count': count,
  };
}
