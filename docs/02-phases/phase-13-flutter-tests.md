# Fase 13 — Testes Flutter

**Status:** ✅ concluída · **Checklist:** item 13

> *"Flutter: unit or widget tests for the main screen are a plus."*

## Resultado

| Métrica | Valor |
|---|---|
| Testes offline | **95**, em ~3 s |
| Rede ou backend | nenhum |
| Testes live, atrás de portão | 3 + 1 |
| `flutter analyze` | limpo |

```
test/
├── architecture/   22  regras de camada e de segurança, verificadas por máquina
├── unit/           44  store · settings · i18n
├── widget/         29  os cinco estados · camada 4 · layout em 4 larguras
└── live/            4  a pilha real contra o backend real (pulados por padrão)
```

## Por que estes testes rodam offline

A regra R1 é o que paga por isso. `IHttpClient` é injetável, então o duplo substitui a rede
inteira:

```dart
final client = FakeHttpClient(statusCode: 429, body: errorBody('RATE_LIMITED', ...));
final store  = buildStore(client);
```

Sem servidor, sem `HttpOverrides`, sem espera de socket — e a suíte inteira em dois
segundos. É o retorno direto de uma regra de arquitetura que, isolada, pareceria cerimônia.

## O que é coberto

### Store — 19 casos

Caminho feliz, o que é enviado, degradação preservada até a tela, e cada falha do contrato:
conexão, timeout, `429` com os segundos, `400` que vira problema de campo, `500`, e um
`200` que o cliente não consegue ler.

Três merecem destaque, porque são regras de produto e não de código:

| Caso | Regra |
|---|---|
| `429` não produz sugestões | Servir mesmo assim ensinaria que insistir funciona |
| Retry que falha mantém as sugestões anteriores | Tirar um resultado bom pune quem tentou de novo |
| Segundo submit durante a requisição é ignorado | Duas respostas correndo para ver qual aparece |

### Os cinco estados — widget tests na tela real

Cada um pumpa a `SuggestionsPage` de verdade, no tema de verdade, com os textos lidos do
`en.json` de verdade. Uma string que sumir do arquivo quebra um widget test em vez de
renderizar a chave em silêncio.

### Camada 4 — a regra de renderização

Payloads reais — URL, `<script>`, link markdown — passados como texto de sugestão. Todos
aparecem literalmente, e a asserção é que **nenhum ancestral do texto é um `InkWell` ou
`GestureDetector`**.

### Layout — quatro larguras

320 px (iPhone SE), 390, 834 e 1440. Em cada uma, no repouso e com resultados,
`tester.takeException()` tem de ser nulo — é assim que um estouro de layout vira falha de
teste em vez de uma listra amarela que alguém precisa notar num screenshot.

> Um screenshot em janela estreita **sugeriu** estouro. O teste a 320 px mostrou que não
> havia: o Chrome headless trunca a janela abaixo de um mínimo. A imagem levantou a
> pergunta; o teste deu a resposta.

### i18n — quatro direções de drift fechadas

Três arquivos de idioma e uma lista de chaves podem divergir de quatro formas. Para cada
idioma: nenhuma chave que o código pede está faltando, nenhuma chave sobra, nenhuma
tradução está vazia, e **os placeholders são os mesmos do inglês** — um `{seconds}` que
some numa tradução faz o valor desaparecer só para aqueles usuários.

## Três bugs que os testes acharam

**1. O helper de teste não espelhava a produção.** O `buildStore` resolvia a URL de uma
string capturada em vez do `SettingsStore`. O teste que troca o endereço no modal falhou —
e estava certo. Um helper que fia diferente da produção testa um sistema que não é entregue.

**2. Quatro regras estáticas liam comentários.** Descrito na
[fase 10](phase-10-flutter-architecture.md).

**3. `flutter test` dependia do backend estar rodando.** Descrito na
[fase 12](phase-12-end-to-end.md).

## Uma asserção que estava larga demais

O teste da camada 4 afirmava "nenhum `InkWell` no card" e falhou — no botão de copiar. A
saída fácil seria remover a asserção. A certa foi escopá-la aos **ancestrais do texto da
sugestão**, que é o que a regra sempre quis dizer: o texto do modelo não é tocável, e o
botão que nós escrevemos é.

## Critério de pronto

- [x] `flutter test` passa **sem rede e sem backend**
- [x] Widget test de cada um dos cinco estados
- [x] Unit test do store e do use case
- [x] Degradação verificada até o widget
- [x] Camada 4 verificada com payloads reais
- [x] Layout verificado de 320 a 1440 px
- [x] Regras de arquitetura **falham** quando violadas
