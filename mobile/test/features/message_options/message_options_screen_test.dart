import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smash_gift/core/network/api_exceptions.dart';
import 'package:smash_gift/data/models/history_entry.dart';
import 'package:smash_gift/data/models/message_generation_request.dart';
import 'package:smash_gift/data/models/message_generation_result.dart';
import 'package:smash_gift/data/repositories/history_repository.dart';
import 'package:smash_gift/data/repositories/message_repository.dart';
import 'package:smash_gift/data/repositories/user_repository.dart';
import 'package:smash_gift/features/auth/auth_service.dart';
import 'package:smash_gift/features/auth/controller/auth_controller.dart';
import 'package:smash_gift/features/gift_card/screens/gift_card_screen.dart';
import 'package:smash_gift/features/message_options/screens/message_options_screen.dart';
import 'package:smash_gift/shared/widgets/error_banner.dart';

class _FakeAuthService implements AuthService {
  _FakeAuthService({this.initialUser});

  final AuthUser? initialUser;

  @override
  bool get isAvailable => true;

  @override
  Stream<AuthUser?> get authStateChanges => Stream<AuthUser?>.value(initialUser);

  @override
  Future<AuthUser?> signInWithGoogle() async => initialUser;

  @override
  Future<void> signOut() async {}
}

class _FakeUserRepository implements UserRepository {
  @override
  Future<void> upsertProfile({
    required String uid,
    String? displayName,
    String? email,
    String? photoUrl,
  }) async {}
}

class _FakeHistoryRepository implements HistoryRepository {
  final List<Map<String, dynamic>> addedEntries = [];

  @override
  Future<void> addEntry({
    required String uid,
    required String occasion,
    required String relationship,
    required List<String> messageOptions,
    required String selectedMessage,
  }) async {
    addedEntries.add({
      'uid': uid,
      'occasion': occasion,
      'relationship': relationship,
      'messageOptions': messageOptions,
      'selectedMessage': selectedMessage,
    });
  }

  @override
  Stream<List<HistoryEntry>> watchHistory(String uid) => const Stream.empty();
}

/// Repositório de geração falso, escrito à mão, sem depender de mockito/mocktail — mesmo padrão
/// de `message_generation_controller_test.dart`.
class _FakeMessageRepository implements MessageRepository {
  _FakeMessageRepository({this.result, this.error});

  final MessageGenerationResult? result;
  final Object? error;
  MessageGenerationRequest? lastRequest;

  @override
  Future<MessageGenerationResult> generateMessages(MessageGenerationRequest request) async {
    lastRequest = request;
    if (error != null) throw error!;
    return result!;
  }
}

void main() {
  testWidgets('renders each message option and navigates to the gift card on tap',
      (tester) async {
    final authController = AuthController(_FakeAuthService(), _FakeUserRepository());

    await tester.pumpWidget(
      MaterialApp(
        home: MessageOptionsScreen(
          messages: const ['Mensagem A', 'Mensagem B', 'Mensagem C'],
          occasion: 'aniversário',
          relationship: 'mãe',
          authController: authController,
          historyRepository: _FakeHistoryRepository(),
          repository: _FakeMessageRepository(
            result: const MessageGenerationResult(messages: []),
          ),
        ),
      ),
    );

    expect(find.text('Mensagem A'), findsOneWidget);
    expect(find.text('Mensagem B'), findsOneWidget);
    expect(find.text('Mensagem C'), findsOneWidget);

    await tester.tap(find.text('Mensagem B'));
    await tester.pumpAndSettle();

    expect(find.byType(GiftCardScreen), findsOneWidget);
    expect(find.text('Mensagem B'), findsOneWidget);
  });

  testWidgets('shows an empty state when there are no messages', (tester) async {
    final authController = AuthController(_FakeAuthService(), _FakeUserRepository());

    await tester.pumpWidget(
      MaterialApp(
        home: MessageOptionsScreen(
          messages: const [],
          occasion: 'aniversário',
          relationship: 'mãe',
          authController: authController,
          historyRepository: _FakeHistoryRepository(),
          repository: _FakeMessageRepository(
            result: const MessageGenerationResult(messages: []),
          ),
        ),
      ),
    );

    expect(find.text('Nenhuma opção foi gerada'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Voltar'), findsOneWidget);
  });

  testWidgets('does not write history when the user is a guest (not authenticated)',
      (tester) async {
    final authController = AuthController(_FakeAuthService(), _FakeUserRepository());
    final historyRepository = _FakeHistoryRepository();

    await tester.pumpWidget(
      MaterialApp(
        home: MessageOptionsScreen(
          messages: const ['Mensagem A'],
          occasion: 'aniversário',
          relationship: 'mãe',
          authController: authController,
          historyRepository: historyRepository,
          repository: _FakeMessageRepository(
            result: const MessageGenerationResult(messages: []),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Mensagem A'));
    await tester.pumpAndSettle();

    expect(historyRepository.addedEntries, isEmpty);
  });

  testWidgets('writes a history entry when an authenticated user selects a message',
      (tester) async {
    const user = AuthUser(uid: 'uid-1', displayName: 'Ana');
    final authController = AuthController(
      _FakeAuthService(initialUser: user),
      _FakeUserRepository(),
    );
    final historyRepository = _FakeHistoryRepository();

    await tester.pumpWidget(
      MaterialApp(
        home: MessageOptionsScreen(
          messages: const ['Mensagem A', 'Mensagem B'],
          occasion: 'aniversário de 15 anos',
          relationship: 'afilhada',
          authController: authController,
          historyRepository: historyRepository,
          repository: _FakeMessageRepository(
            result: const MessageGenerationResult(messages: []),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Mensagem B'));
    await tester.pumpAndSettle();

    expect(historyRepository.addedEntries, hasLength(1));
    expect(historyRepository.addedEntries.single, {
      'uid': 'uid-1',
      'occasion': 'aniversário de 15 anos',
      'relationship': 'afilhada',
      'messageOptions': ['Mensagem A', 'Mensagem B'],
      'selectedMessage': 'Mensagem B',
    });
  });

  testWidgets(
      'tapping "Gerar outras opções" calls the repository with regenerate: true and the same occasion/relationship',
      (tester) async {
    final authController = AuthController(_FakeAuthService(), _FakeUserRepository());
    final repository = _FakeMessageRepository(
      result: const MessageGenerationResult(messages: ['Nova A', 'Nova B', 'Nova C']),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: MessageOptionsScreen(
          messages: const ['Mensagem A', 'Mensagem B', 'Mensagem C'],
          occasion: 'aniversário',
          relationship: 'mãe',
          authController: authController,
          historyRepository: _FakeHistoryRepository(),
          repository: repository,
        ),
      ),
    );

    await tester.tap(find.text('Gerar outras opções'));
    await tester.pumpAndSettle();

    expect(
      repository.lastRequest,
      isA<MessageGenerationRequest>()
          .having((r) => r.occasion, 'occasion', 'aniversário')
          .having((r) => r.relationship, 'relationship', 'mãe')
          .having((r) => r.regenerate, 'regenerate', true),
    );
  });

  testWidgets('updates the displayed messages when regeneration succeeds', (tester) async {
    final authController = AuthController(_FakeAuthService(), _FakeUserRepository());
    final repository = _FakeMessageRepository(
      result: const MessageGenerationResult(messages: ['Nova A', 'Nova B', 'Nova C']),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: MessageOptionsScreen(
          messages: const ['Mensagem A', 'Mensagem B', 'Mensagem C'],
          occasion: 'aniversário',
          relationship: 'mãe',
          authController: authController,
          historyRepository: _FakeHistoryRepository(),
          repository: repository,
        ),
      ),
    );

    await tester.tap(find.text('Gerar outras opções'));
    await tester.pumpAndSettle();

    expect(find.text('Nova A'), findsOneWidget);
    expect(find.text('Nova B'), findsOneWidget);
    expect(find.text('Nova C'), findsOneWidget);
    expect(find.text('Mensagem A'), findsNothing);
    expect(find.text('Mensagem B'), findsNothing);
    expect(find.text('Mensagem C'), findsNothing);
  });

  testWidgets(
      'shows an ErrorBanner and keeps the old messages visible and selectable when regeneration fails',
      (tester) async {
    final authController = AuthController(_FakeAuthService(), _FakeUserRepository());
    final repository = _FakeMessageRepository(error: const UnexpectedResponseException());

    await tester.pumpWidget(
      MaterialApp(
        home: MessageOptionsScreen(
          messages: const ['Mensagem A', 'Mensagem B'],
          occasion: 'aniversário',
          relationship: 'mãe',
          authController: authController,
          historyRepository: _FakeHistoryRepository(),
          repository: repository,
        ),
      ),
    );

    await tester.tap(find.text('Gerar outras opções'));
    await tester.pumpAndSettle();

    expect(find.byType(ErrorBanner), findsOneWidget);
    expect(find.text('Mensagem A'), findsOneWidget);
    expect(find.text('Mensagem B'), findsOneWidget);

    await tester.tap(find.text('Mensagem A'));
    await tester.pumpAndSettle();

    expect(find.byType(GiftCardScreen), findsOneWidget);
  });
}
