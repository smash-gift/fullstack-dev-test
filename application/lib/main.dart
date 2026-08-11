import 'package:flutter/material.dart';
import 'config/app_config.dart';
import 'routing/app_router.dart';
import 'ui/core/themes/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final config = AppConfig.production();
  runApp(MainApp(config: config));
}

class MainApp extends StatelessWidget {
  final AppConfig config;

  const MainApp({super.key, required this.config});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI Gift Card Suggester',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: AppRouter.buildHomeScreen(config),
    );
  }
}
