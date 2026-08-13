# backend/ — smash-gift

Módulo Node.js + Express do smash-gift. Leia primeiro o `CLAUDE.md` da raiz do repositório — as regras
cross-module de idioma, guardrails, escopo e papel de orquestrador valem aqui também.

## Status

O backend tem spec técnica própria, aprovada e implementada:
`docs/specs/2026-08-12-backend-technical-design.md`. Leia essa spec antes de alterar qualquer decisão de
arquitetura, estrutura de pastas, validação, autenticação, rate limit, estratégia de resiliência da
integração com a OpenAI, observabilidade ou testes — ela é a fonte de verdade para esses detalhes, não
este arquivo.

Este `CLAUDE.md` registra apenas o resumo estável dessas decisões e as regras de processo do módulo.
Qualquer decisão arquitetural nova (não apenas uma extensão do que já existe) continua exigindo uma
atualização da spec técnica antes da implementação — não invente decisões aqui nem diretamente no código.

## O que já está decidido

- O backend utiliza Node.js + Express, escrito em **TypeScript** (compilado para CommonJS via `tsc`).
  `ts-jest` roda os testes direto contra `.ts`; `ts-node` é usado só em `npm run dev`; `npm run build`
  gera `dist/` para produção. Ver spec técnica para o detalhe completo da toolchain.
- É um projeto Node standalone, com `package.json`, `package-lock.json` e `node_modules/` próprios —
  sem workspace ou dependência de nada na raiz do repositório ou em `web/`.
- Responsabilidades sensíveis ficam no backend, nunca nos clientes.
- A integração com a LLM utiliza OpenAI `gpt-5-mini`, com deduplicação de chamadas concorrentes idênticas
  (ver seção "Integração com OpenAI" abaixo), retry com backoff fixo para falhas transitórias, fallback
  seguro quando a OpenAI falha mesmo após os retries, limite de output tokens configurável e cache
  persistente no Firestore por match exato entre usuários (TTL configurável, default 6h) — ver
  `docs/specs/2026-08-12-backend-generation-improvements-design.md`.
- Firebase Admin SDK é usado para validar tokens Firebase Auth enviados pelos clientes. O middleware
  `verifyFirebaseToken` já existe e é testado isoladamente, mas ainda não está aplicado a nenhuma rota —
  não há endpoint protegido/autenticado nesta rodada (fica pronto para favoritos/histórico futuros).
- O backend é responsável pela orquestração de prompts para a LLM.
- O backend é responsável pelas validações (manuais, sem biblioteca externa) e pelas regras de negócio
  protegidas.
- Rate limiting (janela fixa em memória, por IP) e CORS (middleware manual, origem única via
  `CORS_ORIGIN`) já estão implementados. Extensões significativas dessas estratégias (ex.: múltiplas
  origens, rate limit distribuído) passam por atualização da spec antes de implementadas.
- Framework de testes já definido e em uso: **Jest** + **supertest** (ver seção "Testes" abaixo).

## Contrato HTTP

`docs/contracts/api-contracts.md` é a fonte única de verdade do contrato HTTP consumido por Web e Mobile.

Qualquer mudança observável no contrato HTTP deve atualizar esse documento na mesma tarefa, incluindo:

- endpoint;
- método;
- path;
- parâmetros;
- autenticação;
- request;
- response;
- status code;
- formato de erro.

Nenhum comportamento de API deve ser considerado concluído enquanto o contrato correspondente estiver
desatualizado.

## Segurança

- Nunca expor chaves da OpenAI, Firebase Admin ou outros secrets aos clientes.
- Nunca aceitar autorização baseada apenas em dados enviados pelo frontend.
- Tokens Firebase devem ser validados no backend via Firebase Admin quando uma operação exigir
  autenticação.
- Dados recebidos de Web e Mobile devem ser tratados como não confiáveis e validados antes do uso.
- Não registrar tokens, secrets ou conteúdo sensível sem necessidade explícita definida na spec.
- Integrações externas que exigem segredo devem ocorrer exclusivamente no backend.

## Integração com OpenAI

O frontend e o aplicativo mobile não acessam diretamente a OpenAI.

Toda geração de conteúdo passa pelo backend.

A estratégia detalhada de construção de prompt, validação de entrada, parâmetros do modelo, timeout,
retry, rate limiting e tratamento de erro já está definida e implementada — ver
`docs/specs/2026-08-12-backend-technical-design.md` para o detalhe completo (prompt em
`src/services/openaiService.ts`, validação de 1 a 300 caracteres por campo em
`src/validators/messagesValidator.ts`, timeout via `OPENAI_TIMEOUT_MS`, retry com backoff fixo de até 2
tentativas adicionais, rate limiting em memória por IP). Mudanças nessas estratégias devem ser refletidas
na spec técnica, não decididas ad hoc no código.

**Fallback, limite de tokens e cache (ver `docs/specs/2026-08-12-backend-generation-improvements-design.md`
para o detalhe completo):** quando a OpenAI falha (erro upstream após esgotar os retries, ou resposta que
não pôde ser interpretada como 3 mensagens válidas), o backend **não propaga mais `502`** — retorna `200`
com um conjunto fixo de 3 mensagens genéricas pré-definidas (`FALLBACK_MESSAGES` em
`src/services/openaiService.ts`) e `fallback: true` no corpo da resposta; a falha real continua sendo
logada via `console.error`. A chamada à OpenAI usa `max_completion_tokens` configurável via
`OPENAI_MAX_OUTPUT_TOKENS` (default 600) e `reasoning_effort: "minimal"` — **não** `max_tokens` (o
`gpt-5-mini` rejeita com `400 Unsupported parameter`) e **não** sem `reasoning_effort` (o `gpt-5-mini` é
um modelo de raciocínio que consome parte do orçamento de tokens com raciocínio interno antes do
conteúdo visível; sem `reasoning_effort: "minimal"`, um teto baixo como 400 é inteiramente consumido pelo
raciocínio e o `content` volta vazio). Ambos achados em teste manual real em 2026-08-12, não pegos pelos
testes unitários porque o client da OpenAI é mockado neles — ver
`docs/specs/2026-08-12-backend-generation-improvements-design.md` para a tabela de evidência. Antes de
chamar a
OpenAI, o service consulta um cache persistente no Firestore (`messageCache/{hash}`,
`src/services/messageCache.ts`) por match exato entre `occasion`+`relationship` normalizados — se houver
hit, reaproveita o resultado sem chamar a OpenAI (`cached: true` na resposta), aplicado a qualquer
usuário (guest ou autenticado), com TTL configurável via `MESSAGE_CACHE_TTL_MS` (default 6h) — entradas
mais velhas são tratadas como miss. O cache degrada para no-op automaticamente se o Firebase Admin
não estiver configurado (ambiente sem projeto Firebase real) — nunca é um requisito rígido para
`POST /messages` funcionar.

**Já decidido:** chamadas concorrentes idênticas (mesmo `occasion`+`relationship` normalizado) devem ser
deduplicadas — se uma segunda requisição chegar enquanto a primeira ainda está em andamento, ela
reaproveita o resultado em voo em vez de disparar outra chamada à OpenAI. Isso não é cache por tempo:
uma requisição feita depois que a anterior já terminou deve gerar um resultado novo normalmente. Ver
princípio geral em `CLAUDE.md` (raiz), seção "Arquitetura".

## Fronteiras do módulo

O Backend é responsável por:

- expor o contrato HTTP da aplicação;
- validar entradas recebidas dos clientes;
- executar regras de negócio protegidas;
- integrar com OpenAI;
- validar autenticação via Firebase Admin;
- proteger credenciais e integrações sensíveis;
- implementar rate limiting e estratégias de resiliência definidas em spec;
- fornecer respostas consistentes para Web e Mobile.

O Backend não é responsável por:

- implementar comportamento visual;
- controlar estado de interface;
- armazenar secrets nos clientes;
- assumir regras específicas de apresentação de Web ou Mobile;
- alterar unilateralmente comportamentos de produto definidos em specs aprovadas;
- criar dependências arquiteturais com Web ou Mobile.

## Nomenclatura

- Código e nomes técnicos são escritos em inglês.
- Arquivos, funções, variáveis, classes, tipos e rotas usam nomenclatura em inglês.
- Funções e variáveis usam camelCase.
- Classes e tipos seguem as convenções idiomáticas de TypeScript ou JavaScript.
- Paths HTTP seguem as convenções definidas em `docs/contracts/api-contracts.md`.

## Testes

Framework já definido e em uso: **Jest** + **supertest**. `tests/unit/` cobre validação, o service da
OpenAI (com mocks), rate limiter, CORS, middleware de auth do Firebase e error handler isoladamente;
`tests/integration/` cobre o fluxo HTTP completo de `/messages` e `/health` via `supertest` contra
`src/app.ts` (sem subir uma porta real). Ver `docs/specs/2026-08-12-backend-technical-design.md` para a
justificativa e organização detalhada.

Toda nova funcionalidade ou correção segue o fluxo test-first definido no `CLAUDE.md` raiz e na skill
`superpowers:test-driven-development` — os testes já existentes não dispensam esse fluxo para o próximo
incremento.

Não há número de cobertura mínima arbitrário definido: o critério é que todo caminho de validação,
sucesso e erro de cada endpoint, e toda decisão de cada middleware (rate limiter, CORS, auth, error
handler), tenha pelo menos um teste.

Veja também `.claude/agents/backend-agent.md`.
