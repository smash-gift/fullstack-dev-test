import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_app/data/repositories/suggester_repository.dart';
import 'package:gift_card_app/domain/models/suggestion.dart';
import 'package:gift_card_app/features/suggester/view_models/suggester_view_model.dart';
import 'package:gift_card_app/features/suggester/widgets/occasion_form_screen.dart';
import 'package:gift_card_app/l10n/app_localizations.dart';
import 'package:gift_card_app/utils/result.dart';

class DummySuggesterRepository implements SuggesterRepository {
  @override
  Future<Result<List<Suggestion>>> getSuggestions(SuggestionRequestParams params) async {
    return Result.ok([]);
  }
}

void main() {
  late SuggesterViewModel viewModel;

  setUp(() {
    viewModel = SuggesterViewModel(repository: DummySuggesterRepository());
  });

  Widget buildTestWidget() {
    return MaterialApp(
      locale: const Locale('pt'),
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: AppLocalizations.supportedLocales,
      home: Scaffold(
        body: OccasionFormScreen(viewModel: viewModel),
      ),
    );
  }

  testWidgets('Renders predefined chips and Outro... chips for all 3 categories', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget());
    await tester.pumpAndSettle();

    expect(find.text('Outro...'), findsNWidgets(3));
  });

  testWidgets('Tapping Outro... chip reveals custom occasion TextField and updates viewModel', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget());
    await tester.pumpAndSettle();

    // Tap the first 'Outro...' chip (Occasion)
    final finder = find.text('Outro...').first;
    await tester.ensureVisible(finder);
    await tester.tap(finder);
    await tester.pumpAndSettle();

    // Verify custom occasion textfield appeared
    expect(find.text('Ocasião Personalizada'), findsOneWidget);

    // Enter custom occasion
    await tester.enterText(find.byType(TextField).at(0), 'Batizado');
    await tester.pumpAndSettle();

    expect(viewModel.selectedOccasion, equals('Batizado'));
  });

  testWidgets('Tapping Outro... for Relationship reveals custom textfield and updates viewModel', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget());
    await tester.pumpAndSettle();

    // Tap the second 'Outro...' chip (Relationship)
    final finder = find.text('Outro...').at(1);
    await tester.ensureVisible(finder);
    await tester.tap(finder);
    await tester.pumpAndSettle();

    expect(find.text('Relacionamento Personalizado'), findsOneWidget);

    await tester.enterText(find.byType(TextField).at(0), 'Madrinha');
    await tester.pumpAndSettle();

    expect(viewModel.selectedRelationship, equals('Madrinha'));
  });

  testWidgets('Tapping Outro... for Tone reveals custom textfield and updates viewModel', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestWidget());
    await tester.pumpAndSettle();

    // Tap the third 'Outro...' chip (Tone)
    final finder = find.text('Outro...').at(2);
    await tester.ensureVisible(finder);
    await tester.tap(finder);
    await tester.pumpAndSettle();

    expect(find.text('Tom de Voz Personalizado'), findsOneWidget);

    await tester.enterText(find.byType(TextField).at(0), 'Nostálgico');
    await tester.pumpAndSettle();

    expect(viewModel.selectedTone, equals('Nostálgico'));
  });
}
