class Suggestion {
  const Suggestion({required this.id, required this.text});

  final String id;
  final String text;

  factory Suggestion.fromJson(Map<String, dynamic> json) {
    return Suggestion(
      id: json['id'] as String? ?? '',
      text: json['text'] as String? ?? '',
    );
  }
}
