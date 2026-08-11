/// Parameters required to request gift card message suggestions.
class SuggestionRequestParams {
  final String occasion;
  final String relationship;
  final String language;
  final String guestId;

  const SuggestionRequestParams({
    required this.occasion,
    required this.relationship,
    required this.language,
    required this.guestId,
  });
}
