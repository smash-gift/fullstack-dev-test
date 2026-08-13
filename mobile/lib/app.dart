import 'package:flutter/material.dart';

import 'core/theme/app_theme.dart';
import 'data/repositories/history_repository.dart';
import 'data/repositories/message_repository.dart';
import 'features/auth/controller/auth_controller.dart';
import 'features/message_form/screens/message_form_screen.dart';

/// Widget raiz do app. Recebe as dependências já resolvidas em `main.dart` (composition root) e
/// as repassa para a primeira tela via construtor — ver decisão de DI manual na spec técnica do
/// mobile.
class SmashGiftApp extends StatelessWidget {
  const SmashGiftApp({
    super.key,
    required this.repository,
    required this.authController,
    required this.historyRepository,
  });

  final MessageRepository repository;
  final AuthController authController;
  final HistoryRepository historyRepository;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'smash-gift',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: MessageFormScreen(
        repository: repository,
        authController: authController,
        historyRepository: historyRepository,
      ),
    );
  }
}
