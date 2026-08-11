import 'package:flutter/material.dart';
import '../../../core/themes/app_theme.dart';
import '../../../data/repositories/suggester_repository.dart';
import '../../../domain/models/suggestion.dart';
import '../../../utils/command.dart';
import '../../../utils/result.dart';

class SuggesterViewModel extends ChangeNotifier {
  final SuggesterRepository _repository;

  int _currentStep = 0; // 0: Form, 1: Suggestions, 2: Card Editor, 3: Service Unavailable
  String _currentLocale = 'pt';

  // Form State
  String _selectedOccasion = 'Aniversário';
  String _selectedRelationship = 'Amigo(a)';
  String _selectedTone = 'Carinhoso & Emocionante';
  String _specialMemories = '';
  String _recipientName = '';
  String _senderName = '';

  // Suggestions & Card State
  List<Suggestion> _suggestions = [];
  Suggestion? _selectedSuggestion;
  String _customCardText = '';

  // Visual Card Customization State
  String _selectedTemplateTheme = 'Aniversário Brilhante';
  String _selectedFontFamily = 'Inter';
  Color _selectedTextColor = AppColors.textWhite;
  TextAlign _selectedAlignment = TextAlign.center;

  SuggesterViewModel({required SuggesterRepository repository})
      : _repository = repository {
    generateCommand = Command1(_generateSuggestions);
  }

  late final Command1<List<Suggestion>, SuggestionRequestParams> generateCommand;

  // Getters
  int get currentStep => _currentStep;
  String get currentLocale => _currentLocale;

  String get selectedOccasion => _selectedOccasion;
  String get selectedRelationship => _selectedRelationship;
  String get selectedTone => _selectedTone;
  String get specialMemories => _specialMemories;
  String get recipientName => _recipientName;
  String get senderName => _senderName;

  List<Suggestion> get suggestions => _suggestions;
  Suggestion? get selectedSuggestion => _selectedSuggestion;
  String get customCardText => _customCardText;

  String get selectedTemplateTheme => _selectedTemplateTheme;
  String get selectedFontFamily => _selectedFontFamily;
  Color get selectedTextColor => _selectedTextColor;
  TextAlign get selectedAlignment => _selectedAlignment;

  // Setters
  void setLocale(String locale) {
    _currentLocale = locale;
    notifyListeners();
  }

  void setStep(int step) {
    _currentStep = step;
    notifyListeners();
  }

  void setOccasion(String occasion) {
    _selectedOccasion = occasion;
    notifyListeners();
  }

  void setRelationship(String rel) {
    _selectedRelationship = rel;
    notifyListeners();
  }

  void setTone(String tone) {
    _selectedTone = tone;
    notifyListeners();
  }

  void setSpecialMemories(String memories) {
    _specialMemories = memories;
    notifyListeners();
  }

  void setRecipientName(String name) {
    _recipientName = name;
    notifyListeners();
  }

  void setSenderName(String name) {
    _senderName = name;
    notifyListeners();
  }

  void selectSuggestion(Suggestion suggestion) {
    _selectedSuggestion = suggestion;
    _customCardText = suggestion.text;
    _currentStep = 2; // Move to Visual Card Editor
    notifyListeners();
  }

  void updateCustomCardText(String text) {
    _customCardText = text;
    notifyListeners();
  }

  void setTemplateTheme(String theme) {
    _selectedTemplateTheme = theme;
    notifyListeners();
  }

  void setFontFamily(String font) {
    _selectedFontFamily = font;
    notifyListeners();
  }

  void setTextColor(Color color) {
    _selectedTextColor = color;
    notifyListeners();
  }

  void setAlignment(TextAlign align) {
    _selectedAlignment = align;
    notifyListeners();
  }

  Future<Result<List<Suggestion>>> _generateSuggestions(SuggestionRequestParams params) async {
    final result = await _repository.getSuggestions(params);
    if (result.isOk) {
      _suggestions = result.asOk;
      _currentStep = 1; // Move to Suggestions step
    } else {
      // Fallback offline suggestions
      _suggestions = _getOfflineFallbackSuggestions(params.occasion, params.relationship);
      _currentStep = 3; // Move to Service Unavailable screen
    }
    notifyListeners();
    return result;
  }

  List<Suggestion> _getOfflineFallbackSuggestions(String occasion, String rel) {
    return [
      Suggestion(
        id: 'off-1',
        text: 'Desejo a você um dia repleto de alegrias, conquistas e momentos inesquecíveis! Parabéns pelo seu dia especial.',
        occasion: occasion,
        relationship: rel,
        language: _currentLocale,
        tone: _selectedTone,
        isFallback: true,
      ),
      Suggestion(
        id: 'off-2',
        text: 'Que este ciclo traga muita paz, luz e realizações. É um privilégio ter você na minha vida!',
        occasion: occasion,
        relationship: rel,
        language: _currentLocale,
        tone: _selectedTone,
        isFallback: true,
      ),
    ];
  }
}
