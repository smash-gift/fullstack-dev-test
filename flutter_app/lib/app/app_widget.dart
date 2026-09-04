import 'package:flutter/material.dart';

import '../config/internationalization/app_localizations.dart';
import '../config/internationalization/localizations_key.dart';
import '../modules/suggestions/presenter/pages/suggestions_page.dart';
import 'core/theme/app_theme.dart';
import 'injector.dart';

/// The root widget: themes, and the one route.
class AppWidget extends StatelessWidget {
  const AppWidget({required this.injector, super.key});

  final Injector injector;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: tr(L.appTitle),
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      // Both themes exist and the device chooses. Forcing one would be the app
      // overriding a preference the user already expressed to their system.
      themeMode: ThemeMode.system,
      home: SuggestionsPage(
        store: injector.suggestionsStore,
        settings: injector.settings,
      ),
    );
  }
}
