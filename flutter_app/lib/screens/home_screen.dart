import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../models/suggestion_result.dart';
import '../providers/suggestion_provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _occasionController = TextEditingController();
  final _relationshipController = TextEditingController();

  @override
  void dispose() {
    _occasionController.dispose();
    _relationshipController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    context.read<SuggestionProvider>().submit(
          occasion: _occasionController.text,
          relationship: _relationshipController.text,
        );
  }

  void _reset() {
    _formKey.currentState?.reset();
    _occasionController.clear();
    _relationshipController.clear();
    context.read<SuggestionProvider>().reset();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F4F0),
      appBar: AppBar(
        backgroundColor: const Color(0xFF6B4226),
        foregroundColor: Colors.white,
        title: const Text(
          'Gift Card Message Suggester',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
        ),
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _InputCard(
                formKey: _formKey,
                occasionController: _occasionController,
                relationshipController: _relationshipController,
                onSubmit: _submit,
                onReset: _reset,
              ),
              const SizedBox(height: 20),
              const _ResultSection(),
            ],
          ),
        ),
      ),
    );
  }
}

class _InputCard extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController occasionController;
  final TextEditingController relationshipController;
  final VoidCallback onSubmit;
  final VoidCallback onReset;

  const _InputCard({
    required this.formKey,
    required this.occasionController,
    required this.relationshipController,
    required this.onSubmit,
    required this.onReset,
  });

  @override
  Widget build(BuildContext context) {
    final isLoading =
        context.watch<SuggestionProvider>().state == SuggestionState.loading;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Generate a message',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF6B4226),
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                'Describe the occasion and your relationship with the recipient.',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: Colors.grey[600]),
              ),
              const SizedBox(height: 20),
              _AppTextField(
                controller: occasionController,
                label: 'Occasion',
                hint: 'e.g. birthday, wedding, thank you, graduation…',
                icon: Icons.celebration_outlined,
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Please enter an occasion' : null,
                enabled: !isLoading,
              ),
              const SizedBox(height: 16),
              _AppTextField(
                controller: relationshipController,
                label: 'Relationship',
                hint: 'e.g. best friend, colleague, parent, mentor…',
                icon: Icons.people_outline,
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Please enter a relationship' : null,
                enabled: !isLoading,
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: isLoading ? null : onSubmit,
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF6B4226),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.auto_awesome, size: 18),
                label: Text(
                  isLoading ? 'Generating…' : 'Get Suggestions',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AppTextField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final String? Function(String?) validator;
  final bool enabled;

  const _AppTextField({
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    required this.validator,
    required this.enabled,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      enabled: enabled,
      textCapitalization: TextCapitalization.sentences,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        hintStyle: TextStyle(fontSize: 13, color: Colors.grey[400]),
        prefixIcon: Icon(icon, color: const Color(0xFF6B4226), size: 20),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF6B4226), width: 2),
        ),
        filled: true,
        fillColor: Colors.white,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }
}

class _ResultSection extends StatelessWidget {
  const _ResultSection();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SuggestionProvider>();

    return switch (provider.state) {
      SuggestionState.idle => const _IdleHint(),
      SuggestionState.loading => const _LoadingView(),
      SuggestionState.error => _ErrorView(message: provider.errorMessage ?? 'Unknown error'),
      SuggestionState.success => _SuccessView(result: provider.result!),
    };
  }
}

class _IdleHint extends StatelessWidget {
  const _IdleHint();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.only(top: 32),
        child: Column(
          children: [
            Icon(Icons.card_giftcard_outlined,
                size: 56, color: Colors.grey[300]),
            const SizedBox(height: 12),
            Text(
              'Your suggestions will appear here.',
              style: TextStyle(color: Colors.grey[400], fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}

class _LoadingView extends StatelessWidget {
  const _LoadingView();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.only(top: 40),
        child: Column(
          children: [
            CircularProgressIndicator(color: Color(0xFF6B4226)),
            SizedBox(height: 16),
            Text(
              'Generating personalized messages…',
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;

  const _ErrorView({required this.message});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: const Color(0xFFFFEDED),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0xFFFFB3B3)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.error_outline, color: Color(0xFFD32F2F), size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Color(0xFFB71C1C), fontSize: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SuccessView extends StatelessWidget {
  final SuggestionResult result;

  const _SuccessView({required this.result});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Text(
              'Suggestions',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF6B4226),
                  ),
            ),
            const Spacer(),
          ],
        ),
        const SizedBox(height: 12),
        ...result.suggestions.asMap().entries.map(
              (entry) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _MessageCard(
                  index: entry.key + 1,
                  message: entry.value,
                ),
              ),
            ),
      ],
    );
  }
}

class _MessageCard extends StatelessWidget {
  final int index;
  final String message;

  const _MessageCard({required this.index, required this.message});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 12,
              backgroundColor: const Color(0xFF6B4226).withValues(alpha: 0.12),
              child: Text(
                '$index',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF6B4226),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(fontSize: 14, height: 1.5),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.copy_outlined, size: 18),
              color: Colors.grey[500],
              tooltip: 'Copy',
              onPressed: () {
                Clipboard.setData(ClipboardData(text: message));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Message copied!'),
                    behavior: SnackBarBehavior.floating,
                    duration: Duration(seconds: 2),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _SourceBadge extends StatelessWidget {
  final String label;
  final Color color;

  const _SourceBadge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}
