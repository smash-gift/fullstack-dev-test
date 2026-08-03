import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../state/suggestion_controller.dart';
import '../theme/app_theme.dart';
import 'settings_screen.dart';

/// The single main screen: inputs for occasion + relationship, a request
/// button, and a results area that renders loading / success / error clearly.
///
/// The screen reads from [SuggestionController] and never talks to the API
/// directly — keeping UI, state, and networking separated. Everything visual
/// (colors, shapes) comes from [AppTheme].
class SuggesterScreen extends StatefulWidget {
  const SuggesterScreen({super.key});

  @override
  State<SuggesterScreen> createState() => _SuggesterScreenState();
}

class _SuggesterScreenState extends State<SuggesterScreen> {
  final _occasionController = TextEditingController();
  final _relationshipController = TextEditingController();

  static const _occasions = [
    'Birthday',
    'Wedding',
    'Thank you',
    'Anniversary',
    'Graduation',
  ];
  static const _relationships = [
    'Friend',
    'Colleague',
    'Parent',
    'Partner',
    'Sibling',
  ];

  @override
  void dispose() {
    _occasionController.dispose();
    _relationshipController.dispose();
    super.dispose();
  }

  void _submit() {
    FocusScope.of(context).unfocus();
    context.read<SuggestionController>().requestSuggestions(
      occasion: _occasionController.text,
      relationship: _relationshipController.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: AppTheme.backgroundGradient(brightness),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 600),
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 40),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Align(
                      alignment: Alignment.topRight,
                      child: IconButton(
                        tooltip: 'Settings',
                        icon: Icon(
                          Icons.settings_outlined,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                        onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const SettingsScreen(),
                          ),
                        ),
                      ),
                    ),
                    const _Header(),
                    const SizedBox(height: 28),
                    _PickerCard(
                      icon: Icons.celebration_outlined,
                      label: 'Occasion',
                      hint: 'e.g. Birthday',
                      controller: _occasionController,
                      chips: _occasions,
                    ),
                    const SizedBox(height: 16),
                    _PickerCard(
                      icon: Icons.favorite_outline,
                      label: 'Relationship',
                      hint: 'e.g. Friend',
                      controller: _relationshipController,
                      chips: _relationships,
                    ),
                    const SizedBox(height: 24),
                    _SubmitButton(onPressed: _submit),
                    const SizedBox(height: 28),
                    const _ResultsArea(),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Hero header: gradient app badge, title and subtitle.
class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Container(
          width: 68,
          height: 68,
          decoration: BoxDecoration(
            gradient: AppTheme.brandGradient,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: AppTheme.purple.withValues(alpha: 0.35),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: const Icon(Icons.card_giftcard, color: Colors.white, size: 34),
        ),
        const SizedBox(height: 18),
        Text(
          'Gift Message Studio',
          textAlign: TextAlign.center,
          style: theme.textTheme.headlineMedium,
        ),
        const SizedBox(height: 6),
        Text(
          'Thoughtful words for every occasion, crafted by AI.',
          textAlign: TextAlign.center,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

/// A surface card holding a labeled text field plus quick-pick chips that
/// highlight the current selection.
class _PickerCard extends StatelessWidget {
  const _PickerCard({
    required this.icon,
    required this.label,
    required this.hint,
    required this.controller,
    required this.chips,
  });

  final IconData icon;
  final String label;
  final String hint;
  final TextEditingController controller;
  final List<String> chips;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: scheme.surface.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.4)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: scheme.primary),
              const SizedBox(width: 8),
              Text(label, style: theme.textTheme.titleMedium),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: controller,
            textInputAction: TextInputAction.next,
            decoration: InputDecoration(hintText: hint),
          ),
          const SizedBox(height: 14),
          // Rebuilds the chip row whenever the field value changes (typing or a
          // chip tap) so the active selection stays visually in sync.
          AnimatedBuilder(
            animation: controller,
            builder: (context, _) {
              final current = controller.text.trim().toLowerCase();
              return Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final chip in chips)
                    _SelectableChip(
                      label: chip,
                      selected: current == chip.toLowerCase(),
                      onTap: () => controller.text = chip,
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

/// Quick-pick chip. Kept as an [ActionChip] (rather than ChoiceChip) so it
/// exposes a simple onPressed; selection is conveyed purely through styling.
class _SelectableChip extends StatelessWidget {
  const _SelectableChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return ActionChip(
      onPressed: onTap,
      label: Text(label),
      avatar: selected
          ? Icon(Icons.check, size: 18, color: scheme.onPrimary)
          : null,
      labelStyle: TextStyle(
        color: selected ? scheme.onPrimary : scheme.onSurface,
        fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
      ),
      backgroundColor: selected
          ? scheme.primary
          : scheme.surfaceContainerHighest.withValues(alpha: 0.5),
      side: BorderSide(
        color: selected
            ? scheme.primary
            : scheme.outlineVariant.withValues(alpha: 0.5),
      ),
      // Pill-shaped chips, matching the Smash brand controls.
      shape: const StadiumBorder(),
    );
  }
}

/// Full-width call to action: a solid purple pill with a soft brand glow,
/// mirroring the Smash CTA buttons.
class _SubmitButton extends StatelessWidget {
  const _SubmitButton({required this.onPressed});
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final isLoading = context.select<SuggestionController, bool>(
      (c) => c.isLoading,
    );
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(100),
        boxShadow: isLoading
            ? null
            : [
                BoxShadow(
                  color: AppTheme.purple.withValues(alpha: 0.35),
                  blurRadius: 22,
                  offset: const Offset(0, 12),
                ),
              ],
      ),
      child: FilledButton.icon(
        onPressed: isLoading ? null : onPressed,
        icon: isLoading
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.auto_awesome),
        label: Text(isLoading ? 'Crafting messages…' : 'Suggest messages'),
      ),
    );
  }
}

/// Renders the current state: idle hint, loading, error, or results.
class _ResultsArea extends StatelessWidget {
  const _ResultsArea();

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<SuggestionController>();

    switch (controller.status) {
      case SuggestionStatus.idle:
        return const _EmptyState();

      case SuggestionStatus.loading:
        return const _LoadingState();

      case SuggestionStatus.error:
        return _ErrorCard(
          message: controller.errorMessage ?? 'Something went wrong.',
          onDismiss: () => context.read<SuggestionController>().reset(),
        );

      case SuggestionStatus.success:
        final result = controller.result!;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (result.degraded)
              const _DegradedBanner(
                text: 'Showing generic ideas — our AI is briefly unavailable.',
              ),
            for (var i = 0; i < result.suggestions.length; i++)
              _FadeSlideIn(
                delay: Duration(milliseconds: 90 * i),
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _SuggestionCard(
                    index: i + 1,
                    text: result.suggestions[i],
                  ),
                ),
              ),
            const SizedBox(height: 4),
            Align(
              alignment: Alignment.centerRight,
              child: _SourcePill(source: result.source),
            ),
          ],
        );
    }
  }
}

/// One suggestion, with an index badge and a copy-to-clipboard action.
class _SuggestionCard extends StatelessWidget {
  const _SuggestionCard({required this.index, required this.text});

  final int index;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surface.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.4)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 30,
            height: 30,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: scheme.primaryContainer,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '$index',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: scheme.onPrimaryContainer,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                text,
                style: theme.textTheme.bodyLarge?.copyWith(height: 1.35),
              ),
            ),
          ),
          const SizedBox(width: 4),
          IconButton(
            tooltip: 'Copy',
            visualDensity: VisualDensity.compact,
            icon: Icon(
              Icons.copy_rounded,
              size: 20,
              color: scheme.onSurfaceVariant,
            ),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: text));
              ScaffoldMessenger.of(context)
                ..hideCurrentSnackBar()
                ..showSnackBar(
                  const SnackBar(content: Text('Copied to clipboard')),
                );
            },
          ),
        ],
      ),
    );
  }
}

/// Small pill showing where the suggestions came from.
class _SourcePill extends StatelessWidget {
  const _SourcePill({required this.source});
  final String source;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final (IconData icon, String label) = switch (source) {
      'llm' => (Icons.auto_awesome, 'Crafted by AI'),
      'cache' => (Icons.bolt, 'From cache'),
      'fallback' => (Icons.offline_bolt_outlined, 'Offline ideas'),
      _ => (Icons.info_outline, source),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: scheme.onSurfaceVariant),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: scheme.onSurfaceVariant,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

/// Idle empty state shown before the first request.
class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 28),
      child: Column(
        children: [
          Icon(
            Icons.edit_note_rounded,
            size: 44,
            color: scheme.primary.withValues(alpha: 0.7),
          ),
          const SizedBox(height: 12),
          Text(
            'Pick an occasion and a relationship,\nthen tap “Suggest messages”.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: scheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

/// Loading state with a friendly caption.
class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 36),
      child: Column(
        children: [
          const SizedBox(
            width: 34,
            height: 34,
            child: CircularProgressIndicator(strokeWidth: 3),
          ),
          const SizedBox(height: 16),
          Text(
            'Crafting messages…',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

/// Non-blocking notice shown when results are the degraded fallback.
class _DegradedBanner extends StatelessWidget {
  const _DegradedBanner({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: scheme.tertiaryContainer.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, size: 20, color: scheme.onTertiaryContainer),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: TextStyle(color: scheme.onTertiaryContainer),
            ),
          ),
        ],
      ),
    );
  }
}

/// Error state card. The message text comes straight from the controller.
class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message, required this.onDismiss});
  final String message;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: scheme.errorContainer.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Icon(Icons.error_outline, color: scheme.error, size: 32),
          const SizedBox(height: 10),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(color: scheme.onErrorContainer),
          ),
          const SizedBox(height: 10),
          TextButton(onPressed: onDismiss, child: const Text('Dismiss')),
        ],
      ),
    );
  }
}

/// Simple entrance animation: fades and slides its child up. Used to stagger
/// the suggestion cards as they appear.
class _FadeSlideIn extends StatefulWidget {
  const _FadeSlideIn({required this.child, this.delay = Duration.zero});

  final Widget child;
  final Duration delay;

  @override
  State<_FadeSlideIn> createState() => _FadeSlideInState();
}

class _FadeSlideInState extends State<_FadeSlideIn>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 380),
  );
  late final Animation<double> _fade = CurvedAnimation(
    parent: _controller,
    curve: Curves.easeOut,
  );
  late final Animation<Offset> _slide = Tween<Offset>(
    begin: const Offset(0, 0.08),
    end: Offset.zero,
  ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));

  @override
  void initState() {
    super.initState();
    Future.delayed(widget.delay, () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}
