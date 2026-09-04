/// Every translation key the application uses.
///
/// A sealed class of constants rather than bare strings at the call sites: a
/// typo becomes a compile error instead of a label that silently renders its
/// own key, and the checked-in test compares this list against the three JSON
/// files so a key cannot exist in one place and not the other.
sealed class L {
  static const appTitle = 'app_title';

  static const homeHeadline = 'home_headline';
  static const homeSubhead = 'home_subhead';
  static const homeEmptyHint = 'home_empty_hint';

  static const fieldOccasionLabel = 'field_occasion_label';
  static const fieldOccasionHint = 'field_occasion_hint';
  static const fieldRelationshipLabel = 'field_relationship_label';
  static const fieldRelationshipHint = 'field_relationship_hint';
  static const fieldToneLabel = 'field_tone_label';
  static const fieldRequired = 'field_required';

  static const toneWarm = 'tone_warm';
  static const toneFunny = 'tone_funny';
  static const toneFormal = 'tone_formal';
  static const toneHeartfelt = 'tone_heartfelt';

  static const actionGenerate = 'action_generate';
  static const actionGenerateAgain = 'action_generate_again';
  static const actionWriting = 'action_writing';
  static const actionTryAgain = 'action_try_again';
  static const actionCopy = 'action_copy';
  static const actionCopied = 'action_copied';
  static const actionSettings = 'action_settings';

  static const resultsTitle = 'results_title';
  static const resultsCount = 'results_count';
  static const resultsLength = 'results_length';

  static const degradedTitle = 'degraded_title';
  static const degradedBody = 'degraded_body';

  static const errorConnectionTitle = 'error_connection_title';
  static const errorConnectionBody = 'error_connection_body';
  static const errorTimeoutTitle = 'error_timeout_title';
  static const errorTimeoutBody = 'error_timeout_body';
  static const errorValidationTitle = 'error_validation_title';
  static const errorRateLimitedTitle = 'error_rate_limited_title';
  static const errorRateLimitedBody = 'error_rate_limited_body';
  static const errorServerTitle = 'error_server_title';
  static const errorServerBody = 'error_server_body';

  static const settingsTitle = 'settings_title';
  static const settingsDescription = 'settings_description';
  static const settingsUrlLabel = 'settings_url_label';
  static const settingsUrlInvalid = 'settings_url_invalid';
  static const settingsSave = 'settings_save';
  static const settingsCancel = 'settings_cancel';
  static const settingsReset = 'settings_reset';

  /// Used by the test that keeps the JSON files and this class in step.
  static const all = <String>[
    appTitle,
    homeHeadline,
    homeSubhead,
    homeEmptyHint,
    fieldOccasionLabel,
    fieldOccasionHint,
    fieldRelationshipLabel,
    fieldRelationshipHint,
    fieldToneLabel,
    fieldRequired,
    toneWarm,
    toneFunny,
    toneFormal,
    toneHeartfelt,
    actionGenerate,
    actionGenerateAgain,
    actionWriting,
    actionTryAgain,
    actionCopy,
    actionCopied,
    actionSettings,
    resultsTitle,
    resultsCount,
    resultsLength,
    degradedTitle,
    degradedBody,
    errorConnectionTitle,
    errorConnectionBody,
    errorTimeoutTitle,
    errorTimeoutBody,
    errorValidationTitle,
    errorRateLimitedTitle,
    errorRateLimitedBody,
    errorServerTitle,
    errorServerBody,
    settingsTitle,
    settingsDescription,
    settingsUrlLabel,
    settingsUrlInvalid,
    settingsSave,
    settingsCancel,
    settingsReset,
  ];
}
