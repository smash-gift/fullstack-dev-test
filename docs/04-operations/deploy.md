# Deploy

**Status:** decisão adiada · **Autoria:** Humano (D21)

## O que o enunciado exige

> *"**We do not require a deployed URL**; local run instructions are enough."*

Deploy é, portanto, **extra**. A entrega mínima é atendida pelo
[`running-locally.md`](running-locally.md).

## Por que a decisão foi adiada

Decidir alvo de deploy antes de o código existir é decidir com menos informação do que se
terá depois — e sem ganho algum, já que nada na arquitetura depende dessa escolha. O
backend é um processo HTTP com estado apenas em memória; ele roda igual em contêiner,
função serverless ou VPS.

A decisão será tomada ao fim da [`phase-16`](../02-phases/phase-16-pre-delivery-review.md),
quando existir um artefato pronto para publicar.

## Opções em avaliação

### A. Coolify na VPS própria
- ✅ Infraestrutura já existente e sob controle do desenvolvedor.
- ✅ Contêiner comum: `Dockerfile` e nada de específico do provedor.
- ✅ Variáveis de ambiente e logs pelo painel; TLS automático.
- ❌ Custo de key real exposta em endpoint público — mitigável pelo rate limit
  ([`ADR-0005`](../01-architecture/decisions/adr-0005-rate-limiting.md)).

### B. Firebase Cloud Functions
- ✅ Usa a stack citada pela empresa; free tier suficiente.
- ✅ O `main/app.ts` já é separado do `server.ts`, então basta um `function.ts` novo
  ([`ADR-0008`](../01-architecture/decisions/adr-0008-firebase-out-of-runtime.md)).
- ❌ Cold start somado ao timeout do LLM piora a latência do pior caso.
- ❌ Introduz dependência Firebase que o ADR-0008 decidiu manter fora.

### C. Sem deploy — só execução local
- ✅ É literalmente o que o enunciado pede.
- ✅ Zero risco de key exposta ou custo inesperado.
- ❌ Avaliador precisa de uma API key própria para ver o caminho feliz. (O caminho de
  **fallback**, por outro lado, funciona sem key nenhuma — o que já demonstra a parte
  mais valorizada do teste.)

## Pré-requisitos comuns a A e B

Independentemente da escolha:

- [ ] `Dockerfile` multi-stage (build TypeScript → imagem de runtime enxuta)
- [ ] `.dockerignore` excluindo `node_modules`, `.env`, `tests`
- [ ] `/health` como probe de liveness — **sem** dependência do LLM
- [ ] Key configurada como segredo do ambiente, nunca na imagem
- [ ] `CORS_ORIGINS` explícito, sem `*` — **o processo não sobe sem isso** em
      `NODE_ENV=production`, então este item se cobra sozinho
- [ ] `TRUST_PROXY_HOPS` igual ao número real de proxies à frente (Coolify/Traefik: `1`).
      Errar aqui não quebra nada visivelmente: só faz o rate limit contar todos os
      clientes como um só
- [ ] Rate limit ativo e com valores revisados para exposição pública
- [ ] `NODE_ENV=production`
- [ ] Decidir se `/docs` fica público via `DOCS_ENABLED` (aqui, provavelmente `true` — o
      propósito é inspeção)

## Se o Flutter também for publicado

`flutter build web` produz artefato estático, servível por qualquer host.

- `API_BASE_URL` precisa apontar para a URL pública da API, definida **em tempo de build**:
  ```bash
  flutter build web --dart-define=API_BASE_URL=https://api.exemplo.com
  ```
- A origem do app web precisa estar em `CORS_ORIGINS` do backend.
- Isso publicaria a API sem autenticação, chamável por qualquer pessoa que veja a URL.
  O rate limit vira a única proteção de custo — e essa é uma razão relevante para
  considerar a Opção C.

## Como atualizar este documento

Ao tomar a decisão, esta página deixa de listar opções e passa a conter: alvo escolhido,
justificativa, passos reprodutíveis de publicação e URL final. O log de decisões
([`../00-overview/decisions-log.md`](../00-overview/decisions-log.md)) recebe a entrada
correspondente, substituindo o "adiada" de D21.
