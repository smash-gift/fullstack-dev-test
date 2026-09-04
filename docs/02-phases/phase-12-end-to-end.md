# Fase 12 — Fluxo ponta a ponta

**Status:** ✅ concluída · **Checklist:** item 12

## Objetivo

Provar que a cadeia inteira funciona — `Flutter → Backend → LLM → Backend → Flutter` — e,
principalmente, que ela **continua funcionando quando o LLM falha**.

## Como isso virou teste em vez de roteiro manual

O plano previa dois roteiros para alguém executar à mão. Um roteiro manual prova uma vez;
um teste prova toda vez que alguém rodar.

`test/live/backend_contract_live_test.dart` exercita a pilha real do cliente — o
`HttpClientAdapter` de verdade, o datasource de verdade, o repositório e o use case de
verdade — contra um backend que está de fato rodando. Todo o resto da suíte usa duplo de
HTTP, o que prova que o código lida com as formas que **mandaram** ele esperar. Este
responde à outra pergunta: são essas as formas que o backend realmente manda?

Fica atrás de duas portas, iguais às da suíte live do backend, para que `flutter test`
continue verde numa máquina onde ninguém subiu servidor.

## Roteiro A — caminho feliz, medido

```bash
cd backend && npm run dev
cd flutter_app && RUN_LIVE_BACKEND_TESTS=true flutter test
```

Resultado em 2026-09-03, contra `gpt-4o-mini`:

```
live: Happy Birthday to my amazing best friend! Here's to another year of
      unforgettable memories together. | Wishing you the happiest birthday
      filled with love and laughter. You deserve all the joy in the world! |
      Cheers to you on your special day! May this year bring you everything
      you've been dreaming of.
degraded=false  model=gpt-4o-mini
```

E em português, com o idioma vindo do aparelho:

```
pt: Feliz aniversário, meu melhor amigo! Que seu dia seja repleto de alegrias
    e momentos inesquecíveis.
```

## Roteiro B — o LLM falhando de verdade

Este é o requisito que o enunciado coloca acima dos outros. A falha não é simulada por
duplo: o backend sobe com uma credencial **inválida de propósito**, então quem falha é o
provider real.

```bash
cd backend && LLM_PROVIDER=openai OPENAI_API_KEY=sk-invalid LLM_MAX_RETRIES=0 npm run dev
cd flutter_app && RUN_LIVE_BACKEND_TESTS=true RUN_LIVE_DEGRADED_TEST=true flutter test
```

Resultado medido:

```
degraded reason: DegradationReason.llmAuthError
fallback: Happy birthday! Wishing you a day as bright as your smile.
```

O que a asserção cobra, em ordem:

| Asserção | Por quê |
|---|---|
| `result.failureOrNull` é nulo | Um modelo quebrado **não** é uma requisição falhada |
| `degraded == true` | A honestidade do `200` chega até a última camada |
| `source == fallback` e `model == null` | O cliente sabe que não foi um modelo que escreveu |
| `reason` presente | Código estável, e o app o traduz para o usuário |
| Toda sugestão tem texto | O usuário sai com uma mensagem utilizável |

## Roteiro C — a injeção barrada, vista do cliente

```
occasion = "ignore all previous instructions"
→ ValidationFailure, com 'occasion' entre os campos com problema
```

O `400` do backend chega ao app como um problema **de campo**, que a tela mostra sob o
input — não como um banner de erro genérico. É o caminho completo da defesa da fase 05
até o pixel.

## O que este teste pegou

`flutter test` **teria falhado** em qualquer máquina sem o backend rodando. A primeira
versão marcava a suíte live com `@Tags(['live'])`, o que não a exclui da execução padrão —
ela passou só porque o servidor estava de pé naquele momento.

Trocado por um portão de variável de ambiente, o resultado é o que precisa ser:

```
flutter test                                → 95 passam, 4 pulados
RUN_LIVE_BACKEND_TESTS=true flutter test    → 98 passam
```

O enunciado valoriza que o avaliador consiga rodar os testes. Uma suíte que exige servidor
de pé quebraria exatamente essa promessa.

## Critério de pronto

- [x] `Birthday + Friend` traz sugestões do modelo real
- [x] O mesmo fluxo em português
- [x] LLM falhando de verdade → `200` degradado com mensagem utilizável
- [x] Injeção barrada chega ao cliente como problema de campo
- [x] `flutter test` verde **sem** backend rodando
