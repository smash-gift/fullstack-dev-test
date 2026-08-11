import 'package:flutter/material.dart';
import 'config/app_config.dart';
import 'main.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final config = AppConfig.development();
  runApp(MainApp(config: config));
}
