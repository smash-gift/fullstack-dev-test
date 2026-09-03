# Fase 06 — Baseline de segurança da aplicação

**Status:** ✅ concluída *(backend)* · **Checklist:** item 6 *(adicionado ao checklist original)*

> As três tarefas de **cliente** — cleartext HTTP e ausência de credencial no app — ficam
> abertas porque não existe projeto Flutter para verificar. A regra nasce aqui e é aplicada
> na [fase 09](phase-09-flutter-app.md).

## Objetivo

Segurança que não é específica de LLM: cabeçalhos HTTP, limites, política de log,
dependências e configuração de cliente.

Referência: [`../05-security/application-security.md`](../05-security/application-security.md)

## Tasks

### HTTP
- [x] `helmet`, com três defaults ajustados e justificados
- [x] `app.disable('x-powered-by')`
- [x] `express.json({ limit: '4kb' })`
- [x] Tratamento de JSON malformado → `400`, nunca `5xx`
- [x] `Content-Type` inválido → **`415`**, não `400` *(ver abaixo)*
- [x] Profundidade de aninhamento — **medida**, e coberta pelo teto de 4 KB *(ver abaixo)*
- [x] `app.disable('etag')` *(não previsto no plano)*

### Log
- [x] Política de nível implementada (`info` × `debug`)
- [x] Valores de campo e prompt **fora** do nível `info`
- [x] Key nunca logada, em nenhum nível
- [x] `requestId` em toda linha
- [x] Confirmar que o log é JSON estruturado (imune a log injection)

### Segredos
- [x] Key lida apenas em `pkg/config/env.ts`
- [x] `.env.example` completo e sem valor real — **com teste** contra o schema
- [ ] Nenhuma credencial no projeto Flutter — *regra definida; verificável só na fase 09*

### Dependências
- [x] `package-lock.json` versionado
- [x] `npm audit --audit-level=high` limpo
- [x] Versões fixadas nas dependências de runtime
- [x] Revisar a necessidade de cada dependência direta

### Cliente — regra definida aqui, **aplicada e verificada na fase 09**
- [ ] Cleartext HTTP **só** em build de debug (Android e iOS)
- [ ] Nenhuma exceção de ATS/cleartext no manifesto de release

> Não existe projeto Flutter ainda. Marcar estes itens agora seria afirmar uma verificação
> que não aconteceu — a regra está escrita e vira item **bloqueante** na
> [fase 15](phase-15-pre-delivery-review.md).

## Decisões da fase

### `Content-Type` inválido devolve `415`, não `400`

O plano previa `400`. Medindo o comportamento **antes** de implementar, o problema real
era pior do que um código errado: `express.json()` ignora silenciosamente um corpo cujo
`Content-Type` não reconhece, e o cliente recebia `occasion is required` para uma
requisição que **enviou** `occasion`.

Uma resposta que aponta para o lugar errado custa uma tarde a quem integra. `415` com a
mensagem dizendo qual media type usar é a semântica correta de HTTP e resolve em segundos.

### O limite de profundidade não foi escrito, porque não teria como disparar

O plano pedia um limite explícito. Medindo primeiro:

| Profundidade | Bytes | Resultado |
|---|---|---|
| 300 níveis | 2 150 | `400` — parser lida sem esforço |
| 600 níveis | 4 250 | `413` — barrado pelo tamanho |
| 1 000 níveis | 9 150 | `413` — barrado pelo tamanho |

O teto de 4 KB já **é** o limite de profundidade: o objeto mais fundo que cabe tem ~560
níveis. Uma regra separada nunca dispararia — mesmo raciocínio que tirou os marcadores
estruturais da heurística da camada 1 na fase 05.

O que foi escrito no lugar: **o teste com os três casos**, que é o que impede a conclusão
de envelhecer em silêncio.

### `Cross-Origin-Resource-Policy` teve que ser afrouxado

O `helmet` entrega `same-origin` por default. Esta API existe **para ser chamada de outra
origem** — é o app Flutter que a consome. Um CORP restritivo ao lado de um CORS permissivo
seria um cabeçalho que parece um controle e não é, o que é pior que não ter: dá falsa
confiança a quem lê a resposta.

Passou a `cross-origin`, com o CORS (fase 07) como o controle de acesso de verdade.

### `.env.example` estava mentindo, e agora tem teste

As duas variáveis de retry criadas na fase 04 nunca chegaram ao exemplo. O único documento
de configuração que um avaliador lê antes de rodar o projeto escondia dois botões.

Corrigido — e guardado por um teste que **deriva a lista do próprio schema Zod**
(`ENV_KEYS`), em vez de depender de alguém lembrar de atualizar dois arquivos.

### `405` existia no contrato e não existia no código

Conferindo o comportamento real contra
[`03-api/contract.md`](../03-api/contract.md), a tabela de status prometia
`405 METHOD_NOT_ALLOWED` desde a fase 02 — e um `GET /api/v1/suggestions` devolvia `404`.

Duas saídas: corrigir a documentação ou corrigir o código. A documentação estava certa —
`404` manda o chamador conferir a URL quando a URL estava certa —, então o código foi
ajustado, com o cabeçalho `Allow` junto.

Fora do escopo planejado da fase, mas contrato que mente é pior que contrato incompleto.

### O `createLogger` passou a aceitar um destino

Necessário para testar a política de redaction **na configuração real**, em vez de montar
um pino parecido dentro do teste e verificar que o pino funciona. Teste que não exercita o
nosso código é teatro.

## O que esta fase deliberadamente **não** faz

Aplicar controle onde não há ameaça é teatro. Estas superfícies não existem neste sistema:

| Ausência | Elimina |
|---|---|
| Nenhum banco | SQL / NoSQL injection |
| Nenhuma URL controlada pelo usuário | SSRF |
| Nenhum `exec` / `eval` | Command injection |
| Nenhum upload | Malware, path traversal |
| Nenhuma sessão ou cookie | CSRF, fixação de sessão |
| Nenhuma renderização de HTML no servidor | XSS refletido |

A tabela é parte do entregável: ela diz **o que precisa ser reavaliado** quando alguém
adicionar um desses recursos.

Descartados com justificativa em
[`ADR-0010`](../01-architecture/decisions/adr-0010-application-security.md): WAF,
autenticação de API, CSP restritiva, `--ignore-scripts`, certificate pinning.

## O item que mais merece atenção

**Cleartext HTTP no manifesto.** Para o app falar com `http://10.0.2.2:3000` em
desenvolvimento, Android (API 28+) e iOS exigem permissão explícita de tráfego não
criptografado. Essa permissão vazando para o build de release transformaria **todo** o
tráfego do app em texto claro, interceptável em qualquer rede hostil.

É o tipo de erro que passa despercebido justamente porque "funciona". Vira item
**bloqueante** no checklist da fase 15.

## Resultado verificado — `NODE_ENV=production`, 2026-09-03

Cabeçalhos medidos na resposta, não copiados da documentação do `helmet`:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: no-referrer
Cross-Origin-Resource-Policy: cross-origin
Origin-Agent-Cluster: ?1
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
```

`X-Powered-By` e `ETag` ausentes. `npm audit --audit-level=high` → **0 vulnerabilidades**.

| Caso | Resultado |
|---|---|
| Corpo > 4 KB | `413 PAYLOAD_TOO_LARGE` |
| JSON malformado | `400 VALIDATION_ERROR` |
| `Content-Type: text/plain` | `415 UNSUPPORTED_MEDIA_TYPE`, dizendo qual usar |
| POST sem corpo | `400`, tratado pelo schema |
| `GET` numa rota que só aceita `POST` | `405`, com `Allow: POST` |
| Aninhamento de 1 000 níveis | `413`, nunca `5xx` |

### Um bug encontrado pelo teste do caso que **não** deve quebrar

A primeira versão do middleware devolvia `415` para um `POST` **sem corpo nenhum** —
porque `Content-Length: 0` contava como "tem corpo". O caller que esqueceu o payload
receberia uma reclamação sobre media type em vez de "occasion is required".

Achado pelo mesmo tipo de teste que achou o apóstrofo tipográfico na fase 05: o que
verifica o caminho legítimo, não o ataque.

## Cobertura de testes

53 casos novos, todos offline:

| Arquivo | Casos | Cobre |
|---|---|---|
| `tests/integration/application-security.route.test.ts` | 25 | cabeçalhos, limites, media type, verbos, ausência de vazamento |
| `tests/unit/logging-policy.test.ts` | 7 | log injection, redaction, política de nível |
| `tests/unit/env-example.test.ts` | 21 | sincronia `.env.example` × schema, sem credencial real |

Suíte completa: **367 testes.**

## Critério de pronto

- [x] Cabeçalhos do `helmet` presentes na resposta
- [x] `X-Powered-By` ausente
- [x] Corpo acima de 4 KB → `413`
- [x] `Content-Type` não-JSON → `415` com mensagem acionável
- [x] JSON malformado → `400`, sem `5xx`
- [x] Log em `info` sem key, sem prompt, sem valores de campo
- [x] `npm audit --audit-level=high` limpo
- [ ] Cleartext restrito a debug, verificado por grep no manifesto — *fase 09*

## Riscos

| Risco | Mitigação |
|---|---|
| `helmet` quebrar o Swagger UI | Testar `/docs` após ativar; ajustar só o necessário |
| Limite de corpo apertado demais | 4 KB para campos de 60 caracteres tem folga ampla |
| Cleartext vazar para release | Item bloqueante na fase 15, verificado por comando |
| Dependência sem correção disponível | Avaliar exposição real e registrar a decisão, em vez de ignorar |
