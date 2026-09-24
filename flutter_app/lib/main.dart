import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gift_card_suggester/presentation/suggester_screen.dart';

void main() {
  runApp(const ProviderScope(child: GiftCardSuggesterApp()));
}

class GiftCardSuggesterApp extends StatelessWidget {
  const GiftCardSuggesterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gift Card Message Suggester',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: Colors.deepPurple,
        useMaterial3: true,
      ),
      home: const SuggesterScreen(),
    );
  }
}
