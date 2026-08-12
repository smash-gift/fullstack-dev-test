import 'package:flutter/material.dart';
import 'app_card_container.dart';
import 'app_chip_select.dart';
import 'app_header_bar.dart';
import 'app_primary_button.dart';
import 'app_secondary_button.dart';
import 'app_stepper_progress.dart';
import 'app_tone_badge.dart';

/// Preview and Factory builders for core UI widgets.
class WidgetPreviews {
  const WidgetPreviews._();

  static Widget buildCardContainerPreview({bool highlight = false, String text = 'Sample Card Content'}) {
    return AppCardContainer(
      highlightBorder: highlight,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Text(text, style: const TextStyle(color: Colors.white)),
      ),
    );
  }

  static Widget buildChipSelectPreview<T>({
    required List<T> options,
    required T selectedOption,
    required ValueChanged<T> onSelected,
    required String Function(T) labelBuilder,
    IconData Function(T)? iconBuilder,
  }) {
    return AppChipSelect<T>(
      options: options,
      selectedOption: selectedOption,
      onSelected: onSelected,
      labelBuilder: labelBuilder,
      iconBuilder: iconBuilder,
    );
  }

  static Widget buildHeaderBarPreview({
    String title = 'Gift Card AI',
    String subtitle = 'Gerador de Mensagens',
    String sessionLabel = 'Guest #1234',
    String currentLocale = 'pt',
    ValueChanged<String>? onLocaleChanged,
  }) {
    return AppHeaderBar(
      title: title,
      subtitle: subtitle,
      sessionLabel: sessionLabel,
      currentLocale: currentLocale,
      onLocaleChanged: onLocaleChanged,
    );
  }

  static Widget buildPrimaryButtonPreview({
    String label = 'Gerar Mensagem',
    VoidCallback? onPressed,
    bool isLoading = false,
    IconData? icon = Icons.auto_awesome,
  }) {
    return AppPrimaryButton(
      label: label,
      onPressed: onPressed ?? () {},
      isLoading: isLoading,
      icon: icon,
    );
  }

  static Widget buildSecondaryButtonPreview({
    String label = 'Voltar',
    VoidCallback? onPressed,
    IconData? icon = Icons.arrow_back,
  }) {
    return AppSecondaryButton(
      label: label,
      onPressed: onPressed ?? () {},
      icon: icon,
    );
  }

  static Widget buildStepperProgressPreview({
    int currentStep = 0,
    String step1 = 'Ocasião',
    String step2 = 'Mensagem',
    String step3 = 'Finalizar',
  }) {
    return AppStepperProgress(
      currentStep: currentStep,
      step1Label: step1,
      step2Label: step2,
      step3Label: step3,
    );
  }

  static Widget buildToneBadgePreview({String toneLabel = 'Carinhoso'}) {
    return AppToneBadge(toneLabel: toneLabel);
  }
}
