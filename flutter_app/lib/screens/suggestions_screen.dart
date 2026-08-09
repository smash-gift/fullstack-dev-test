import 'package:flutter/material.dart';

import '../controllers/suggestions_controller.dart';
import '../widgets/status_banner.dart';
import '../widgets/suggestion_card.dart';

/// The one screen: two fields, a button, and the results.
class SuggestionsScreen extends StatefulWidget {
  const SuggestionsScreen({super.key, required this.controller});

  final SuggestionsController controller;

  @override
  State<SuggestionsScreen> createState() => _SuggestionsScreenState();
}

class _SuggestionsScreenState extends State<SuggestionsScreen> {
  final _occasion = TextEditingController();
  final _relationship = TextEditingController();

  @override
  void dispose() {
    _occasion.dispose();
    _relationship.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      _occasion.text.trim().isNotEmpty && _relationship.text.trim().isNotEmpty;

  void _submit() {
    FocusScope.of(context).unfocus();
    widget.controller.fetchSuggestions(
      occasion: _occasion.text,
      relationship: _relationship.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Gift Card Message Suggester')),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            // Keeps the form readable on a wide browser window instead of
            // stretching two fields across a whole monitor.
            constraints: const BoxConstraints(maxWidth: 520),
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                _field(
                  controller: _occasion,
                  label: 'Occasion',
                  hint: 'e.g., Birthday',
                ),
                const SizedBox(height: 16),
                _field(
                  controller: _relationship,
                  label: 'Relationship',
                  hint: 'e.g., Mother',
                ),
                const SizedBox(height: 24),
                ListenableBuilder(
                  listenable: widget.controller,
                  builder: (context, _) => _submitButton(),
                ),
                const SizedBox(height: 28),
                ListenableBuilder(
                  listenable: widget.controller,
                  builder: (context, _) => _results(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _field({
    required TextEditingController controller,
    required String label,
    required String hint,
  }) {
    return TextField(
      controller: controller,
      maxLength: 60,
      textInputAction: TextInputAction.next,
      // Rebuilds the button as the user types, so it enables the moment both
      // fields hold something.
      onChanged: (_) => setState(() {}),
      onSubmitted: (_) {
        if (_canSubmit) _submit();
      },
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        border: const OutlineInputBorder(),
        counterText: '',
      ),
    );
  }

  Widget _submitButton() {
    final loading = widget.controller.isLoading;

    return FilledButton(
      onPressed: loading || !_canSubmit ? null : _submit,
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: loading
          ? const SizedBox(
              height: 22,
              width: 22,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            )
          : const Text('Get suggestions'),
    );
  }

  /// Every state renders something. A blank area would leave the user guessing
  /// whether the app is working.
  Widget _results() {
    final controller = widget.controller;

    return switch (controller.status) {
      SuggestionsStatus.idle => const _EmptyState(),
      SuggestionsStatus.loading => const Padding(
        padding: EdgeInsets.symmetric(vertical: 32),
        child: Center(child: CircularProgressIndicator()),
      ),
      SuggestionsStatus.failure => StatusBanner.error(
        message: controller.errorMessage ?? 'Something went wrong.',
        onRetry: _canSubmit ? _submit : null,
      ),
      SuggestionsStatus.success => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (controller.isDegraded)
            const StatusBanner.notice(
              message:
                  'Our writing service is busy, so these are general messages. '
                  'Try again in a moment for personalised ones.',
            ),
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              'Suggestions',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          for (final message in controller.suggestions)
            SuggestionCard(message: message),
        ],
      ),
    };
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Column(
        children: [
          Icon(
            Icons.card_giftcard_outlined,
            size: 40,
            color: theme.colorScheme.outline,
          ),
          const SizedBox(height: 12),
          Text(
            'Tell us the occasion and who the gift is for.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.outline,
            ),
          ),
        ],
      ),
    );
  }
}
