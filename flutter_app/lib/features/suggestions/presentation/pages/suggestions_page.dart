// ignore_for_file: deprecated_member_use
import 'package:flutter_app/features/suggestions/presentation/cubit/suggestions_state.dart';
import 'package:flutter_app/features/suggestions/presentation/cubit/suggestions_cubit.dart';
import 'package:flutter_app/core/di/injection_container.dart';
import 'package:flutter_app/core/utils/toast_service.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class SuggestionsPage extends StatelessWidget {
  const SuggestionsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<SuggestionsCubit>(),
      child: const _SuggestionsView(),
    );
  }
}

class _SuggestionsView extends StatefulWidget {
  const _SuggestionsView();

  @override
  State<_SuggestionsView> createState() => _SuggestionsViewState();
}

class _SuggestionsViewState extends State<_SuggestionsView> {
  final _occasionController = TextEditingController();
  final _relationshipController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  final _occasionOptions = [
    'Aniversário',
    'Casamento',
    'Formatura',
    'Natal',
    'Dia das Mães',
    'Dia dos Pais',
    'Obrigado',
    'Outro',
  ];

  final _relationshipOptions = [
    'Amigo',
    'Colega',
    'Pai',
    'Mãe',
    'Filho',
    'Namorado(a)',
    'Cônjuge',
    'Outro',
  ];

  String? _selectedOccasion;
  String? _selectedRelationship;

  @override
  void dispose() {
    _occasionController.dispose();
    _relationshipController.dispose();
    super.dispose();
  }

  void _onSubmit() {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final occasion = _selectedOccasion == 'Outro'
        ? _occasionController.text.trim()
        : _selectedOccasion ?? '';

    final relationship = _selectedRelationship == 'Outro'
        ? _relationshipController.text.trim()
        : _selectedRelationship ?? '';

    context.read<SuggestionsCubit>().fetchSuggestions(
      occasion: occasion,
      relationship: relationship,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('🎁 Sugestor de Mensagens'),
        centerTitle: true,
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: BlocConsumer<SuggestionsCubit, SuggestionsState>(
        listener: (context, state) {
          if (state is SuggestionsSuccess && state.result.isFromFallback) {
            ToastService.showError(
              context,
              'IA indisponível. Exibindo sugestões padrão.',
            );
          }
        },
        builder: (context, state) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildHeader(),
                  const SizedBox(height: 32),
                  _buildOccasionField(),
                  const SizedBox(height: 16),
                  _buildRelationshipField(),
                  const SizedBox(height: 32),
                  _buildSubmitButton(state),
                  const SizedBox(height: 32),
                  _buildResults(state),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        const Icon(Icons.card_giftcard, size: 64, color: Colors.deepPurple),
        const SizedBox(height: 12),
        Text(
          'Gere mensagens personalizadas\npara seu vale-presente',
          textAlign: TextAlign.center,
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(color: Colors.grey.shade600),
        ),
      ],
    );
  }

  Widget _buildOccasionField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DropdownButtonFormField<String>(
          decoration: const InputDecoration(
            labelText: 'Ocasião',
            prefixIcon: Icon(Icons.celebration),
            border: OutlineInputBorder(),
          ),
          value: _selectedOccasion,
          items: _occasionOptions
              .map((o) => DropdownMenuItem(value: o, child: Text(o)))
              .toList(),
          onChanged: (value) => setState(() => _selectedOccasion = value),
          validator: (value) => value == null ? 'Selecione uma ocasião' : null,
        ),
        if (_selectedOccasion == 'Outro') ...[
          const SizedBox(height: 12),
          TextFormField(
            controller: _occasionController,
            decoration: const InputDecoration(
              labelText: 'Descreva a ocasião',
              border: OutlineInputBorder(),
            ),
            validator: (value) => (value == null || value.trim().isEmpty)
                ? 'Informe a ocasião'
                : null,
          ),
        ],
      ],
    );
  }

  Widget _buildRelationshipField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DropdownButtonFormField<String>(
          decoration: const InputDecoration(
            labelText: 'Relacionamento',
            prefixIcon: Icon(Icons.people),
            border: OutlineInputBorder(),
          ),
          value: _selectedRelationship,
          items: _relationshipOptions
              .map((r) => DropdownMenuItem(value: r, child: Text(r)))
              .toList(),
          onChanged: (value) => setState(() => _selectedRelationship = value),
          validator: (value) =>
              value == null ? 'Selecione um relacionamento' : null,
        ),
        if (_selectedRelationship == 'Outro') ...[
          const SizedBox(height: 12),
          TextFormField(
            controller: _relationshipController,
            decoration: const InputDecoration(
              labelText: 'Descreva o relacionamento',
              border: OutlineInputBorder(),
            ),
            validator: (value) => (value == null || value.trim().isEmpty)
                ? 'Informe o relacionamento'
                : null,
          ),
        ],
      ],
    );
  }

  Widget _buildSubmitButton(SuggestionsState state) {
    final isLoading = state is SuggestionsLoading;

    return FilledButton.icon(
      onPressed: isLoading ? null : _onSubmit,
      icon: isLoading
          ? const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : const Icon(Icons.auto_awesome),
      label: Text(isLoading ? '' : 'Gerar Sugestões'),
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 16),
      ),
    );
  }

  Widget _buildResults(SuggestionsState state) {
    if (state is SuggestionsInitial) return const SizedBox.shrink();

    if (state is SuggestionsLoading) {
      return const SizedBox.shrink();
    }

    if (state is SuggestionsError) {
      return _buildErrorCard(state.message);
    }

    if (state is SuggestionsSuccess) {
      return _buildSuccessCards(state);
    }

    return const SizedBox.shrink();
  }

  Widget _buildErrorCard(String message) {
    return Card(
      color: Colors.red.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(Icons.error_outline, color: Colors.red.shade700),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: TextStyle(color: Colors.red.shade700),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessCards(SuggestionsSuccess state) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Sugestões geradas ✨',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        ...state.result.suggestions.map(
          (suggestion) => _buildSuggestionCard(suggestion),
        ),
        const SizedBox(height: 16),
        Center(
          child: TextButton.icon(
            onPressed: () => context.read<SuggestionsCubit>().reset(),
            icon: const Icon(Icons.refresh),
            label: const Text('Gerar novamente'),
          ),
        ),
      ],
    );
  }

  Widget _buildSuggestionCard(String suggestion) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: const Icon(Icons.format_quote, color: Colors.deepPurple),
        title: Text(suggestion),
        trailing: IconButton(
          icon: const Icon(Icons.copy_outlined),
          tooltip: 'Copiar mensagem',
          onPressed: () {
            Clipboard.setData(ClipboardData(text: suggestion));
            ToastService.showSuccess(context, 'Mensagem copiada!');
          },
        ),
      ),
    );
  }
}
