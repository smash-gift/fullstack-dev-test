# Spec — Design técnico do módulo Mobile (Flutter)

- **Data:** 2026-08-12
- **Autor:** `mobile-agent`, seguindo os guardrails de `CLAUDE.md` (raiz) e `mobile/CLAUDE.md`.

## Contexto

Esta spec cobre a primeira implementação funcional do módulo `mobile/`: o fluxo guest completo do
smash-gift (formulário de ocasião + relacionamento → geração de 3 mensagens via backend → escolha →
exibição em um "cartão"), com estados de loading, erro e vazio, além de login Google real (FlutterFire)
e histórico persistido no Firestore para usuários autenticados.

O escopo de produto já está definido em `docs/specs/2026-08-11-meta-structure-design.md`. Esta spec
resolve as decisões técnicas do módulo Mobile que estavam em aberto em `mobile/CLAUDE.md`: gerenciamento
de estado, navegação, injeção de dependência, estrutura de pastas e estratégia de testes.

## Decisões técnicas

### Gerenciamento de estado

**Decisão:** `ChangeNotifier` (nativo do SDK Flutter, `package:flutter/foundation.dart`) combinado com
`ListenableBuilder` (nativo do SDK, sem pacote externo) para reconstruir a UI reativamente.

**Justificativa:** o fluxo funcional desta rodada é linear e pequeno (formulário → opções → cartão), com
apenas um ponto de estado assíncrono relevante (a chamada ao backend para gerar mensagens). Introduzir
Provider/Riverpod/Bloc/Cubit/GetX/MobX para esse escopo seria uma camada arquitetural sem problema
correspondente a resolver — indo contra a diretriz de "não criar abstrações para usos hipotéticos
futuros" do `CLAUDE.md` raiz. `ChangeNotifier` nativo cobre a necessidade (estado de
idle/loading/success/error de uma chamada HTTP) com zero dependências novas e é trivialmente testável.
Se o app crescer (ex.: estado compartilhado entre muitas telas, cache complexo, múltiplas fontes
assíncronas), essa decisão deve ser revisitada em spec própria — não antecipar aqui.

Cada tela com estado assíncrono cria e possui seu próprio controller (`ChangeNotifier`), sem propagação
via `InheritedWidget`/contexto global. Dados já resolvidos (lista de mensagens geradas, mensagem
escolhida) trafegam entre telas como parâmetros de construtor tipados — não há necessidade de estado
compartilhado entre rotas neste fluxo.

### Navegação

**Decisão:** `Navigator` imperativo do Flutter (`Navigator.push` com `MaterialPageRoute`), sem pacote de
roteamento declarativo (`go_router`, `auto_route`).

**Justificativa:** o fluxo principal (guest) é uma pilha linear de 3 telas (`MessageFormScreen` →
`MessageOptionsScreen` → `GiftCardScreen`), sem deep linking, sem rotas nomeadas por URL e sem
necessidade de sincronizar estado de navegação com o sistema operacional além do botão "voltar" padrão
(já coberto pelo `Navigator` nativo). Passagem de dados via construtor tipado (em vez de argumentos de
rota via `Map`/`Object?`) evita erros de cast e mantém o fluxo simples de rastrear. Usuário autenticado
tem um ramo adicional opcional (`MessageFormScreen` → `HistoryScreen`, via `Navigator.push`), que não
muda essa decisão — continua push/pop simples, sem rota nomeada. Reavaliar apenas se o produto crescer
para exigir deep linking real (ex.: abrir um cartão ou uma entrada de histórico específica por link).

### Injeção de dependência

**Decisão:** injeção manual via construtor, sem framework de DI (`get_it`, `injectable` etc.).

**Justificativa:** há poucas dependências para conectar (`AppConfig` → `ApiClient` → `HttpMessageRepository`
→ telas). Essas instâncias são criadas uma vez em `main.dart`/`app.dart` e passadas explicitamente para os
widgets que precisam delas. Isso mantém o grafo de dependências visível e fácil de substituir em teste
(basta passar uma implementação falsa de `MessageRepository`/`AuthService`), sem exigir um container de
DI para um app deste tamanho.

### Estrutura de pastas (`mobile/lib/`)

```
lib/
├── main.dart                         # composition root: tenta Firebase.initializeApp(options:
│                                      # DefaultFirebaseOptions.currentPlatform) (com fallback
│                                      # gracioso), monta config/apiClient/repositórios, chama runApp
├── firebase_options.dart             # gerado por `flutterfire configure` (Android + Web reais;
│                                      # iOS/macOS ainda sem GoogleService-Info.plist — ver seção
│                                      # "Configuração do Firebase")
├── app.dart                          # MaterialApp, tema, tela inicial
├── core/
│   ├── config/
│   │   └── app_config.dart           # AppConfig (base URL da API via --dart-define)
│   ├── network/
│   │   ├── api_client.dart           # client HTTP fino, isolando a integração com o backend
│   │   └── api_exceptions.dart       # NetworkException / ServerException / UnexpectedResponseException
│   └── theme/
│       ├── app_colors.dart           # espelha docs/design/design-tokens.md (cores)
│       ├── app_text_styles.dart      # espelha design-tokens.md (tipografia — Montserrat/Poppins)
│       ├── app_spacing.dart          # espelha design-tokens.md (espaçamento, múltiplos de 4)
│       ├── app_radius.dart           # espelha design-tokens.md (raios de borda)
│       └── app_theme.dart            # ThemeData combinando os tokens acima
├── data/
│   ├── models/
│   │   ├── message_generation_request.dart
│   │   ├── message_generation_result.dart
│   │   └── history_entry.dart            # espelha docs/contracts/firestore-schema.md (history)
│   └── repositories/
│       ├── message_repository.dart       # interface — fonte de mensagens (guest, via backend)
│       ├── http_message_repository.dart  # implementação via ApiClient
│       ├── user_repository.dart          # interface — upsert de perfil (Firestore direto)
│       ├── firestore_user_repository.dart
│       ├── noop_user_repository.dart     # fallback quando o Firebase não inicializa
│       ├── history_repository.dart       # interface — histórico (Firestore direto)
│       ├── firestore_history_repository.dart
│       └── noop_history_repository.dart  # fallback quando o Firebase não inicializa
├── features/
│   ├── message_form/
│   │   ├── constants/form_field_limits.dart  # min/max de caracteres (texto livre)
│   │   ├── controller/message_generation_controller.dart
│   │   ├── screens/message_form_screen.dart
│   │   └── widgets/free_text_field.dart      # campo de texto livre (ocasião/relacionamento)
│   ├── message_options/
│   │   └── screens/message_options_screen.dart   # também grava histórico se autenticado
│   ├── gift_card/
│   │   ├── screens/gift_card_screen.dart
│   │   └── widgets/gift_card_visual.dart
│   ├── history/
│   │   ├── controller/history_controller.dart
│   │   └── screens/history_screen.dart           # lista o histórico do usuário autenticado
│   └── auth/
│       ├── auth_service.dart             # interface + AuthUser + AuthNotAvailableException
│       ├── unavailable_auth_service.dart # fallback usado quando não há projeto Firebase real
│       ├── firebase_auth_service.dart    # implementação real (firebase_auth + google_sign_in)
│       ├── controller/auth_controller.dart   # ChangeNotifier de estado de auth, compartilhado
│       └── widgets/
│           ├── google_sign_in_button.dart
│           └── authenticated_user_bar.dart   # saudação + atalho histórico + logout
└── shared/
    └── widgets/
        ├── primary_button.dart
        ├── error_banner.dart
        └── empty_state_view.dart
```

`test/` espelha essa estrutura (ver seção de testes).

### Estratégia de testes

**Ferramentas:** `flutter_test` (empacotado com o SDK Flutter, sem dependência extra) para testes
unitários e de widget. `package:http` já expõe `http/testing.dart` (`MockClient`), o que evita adicionar
`mockito`/`mocktail` só para simular respostas HTTP. Para o `MessageGenerationController`, os testes usam
uma implementação falsa de `MessageRepository` escrita à mão (interface pequena, sem necessidade de
geração de mocks).

**Organização:** `test/` espelha `lib/` por caminho (`test/data/...`, `test/features/...`), mais
`test/flutter_test_config.dart` na raiz de `test/` (hook padrão do `flutter_test`, fora da estrutura
espelhada) — desativa o carregamento de fontes via rede do `google_fonts`
(`GoogleFonts.config.allowRuntimeFetching = false`) antes de qualquer teste rodar, para a suíte de widget
tests não depender de rede nem virar não-determinística ao buscar Montserrat/Poppins.

**Cobertura mínima:**

- `core/network/api_client.dart`: sucesso (200 decodifica JSON), erro de servidor (status fora de
  2xx → `ServerException`), resposta malformada (`UnexpectedResponseException`), falha de rede
  (`NetworkException`).
- `data/models/message_generation_result.dart`: parsing válido e payload inválido (campo `messages`
  ausente/tipo errado).
- `data/models/history_entry.dart` (`HistoryEntry.fromFirestoreData`): documento válido, campos
  ausentes (fallback para vazio) e `createdAt` nulo (leitura otimista antes do `serverTimestamp()`
  resolver).
- `data/repositories/http_message_repository.dart`: verifica que o path e o corpo enviados correspondem
  ao contrato assumido (`occasion`/`relationship`) e que a resposta é mapeada corretamente.
- `features/message_form/widgets/free_text_field.dart` (`validateFreeText`): valor vazio/em branco,
  limites mínimo (1) e máximo (300) de caracteres, trim antes de validar.
- `features/message_form/controller/message_generation_controller.dart`: transições de estado
  idle → loading → success/error, com mensagens de erro amigáveis por tipo de exceção.
- `features/auth/controller/auth_controller.dart`: estado inicial não autenticado, autenticação +
  upsert de perfil quando `authStateChanges` emite um usuário, `isSigningIn` durante
  `signInWithGoogle()`, erro amigável em `AuthNotAvailableException`, `signOut()` delega ao
  `AuthService` e limpa o usuário atual.
- `features/history/controller/history_controller.dart`: estado inicial `loading`, transição para
  `success` com as entradas do repositório, transição para `error` quando o stream falha.
- Widget tests: `MessageFormScreen` (campos de texto livre, validação de campo vazio, loading,
  navegação em caso de sucesso, banner de erro em caso de falha, snackbar quando o login não está
  disponível, troca para `AuthenticatedUserBar` quando autenticado), `MessageOptionsScreen`
  (renderiza as opções, navega ao tocar, estado vazio quando a lista vier vazia, grava entrada de
  histórico apenas quando há usuário autenticado), `GiftCardScreen` (exibe a mensagem escolhida,
  botão de reinício volta ao início da pilha), `HistoryScreen` (loading, lista preenchida, estado
  vazio, estado de erro).

Não há meta de cobertura percentual definida — o critério é: todo caminho de estado
(loading/success/error/empty) descrito no fluxo guest e no fluxo autenticado tem pelo menos um teste.

As implementações reais de Firestore (`FirestoreUserRepository`, `FirestoreHistoryRepository`) e de
auth (`FirebaseAuthService`) não têm teste automatizado: dependem do SDK real do Firebase/Firestore (ou
de um emulador), que não está disponível neste ambiente. A cobertura de comportamento fica nas
interfaces (`UserRepository`/`HistoryRepository`/`AuthService`) e nos controllers que as consomem,
usando fakes escritos à mão — mesmo padrão usado para `MessageRepository`. Isso deve ser revisitado com
testes de integração (idealmente contra o Firebase Emulator Suite) quando houver ambiente com SDK
Flutter e toolchain adequados.

### Fluxo guest

O caminho guest (sem login) é o caminho principal e não depende de nenhuma autenticação:

1. `MessageFormScreen`: usuário descreve a ocasião e para quem é em dois campos de **texto livre**
   (`FreeTextField`, um `TextFormField` cada) e toca em "Gerar mensagens" (ex.: "aniversário de 15 anos
   da minha afilhada", "minha melhor amiga desde a infância"). Não há lista fixa curada — o formulário
   sempre aceitou texto livre. Validação: 1 a 300 caracteres após `trim()`, espelhando o limite
   documentado em `docs/contracts/api-contracts.md` (`FormFieldLimits`, em
   `features/message_form/constants/form_field_limits.dart`; função de validação isolada e testável em
   `features/message_form/widgets/free_text_field.dart`, `validateFreeText`).
2. O `MessageGenerationController` chama `MessageRepository.generateMessages(...)`. Estado muda para
   `loading` (botão mostra spinner, campos desabilitados).
3. Sucesso → navega para `MessageOptionsScreen` com as 3 mensagens recebidas (mais a ocasião e o
   relacionamento digitados, usados depois para o registro de histórico — ver seção seguinte).
   Erro → banner de erro inline no próprio formulário, com o texto amigável correspondente ao tipo de
   falha (rede vs. servidor vs. resposta inesperada) e o formulário permanece preenchido para nova
   tentativa.
4. `MessageOptionsScreen`: lista as mensagens como cartões selecionáveis. Lista vazia (edge case da API)
   → estado vazio dedicado, com opção de voltar ao formulário.
5. Ao tocar em uma opção, navega para `GiftCardScreen`, que exibe a mensagem escolhida em um cartão com
   direção visual própria (gradiente suave nos tons de marca, tipografia Poppins para o corpo da
   mensagem). Botão "Criar outro cartão" volta ao início da pilha de navegação.

Não há Firebase Anonymous Auth, sessão guest persistida ou estratégia de merge guest→usuário — fora de
escopo, como já determinado em `mobile/CLAUDE.md`.

### Login Google e Firestore

`lib/features/auth/auth_service.dart` define a interface `AuthService` (métodos `signInWithGoogle`,
`signOut`, stream `authStateChanges`) e o modelo `AuthUser` (`uid`, `displayName`, `email`, `photoUrl`).
Duas implementações coexistem:

- `UnavailableAuthService`: fallback gracioso, lança `AuthNotAvailableException` ao tentar logar.
- `FirebaseAuthService`: implementação real via `firebase_auth` + `google_sign_in`. Só deve ser
  instanciada depois de `Firebase.initializeApp()` ter sido bem-sucedido.

**API real do `google_sign_in` usada (pacote na major 7.x — reescrita com breaking change em relação à
6.x, sem construtor público nem `.signIn()`):**

- `GoogleSignIn` é singleton com construtor privado — a única instância acessível é
  `GoogleSignIn.instance`. `FirebaseAuthService` não recebe `GoogleSignIn` por construtor; usa
  `GoogleSignIn.instance` diretamente.
- É obrigatório chamar e aguardar `GoogleSignIn.instance.initialize(...)` exatamente uma vez antes de
  qualquer outro método na instância. `FirebaseAuthService` memoiza essa inicialização em um
  `Future<void>?` **estático** (não por instância, já que `GoogleSignIn.instance` é compartilhado pelo
  processo) e a aguarda antes de `signInWithGoogle()` e de `signOut()`.
- `.signIn()` foi substituído por `.authenticate({List<String> scopeHint})`. Diferença de comportamento
  relevante: `.authenticate()` **lança** `GoogleSignInException` (código
  `GoogleSignInExceptionCode.canceled`) quando o usuário cancela o seletor de contas, em vez de retornar
  `null`. `signInWithGoogle()` captura esse código específico e retorna `null` (preserva o contrato
  público de "cancelamento não é erro"); qualquer outro código é relançado.
- `GoogleSignInAccount.authentication` é síncrono (não mais `Future`) e não expõe mais `accessToken` —
  só `idToken`. Isso é suficiente porque `GoogleAuthProvider.credential` aceita `idToken` sozinho
  (`firebase_auth`/`FirebaseAuth.signInWithCredential` não exige `accessToken`).

`main.dart` chama `Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)` dentro de um
`try/catch`: em caso de sucesso, usa `FirebaseAuthService` + `FirestoreUserRepository` +
`FirestoreHistoryRepository`; em caso de falha, cai de volta em `UnavailableAuthService` +
`NoopUserRepository` + `NoopHistoryRepository`, sem derrubar o app nem o fluxo guest. Com o projeto real
conectado (ver "Configuração do Firebase" abaixo), esse fallback não é mais o caminho esperado em
Android e Web — existe principalmente para iOS/macOS (sem `GoogleService-Info.plist` ainda) e para Linux
desktop (plataforma não suportada por `DefaultFirebaseOptions.currentPlatform`, que lança
`UnsupportedError` nesse caso).

`features/auth/controller/auth_controller.dart` define `AuthController` (`ChangeNotifier`), criado uma
única vez em `main.dart` e passado por construtor para as telas que precisam de estado de auth
(`MessageFormScreen`, `MessageOptionsScreen`, indiretamente `HistoryScreen`) — mesmo padrão de DI manual
já decidido, sem `InheritedWidget`/estado global implícito. Ele assina `AuthService.authStateChanges`,
expõe `currentUser`/`isAuthenticated`/`isSigningIn`/`errorMessage`, e faz o upsert de perfil
(`UserRepository.upsertProfile`) sempre que o stream emite um usuário não nulo.

O botão `GoogleSignInButton` (ação secundária, não bloqueante, na tela de formulário) chama
`AuthController.signInWithGoogle()` e mostra um `SnackBar` com `errorMessage` quando o login falha.
Quando `AuthController.isAuthenticated` é verdadeiro, `MessageFormScreen` substitui esse botão por
`AuthenticatedUserBar` (saudação + atalho para `HistoryScreen` + "Sair").

**Integração direta com o Firestore** (sem passar pelo backend — ver
`docs/contracts/firestore-schema.md`):

- `data/repositories/user_repository.dart` (interface) + `firestore_user_repository.dart`
  (implementação): `upsertProfile` faz `set` com `SetOptions(merge: true)` em `users/{uid}`,
  definindo `createdAt` apenas na primeira escrita (checagem via `get()` antes do `set`) e
  `lastLoginAt` sempre via `FieldValue.serverTimestamp()`.
- `data/repositories/history_repository.dart` (interface) + `firestore_history_repository.dart`
  (implementação): `addEntry` faz `add` (criação apenas) em `users/{uid}/history`; `watchHistory`
  expõe um `Stream<List<HistoryEntry>>` via `.snapshots()` ordenado por `createdAt desc`.
- `MessageOptionsScreen._selectMessage` grava a entrada de histórico de forma "fire-and-forget"
  (`unawaited`) quando há usuário autenticado — não bloqueia a navegação para `GiftCardScreen`, e uma
  falha na gravação é silenciosamente ignorada (o usuário já viu o cartão gerado; não há re-tentativa
  nem feedback de erro para essa gravação em segundo plano).
- `features/history/screens/history_screen.dart` + `features/history/controller/history_controller.dart`:
  tela de listagem (mais recente primeiro) alimentada por `HistoryRepository.watchHistory`, com estados
  de loading/erro/vazio/sucesso, seguindo os tokens de design (cards com ocasião · relacionamento,
  mensagem selecionada e data formatada).

Sem endpoints autenticados no backend ainda (`docs/contracts/api-contracts.md` documenta o middleware
`verifyFirebaseToken` como preparado, mas não aplicado a nenhuma rota), não há necessidade de enviar o
Firebase ID token ao backend — a única integração pós-login é o Firestore direto.

Os pacotes `firebase_core`, `firebase_auth`, `google_sign_in` (^7.x) e `cloud_firestore` estão
declarados em `pubspec.yaml`. `firebase_analytics` e `firebase_crashlytics` continuam declarados para
uso futuro, sem inicialização própria ainda.

### Configuração do Firebase (estado atual)

Projeto real conectado: `flutterfire configure --project=smash-gift-1f87d` foi executado, gerando
`lib/firebase_options.dart` e `android/app/google-services.json`. `main.dart` importa
`firebase_options.dart` e chama `Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)`.

- **Android e Web:** configurados e validados — únicas plataformas com artefato de configuração nativo
  real (`google-services.json` para Android; Web usa as chaves embutidas em `firebase_options.dart`
  diretamente, sem arquivo nativo).
- **iOS e macOS:** pendentes. Não existe `ios/Runner/GoogleService-Info.plist` nem
  `macos/Runner/GoogleService-Info.plist` neste repositório. `firebase_options.dart` inclui, por padrão,
  entradas `ios`/`macos`/`windows` em `DefaultFirebaseOptions` (client IDs derivados do mesmo projeto),
  mas sem o `.plist` nativo essas plataformas não foram validadas e não devem ser consideradas
  configuradas. Resolver rodando `flutterfire configure` incluindo iOS, com Xcode/CocoaPods
  disponíveis.
- O `try/catch` em torno de `Firebase.initializeApp()` em `main.dart` permanece mesmo com o projeto real
  conectado — cobre iOS/macOS (sem config nativa ainda) e Linux desktop (`UnsupportedError` em
  `DefaultFirebaseOptions.currentPlatform`).

### Configuração / variáveis de ambiente

Flutter não lê arquivos `.env` nativamente sem uma dependência adicional. Para não introduzir um pacote
(`flutter_dotenv` ou similar) só para isso, a URL base do backend é lida em tempo de compilação via
`String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:3001')` (mecanismo nativo do
Dart/Flutter, usado com `--dart-define=API_BASE_URL=...` ou `--dart-define-from-file=<arquivo>.json`).
`10.0.2.2` é o alias padrão do emulador Android para o `localhost` da máquina host — um default razoável
de desenvolvimento.

`mobile/.env.example` documenta as chaves esperadas (sem valores reais) e como passá-las via
`--dart-define-from-file`, cobrindo tanto a URL base da API quanto os placeholders de configuração do
Firebase. A configuração do Firebase em si não é lida via `--dart-define` — vem de
`lib/firebase_options.dart` (gerado por `flutterfire configure`) e dos arquivos nativos de cada
plataforma (`google-services.json`, `GoogleService-Info.plist`), conforme "Configuração do Firebase"
acima. As chaves em `.env.example` continuam documentadas apenas como referência do formato esperado —
não são a fonte real de configuração do Firebase em nenhuma plataforma.

### Contrato de API

`docs/contracts/api-contracts.md` documenta o endpoint real, confirmado pelo `backend-agent` e
reconciliado pelo orquestrador:

- **Path:** `POST /messages`.
- **Request:** `{"occasion": string, "relationship": string}`, texto livre de 1 a 300 caracteres após
  trim — sem enum fixo.
- **Response de sucesso:** `{"messages": string[]}`.
- **Erros:** o contrato define o formato `{"error": {"code", "message", "details"?}}`, com os códigos
  `VALIDATION_ERROR` (400), `RATE_LIMITED` (429), `OPENAI_UPSTREAM_ERROR`/`OPENAI_INVALID_RESPONSE`
  (502) e `INTERNAL_ERROR` (500). `ApiClient._serverExceptionFor` (em `core/network/api_client.dart`)
  já faz esse parsing, com fallback para `ServerException` genérico quando o corpo não bate com o
  formato esperado.

Toda a chamada HTTP fica isolada em `core/network/api_client.dart` + `data/repositories/http_message_repository.dart`
justamente para que o path, o formato de erro ou pequenos ajustes de payload possam ser corrigidos em um
único lugar quando o contrato mudar.

### Design visual

Os tokens de `docs/design/design-tokens.md` foram usados como estão (cores, escala tipográfica
Montserrat/Poppins, espaçamento múltiplo de 4, raios `8/12/16/9999`, altura mínima de 56px para inputs e
botões principais). Nenhum token novo foi necessário para esta implementação. A fonte é carregada via
`google_fonts` (pacote oficial do Flutter/Dart, mantém Montserrat/Poppins sem vendorizar arquivos de
fonte binários no repositório).

O único elemento de composição não descrito literalmente pelos tokens é o gradiente suave usado como
fundo do `GiftCardVisual` (interpolação entre `color.brand.secondary` e `color.background.brandSoft`,
ambos já tokens existentes) — não é um valor novo, é uma composição dos tokens existentes, então não
requer proposta de novo token.

### Ambiente de build (Windows)

`android/gradle.properties` define `kotlin.incremental=false`, com comentário explicando o motivo:
workaround para um bug conhecido do Kotlin/Gradle no Windows em que o cache incremental do compilador
Kotlin falha ao calcular caminhos relativos entre arquivos quando o repositório e o pub cache do Dart
vivem em unidades de disco diferentes (`D:\Code\smash-gift` vs. `C:\Users\...\Pub\Cache` neste ambiente).
É uma decisão de ambiente de build, não de produto ou arquitetura — a alternativa (não aplicada) seria
mover o projeto ou o pub cache para a mesma unidade de disco.

## Fora de escopo (mantido conforme `mobile/CLAUDE.md`)

- Firebase Anonymous Auth, sessão guest persistida, merge guest→usuário.
- Favoritos e preferências separados do histórico (histórico já implementado — ver
  `docs/contracts/firestore-schema.md`, seção "Fora de escopo").
- Envio do Firebase ID token ao backend (não há endpoint autenticado documentado ainda em
  `docs/contracts/api-contracts.md` que precise dele).
- Analytics/Crashlytics inicializados de fato (pacotes declarados, sem uso ainda).
- Qualquer state management/DI/roteamento além do decidido acima.
- Definição do formato global de erro do backend.
- Testes de integração de `FirestoreUserRepository`/`FirestoreHistoryRepository`/`FirebaseAuthService`
  contra um projeto real ou o Firebase Emulator Suite (bloqueado pela ausência de ambiente adequado —
  ver seção de testes).
