import 'package:equatable/equatable.dart';

class SuggestionResult extends Equatable {
  final List<String> suggestions;
  final bool isFromFallback;

  const SuggestionResult({
    required this.suggestions,
    required this.isFromFallback,
  });

  @override
  List<Object> get props => [suggestions, isFromFallback];
}
