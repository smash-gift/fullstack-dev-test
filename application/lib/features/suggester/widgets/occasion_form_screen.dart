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

  late TextEditingController _customOccasionController;
  late TextEditingController _customRelationshipController;
  late TextEditingController _customToneController;

  bool _isCustomOccasion = false;
  bool _isCustomRelationship = false;
  bool _isCustomTone = false;

  @override
  void initState() {
    super.initState();
    _memoriesController =
        TextEditingController(text: widget.viewModel.specialMemories);
    _recipientController =
        TextEditingController(text: widget.viewModel.recipientName);
    _senderController =
        TextEditingController(text: widget.viewModel.senderName);

    _customOccasionController = TextEditingController();
    _customRelationshipController = TextEditingController();
    _customToneController = TextEditingController();
  }

  @override
  void dispose() {
    _memoriesController.dispose();
    _recipientController.dispose();
    _senderController.dispose();
    _customOccasionController.dispose();
    _customRelationshipController.dispose();
    _customToneController.dispose();
    super.dispose();
  }

  void _onGeneratePressed(AppLocalizations l10n) {
    if (_isCustomOccasion) {
      widget.viewModel.setOccasion(_customOccasionController.text.trim());
    }
    if (_isCustomRelationship) {
      widget.viewModel.setRelationship(_customRelationshipController.text.trim());
    }
    if (_isCustomTone) {
      widget.viewModel.setTone(_customToneController.text.trim());
    }

    if (widget.viewModel.selectedOccasion.isEmpty ||
        widget.viewModel.selectedRelationship.isEmpty ||
        widget.viewModel.selectedTone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.errorEmptyCustomField)),
      );
      return;
    }

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

  IconData _getOccasionIcon(String key, String otherLabel) {
    if (key == otherLabel) return Icons.edit_note;
    return Occasion.fromKey(key).icon;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final vm = widget.viewModel;

    final predefinedOccasions = [
      l10n.occasionBirthday,
      l10n.occasionWedding,
      l10n.occasionAnniversary,
      l10n.occasionGraduation,
      l10n.occasionThankYou,
      l10n.occasionChristmas,
      l10n.occasionFriendship,
    ];

    final predefinedRelationships = [
      l10n.relFriend,
      l10n.relMom,
      l10n.relDad,
      l10n.relPartner,
      l10n.relColleague,
      l10n.relSibling,
    ];

    final predefinedTones = [
      l10n.toneWarm,
      l10n.tonePlayful,
      l10n.toneElegant,
      l10n.toneShort,
      l10n.tonePoetic,
    ];

    final occasionOptions = [...predefinedOccasions, l10n.optionOther];
    final relOptions = [...predefinedRelationships, l10n.optionOther];
    final toneOptions = [...predefinedTones, l10n.optionOther];

    final selectedOccasionChip = _isCustomOccasion
        ? l10n.optionOther
        : (vm.selectedOccasion.isNotEmpty && predefinedOccasions.contains(vm.selectedOccasion)
            ? vm.selectedOccasion
            : occasionOptions.first);

    final selectedRelationshipChip = _isCustomRelationship
        ? l10n.optionOther
        : (vm.selectedRelationship.isNotEmpty && predefinedRelationships.contains(vm.selectedRelationship)
            ? vm.selectedRelationship
            : relOptions.first);

    final selectedToneChip = _isCustomTone
        ? l10n.optionOther
        : (vm.selectedTone.isNotEmpty && predefinedTones.contains(vm.selectedTone)
            ? vm.selectedTone
            : toneOptions.first);

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
                  selectedOption: selectedOccasionChip,
                  onSelected: (val) {
                    if (val == l10n.optionOther) {
                      setState(() {
                        _isCustomOccasion = true;
                      });
                      vm.setOccasion(_customOccasionController.text.trim());
                    } else {
                      setState(() {
                        _isCustomOccasion = false;
                        _customOccasionController.clear();
                      });
                      vm.setOccasion(val);
                    }
                  },
                  labelBuilder: (item) => item,
                  iconBuilder: (item) => _getOccasionIcon(item, l10n.optionOther),
                ),
                if (_isCustomOccasion) ...[
                  const SizedBox(height: AppSpacing.md),
                  TextField(
                    controller: _customOccasionController,
                    decoration: InputDecoration(
                      labelText: l10n.labelCustomOccasion,
                      hintText: l10n.hintCustomOccasion,
                      prefixIcon: const Icon(Icons.edit, color: AppColors.textSubtleDark),
                    ),
                    onChanged: (val) => vm.setOccasion(val.trim()),
                  ),
                ],
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
                  selectedOption: selectedRelationshipChip,
                  onSelected: (val) {
                    if (val == l10n.optionOther) {
                      setState(() {
                        _isCustomRelationship = true;
                      });
                      vm.setRelationship(_customRelationshipController.text.trim());
                    } else {
                      setState(() {
                        _isCustomRelationship = false;
                        _customRelationshipController.clear();
                      });
                      vm.setRelationship(val);
                    }
                  },
                  labelBuilder: (item) => item,
                ),
                if (_isCustomRelationship) ...[
                  const SizedBox(height: AppSpacing.md),
                  TextField(
                    controller: _customRelationshipController,
                    decoration: InputDecoration(
                      labelText: l10n.labelCustomRelationship,
                      hintText: l10n.hintCustomRelationship,
                      prefixIcon: const Icon(Icons.edit, color: AppColors.textSubtleDark),
                    ),
                    onChanged: (val) => vm.setRelationship(val.trim()),
                  ),
                ],
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
                  selectedOption: selectedToneChip,
                  onSelected: (val) {
                    if (val == l10n.optionOther) {
                      setState(() {
                        _isCustomTone = true;
                      });
                      vm.setTone(_customToneController.text.trim());
                    } else {
                      setState(() {
                        _isCustomTone = false;
                        _customToneController.clear();
                      });
                      vm.setTone(val);
                    }
                  },
                  labelBuilder: (item) => item,
                  iconBuilder: (_) => Icons.tune,
                ),
                if (_isCustomTone) ...[
                  const SizedBox(height: AppSpacing.md),
                  TextField(
                    controller: _customToneController,
                    decoration: InputDecoration(
                      labelText: l10n.labelCustomTone,
                      hintText: l10n.hintCustomTone,
                      prefixIcon: const Icon(Icons.tune, color: AppColors.textSubtleDark),
                    ),
                    onChanged: (val) => vm.setTone(val.trim()),
                  ),
                ],
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
