# Fase 02 — Fundação do backend

**Status:** ⬜ pendente · **Checklist:** item 2

## Objetivo

Backend Node 20 + TypeScript de pé, com as camadas de Clean Architecture no lugar e o
endpoint `POST /api/v1/suggestions` **validando entrada e devolvendo resposta tipada** —
ainda sem LLM. O provider real entra na fase 03.

A ideia é ter o esqueleto e o contrato firmes antes de introduzir a dependência externa,
que é a parte instável.

## Tasks

- [ ] Inicializar projeto Node 20+ com TypeScript (`strict: true`)
- [ ] Configurar ESLint + Prettier
- [ ] Configurar Vitest
- [ ] Criar a árvore `domain/ infra/ presentation/ pkg/ main/`
- [ ] Definir entidades e DTOs do domínio
- [ ] Declarar os ports (`LlmProvider`, `SuggestionCache`, `FallbackCatalog`)
- [ ] Criar `SuggestMessagesUseCase` com um provider fixo em memória (stub)
- [ ] Criar schema Zod de validação
- [ ] Criar controller e rota `POST /api/v1/suggestions`
- [ ] Criar `GET /health`
- [ ] Criar `pkg/config/env.ts` com validação Zod na inicialização
- [ ] Criar `pkg/logger` (Pino) com `requestId`
- [ ] Criar `main/container.ts` (composition root) e `main/server.ts` com graceful shutdown
- [ ] Criar `.env.example`

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

## Arquivos criados

```
backend/
├── package.json · tsconfig.json · vitest.config.ts
├── eslint.config.js · .prettierrc · .env.example
└── src/
    ├── domain/{entities,dtos,providers,repositories,services,usecases,errors}/
    ├── infra/llm/stub/stub-llm.provider.ts
    ├── presentation/{controllers,validators,middlewares,routes}/
    ├── pkg/{config,logger,errors,response}/
    └── main/{app.ts,container.ts,server.ts}
```

## Critério de pronto

- [ ] `npm run build` compila sem erro nem warning
- [ ] `npm run lint` limpo
- [ ] `npm run dev` sobe na porta 3000
- [ ] `curl localhost:3000/health` responde `200`
- [ ] `POST /api/v1/suggestions` com body válido responde `200` com 3 sugestões do stub
- [ ] `POST` sem `occasion` responde `400 VALIDATION_ERROR` com `details`
- [ ] Servidor **recusa subir** se faltar variável obrigatória
- [ ] `SIGTERM` encerra com graceful shutdown

## Riscos

| Risco | Mitigação |
|---|---|
| Over-engineering do esqueleto | Só criar pasta quando houver arquivo para ela |
| `container.ts` virar lixão | É o **único** lugar autorizado a instanciar adapter — fácil de auditar |
| Vazamento de tipo do Express no domínio | Regra: `domain/` não importa nada de `express`. Verificável por grep na fase 15 |
