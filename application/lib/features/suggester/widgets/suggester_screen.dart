import 'package:flutter/material.dart';
import '../../../l10n/app_localizations.dart';
import '../../../core/ui/core_widgets.dart';
import '../view_models/suggester_view_model.dart';
import 'message_suggestions_screen.dart';
import 'occasion_form_screen.dart';
import 'service_unavailable_screen.dart';
import 'visual_card_editor_screen.dart';

class SuggesterScreen extends StatelessWidget {
  final SuggesterViewModel viewModel;

  const SuggesterScreen({super.key, required this.viewModel});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: viewModel,
      builder: (context, _) {
        final l10n = AppLocalizations.of(context)!;
        final currentStep = viewModel.currentStep;

        Widget bodyContent;
        switch (currentStep) {
          case 0:
            bodyContent = OccasionFormScreen(viewModel: viewModel);
            break;
          case 1:
            bodyContent = MessageSuggestionsScreen(viewModel: viewModel);
            break;
          case 2:
            bodyContent = VisualCardEditorScreen(viewModel: viewModel);
            break;
          case 3:
            bodyContent = ServiceUnavailableScreen(viewModel: viewModel);
            break;
          default:
            bodyContent = OccasionFormScreen(viewModel: viewModel);
        }

        return Scaffold(
          appBar: AppHeaderBar(
            title: l10n.headerTitle,
            subtitle: l10n.headerSubtitle,
            sessionLabel: l10n.guestSession,
            currentLocale: viewModel.currentLocale,
            onLocaleChanged: (locale) => viewModel.setLocale(locale),
          ),
          body: Column(
            children: [
              // 3-Step Stepper Progress Bar (Only visible for steps 0, 1, 2)
              if (currentStep < 3)
                AppStepperProgress(
                  currentStep: currentStep,
                  step1Label: l10n.stepOccasion,
                  step2Label: l10n.stepSuggestions,
                  step3Label: l10n.stepEditor,
                ),
              Expanded(child: bodyContent),
            ],
          ),
        );
      },
    );
  }
}
