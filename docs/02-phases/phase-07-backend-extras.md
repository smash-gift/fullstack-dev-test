# Fase 07 — Diferenciais do backend

**Status:** ⬜ pendente · **Checklist:** item 7

## Objetivo

Rate limiting, CORS, cache e Swagger — os itens que o enunciado marca como opcionais ou
que valorizam a entrega.

## Tasks

- [ ] Rate limiting por IP
- [ ] Timeout explícito nas chamadas ao LLM *(iniciado na fase 04)*
- [ ] Tipagem completa de todas as respostas
- [ ] CORS configurável por ambiente
- [ ] Cache LRU em memória atrás do port
- [ ] Swagger UI em `/docs`
- [ ] Documentar no README a decisão sobre cache

## Rate limiting

| Parâmetro | Valor | Variável |
|---|---|---|
| Janela | 5 min | `RATE_LIMIT_WINDOW_MS` |
| Máximo por IP | 30 | `RATE_LIMIT_MAX` |
| Escopo | `/api/v1/*` | — |
| Fora do escopo | `/health`, `/docs` | — |

Excedente recebe `429` com headers `RateLimit-*` e `Retry-After`. **Não** recebe fallback:
`429` é sinal para desacelerar, e servir sugestões ensinaria o cliente que insistir
funciona.

O middleware corta **antes** do controller, então requisição bloqueada custa zero em token
— que é o ponto inteiro. Ver [`ADR-0005`](../01-architecture/decisions/adr-0005-rate-limiting.md).

## CORS

| Ambiente | Origem permitida |
|---|---|
| `development` | `*` |
| `production` | Lista explícita em `CORS_ORIGINS` |

`*` em dev existe porque `flutter run -d chrome` sobe em porta efêmera diferente a cada
execução — fixar origem quebraria o fluxo local do avaliador.

## Cache

| Aspecto | Valor |
|---|---|
| Estrutura | LRU em memória |
| Chave | `sha1` de provider + model + occasion + relationship + tone + language + count, normalizados |
| TTL | 10 min |
| Capacidade | 500 |
| Nunca cacheia | Fallback e erros |

O `model` entra na chave para que trocar `LLM_PROVIDER` não sirva resultado do provider
antigo por até 10 minutos. Ver [`ADR-0006`](../01-architecture/decisions/adr-0006-caching-and-cost.md).

**O port é assíncrono de propósito**, mesmo com implementação síncrona: torna a troca por
Redis um arquivo novo, em vez de uma mudança de assinatura propagada por todos os
chamadores.

## Swagger

Gerado dos schemas Zod via `@asteasolutions/zod-to-openapi` — fonte única de verdade
entre o que a API valida e o que ela documenta. Documentação escrita à mão diverge do
código; não é possibilidade, é questão de tempo.

Entrega o botão **Try it out**, com que o avaliador dispara `birthday + friend` sem sair
do navegador. Ver [`../03-api/openapi.md`](../03-api/openapi.md).

## Critério de pronto

- [ ] 31 requisições em 5 min → a 31ª responde `429` com `Retry-After`
- [ ] `/health` continua respondendo após o limite estourar
- [ ] Flutter Web em porta aleatória chama a API sem erro de CORS
- [ ] Duas requisições idênticas: a segunda traz `meta.cached: true`
- [ ] Resposta degradada **não** é cacheada
- [ ] `CACHE_ENABLED=false` desativa o cache
- [ ] `/docs` abre e o **Try it out** funciona
- [ ] Nenhum `any` na tipagem das respostas

## Riscos

| Risco | Mitigação |
|---|---|
| Rate limit atrapalhar o avaliador | 30/5min tem folga ~6x sobre uso humano; desligável por env |
| Cache servir conteúdo obsoleto | Model na chave + TTL curto + `CACHE_ENABLED=false` |
| Swagger divergir do código real | Gerado dos mesmos schemas de validação |
| CORS `*` vazar para produção | Condicionado a `NODE_ENV`; item da revisão de deploy |
