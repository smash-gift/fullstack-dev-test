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
import 'package:smash_gift/features/message_form/screens/message_form_screen.dart';
import 'package:smash_gift/features/message_options/screens/message_options_screen.dart';

class _ScriptedMessageRepository implements MessageRepository {
  _ScriptedMessageRepository({this.result, this.error, this.delay});

  final MessageGenerationResult? result;
  final Object? error;
  final Duration? delay;

  @override
  Future<MessageGenerationResult> generateMessages(MessageGenerationRequest request) async {
    if (delay != null) await Future<void>.delayed(delay!);
    if (error != null) throw error!;
    return result!;
  }
}

/// [AuthService] falso escrito à mão, sem depender de mockito/mocktail — ver estratégia de testes
/// na spec técnica do mobile. `authStateChanges` emite [initialUser] uma única vez (comportamento
/// suficiente para os cenários desta tela).
class _FakeAuthService implements AuthService {
  _FakeAuthService({this.initialUser});

  final AuthUser? initialUser;

  @override
  bool get isAvailable => false;

  @override
  Stream<AuthUser?> get authStateChanges => Stream<AuthUser?>.value(initialUser);

  @override
  Future<AuthUser?> signInWithGoogle() {
    throw const AuthNotAvailableException();
  }

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
  @override
  Future<void> addEntry({
    required String uid,
    required String occasion,
    required String relationship,
    required List<String> messageOptions,
    required String selectedMessage,
  }) async {}

  @override
  Stream<List<HistoryEntry>> watchHistory(String uid) => const Stream.empty();
}

void main() {
  Widget buildApp(MessageRepository repository, {AuthUser? authenticatedUser}) {
    final authController = AuthController(
      _FakeAuthService(initialUser: authenticatedUser),
      _FakeUserRepository(),
    );
    return MaterialApp(
      home: MessageFormScreen(
        repository: repository,
        authController: authController,
        historyRepository: _FakeHistoryRepository(),
      ),
    );
  }

  testWidgets('renders the form with both free text fields and the submit button',
      (tester) async {
    await tester.pumpWidget(
      buildApp(_ScriptedMessageRepository(result: const MessageGenerationResult(messages: []))),
    );

    expect(find.text('smash-gift'), findsOneWidget);
    expect(find.text('Ocasião'), findsOneWidget);
    expect(find.text('Para quem é'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Gerar mensagens'), findsOneWidget);
  });

  testWidgets('shows a validation message when submitting with empty fields', (tester) async {
    await tester.pumpWidget(
      buildApp(_ScriptedMessageRepository(result: const MessageGenerationResult(messages: []))),
    );

    await tester.tap(find.widgetWithText(ElevatedButton, 'Gerar mensagens'));
    await tester.pumpAndSettle();

    expect(find.text('Conte pra gente com suas palavras.'), findsNWidgets(2));
  });

  testWidgets('shows a loading indicator while generating and navigates on success',
      (tester) async {
    final repository = _ScriptedMessageRepository(
      result: const MessageGenerationResult(messages: ['Mensagem 1', 'Mensagem 2', 'Mensagem 3']),
      delay: const Duration(milliseconds: 50),
    );

    await tester.pumpWidget(buildApp(repository));

    final fields = find.byType(TextFormField);
    await tester.enterText(fields.at(0), 'aniversário de 15 anos da minha afilhada');
    await tester.enterText(fields.at(1), 'minha afilhada');

    await tester.tap(find.widgetWithText(ElevatedButton, 'Gerar mensagens'));
    await tester.pump();

    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await tester.pumpAndSettle();

    expect(find.byType(MessageOptionsScreen), findsOneWidget);
    expect(find.text('Mensagem 1'), findsOneWidget);
    expect(find.text('Mensagem 2'), findsOneWidget);
    expect(find.text('Mensagem 3'), findsOneWidget);
  });

  testWidgets('shows an error banner when the backend call fails', (tester) async {
    final repository = _ScriptedMessageRepository(error: const UnexpectedResponseException());

    await tester.pumpWidget(buildApp(repository));

    final fields = find.byType(TextFormField);
    await tester.enterText(fields.at(0), 'aniversário');
    await tester.enterText(fields.at(1), 'minha mãe');

    await tester.tap(find.widgetWithText(ElevatedButton, 'Gerar mensagens'));
    await tester.pumpAndSettle();

    expect(find.text('Recebemos uma resposta inesperada. Tente novamente.'), findsOneWidget);
    expect(find.byType(MessageOptionsScreen), findsNothing);
  });

  testWidgets('shows a snackbar when Google sign-in is not available', (tester) async {
    await tester.pumpWidget(
      buildApp(_ScriptedMessageRepository(result: const MessageGenerationResult(messages: []))),
    );

    await tester.tap(find.widgetWithText(TextButton, 'Entrar com Google'));
    await tester.pumpAndSettle();

    expect(find.text('Login com Google ainda não está disponível nesta versão.'), findsOneWidget);
  });

  testWidgets('shows the authenticated user bar instead of the sign-in button when logged in',
      (tester) async {
    await tester.pumpWidget(
      buildApp(
        _ScriptedMessageRepository(result: const MessageGenerationResult(messages: [])),
        authenticatedUser: const AuthUser(uid: 'uid-1', displayName: 'Ana'),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining('Olá, Ana'), findsOneWidget);
    expect(find.widgetWithText(TextButton, 'Histórico'), findsOneWidget);
    expect(find.widgetWithText(TextButton, 'Sair'), findsOneWidget);
    expect(find.widgetWithText(TextButton, 'Entrar com Google'), findsNothing);
  });
}
