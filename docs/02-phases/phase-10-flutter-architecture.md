# Fase 10 — Arquitetura Flutter

**Status:** ⬜ pendente · **Checklist:** item 10

## Objetivo

Reorganizar a tela funcional da fase 09 nas quatro camadas de Clean Dart, cumprindo o
requisito explícito do enunciado:

> *"Organize the project so that **UI, API client, and state are clearly separated**."*

## Tasks

- [ ] Separar UI em widgets, um por arquivo (regra R2)
- [ ] Extrair o estado para `SuggestionsStore` (`ChangeNotifier`)
- [ ] Criar o port `SuggestionsRepository` no domain
- [ ] Criar `SuggestionsRepositoryImpl` no infra
- [ ] Criar o port `SuggestionsDatasource` no infra
- [ ] Criar `HttpSuggestionsDatasource` no external
- [ ] Criar `IHttpClient` + `HttpClientAdapter` (regra R1)
- [ ] Criar Entities e Models (regra R3)
- [ ] Criar o DTO de request
- [ ] Criar `GetSuggestionsUseCase`
- [ ] Criar `AppConfig` lendo `--dart-define`
- [ ] Criar `injector.dart`

## As três regras, aplicadas

### R1 — `package:http` só em um arquivo

```
domain / infra / presenter  →  IHttpClient
                                    ↑
                     HttpClientAdapter  ← único import de package:http
```

Ganho concreto e imediato: o widget test da fase 13 injeta um `IHttpClient` falso. Sem
isso, seria preciso subir servidor ou usar `HttpOverrides`, e o teste ficaria lento e
instável.

### R2 — zero widget dentro de page

`suggestions_page.dart` **compõe**: instancia o store, escuta e monta widgets já
extraídos. Proibido `class _Algo extends StatelessWidget` e método `Widget _buildAlgo()`
dentro da page.

```
presenter/widgets/
├── occasion_field.dart      ├── suggestion_card.dart
├── relationship_field.dart  ├── suggestions_list.dart
├── generate_button.dart     ├── degraded_banner.dart
├── loading_view.dart        ├── error_view.dart
└── empty_view.dart
```

Consequência prática: cada estado da tela é testável isoladamente.

### R3 — Entity vem, DTO vai

| | Direção | `fromJson` | `toJson` |
|---|---|---|---|
| `SuggestionEntity` | ← backend | ❌ | ❌ |
| `SuggestionModel extends SuggestionEntity` | ← backend | ✅ | ❌ |
| `SuggestRequestDto` | → backend | ❌ | ✅ |

```dart
// assim
Future<Result> call(SuggestRequestDto request);

// não assim
Future<Result> call(String occasion, String relationship);
```

Com DTO, adicionar `tone` é mudar uma classe. Com campos soltos, é mudar toda assinatura
na cadeia inteira.

## Mapeamento da resposta

A resposta do backend traz `degraded` e `source`. O model precisa preservá-los até o
store, senão a interface não tem como avisar o usuário de que o conteúdo é degradado — e
a honestidade do `200` combinada com `degraded: true` se perderia justamente na última
etapa. Ver [`ADR-0003`](../01-architecture/decisions/adr-0003-fallback-strategy.md).

## Injeção de dependência

```dart
// app/injector.dart — composition root, lido de cima para baixo
final httpClient = HttpClientAdapter(http.Client());
final datasource = HttpSuggestionsDatasource(httpClient, AppConfig.apiBaseUrl);
final repository = SuggestionsRepositoryImpl(datasource);
final usecase    = GetSuggestionsUseCase(repository);
final store      = SuggestionsStore(usecase);
```

Sem `flutter_modular`: um módulo, uma tela. Justificativa em
[`ADR-0007`](../01-architecture/decisions/adr-0007-flutter-clean-dart.md).

## Critério de pronto

- [ ] `grep -rn "package:http" lib/` retorna **apenas** `http_client_adapter.dart`
- [ ] Nenhuma page declara widget interno nem tem método `_buildX()`
- [ ] Nenhuma Entity tem `toJson`; nenhum DTO tem `fromJson`
- [ ] O store não importa nada de `infra/` nem de `external/`
- [ ] `AppConfig.apiBaseUrl` lê `--dart-define` com default correto
- [ ] `flutter analyze` limpo
- [ ] App continua funcionando exatamente como na fase 09

## Riscos

| Risco | Mitigação |
|---|---|
| Refatoração quebrar o que funcionava | Fase 09 validou o comportamento; a fase 10 não muda comportamento |
| Camadas viram cerimônia vazia | Cada camada tem responsabilidade verificável por grep |
| `degraded` se perder no mapeamento | Item explícito do critério de pronto e do teste da fase 13 |
