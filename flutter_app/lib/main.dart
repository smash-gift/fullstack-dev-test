import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/suggestion_provider.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const GiftCardApp());
}

class GiftCardApp extends StatelessWidget {
  const GiftCardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => SuggestionProvider(),
      child: MaterialApp(
        title: 'Gift Card Suggester',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF6B4226),
          ),
          fontFamily: 'Roboto',
        ),
        home: const HomeScreen(),
      ),
    );
  }
}
