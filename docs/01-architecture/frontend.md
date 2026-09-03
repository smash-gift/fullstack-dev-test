# Arquitetura do Flutter

**Stack:** Flutter 3.44 · Dart 3.12 · `ChangeNotifier` · `package:http` · sem codegen

Padrão: **Clean Dart** (Flutterando), organizado por módulo/feature.

---

## Estrutura de pastas

```
flutter_app/
├── lib/
│   ├── main.dart
│   ├── app/
│   │   ├── app_widget.dart
│   │   ├── injector.dart                    # DI manual — composition root
│   │   └── core/
│   │       ├── config/app_config.dart       # lê --dart-define
│   │       ├── http/
│   │       │   ├── http_client.dart         # INTERFACE nossa (regra R1)
│   │       │   ├── http_response.dart
│   │       │   └── http_exceptions.dart
│   │       ├── theme/app_theme.dart
│   │       └── widgets/                     # widgets globais reutilizáveis
│   │
│   └── modules/
│       └── suggestions/
│           ├── domain/
│           │   ├── entities/suggestion_entity.dart
│           │   ├── dtos/suggest_request_dto.dart
│           │   ├── repositories/suggestions_repository.dart      # PORT
│           │   ├── usecases/get_suggestions_usecase.dart
│           │   └── errors/suggestions_errors.dart
│           ├── infra/
│           │   ├── models/suggestion_model.dart                  # extends Entity
│           │   ├── models/suggestions_response_model.dart
│           │   ├── datasources/suggestions_datasource.dart       # PORT
│           │   └── repositories/suggestions_repository_impl.dart
│           ├── external/
│           │   └── datasources/http_suggestions_datasource.dart
│           └── presenter/
│               ├── pages/suggestions_page.dart                   # SÓ compõe
│               ├── controllers/suggestions_store.dart
│               ├── states/suggestions_state.dart
│               └── widgets/
│                   ├── occasion_field.dart
│                   ├── relationship_field.dart
│                   ├── generate_button.dart
│                   ├── suggestion_card.dart
│                   ├── suggestions_list.dart
│                   ├── degraded_banner.dart
│                   ├── loading_view.dart
│                   ├── error_view.dart
│                   └── empty_view.dart
└── test/
```

---

## As três regras de arquitetura, e como são cumpridas

### R1 — Todo pacote externo substituível fica atrás de abstração nossa

Nenhum arquivo fora de `app/core/http/` importa `package:http`.

```
domain / infra / presenter  →  IHttpClient (interface nossa)
                                     ↑
                       HttpClientAdapter (único lugar que importa package:http)
```

**Por que isso importa aqui, concretamente:** trocar `http` por `dio` — ou plugar um
interceptor de retry, um logger de request, ou um mock em teste — é editar **um arquivo**.
Sem isso, seria um *find-and-replace* por todo o app, e o teste de widget precisaria de um
servidor HTTP real de pé.

### R2 — Zero widget declarado dentro de page

`suggestions_page.dart` **compõe**: instancia o store, escuta mudanças e monta widgets já
extraídos. Não existe `class _AlgumaCoisa extends StatelessWidget` nem método
`Widget _buildAlgo()` dentro da page. Cada responsabilidade visual é um arquivo em
`presenter/widgets/`.

**Consequência prática:** cada estado da tela (`loading_view`, `error_view`,
`empty_view`, `suggestions_list`) é testável isoladamente, sem montar a tela inteira.

### R3 — Entity vem do backend, DTO vai para o backend

| | Direção | `fromJson` | `toJson` | Onde |
|---|---|---|---|---|
| `SuggestionEntity` | backend → app | ❌ (fica no Model) | ❌ | `domain/entities/` |
| `SuggestionModel extends SuggestionEntity` | backend → app | ✅ | ❌ | `infra/models/` |
| `SuggestRequestDto` | app → backend | ❌ | ✅ | `domain/dtos/` |

O use case recebe **um DTO**, nunca campos soltos:

```dart
// assim
Future<Result> call(SuggestRequestDto request);

// não assim
Future<Result> call(String occasion, String relationship);
```

---

## Gerenciamento de estado

`SuggestionsStore extends ChangeNotifier`, com estado modelado por classe selada:

```dart
sealed class SuggestionsState {}

class SuggestionsIdle    extends SuggestionsState {}
class SuggestionsLoading extends SuggestionsState {}
class SuggestionsSuccess extends SuggestionsState {
  final List<SuggestionEntity> suggestions;
  final bool degraded;          // true = veio do fallback do backend
}
class SuggestionsError   extends SuggestionsState {
  final String message;         // já traduzido para linguagem de usuário
  final bool canRetry;
}
```

**Por que classe selada e não booleanos soltos.** Com `isLoading` + `hasError` +
`suggestions` convivendo, existem combinações impossíveis representáveis — *loading* e
*error* verdadeiros ao mesmo tempo, por exemplo. Com estado selado, o `switch` no widget
é exaustivo e o compilador reclama se um caso novo for esquecido. Estado ilegal deixa de
ser representável.

**Por que `ChangeNotifier` e não MobX.** MobX é o padrão pessoal do desenvolvedor, mas
exige `build_runner` e código gerado. Para um teste técnico que o avaliador vai clonar e
rodar, um passo a menos entre `git clone` e app na tela vale mais que a ergonomia do MobX.
A separação de camadas é idêntica nos dois casos — o que muda é só o mecanismo de
notificação. Registrado como decisão **D14**.

---

## Configuração da URL do backend

```bash
flutter run --dart-define=API_BASE_URL=http://localhost:3000
```

Lido em um lugar só:

```dart
// app/core/config/app_config.dart
class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );
}
```

`--dart-define` foi escolhido em vez de arquivo `.env` no app porque o valor é resolvido
em **tempo de compilação**: não vira asset, não é lido em runtime, e não existe risco de
alguém colocar segredo ali achando que está protegido.

**Armadilha documentada:** emulador Android não enxerga `localhost` da máquina host — o
endereço correto lá é `10.0.2.2`. Está em
[`../04-operations/running-locally.md`](../04-operations/running-locally.md).

---

## Estados da interface

| Estado | O que o usuário vê | Ações habilitadas |
|---|---|---|
| **Idle** | Formulário + texto orientando o que fazer | Gerar (se o formulário estiver válido) |
| **Loading** | Indicador de progresso | Nenhuma — botão desabilitado |
| **Success** | 2–3 cards com as sugestões, cada um copiável | Gerar de novo · Copiar |
| **Success + degraded** | Idem, com aviso honesto de qualidade reduzida | Gerar de novo · Tentar novamente |
| **Error** | Mensagem clara + botão "Tentar novamente" | Tentar novamente |

O banner de *degraded* existe por uma razão de produto: o backend responde `200` mesmo
quando o LLM falhou, e esconder isso do usuário seria mentir por omissão. O aviso é
discreto — não bloqueia, não assusta — mas está lá.

---

## Regra de renderização segura

O texto de sugestão vem de um LLM cuja saída é influenciável por quem digita no formulário.
Regra do projeto, verificável em revisão:

> Sugestão é renderizada **exclusivamente** com `Text`.
> **Proibido** `flutter_html`, `flutter_markdown` ou qualquer widget que interprete
> marcação — para este conteúdo. **Sem `linkify`.**

O backend já rejeita URL e HTML na saída do modelo
([camada 3](../05-security/llm-security.md)). Renderizar como texto puro é a segunda
camada: se um padrão escapar do guard, ele é **exibido**, não executado nem clicável.
Importa especialmente no Flutter Web, onde a fronteira com o DOM existe de fato.

## ADRs relacionados

- [`ADR-0007`](decisions/adr-0007-flutter-clean-dart.md) — Clean Dart, estado e DI
- [`ADR-0009`](decisions/adr-0009-llm-security.md) — camada 4 da defesa
- [`ADR-0010`](decisions/adr-0010-application-security.md) — cleartext HTTP e segredos
