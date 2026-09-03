# Fase 10 — Arquitetura Flutter

**Status:** ✅ concluída · **Checklist:** item 10

## Objetivo

Cumprir o requisito explícito do enunciado:

> *"Organize the project so that **UI, API client, and state are clearly separated**."*

A [fase 09](phase-09-flutter-app.md) já nasceu nas camadas, então esta fase deixou de ser
uma refatoração. O que ela entrega é o que impede a separação de se desfazer: **22 testes
estáticos** que falham quando uma regra é violada.

## As camadas

```
lib/
├── main.dart                            carrega os textos e sobe o app
├── app/
│   ├── injector.dart                    composition root — o grafo inteiro em 15 linhas
│   ├── app_widget.dart                  temas e a rota única
│   └── core/
│       ├── config/                      AppConfig · SettingsStore
│       ├── drivers/http/                IHttpClient + o único adapter
│       ├── result/                      Result<S, F>
│       ├── theme/                       tokens da Smash · AppPalette
│       └── widgets/                     widgets globais
├── config/internationalization/         tr() · sealed class L
└── modules/suggestions/
    ├── domain/        entities · dtos · errors · repositories · usecases
    ├── infra/         models · datasources (contrato) · repositories (impl)
    ├── external/      datasources (impl HTTP)
    └── presenter/     pages · widgets · stores
```

Fluxo: `external → infra → domain ← presenter`

## As três regras, e o teste de cada uma

### R1 — `package:http` alcançável de um arquivo

```
domain / infra / presenter  →  IHttpClient
                                    ↑
                     HttpClientAdapter  ← único import de package:http
```

O ganho é imediato e mensurável: **os 95 testes offline rodam em 3 segundos** porque o
duplo de `IHttpClient` substitui a rede inteira. Sem isso seria subir servidor ou usar
`HttpOverrides`, e a suíte ficaria lenta e instável.

O teste permite duas ocorrências — o adapter e o `injector.dart`, que é o único lugar
autorizado a instanciar coisas concretas.

### R2 — zero widget dentro de page

`suggestions_page.dart` **só compõe**. Não declara classe de widget, não tem
`Widget _buildAlgo()`, não chama `setState`. O que sobra é o arranjo, que é a única coisa
para a qual uma page serve.

Consequência prática: cada estado da tela é testável isoladamente, e foi assim que os
cinco testes de estado da [fase 11](phase-11-ui-states.md) ficaram curtos.

### R3 — Entity vem, DTO vai

| | Direção | `fromJson` | `toJson` |
|---|---|---|---|
| `Suggestion` | ← backend | ❌ | ❌ |
| `SuggestionModel extends Suggestion` | ← backend | ✅ | ❌ |
| `SuggestRequestDto` | → backend | ❌ | ✅ |

O use case recebe **um DTO**, nunca campos soltos. Acrescentar `tone` foi mudar uma classe,
não editar a assinatura em quatro camadas — o que aconteceu de verdade nesta entrega.

## O teste que estava lendo prosa em vez de código

Quatro das 22 regras falharam na primeira execução. Não por violação: por baterem em
**comentários do próprio projeto**.

| Regra | O que ela encontrou |
|---|---|
| "nenhuma entity tem `toJson`" | o comentário que diz *"não tem `toJson`"* |
| "nenhum DTO tem `fromJson`" | o comentário que diz *"não tem `fromJson`"* |
| "release não permite cleartext" | o comentário *"note o que NÃO está aqui: usesCleartextTraffic"* |
| "só um arquivo importa `package:http`" | o comentário da interface explicando a regra |

Uma regra sobre o que o código **faz** tem de ler o código, não a prosa em volta. As
verificações passaram a rodar sobre o fonte com comentários removidos.

## Verificadas contra violação real

Regra estática que nunca falha é decoração. Dois arquivos-sonda foram plantados de
propósito — um com `import 'package:http'`, `toJson`, uma chave falsa e `apiKey` dentro de
`domain/entities/`, outro com uma page declarando widget interno, `setState` e `_buildX()`.

**Oito testes falharam.** Todos voltaram a passar quando as sondas saíram.

## Injeção de dependência

```dart
final settings   = SettingsStore();
final httpClient = HttpClientAdapter(http.Client());
final datasource = HttpSuggestionsDatasource(
  httpClient: httpClient,
  baseUrlResolver: () => settings.baseUrl,   // resolvido por requisição
);
final repository = SuggestionsRepositoryImpl(datasource);
final usecase    = GetSuggestionsUseCase(repository);
final store      = SuggestionsStore(usecase);
```

`baseUrlResolver` é uma função, não uma string capturada: mudar o endereço no modal tem de
valer na próxima requisição, não na próxima execução.

> **Um bug do helper de teste, encontrado por um teste.** A primeira versão do
> `buildStore` de teste resolvia a URL de uma string capturada em vez do `SettingsStore` —
> ou seja, não espelhava o `injector`. O teste que troca o endereço no modal falhou, e
> estava certo: um helper que fia diferente da produção testa um sistema que não é
> entregue.

## Critério de pronto

- [x] `package:http` importado só pelo adapter e pelo composition root
- [x] Nenhuma page declara widget, tem `_buildX()` ou chama `setState`
- [x] Nenhuma Entity tem `toJson`; nenhum DTO tem `fromJson`
- [x] O store não importa nada de `infra/` nem de `external/`
- [x] O domain não importa `package:flutter`
- [x] `AppConfig.apiBaseUrl` lê `--dart-define`, com default por plataforma
- [x] `flutter analyze` limpo
- [x] As regras **falham** quando violadas
