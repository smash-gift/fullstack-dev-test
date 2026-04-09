import 'package:flutter/material.dart';
import '../widgets/occasion_selector.dart';
import '../widgets/relationship_selector.dart';
import '../widgets/suggestion_list.dart';
import '../services/suggestion_service.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key, required this.service});

  final SuggestionService service;

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  String? _occasion;
  String? _relationship;
  bool _loading = false;
  String? _error;
  List<String> _suggestions = [];

  void _getSuggestions() async {
    setState(() {
      _loading = true;
      _error = null;
      _suggestions = [];
    });
    try {
      final suggestions = await widget.service.getSuggestions(
        occasion: _occasion!,
        relationship: _relationship!,
      );
      setState(() {
        _suggestions = suggestions;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao buscar sugestões. Tente novamente.';
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mensagens para Cartões-Presente'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 16),
            const Text(
              'Escolha a ocasião e o relacionamento, e nossa IA criará sugestões personalizadas para você.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 32),
            OccasionSelector(
              selected: _occasion,
              onSelect: (val) => setState(() => _occasion = val),
            ),
            const SizedBox(height: 24),
            RelationshipSelector(
              selected: _relationship,
              onSelect: (val) => setState(() => _relationship = val),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: (_occasion != null && _relationship != null && !_loading)
                  ? _getSuggestions
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.pink,
                padding: const EdgeInsets.symmetric(vertical: 16),
                textStyle: const TextStyle(fontSize: 18),
              ),
              child: _loading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                    )
                  : const _GenerateSuggestionsLabel(),
            ),
            const SizedBox(height: 32),
            if (_error != null)
              Text(_error!, style: const TextStyle(color: Colors.red), textAlign: TextAlign.center),
            if (_suggestions.isNotEmpty)
              SuggestionList(suggestions: _suggestions),
          ],
        ),
      ),
    );
  }
}

class _GenerateSuggestionsLabel extends StatelessWidget {
  const _GenerateSuggestionsLabel();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: const [
        Icon(Icons.auto_fix_high, color: Colors.white, size: 18),
        SizedBox(width: 10),
        Text(
          'Gerar Sugestões',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
