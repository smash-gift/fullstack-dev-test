import 'package:flutter/material.dart';
import 'config/app_config.dart';
import 'core/themes/app_theme.dart';
import 'features/suggester/view_models/suggester_view_model.dart';
import 'l10n/app_localizations.dart';
import 'routing/app_router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final config = AppConfig.production();
  final viewModel = AppRouter.createViewModel(config);
  runApp(MainApp(viewModel: viewModel));
}

class MainApp extends StatelessWidget {
  final SuggesterViewModel viewModel;

  const MainApp({super.key, required this.viewModel});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: viewModel,
      builder: (context, _) {
        return MaterialApp(
          title: 'AI Gift Card Suggester',
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: ThemeMode.dark,
          debugShowCheckedModeBanner: false,
          locale: Locale(viewModel.currentLocale),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: AppRouter.buildHomeScreen(viewModel),
        );
      },
    );
  }
}
