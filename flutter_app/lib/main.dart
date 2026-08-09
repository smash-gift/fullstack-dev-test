import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

import 'config/app_config.dart';
import 'controllers/suggestions_controller.dart';
import 'screens/suggestions_screen.dart';
import 'services/api_client.dart';
import 'services/auth_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(options: AppConfig.firebaseOptions);

  if (AppConfig.usesEmulator) {
    await FirebaseAuth.instance.useAuthEmulator(
      AppConfig.emulatorHost,
      AppConfig.authEmulatorPort,
    );
  }

  // Composition happens once, here. Nothing below constructs its own
  // dependencies, which is what keeps the screen and the controller testable.
  final controller = SuggestionsController(
    api: HttpSuggestionsApi(authService: FirebaseAuthService()),
  );

  runApp(GiftCardSuggesterApp(controller: controller));
}

class GiftCardSuggesterApp extends StatelessWidget {
  const GiftCardSuggesterApp({super.key, required this.controller});

  final SuggestionsController controller;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gift Card Message Suggester',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1A73E8)),
        useMaterial3: true,
      ),
      home: SuggestionsScreen(controller: controller),
    );
  }
}
