import 'package:flutter/material.dart';
import '../../../data/repositories/suggester_repository.dart';
import '../view_models/suggester_view_model.dart';

class SuggesterScreen extends StatefulWidget {
  final SuggesterViewModel viewModel;

  const SuggesterScreen({super.key, required this.viewModel});

  @override
  State<SuggesterScreen> createState() => _SuggesterScreenState();
}

class _SuggesterScreenState extends State<SuggesterScreen> {
  final _occasionController = TextEditingController(text: 'Aniversário');
  final _relationshipController = TextEditingController(text: 'Amigo');

  @override
  void dispose() {
    _occasionController.dispose();
    _relationshipController.dispose();
    super.dispose();
  }

  void _onGeneratePressed() {
    widget.viewModel.generateCommand.execute(
      SuggestionRequestParams(
        occasion: _occasionController.text,
        relationship: _relationshipController.text,
        language: 'pt-BR',
        guestId: 'guest-uuid-v4-placeholder',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Gift Card Suggester'),
      ),
      body: ListenableBuilder(
        listenable: widget.viewModel.generateCommand,
        builder: (context, _) {
          final command = widget.viewModel.generateCommand;

          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: _occasionController,
                  decoration: const InputDecoration(labelText: 'Ocasião'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _relationshipController,
                  decoration: const InputDecoration(labelText: 'Relacionamento'),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: command.running ? null : _onGeneratePressed,
                  child: command.running
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Gerar Sugestões'),
                ),
                const SizedBox(height: 24),

                // State Handling based on Command execution
                if (command.running)
                  const Center(child: CircularProgressIndicator())
                else if (command.error)
                  Card(
                    color: Theme.of(context).colorScheme.errorContainer,
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Text(
                        'Erro ao carregar sugestões: ${command.result?.asError}',
                        style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer),
                      ),
                    ),
                  )
                else if (command.completed && command.result!.isOk)
                  Expanded(
                    child: ListView.builder(
                      itemCount: command.result!.asOk.length,
                      itemBuilder: (context, index) {
                        final item = command.result!.asOk[index];
                        return Card(
                          child: ListTile(
                            title: Text(item.text),
                            subtitle: Text('${item.occasion} • ${item.relationship}'),
                          ),
                        );
                      },
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
