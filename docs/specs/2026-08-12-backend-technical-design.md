# Spec — Design técnico do backend (smash-gift)

- **Data:** 2026-08-12
- **Status:** Aprovado (autoria autônoma — ver nota de processo abaixo)
- **Autor:** `backend-agent`

## Nota de processo

O usuário (dono do produto) autorizou explicitamente, por escrito, pular o ciclo interativo de
brainstorming por módulo para este documento, dado que o escopo de produto já está definido pela spec de
meta-estrutura (`docs/specs/2026-08-11-meta-structure-design.md`) e pelo contrato ilustrativo já presente
em `docs/contracts/api-contracts.md`. Essa autorização está registrada no histórico de conversa entre o
dono do produto e o orquestrador (Claude Code), não em um documento separado. Este documento cumpre o papel
que normalmente seria produzido em uma sessão de `superpowers:brainstorming`: registra as decisões
técnicas do backend antes da implementação, para que o guardrail de "spec aprovada antes de implementar"
continue sendo respeitado em espírito, mesmo com o gate de aprovação humana interativa dispensado. O gate
de test-first (escrever testes antes do código de produção) **não** foi dispensado e é seguido
normalmente para todo incremento.

## Escopo

- Endpoint público (guest, sem autenticação) `POST /messages`, que gera 3 opções de mensagem de presente
  via OpenAI `gpt-5-mini`, a partir de `occasion` e `relationship` (texto livre).
- Endpoint público `GET /health` para liveness check.
- Middleware de validação de Firebase ID token, pronto para uso futuro em endpoints protegidos
  (favoritos/histórico), mas **sem** endpoint protegido funcional ainda.
- Rate limiting básico em memória, aplicado a `POST /messages`.
- CORS para permitir chamadas do `web/` a partir do navegador.
- Tratamento de erros de validação e de falhas da OpenAI com status HTTP apropriados.

Fora de escopo: persistência (Firestore), favoritos, histórico, preferências, qualquer endpoint que exija
autenticação de fato.

## Linguagem: TypeScript

O backend é escrito em **TypeScript** (Node.js, compilado para CommonJS).

Toolchain:

- `typescript` como compilador; `tsconfig.json` (base, usado por `tsc --noEmit`, editores e como base do
  `ts-jest`) e `tsconfig.build.json` (estende o base, restrito a `src/`, com `outDir: dist`) para o build
  de produção.
- **`ts-jest`** roda os testes Jest direto contra `.ts`, sem etapa de build separada.
- **`ts-node`** usado só em `npm run dev` (via `node --watch -r ts-node/register src/server.ts`).
- `npm run build` (`tsc -p tsconfig.build.json`) gera `dist/`; `npm run start` builda e roda
  `node dist/server.js` — produção roda JS compilado, não `ts-node`.
- `npm run typecheck` roda `tsc --noEmit -p tsconfig.json`.
- Lint: `.eslintrc.json` usa `@typescript-eslint/parser` + `plugin:@typescript-eslint/recommended`, com
  `no-unused-vars` nativo desligado em favor da versão do plugin (mesmo `argsIgnorePattern` para
  `req`/`res`/`next` não usados em assinaturas de middleware).
- `req.user` (usado pelo middleware de auth do Firebase) é tipado via augmentação de módulo em
  `src/types/express.d.ts`.

Dependências de tipo: `firebase-admin`, `openai` e `dotenv` já publicam seus próprios `.d.ts`. Foram
adicionados `@types/express`, `@types/jest`, `@types/node`, `@types/supertest`.

Justificativa: instrução direta do dono do produto. Tecnicamente, o ganho principal é tipar melhor o
contrato entre validação/controller/service à medida que o backend cresce — a validação em runtime
continua sendo feita como antes (tipagem estática não a substitui, apenas reduz erros de integração
interna entre módulos).

<details>
<summary>Decisão original (revertida) — JavaScript puro</summary>

Decisão original: JavaScript puro (Node.js, CommonJS), sem TypeScript, com a justificativa de que a API
era pequena o suficiente para não justificar a etapa de build/config extra. Revertida pelo dono do produto
para TypeScript logo na rodada seguinte; todo o código de `src/` e `tests/` foi migrado de `.js` para
`.ts` sem alterar comportamento observável.

</details>

## Estrutura de pastas

```
backend/
├── package.json
├── .env.example
├── jest.config.js
├── tsconfig.json                  # base: usado por tsc --noEmit, ts-jest e editores
├── tsconfig.build.json            # estende o base; usado por `npm run build` (gera dist/)
├── .eslintrc.json
├── src/
│   ├── app.ts                     # monta o Express app (sem listen) — usado pelos testes e pelo server
│   ├── server.ts                  # ponto de entrada: lê PORT e chama app.listen
│   ├── types/
│   │   └── express.d.ts           # augmentação de módulo: tipa req.user (Firebase DecodedIdToken)
│   ├── config/
│   │   └── env.ts                 # lê e valida variáveis de ambiente necessárias
│   ├── routes/
│   │   ├── messagesRouter.ts      # define POST /messages
│   │   └── healthRouter.ts        # define GET /health
│   ├── controllers/
│   │   ├── messagesController.ts  # orquestra validação + service + resposta HTTP
│   │   └── healthController.ts    # liveness check simples, sem dependências externas
│   ├── validators/
│   │   └── messagesValidator.ts   # validação manual de occasion/relationship
│   ├── services/
│   │   └── openaiService.ts       # encapsula chamada à OpenAI (gpt-5-mini)
│   ├── middleware/
│   │   ├── rateLimiter.ts         # rate limit básico em memória, por IP
│   │   ├── errorHandler.ts        # error handler central do Express
│   │   ├── cors.ts                # CORS manual (sem dependência nova)
│   │   └── firebaseAuth.ts        # middleware de validação de Firebase ID token (preparado, não usado ainda)
│   ├── firebase/
│   │   └── firebaseAdmin.ts       # inicialização lazy do Firebase Admin SDK
│   └── errors/
│       └── AppError.ts            # classe de erro de aplicação com status + code
├── dist/                          # gerado por `npm run build` (tsc), ignorado pelo git
└── tests/
    ├── unit/
    │   ├── messagesValidator.test.ts
    │   ├── openaiService.test.ts
    │   ├── rateLimiter.test.ts
    │   ├── cors.test.ts
    │   ├── firebaseAuth.test.ts
    │   └── errorHandler.test.ts
    └── integration/
        ├── messagesRoute.test.ts
        └── healthRoute.test.ts
```

`src/app.ts` exporta o Express app sem chamar `listen`, permitindo que os testes de integração usem
`supertest` diretamente contra o app, sem subir uma porta real.

## Framework de testes

**Jest** como test runner + **supertest** para testes de integração HTTP.

Justificativa: Jest é o padrão de fato para projetos Node/Express sem necessidade de configuração
adicional de ESM/TS; supertest é a ferramenta padrão para testar rotas Express sem subir um servidor real
em uma porta.

Organização: `tests/unit/` para validação, service da OpenAI (com mocks), rate limiter, CORS, middleware
de auth do Firebase e error handler isolados; `tests/integration/` para o fluxo HTTP completo de
`/messages` (com o cliente OpenAI mockado via `jest.mock`) e `/health`.

Transpilação: **`ts-jest`** — os testes rodam direto contra os arquivos `.ts` via `jest.config.js`
(`preset: 'ts-jest'`), sem etapa de build separada antes de `npm test`.

Cobertura mínima: sem número arbitrário definido — o critério é que todo caminho de validação, sucesso e
erro de cada endpoint, e toda decisão de cada middleware (rate limiter, CORS, auth, error handler), tenha
pelo menos um teste.

## Estratégia de validação de input

Validação manual (sem biblioteca externa como `zod`/`joi`) — decisão alinhada ao guardrail de não
adicionar dependências sem necessidade técnica clara. Para dois campos string simples, uma função de
validação pura é suficiente e mais fácil de auditar do que introduzir uma dependência nova.

`occasion` e `relationship` são tratados como **texto livre real** digitado pelo usuário (ex.: "50 anos de
casamento dos meus pais, eles adoram viajar juntos"), não rótulos curtos fixos. Regras para
`POST /messages`:

- `occasion`: obrigatório, `string`, não vazio após `trim()`, comprimento entre 1 e 300 caracteres.
- `relationship`: obrigatório, `string`, não vazio após `trim()`, comprimento entre 1 e 300 caracteres.
- Campos extras no body são ignorados (não causam erro).
- Corpo ausente, não-JSON, ou campos com tipo errado (ex.: número, array, objeto) retornam erro de
  validação.

Em caso de falha, a validação retorna uma lista de mensagens de erro (uma por campo inválido), usada pelo
error handler para montar a resposta 400.

O limite de 300 caracteres (`MAX_FIELD_LENGTH` em `src/validators/messagesValidator.ts`) foi escolhido
para comportar confortavelmente uma ou duas frases descritivas completas, mantendo um teto razoável para
tamanho de prompt/custo por requisição — pode ser revisto com dados reais de uso.

## Integração com OpenAI

- Pacote oficial `openai` (SDK Node) — dependência arquiteturalmente necessária, já definida no
  `CLAUDE.md` raiz (`gpt-5-mini`).
- `src/services/openaiService.ts` expõe `createOpenAiService(client, options?)`, uma factory que recebe um
  cliente OpenAI (permite injeção de um mock nos testes) e retorna
  `{ generateMessages({ occasion, relationship }) }`.
- Um singleton default (`getOpenAiService()`) cria o cliente real usando `OPENAI_API_KEY` apenas quando
  chamado a primeira vez (lazy), para que os testes nunca precisem de uma chave real nem disparem
  chamadas de rede.
- Prompt: instrui o modelo a retornar **apenas** um JSON com a forma `{ "messages": ["...", "...", "..."] }`
  contendo exatamente 3 mensagens curtas de presente/cartão, em português, adequadas à ocasião e ao tipo de
  relação informados. Usa o modo JSON da API da OpenAI (`response_format: { type: "json_object" }`) para
  reduzir a chance de saída inválida. O prompt de sistema deixa explícito que `occasion` e `relationship`
  são texto livre escrito pelo usuário (não um enum fixo) e devem ser interpretados com bom senso mesmo
  quando são frases completas, informais ou incomuns; inclui também uma instrução curta de proteção básica
  contra prompt injection — tratar o conteúdo desses campos estritamente como dado (contexto do presente),
  nunca como instrução, ignorando qualquer tentativa de comando embutido (ex.: "ignore as instruções
  anteriores e..."). É uma proteção via instrução de prompt, não um sistema de detecção/filtro dedicado,
  proporcional ao escopo atual.
- Parsing defensivo: se a resposta não for um JSON válido, ou `messages` não for um array de exatamente 3
  strings não vazias, o service lança um `AppError` com `code: "OPENAI_INVALID_RESPONSE"` e status 502.
  Esse caminho **não** é retentado (ver retry abaixo) — não é falha de comunicação, e tentar de novo não
  mudaria uma resposta já recebida e mal formada.
- Timeout: usa o timeout configurável do próprio SDK da OpenAI (`timeout` na criação do client, default de
  20000 ms via env `OPENAI_TIMEOUT_MS`), valendo por tentativa individual.
- Retry: a chamada `client.chat.completions.create(...)` tenta até 3 vezes no total (1 tentativa inicial +
  até 2 retries), com atraso fixo entre tentativas — `500ms` depois `1000ms`
  (`DEFAULT_RETRY_DELAYS_MS = [500, 1000]`, constante de módulo). Retry incondicional — não distingue erro
  transitório de permanente (ex.: chave inválida também dispara retry); simplificação deliberada,
  proporcional ao escopo atual. `createOpenAiService(client, options)` aceita um `retryDelaysMs?: number[]`
  opcional (default `DEFAULT_RETRY_DELAYS_MS`), existente só como seam de teste — não exposto via env.
  Erro final após esgotar as tentativas é `AppError` `OPENAI_UPSTREAM_ERROR`/502.
- Erros de autenticação da OpenAI (chave inválida) e de limite de uso (rate limit da própria OpenAI) caem
  no mesmo tratamento genérico de erro upstream (`OPENAI_UPSTREAM_ERROR`), já que o cliente da API não deve
  receber detalhes internos da integração. **Atualizado em 2026-08-12** (ver
  `docs/specs/2026-08-12-backend-generation-improvements-design.md`): esse erro upstream não é mais
  propagado como `502` ao cliente HTTP — o backend agora responde `200` com um fallback fixo de mensagens
  genéricas e `fallback: true`, substituindo o que esta seção descrevia originalmente como "sugestão para
  spec futura".

### Deduplicação de chamadas concorrentes idênticas

Decisão registrada também em `backend/CLAUDE.md` (seção "Integração com OpenAI") e no `CLAUDE.md` raiz
(seção "Arquitetura"): se uma segunda requisição a `POST /messages` chegar com
`occasion`+`relationship` normalizados (`trim()` + `toLowerCase()`) idênticos aos de uma primeira
requisição **ainda em andamento** (aguardando resposta da OpenAI), a segunda reaproveita a mesma chamada
em voo em vez de disparar outra chamada à OpenAI — ambas as requisições HTTP recebem a mesma resposta
(sucesso ou erro) quando a chamada compartilhada resolver.

**Não é cache por tempo.** Assim que a chamada em voo termina (sucesso ou erro), a entrada é removida
imediatamente. Uma requisição que chegue depois que a anterior já terminou gera uma chamada nova de
verdade — o produto quer que o usuário possa pedir "outra opção" com o mesmo texto e receber mensagens
diferentes, sem TTL nem resultado guardado além da vida útil da chamada em voo.

- Mecanismo: `Map<string, Promise<string[]>>` (`inFlightRequests`), guardado dentro do closure de
  `createOpenAiService` em `src/services/openaiService.ts` — um mapa por instância do service, não um
  singleton global no nível do módulo. Isso é suficiente porque `getOpenAiService()` já mantém um único
  singleton do service para todo o processo em produção, e os testes criam suas próprias instâncias via
  `createOpenAiService(client)`, o que também evita vazamento de estado de dedup entre testes.
- Chave de dedup: `normalizeDedupeKey({ occasion, relationship })` aplica `trim()` + `toLowerCase()` em
  cada campo (já validados pelo `messagesValidator` antes de chegar ao service) e serializa como
  `JSON.stringify([occasionNormalized, relationshipNormalized])`.
- Fluxo: `generateMessages(input)` calcula a chave; se já existe uma promise em voo para ela, retorna essa
  mesma promise (todos os callers fazem `await` na mesma promise, recebendo o mesmo resultado ou o mesmo
  erro). Caso contrário, chama a lógica real de geração (função interna `callOpenAi`, que inclui o loop de
  retry descrito acima), encadeia um `.finally()` que remove a entrada do mapa assim que a promise resolver
  ou rejeitar, guarda essa promise encadeada no mapa, e a retorna. A entrada de dedup corresponde a "toda a
  sequência de tentativas (inicial + retries)", não a uma tentativa isolada.
- Escopo da dedup é só o service (`generateMessages`) — não há mudança no controller, na validação, no
  rate limiter ou no formato de resposta HTTP.
- **Não é uma mudança observável no contrato HTTP** — mesmo endpoint, mesmo request/response shape, mesmos
  status codes e formato de erro; a única diferença observável é que duas requisições HTTP concorrentes
  idênticas podem retornar exatamente o mesmo conteúdo de mensagens (o que já era um resultado possível
  antes, apenas menos provável).
- Teste: `tests/unit/openaiService.test.ts` cobre dedup (chamadas concorrentes com o mesmo input resultam
  em uma única invocação do mock e mesmo resultado, tanto no sucesso quanto no erro; chamadas sequenciais
  disparam invocações reais separadas; inputs normalizados diferentes nunca compartilham entrada) e retry
  (sucesso após falha transitória, esgotamento de tentativas, ausência de retry em falha de parsing,
  compartilhamento de uma única sequência de retry entre chamadas deduplicadas).

## Firebase Admin (preparado, sem endpoint protegido ainda)

- `src/firebase/firebaseAdmin.ts`: inicialização lazy do Firebase Admin SDK via
  `admin.initializeApp({ credential: admin.credential.cert({...}) })`, usando `FIREBASE_PROJECT_ID`,
  `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY` (quebras de linha da chave privada escapadas como
  `\n` no `.env`, decodificadas em runtime).
- `src/middleware/firebaseAuth.ts`: middleware Express `verifyFirebaseToken` que lê o header
  `Authorization: Bearer <idToken>`, chama `admin.auth().verifyIdToken(idToken)` e anexa o resultado
  decodificado em `req.user`. Em caso de header ausente, mal formado, ou token inválido/expirado, chama
  `next(new AppError(...))` com status 401 e `code: "UNAUTHENTICATED"`.
- Este middleware é testado isoladamente (com o módulo `firebase-admin` mockado) mas **não é aplicado a
  nenhuma rota** — serve de base para features futuras de favoritos/histórico, que exigirão login. Nenhum
  endpoint atual depende dele.

## Formato de erro HTTP

Todas as respostas de erro seguem o mesmo formato JSON:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descrição legível do erro.",
    "details": [
      "occasion is required",
      "relationship must be a non-empty string"
    ]
  }
}
```

- `code`: string estável em `SCREAMING_SNAKE_CASE`, para o cliente tratar programaticamente.
- `message`: mensagem legível (não necessariamente traduzida — mensagens técnicas em inglês, já que são
  para consumo de log/debug pelos clientes, não exibidas diretamente ao usuário final sem tratamento do
  frontend).
- `details`: opcional, presente apenas quando há detalhes estruturados adicionais (ex.: lista de campos
  inválidos). Omitido quando não aplicável.

Códigos de erro em uso:

| `code`                    | status HTTP | quando ocorre                                                                                   |
| ------------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR`        | 400         | `occasion` ou `relationship` ausentes/inválidos, ou JSON malformado                             |
| `RATE_LIMITED`            | 429         | cliente excedeu o limite de requisições                                                         |
| `PAYLOAD_TOO_LARGE`       | 413         | corpo da requisição excede o limite configurado (`10kb`) — ver "Limite de tamanho do corpo"     |
| `OPENAI_UPSTREAM_ERROR`   | 502         | falha de rede, timeout, erro 5xx ou erro de auth da OpenAI, após esgotar as tentativas de retry |
| `OPENAI_INVALID_RESPONSE` | 502         | resposta da OpenAI não pôde ser interpretada como 3 mensagens válidas                           |
| `UNAUTHENTICATED`         | 401         | (reservado para rotas futuras) Firebase ID token ausente/inválido                               |
| `NOT_FOUND`               | 404         | rota inexistente                                                                                |
| `INTERNAL_ERROR`          | 500         | qualquer erro não esperado                                                                      |

**Atualizado em 2026-08-12:** `OPENAI_UPSTREAM_ERROR` e `OPENAI_INVALID_RESPONSE` continuam existindo como
`AppError` interno lançado por `callOpenAi` (com `status: 502`), mas deixaram de chegar ao cliente HTTP
como `502` no caminho normal — `generateMessages` os captura e responde `200` com fallback (ver
`docs/specs/2026-08-12-backend-generation-improvements-design.md`). Os dois códigos permanecem na tabela
acima porque ainda são o formato de erro genérico do backend, reservado para o caso, não esperado, de uma
falha ocorrer fora do caminho coberto pelo fallback.

### Log de erros de servidor

`src/middleware/errorHandler.ts` loga (`console.error`) qualquer erro tratado como falha de servidor do
ponto de vista do cliente HTTP:

- `AppError` com `status >= 500` (inclui `OPENAI_UPSTREAM_ERROR`/`OPENAI_INVALID_RESPONSE`) gera
  `console.error` com `code`, `message` e um resumo do `cause`, quando presente. Erros não-`AppError`
  (500 genérico) também são logados, como já era o comportamento original.
- `AppError` com `status < 500` (`VALIDATION_ERROR`, `RATE_LIMITED`, `PAYLOAD_TOO_LARGE`) **não** é
  logado — são erros esperados de input do cliente, e logá-los só poluiria o terminal.
- O `cause` nunca é logado como objeto bruto: uma função auxiliar (`summarizeCause`) extrai apenas uma
  allow-list de campos (`name`, `message`, `status`) antes de logar — nunca `headers`/`config`/`request`,
  garantindo que nenhum dado sensível da requisição de saída à OpenAI possa vazar no log,
  independentemente da forma exata do objeto de erro do upstream.

### Limite de tamanho do corpo da requisição

- `src/app.ts`: `express.json({ limit: JSON_BODY_LIMIT })`, com `JSON_BODY_LIMIT = "10kb"` (constante de
  módulo, não configurável por env — não há necessidade identificada de variar esse valor por ambiente).
  Os campos válidos de `POST /messages` somados (300 + 300 caracteres) não chegam a 1kb mesmo com folga de
  encoding/JSON; `10kb` dá margem confortável sem abrir brecha para payloads desproporcionais.
- Quando o limite é excedido, o body-parser interno do Express (pacote `raw-body`) lança um erro com
  `status`/`statusCode: 413` e `type: "entity.too.large"` **antes** de qualquer validação de campo rodar.
  `errorHandler.ts` detecta esse erro (`isPayloadTooLargeError`, mesmo padrão de `isBodyParserSyntaxError`
  para JSON inválido) e responde `413` no formato padrão de erro. Como é um erro esperado de input do
  cliente, não é logado via `console.error`.
- Como `express.json()` é global, o limite vale para qualquer rota que aceite corpo — hoje isso só afeta
  `POST /messages` na prática, já que é a única rota com body.

## Rate limiting

Implementação própria, mínima, em memória (sem dependência nova):

- `src/middleware/rateLimiter.ts` exporta uma factory `createRateLimiter({ windowMs, max })` que retorna
  um middleware Express.
- Estratégia: janela fixa (_fixed window_) por chave (IP do cliente, via `req.ip`). Um `Map` guarda,
  por chave, `{ count, windowStart }`. A cada requisição, se a janela expirou, reseta o contador; senão
  incrementa. Se `count > max`, responde 429 com `code: "RATE_LIMITED"` e não chama a lógica da rota.
- Defaults (via env, com fallback): `RATE_LIMIT_WINDOW_MS=60000` (1 minuto), `RATE_LIMIT_MAX_REQUESTS=10`
  (10 requisições por IP por minuto). Valores conservadores para o MVP guest-first, ajustáveis depois com
  dados reais de uso — não há persistência entre reinícios do processo (aceitável para um rate limit
  best-effort de MVP; um rate limit distribuído/persistente é explicitamente fora de escopo).
- Aplicado apenas à rota `POST /messages` (a única rota que consome a OpenAI e portanto tem custo/risco de
  abuso).

## CORS

`web/` (`http://localhost:3000`) chama o backend (`http://localhost:3001`) direto do navegador via
`fetch` client-side, o que exige tratamento de CORS, incluindo o preflight `OPTIONS` disparado por
`Content-Type: application/json`.

- **Implementação manual, sem dependência nova** (`src/middleware/cors.ts`, factory
  `createCorsMiddleware({ origin })`, mesmo padrão de `createRateLimiter`) — não o pacote `cors` do npm.
  Justificativa: o requisito é pequeno e estático (uma única origem configurável, sem necessidade de
  refletir dinamicamente múltiplas origens, sem cookies/credentials, sem lista de origens permitidas por
  ambiente) — setar três headers e responder `204` no `OPTIONS` não justifica uma dependência nova, mesmo
  sendo o `cors` uma lib pequena e padrão da comunidade Express.
- Middleware **global**, montado em `src/app.ts` **antes** de `express.json()` e de qualquer rota —
  garante que toda resposta (sucesso, erro de validação, rate limit, erro upstream da OpenAI, 404, 500)
  carregue os headers de CORS, e que o preflight `OPTIONS` seja respondido sem passar por body-parsing ou
  pelas rotas.
- Headers setados em toda resposta: `Access-Control-Allow-Origin` (valor fixo configurado via
  `CORS_ORIGIN`, não reflete dinamicamente o header `Origin` da requisição — origem única, não é uma
  lista), `Access-Control-Allow-Methods: POST,OPTIONS`, `Access-Control-Allow-Headers:
Content-Type,Authorization` (`Authorization` incluído desde já para não quebrar CORS no dia em que
  `verifyFirebaseToken` for aplicado a uma rota — isso não introduz comportamento de autenticação novo),
  e `Vary: Origin`.
- Requisição `OPTIONS`: o middleware responde `204` diretamente e não chama `next()` — a requisição não
  chega ao rate limiter nem ao controller.
- Não há suporte a múltiplas origens nem lista de origens por ambiente — apenas uma origem configurável
  via `CORS_ORIGIN`. Se `web/` ganhar múltiplos domínios (ex.: staging, produção) no futuro, isso é uma
  extensão a ser tratada em spec própria.

## `GET /health`

Endpoint sem autenticação, para liveness check: só confirma que o processo está respondendo, sem checar
conectividade com OpenAI/Firebase (checar dependências externas tornaria a latência/disponibilidade desse
endpoint dependente delas, o que não é o objetivo de uma liveness probe).

- `src/controllers/healthController.ts`: `getHealth(req, res)` retorna `200` com `{ "status": "ok" }`.
- `src/routes/healthRouter.ts`: monta `GET /` (dentro do prefixo `/health` aplicado em `app.ts`), mesmo
  padrão de `messagesRouter.ts`/`messagesController.ts`.
- Montado em `src/app.ts` como `app.use("/health", healthRouter)`, depois do CORS e do `express.json()`.

## Variáveis de ambiente (`.env.example`)

```
# Server
PORT=3001
NODE_ENV=development

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
OPENAI_TIMEOUT_MS=20000

# Firebase Admin (preparado para uso futuro — endpoints protegidos ainda não existem)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10

# CORS — origem do front-end (Web) autorizada a chamar este backend do navegador
CORS_ORIGIN=http://localhost:3000
```

`src/config/env.ts` centraliza a leitura dessas variáveis com defaults para as não-sensíveis (porta,
janela de rate limit) e falha de forma clara (lança erro na inicialização do processo, não durante uma
requisição) se `OPENAI_API_KEY` estiver ausente **em produção** — em teste (`NODE_ENV=test`) a ausência é
tolerada, já que a OpenAI é sempre mockada nos testes.

## Contrato HTTP

`docs/contracts/api-contracts.md` é a fonte única de verdade do contrato HTTP — este documento não
duplica seu conteúdo. Endpoints atuais: `POST /messages` e `GET /health`, ambos guest (sem autenticação).
Toda mudança observável de contrato (novo endpoint, status/code de erro, headers de CORS etc.) deve estar
refletida lá; a última auditoria de sincronização (nesta rodada de limpeza) confirmou que `api-contracts.md`
já cobre `GET /health`, `413 PAYLOAD_TOO_LARGE` e os headers de CORS descritos acima.

## Dependências

- `express` (já decidido no `CLAUDE.md` raiz).
- `openai` (SDK oficial — necessário para integração com `gpt-5-mini`, decidido no `CLAUDE.md` raiz).
- `firebase-admin` (já decidido no `CLAUDE.md` raiz).
- `dotenv` (carregar `.env` em desenvolvimento local — padrão de mercado, evitado em produção onde as
  variáveis vêm do ambiente de deploy).
- Dev: `jest`, `supertest`, `eslint`, `typescript`, `ts-jest`, `ts-node`, `@types/express`, `@types/jest`,
  `@types/node`, `@types/supertest`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`.
  `firebase-admin`, `openai` e `dotenv` já publicam seus próprios tipos, não precisando de pacotes
  `@types/*` correspondentes.

Nenhuma outra dependência (validação, rate limit, CORS) foi adicionada — implementadas em TypeScript sem
bibliotecas externas, conforme justificado nas seções correspondentes.
