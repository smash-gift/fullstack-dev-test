import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/widgets.dart';

import 'app.dart';
import 'core/config/app_config.dart';
import 'core/network/api_client.dart';
import 'data/repositories/firestore_history_repository.dart';
import 'data/repositories/firestore_user_repository.dart';
import 'data/repositories/history_repository.dart';
import 'data/repositories/http_message_repository.dart';
import 'data/repositories/noop_history_repository.dart';
import 'data/repositories/noop_user_repository.dart';
import 'data/repositories/user_repository.dart';
import 'features/auth/auth_service.dart';
import 'features/auth/controller/auth_controller.dart';
import 'features/auth/firebase_auth_service.dart';
import 'features/auth/unavailable_auth_service.dart';
import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inicializa o Firebase (Auth + Firestore) com as opções geradas via `flutterfire configure`
  // para habilitar o login Google real e a integração direta com o Firestore. O
  // `firebase_options.dart` só tem entradas de projeto real para Android e Web (as plataformas
  // configuradas até agora) — iOS/macOS ainda não têm `GoogleService-Info.plist`, então
  // `DefaultFirebaseOptions.currentPlatform` lançaria nessas plataformas (e em Linux, não
  // suportado). O try/catch mantém o fallback gracioso para as implementações guest-safe abaixo
  // nesses casos, em vez de deixar o app quebrar (o que derrubaria também o fluxo guest, que não
  // deveria depender disso). Ver pendência de iOS na spec técnica do mobile e no handoff.
  AuthService authService = const UnavailableAuthService();
  UserRepository userRepository = const NoopUserRepository();
  HistoryRepository historyRepository = const NoopHistoryRepository();

  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    authService = FirebaseAuthService();
    userRepository = FirestoreUserRepository();
    historyRepository = FirestoreHistoryRepository();
  } catch (_) {
    // Plataforma sem configuração de projeto Firebase real (iOS/macOS sem
    // GoogleService-Info.plist, ou Linux desktop, não suportado por
    // DefaultFirebaseOptions.currentPlatform) — mantém as implementações guest-safe acima. O app
    // continua funcionando normalmente no fluxo guest (sem login).
  }

  final config = AppConfig.fromEnvironment();
  final apiClient = ApiClient(config: config);
  final messageRepository = HttpMessageRepository(apiClient);
  final authController = AuthController(authService, userRepository);

  runApp(
    SmashGiftApp(
      repository: messageRepository,
      authController: authController,
      historyRepository: historyRepository,
    ),
  );
}
