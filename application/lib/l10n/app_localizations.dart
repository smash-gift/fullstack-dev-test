import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_pt.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('pt')
  ];

  /// No description provided for @appTitle.
  ///
  /// In pt, this message translates to:
  /// **'GiftCard AI Suggester'**
  String get appTitle;

  /// No description provided for @headerTitle.
  ///
  /// In pt, this message translates to:
  /// **'GiftCard AI'**
  String get headerTitle;

  /// No description provided for @headerSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'por DQR Tech'**
  String get headerSubtitle;

  /// No description provided for @guestSession.
  ///
  /// In pt, this message translates to:
  /// **'Sessão Convidado'**
  String get guestSession;

  /// No description provided for @stepOccasion.
  ///
  /// In pt, this message translates to:
  /// **'Ocasião'**
  String get stepOccasion;

  /// No description provided for @stepSuggestions.
  ///
  /// In pt, this message translates to:
  /// **'Sugestões'**
  String get stepSuggestions;

  /// No description provided for @stepEditor.
  ///
  /// In pt, this message translates to:
  /// **'Edição do Cartão'**
  String get stepEditor;

  /// No description provided for @occasionTitle.
  ///
  /// In pt, this message translates to:
  /// **'Para qual ocasião é a mensagem?'**
  String get occasionTitle;

  /// No description provided for @occasionSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Preencha os detalhes para a IA gerar opções personalizadas.'**
  String get occasionSubtitle;

  /// No description provided for @labelOccasion.
  ///
  /// In pt, this message translates to:
  /// **'Ocasião Especial'**
  String get labelOccasion;

  /// No description provided for @labelRelationship.
  ///
  /// In pt, this message translates to:
  /// **'Relacionamento com o Destinatário'**
  String get labelRelationship;

  /// No description provided for @labelTone.
  ///
  /// In pt, this message translates to:
  /// **'Tom de Voz Desejado'**
  String get labelTone;

  /// No description provided for @labelMemories.
  ///
  /// In pt, this message translates to:
  /// **'Memórias ou Detalhes Especiais (Opcional)'**
  String get labelMemories;

  /// No description provided for @labelRecipient.
  ///
  /// In pt, this message translates to:
  /// **'Nome do Destinatário (Para)'**
  String get labelRecipient;

  /// No description provided for @labelSender.
  ///
  /// In pt, this message translates to:
  /// **'Seu Nome (De)'**
  String get labelSender;

  /// No description provided for @labelTargetLanguage.
  ///
  /// In pt, this message translates to:
  /// **'Idioma da Mensagem Gerada'**
  String get labelTargetLanguage;

  /// No description provided for @occasionBirthday.
  ///
  /// In pt, this message translates to:
  /// **'Aniversário'**
  String get occasionBirthday;

  /// No description provided for @occasionWedding.
  ///
  /// In pt, this message translates to:
  /// **'Casamento'**
  String get occasionWedding;

  /// No description provided for @occasionAnniversary.
  ///
  /// In pt, this message translates to:
  /// **'Bodas / Namoro'**
  String get occasionAnniversary;

  /// No description provided for @occasionGraduation.
  ///
  /// In pt, this message translates to:
  /// **'Formatura'**
  String get occasionGraduation;

  /// No description provided for @occasionThankYou.
  ///
  /// In pt, this message translates to:
  /// **'Agradecimento'**
  String get occasionThankYou;

  /// No description provided for @occasionChristmas.
  ///
  /// In pt, this message translates to:
  /// **'Natal'**
  String get occasionChristmas;

  /// No description provided for @occasionFriendship.
  ///
  /// In pt, this message translates to:
  /// **'Amizade'**
  String get occasionFriendship;

  /// No description provided for @relFriend.
  ///
  /// In pt, this message translates to:
  /// **'Amigo(a)'**
  String get relFriend;

  /// No description provided for @relMom.
  ///
  /// In pt, this message translates to:
  /// **'Mãe'**
  String get relMom;

  /// No description provided for @relDad.
  ///
  /// In pt, this message translates to:
  /// **'Pai'**
  String get relDad;

  /// No description provided for @relPartner.
  ///
  /// In pt, this message translates to:
  /// **'Parceiro(a)'**
  String get relPartner;

  /// No description provided for @relColleague.
  ///
  /// In pt, this message translates to:
  /// **'Colega de Trabalho'**
  String get relColleague;

  /// No description provided for @relSibling.
  ///
  /// In pt, this message translates to:
  /// **'Irmão/Irmã'**
  String get relSibling;

  /// No description provided for @toneWarm.
  ///
  /// In pt, this message translates to:
  /// **'Carinhoso & Emocionante'**
  String get toneWarm;

  /// No description provided for @tonePlayful.
  ///
  /// In pt, this message translates to:
  /// **'Engraçado & Divertido'**
  String get tonePlayful;

  /// No description provided for @toneElegant.
  ///
  /// In pt, this message translates to:
  /// **'Elegante & Formal'**
  String get toneElegant;

  /// No description provided for @toneShort.
  ///
  /// In pt, this message translates to:
  /// **'Curto & Direto'**
  String get toneShort;

  /// No description provided for @tonePoetic.
  ///
  /// In pt, this message translates to:
  /// **'Poético & Inspirador'**
  String get tonePoetic;

  /// No description provided for @btnGenerateMessages.
  ///
  /// In pt, this message translates to:
  /// **'Gerar Mensagens com IA'**
  String get btnGenerateMessages;

  /// No description provided for @btnRegenerate.
  ///
  /// In pt, this message translates to:
  /// **'Gerar Mais Opções'**
  String get btnRegenerate;

  /// No description provided for @btnBack.
  ///
  /// In pt, this message translates to:
  /// **'Voltar'**
  String get btnBack;

  /// No description provided for @btnSelectForEditor.
  ///
  /// In pt, this message translates to:
  /// **'Cartão Visual'**
  String get btnSelectForEditor;

  /// No description provided for @btnCopyToClipboard.
  ///
  /// In pt, this message translates to:
  /// **'Copiar Texto'**
  String get btnCopyToClipboard;

  /// No description provided for @btnRetry.
  ///
  /// In pt, this message translates to:
  /// **'Tentar Novamente'**
  String get btnRetry;

  /// No description provided for @suggestionsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Sugestões de Mensagens'**
  String get suggestionsTitle;

  /// No description provided for @suggestionsSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Escolha a mensagem perfeita ou personalize no editor visual.'**
  String get suggestionsSubtitle;

  /// No description provided for @fallbackNotice.
  ///
  /// In pt, this message translates to:
  /// **'Serviço em modo de contingência local devido a instabilidade.'**
  String get fallbackNotice;

  /// No description provided for @copiedToClipboard.
  ///
  /// In pt, this message translates to:
  /// **'Mensagem copiada para a área de transferência!'**
  String get copiedToClipboard;

  /// No description provided for @editorTitle.
  ///
  /// In pt, this message translates to:
  /// **'Editor Visual do Cartão'**
  String get editorTitle;

  /// No description provided for @editorSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Personalize o design, cores, tipografia e exporte seu cartão.'**
  String get editorSubtitle;

  /// No description provided for @editorTemplateTheme.
  ///
  /// In pt, this message translates to:
  /// **'Tema Visual do Cartão'**
  String get editorTemplateTheme;

  /// No description provided for @editorFontFamily.
  ///
  /// In pt, this message translates to:
  /// **'Estilo de Fonte'**
  String get editorFontFamily;

  /// No description provided for @editorTextColor.
  ///
  /// In pt, this message translates to:
  /// **'Cor do Texto'**
  String get editorTextColor;

  /// No description provided for @editorTextAlignment.
  ///
  /// In pt, this message translates to:
  /// **'Alinhamento do Texto'**
  String get editorTextAlignment;

  /// No description provided for @editorCardPreview.
  ///
  /// In pt, this message translates to:
  /// **'Pré-visualização do Cartão'**
  String get editorCardPreview;

  /// No description provided for @btnExportPng.
  ///
  /// In pt, this message translates to:
  /// **'Exportar Imagem (PNG)'**
  String get btnExportPng;

  /// No description provided for @btnExportPdf.
  ///
  /// In pt, this message translates to:
  /// **'Exportar (PDF)'**
  String get btnExportPdf;

  /// No description provided for @btnCopyShareLink.
  ///
  /// In pt, this message translates to:
  /// **'Copiar Link de Compartilhamento'**
  String get btnCopyShareLink;

  /// No description provided for @themeSparkle.
  ///
  /// In pt, this message translates to:
  /// **'Aniversário Brilhante'**
  String get themeSparkle;

  /// No description provided for @themeDarkLuxury.
  ///
  /// In pt, this message translates to:
  /// **'Luxo Escuro'**
  String get themeDarkLuxury;

  /// No description provided for @themePastelJoy.
  ///
  /// In pt, this message translates to:
  /// **'Alegria Pastel'**
  String get themePastelJoy;

  /// No description provided for @themeNeonGlow.
  ///
  /// In pt, this message translates to:
  /// **'Vibe Neon'**
  String get themeNeonGlow;

  /// No description provided for @themeMinimal.
  ///
  /// In pt, this message translates to:
  /// **'Elegância Minimal'**
  String get themeMinimal;

  /// No description provided for @serviceUnavailableTitle.
  ///
  /// In pt, this message translates to:
  /// **'Serviço Temporariamente Indisponível'**
  String get serviceUnavailableTitle;

  /// No description provided for @serviceUnavailableSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Não foi possível conectar ao motor de IA no momento. Exibindo sugestões pré-gravadas offline.'**
  String get serviceUnavailableSubtitle;

  /// No description provided for @offlineSuggestions.
  ///
  /// In pt, this message translates to:
  /// **'Sugestões Offline Disponíveis'**
  String get offlineSuggestions;

  /// No description provided for @btnUseOffline.
  ///
  /// In pt, this message translates to:
  /// **'Usar Sugestão Offline'**
  String get btnUseOffline;

  /// No description provided for @offlineSuggestionTag.
  ///
  /// In pt, this message translates to:
  /// **'Sugestão Offline'**
  String get offlineSuggestionTag;

  /// No description provided for @editMessageTextLabel.
  ///
  /// In pt, this message translates to:
  /// **'Editar Texto da Mensagem'**
  String get editMessageTextLabel;

  /// No description provided for @cardTextHint.
  ///
  /// In pt, this message translates to:
  /// **'Digite o texto do seu cartão...'**
  String get cardTextHint;

  /// No description provided for @defaultCardPlaceholder.
  ///
  /// In pt, this message translates to:
  /// **'\"Sua mensagem personalizada aqui\"'**
  String get defaultCardPlaceholder;

  /// No description provided for @exportSuccessPng.
  ///
  /// In pt, this message translates to:
  /// **'Cartão exportado com sucesso em formato PNG!'**
  String get exportSuccessPng;

  /// No description provided for @exportSuccessPdf.
  ///
  /// In pt, this message translates to:
  /// **'Cartão exportado com sucesso em formato PDF!'**
  String get exportSuccessPdf;

  /// No description provided for @cardRecipientPrefix.
  ///
  /// In pt, this message translates to:
  /// **'Para: '**
  String get cardRecipientPrefix;

  /// No description provided for @cardSenderPrefix.
  ///
  /// In pt, this message translates to:
  /// **'Com carinho, '**
  String get cardSenderPrefix;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'pt'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'pt':
      return AppLocalizationsPt();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
