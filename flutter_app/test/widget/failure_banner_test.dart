import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gift_card_suggester/app/core/theme/app_theme.dart';
import 'package:gift_card_suggester/modules/suggestions/domain/errors/suggestions_failure.dart';
import 'package:gift_card_suggester/modules/suggestions/presenter/widgets/failure_banner.dart';

import '../helpers/test_app.dart';

/// Every branch of the banner, driven directly.
///
/// The page tests reach two of these through the store; the other three are
/// only reachable by handing the failure in. A branch nobody renders is a
/// sentence nobody has read, and the whole point of this widget is that the
/// user is told what happened and what to try.
void main() {
  setUpAll(loadRealStrings);

  Future<void> pumpBanner(
    WidgetTester tester,
    SuggestionsFailure failure, {
    String baseUrl = 'http://localhost:3000',
    VoidCallback? onRetry,
  }) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(
          body: FailureBanner(
            failure: failure,
            baseUrl: baseUrl,
            onRetry: onRetry ?? () {},
          ),
        ),
      ),
    );
  }

  testWidgets('a connection failure names the address it could not reach', (tester) async {
    await pumpBanner(tester, const ConnectionFailure(), baseUrl: 'http://10.0.2.2:3000');

    expect(find.textContaining('http://10.0.2.2:3000'), findsOneWidget);
  });

  testWidgets('a timeout says so, and is not the connection copy', (tester) async {
    await pumpBanner(tester, const TimeoutFailure());

    expect(find.textContaining('http://'), findsNothing);
    expect(find.byType(Text), findsAtLeast(2));
  });

  testWidgets('a rate limit tells the user how long to wait', (tester) async {
    await pumpBanner(tester, const RateLimitedFailure(93));

    expect(find.textContaining('93'), findsOneWidget);
  });

  testWidgets('the wait is the number the server sent, not a fixed string', (tester) async {
    await pumpBanner(tester, const RateLimitedFailure(7));

    expect(find.textContaining('7'), findsOneWidget);
    expect(find.textContaining('{seconds}'), findsNothing);
  });

  testWidgets('a validation failure renders a title and no body', (tester) async {
    await pumpBanner(tester, const ValidationFailure({'occasion': 'required'}));

    final bodies = tester.widgetList<Text>(find.byType(Text)).map((t) => t.data).toList();
    expect(bodies, contains(''));
  });

  testWidgets('a server failure explains itself without naming internals', (tester) async {
    await pumpBanner(tester, const ServerFailure());

    final texts = tester.widgetList<Text>(find.byType(Text)).map((t) => t.data ?? '').join(' ');
    expect(texts, isNot(contains('500')));
    expect(texts, isNot(contains('openai')));
    expect(texts.trim(), isNotEmpty);
  });

  testWidgets('every branch offers the same way out', (tester) async {
    for (final failure in const <SuggestionsFailure>[
      ConnectionFailure(),
      TimeoutFailure(),
      RateLimitedFailure(30),
      ValidationFailure({}),
      ServerFailure(),
    ]) {
      var retried = 0;
      await pumpBanner(tester, failure, onRetry: () => retried++);

      await tester.tap(find.byType(OutlinedButton));
      await tester.pump();

      expect(retried, 1, reason: 'retry did not fire for ${failure.runtimeType}');
    }
  });
}
