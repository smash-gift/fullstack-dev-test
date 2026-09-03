# Fase 04 — Tratamento de falhas

**Status:** ⬜ pendente · **Checklist:** item 4

> **A fase mais importante do teste.** O enunciado dedica uma seção inteira ao tema e a
> lista entre os critérios de avaliação: *"Error handling: Graceful handling of LLM
> failures and clear, safe responses."*

## Objetivo

Garantir que **nenhuma falha do LLM chegue ao Flutter como erro**, e que nenhum detalhe
interno vaze na resposta.

## Tasks

- [ ] Criar a hierarquia de erros de domínio
- [ ] Mapear erro de cada SDK → erro de domínio, nos três adapters
- [ ] Tratar **timeout** (`AbortController`)
- [ ] Tratar **429** do provider
- [ ] Tratar **5xx** e falha de rede
- [ ] Tratar **resposta inválida** do modelo
- [ ] Tratar **erro de autenticação** (key ausente/inválida)
- [ ] Implementar `StaticFallbackCatalog` com degradação em 3 níveis
- [ ] Ligar o fallback ao use case
- [ ] Implementar `error-handler.middleware.ts` como último middleware
- [ ] Garantir que nenhum stack trace saia na resposta
- [ ] Registrar erros com `requestId` no nível correto
- [ ] Implementar a política de retry

## Hierarquia de erros

```
DomainError (base)
├── ValidationError          → 400
└── LlmError (base)
    ├── LlmTimeoutError          → fallback · reason: llm_timeout
    ├── LlmRateLimitError        → fallback · reason: llm_rate_limited
    ├── LlmUnavailableError      → fallback · reason: llm_unavailable
    ├── LlmInvalidResponseError  → fallback · reason: llm_invalid_response
    └── LlmAuthError             → fallback · reason: llm_auth_error
```

**Todo `LlmError` leva ao fallback.** Nenhum vira resposta de erro para o cliente.
Fundamentação em [`ADR-0003`](../01-architecture/decisions/adr-0003-fallback-strategy.md).

## O catálogo de fallback

Três níveis de degradação:

```
1. Match exato    (occasion × relationship)   ex.: birthday × friend
2. Match parcial  (só occasion)               ex.: birthday × <não catalogado>
3. Genérico       (serve a qualquer par)
```

Cobertura mínima: as combinações citadas no enunciado — `birthday`, `wedding`,
`thank you` × `friend`, `colleague`, `parent`.

O catálogo fica atrás do port `FallbackCatalog`. Trocá-lo depois por uma fonte remota, ou
por sugestões pré-computadas em banco, não toca no use case.

## A regra do `catch`

> **Nenhum `try/catch` sem tratamento explícito no `catch`.**

Todo `catch` deste projeto faz, no mínimo:

1. **classifica** o erro em um tipo de domínio;
2. **registra** com `requestId` e contexto suficiente para diagnóstico;
3. **decide** o caminho — degradar, propagar ou traduzir.

`catch` vazio, ou que só relança sem contexto, é defeito. Ele transforma falha em
comportamento estranho sem rastro, e o bug reaparece longe de onde nasceu.

## Níveis de log

| Evento | Nível | Por quê |
|---|---|---|
| Requisição recebida / respondida | `info` | Rastro básico |
| **Falha do LLM com fallback servido** | `warn` | Não é erro do sistema — ele reagiu como projetado |
| Erro inesperado (bug) | `error` | Precisa de ação humana |
| Prompt e resposta completos | `debug` | Só em dev; pode conter dado do usuário |

Falha de LLM ser `warn` e não `error` é deliberado: se fosse `error`, um incidente do
provider encheria o alerta de ruído sobre um sistema que está funcionando exatamente como
projetado. O que merece alarme é a **taxa** de degradação subir, não cada ocorrência.

## Como testar manualmente

| Cenário | Como provocar |
|---|---|
| Timeout | `LLM_TIMEOUT_MS=1 npm run dev` |
| Auth | `OPENAI_API_KEY=invalid npm run dev` |
| Indisponível | Desligar a rede com o servidor rodando |
| Resposta inválida | Duplo de teste devolvendo `{"foo":"bar"}` |
| 429 | Duplo de teste devolvendo `429` |

Em todos: `200`, `degraded: true`, `meta.reason` correspondente.

## Critério de pronto

- [ ] Os cinco cenários acima devolvem `200` com `degraded: true`
- [ ] Nenhuma resposta contém stack trace, caminho de arquivo ou nome de SDK
- [ ] `meta.reason` corresponde ao cenário provocado
- [ ] Falha de LLM aparece como `warn`, com `requestId`
- [ ] Input inválido continua `400` e **não** aciona fallback
- [ ] `grep -rn "catch" src/` — todo `catch` tem tratamento explícito
- [ ] Exceção inesperada vira `500 INTERNAL_ERROR` genérico

## Riscos

| Risco | Mitigação |
|---|---|
| Fallback esconder bug real do sistema | Só `LlmError` aciona fallback. Bug nosso vira `500` |
| Detalhe interno vazando na mensagem | Middleware final constrói a resposta; adapter nunca escreve resposta |
| Retry estourar o orçamento de latência | Máximo 1 retry; nunca em `429` |
| Cachear resposta degradada | Fallback **nunca** entra no cache |
