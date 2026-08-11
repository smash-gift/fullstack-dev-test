// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'GiftCard AI Suggester';

  @override
  String get headerTitle => 'GiftCard AI';

  @override
  String get headerSubtitle => 'by DQR Tech';

  @override
  String get guestSession => 'Guest Session';

  @override
  String get stepOccasion => 'Occasion';

  @override
  String get stepSuggestions => 'Suggestions';

  @override
  String get stepEditor => 'Card Editor';

  @override
  String get occasionTitle => 'What is the occasion for this message?';

  @override
  String get occasionSubtitle =>
      'Fill in the details for AI to generate personalized options.';

  @override
  String get labelOccasion => 'Special Occasion';

  @override
  String get labelRelationship => 'Relationship with Recipient';

  @override
  String get labelTone => 'Desired Tone of Voice';

  @override
  String get labelMemories => 'Memories or Special Details (Optional)';

  @override
  String get labelRecipient => 'Recipient Name (To)';

  @override
  String get labelSender => 'Your Name (From)';

  @override
  String get labelTargetLanguage => 'Output Message Language';

  @override
  String get occasionBirthday => 'Birthday';

  @override
  String get occasionWedding => 'Wedding';

  @override
  String get occasionAnniversary => 'Anniversary';

  @override
  String get occasionGraduation => 'Graduation';

  @override
  String get occasionThankYou => 'Thank You';

  @override
  String get occasionChristmas => 'Christmas';

  @override
  String get occasionFriendship => 'Friendship';

  @override
  String get relFriend => 'Friend';

  @override
  String get relMom => 'Mom';

  @override
  String get relDad => 'Dad';

  @override
  String get relPartner => 'Partner';

  @override
  String get relColleague => 'Colleague';

  @override
  String get relSibling => 'Sibling';

  @override
  String get toneWarm => 'Warm & Sentimental';

  @override
  String get tonePlayful => 'Humorous & Playful';

  @override
  String get toneElegant => 'Elegant & Formal';

  @override
  String get toneShort => 'Short & Sweet';

  @override
  String get tonePoetic => 'Poetic & Inspiring';

  @override
  String get btnGenerateMessages => 'Generate AI Messages';

  @override
  String get btnRegenerate => 'Generate More Options';

  @override
  String get btnBack => 'Back';

  @override
  String get btnSelectForEditor => 'Customize Visual Card';

  @override
  String get btnCopyToClipboard => 'Copy Text';

  @override
  String get btnRetry => 'Try Again';

  @override
  String get suggestionsTitle => 'Message Suggestions';

  @override
  String get suggestionsSubtitle =>
      'Choose the perfect message or customize it in the visual editor.';

  @override
  String get fallbackNotice =>
      'Service running in local contingency mode due to temporary instability.';

  @override
  String get copiedToClipboard => 'Message copied to clipboard!';

  @override
  String get editorTitle => 'Visual Card Editor';

  @override
  String get editorSubtitle =>
      'Customize design, colors, typography, and export your card.';

  @override
  String get editorTemplateTheme => 'Visual Card Theme';

  @override
  String get editorFontFamily => 'Font Style';

  @override
  String get editorTextColor => 'Text Color';

  @override
  String get editorTextAlignment => 'Text Alignment';

  @override
  String get editorCardPreview => 'Card Preview Canvas';

  @override
  String get btnExportPng => 'Export Image (PNG)';

  @override
  String get btnExportPdf => 'Export (PDF)';

  @override
  String get btnCopyShareLink => 'Copy Shareable Link';

  @override
  String get themeSparkle => 'Birthday Sparkle';

  @override
  String get themeDarkLuxury => 'Dark Luxury';

  @override
  String get themePastelJoy => 'Pastel Joy';

  @override
  String get themeNeonGlow => 'Neon Glow';

  @override
  String get themeMinimal => 'Minimal Elegance';

  @override
  String get serviceUnavailableTitle => 'Service Temporarily Unavailable';

  @override
  String get serviceUnavailableSubtitle =>
      'Unable to connect to AI engine at the moment. Displaying offline templates.';

  @override
  String get offlineSuggestions => 'Available Offline Suggestions';

  @override
  String get btnUseOffline => 'Use Offline Suggestion';

  @override
  String get offlineSuggestionTag => 'Offline Suggestion';

  @override
  String get editMessageTextLabel => 'Edit Message Text';

  @override
  String get cardTextHint => 'Type your card message...';

  @override
  String get defaultCardPlaceholder => '\"Your personalized message here\"';

  @override
  String get exportSuccessPng => 'Card successfully exported as PNG!';

  @override
  String get exportSuccessPdf => 'Card successfully exported as PDF!';

  @override
  String get cardRecipientPrefix => 'To: ';

  @override
  String get cardSenderPrefix => 'With love, ';
}
