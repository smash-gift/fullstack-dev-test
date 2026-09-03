# Contrato da API

**Base URL (local):** `http://localhost:3000`
**Versionamento:** prefixo de caminho `/api/v1`
**Formato:** JSON em ambas as direções · `Content-Type: application/json`

> Este documento é a fonte de verdade em prosa. A especificação executável (OpenAPI) é
> gerada a partir dos mesmos schemas Zod usados na validação em runtime e fica em
> `GET /docs` — ver [`openapi.md`](openapi.md).

---

## Endpoints

| Método | Caminho | Descrição | Rate limited |
|---|---|---|---|
| `POST` | `/api/v1/suggestions` | Gera 2–3 sugestões de mensagem | ✅ |
| `GET` | `/health` | Liveness / readiness | ❌ |
| `GET` | `/docs` | Swagger UI | ❌ |

### Por que `POST` e não `GET`

`GET /suggestions?occasion=birthday&relationship=friend` seria defensável — a operação é
conceitualmente uma leitura. Optamos por `POST` por três razões:

1. **A operação não é idempotente na prática.** Duas chamadas idênticas produzem textos
   diferentes (é um modelo generativo, com temperatura > 0). Semântica de `GET` promete
   segurança e repetibilidade que não podemos honrar.
2. **Cada chamada gasta dinheiro** e consome cota de terceiro. `GET` convida proxy,
   navegador e CDN a cachear e a pré-buscar por conta própria — comportamento indesejável
   quando cada acerto tem custo.
3. **O corpo cresce.** `tone`, `language`, `count` já estão previstos, e campos futuros
   (nome do destinatário, comprimento máximo) cabem melhor em um corpo JSON tipado do que
   em query string.

---

## `POST /api/v1/suggestions`

### Requisição

```http
POST /api/v1/suggestions HTTP/1.1
Content-Type: application/json
```

```jsonc
{
  "occasion": "birthday",      // obrigatório
  "relationship": "friend",    // obrigatório
  "tone": "warm",              // opcional
  "language": "en",            // opcional
  "count": 3                   // opcional
}
```

| Campo | Tipo | Obrigatório | Regras | Default |
|---|---|---|---|---|
| `occasion` | `string` | ✅ | 2–60 caracteres, após `trim` | — |
| `relationship` | `string` | ✅ | 2–60 caracteres, após `trim` | — |
| `tone` | `string` | ❌ | um de: `warm`, `funny`, `formal`, `heartfelt` | `warm` |
| `language` | `string` | ❌ | código ISO 639-1 (`en`, `pt`, `es`) | `en` |
| `count` | `integer` | ❌ | **2 ou 3** | `3` |

**Texto livre é aceito.** `occasion` e `relationship` são strings, não enumerações. O
enunciado diz *"choose **or type**"*, então "graduation" ou "meu vizinho do 302" são
entradas válidas. A validação garante formato e tamanho, não vocabulário.

**Por que `count` é limitado a 2–3.** O enunciado pede *"2–3 short message suggestions"*.
Aceitar `count: 10` seria extrapolar o contrato especificado e multiplicar custo por
requisição. Valor fora da faixa é `400`, não é silenciosamente ajustado — ajustar em
silêncio esconde do cliente que o pedido dele não foi atendido.

### Resposta `200` — geração normal

```jsonc
{
  "data": {
    "suggestions": [
      { "id": "sug_01HZX3K2", "text": "Happy birthday! May this year bring you as much joy as you bring everyone around you." },
      { "id": "sug_01HZX3K3", "text": "Wishing you a birthday as wonderful as your friendship. Here's to another great year!" },
      { "id": "sug_01HZX3K4", "text": "Another trip around the sun — and I'm glad I get to share it with a friend like you." }
    ],
    "source": "llm",
    "model": "gpt-4o-mini",
    "degraded": false
  },
  "meta": {
    "requestId": "req_01HZX3K1ABCDEF",
    "generatedAt": "2026-09-03T14:22:10.512Z",
    "cached": false
  }
}
```

| Campo | Tipo | Significado |
|---|---|---|
| `data.suggestions[].id` | `string` | Identificador estável dentro da resposta — útil como `key` de lista no cliente |
| `data.suggestions[].text` | `string` | A mensagem. 1–2 frases |
| `data.source` | `"llm"` \| `"fallback"` | Origem do conteúdo |
| `data.model` | `string` \| `null` | Modelo usado. `null` quando `source` é `fallback` |
| `data.degraded` | `boolean` | `true` quando o LLM falhou e o fallback respondeu |
| `meta.requestId` | `string` | Correlação com os logs do servidor |
| `meta.cached` | `boolean` | `true` quando a resposta veio do cache |

### Resposta `200` — fallback (LLM falhou)

**O status continua `200`.** O raciocínio completo está em
[`ADR-0003`](../01-architecture/decisions/adr-0003-fallback-strategy.md).

```jsonc
{
  "data": {
    "suggestions": [
      { "id": "fb_birthday_friend_1", "text": "Happy birthday! Wishing you a day as bright as your smile." },
      { "id": "fb_birthday_friend_2", "text": "Here's to you and another year of great memories together." },
      { "id": "fb_birthday_friend_3", "text": "Happy birthday, my friend. May this year treat you kindly." }
    ],
    "source": "fallback",
    "model": null,
    "degraded": true
  },
  "meta": {
    "requestId": "req_01HZX3K9ZZZZZZ",
    "generatedAt": "2026-09-03T14:22:18.904Z",
    "cached": false,
    "reason": "llm_timeout"
  }
}
```

**Valores possíveis de `meta.reason`** — presente apenas quando `degraded: true`:

| Valor | Significado |
|---|---|
| `llm_timeout` | Provider não respondeu dentro de `LLM_TIMEOUT_MS` |
| `llm_rate_limited` | Provider devolveu `429` |
| `llm_unavailable` | Provider devolveu `5xx`, ou houve falha de rede/DNS/TLS |
| `llm_invalid_response` | Provider respondeu `200`, mas o corpo não passou na validação |
| `llm_auth_error` | API key ausente ou inválida |

Esses valores são **códigos estáveis**, seguros para `switch` no cliente. As mensagens de
texto não são — elas podem mudar.

---

## Respostas de erro

Formato único para todos os erros. Ver
[`ADR-0004`](../01-architecture/decisions/adr-0004-error-taxonomy.md).

### `400 VALIDATION_ERROR`

```jsonc
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      { "field": "occasion", "issue": "required" },
      { "field": "count",    "issue": "must be 2 or 3" }
    ]
  },
  "meta": { "requestId": "req_...", "timestamp": "2026-09-03T14:22:10.512Z" }
}
```

Requisição inválida **nunca** recebe fallback — é erro do chamador, e servir sugestões
esconderia o bug dele.

### `429 RATE_LIMITED`

```jsonc
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "details": { "retryAfterSeconds": 143 }
  },
  "meta": { "requestId": "req_...", "timestamp": "..." }
}
```

```
RateLimit-Limit: 30
RateLimit-Remaining: 0
RateLimit-Reset: 143
Retry-After: 143
```

### `500 INTERNAL_ERROR`

```jsonc
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred."
  },
  "meta": { "requestId": "req_...", "timestamp": "..." }
}
```

Sem stack trace, sem nome de arquivo, sem detalhe de dependência. O evento completo — com
stack — fica no log do servidor, correlacionado pelo `requestId`.

### Resumo dos status

| Status | Código | Quando |
|---|---|---|
| `200` | — | Sucesso, do LLM **ou** do fallback |
| `400` | `VALIDATION_ERROR` | Body inválido |
| `404` | `NOT_FOUND` | Rota inexistente |
| `405` | `METHOD_NOT_ALLOWED` | Verbo errado |
| `413` | `PAYLOAD_TOO_LARGE` | Body acima do limite |
| `429` | `RATE_LIMITED` | Rate limit estourado |
| `500` | `INTERNAL_ERROR` | Exceção não prevista |

**Não existe `503` neste contrato.** Falha do LLM é degradação, não indisponibilidade.

---

## `GET /health`

```jsonc
{
  "status": "ok",
  "uptimeSeconds": 1284,
  "version": "1.0.0",
  "llmProvider": "openai"
}
```

**Não** verifica conectividade com o LLM. Health check que depende de terceiro faz o
orquestrador reiniciar um serviço saudável durante um incidente alheio — e o sistema foi
projetado justamente para continuar servindo (degradado) nessa situação.

---

## Exemplos com `curl`

**Caso obrigatório do enunciado — Birthday + Friend:**

```bash
curl -sS -X POST http://localhost:3000/api/v1/suggestions \
  -H 'Content-Type: application/json' \
  -d '{"occasion":"birthday","relationship":"friend"}' | jq
```

**Duas sugestões, em português, tom bem-humorado:**

```bash
curl -sS -X POST http://localhost:3000/api/v1/suggestions \
  -H 'Content-Type: application/json' \
  -d '{"occasion":"wedding","relationship":"colleague","tone":"funny","language":"pt","count":2}' | jq
```

**Provocar `400`:**

```bash
curl -sS -X POST http://localhost:3000/api/v1/suggestions \
  -H 'Content-Type: application/json' \
  -d '{"occasion":"birthday"}' | jq
```

**Provocar o fallback** — API key inválida força `llm_auth_error`:

```bash
OPENAI_API_KEY=invalid npm run dev
# em outro terminal:
curl -sS -X POST http://localhost:3000/api/v1/suggestions \
  -H 'Content-Type: application/json' \
  -d '{"occasion":"birthday","relationship":"friend"}' | jq '.data.degraded, .meta.reason'
```

---

## CORS

| Ambiente | `Access-Control-Allow-Origin` |
|---|---|
| Desenvolvimento | `*` — permite Flutter Web em porta aleatória |
| Produção | Lista explícita via `CORS_ORIGINS` |

Métodos: `GET`, `POST`, `OPTIONS`. Headers: `Content-Type`.

`*` em desenvolvimento existe porque `flutter run -d chrome` sobe em porta efêmera
diferente a cada execução — fixar origem quebraria o fluxo local do avaliador. Em
produção, lista explícita, sempre.
