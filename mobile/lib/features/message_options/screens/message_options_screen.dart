import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/repositories/history_repository.dart';
import '../../../data/repositories/message_repository.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../../auth/controller/auth_controller.dart';
import '../../gift_card/screens/gift_card_screen.dart';
import '../../message_form/controller/message_generation_controller.dart';

/// Exibe as opções de mensagem geradas pelo backend; ao tocar em uma, navega para o cartão final.
///
/// Também oferece "Gerar outras opções" (paridade com o botão equivalente do Web em
/// `GiftFlow.tsx`), que chama o backend novamente com `regenerate: true` e substitui a lista
/// exibida em caso de sucesso, sem perder as mensagens já exibidas em caso de erro.
///
/// Quando há um usuário autenticado ([AuthController.isAuthenticated]), a seleção também grava
/// uma entrada em `users/{uid}/history` (ver `docs/contracts/firestore-schema.md`) — gravação
/// "fire-and-forget": não bloqueia a navegação, e uma falha nela não deve impedir o usuário de
/// ver o cartão gerado.
class MessageOptionsScreen extends StatefulWidget {
  const MessageOptionsScreen({
    super.key,
    required this.messages,
    required this.occasion,
    required this.relationship,
    required this.authController,
    required this.historyRepository,
    required this.repository,
  });

  final List<String> messages;
  final String occasion;
  final String relationship;
  final AuthController authController;
  final HistoryRepository historyRepository;
  final MessageRepository repository;

  @override
  State<MessageOptionsScreen> createState() => _MessageOptionsScreenState();
}

class _MessageOptionsScreenState extends State<MessageOptionsScreen> {
  late final MessageGenerationController _controller;
  late List<String> _messages;

  @override
  void initState() {
    super.initState();
    _messages = widget.messages;
    _controller = MessageGenerationController(widget.repository)
      ..addListener(_handleControllerChanged);
  }

  @override
  void dispose() {
    _controller.removeListener(_handleControllerChanged);
    _controller.dispose();
    super.dispose();
  }

  void _handleControllerChanged() {
    if (_controller.status == MessageGenerationStatus.success) {
      setState(() {
        _messages = _controller.messages;
      });
      _controller.reset();
    }
  }

  void _regenerate() {
    _controller.generate(
      occasion: widget.occasion,
      relationship: widget.relationship,
      regenerate: true,
    );
  }

  Future<void> _saveHistoryEntry(String uid, String message) async {
    try {
      await widget.historyRepository.addEntry(
        uid: uid,
        occasion: widget.occasion,
        relationship: widget.relationship,
        messageOptions: _messages,
        selectedMessage: message,
      );
    } catch (_) {
      // Falha ao gravar o histórico não deve impedir o usuário de ver o cartão gerado — a tela já
      // navegou para GiftCardScreen quando este erro é conhecido.
    }
  }

  void _selectMessage(BuildContext context, String message) {
    final user = widget.authController.currentUser;
    if (user != null) {
      unawaited(_saveHistoryEntry(user.uid, message));
    }

    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => GiftCardScreen(message: message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Escolha uma mensagem')),
      body: SafeArea(
        child: _messages.isEmpty
            ? EmptyStateView(
                title: 'Nenhuma opção foi gerada',
                description:
                    'Não recebemos nenhuma mensagem desta vez. Volte e tente gerar novamente.',
                actionLabel: 'Voltar',
                onAction: () => Navigator.of(context).pop(),
              )
            : ListView(
                padding: const EdgeInsets.all(AppSpacing.screenHorizontalPadding),
                children: [
                  for (final message in _messages) ...[
                    _MessageOptionCard(
                      message: message,
                      onTap: () => _selectMessage(context, message),
                    ),
                    const SizedBox(height: AppSpacing.s4),
                  ],
                  const SizedBox(height: AppSpacing.s2),
                  Center(
                    child: ListenableBuilder(
                      listenable: _controller,
                      builder: (context, _) {
                        final isLoading = _controller.isLoading;
                        return Column(
                          children: [
                            if (_controller.status == MessageGenerationStatus.error) ...[
                              ErrorBanner(
                                message: _controller.errorMessage ?? 'Algo deu errado.',
                              ),
                              const SizedBox(height: AppSpacing.s3),
                            ],
                            GestureDetector(
                              onTap: isLoading ? null : _regenerate,
                              child: isLoading
                                  ? const SizedBox(
                                      height: 18,
                                      width: 18,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.5,
                                        valueColor: AlwaysStoppedAnimation<Color>(
                                          AppColors.actionPrimary,
                                        ),
                                      ),
                                    )
                                  : Text(
                                      'Gerar outras opções',
                                      style: AppTextStyles.label.copyWith(
                                        color: AppColors.actionPrimary,
                                        decoration: TextDecoration.underline,
                                      ),
                                    ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _MessageOptionCard extends StatelessWidget {
  const _MessageOptionCard({required this.message, required this.onTap});

  final String message;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.backgroundSecondary,
      borderRadius: BorderRadius.circular(AppRadius.large),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.large),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.s5),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.large),
            border: Border.all(color: AppColors.borderSoft),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(message, style: AppTextStyles.body),
              ),
              const SizedBox(width: AppSpacing.s3),
              const Icon(Icons.chevron_right, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}
