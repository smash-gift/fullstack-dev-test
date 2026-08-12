import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/themes/app_theme.dart';
import '../../../core/ui/core_widgets.dart';
import '../../../l10n/app_localizations.dart';
import '../domain/models/card_template_theme.dart';
import '../view_models/suggester_view_model.dart';

class VisualCardEditorScreen extends StatefulWidget {
  final SuggesterViewModel viewModel;

  const VisualCardEditorScreen({super.key, required this.viewModel});

  @override
  State<VisualCardEditorScreen> createState() => _VisualCardEditorScreenState();
}

class _VisualCardEditorScreenState extends State<VisualCardEditorScreen> {
  late TextEditingController _textController;

  @override
  void initState() {
    super.initState();
    _textController =
        TextEditingController(text: widget.viewModel.customCardText);
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _exportFormat(
      String formatName, BuildContext context, AppLocalizations l10n) {
    final message =
        formatName == 'PNG' ? l10n.exportSuccessPng : l10n.exportSuccessPdf;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final vm = widget.viewModel;

    final themeOptions = [
      l10n.themeSparkle,
      l10n.themeDarkLuxury,
      l10n.themePastelJoy,
      l10n.themeNeonGlow,
      l10n.themeMinimal,
    ];

    final templateTheme =
        CardTemplateTheme.fromString(vm.selectedTemplateTheme);

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
                onPressed: () => vm.setStep(1),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.editorTitle,
                      style: AppTypography.titleLarge,
                    ),
                    Text(
                      l10n.editorSubtitle,
                      style: AppTypography.caption,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),

          // Interactive Gift Card Canvas Preview
          Text(
            l10n.editorCardPreview,
            style: AppTypography.sectionHeader,
          ),
          const SizedBox(height: AppSpacing.sm),
          Container(
            height: AppHeights.cardCanvas,
            padding: AppSpacing.paddingXl,
            decoration: templateTheme.decoration,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Top Recipient Dedication
                if (vm.recipientName.isNotEmpty)
                  Align(
                    alignment: Alignment.topLeft,
                    child: Text(
                      '${l10n.cardRecipientPrefix}${vm.recipientName}',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: vm.selectedTextColor.withValues(alpha: 0.9),
                      ),
                    ),
                  ),

                // Center Message Text
                Expanded(
                  child: Center(
                    child: Text(
                      vm.customCardText.isNotEmpty
                          ? vm.customCardText
                          : l10n.defaultCardPlaceholder,
                      textAlign: vm.selectedAlignment,
                      style: TextStyle(
                        fontSize: 16,
                        height: 1.4,
                        color: vm.selectedTextColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),

                // Bottom Sender Dedication
                if (vm.senderName.isNotEmpty)
                  Align(
                    alignment: Alignment.bottomRight,
                    child: Text(
                      '${l10n.cardSenderPrefix}${vm.senderName}',
                      style: TextStyle(
                        fontSize: 13,
                        fontStyle: FontStyle.italic,
                        color: vm.selectedTextColor.withValues(alpha: 0.9),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),

          // Text Editor Area
          AppCardContainer(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.editMessageTextLabel,
                  style: AppTypography.sectionHeader,
                ),
                const SizedBox(height: AppSpacing.sm),
                TextField(
                  controller: _textController,
                  maxLines: 3,
                  onChanged: (val) => vm.updateCustomCardText(val),
                  decoration: InputDecoration(
                    hintText: l10n.cardTextHint,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Theme Selection Chips
          AppCardContainer(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.editorTemplateTheme,
                  style: AppTypography.sectionHeader,
                ),
                const SizedBox(height: AppSpacing.md),
                AppChipSelect<String>(
                  options: themeOptions,
                  selectedOption: vm.selectedTemplateTheme,
                  onSelected: (val) => vm.setTemplateTheme(val),
                  labelBuilder: (item) => item,
                  iconBuilder: (_) => Icons.palette,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Text Alignment Controls
          AppCardContainer(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.editorTextAlignment,
                  style: AppTypography.sectionHeader,
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.format_align_left),
                      color: vm.selectedAlignment == TextAlign.left
                          ? AppColors.info
                          : AppColors.textSubtleDark,
                      onPressed: () => vm.setAlignment(TextAlign.left),
                    ),
                    IconButton(
                      icon: const Icon(Icons.format_align_center),
                      color: vm.selectedAlignment == TextAlign.center
                          ? AppColors.info
                          : AppColors.textSubtleDark,
                      onPressed: () => vm.setAlignment(TextAlign.center),
                    ),
                    IconButton(
                      icon: const Icon(Icons.format_align_right),
                      color: vm.selectedAlignment == TextAlign.right
                          ? AppColors.info
                          : AppColors.textSubtleDark,
                      onPressed: () => vm.setAlignment(TextAlign.right),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),

          // Multi-Format Export Actions
          Column(
            children: [
              AppPrimaryButton(
                label: l10n.btnExportPng,
                icon: Icons.image,
                onPressed: () => _exportFormat('PNG', context, l10n),
              ),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: AppSecondaryButton(
                      label: l10n.btnExportPdf,
                      icon: Icons.picture_as_pdf,
                      onPressed: () => _exportFormat('PDF', context, l10n),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: AppSecondaryButton(
                      label: l10n.btnCopyShareLink,
                      icon: Icons.link,
                      onPressed: () {
                        Clipboard.setData(const ClipboardData(
                            text:
                                'https://giftcard.dqrtech.com/share/card-123'));
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(l10n.copiedToClipboard)),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
