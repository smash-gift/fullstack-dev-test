import 'package:flutter/material.dart';
import '../../../core/themes/app_theme.dart';
import '../../../core/ui/core_widgets.dart';
import '../../../data/repositories/suggester_repository.dart';
import '../../../domain/enums/occasion.dart';
import '../../../l10n/app_localizations.dart';
import '../view_models/suggester_view_model.dart';

class OccasionFormScreen extends StatefulWidget {
  final SuggesterViewModel viewModel;

  const OccasionFormScreen({super.key, required this.viewModel});

  @override
  State<OccasionFormScreen> createState() => _OccasionFormScreenState();
}

class _OccasionFormScreenState extends State<OccasionFormScreen> {
  late TextEditingController _memoriesController;
  late TextEditingController _recipientController;
  late TextEditingController _senderController;

  @override
  void initState() {
    super.initState();
    _memoriesController =
        TextEditingController(text: widget.viewModel.specialMemories);
    _recipientController =
        TextEditingController(text: widget.viewModel.recipientName);
    _senderController =
        TextEditingController(text: widget.viewModel.senderName);
  }

  @override
  void dispose() {
    _memoriesController.dispose();
    _recipientController.dispose();
    _senderController.dispose();
    super.dispose();
  }

  void _onGeneratePressed(AppLocalizations l10n) {
    widget.viewModel.setSpecialMemories(_memoriesController.text);
    widget.viewModel.setRecipientName(_recipientController.text);
    widget.viewModel.setSenderName(_senderController.text);

    widget.viewModel.generateCommand.execute(
      SuggestionRequestParams(
        occasion: widget.viewModel.selectedOccasion,
        relationship: widget.viewModel.selectedRelationship,
        language: widget.viewModel.currentLocale,
        guestId: 'guest-session-uuid',
      ),
    );
  }

  IconData _getOccasionIcon(String key) => Occasion.fromKey(key).icon;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final vm = widget.viewModel;

    final occasionOptions = [
      l10n.occasionBirthday,
      l10n.occasionWedding,
      l10n.occasionAnniversary,
      l10n.occasionGraduation,
      l10n.occasionThankYou,
      l10n.occasionChristmas,
      l10n.occasionFriendship,
    ];

    final relOptions = [
      l10n.relFriend,
      l10n.relMom,
      l10n.relDad,
      l10n.relPartner,
      l10n.relColleague,
      l10n.relSibling,
    ];

    final toneOptions = [
      l10n.toneWarm,
      l10n.tonePlayful,
      l10n.toneElegant,
      l10n.toneShort,
      l10n.tonePoetic,
    ];

    return SingleChildScrollView(
      padding: AppSpacing.paddingLg,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Section
          Text(
            l10n.occasionTitle,
            style: AppTypography.displayLarge,
          ),
          const SizedBox(height: AppSpacing.xxs),
          Text(
            l10n.occasionSubtitle,
            style: AppTypography.bodySmall,
          ),
          const SizedBox(height: AppSpacing.xl),

          // Occasion Chips Selection
          AppCardContainer(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.labelOccasion,
                  style: AppTypography.sectionHeader,
                ),
                const SizedBox(height: AppSpacing.md),
                AppChipSelect<String>(
                  options: occasionOptions,
                  selectedOption: vm.selectedOccasion.isNotEmpty
                      ? vm.selectedOccasion
                      : occasionOptions.first,
                  onSelected: (val) => vm.setOccasion(val),
                  labelBuilder: (item) => item,
                  iconBuilder: (item) => _getOccasionIcon(item),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Relationship Selection
          AppCardContainer(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.labelRelationship,
                  style: AppTypography.sectionHeader,
                ),
                const SizedBox(height: AppSpacing.md),
                AppChipSelect<String>(
                  options: relOptions,
                  selectedOption: vm.selectedRelationship.isNotEmpty
                      ? vm.selectedRelationship
                      : relOptions.first,
                  onSelected: (val) => vm.setRelationship(val),
                  labelBuilder: (item) => item,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Tone Selection
          AppCardContainer(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.labelTone,
                  style: AppTypography.sectionHeader,
                ),
                const SizedBox(height: AppSpacing.md),
                AppChipSelect<String>(
                  options: toneOptions,
                  selectedOption: vm.selectedTone.isNotEmpty
                      ? vm.selectedTone
                      : toneOptions.first,
                  onSelected: (val) => vm.setTone(val),
                  labelBuilder: (item) => item,
                  iconBuilder: (_) => Icons.tune,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Recipient & Sender Input Fields
          AppCardContainer(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _recipientController,
                  decoration: InputDecoration(
                    labelText: l10n.labelRecipient,
                    prefixIcon: const Icon(Icons.person,
                        color: AppColors.textSubtleDark),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                TextField(
                  controller: _senderController,
                  decoration: InputDecoration(
                    labelText: l10n.labelSender,
                    prefixIcon: const Icon(Icons.person_outline,
                        color: AppColors.textSubtleDark),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                TextField(
                  controller: _memoriesController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: l10n.labelMemories,
                    alignLabelWithHint: true,
                    prefixIcon: const Icon(Icons.edit_note,
                        color: AppColors.textSubtleDark),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),

          // Generate CTA Button
          ListenableBuilder(
            listenable: vm.generateCommand,
            builder: (context, _) {
              return AppPrimaryButton(
                label: l10n.btnGenerateMessages,
                icon: Icons.auto_awesome,
                isLoading: vm.generateCommand.running,
                onPressed: () => _onGeneratePressed(l10n),
              );
            },
          ),
        ],
      ),
    );
  }
}
