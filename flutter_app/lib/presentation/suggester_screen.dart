import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gift_card_suggester/domain/suggestion_state.dart';
import 'package:gift_card_suggester/presentation/providers/suggestion_provider.dart';
import 'package:gift_card_suggester/presentation/widgets/suggestion_result_list.dart';

/// Preset options offered as quick picks; users can also type their own.
const _occasions = <String>[
  'Birthday',
  'Wedding',
  'Thank you',
  'Anniversary',
  'Graduation',
  'New baby',
  'Get well',
  'Holiday',
];

const _relationships = <String>[
  'Friend',
  'Colleague',
  'Parent',
  'Partner',
  'Sibling',
  'Boss',
  'Teacher',
];

/// The single main screen: choose/type an occasion and relationship, request
/// suggestions, and see loading / success / error feedback.
class SuggesterScreen extends ConsumerStatefulWidget {
  const SuggesterScreen({super.key});

  @override
  ConsumerState<SuggesterScreen> createState() => _SuggesterScreenState();
}

class _SuggesterScreenState extends ConsumerState<SuggesterScreen> {
  final _occasionController = TextEditingController();
  final _relationshipController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _occasionController.dispose();
    _relationshipController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();
    ref.read(suggestionControllerProvider.notifier).fetch(
          occasion: _occasionController.text.trim(),
          relationship: _relationshipController.text.trim(),
        );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(suggestionControllerProvider);
    final isLoading = state is SuggestionLoading;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Gift Card Message Suggester'),
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Tell us the occasion and who it is for, and we will '
                    'suggest a few short messages.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 20),
                  Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _LabeledField(
                          label: 'Occasion',
                          hint: 'e.g. Birthday',
                          controller: _occasionController,
                          presets: _occasions,
                          enabled: !isLoading,
                        ),
                        const SizedBox(height: 16),
                        _LabeledField(
                          label: 'Relationship',
                          hint: 'e.g. Friend',
                          controller: _relationshipController,
                          presets: _relationships,
                          enabled: !isLoading,
                        ),
                        const SizedBox(height: 20),
                        FilledButton.icon(
                          onPressed: isLoading ? null : _submit,
                          icon: isLoading
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(Icons.auto_awesome),
                          label: Text(
                            isLoading
                                ? 'Getting suggestions…'
                                : 'Get suggestions',
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  _ResultArea(state: state, onRetry: _submit),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// A labeled text field with quick-pick preset chips.
class _LabeledField extends StatelessWidget {
  const _LabeledField({
    required this.label,
    required this.hint,
    required this.controller,
    required this.presets,
    required this.enabled,
  });

  final String label;
  final String hint;
  final TextEditingController controller;
  final List<String> presets;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          enabled: enabled,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            hintText: hint,
            border: const OutlineInputBorder(),
          ),
          validator: (value) {
            if (value == null || value.trim().isEmpty) {
              return 'Please enter ${label.toLowerCase()}.';
            }
            return null;
          },
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: presets
              .map(
                (preset) => ActionChip(
                  label: Text(preset),
                  onPressed: enabled
                      ? () => controller.text = preset
                      : null,
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

/// Renders the current [SuggestionState]: idle / success / error. Loading is
/// reflected on the submit button itself.
class _ResultArea extends StatelessWidget {
  const _ResultArea({required this.state, required this.onRetry});

  final SuggestionState state;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return switch (state) {
      SuggestionIdle() || SuggestionLoading() => const SizedBox.shrink(),
      SuggestionSuccess(:final suggestions, :final source) =>
        SuggestionResultList(suggestions: suggestions, source: source),
      SuggestionError(:final failure) => _ErrorView(
          message: failure.message,
          onRetry: onRetry,
        ),
    };
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(Icons.error_outline, color: theme.colorScheme.error),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  message,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onErrorContainer,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Try again'),
          ),
        ],
      ),
    );
  }
}
