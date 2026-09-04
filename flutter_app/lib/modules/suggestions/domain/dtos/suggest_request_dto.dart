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
    this.language,
    this.count = 3,
  });

  final String occasion;
  final String relationship;
  final SuggestionTone tone;

  /// Forces the language of the answer. Normally `null`.
  ///
  /// This used to carry the interface language, which meant the phone decided
  /// what the card said: someone typing "dia dos namorados" for an "esposa"
  /// on an English phone got an English card. What the user typed is the
  /// better signal, and the model reads it far better than we could, so the
  /// field is left out and the backend answers in the language of the words
  /// it was given.
  final String? language;
  final int count;

  /// Omits `language` entirely when it is null — the backend distinguishes an
  /// absent field from a pinned one, so sending an explicit null would read
  /// as a malformed pin rather than as "you decide".
  Map<String, Object?> toJson() => {
    'occasion': occasion,
    'relationship': relationship,
    'tone': tone.wireName,
    if (language != null) 'language': language,
    'count': count,
  };
}
