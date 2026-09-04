import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/app/core/theme/app_theme.dart';
import 'package:gift_card_suggester/modules/suggestions/domain/entities/suggestion.dart';
import 'package:gift_card_suggester/modules/suggestions/presenter/widgets/suggestion_card.dart';

import '../helpers/test_app.dart';

/// Layer 4 of the prompt-injection defence, asserted rather than asserted about.
///
/// The backend's output guard rejects URLs, markup and contact details, so text
/// like the payloads below should never arrive. These tests exist for the day
/// it does: the requirement is that anything which escapes the guard is
/// **shown**, never **tappable**.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(loadRealStrings);

  Future<void> pumpCard(WidgetTester tester, String text) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(
          body: SuggestionCard(suggestion: Suggestion(id: 's1', text: text)),
        ),
      ),
    );
  }

  group('the model output is rendered as text and nothing else', () {
    testWidgets('a plain message is shown', (tester) async {
      await pumpCard(tester, 'Happy birthday! So glad the world got you in it.');

      expect(find.text('Happy birthday! So glad the world got you in it.'), findsOneWidget);
    });

    testWidgets('a URL is displayed literally, never as a link', (tester) async {
      const payload = 'Claim your gift at http://evil.example now';
      await pumpCard(tester, payload);

      // Shown verbatim: the characters are visible, so a reader can see what
      // happened instead of being invited to tap it.
      expect(find.text(payload), findsOneWidget);

      // And the text itself sits inside no tap target. Scoped to ancestors of
      // the message on purpose: the card does contain one InkWell, the copy
      // button's, and a blanket assertion would have failed on it while saying
      // nothing about the thing that matters.
      expect(
        find.ancestor(of: find.text(payload), matching: find.byType(InkWell)),
        findsNothing,
      );
      expect(
        find.ancestor(of: find.text(payload), matching: find.byType(GestureDetector)),
        findsNothing,
      );
    });

    testWidgets('HTML is displayed as characters, never interpreted', (tester) async {
      const payload = 'Happy birthday <script>alert(1)</script>';
      await pumpCard(tester, payload);

      expect(find.text(payload), findsOneWidget);
    });

    testWidgets('markdown is displayed as characters, never rendered', (tester) async {
      const payload = 'Wishing you [everything](http://evil.example) good';
      await pumpCard(tester, payload);

      expect(find.text(payload), findsOneWidget);
    });

    testWidgets('the widget holding the text is a plain Text', (tester) async {
      await pumpCard(tester, 'Wishing you a wonderful day.');

      final text = tester.widget<Text>(find.text('Wishing you a wonderful day.'));
      // A `Text` with a plain string, not a TextSpan tree someone could have
      // built recognisers into.
      expect(text.data, isNotNull);
      expect(text.textSpan, isNull);
    });
  });

  group('copying', () {
    testWidgets('puts the message on the clipboard and says so', (tester) async {
      const message = 'Another year of you — that is worth celebrating.';
      String? copied;

      tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        SystemChannels.platform,
        (call) async {
          if (call.method == 'Clipboard.setData') {
            copied = (call.arguments as Map)['text'] as String;
          }
          return null;
        },
      );
      addTearDown(
        () => tester.binding.defaultBinaryMessenger
            .setMockMethodCallHandler(SystemChannels.platform, null),
      );

      await pumpCard(tester, message);
      await tester.tap(find.text('Copy'));
      await tester.pump();

      expect(copied, message);
      expect(find.text('Copied to clipboard'), findsOneWidget);
    });
  });

  group('long text', () {
    /// The contract caps a suggestion at two sentences, but a card that clips
    /// its own content is a bug whatever the backend promises.
    testWidgets('wraps instead of clipping', (tester) async {
      tester.view
        ..physicalSize = const Size(320, 900)
        ..devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      await pumpCard(
        tester,
        'Wishing you the kind of birthday that you will still be telling '
        'stories about years from now, surrounded by every single person who '
        'has ever made you laugh until it hurt.',
      );

      expect(tester.takeException(), isNull);
    });
  });
}
