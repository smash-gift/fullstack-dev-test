import 'package:flutter/material.dart';

import 'data/suggestions_api.dart';
import 'presentation/suggestion_page.dart';

const defaultApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://127.0.0.1:3000/',
);

void main() {
  runApp(GiftMessageApp(apiBaseUrl: Uri.parse(defaultApiBaseUrl)));
}

class GiftMessageApp extends StatefulWidget {
  const GiftMessageApp({required this.apiBaseUrl, super.key});

  final Uri apiBaseUrl;

  @override
  State<GiftMessageApp> createState() => _GiftMessageAppState();
}

class _GiftMessageAppState extends State<GiftMessageApp> {
  late final SuggestionsApiClient _apiClient;

  @override
  void initState() {
    super.initState();
    _apiClient = SuggestionsApiClient(baseUrl: widget.apiBaseUrl);
  }

  @override
  void dispose() {
    _apiClient.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme =
        ColorScheme.fromSeed(seedColor: const Color(0xFF6750A4));
    return MaterialApp(
      title: 'Gift Notes',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: colorScheme,
        useMaterial3: true,
        inputDecorationTheme: const InputDecorationTheme(filled: true),
        cardTheme: const CardThemeData(margin: EdgeInsets.zero),
      ),
      home: SuggestionPage(api: _apiClient),
    );
  }
}
