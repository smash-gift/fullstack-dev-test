# Fase 02 — Fundação do backend

**Status:** ✅ concluída · **Checklist:** item 2

## Objetivo

Backend Node 20 + TypeScript de pé, com as camadas de Clean Architecture no lugar e o
endpoint `POST /api/v1/suggestions` **validando entrada e devolvendo resposta tipada** —
ainda sem LLM. O provider real entra na fase 03.

A ideia é ter o esqueleto e o contrato firmes antes de introduzir a dependência externa,
que é a parte instável.

## Tasks

- [x] Inicializar projeto Node 20+ com TypeScript (`strict: true`)
- [x] Configurar ESLint + Prettier
- [x] Configurar Vitest
- [x] Criar a árvore `domain/ infra/ presentation/ pkg/ main/`
- [x] Definir entidades e DTOs do domínio
- [x] Declarar os ports (`LlmProvider`, `SuggestionCache`, `FallbackCatalog`)
- [x] Criar `SuggestMessagesUseCase` com um provider fixo em memória (stub)
- [x] Criar schema Zod de validação
- [x] Criar controller e rota `POST /api/v1/suggestions`
- [x] Criar `GET /health`
- [x] Criar `pkg/config/env.ts` com validação Zod na inicialização
- [x] Criar `pkg/logger` (Pino) com `requestId`
- [x] Criar `main/container.ts` (composition root) e `main/server.ts` com graceful shutdown
- [x] Criar `.env.example`
- [x] **Antecipado da fase 07:** cache LRU em memória — ver "Desvios" abaixo

## Decisões desta fase

### `strict: true` no TypeScript, sem exceção
Sem `strict`, TypeScript vira comentário com sintaxe. `strictNullChecks` em particular é o
que impede o `undefined` que aparece só em produção. Também: `noUncheckedIndexedAccess`,
que pega acesso a array fora de faixa — relevante aqui, já que manipulamos listas de
sugestões o tempo todo.

### Express, não Fastify
Fastify é mais rápido e tem validação embutida. Escolhemos Express porque é o que qualquer
avaliador lê sem esforço, e porque **o framework HTTP está confinado à camada
`presentation/`** — trocá-lo depois não tocaria em domain nem infra. Quando a decisão é
barata de reverter, otimiza-se para legibilidade.

### Validação com Zod na borda, não no domínio
O schema Zod fica em `presentation/validators/`. O domínio recebe um DTO **já validado** e
tipado — ele não repete a validação nem conhece Zod. Validar na borda e confiar no
interior é o que permite ao use case ser lido como regra de negócio pura.

### Stub de provider antes do provider real
`SuggestMessagesUseCase` é construído contra um `StubLlmProvider` que devolve texto fixo.
Isso permite testar o fluxo HTTP inteiro — validação, controller, resposta, tratamento de
erro — **antes** de existir key, rede ou custo. É a mesma propriedade que, na fase 08, vai
tornar o teste de fallback trivial.

## Desvios em relação ao plano

### 1. Cache LRU antecipado da fase 07 para cá

**Motivo.** O `SuggestMessagesUseCase` depende do port `SuggestionCache`, e o `.env`
documenta `CACHE_ENABLED=true`. Entregar a fase com apenas um `NoOpSuggestionCache`
significaria publicar uma flag de configuração que **não faz nada** — pior que atrasar o
cronograma, porque é documentação que mente.

**O que foi feito.** `InMemorySuggestionCache` (LRU com TTL, relógio injetável) implementado
aqui. `NoOpSuggestionCache` permanece, usado quando `CACHE_ENABLED=false` e nos testes que
precisam de todo request chegando ao provider. A fase 07 fica com Swagger, rate limit e
CORS por ambiente.

### 2. `pkg/errors/` não foi criado

O plano previa `pkg/errors/app-error.ts`. Na prática, toda a hierarquia de erro é **de
domínio** (`DomainError`, `ValidationError`, `LlmError`) e vive em `domain/errors/`. Uma
classe de erro genérica em `pkg/` seria duplicação sem uso.

### 3. `LLM_PROVIDER` aceita `stub` e usa esse valor como default

Até a fase 03 não existe adapter real. Com `stub` como default, **o servidor sobe com
`.env` vazio** — o avaliador consegue rodar e exercitar o contrato inteiro sem API key. A
fase 03 promove `openai` a default.

## Decisões técnicas tomadas na execução

| Decisão | Escolha | Motivo |
|---|---|---|
| Sistema de módulos | **ESM** + `NodeNext` | Padrão atual do Node; exige `.js` nos imports relativos, o que é mecânico |
| Framework HTTP | **Express 5** | Encaminha rejeição de promise para o error handler automaticamente, dispensando wrapper em handler async |
| Validação | **Zod 4** | Mesma fonte que vai gerar o OpenAPI na fase 07 |
| Flags do `tsconfig` | `strict` + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` | A segunda pega acesso a array fora de faixa — relevante num sistema que manipula listas de sugestões |
| Relógio do cache | Injetável (`now?: () => number`) | Testar TTL sem esperar em tempo real |

## Arquivos criados

```
backend/
├── package.json · tsconfig.json · tsconfig.build.json
├── vitest.config.ts · eslint.config.js · .prettierrc · .env.example
├── src/
│   ├── domain/
│   │   ├── entities/suggestion.ts
│   │   ├── dtos/suggest-messages-{input,output}.dto.ts
│   │   ├── errors/{domain-error,validation-error,llm-errors,index}.ts
│   │   ├── providers/llm-provider.ts                  # PORT
│   │   ├── repositories/suggestion-cache.ts           # PORT
│   │   ├── services/{fallback-catalog,suggestion-cache-key}.ts
│   │   └── usecases/suggest-messages.usecase.ts
│   ├── infra/
│   │   ├── cache/{in-memory,no-op}-suggestion-cache.ts
│   │   └── llm/stub/stub-llm.provider.ts
│   ├── presentation/
│   │   ├── controllers/suggestions.controller.ts
│   │   ├── validators/suggestions.schema.ts
│   │   ├── middlewares/{request-id,request-logger,not-found,error-handler}.middleware.ts
│   │   └── routes/{health.routes.ts,v1/{index,suggestions.routes}.ts}
│   ├── pkg/{config/env.ts, logger/logger.ts, response/http-response.ts,
│   │        http/request-context.ts, utils/id.ts}
│   └── main/{app.ts, container.ts, server.ts}
└── tests/
    ├── helpers/build-test-app.ts
    ├── unit/{env,suggestion-cache-key,in-memory-suggestion-cache,suggest-messages.usecase}.test.ts
    └── integration/{app.route,suggestions.route}.test.ts
```

**39 arquivos TypeScript · 1.534 linhas.**

## Resultado verificado

| Verificação | Resultado |
|---|---|
| `npm run typecheck` | ✅ zero erro |
| `npm run lint` | ✅ zero erro |
| `npm run build` | ✅ compila |
| `npm test` | ✅ **45 testes, 641 ms**, sem rede e sem API key |
| `npm run test:coverage` | 84,79% statements · use case 93,75% / 100% branches |
| `curl /health` | ✅ `200` |
| `POST` birthday + friend | ✅ `200` com 3 sugestões |
| `POST` sem `relationship` | ✅ `400` com `details` apontando o campo |
| Segunda chamada idêntica | ✅ `meta.cached: true` |
| `SIGTERM` | ✅ graceful shutdown |

**Sobre a cobertura de 84,79%:** as lacunas são `llm-errors.ts` (0% — essas classes só
passam a ser lançadas na fase 04) e `logger.ts` (0% — os testes injetam um logger
silencioso). Ambas são esperadas nesta fase e ficam cobertas na fase 08.

## Critério de pronto

- [x] `npm run build` compila sem erro nem warning
- [x] `npm run lint` limpo
- [x] `npm run dev` sobe na porta 3000
- [x] `curl localhost:3000/health` responde `200`
- [x] `POST /api/v1/suggestions` com body válido responde `200` com 3 sugestões do stub
- [x] `POST` sem `occasion` responde `400 VALIDATION_ERROR` com `details`
- [x] Servidor **recusa subir** se a configuração for inválida (`loadEnv` lança e o processo sai com código 1)
- [x] `SIGTERM` encerra com graceful shutdown

## Riscos

| Risco | Mitigação |
|---|---|
| Over-engineering do esqueleto | Só criar pasta quando houver arquivo para ela |
| `container.ts` virar lixão | É o **único** lugar autorizado a instanciar adapter — fácil de auditar |
| Vazamento de tipo do Express no domínio | Regra: `domain/` não importa nada de `express`. Verificável por grep na fase 15 |
