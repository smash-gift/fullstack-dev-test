import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../controller/auth_controller.dart';

/// Ação secundária e não bloqueante de login com Google.
///
/// O fluxo guest é o caminho principal do produto — este botão nunca impede o uso do formulário,
/// apenas oferece o login quando disponível. Reage ao estado de [AuthController]: mostra um
/// indicador de loading enquanto o fluxo do Google Sign-In está em andamento e um `SnackBar`
/// quando o login falha (ex.: `AuthNotAvailableException` se não houver projeto Firebase
/// configurado neste ambiente). Em caso de sucesso, quem troca a UI para o estado autenticado é
/// `MessageFormScreen`, que também escuta `authController` e substitui este botão por
/// `AuthenticatedUserBar`.
class GoogleSignInButton extends StatelessWidget {
  const GoogleSignInButton({super.key, required this.authController});

  final AuthController authController;

  Future<void> _handleTap(BuildContext context) async {
    await authController.signInWithGoogle();
    if (!context.mounted) return;
    final error = authController.errorMessage;
    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: authController,
      builder: (context, _) {
        final isSigningIn = authController.isSigningIn;
        return TextButton.icon(
          onPressed: isSigningIn ? null : () => _handleTap(context),
          icon: isSigningIn
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.textMuted),
                  ),
                )
              : const Icon(Icons.login, size: 18, color: AppColors.textMuted),
          label: Text(
            isSigningIn ? 'Entrando...' : 'Entrar com Google',
            style: const TextStyle(color: AppColors.textMuted),
          ),
        );
      },
    );
  }
}
