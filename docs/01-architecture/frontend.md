# Arquitetura do Flutter

**Stack:** Flutter 3.44 · Dart 3.12 · `ChangeNotifier` · `package:http` · sem codegen

Padrão: **Clean Dart** (Flutterando), organizado por módulo/feature.

---

## Estrutura de pastas

```
flutter_app/
├── lib/
│   ├── main.dart                                  carrega os textos, sobe o app
│   ├── app/
│   │   ├── app_widget.dart                        temas e a rota única
│   │   ├── injector.dart                          DI manual — composition root
│   │   └── core/
│   │       ├── config/app_config.dart             lê --dart-define
│   │       ├── config/settings_store.dart         endereço editável em runtime
│   │       ├── drivers/http/i_http_client.dart    INTERFACE nossa (regra R1)
│   │       ├── drivers/http/http_client_adapter.dart   único import de package:http
│   │       ├── result/result.dart                 Result<S, F> selado
│   │       ├── theme/app_colors.dart              tokens da Smash · AppPalette
│   │       ├── theme/app_theme.dart               claro e escuro
│   │       └── widgets/                           section_label · labelled_field
│   │
│   ├── config/internationalization/
│   │   ├── app_localizations.dart                 singleton · tr()
│   │   └── localizations_key.dart                 sealed class L
│   │
│   └── modules/suggestions/
│       ├── domain/
│       │   ├── entities/suggestion.dart
│       │   ├── entities/suggestions_result.dart   degraded · source · reason
│       │   ├── dtos/suggest_request_dto.dart
│       │   ├── errors/suggestions_failure.dart    sealed
│       │   ├── repositories/i_suggestions_repository.dart        PORT
│       │   └── usecases/get_suggestions_usecase.dart
│       ├── infra/
│       │   ├── models/suggestion_model.dart                      extends Entity
│       │   ├── models/suggestions_result_model.dart
│       │   ├── datasources/i_suggestions_datasource.dart         PORT
│       │   └── repositories/suggestions_repository_impl.dart
│       ├── external/
│       │   └── datasources/http_suggestions_datasource.dart
│       └── presenter/
│           ├── pages/suggestions_page.dart                       SÓ compõe
│           ├── stores/suggestions_store.dart                     ChangeNotifier
│           └── widgets/
│               ├── app_header.dart          ├── suggestion_card.dart
│               ├── occasion_field.dart      ├── suggestions_list.dart
│               ├── relationship_field.dart  ├── degraded_banner.dart
│               ├── tone_selector.dart       ├── failure_banner.dart
│               ├── generate_button.dart     ├── loading_skeleton.dart
│               ├── settings_dialog.dart     └── empty_hint.dart
│
├── assets/lang/            en.json · pt.json · es.json
└── test/
    ├── architecture/       22  regras verificadas por máquina
    ├── unit/               44  store · settings · i18n
    ├── widget/             29  cinco estados · camada 4 · layout
    └── live/                4  pilha real contra backend real (pulados por padrão)
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

`SuggestionsStore extends ChangeNotifier`. Um `enum SuggestionsStatus` mais os dados ao
lado — **não** a classe selada que o plano previa.

```dart
enum SuggestionsStatus { idle, loading, success, failure }

class SuggestionsStore extends ChangeNotifier {
  SuggestionsStatus get status;
  SuggestionsResult? get result;      // sobrevive a uma falha de retry
  SuggestionsFailure? get failure;
  Map<String, String> get fieldIssues;   // o que vai sob o campo
  SuggestionsFailure? get bannerFailure; // o que vai no topo
}
```

### Por que a classe selada não sobreviveu ao produto

A ideia era boa e o motivo de abandoná-la é concreto: a tela precisa de coisas que
**atravessam** os estados.

Quando um retry falha, as sugestões anteriores **continuam na tela** — tirar um resultado
utilizável de alguém porque a segunda tentativa falhou seria punir quem tentou de novo. Com
estado selado, `SuggestionsError` teria de carregar as sugestões antigas, e a separação que
a classe prometia já estaria desfeita na primeira exigência real.

O que a selagem entregava de valor — não esquecer um caso — está preservado onde importa:
`SuggestionsFailure` **é** selado, e o `switch` que decide o que o usuário lê é exaustivo.
Um tipo novo de falha não compila até alguém decidir a mensagem.

Registrado como **D71**.

### Por que `ChangeNotifier` e não MobX

Decidido com o usuário. MobX exige `build_runner` e código gerado; para um teste técnico
que o avaliador vai clonar e rodar, um passo a menos entre `git clone` e app na tela vale
mais que a ergonomia. A separação de camadas é idêntica nos dois casos — muda só o
mecanismo de notificação. Registrado como **D14** e confirmado na fase 09.

### Onde o estado **não** fica

Não há `setState` em lugar nenhum da camada de apresentação, e a page é `StatelessWidget`.
Até os `TextEditingController` vivem no store: controller dentro da page é estado que um
teste precisa alcançar atravessando a árvore de widgets.

O único `State` do projeto é o do modal de ajustes, que gerencia o próprio campo de texto e
a própria linha de erro — o que a regra R2 proíbe é widget declarado **dentro de uma page**,
não um diálogo autocontido.

---

## Configuração da URL do backend

```bash
flutter run --dart-define=API_BASE_URL=http://localhost:3000
```

Lido em um lugar só:

```dart
// app/core/config/app_config.dart
static const _defineValue = String.fromEnvironment('API_BASE_URL');

static String get defaultBaseUrl {
  if (kIsWeb) return 'http://localhost:3000';
  return defaultTargetPlatform == TargetPlatform.android
      ? 'http://10.0.2.2:3000'    // o emulador alcança o host aqui
      : 'http://localhost:3000';
}
```

`--dart-define` foi escolhido em vez de arquivo `.env` no app porque o valor é resolvido
em **tempo de compilação**: não vira asset, não é lido em runtime, e não existe risco de
alguém colocar segredo ali achando que está protegido.

**A armadilha do emulador virou código.** Emulador Android não enxerga `localhost` da
máquina host; lá o endereço é `10.0.2.2`. É o motivo de o default ser uma função e não uma
constante — é um erro que custa uma tarde na primeira vez que acontece.

### E editável em runtime, num modal

Um ícone no topo abre um diálogo com o endereço. O `SettingsStore` guarda o valor e o
datasource o resolve **por requisição**, então a mudança vale no próximo toque e não na
próxima execução.

Modal e não segunda rota: o enunciado pede uma tela, e um ajuste que o avaliador toca uma
vez não merece navegação. Não persiste entre execuções — persistência exigiria uma
dependência de storage para um valor que `--dart-define` já fixa em build. O diálogo existe
para o avaliador reapontar um app que já está rodando.

---

## Estados da interface

| Estado | O que o usuário vê | Ações habilitadas |
|---|---|---|
| **Idle** | Formulário e nada fingindo ser resultado | Gerar |
| **Loading** | Botão travado dizendo *Writing…* e três esqueletos do tamanho dos cards | Nenhuma |
| **Success** | 2–3 cards, cada um com copiar e contagem de caracteres | Gerar de novo · Copiar |
| **Degraded** | Aviso **âmbar** e as mensagens | Tentar de novo · Copiar |
| **Error** | Causa, endereço e um botão de retry | Tentar de novo |

Os cinco foram desenhados em mockup e aprovados antes de existir código, e cada um tem
widget test.

**Degradado é âmbar, não vermelho.** O backend responde `200` mesmo quando o LLM falhou;
esconder isso seria mentir por omissão, e pintar de vermelho ensinaria o usuário a
desconfiar de um resultado perfeitamente utilizável.

**Erro tem dois lugares porque são dois problemas.** Campo inválido fica sob o campo, onde
se conserta; servidor inalcançável fica no topo, porque não é sobre nenhum campo. E todo
erro nomeia uma causa **e** uma ação — inclusive o endereço que falhou, porque "não consigo
conectar" sem dizer a quê não dá o que fazer em seguida.

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

**Não é mais "verificável em revisão": é verificada por teste.** Nenhum pacote de HTML,
Markdown, linkify, `url_launcher` ou webview existe no `pubspec`, nenhum símbolo desses
aparece em `lib/`, e payloads reais são renderizados literalmente com a asserção de que
**nenhum ancestral do texto é um `InkWell` ou `GestureDetector`**.

## ADRs relacionados

- [`ADR-0007`](decisions/adr-0007-flutter-clean-dart.md) — Clean Dart, estado e DI
- [`ADR-0009`](decisions/adr-0009-llm-security.md) — camada 4 da defesa
- [`ADR-0010`](decisions/adr-0010-application-security.md) — cleartext HTTP e segredos
