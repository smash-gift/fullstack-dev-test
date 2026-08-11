import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/themes/app_theme.dart';
import '../../../core/ui/core_widgets.dart';
import '../../../l10n/app_localizations.dart';
import '../view_models/suggester_view_model.dart';

class MessageSuggestionsScreen extends StatelessWidget {
  final SuggesterViewModel viewModel;

  const MessageSuggestionsScreen({super.key, required this.viewModel});

  void _copyToClipboard(
      String text, BuildContext context, AppLocalizations l10n) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(l10n.copiedToClipboard),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final suggestions = viewModel.suggestions;

    return SingleChildScrollView(
      padding: AppSpacing.paddingLg,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Row with Back Button
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: AppColors.textWhite),
                onPressed: () => viewModel.setStep(0),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.suggestionsTitle,
                      style: AppTypography.titleLarge,
                    ),
                    Text(
                      l10n.suggestionsSubtitle,
                      style: AppTypography.caption,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),

          // Fallback notice if present
          if (suggestions.any((s) => s.isFallback)) ...[
            Container(
              padding: AppSpacing.paddingMd,
              decoration: BoxDecoration(
                color: AppColors.warningSurface,
                borderRadius: AppRadius.borderRadiusLg,
                border: Border.all(color: AppColors.warningBorder),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded,
                      color: AppColors.warning, size: AppIconSize.xl),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Text(
                      l10n.fallbackNotice,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.warningAccent),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],

          // Suggestion Cards List
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: suggestions.length,
            separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
            itemBuilder: (context, index) {
              final suggestion = suggestions[index];
              return AppCardContainer(
                highlightBorder:
                    viewModel.selectedSuggestion?.id == suggestion.id,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Tone Badge & Tag
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        AppToneBadge(toneLabel: suggestion.tone),
                        Row(
                          children: [
                            const Icon(Icons.auto_awesome,
                                size: AppIconSize.sm,
                                color: AppColors.textSubtleDark),
                            const SizedBox(width: AppSpacing.xxs),
                            Text(
                              '${suggestion.occasion} • ${suggestion.relationship}',
                              style: AppTypography.badgeSubtle,
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // Suggestion Message Content
                    Text(
                      '"${suggestion.text}"',
                      style: AppTypography.bodyMediumItalic,
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    // Action Buttons Row
                    Row(
                      children: [
                        AppSecondaryButton(
                          label: l10n.btnCopyToClipboard,
                          icon: Icons.copy,
                          onPressed: () =>
                              _copyToClipboard(suggestion.text, context, l10n),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: AppPrimaryButton(
                            label: l10n.btnSelectForEditor,
                            icon: Icons.palette,
                            onPressed: () =>
                                viewModel.selectSuggestion(suggestion),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: AppSpacing.xl),

          // Bottom Action Row
          Row(
            children: [
              Expanded(
                child: AppSecondaryButton(
                  label: l10n.btnBack,
                  icon: Icons.arrow_back,
                  onPressed: () => viewModel.setStep(0),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: AppPrimaryButton(
                  label: l10n.btnRegenerate,
                  icon: Icons.refresh,
                  onPressed: () => viewModel.setStep(0),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
