import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../data/suggestions_api.dart';
import '../models/suggestion_response.dart';
import 'suggestion_controller.dart';

class SuggestionPage extends StatefulWidget {
  const SuggestionPage({required this.api, super.key});

  final SuggestionsApi api;

  @override
  State<SuggestionPage> createState() => _SuggestionPageState();
}

class _SuggestionPageState extends State<SuggestionPage> {
  static const occasions = <String>[
    'aniversário',
    'casamento',
    'agradecimento',
    'formatura',
    'Dia das Mães',
  ];

  static const relationships = <String>[
    'amigo(a)',
    'colega',
    'mãe',
    'pai',
    'parceiro(a)',
  ];

  late final SuggestionController _controller;
  late final TextEditingController _occasionController;
  late final TextEditingController _relationshipController;
  String? _validationMessage;

  @override
  void initState() {
    super.initState();
    _controller = SuggestionController(widget.api);
    _occasionController = TextEditingController(text: occasions.first);
    _relationshipController = TextEditingController(text: relationships.first);
  }

  @override
  void dispose() {
    _controller.dispose();
    _occasionController.dispose();
    _relationshipController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final occasion = _occasionController.text.trim();
    final relationship = _relationshipController.text.trim();
    if (occasion.isEmpty || relationship.isEmpty) {
      setState(() {
        if (occasion.isEmpty && relationship.isEmpty) {
          _validationMessage = 'Preencha ocasião e relacionamento.';
        } else if (occasion.isEmpty) {
          _validationMessage = 'Preencha a ocasião.';
        } else {
          _validationMessage = 'Preencha o relacionamento.';
        }
      });
      return;
    }

    setState(() => _validationMessage = null);
    await _controller.load(occasion: occasion, relationship: relationship);
  }

  void _setValue(TextEditingController controller, String value) {
    controller
      ..text = value
      ..selection = TextSelection.collapsed(offset: value.length);
    setState(() => _validationMessage = null);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gift Notes'),
        centerTitle: false,
      ),
      body: SafeArea(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, _) => SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 720),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Uma mensagem especial para cada presente.',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Conte a ocasião e para quem é o presente. A gente sugere algumas ideias para você escolher.',
                      style: theme.textTheme.bodyLarge,
                    ),
                    const SizedBox(height: 24),
                    _buildInput(
                      controller: _occasionController,
                      label: 'Ocasião',
                      hint: 'Ex.: aniversário',
                      icon: Icons.celebration_outlined,
                    ),
                    const SizedBox(height: 10),
                    _buildChips(
                      values: occasions,
                      selected: _occasionController.text,
                      onSelected: (value) =>
                          _setValue(_occasionController, value),
                    ),
                    const SizedBox(height: 18),
                    _buildInput(
                      controller: _relationshipController,
                      label: 'Relacionamento',
                      hint: 'Ex.: melhor amiga',
                      icon: Icons.people_outline,
                    ),
                    const SizedBox(height: 10),
                    _buildChips(
                      values: relationships,
                      selected: _relationshipController.text,
                      onSelected: (value) =>
                          _setValue(_relationshipController, value),
                    ),
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      onPressed: _controller.isLoading ? null : _submit,
                      icon: _controller.isLoading
                          ? const SizedBox.square(
                              dimension: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.auto_awesome),
                      label: Text(_controller.isLoading
                          ? 'Criando ideias...'
                          : 'Gerar sugestões'),
                    ),
                    const SizedBox(height: 24),
                    if (_validationMessage != null)
                      _buildError(_validationMessage!),
                    if (_controller.status == SuggestionStatus.error)
                      _buildError(
                          _controller.errorMessage ?? 'Tente novamente.'),
                    if (_controller.status == SuggestionStatus.success &&
                        _controller.response != null)
                      _buildResults(_controller.response!),
                    if (_controller.status == SuggestionStatus.idle)
                      _buildEmptyState(theme),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInput({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
  }) {
    return TextField(
      controller: controller,
      onChanged: (_) {
        if (_validationMessage != null) {
          setState(() => _validationMessage = null);
        }
      },
      textInputAction: TextInputAction.next,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon),
        border: const OutlineInputBorder(),
      ),
    );
  }

  Widget _buildChips({
    required List<String> values,
    required String selected,
    required ValueChanged<String> onSelected,
  }) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: values
          .map(
            (value) => ChoiceChip(
              label: Text(value),
              selected: selected == value,
              onSelected: (_) => onSelected(value),
            ),
          )
          .toList(growable: false),
    );
  }

  Widget _buildError(String message) {
    return Card(
      color: Theme.of(context).colorScheme.errorContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.error_outline,
                color: Theme.of(context).colorScheme.onErrorContainer),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onErrorContainer),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResults(SuggestionResponse result) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Text(
              'Suas sugestões',
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            if (result.isFallback) ...[
              const SizedBox(width: 8),
              const Chip(label: Text('modo offline')),
            ],
          ],
        ),
        const SizedBox(height: 10),
        ...result.suggestions.asMap().entries.map(
              (entry) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  leading: CircleAvatar(child: Text('${entry.key + 1}')),
                  title: Text(entry.value),
                  trailing: IconButton(
                    tooltip: 'Copiar mensagem',
                    icon: const Icon(Icons.copy_outlined),
                    onPressed: () => _copyMessage(entry.value),
                  ),
                ),
              ),
            ),
      ],
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Icon(Icons.card_giftcard,
                size: 42, color: theme.colorScheme.primary),
            const SizedBox(height: 10),
            Text(
              'Suas ideias vão aparecer aqui.',
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 4),
            const Text(
                'Você pode editar os campos ou escolher uma opção rápida acima.'),
          ],
        ),
      ),
    );
  }

  Future<void> _copyMessage(String message) async {
    await Clipboard.setData(ClipboardData(text: message));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Mensagem copiada.')),
    );
  }
}
