import 'package:flutter/material.dart';
import '../widgets/occasion_selector.dart';
import '../widgets/relationship_selector.dart';
import '../widgets/suggestion_list.dart';
import '../services/suggestion_service.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key, required this.service});

  final SuggestionService service;

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  String? _occasion;
  String? _relationship;
  String _customOccasion = '';
  String _customRelationship = '';
  bool _loading = false;
  String? _error;
  List<String> _suggestions = [];

  bool get _isOccasionValid =>
      _occasion != null && (_occasion != 'outro' || _customOccasion.trim().isNotEmpty);

  bool get _isRelationshipValid =>
      _relationship != null &&
      (_relationship != 'outro' || _customRelationship.trim().isNotEmpty);

  void _getSuggestions() async {
    final occasion = _occasion == 'outro' ? _customOccasion.trim() : _occasion!;
    final relationship =
        _relationship == 'outro' ? _customRelationship.trim() : _relationship!;

    setState(() {
      _loading = true;
      _error = null;
      _suggestions = [];
    });
    try {
      final suggestions = await widget.service.getSuggestions(
        occasion: occasion,
        relationship: relationship,
      );
      setState(() {
        _suggestions = suggestions;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao buscar sugestões. Tente novamente.';
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const PreferredSize(
        preferredSize: Size.fromHeight(72),
        child: _MainHeader(),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 22),
            const Text(
              'Mensagens para Cartões-Presente',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 16),
            const Text(
              'Escolha a ocasião e o relacionamento, e nossa IA criará sugestões personalizadas para você.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 32),
            OccasionSelector(
              selected: _occasion,
              customValue: _customOccasion,
              onCustomChanged: (value) => setState(() => _customOccasion = value),
              onSelect: (val) => setState(() {
                _occasion = val;
                if (val != 'outro') {
                  _customOccasion = '';
                }
              }),
            ),
            const SizedBox(height: 24),
            RelationshipSelector(
              selected: _relationship,
              customValue: _customRelationship,
              onCustomChanged: (value) => setState(() => _customRelationship = value),
              onSelect: (val) => setState(() {
                _relationship = val;
                if (val != 'outro') {
                  _customRelationship = '';
                }
              }),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: (_isOccasionValid && _isRelationshipValid && !_loading)
                  ? _getSuggestions
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.pink,
                padding: const EdgeInsets.symmetric(vertical: 16),
                textStyle: const TextStyle(fontSize: 18),
              ),
              child: _loading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                    )
                  : const _GenerateSuggestionsLabel(),
            ),
            const SizedBox(height: 32),
            if (_error != null)
              Text(_error!, style: const TextStyle(color: Colors.red), textAlign: TextAlign.center),
            if (_suggestions.isNotEmpty)
              SuggestionList(suggestions: _suggestions),
          ],
        ),
      ),
    );
  }
}

class _MainHeader extends StatelessWidget {
  const _MainHeader();

  @override
  Widget build(BuildContext context) {
    return AppBar(
      automaticallyImplyLeading: false,
      toolbarHeight: 72,
      elevation: 0,
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      shadowColor: const Color(0x14000000),
      titleSpacing: 0,
      title: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: const Color(0xFFFFEFF4),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.redeem_rounded,
                color: Color(0xFFE46A95),
                size: 18,
              ),
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: _HeaderBrand(),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeaderBrand extends StatelessWidget {
  const _HeaderBrand();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: const [
        Text(
          'GiftMsg',
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: Color(0xFF4F3A35),
          ),
        ),
        SizedBox(height: 1),
        Text(
          'MENSAGENS COM IA',
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 9,
            letterSpacing: 0.9,
            fontWeight: FontWeight.w600,
            color: Color(0xFFA08881),
          ),
        ),
      ],
    );
  }
}

class _GenerateSuggestionsLabel extends StatelessWidget {
  const _GenerateSuggestionsLabel();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: const [
        Icon(Icons.auto_fix_high, color: Colors.white, size: 18),
        SizedBox(width: 10),
        Text(
          'Gerar Sugestões',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
