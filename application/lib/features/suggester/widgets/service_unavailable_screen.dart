import 'package:flutter/material.dart';
import '../../../core/themes/app_theme.dart';
import '../../../core/ui/core_widgets.dart';
import '../../../l10n/app_localizations.dart';
import '../view_models/suggester_view_model.dart';

class ServiceUnavailableScreen extends StatelessWidget {
  final SuggesterViewModel viewModel;

  const ServiceUnavailableScreen({super.key, required this.viewModel});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final offlineSuggestions = viewModel.suggestions;

    return SingleChildScrollView(
      padding: AppSpacing.paddingXl,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: AppSpacing.xl),
          // Error Visual Graphic Container
          Center(
            child: Container(
              padding: AppSpacing.paddingXxl,
              decoration: BoxDecoration(
                color: AppColors.errorSurface,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.errorBorder, width: 2),
              ),
              child: const Icon(
                Icons.wifi_off_rounded,
                size: AppIconSize.display,
                color: AppColors.error,
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),

          // Error Title & Subtitle
          Text(
            l10n.serviceUnavailableTitle,
            textAlign: TextAlign.center,
            style: AppTypography.titleLarge,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            l10n.serviceUnavailableSubtitle,
            textAlign: TextAlign.center,
            style: AppTypography.bodySmall,
          ),
          const SizedBox(height: AppSpacing.xxl),

          // Retry Button
          AppPrimaryButton(
            label: l10n.btnRetry,
            icon: Icons.refresh,
            onPressed: () => viewModel.setStep(0),
          ),
          const SizedBox(height: AppSpacing.xxxl),

          // Offline Suggestions Section
          Text(
            l10n.offlineSuggestions,
            style: AppTypography.sectionHeader,
          ),
          const SizedBox(height: AppSpacing.md),

          // Offline Suggestions List
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: offlineSuggestions.length,
            separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
            itemBuilder: (context, index) {
              final suggestion = offlineSuggestions[index];
              return AppCardContainer(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.offline_pin,
                            size: AppIconSize.md, color: AppColors.info),
                        const SizedBox(width: AppSpacing.xs),
                        Text(
                          l10n.offlineSuggestionTag,
                          style: AppTypography.captionBold,
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      '"${suggestion.text}"',
                      style: AppTypography.bodyMediumItalic,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    AppSecondaryButton(
                      label: l10n.btnUseOffline,
                      icon: Icons.palette,
                      onPressed: () => viewModel.selectSuggestion(suggestion),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
