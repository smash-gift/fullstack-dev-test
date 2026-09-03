# Fase 08 — Testes do backend

**Status:** ⬜ pendente · **Checklist:** item 8

> O enunciado é específico sobre a prioridade:
>
> *"Backend: **at least one test that covers the fallback path when the LLM fails.**
> More tests (happy path, rate limiting) are a plus."*

## Objetivo

Cobrir o caminho de fallback com rigor, e o resto do fluxo com testes que rodam **sem
rede e sem API key**.

## Tasks

- [ ] Configurar Vitest com cobertura
- [ ] **Testar o fallback nos cinco cenários de falha** (prioridade máxima)
- [ ] Testar geração normal (happy path)
- [ ] Testar validação de parâmetros
- [ ] Testar resposta inválida do LLM
- [ ] Testar rate limiting
- [ ] Testar cache (hit, miss, e que fallback não é cacheado)
- [ ] Testar que nenhuma resposta de erro contém stack trace
- [ ] 🔒 **S1** — sanitizador de entrada (NFKC, bidi, zero-width, allowlist, heurística)
- [ ] 🔒 **S2** — guard de saída (URL, HTML, canário, meta-resposta) ⭐
- [ ] 🔒 **S3** — corpus de injeção ponta a ponta, com provider que ecoa a entrada
- [ ] 🔒 **S4** — vazamento de informação (stack, key, prompt em log)
- [ ] 🔒 **S5** — abuso e limites (corpo, `count`, rate limit, JSON malformado)
- [ ] 🔒 **S6** — regras arquiteturais verificadas estaticamente
- [ ] 🔒 Suíte live de red-team, gated por `RUN_LIVE_SECURITY_TESTS`

## Por que estes testes são baratos aqui

O use case depende da interface `LlmProvider`, não de um SDK. Simular timeout é passar um
duplo que lança `LlmTimeoutError`:

```ts
const failing: LlmProvider = {
  name: 'stub',
  model: 'stub',
  generateSuggestions: async () => { throw new LlmTimeoutError(); },
};
```

Sem rede, sem interceptar HTTP, sem key, sem custo — e determinístico. É o retorno direto
do investimento arquitetural da fase 02
([`ADR-0001`](../01-architecture/decisions/adr-0001-clean-architecture-backend.md)).

## Plano de testes

### Prioridade 1 — fallback (exigido pelo enunciado)

| Teste | Espera |
|---|---|
| Provider lança `LlmTimeoutError` | `200` · `degraded: true` · `reason: llm_timeout` |
| Provider lança `LlmRateLimitError` | `200` · `reason: llm_rate_limited` |
| Provider lança `LlmUnavailableError` | `200` · `reason: llm_unavailable` |
| Provider devolve JSON fora do schema | `200` · `reason: llm_invalid_response` |
| Provider lança `LlmAuthError` | `200` · `reason: llm_auth_error` |
| Fallback respeita `count` | Quantidade pedida é devolvida |
| Par não catalogado | Cai no genérico, sem lançar |
| Resposta de fallback | **Não** contém stack trace nem nome de SDK |
| Fallback | **Não** é gravado no cache |

### Prioridade 2 — happy path

| Teste | Espera |
|---|---|
| Provider devolve 3 sugestões válidas | `200` · `source: llm` · `degraded: false` |
| `count: 2` | Exatamente 2 sugestões |
| Resposta | Traz `model` e `requestId` |

### Prioridade 3 — validação

| Teste | Espera |
|---|---|
| `occasion` ausente | `400` com `details` apontando o campo |
| `relationship` vazio | `400` |
| `count: 1` e `count: 10` | `400` |
| `tone` inválido | `400` |
| Body não-JSON | `400` |
| **Entrada inválida** | **Nunca** aciona fallback |

### Prioridade 4 — segurança 🔒

Plano completo em [`../05-security/security-testing.md`](../05-security/security-testing.md).
Resumo do que não pode faltar:

| Teste | Espera |
|---|---|
| Todo payload do corpus (~30) | `400` ou `200 degraded` — **nunca `5xx`** |
| Provider duplo que **ecoa a entrada** | Saída sem URL, HTML, canário ou meta-resposta |
| Canário aparecendo na saída | Fallback + log `error` |
| Saída legítima e limpa | **Aceita** — o guard não pode rejeitar tudo |
| `aniversário`, `結婚式`, `عيد ميلاد` | **Aceitos** — a defesa não pode quebrar o produto |
| Resposta de injeção bloqueada | Indistinguível da de timeout |
| Log em `info` | Sem key, sem prompt, sem valores de campo |

O teste do **provider que ecoa a entrada** é o de maior valor da suíte: em vez de torcer
para o modelo real resistir, ele assume que o modelo foi **completamente subvertido** e
verifica se a camada 3 segura sozinha.

Os dois testes de entrada legítima existem pelo motivo oposto — uma allowlist mal escrita
rejeitando `aniversário` seria um bug pior que a ameaça.

### Prioridade 5 — rate limit e cache

| Teste | Espera |
|---|---|
| Requisições acima do limite | `429` com `Retry-After` |
| `/health` após o limite | Continua `200` |
| Duas requisições idênticas | Segunda com `meta.cached: true` |
| Chaves diferentes | Não colidem no cache |
| Troca de modelo | Invalida o cache (model está na chave) |

## Critério de pronto

- [ ] `npm test` passa, sem rede e sem API key
- [ ] Os cinco cenários de falha estão cobertos
- [ ] Cobertura de `domain/usecases/` ≥ 90%
- [ ] Nenhum teste depende de temporização real (timers controlados)
- [ ] Testes rodam em menos de 10 segundos
- [ ] 🔒 Nenhum payload do corpus produz `5xx` ou saída insegura
- [ ] 🔒 Suíte live executada uma vez, relatório salvo em `docs/05-security/`

## Nota sobre cobertura

A meta de 90% é para `domain/usecases/` — onde vive a lógica de decisão. Não se persegue
100% global: forçar cobertura em código de composição (`container.ts`) e em mapeamento de
SDK produz teste que existe para o relatório, não para pegar defeito.

Onde a cobertura precisa ser alta é onde há **ramificação de decisão**, e é exatamente
onde os testes acima se concentram.

## Riscos

| Risco | Mitigação |
|---|---|
| Teste de rate limit vazar estado entre casos | Instância nova de app por teste; `RATE_LIMIT_ENABLED` controlado |
| Teste tocar a API real por engano | Nenhum teste instancia adapter real; `.env` de teste sem key |
| Teste de timeout ficar lento | Timers falsos do Vitest, não espera real |
