import 'package:flutter/material.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/primary_button.dart';
import '../widgets/gift_card_visual.dart';

/// Tela final do fluxo guest: exibe a mensagem escolhida em um cartão.
class GiftCardScreen extends StatelessWidget {
  const GiftCardScreen({super.key, required this.message});

  final String message;

  void _restart(BuildContext context) {
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Seu cartão')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.screenHorizontalPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: AppSpacing.s4),
              Text(
                'Pronto! Aqui está o seu cartão.',
                style: AppTextStyles.titleSmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.s6),
              Expanded(
                child: SingleChildScrollView(
                  child: GiftCardVisual(message: message),
                ),
              ),
              const SizedBox(height: AppSpacing.s6),
              PrimaryButton(
                label: 'Criar outro cartão',
                onPressed: () => _restart(context),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
