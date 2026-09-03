# Fase 13 — Testes Flutter

**Status:** ⬜ pendente · **Checklist:** item 13

> *"Flutter: unit or widget tests for the main screen are a plus."*

## Objetivo

Testar a tela principal nos quatro estados, mais a lógica do store e do use case, **sem
rede**.

## Tasks

- [ ] Configurar `flutter_test`
- [ ] Widget test da tela principal
- [ ] Testar o estado de loading
- [ ] Testar a exibição das sugestões
- [ ] Testar o estado de erro
- [ ] Testar o aviso de degradação
- [ ] Unit test do `SuggestionsStore`
- [ ] Unit test do `GetSuggestionsUseCase`

## Por que estes testes rodam offline

O `IHttpClient` da regra R1 é injetável. O teste passa um duplo:

```dart
class FakeHttpClient implements IHttpClient {
  final HttpResponse Function() onPost;
  FakeHttpClient(this.onPost);

  @override
  Future<HttpResponse> post(String url, {Object? body}) async => onPost();
}
```

Sem servidor, sem `HttpOverrides`, sem flakiness. É o retorno direto da regra R1
([`ADR-0007`](../01-architecture/decisions/adr-0007-flutter-clean-dart.md)).

## Plano de testes

### Widget tests — tela principal

| Teste | Verifica |
|---|---|
| Estado inicial | Campos e botão visíveis; nenhum resultado; nenhum erro |
| Botão com formulário vazio | Desabilitado |
| Toque em Generate | Loading aparece **e o botão desabilita** |
| Resposta com 3 sugestões | 3 cards renderizados com os textos corretos |
| Resposta com 2 sugestões | 2 cards |
| Falha de rede | Estado de erro com "Tentar novamente" |
| Erro `400` do backend | Mensagem de validação, sem opção de repetir cegamente |
| `degraded: true` | **Sugestões aparecem E o aviso aparece** |
| Toque em Tentar novamente | Nova requisição é disparada |
| 🔒 Sugestão contendo `<b>x</b>` | Renderizada **como texto literal**, não interpretada |
| 🔒 Sugestão contendo `http://exemplo` | **Não** vira link tocável |

O teste de `degraded` é o mais importante: verifica que a decisão do
[`ADR-0003`](../01-architecture/decisions/adr-0003-fallback-strategy.md) chega íntegra até
o pixel. Backend, mapeamento e interface precisam concordar, e este é o único teste que
cobre os três juntos.

### Unit tests — `SuggestionsStore`

| Teste | Verifica |
|---|---|
| Estado inicial | `SuggestionsIdle` |
| Durante a chamada | Transita para `SuggestionsLoading` |
| Sucesso | `SuggestionsSuccess` com as sugestões |
| Sucesso degradado | `SuggestionsSuccess` com `degraded: true` |
| Falha | `SuggestionsError` com mensagem de usuário |
| Toque duplo rápido | Não dispara duas requisições |
| Cada transição | Chama `notifyListeners()` |

### Unit tests — `GetSuggestionsUseCase`

| Teste | Verifica |
|---|---|
| DTO válido | Repositório é chamado com os valores corretos |
| Erro do repositório | Propagado como erro de domínio, não como exceção de SDK |

## Critério de pronto

- [ ] `flutter test` passa
- [ ] Os quatro estados têm teste
- [ ] Nenhum teste faz requisição de rede real
- [ ] Testes rodam em menos de 30 segundos
- [ ] `flutter analyze` limpo
- [ ] Cobertura do `presenter/` e do `domain/` acima de 80%
- [ ] 🔒 Marcação em texto de sugestão é exibida, nunca interpretada

## Riscos

| Risco | Mitigação |
|---|---|
| Widget test instável por timing | `pumpAndSettle` com timeout explícito; sem `Future.delayed` real |
| Teste acoplado a texto de interface | Buscar por `Key` sempre que possível, não por string literal |
| Teste tocar a rede sem querer | Nenhum teste instancia `HttpClientAdapter` real |
