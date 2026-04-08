import 'package:flutter/material.dart';
import 'services/suggestion_service.dart';
import 'screens/main_screen.dart';

void main() {
  runApp(GiftMsgApp(service: SuggestionService()));
}

class GiftMsgApp extends StatelessWidget {
  const GiftMsgApp({super.key, required this.service});

  final SuggestionService service;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GiftMsg',
      theme: ThemeData(
        primarySwatch: Colors.pink,
        fontFamily: 'Montserrat',
      ),
      home: MainScreen(service: service),
      debugShowCheckedModeBanner: false,
    );
  }
}
