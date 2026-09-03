# Fase 04 — Tratamento de falhas

**Status:** ✅ concluída · **Checklist:** item 4

> **A fase mais importante do teste.** O enunciado dedica uma seção inteira ao tema e a
> lista entre os critérios de avaliação: *"Error handling: Graceful handling of LLM
> failures and clear, safe responses."*

## Objetivo

Garantir que **nenhuma falha do LLM chegue ao Flutter como erro**, e que nenhum detalhe
interno vaze na resposta.

## Tasks

- [x] Criar a hierarquia de erros de domínio *(fase 02)*
- [x] Mapear erro de cada API → erro de domínio, nos três adapters *(fase 03)*
- [x] Tratar **timeout** (`AbortController`)
- [x] Tratar **429** do provider
- [x] Tratar **5xx** e falha de rede
- [x] Tratar **resposta inválida** do modelo
- [x] Tratar **erro de autenticação** (key ausente/inválida)
- [x] Implementar `StaticFallbackCatalog` com degradação em 3 níveis
- [x] Ligar o fallback ao use case
- [x] Implementar `error-handler.middleware.ts` como último middleware *(fase 02)*
- [x] Garantir que nenhum stack trace saia na resposta
- [x] Registrar erros com `requestId` no nível correto
- [x] Implementar a política de retry
- [x] **Extra:** tabela de aliases multilíngues para o catálogo

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

## Decisões da fase

### Retry como decorator, não dentro do use case

`RetryingLlmProvider` **implementa `LlmProvider`** e envolve qualquer adapter. O use case
não sabe que ele existe. É o port se pagando: política de resiliência vira composição, não
condicional espalhada.

```ts
new RetryingLlmProvider(new OpenAiProvider(...), { maxRetries: 1, ... })
```

### Orçamento de tempo total, não por tentativa

Corrigido em relação ao plano original — ver a seção "Correção feita na implementação" no
[`ADR-0003`](../01-architecture/decisions/adr-0003-fallback-strategy.md). O `AbortSignal`
cobre a operação inteira, retries incluídos, e o timeout deixou de ser retentado. Pior
caso: **8 s**, não 16,3 s.

### Aliases multilíngues — um problema encontrado testando

Testando `{"occasion":"aniversário","relationship":"irmã","language":"pt"}` ao vivo, o
fallback caiu no nível **genérico** em vez das mensagens de aniversário em português.

Causa: o catálogo é chaveado em inglês (`birthday`), mas `occasion` é texto livre e um
usuário brasileiro digita `aniversário`. O resultado era uma mensagem que soa como
improviso — exatamente o que faz um fallback parecer barato.

`catalog-aliases.ts` resolve o termo digitado para a chave canônica antes da busca, com
diacríticos removidos (`aniversário`, `aniversario` e `ANIVERSÁRIO` resolvem igual). Cobre
occasions e relationships nos três idiomas suportados.

### O catálogo respeita `language`, mas não `tone`

`tone` multiplicaria o catálogo por quatro, num caminho que **já está degradado**.
`language` é diferente: responder em inglês a quem pediu português seria uma falha
**visível** empilhada sobre uma invisível. Limitação declarada no código e aqui.

### Fallback nunca é cacheado

Cachear degradação congela o pior momento do sistema: o provider se recupera em 30
segundos e continuaríamos servindo template pelo TTL inteiro. Coberto por teste.

### Só `LlmError` degrada

Um bug nosso continua virando erro. Se o fallback engolisse toda exceção, esconderia
defeitos próprios atrás de mensagens genéricas — e o sintoma apareceria longe da causa.
Também coberto por teste.

## Como testar manualmente

| Cenário | Como provocar |
|---|---|
| Timeout | `LLM_TIMEOUT_MS=1 npm run dev` |
| Auth | `OPENAI_API_KEY=invalid npm run dev` |
| Indisponível | Desligar a rede com o servidor rodando |
| Resposta inválida | Duplo de teste devolvendo `{"foo":"bar"}` |
| 429 | Duplo de teste devolvendo `429` |

Em todos: `200`, `degraded: true`, `meta.reason` correspondente.

## Resultado verificado — contra a API real, 2026-09-03

| Cenário | Como provocado | HTTP | `degraded` | `reason` | Vazamento |
|---|---|---|---|---|---|
| Timeout | `LLM_TIMEOUT_MS=1` | **200** | ✅ | `llm_timeout` | nenhum |
| Auth | `OPENAI_API_KEY=sk-invalid` | **200** | ✅ | `llm_auth_error` | nenhum |
| Indisponível | `OPENAI_MODEL=gpt-does-not-exist-9999` | **200** | ✅ | `llm_unavailable` | nenhum |
| Fallback em PT | `language: pt` + timeout | **200** | ✅ | `llm_timeout` | nenhum |
| Genérico em ES | occasion não catalogada | **200** | ✅ | `llm_timeout` | nenhum |
| `count: 2` degradado | timeout | **200** | ✅ | 2 sugestões | nenhum |

"Vazamento" verifica stack trace, nome do provider, caminho de arquivo e padrão de key na
resposta. **Nenhum em nenhum cenário.**

Latência do caminho degradado: **55 ms** (contra ~2,9 s do caminho feliz).

### Amostra do fallback multilíngue

```
aniversário + amigo  (pt) -> "Feliz aniversário! Que o seu dia seja tão bom quanto você merece."
cumpleaños  + amigo  (es) -> "¡Feliz cumpleaños! Que tu día sea tan bueno como te mereces."
casamento   + colega (pt) -> "Parabéns pelo casamento. Muitas felicidades para vocês dois."
birthday    + mãe    (en) -> "Happy birthday. Thank you for everything you have given me."
```

O último caso mostra os três níveis funcionando: `mãe` resolve para `parent` pela tabela
de aliases, e a entrada exata `birthday × parent` é servida.

## Critério de pronto

- [x] Os cinco cenários acima devolvem `200` com `degraded: true`
- [x] Nenhuma resposta contém stack trace, caminho de arquivo ou nome de SDK
- [x] `meta.reason` corresponde ao cenário provocado
- [x] Falha de LLM aparece como `warn`, com `requestId`
- [x] Input inválido continua `400` e **não** aciona fallback
- [x] `grep -rn "catch" src/` — todo `catch` tem tratamento explícito
- [x] Exceção inesperada vira `500 INTERNAL_ERROR` genérico
- [x] **192 testes**, 95,77% de cobertura, sem rede e sem API key

## Riscos

| Risco | Mitigação |
|---|---|
| Fallback esconder bug real do sistema | Só `LlmError` aciona fallback. Bug nosso vira `500` |
| Detalhe interno vazando na mensagem | Middleware final constrói a resposta; adapter nunca escreve resposta |
| Retry estourar o orçamento de latência | Máximo 1 retry; nunca em `429` |
| Cachear resposta degradada | Fallback **nunca** entra no cache |
