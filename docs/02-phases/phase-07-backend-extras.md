# Fase 07 — Diferenciais do backend

**Status:** ✅ concluída · **Checklist:** item 7

## Objetivo

Rate limiting, CORS por ambiente, cache e Swagger — os itens que o enunciado marca como
opcionais ou que valorizam a entrega.

## Tasks

- [x] Rate limiting por IP
- [x] Timeout explícito nas chamadas ao LLM *(entregue na fase 04)*
- [x] Tipagem completa de todas as respostas
- [x] CORS configurável por ambiente — e **proibido** ser `*` em produção
- [x] Cache LRU em memória atrás do port *(entregue na fase 02)*
- [x] Swagger UI em `/docs`
- [x] CSP reativada, escopada na única rota que serve HTML
- [ ] Documentar no README a decisão sobre cache — *o README nasce na
      [fase 14](phase-14-readme.md)*

## Rate limiting

| Parâmetro | Valor | Variável |
|---|---|---|
| Janela | 5 min | `RATE_LIMIT_WINDOW_MS` |
| Máximo por IP | 30 | `RATE_LIMIT_MAX` |
| Liga/desliga | ligado | `RATE_LIMIT_ENABLED` |
| Proxies à frente | 0 | `TRUST_PROXY_HOPS` |
| Escopo | `/api/v1/*` | — |
| Fora do escopo | `/health`, `/docs` | — |

O middleware é montado **antes** do body parser e do controller. Requisição bloqueada não
tem corpo lido nem token gasto — que é o ponto inteiro. Ver
[`ADR-0005`](../01-architecture/decisions/adr-0005-rate-limiting.md).

### Medido, não presumido — `RATE_LIMIT_MAX=3`

```
requisição 1  200   RateLimit-Limit: 3   RateLimit-Remaining: 2
requisição 2  200                        RateLimit-Remaining: 1
requisição 3  200                        RateLimit-Remaining: 0
requisição 4  429   Retry-After: 60
```

```jsonc
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "details": { "retryAfterSeconds": 60 }
  },
  "meta": { "requestId": "req_3bd15ec7fb3a27a4", "timestamp": "2026-09-03T19:44:50.155Z" }
}
```

Com o limite estourado, `/health` e `/docs` continuaram respondendo `200`.

## Decisões da fase

### A ordem dos middlewares é a parte que mais importa

Três propriedades saem só da ordem, e nenhuma delas é acidente:

| Ordem | Consequência |
|---|---|
| CORS **antes** do rate limit | Um `429` chega ao navegador **com** `Access-Control-Allow-Origin`. Sem isso o cliente vê "erro de CORS" e nunca descobre que foi limitado — diagnóstico errado para o problema certo |
| CORS antes do rate limit | O **preflight** `OPTIONS` é respondido pelo CORS e nunca chega ao contador. Cobrar quota de preflight cortaria pela metade o orçamento real de um cliente web |
| Rate limit **antes** do `express.json` | A requisição bloqueada não tem corpo interpretado nem chamada ao modelo |

As três estão fixadas em teste, não em comentário.

### `TRUST_PROXY_HOPS` é um número, nunca `true`

O limitador identifica o cliente pelo IP. Atrás de um proxy reverso, toda requisição chega
com o endereço do proxy — um chamador gastaria a quota de todo mundo.

A correção óbvia seria `trust proxy: true`, e ela **abre um buraco maior que o que fecha**:
o Express passa a aceitar o que o `X-Forwarded-For` disser, e um chamador forja uma
identidade nova por requisição. O limite fica a um cabeçalho de distância de ser
contornado.

Por isso a variável é uma **contagem de saltos**. Com `0`, um `X-Forwarded-For` forjado é
ignorado — há teste para exatamente isso. Com `1`, apenas o salto imediato é considerado.
O schema **rejeita** `TRUST_PROXY_HOPS=true`, que é justamente a forma insegura.

### CORS `*` em produção passou de item de checklist a impossibilidade

O plano dizia "condicionado a `NODE_ENV`". Um item de checklist de deploy sobrevive
exatamente porque nada quebra visivelmente quando é esquecido.

Agora o processo **se recusa a subir**:

```
Invalid environment:
  - CORS_ORIGINS: must list explicit origins in production (for example
    https://app.example.com), never *
```

Mesmo raciocínio da fase 05 ao promover o guard de saída a porta: o que precisa ser
garantia não pode depender de alguém lembrar.

### O gerador de OpenAPI que o plano pedia não foi instalado

O plano previa `@asteasolutions/zod-to-openapi`. Medindo antes de instalar: o **Zod 4.5 já
emite JSON Schema nativamente** (`z.toJSONSchema`), com `target: 'openapi-3.0'`.

Três dependências a menos, e a propriedade que interessava — documento derivado dos mesmos
schemas que validam em runtime — fica intacta. A biblioteca do plano fazia trabalho que a
biblioteca de validação já faz.

### Swagger UI servido por nós, não pelo `swagger-ui-express`

Medindo o custo de cada opção:

| Opção | Pacotes novos | Consequência |
|---|---|---|
| `swagger-ui-express` | 3 | Injeta `<script>` inline → obrigaria `script-src 'unsafe-inline'`; depende de `swagger-ui-dist` com faixa aberta `>=5.0.0` |
| CDN + HTML nosso | 0 | `/docs` para de funcionar sem internet; exige liberar a origem de terceiro na nossa própria página |
| **`swagger-ui-dist` + HTML nosso** | 2 | Página e inicializador são arquivos nossos → `script-src 'self'`; versão fixada exatamente |

A terceira, com ~40 linhas de rota. O que se compra com elas: a única página HTML desta API
não tem script inline, funciona offline e serve **apenas três arquivos** do pacote, por
allowlist — `.map`, `package.json` e `oauth2-redirect.html` respondem `404`, verificado em
teste.

Os arquivos são lidos **na subida**, não a cada requisição: tira I/O de disco do caminho da
requisição e faz um arquivo renomeado por atualização de dependência falhar no boot, em vez
de virar `404` na primeira vez que alguém abre `/docs`.

### A CSP voltou, escopada

A fase 06 desligou a CSP porque uma API JSON não devolve documento que o navegador
renderize. Isso deixou de ser verdade aqui, então a política volta — só em `/docs`, e
escrita apertada em vez de deixada no default:

```
default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self'; connect-src 'self';
base-uri 'none'; form-action 'none'; frame-ancestors 'none'
```

`style-src 'unsafe-inline'` é um afrouxamento real: o Swagger UI injeta estilo em runtime.
Fica confinado a uma página cujo conteúdo inteiro é nosso. `connect-src 'self'` é o que
permite o **Try it out** chamar esta própria API, e nada além dela.

**Verificado renderizando**, não lendo documentação: Chrome headless carregou `/docs`,
listou as duas operações e as duas tags, com **zero violações de CSP**. O mesmo foi
repetido contra o build compilado (`npm run build && npm start`).

### Telemetria de instalação encontrada e desligada

`swagger-ui-dist` depende de `@scarf/scarf`, cujo `postinstall` reporta a instalação a um
terceiro — "*Scarf is like Google Analytics for your npm packages*", nas palavras do
próprio pacote.

Ninguém que clona este repositório concordou com isso. O opt-out está no `package.json`:

```json
"scarfSettings": { "enabled": false }
```

Escolhido em vez de `ignore-scripts=true` no `.npmrc`, que silenciaria esta telemetria
desabilitando o script de instalação de **todas** as dependências — mudança bem maior, com
chance bem maior de quebrar a instalação de quem for avaliar.

> A leitura do `report.js` (`userHasOptedOut`, linhas 56–59) confirma que o campo é lido do
> manifesto raiz. **Não** foi possível reproduzir a chamada de rede fora de uma instalação
> real, então o que está documentado aqui é o caminho de código, não uma requisição medida.

### `Access-Control-Allow-Methods` passou a listar só o que existe

O default do `cors` anuncia `GET,HEAD,PUT,PATCH,POST,DELETE`. Esta API responde `405` para
metade dessa lista desde a fase 06 — um cabeçalho contradizendo a tabela de rotas. Passou a
`GET, POST, OPTIONS`.

## Tipagem das respostas

`suggestions-response.schema.ts` declara a resposta **uma vez**. Dele saem duas coisas:

```
suggestions-response.schema.ts   ← schemas Zod
          │
          ├──→ tipo de retorno do controller (z.infer)
          └──→ documento OpenAPI publicado
```

Um campo que o controller deixe de enviar **para de compilar**. A documentação não tem como
descrever silenciosamente uma resposta que a API não produz mais.

## Critério de pronto

- [x] 31 requisições em 5 min → a 31ª responde `429` com `Retry-After` *(medido com limite 3)*
- [x] `/health` continua respondendo após o limite estourar
- [x] `/docs` continua respondendo após o limite estourar
- [x] `429` **não** recebe fallback
- [x] `429` mantém os cabeçalhos de CORS
- [x] Preflight não consome quota
- [x] `X-Forwarded-For` forjado não cria identidade nova
- [x] Origem aleatória (Flutter Web) chama a API sem erro de CORS em desenvolvimento
- [x] Produção **recusa** subir com `CORS_ORIGINS=*`
- [x] Duas requisições idênticas: a segunda traz `meta.cached: true` *(fase 02)*
- [x] Resposta degradada **não** é cacheada *(fase 02)*
- [x] `CACHE_ENABLED=false` desativa o cache *(fase 02)*
- [x] `/docs` abre e renderiza as operações — verificado em navegador headless
- [x] Documento validado contra o schema oficial de OpenAPI 3.0
- [x] Nenhum `any` na tipagem das respostas

## Cobertura de testes

64 casos novos:

| Arquivo | Casos | Cobre |
|---|---|---|
| `tests/integration/rate-limit.route.test.ts` | 12 | limite, cabeçalhos, `Retry-After`, isenções, CORS no `429`, preflight, proxy forjado, desligar |
| `tests/integration/docs.route.test.ts` | 14 | página, CSP, ausência de script inline, allowlist de assets, `DOCS_ENABLED=false` |
| `tests/unit/openapi-document.test.ts` | 11 | validade OpenAPI 3.0 e **derivação** do documento a partir dos schemas |
| `tests/unit/rate-limit-retry-after.test.ts` | 4 | arredondamento, nunca zero, fallback sem `resetTime` |
| `tests/unit/dependency-policy.test.ts` | 10 | versões fixadas, superfície direta, opt-out de telemetria |
| `tests/unit/env.test.ts` *(acrescentado)* | 8 | CORS em produção, `TRUST_PROXY_HOPS` |
| `tests/unit/env-example.test.ts` *(automático)* | 5 | as cinco variáveis novas |

Suíte completa: **431 testes**, 98.34% de statements e 91.07% de branches.

> O teste de sincronia do `.env.example` criado na fase 06 **disparou nesta fase**, nas
> cinco variáveis novas, antes de qualquer revisão humana. Foi escrito para isso.

## Riscos

| Risco | Mitigação |
|---|---|
| Rate limit atrapalhar o avaliador | 30/5min tem folga ~6x sobre uso humano; `RATE_LIMIT_ENABLED=false` desliga |
| Limite não valer com múltiplas instâncias | Limitação conhecida e registrada no `ADR-0005`; a correção é um store Redis |
| Cache servir conteúdo obsoleto | Model na chave + TTL curto + `CACHE_ENABLED=false` |
| Swagger divergir do código real | Gerado dos mesmos schemas de validação, com teste comparando contra as constantes do domínio |
| `/docs` expor superfície demais em produção | `DOCS_ENABLED=false` |
| CORS `*` vazar para produção | O processo **não sobe** |
