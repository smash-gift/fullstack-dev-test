import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'screens/settings_screen.dart';
import 'screens/suggester_screen.dart';
import 'services/suggestion_api.dart';
import 'state/settings_controller.dart';
import 'state/suggestion_controller.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const GiftSuggesterApp());
}

/// App root. Composes the dependency graph (settings → API client → controller)
/// and provides them to the widget tree.
class GiftSuggesterApp extends StatelessWidget {
  const GiftSuggesterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => SettingsController()..load()),
        ChangeNotifierProvider(
          create: (ctx) {
            final settings = ctx.read<SettingsController>();
            return SuggestionController(SuggestionApi(), settings: settings);
          },
        ),
      ],
      child: MaterialApp(
        title: 'Gift Card Message Suggester',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        // Default to the light, Smash-branded look; a dark variant is available.
        themeMode: ThemeMode.light,
        home: const _Root(),
      ),
    );
  }
}

/// Decides the first screen once settings have loaded: the setup screen on the
/// very first launch, otherwise the main suggester.
class _Root extends StatelessWidget {
  const _Root();

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsController>();

    if (!settings.initialized) {
      return DecoratedBox(
        decoration: BoxDecoration(
          gradient: AppTheme.backgroundGradient(Theme.of(context).brightness),
        ),
        child: const Scaffold(
          backgroundColor: Colors.transparent,
          body: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    return settings.isFirstRun
        ? const SettingsScreen(isSetup: true)
        : const SuggesterScreen();
  }
}
