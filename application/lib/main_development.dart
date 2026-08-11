import 'package:flutter/material.dart';
import 'config/app_config.dart';
import 'main.dart';
import 'routing/app_router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final config = AppConfig.development();
  final viewModel = AppRouter.createViewModel(config);
  runApp(MainApp(viewModel: viewModel));
}
