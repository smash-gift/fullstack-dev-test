import 'package:flutter/material.dart';

import '../state/suggester_controller.dart';
import '../state/suggester_state.dart';
import 'widgets/degraded_notice.dart';
import 'widgets/failure_view.dart';
import 'widgets/suggestion_card.dart';

const _occasionPresets = ['Birthday', 'Wedding', 'Thank you', 'Graduation', 'New job'];
const _relationshipPresets = ['Friend', 'Colleague', 'Mother', 'Father', 'Partner'];

class SuggesterPage extends StatefulWidget {
  const SuggesterPage({required this.controller, super.key});

  final SuggesterController controller;

  @override
  State<SuggesterPage> createState() => _SuggesterPageState();
}

class _SuggesterPageState extends State<SuggesterPage> {
  final _formKey = GlobalKey<FormState>();
  final _occasion = TextEditingController();
  final _relationship = TextEditingController();

  @override
  void dispose() {
    _occasion.dispose();
    _relationship.dispose();
    super.dispose();
  }

  void _submit({bool refresh = false}) {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();
    widget.controller.requestSuggestions(
      occasion: _occasion.text,
      relationship: _relationship.text,
      refresh: refresh,
    );
  }

  String? _validate(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.length < 2) return 'Please enter at least 2 characters';
    if (trimmed.length > 40) return 'Please keep it under 40 characters';
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Gift Card Message Suggester')),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _Field(
                        fieldKey: const ValueKey('occasion-field'),
                        controller: _occasion,
                        label: 'Occasion',
                        hint: 'e.g. Birthday',
                        presets: _occasionPresets,
                        validator: _validate,
                        onPreset: (value) => setState(() => _occasion.text = value),
                      ),
                      const SizedBox(height: 20),
                      _Field(
                        fieldKey: const ValueKey('relationship-field'),
                        controller: _relationship,
                        label: 'Relationship',
                        hint: 'e.g. Friend',
                        presets: _relationshipPresets,
                        validator: _validate,
                        onPreset: (value) => setState(() => _relationship.text = value),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                ListenableBuilder(
                  listenable: widget.controller,
                  builder: (context, _) {
                    final state = widget.controller.state;

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        FilledButton.icon(
                          key: const ValueKey('submit-button'),
                          onPressed: widget.controller.isLoading ? null : () => _submit(),
                          icon: widget.controller.isLoading
                              ? const SizedBox.square(
                                  dimension: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.auto_awesome),
                          label: Text(
                            widget.controller.isLoading ? 'Writing...' : 'Get suggestions',
                          ),
                        ),
                        const SizedBox(height: 24),
                        _Results(state: state, onRetry: () => _submit(refresh: true)),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Results extends StatelessWidget {
  const _Results({required this.state, required this.onRetry});

  final SuggesterState state;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return switch (state) {
      SuggesterIdle() => const _Hint(),
      SuggesterLoading() => const Padding(
          padding: EdgeInsets.symmetric(vertical: 32),
          child: Center(child: CircularProgressIndicator()),
        ),
      SuggesterFailed(:final failure) => FailureView(failure: failure, onRetry: onRetry),
      SuggesterLoaded(:final result) => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (result.isDegraded)
              DegradedNotice(reason: result.degradedReason, onRetry: onRetry),
            for (final (index, suggestion) in result.suggestions.indexed)
              SuggestionCard(index: index + 1, suggestion: suggestion),
            const SizedBox(height: 4),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                key: const ValueKey('regenerate-button'),
                onPressed: onRetry,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('New suggestions'),
              ),
            ),
          ],
        ),
    };
  }
}

class _Hint extends StatelessWidget {
  const _Hint();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Column(
        children: [
          Icon(Icons.card_giftcard, size: 40, color: theme.colorScheme.outline),
          const SizedBox(height: 12),
          Text(
            'Tell us the occasion and who it is for.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.outline),
          ),
        ],
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({
    required this.fieldKey,
    required this.controller,
    required this.label,
    required this.hint,
    required this.presets,
    required this.validator,
    required this.onPreset,
  });

  final Key fieldKey;
  final TextEditingController controller;
  final String label;
  final String hint;
  final List<String> presets;
  final String? Function(String?) validator;
  final ValueChanged<String> onPreset;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextFormField(
          key: fieldKey,
          controller: controller,
          validator: validator,
          textInputAction: TextInputAction.next,
          maxLength: 40,
          decoration: InputDecoration(
            labelText: label,
            hintText: hint,
            border: const OutlineInputBorder(),
            counterText: '',
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: [
            for (final preset in presets)
              ActionChip(label: Text(preset), onPressed: () => onPreset(preset)),
          ],
        ),
      ],
    );
  }
}
