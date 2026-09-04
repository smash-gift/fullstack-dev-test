/// One gift card message, as it came from the backend.
///
/// Rule R3: an entity describes what arrives. It has no `toJson`, because
/// nothing in this app ever sends a suggestion anywhere.
class Suggestion {
  const Suggestion({required this.id, required this.text});

  /// Stable within one response, so a list can key on it. Carries no meaning
  /// across requests.
  final String id;
  final String text;
}
