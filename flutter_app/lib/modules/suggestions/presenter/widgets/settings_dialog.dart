import 'package:flutter/material.dart';

import '../../../../app/core/config/app_config.dart';
import '../../../../app/core/config/settings_store.dart';
import '../../../../app/core/theme/app_colors.dart';
import '../../../../app/core/theme/app_theme.dart';
import '../../../../config/internationalization/app_localizations.dart';
import '../../../../config/internationalization/localizations_key.dart';

/// Where the backend address is changed.
///
/// A dialog rather than a second route: the brief asks for one screen, and a
/// setting the evaluator touches once does not deserve navigation.
class SettingsDialog extends StatefulWidget {
  const SettingsDialog({required this.settings, super.key});

  final SettingsStore settings;

  /// Opens the dialog. Static so the page composes with one call and never
  /// needs to know how the dialog is built.
  static Future<void> show(BuildContext context, SettingsStore settings) {
    return showDialog<void>(
      context: context,
      builder: (_) => SettingsDialog(settings: settings),
    );
  }

  @override
  State<SettingsDialog> createState() => _SettingsDialogState();
}

/// The one `State` in the presentation layer, and it holds nothing but this
/// dialog's own text field and its error line. Rule R2 bans widgets declared
/// inside a page; a self-contained dialog managing its own input is not that.
class _SettingsDialogState extends State<SettingsDialog> {
  late final TextEditingController _controller = TextEditingController(
    text: widget.settings.baseUrl,
  );
  bool _invalid = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _save() {
    final accepted = widget.settings.setBaseUrl(_controller.text);
    if (!accepted) {
      setState(() => _invalid = true);
      return;
    }
    Navigator.of(context).pop();
  }

  void _reset() {
    widget.settings.resetToDefault();
    _controller.text = widget.settings.baseUrl;
    setState(() => _invalid = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AlertDialog(
      title: Text(tr(L.settingsTitle), style: theme.textTheme.titleMedium),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tr(L.settingsDescription), style: theme.textTheme.bodySmall),
          const SizedBox(height: AppTheme.gapMd),
          TextField(
            controller: _controller,
            autocorrect: false,
            keyboardType: TextInputType.url,
            onChanged: (_) {
              if (_invalid) setState(() => _invalid = false);
            },
            onSubmitted: (_) => _save(),
            decoration: InputDecoration(
              labelText: tr(L.settingsUrlLabel),
              hintText: AppConfig.defaultBaseUrl,
              errorText: _invalid ? tr(L.settingsUrlInvalid) : null,
            ),
          ),
        ],
      ),
      actionsPadding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      actions: [
        TextButton(
          onPressed: _reset,
          style: TextButton.styleFrom(foregroundColor: context.palette.muted),
          child: Text(tr(L.settingsReset)),
        ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          style: TextButton.styleFrom(foregroundColor: context.palette.body),
          child: Text(tr(L.settingsCancel)),
        ),
        FilledButton(
          onPressed: _save,
          style: FilledButton.styleFrom(minimumSize: const Size(0, 40)),
          child: Text(tr(L.settingsSave)),
        ),
      ],
    );
  }
}
