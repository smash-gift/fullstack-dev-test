# ADR-0007 — Clean Dart, `ChangeNotifier` e DI manual no Flutter

**Status:** Aceito · **Data:** 2026-09-03 · **Autoria:** Humano (D14, D15, D16, D17)

## Contexto

Exigência do enunciado:

> *"Organize the project so that **UI, API client, and state are clearly separated**.
> We expect readable, maintainable code."*

O padrão do desenvolvedor é **Clean Dart** (Flutterando) com MobX e `flutter_modular`.
A tensão aqui é entre seguir o padrão pessoal integralmente e otimizar para a experiência
de quem vai clonar e rodar este repositório uma única vez.

## Decisões

### 1. Clean Dart com quatro camadas — mantido

```
External → Infra → Domain ← Presenter
```

O enunciado pede exatamente as três separações que essa estrutura entrega (UI, cliente de
API, estado), e o padrão é o que o desenvolvedor já pratica. Nenhuma razão para desviar.

### 2. `ChangeNotifier` em vez de MobX

| | MobX | `ChangeNotifier` |
|---|---|---|
| Passos até rodar | `pub get` + `build_runner` | `pub get` |
| Código gerado | `*.g.dart` versionado ou gerado | nenhum |
| Ergonomia | superior (reatividade granular) | adequada para uma tela |
| Dependências | 3 pacotes + build | zero, vem no SDK |

**Decisão: `ChangeNotifier`.**

O raciocínio é sobre o leitor, não sobre o autor. O avaliador vai rodar este projeto uma
vez. Cada passo entre `git clone` e app na tela é uma chance de algo dar errado numa
máquina que não é a nossa — e `build_runner` é uma das fontes mais comuns disso (versão de
Dart incompatível, cache sujo, arquivo gerado desatualizado).

O que se perde é ergonomia de desenvolvimento contínuo, que só importaria se este código
fosse ter meses de vida. **A separação de camadas é idêntica nos dois casos**: o store
seria trocado por uma classe MobX sem tocar em domain, infra ou external. É decisão de
mecanismo de notificação, não de arquitetura.

### 3. DI manual em vez de `flutter_modular`

Um `injector.dart` na raiz de `app/`, construindo o grafo explicitamente:

```dart
// app/injector.dart — composition root
final httpClient   = HttpClientAdapter(http.Client());
final datasource   = HttpSuggestionsDatasource(httpClient, AppConfig.apiBaseUrl);
final repository   = SuggestionsRepositoryImpl(datasource);
final usecase      = GetSuggestionsUseCase(repository);
final store        = SuggestionsStore(usecase);
```

**Por quê.** Com **um módulo e uma tela**, Modular adiciona rotas nomeadas, ciclo de vida
de binds e uma API a mais para o leitor aprender — sem resolver nenhum problema que este
app tenha. A regra do projeto sobre Modular existe para impedir `Modular.get` espalhado
pelo código; com DI manual, esse risco simplesmente não existe.

O grafo acima cabe em cinco linhas e é lido de cima para baixo. Adicionar Modular aqui
seria cerimônia.

**Quando eu reverteria:** a partir de ~3 módulos com rotas aninhadas e escopos de
dependência distintos, o injector manual começa a doer e Modular passa a pagar por si.

### 4. `package:http` atrás de interface própria

Regra R1: nenhum pacote externo substituível é importado pelo código de negócio.

```
domain / infra / presenter  →  IHttpClient
                                    ↑
                     HttpClientAdapter (único import de package:http)
```

**Três ganhos concretos, não teóricos:**

1. **Teste sem rede.** O widget test injeta um `IHttpClient` falso. Sem servidor de pé,
   sem `HttpOverrides`, sem flakiness.
2. **Troca barata.** Migrar para `dio` — por interceptors, cancelamento, upload — é editar
   um arquivo.
3. **Ponto único para preocupações transversais.** Header de correlação, timeout padrão,
   log de request: tudo em um lugar, em vez de repetido em cada datasource.

Escolhemos `http` em vez de `dio` porque é mantido pelo time do Dart, tem superfície menor
e, estando atrás da interface, a escolha deixou de ser difícil de reverter.

### 5. URL do backend via `--dart-define`

```bash
flutter run --dart-define=API_BASE_URL=http://localhost:3000
```

Alternativas descartadas:

- **Constante hardcoded** — falha o requisito explícito *"the base URL should be
  configurable"*.
- **Arquivo `.env` como asset** — vira asset embarcado no bundle, lido em runtime, e cria
  a impressão perigosa de que dá para guardar segredo ali. Não dá: asset de app publicado
  é extraível.

`--dart-define` resolve em tempo de compilação, com default sensato (`http://localhost:3000`)
para quem só quer rodar sem ler documentação.

## Consequências

**Positivas**
- `git clone` → `flutter pub get` → `flutter run`. Sem codegen, sem passo intermediário.
- Widget tests rodam offline e são determinísticos.
- As camadas permanecem substituíveis: trocar `ChangeNotifier` por MobX ou BLoC depois é
  reescrever o `presenter/controllers/`, e nada além.

**Negativas — assumidas**
- Sem a reatividade granular do MobX, `notifyListeners()` reconstrói a subárvore que
  escuta. Irrelevante em uma tela; seria otimizável com `Selector`/`ValueListenable` se
  crescesse.
- DI manual não escala para muitos módulos — e isso está registrado acima com o critério
  de reversão.
- Desvio consciente do padrão pessoal do desenvolvedor (MobX + Modular), justificado pela
  natureza descartável e de leitura única deste repositório.
