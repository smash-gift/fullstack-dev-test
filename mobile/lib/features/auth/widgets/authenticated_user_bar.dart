import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../controller/auth_controller.dart';

/// Barra compacta exibida no formulário quando há um usuário autenticado: saudação, atalho para
/// o histórico e ação de logout. Substitui [GoogleSignInButton] nesse estado.
class AuthenticatedUserBar extends StatelessWidget {
  const AuthenticatedUserBar({
    super.key,
    required this.authController,
    required this.onViewHistory,
  });

  final AuthController authController;
  final VoidCallback onViewHistory;

  @override
  Widget build(BuildContext context) {
    final user = authController.currentUser;
    if (user == null) return const SizedBox.shrink();

    final greetingName = user.displayName ?? user.email ?? 'você';

    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: AppSpacing.s3,
      runSpacing: AppSpacing.s1,
      children: [
        Text('Olá, $greetingName', style: AppTextStyles.small),
        TextButton(onPressed: onViewHistory, child: const Text('Histórico')),
        TextButton(
          onPressed: authController.signOut,
          child: const Text('Sair', style: TextStyle(color: AppColors.textMuted)),
        ),
      ],
    );
  }
}
