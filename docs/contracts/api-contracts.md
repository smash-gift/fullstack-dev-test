# Contrato de API — smash-gift

Este documento é a fonte única de verdade do contrato HTTP exposto pelo `backend/` e consumido por
`web/` e `mobile/`.

Como os três módulos não compartilham código, este arquivo — e não um pacote compartilhado de tipos —
mantém os clientes e o backend alinhados.

## Responsabilidade

A sessão principal do Claude Code, no papel de orquestrador, mantém este documento atualizado.

O `backend-agent` deve identificar e registrar no handoff qualquer mudança observável no contrato HTTP,
incluindo:

- endpoint;
- método;
- path;
- parâmetros;
- autenticação;
- request;
- response;
- status code;
- formato de erro.

O orquestrador aplica a atualização neste documento na mesma tarefa da mudança de implementação.

`web-agent` e `mobile-agent` consultam este documento antes de implementar integrações com o backend.

## CORS

Toda resposta do backend (sucesso ou erro, qualquer rota) inclui os headers `Access-Control-Allow-Origin`
(origem única, configurável via `CORS_ORIGIN`, padrão de desenvolvimento `http://localhost:3000`),
`Access-Control-Allow-Methods: POST,OPTIONS`, `Access-Control-Allow-Headers: Content-Type,Authorization`
e `Vary: Origin`. Requisições `OPTIONS` (preflight) recebem `204` com esses mesmos headers, em qualquer
rota. Múltiplas origens simultâneas (ex.: produção + staging) não são suportadas ainda — só uma origem
fixa por ambiente.

## Formato de cada endpoint

Cada endpoint deve documentar, quando aplicável:

### <VERBO HTTP> /<path>

Descrição:

Breve explicação da responsabilidade do endpoint.

Autenticação:

- nenhuma: disponível para guest;
- opcional: aceita guest ou usuário autenticado e o comportamento pode variar;
- obrigatória: exige Firebase ID token válido, verificado pelo backend via Firebase Admin.

Path params:

- `paramName`: `tipo`, obrigatório ou opcional — descrição.

Query params:

- `paramName`: `tipo`, obrigatório ou opcional — descrição.

Request:

Campos:

- `occasion`: `string`, obrigatório — ocasião para a qual a mensagem será gerada.
- `relationship`: `string`, obrigatório — relação entre o usuário e a pessoa que receberá a mensagem.

Exemplo:

```json
{
  "occasion": "birthday",
  "relationship": "mother"
}
```

Response de sucesso:

Campos:

- `messages`: `string[]` — opções de mensagens geradas.

Exemplo:

```json
{
  "messages": [
    "Feliz aniversário! Que seu dia seja tão especial quanto você.",
    "Que este novo ciclo seja cheio de alegria, saúde e momentos inesquecíveis.",
    "Hoje é dia de celebrar você e tudo de bonito que representa para nossa família."
  ]
}
```

Erros possíveis:

- `<status HTTP>` — situação em que ocorre e significado do erro.

## Convenções de nomenclatura

- Paths são escritos em inglês.
- Múltiplas palavras em paths usam kebab-case.
- Campos de request e response usam inglês e camelCase.
- Exemplos JSON devem representar payloads válidos.
- Descrições e tipos não devem ser colocados dentro dos valores dos exemplos JSON.
- Cada endpoint deve documentar explicitamente os status codes que pode retornar.
- Clientes não devem assumir campos ou comportamentos que não estejam descritos neste documento.

## Formato de erros

Toda resposta de erro segue o formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descrição legível do erro.",
    "details": ["occasion is required"]
  }
}
```

`details` é opcional e só aparece quando há uma lista estruturada de problemas (ex.: campos inválidos).

`code` é destinado a consumo técnico pelos clientes (mapeamento para textos localizados na UI); `message`
não deve ser exibido diretamente ao usuário final sem tradução/adequação pelo cliente.

## Endpoints

### POST /messages

Descrição:

Gera 3 opções de mensagem de presente/cartão via OpenAI (gpt-5-mini), a partir da ocasião e do tipo de
relação informados.

Autenticação:

- nenhuma: disponível para guest.

Request:

Campos:

- `occasion`: `string`, obrigatório — texto livre descrevendo a ocasião, entre 1 e 300 caracteres após
  trim (não é um enum fixo — o usuário escreve com as próprias palavras).
- `relationship`: `string`, obrigatório — texto livre descrevendo a relação com o destinatário, entre 1
  e 300 caracteres após trim (mesmo formato de `occasion`).
- `regenerate`: `boolean`, opcional (default `false`) — quando `true`, pula o cache persistente e força
  uma geração nova na OpenAI, mesmo que exista uma entrada de cache válida para o mesmo
  `occasion`+`relationship`. Usado pelo botão "gerar outras opções" do cliente, para não devolver a mesma
  sugestão que o usuário já viu. Não afeta a deduplicação de chamadas concorrentes idênticas (ver nota de
  resiliência abaixo), só a leitura do cache persistente.

Exemplo:

```json
{
  "occasion": "birthday",
  "relationship": "mother"
}
```

Response de sucesso (200):

Campos:

- `messages`: `string[]` — exatamente 3 opções de mensagens geradas.
- `cached`: `boolean` — `true` quando a resposta veio do cache persistente (nenhuma chamada à OpenAI foi
  feita para esta requisição), `false` quando foi uma geração nova.
- `fallback`: `boolean` — `true` quando a OpenAI falhou (upstream ou resposta inválida) mesmo após as
  tentativas de retry, e `messages` contém o conjunto fixo de mensagens genéricas pré-definidas em vez de
  conteúdo gerado para o contexto informado. Nunca `true` ao mesmo tempo que `cached`.

Exemplo (geração nova):

```json
{
  "messages": [
    "Feliz aniversário! Que seu dia seja tão especial quanto você.",
    "Que este novo ciclo seja cheio de alegria, saúde e momentos inesquecíveis.",
    "Hoje é dia de celebrar você e tudo de bonito que representa para nossa família."
  ],
  "cached": false,
  "fallback": false
}
```

Erros possíveis:

- `400 VALIDATION_ERROR` — `occasion` ou `relationship` ausentes, com tipo errado, vazios ou acima de 300
  caracteres; também retornado quando o corpo da requisição não é JSON válido.
- `413 PAYLOAD_TOO_LARGE` — corpo da requisição excede 10kb (limite global aplicado pelo `express.json`,
  hoje afeta apenas esta rota).
- `429 RATE_LIMITED` — cliente excedeu o limite de requisições (10 por IP por minuto, configurável).
- `500 INTERNAL_ERROR` — erro interno inesperado.

Nota sobre falhas da OpenAI: `502 OPENAI_UPSTREAM_ERROR` e `502 OPENAI_INVALID_RESPONSE` **não ocorrem
mais no caminho normal de geração** — uma falha da OpenAI (após esgotar as tentativas de retry) ou uma
resposta que não pôde ser interpretada como 3 mensagens válidas agora resulta em `200` com
`fallback: true`, não em erro. Esses dois códigos continuam reservados no formato de erro genérico do
backend apenas para o caso, não esperado, de uma falha ocorrer fora do caminho coberto pelo fallback.

Nota de resiliência: chamadas concorrentes com o mesmo `occasion`+`relationship` (normalizados) enquanto
uma chamada à OpenAI já está em andamento são deduplicadas — a segunda requisição reaproveita o
resultado em voo, sem gerar uma nova chamada. Isso é distinto do cache persistente (`cached`): dedup só
vale para chamadas concorrentes; o cache vale entre requisições de qualquer usuário ao longo do tempo,
sem expiração nesta rodada — ver
[`docs/specs/2026-08-12-backend-generation-improvements-design.md`](../specs/2026-08-12-backend-generation-improvements-design.md).

Nota de autenticação (base preparada, não usada ainda): o backend já possui middleware de validação de
Firebase ID token (`verifyFirebaseToken`), testado isoladamente, mas ainda não aplicado a nenhuma rota.
Endpoints autenticados (favoritos, preferências, histórico) serão documentados aqui quando implementados
em spec futura.

### GET /health

Descrição:

Liveness check — confirma apenas que o processo do backend está respondendo. Não verifica conectividade
com OpenAI ou Firebase.

Autenticação:

- nenhuma: disponível para guest.

Response de sucesso (200):

Campos:

- `status`: `string` — sempre `"ok"` quando a resposta é 200.

Exemplo:

```json
{
  "status": "ok"
}
```

Erros possíveis:

- `500 INTERNAL_ERROR` — erro interno inesperado (genérico, não específico deste endpoint).
