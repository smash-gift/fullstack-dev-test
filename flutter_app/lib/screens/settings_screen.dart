import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/settings_controller.dart';
import '../theme/app_theme.dart';

/// Setup / settings screen where the user configures the client variables:
/// the backend base URL, an optional access token, and a default tone.
///
/// Shown automatically on first launch ([isSetup] = true) and reachable later
/// via the gear icon on the main screen. Fields come pre-filled from the saved
/// settings (or defaults) and are freely editable.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key, this.isSetup = false});

  /// First-run mode: no close button, and a "Get started" call to action.
  final bool isSetup;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final SettingsController _settings = context.read<SettingsController>();
  late final TextEditingController _baseUrl = TextEditingController(
    text: _settings.baseUrl,
  );
  late final TextEditingController _token = TextEditingController(
    text: _settings.token,
  );
  late String _tone = _settings.tone;
  bool _obscureToken = true;
  bool _saving = false;

  static const _tones = <String, String>{
    '': 'None (default)',
    'heartfelt': 'Heartfelt',
    'funny': 'Funny',
    'formal': 'Formal',
    'warm': 'Warm',
    'playful': 'Playful',
  };

  @override
  void dispose() {
    _baseUrl.dispose();
    _token.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    await _settings.save(
      baseUrl: _baseUrl.text,
      token: _token.text,
      tone: _tone,
    );
    if (!mounted) return;
    // In setup mode the app root swaps to the main screen automatically; in
    // edit mode we simply pop back.
    if (!widget.isSetup && Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    } else {
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final brightness = theme.brightness;
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
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (!widget.isSetup)
                      Align(
                        alignment: Alignment.centerLeft,
                        child: IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.of(context).maybePop(),
                        ),
                      ),
                    const SizedBox(height: 4),
                    _Header(isSetup: widget.isSetup),
                    const SizedBox(height: 28),
                    _Card(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _FieldLabel(icon: Icons.link, label: 'API base URL'),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _baseUrl,
                            keyboardType: TextInputType.url,
                            autocorrect: false,
                            decoration: const InputDecoration(
                              hintText: 'http://localhost:8080',
                            ),
                          ),
                          Text(
                            'Where the backend is running.',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(height: 20),
                          _FieldLabel(
                            icon: Icons.key_outlined,
                            label: 'Access token (optional)',
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _token,
                            obscureText: _obscureToken,
                            autocorrect: false,
                            enableSuggestions: false,
                            decoration: InputDecoration(
                              hintText:
                                  'Bearer token, if the backend requires auth',
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscureToken
                                      ? Icons.visibility_off
                                      : Icons.visibility,
                                  size: 20,
                                ),
                                onPressed: () => setState(
                                  () => _obscureToken = !_obscureToken,
                                ),
                              ),
                            ),
                          ),
                          Text(
                            'Sent as "Authorization: Bearer …". This is your access '
                            'token — not the LLM API key (that stays on the server).',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(height: 20),
                          _FieldLabel(icon: Icons.tune, label: 'Default tone'),
                          const SizedBox(height: 8),
                          DropdownButtonFormField<String>(
                            initialValue: _tones.containsKey(_tone)
                                ? _tone
                                : '',
                            items: [
                              for (final entry in _tones.entries)
                                DropdownMenuItem(
                                  value: entry.key,
                                  child: Text(entry.value),
                                ),
                            ],
                            onChanged: (v) => setState(() => _tone = v ?? ''),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    _SaveButton(
                      label: widget.isSetup ? 'Get started' : 'Save',
                      saving: _saving,
                      onPressed: _save,
                    ),
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

class _Header extends StatelessWidget {
  const _Header({required this.isSetup});
  final bool isSetup;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            gradient: AppTheme.brandGradient,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: AppTheme.purple.withValues(alpha: 0.35),
                blurRadius: 22,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: const Icon(Icons.tune_rounded, color: Colors.white, size: 30),
        ),
        const SizedBox(height: 16),
        Text(
          isSetup ? 'Welcome 👋' : 'Settings',
          textAlign: TextAlign.center,
          style: theme.textTheme.headlineMedium,
        ),
        const SizedBox(height: 6),
        Text(
          isSetup
              ? 'Set up how the app connects to your backend. You can change this anytime.'
              : 'Update how the app connects to your backend.',
          textAlign: TextAlign.center,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
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
      child: child,
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, size: 18, color: theme.colorScheme.primary),
        const SizedBox(width: 8),
        Text(label, style: theme.textTheme.titleMedium),
      ],
    );
  }
}

class _SaveButton extends StatelessWidget {
  const _SaveButton({
    required this.label,
    required this.saving,
    required this.onPressed,
  });
  final String label;
  final bool saving;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(100),
        boxShadow: saving
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
        onPressed: saving ? null : onPressed,
        icon: saving
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.check_rounded),
        label: Text(saving ? 'Saving…' : label),
      ),
    );
  }
}
