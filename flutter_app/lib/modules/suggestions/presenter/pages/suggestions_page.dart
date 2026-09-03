import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../app/core/config/settings_store.dart';
import '../../../../app/core/theme/app_theme.dart';
import '../../../../config/internationalization/app_localizations.dart';
import '../../../../config/internationalization/localizations_key.dart';
import '../stores/suggestions_store.dart';
import '../widgets/app_header.dart';
import '../widgets/degraded_banner.dart';
import '../widgets/empty_hint.dart';
import '../widgets/failure_banner.dart';
import '../widgets/generate_button.dart';
import '../widgets/loading_skeleton.dart';
import '../widgets/occasion_field.dart';
import '../widgets/relationship_field.dart';
import '../widgets/settings_dialog.dart';
import '../widgets/suggestions_list.dart';
import '../widgets/tone_selector.dart';

/// The screen.
///
/// Rule R2: a page composes and nothing else. There is no widget class declared
/// here, no `_buildSomething` method, and no `setState` — every visual piece is
/// its own file and every piece of state lives in a store. What is left is the
/// arrangement, which is the one thing a page is for.
class SuggestionsPage extends StatelessWidget {
  const SuggestionsPage({
    required this.store,
    required this.settings,
    super.key,
  });

  final SuggestionsStore store;
  final SettingsStore settings;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: AppTheme.contentMaxWidth),
            child: ListenableBuilder(
              listenable: Listenable.merge([store, settings]),
              builder: (context, _) => ListView(
                padding: const EdgeInsets.fromLTRB(
                  AppTheme.gapMd,
                  AppTheme.gapSm,
                  AppTheme.gapMd,
                  AppTheme.gapLg,
                ),
                children: _content(context),
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _content(BuildContext context) {
    final failure = store.bannerFailure;

    return [
      AppHeader(onOpenSettings: () => SettingsDialog.show(context, settings)),
      const SizedBox(height: AppTheme.gapMd),

      Text(tr(L.homeHeadline), style: Theme.of(context).textTheme.headlineSmall),
      const SizedBox(height: 4),
      Text(tr(L.homeSubhead), style: Theme.of(context).textTheme.bodySmall),
      const SizedBox(height: AppTheme.gapLg),

      // A failure sits above the form: it explains why the form did nothing.
      if (failure != null) ...[
        FailureBanner(
          failure: failure,
          baseUrl: settings.baseUrl,
          onRetry: () => _submit(context),
        ),
        const SizedBox(height: AppTheme.gapMd),
      ],

      // A degradation sits above the results it describes.
      if (store.isDegraded && failure == null) ...[
        const DegradedBanner(),
        const SizedBox(height: AppTheme.gapMd),
      ],

      OccasionField(store: store),
      const SizedBox(height: AppTheme.gapMd),
      RelationshipField(store: store),
      const SizedBox(height: AppTheme.gapMd),
      ToneSelector(store: store),
      const SizedBox(height: AppTheme.gapLg),

      GenerateButton(store: store, onPressed: () => _submit(context)),
      const SizedBox(height: AppTheme.gapLg),

      if (store.isLoading)
        const LoadingSkeleton()
      else if (store.hasSuggestions)
        SuggestionsList(suggestions: store.result!.suggestions)
      else
        const EmptyHint(),
    ];
  }

  void _submit(BuildContext context) {
    // The keyboard covers the results on a phone, and the user is done typing.
    FocusScope.of(context).unfocus();
    // Not awaited on purpose, and said so with dart:async's own helper rather
    // than a hand-rolled stand-in: the store publishes every state change, so
    // the page has nothing to wait for.
    unawaited(store.submit(language: AppLocalizations.instance.language));
  }
}
