# Spec — Melhorias de geração no backend: resiliência, custo e variedade (smash-gift)

- **Data:** 2026-08-12
- **Status:** Aprovado (ver "Nota de processo")
- **Autor:** Orquestrador (sessão principal do Claude Code), com decisões de escopo confirmadas pelo dono
  do produto via `superpowers:brainstorming`

## Nota de processo

O dono do produto trouxe 5 propostas de melhoria em conversa direta com o orquestrador. As decisões de
escopo abaixo (fallback, limite de tokens, cache por match exato reaproveitando o Firestore, variedade de
tom sem mudança de contrato nesta rodada) foram confirmadas explicitamente por ele antes deste documento
ser escrito — incluindo a autorização para implementar em sequência com autonomia, delegando ao
`backend-agent`. O gate de test-first **não** foi dispensado: todo incremento abaixo segue TDD normalmente.

Esta spec substitui, para os pontos abaixo, o que `docs/specs/2026-08-12-backend-technical-design.md`
documentava como decisões finais — em especial a seção "Erros de autenticação da OpenAI... Fallback para
mensagens genéricas pré-definidas não existe nesta rodada" e a ausência de qualquer cache persistente.
`docs/specs/2026-08-12-backend-technical-design.md` continua sendo a fonte de verdade para tudo que não é
alterado aqui (estrutura de pastas, integração OpenAI de base, rate limiting, CORS, etc.).

## Contexto e motivação

Comparando o projeto com os requisitos do teste técnico de referência
(`github.com/smash-gift/fullstack-dev-test`), dois critérios de avaliação não estão cobertos hoje:

- "Error Handling: graceful failure management and safe responses when LLM unavailable" — hoje uma falha
  da OpenAI (após esgotar retries) propaga `502 OPENAI_UPSTREAM_ERROR`/`OPENAI_INVALID_RESPONSE` ao
  cliente, sem nenhuma resposta de fallback.
- "Documented decisions regarding... cost reduction strategies, and caching considerations" — hoje não há
  nenhuma estratégia de redução de custo além da deduplicação de chamadas concorrentes idênticas (que não
  é cache, só evita duplicidade instantânea).

Além disso, o dono do produto identificou que, como o mesmo contexto (ocasião + relação) pode se repetir
entre usuários diferentes, reaproveitar gerações passadas quando o contexto é idêntico reduz custo de LLM
sem prejudicar a variedade percebida por um mesmo usuário pedindo "gerar outras opções" (esse caso
continua sempre gerando conteúdo novo — ver "Interação com a deduplicação existente").

## 1. Fallback seguro quando a OpenAI falha

**Comportamento novo:** quando `generateMessages` esgota as tentativas de retry (`OPENAI_UPSTREAM_ERROR`)
ou recebe uma resposta que não pode ser interpretada como 3 mensagens válidas
(`OPENAI_INVALID_RESPONSE`), o backend **não propaga mais um erro 502** para esses dois casos. Em vez
disso, `POST /messages` responde `200` com um conjunto fixo de 3 mensagens genéricas
pré-escritas (adequadas a qualquer ocasião/relação, em português) e `"fallback": true` no corpo da
resposta.

Casos que continuam sendo erro normal (não fallback): `VALIDATION_ERROR` (400), `PAYLOAD_TOO_LARGE`
(413), `RATE_LIMITED` (429), `NOT_FOUND` (404), `INTERNAL_ERROR` (500) — nenhum desses é "a LLM está
indisponível", são problemas de input ou de infraestrutura do próprio backend, e devem continuar sendo
comunicados como erro.

**Onde vive o fallback:** as 3 mensagens fixas ficam como constante em
`src/services/openaiService.ts` (`FALLBACK_MESSAGES: string[]`), não em config/env — são conteúdo de
produto, não parâmetro de ambiente.

**Observabilidade:** o caminho de fallback é logado via `console.error` (mesmo padrão de
`summarizeCause` já usado no error handler) antes de retornar a resposta 200, para que a falha real da
OpenAI continue visível em log mesmo não sendo mais visível para o cliente HTTP.

**Contrato HTTP:** campo novo `fallback: boolean` na resposta de sucesso de `POST /messages` — presente
em toda resposta (não só quando `true`), para o cliente não precisar tratar a ausência do campo como
"false" implícito. Mudança de contrato — `api-contracts.md` é atualizado na mesma tarefa da implementação
(quem atualiza: orquestrador, conforme handoff do `backend-agent`).

## 2. Limite de output tokens

`client.chat.completions.create(...)` passa a incluir `max_completion_tokens`, limitando o tamanho da
resposta da OpenAI. Objetivo: reduzir custo por chamada e latência, já que o formato de saída é sempre um
JSON pequeno (3 mensagens de 1 a 3 frases cada).

**Correção em 2026-08-12 (achado em teste manual real, não pego pelos testes unitários):** a primeira
implementação usou o parâmetro `max_tokens`, que o `gpt-5-mini` rejeita com
`400 Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens'
instead.` — isso quebrava **toda** chamada real à OpenAI (retry incondicional esgotava as 3 tentativas e
sempre caía no fallback do item 1, escondendo o problema atrás de uma resposta `200` aparentemente
normal). Os testes unitários não pegaram porque o client da OpenAI é mockado neles e não valida nomes de
parâmetro contra a API real. O nome correto do parâmetro é `max_completion_tokens`.

- Novo env var `OPENAI_MAX_OUTPUT_TOKENS`, default `600` (ver "Correção 2" abaixo sobre por que não é
  `400`). Lido em `src/config/env.ts`, mesmo padrão de `OPENAI_TIMEOUT_MS`.
- Não é uma mudança de contrato HTTP — é um parâmetro interno da chamada à OpenAI, não observável pelo
  cliente (a não ser indiretamente, se a LLM cortar uma mensagem por estourar o limite — ver teste
  abaixo).
- Teste: garantir que `max_completion_tokens` e `reasoning_effort: "minimal"` são passados corretamente ao
  client mockado; **não** é possível testar de forma determinística o comportamento da OpenAI truncando
  conteúdo real — isso fica coberto pela validação já existente (`isValidMessagesArray`), que já rejeita
  respostas malformadas e aciona o fallback do item 1 se a OpenAI devolver algo inválido por causa do
  corte.

**Correção 2 em 2026-08-12 (achada em teste manual real, novo erro depois da correção 1):** com o nome do
parâmetro já corrigido, o backend passou a devolver `200 OPENAI_INVALID_RESPONSE`→fallback em toda
chamada real — `JSON.parse` falhando porque o `content` da resposta vinha **vazio**. Causa raiz:
`gpt-5-mini` é um modelo de raciocínio (_reasoning model_) — ele consome parte do orçamento de
`max_completion_tokens` com tokens de raciocínio interno (`reasoning_tokens`, não visíveis, cobrados
normalmente) **antes** de gerar o conteúdo visível. Com o default original de `400`, os 400 tokens eram
inteiramente consumidos pelo raciocínio (`reasoning_tokens: 400`, `finish_reason: "length"`), sobrando
zero para o JSON de saída. Testado diretamente contra a API real (fora dos testes unitários, que mockam o
client e não reproduzem esse comportamento):

| `max_completion_tokens` | `reasoning_effort` | `reasoning_tokens` usados | resultado |
| --- | --- | --- | --- |
| 400 | (default do modelo) | 400 (100% do orçamento) | `content` vazio, `finish_reason: "length"` — falha |
| 600–800 | (default do modelo) | 256–448 (varia por chamada) | funciona, mas caro e imprevisível |
| 300–500 | `"minimal"` | 0 | funciona, barato, testado em 3 cenários reais distintos (aniversário, formatura, condolências) |

Correção: a chamada passa a incluir `reasoning_effort: "minimal"` (suportado pelo SDK `openai` instalado,
`v4.104.0`), eliminando o consumo de tokens de raciocínio ocultos para este caso de uso (saída curta e
estruturada, sem necessidade de raciocínio profundo). O default de `OPENAI_MAX_OUTPUT_TOKENS` sobe de
`400` para `600` como margem de segurança (o conteúdo real observado usa 111–133 tokens de completion
total com `reasoning_effort: "minimal"`), não como compensação pelo raciocínio — com raciocínio mínimo,
600 é folga generosa, não o mínimo necessário. Isso também serve melhor o objetivo original de redução de
custo do que só levantar o teto sem `reasoning_effort`: menos tokens cobrados por chamada, não só um teto
mais alto para evitar corte.

## 3. Cache persistente de gerações (Firestore, match exato)

**Objetivo:** quando duas requisições — de qualquer usuário, guest ou autenticado — têm `occasion` e
`relationship` normalizados (mesma normalização já usada na dedup: `trim()` + `toLowerCase()`)
**idênticos**, a segunda reaproveita o resultado já gerado, sem chamar a OpenAI de novo.

**Por que match exato (não similaridade semântica):** o dono do produto validou essa abordagem
explicitamente. Match exato é simples, sem custo adicional (nenhuma chamada de embedding) e sem
superfície nova de erro (limiar de similaridade, falso positivo). A taxa de acerto será menor do que uma
abordagem semântica dado que os campos são texto livre, mas é a opção de menor risco e menor complexidade
operacional para o escopo atual — pode ser revisitada com dados reais de hit rate.

**Por que se aplica a guest e autenticado:** o cache é acessado exclusivamente pelo backend via Firebase
Admin SDK — nunca por leitura direta do cliente — então não existe fronteira de autorização/autenticação
relevante aqui (diferente de `users/{uid}/history`, que É lido diretamente pelos clientes autenticados, e
por isso precisa de regras de segurança por uid). Restringir o cache a usuários autenticados deixaria de
fora a maior parte do tráfego real (guest é o caminho principal do produto), reduzindo a maior parte do
ganho de custo pretendido.

**Modelo de dados — nova coleção Firestore `messageCache`:**

```
messageCache/{cacheKeyHash}
  occasion: string       # valor original (não normalizado), para depuração
  relationship: string   # valor original (não normalizado), para depuração
  messages: string[]     # as 3 mensagens geradas
  createdAt: Timestamp
  hitCount: number        # incrementado a cada reaproveitamento; começa em 0
```

**TTL (decisão revista em 2026-08-12, após revisão de código):** entradas expiram
`MESSAGE_CACHE_TTL_MS` depois de `createdAt` (default `21600000` ms = 6 horas, configurável, mesmo padrão
de leitura de env das demais variáveis do backend). Não é um campo novo no documento — a checagem de
expiração é feita em `get()` comparando `Date.now()` contra `createdAt` lido do próprio documento; uma
entrada expirada é tratada como cache miss (não incrementa `hitCount`, não é deletada explicitamente —
uma escrita `set()` subsequente para a mesma chave a sobrescreve normalmente com `createdAt` novo). Ver
"Por que TTL" abaixo para o motivo desta decisão.

- `cacheKeyHash`: SHA-256 (hex) da mesma string usada como chave de dedup (`normalizeDedupeKey`), gerado
  com o módulo nativo `crypto` do Node (`crypto.createHash("sha256")`) — sem dependência nova. Necessário
  porque IDs de documento do Firestore têm restrições de tamanho/caracteres e não devem expor o texto do
  usuário diretamente no ID.
- Regras de segurança (`firestore.rules`, em `docs/contracts/firestore-schema.md`): `messageCache` nega
  leitura e escrita para qualquer client (`allow read, write: if false`) — só o Admin SDK do backend
  acessa, que ignora regras de segurança por design. Isso é uma mudança em artefato compartilhado, que o
  orquestrador aplica na mesma tarefa (ver "Contrato HTTP e artefatos compartilhados").

**Fluxo em `generateMessages`:**

1. Normaliza a chave (já existente) e calcula o hash.
2. Consulta `messageCache/{hash}` no Firestore. Se existir, o `messages` for válido (ver item de validação
   abaixo) e a entrada não tiver expirado (`Date.now() - createdAt <= MESSAGE_CACHE_TTL_MS`): incrementa
   `hitCount` (best-effort, não bloqueia a resposta) e retorna `messages` do cache imediatamente — nenhuma
   chamada à OpenAI. Uma entrada corrompida (ex.: `messages` ausente/vazio/malformado) ou expirada é
   tratada como miss, sem afetar a resposta ao cliente.
3. Se não existir: segue o fluxo atual (dedup de chamadas concorrentes → `callOpenAi` com retry → fallback
   se falhar). Em caso de sucesso (não fallback), grava o resultado em `messageCache/{hash}` antes de
   retornar — a escrita é best-effort: se falhar, é logada via `console.error` e **não** afeta a resposta
   ao cliente (cache é otimização, não requisito de corretude).
4. Resultados de fallback (item 1) **não são gravados no cache** — não fazem sentido reaproveitar um
   conjunto de mensagens genéricas como se fosse o resultado real para aquele contexto.

**Interação com a deduplicação existente:** a dedup em memória (`inFlightRequests`) continua existindo e
roda **antes** da checagem de cache, sem mudança de comportamento — ela resolve o caso "duas requisições
concorrentes com o mesmo input enquanto uma já está em voo"; o cache resolve o caso "uma requisição chega
depois que uma geração anterior (de qualquer usuário) já terminou". São mecanismos complementares, não
conflitantes.

**"Gerar outras opções" — bypass explícito de cache (decisão revista em 2026-08-12):** a primeira versão
desta spec deixava o botão de regenerar sem tratamento especial — ele reenviava `POST /messages` com o
mesmo `occasion`/`relationship`, e dentro da janela de TTL isso retornava cache hit (mesmo conteúdo). O
dono do produto avaliou esse comportamento como um problema real (não faz sentido devolver a mesma
sugestão para quem pediu explicitamente "outra opção") e pediu uma correção específica só para esse
gatilho, sem reabrir o desenho geral do cache.

Solução adotada: campo opcional `regenerate: boolean` no body de `POST /messages` — **mesmo endpoint**,
sem endpoint novo. Quando `regenerate: true`:
- `generateMessages` **pula a leitura do cache** (`cache.get`) e vai direto para o fluxo normal de geração
  (dedup em memória → `callOpenAi` com retry → fallback se falhar).
- O resultado, se for uma geração real (não fallback), **continua sendo gravado no cache** normalmente —
  sobrescrevendo a entrada existente para aquela chave via `cache.set()` (já é `set`, não `create`, então
  isso já acontece sem mudança nenhuma em `messageCache.ts`). Não existe uma operação de "revogar"
  separada — sobrescrever com conteúdo novo já cumpre esse papel para a próxima leitura.
- Quando `regenerate` está ausente ou `false` (comportamento padrão, sem mudança), tudo funciona como já
  documentado acima.

Por que não um endpoint separado: é a mesma operação de geração, só muda um critério de leitura do cache
— um endpoint novo duplicaria validação, rate limiting e testes para representar uma variação de
comportamento, não um recurso diferente. Por que não um header HTTP (`Cache-Control: no-cache`) em vez de
campo no body: tecnicamente mais "idiomático HTTP", mas mistura semântica de cache HTTP genérico com um
comportamento de produto específico, e exigiria adicionar o header à lista de `Access-Control-Allow-Headers`
do CORS; um campo explícito no body é mais direto de ler e consistente com o resto do contrato desta API
(que já é todo baseado em campos JSON, não headers customizados).

Interação com dedup: **inalterada**. Duas requisições concorrentes com `regenerate: true` e a mesma chave
ainda compartilham a mesma chamada em voo (dedup de chamadas simultâneas continua sendo um mecanismo
ortogonal ao cache persistente — ver "Interação com a deduplicação existente" acima).

**Por que TTL (decisão revista em 2026-08-12, após revisão de código):** a primeira versão desta spec não
tinha expiração — um `code-review` apontou que isso está em tensão com a regra já escrita no `CLAUDE.md`
raiz (seção "Arquitetura"), que diz que o mecanismo de proteção contra chamadas duplicadas "não deve
impedir que uma nova chamada (sequencial, feita depois que a anterior já terminou) gere um resultado novo
— o objetivo é evitar desperdício de chamadas simultâneas idênticas, não limitar variedade/frescor do
resultado ao longo do tempo". O dono do produto, avisado dessa tensão, optou por TTL curto (em vez de
manter sem expiração, ou pular cache só em regeneração explícita) — resolve o problema descrito no
`CLAUDE.md` raiz ("ao longo do tempo") sem exigir mudança de contrato HTTP.

**Métricas de cache hit/miss:**

- Resposta HTTP: campo novo `cached: boolean` em `POST /messages`, mesmo padrão do `fallback` do item 1 —
  presente sempre, `true` só em cache hit.
- Log estruturado por requisição (`console.log`, não `console.error` — não é uma falha): uma linha por
  chamada a `generateMessages` indicando `cached: true|false` e o hash da chave (nunca o texto original
  do usuário, para não inflar logs com PII desnecessário). Suficiente para observar taxa de acerto ao
  longo do tempo sem introduzir uma plataforma de métricas dedicada (fora de escopo — sem necessidade
  técnica clara para o tamanho atual do projeto).

**Dependência nova:** nenhuma — reaproveita `firebase-admin`, já usado pelo backend (`firebaseAdmin.ts`),
só passa a usar também o cliente Firestore do Admin SDK (`admin.firestore()`), que já vem no pacote.

**Resiliência de inicialização (importante):** hoje não há projeto Firebase real provisionado neste
ambiente, e `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` ficam vazios em
`.env.example` — Firebase Admin é "preparado para uso futuro", não uma dependência obrigatória hoje. O
cache **não pode** se tornar um requisito rígido para `POST /messages` funcionar. Se a inicialização do
Firebase Admin ou a criação do cliente Firestore falhar (credenciais ausentes/inválidas), o cache degrada
para um no-op silencioso (sempre miss, escrita descartada), logado uma única vez via `console.error` na
primeira tentativa, e a geração de mensagens continua funcionando normalmente sem cache — mesmo princípio
de fallback gracioso já usado no cliente mobile quando a inicialização do Firebase falha lá.

## 4. Variedade de tom nas 3 mensagens (só nível de prompt, sem mudança de contrato)

O prompt de sistema em `buildPrompt` passa a instruir o modelo a produzir as 3 mensagens com tons
claramente distintos entre si (ex.: uma mais formal, uma mais afetuosa/calorosa, uma mais leve/divertida),
sempre adequados à ocasião e relação informadas — em vez de 3 variações livres que podem sair parecidas
em tom.

**Escopo desta rodada:** só o texto do prompt muda. `messages` continua sendo `string[]` — **nenhuma
mudança de contrato HTTP**, nenhuma mudança em `web/` ou `mobile/` necessária, já que os clientes
continuam recebendo e exibindo 3 strings como já fazem hoje.

**Fora de escopo (sugestão para spec futura, não implementada aqui):** expor o tom de cada mensagem como
um campo estruturado (`messages: { text: string, tone: string }[]`) para o cliente diferenciar
visualmente (badge/label de tom, por exemplo). Isso é uma mudança de contrato que quebra o formato atual
consumido por `web/` e `mobile/` e exige trabalho nos três módulos — reportado aqui como melhoria
identificada, não implementada automaticamente, conforme guardrail de controle de escopo do `CLAUDE.md`
raiz.

**Teste:** como a saída da LLM é nao determinística e mockada nos testes, a cobertura de teste valida que
o prompt de sistema construído contém a instrução de variedade de tom (teste de conteúdo do prompt, não
de comportamento do modelo real) — mesmo padrão já usado para testar outras instruções do prompt.

## Resumo de mudanças de contrato HTTP

`POST /messages`, resposta de sucesso (200) passa a ter, além de `messages`:

```json
{
  "messages": ["...", "...", "..."],
  "cached": false,
  "fallback": false
}
```

- `cached`: `true` quando a resposta veio do cache Firestore (nenhuma chamada à OpenAI foi feita).
- `fallback`: `true` quando a OpenAI falhou (upstream ou resposta inválida) e as mensagens retornadas são
  o conjunto fixo pré-definido, não geradas para o contexto informado.
- Nunca `true` simultaneamente (fallback só ocorre quando não houve cache hit).
- Nenhum novo status HTTP de erro é introduzido; `502 OPENAI_UPSTREAM_ERROR` e `502
  OPENAI_INVALID_RESPONSE` deixam de ocorrer na prática para o fluxo de geração (substituídos pelo
  fallback em 200), mas os códigos continuam documentados no formato de erro genérico do backend, para o
  caso (não esperado) de uma falha ocorrer fora do caminho coberto pelo fallback.

`web/` e `mobile/` não são obrigados a tratar `cached`/`fallback` nesta rodada (são informativos); exibir
algum indicador visual para `fallback: true` (ex.: aviso sutil de "sugestões genéricas") é uma melhoria de
produto sugerida, não implementada aqui — mudança de UI segue seu próprio ciclo de aprovação nos módulos
correspondentes.

## Testes (test-first, Jest + supertest — mesmo framework já em uso)

Novos casos em `tests/unit/openaiService.test.ts`:

- Cache hit: segunda chamada com mesmo input (após a primeira gravar no cache) não invoca o client mockado
  da OpenAI, retorna as mesmas mensagens, com `cached: true`.
- Cache miss: primeira chamada para um input novo invoca o client normalmente, grava no cache (mock do
  Firestore verificado), retorna `cached: false`.
- Falha na escrita do cache (mock do Firestore rejeitando) não impede a resposta de sucesso ao cliente.
- Fallback: client mockado sempre falhando (esgota retries) retorna as 3 mensagens fixas com
  `fallback: true` e `200`, não mais lança `AppError`/502.
- Fallback por resposta inválida da OpenAI (JSON malformado ou array != 3 strings) segue o mesmo caminho
  de fallback.
- Resultado de fallback não é gravado no cache (mock do Firestore não deve receber escrita nesse caso).
- `max_tokens` é passado ao client mockado com o valor configurado via `OPENAI_MAX_OUTPUT_TOKENS`.
- Prompt de sistema contém a instrução de variedade de tom.

Novos casos em `tests/integration/messagesRoute.test.ts`:

- `POST /messages` bem-sucedido (sem cache) retorna `cached: false, fallback: false` além de `messages`.
- `POST /messages` repetido com mesmo body retorna `200` com `cached: true` (usando mock de Firestore/
  OpenAI da suíte de integração).
- `POST /messages` com OpenAI mockada para falhar retorna `200` com `fallback: true`, não mais `502`.

Testes existentes de dedup, retry, validação, rate limit, CORS e error handler continuam válidos sem
alteração — nenhum desses caminhos muda de comportamento.

## Variáveis de ambiente novas

```
# Limite de tokens de saída da OpenAI, para conter custo/latência por chamada
OPENAI_MAX_OUTPUT_TOKENS=400

# TTL do cache persistente de gerações (ms) — entradas mais velhas que isso são tratadas como miss
MESSAGE_CACHE_TTL_MS=21600000
```

Adicionadas a `.env.example` e a `src/config/env.ts`, mesmo padrão de leitura com default das demais
variáveis não sensíveis.

## Contrato HTTP e artefatos compartilhados

Mudanças que exigem atualização de artefato compartilhado (responsabilidade do orquestrador, aplicada na
mesma tarefa da implementação):

- `docs/contracts/api-contracts.md`: campos `cached` e `fallback` na resposta de `POST /messages`; nota
  de que `502 OPENAI_UPSTREAM_ERROR`/`OPENAI_INVALID_RESPONSE` deixam de ser o caminho esperado de falha
  de LLM (substituídos por fallback em 200), mantidos documentados para o caso não coberto.
- `docs/contracts/firestore-schema.md`: nova coleção `messageCache` (modelo de dados + regra de segurança
  negando acesso de cliente).
- `backend/CLAUDE.md`: seção "Integração com OpenAI" atualizada para refletir que fallback e cache agora
  existem (hoje diz o oposto para ambos).

## Fora de escopo (nesta rodada)

- Cache por similaridade semântica (embeddings).
- Pool de múltiplas variações por chave de cache, sorteio entre variações, ou rastreamento de "o que este
  usuário específico já viu" (via identificador de sessão/login) — avaliado e descartado pelo dono do
  produto por complexidade desproporcional ao problema; o campo `regenerate` (ver seção 3) resolve o caso
  de uso real (não repetir conteúdo ao clicar em "gerar outras opções") sem essa complexidade.
- Expor `tone` como campo estruturado por mensagem (item 4) e qualquer tratamento visual correspondente em
  `web/`/`mobile/`.
- Qualquer alteração em `web/` ou `mobile/` para exibir `cached`/`fallback` ao usuário final.
- Plataforma de métricas/observabilidade dedicada — fica limitado a log estruturado, conforme já usado no
  restante do backend.
