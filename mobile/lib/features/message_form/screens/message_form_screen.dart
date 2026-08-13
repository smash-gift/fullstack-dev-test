import 'package:flutter/material.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/repositories/history_repository.dart';
import '../../../data/repositories/message_repository.dart';
import '../../../shared/widgets/error_banner.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../auth/controller/auth_controller.dart';
import '../../auth/widgets/authenticated_user_bar.dart';
import '../../auth/widgets/google_sign_in_button.dart';
import '../../history/screens/history_screen.dart';
import '../../message_options/screens/message_options_screen.dart';
import '../controller/message_generation_controller.dart';
import '../widgets/free_text_field.dart';

/// Tela inicial do fluxo guest: ocasião e relacionamento em texto livre, disparando a geração de
/// mensagens. Também é o ponto de entrada do login Google (ação secundária, não bloqueante) e,
/// para usuário autenticado, do acesso ao histórico.
class MessageFormScreen extends StatefulWidget {
  const MessageFormScreen({
    super.key,
    required this.repository,
    required this.authController,
    required this.historyRepository,
  });

  final MessageRepository repository;
  final AuthController authController;
  final HistoryRepository historyRepository;

  @override
  State<MessageFormScreen> createState() => _MessageFormScreenState();
}

class _MessageFormScreenState extends State<MessageFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _occasionController = TextEditingController();
  final _relationshipController = TextEditingController();
  late final MessageGenerationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = MessageGenerationController(widget.repository)
      ..addListener(_handleControllerChanged);
  }

  @override
  void dispose() {
    _controller.removeListener(_handleControllerChanged);
    _controller.dispose();
    _occasionController.dispose();
    _relationshipController.dispose();
    super.dispose();
  }

  /// Listener dedicado apenas ao efeito colateral de navegação em caso de sucesso.
  /// A reconstrução reativa da UI (loading/erro) é feita pelo [ListenableBuilder] em [build] —
  /// ver decisão de gerenciamento de estado na spec técnica do mobile.
  void _handleControllerChanged() {
    if (_controller.status == MessageGenerationStatus.success) {
      final generatedMessages = _controller.messages;
      final occasion = _occasionController.text.trim();
      final relationship = _relationshipController.text.trim();
      _controller.reset();
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => MessageOptionsScreen(
            messages: generatedMessages,
            occasion: occasion,
            relationship: relationship,
            authController: widget.authController,
            historyRepository: widget.historyRepository,
            repository: widget.repository,
          ),
        ),
      );
    }
  }

  Future<void> _handleSubmit() async {
    final isValid = _formKey.currentState?.validate() ?? false;
    if (!isValid) return;

    await _controller.generate(
      occasion: _occasionController.text.trim(),
      relationship: _relationshipController.text.trim(),
    );
  }

  void _openHistory() {
    final uid = widget.authController.currentUser?.uid;
    if (uid == null) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => HistoryScreen(
            uid: uid, historyRepository: widget.historyRepository),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.screenHorizontalPadding),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: AppSpacing.s8),
                Text('smash-gift',
                    style: AppTextStyles.heading, textAlign: TextAlign.center),
                const SizedBox(height: AppSpacing.s2),
                Text(
                  'Conte a ocasião e para quem é o carinho — em segundos '
                  'você recebe três opções de mensagem para escolher e presentear.',
                  style: AppTextStyles.body,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.s8),
                ListenableBuilder(
                  listenable: _controller,
                  builder: (context, _) {
                    final isLoading = _controller.isLoading;
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        FreeTextField(
                          label: 'Ocasião',
                          hint: 'Ex.: aniversário de 15 anos da minha afilhada',
                          controller: _occasionController,
                          enabled: !isLoading,
                        ),
                        const SizedBox(height: AppSpacing.s4),
                        FreeTextField(
                          label: 'Para quem é',
                          hint: 'Ex.: minha melhor amiga desde a infância',
                          controller: _relationshipController,
                          enabled: !isLoading,
                        ),
                        const SizedBox(height: AppSpacing.s6),
                        if (_controller.status ==
                            MessageGenerationStatus.error) ...[
                          ErrorBanner(
                            message:
                                _controller.errorMessage ?? 'Algo deu errado.',
                            onRetry: _handleSubmit,
                          ),
                          const SizedBox(height: AppSpacing.s4),
                        ],
                        PrimaryButton(
                          label: 'Gerar mensagens',
                          isLoading: isLoading,
                          onPressed: _handleSubmit,
                        ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: AppSpacing.s6),
                ListenableBuilder(
                  listenable: widget.authController,
                  builder: (context, _) {
                    if (widget.authController.isAuthenticated) {
                      return Center(
                        child: AuthenticatedUserBar(
                          authController: widget.authController,
                          onViewHistory: _openHistory,
                        ),
                      );
                    }
                    return Center(
                      child: GoogleSignInButton(
                          authController: widget.authController),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
