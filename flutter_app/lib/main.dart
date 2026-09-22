import 'package:flutter/material.dart';

import 'data/suggestion_api.dart';
import 'state/suggester_controller.dart';
import 'ui/suggester_page.dart';

void main() {
  runApp(GiftMessageSuggesterApp(controller: SuggesterController(api: SuggestionApi())));
}

class GiftMessageSuggesterApp extends StatefulWidget {
  const GiftMessageSuggesterApp({required this.controller, super.key});

  final SuggesterController controller;

  @override
  State<GiftMessageSuggesterApp> createState() => _GiftMessageSuggesterAppState();
}

class _GiftMessageSuggesterAppState extends State<GiftMessageSuggesterApp> {
  @override
  void dispose() {
    widget.controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gift Card Message Suggester',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2F6BD8)),
        useMaterial3: true,
      ),
      home: SuggesterPage(controller: widget.controller),
    );
  }
}
