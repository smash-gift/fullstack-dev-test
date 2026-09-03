# Baseline de segurança da aplicação

Segurança que não é específica de LLM: HTTP, segredos, dependências e configuração de
cliente. Complementa [`llm-security.md`](llm-security.md).

---

## Backend — HTTP

| Controle | Implementação | Ameaça | Status |
|---|---|---|---|
| Cabeçalhos de segurança | `helmet` | Diversos | ✅ fase 06 |
| `X-Powered-By` desligado | `app.disable('x-powered-by')` | Fingerprinting | ✅ fase 02 |
| ETag desligado | `app.disable('etag')` | Fingerprint fraco do corpo | ✅ fase 06 |
| Limite de corpo | `express.json({ limit: '4kb' })` | T3 — DoS por payload | ✅ fase 02 |
| `Content-Type` exigido | `contentTypeMiddleware` → `415` | Interpretação ambígua do corpo | ✅ fase 06 |
| Validação de entrada | Zod na borda | T1, entrada malformada | ✅ fase 02 |
| Sanitização de entrada | `pkg/security/input-sanitizer.ts` | T1 — prompt injection | ✅ fase 05 |
| Rate limiting | 30 / 5 min por IP | T3 | ⬜ fase 07 |
| CORS | Lista explícita em produção | Uso cruzado indevido | ⬜ fase 07 |
| Sem stack trace na resposta | `error-handler` final | Vazamento de informação | ✅ fase 02 |
| Timeout em toda chamada externa | `AbortController` | Exaustão de recurso | ✅ fase 04 |

**4 KB de limite de corpo** é generoso para uma requisição cujo maior campo tem 60
caracteres. Corpo grande aqui só existe por engano ou por má-fé.

### Cabeçalhos efetivamente presentes na resposta

Medidos com `NODE_ENV=production`, não copiados da documentação do `helmet`:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: no-referrer
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: cross-origin
Origin-Agent-Cluster: ?1
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
```

Três defaults do `helmet` foram alterados, e cada um por um motivo concreto:

| Ajuste | Por quê |
|---|---|
| `contentSecurityPolicy: false` | Esta API não devolve documento que um navegador renderize. Reativado na fase 07, quando o Swagger UI passa a servir HTML de verdade |
| `crossOriginEmbedderPolicy: false` | COEP governa embedding de recurso em documento; não há documento |
| `crossOriginResourcePolicy: 'cross-origin'` | **O default `same-origin` contradiz o produto** — esta API existe para ser chamada de outra origem, pelo app Flutter. Quem controla acesso aqui é o CORS |

O terceiro é o que merece atenção: deixar um CORP restritivo ao lado de um CORS permissivo
seria um cabeçalho que **parece** um controle e não é. Pior que não ter: dá falsa confiança
a quem lê a resposta.

### `Content-Type` inválido devolve `415`, não `400`

O plano previa `400`. Na medição, o comportamento sem guard era pior do que "errado":
`express.json()` **ignora silenciosamente** um corpo cujo `Content-Type` não reconhece, e o
cliente recebia `occasion is required` para uma requisição que **enviou** `occasion`.

Uma resposta que aponta para o lugar errado custa uma tarde a quem integra. `415` com a
mensagem dizendo qual media type usar resolve em dez segundos, e é a semântica correta de
HTTP para o caso.

### Profundidade de aninhamento: a regra que não foi escrita

O plano pedia um limite explícito de profundidade de JSON. Medindo antes de implementar:

| Profundidade | Bytes | Resultado |
|---|---|---|
| 300 níveis | 2 150 | `400` — parser lida sem esforço |
| 600 níveis | 4 250 | `413` — barrado pelo tamanho |
| 1 000 níveis | 9 150 | `413` — barrado pelo tamanho |

O teto de 4 KB **já é** o limite de profundidade: o objeto mais fundo que cabe tem ~560
níveis, que o parser processa normalmente. Uma regra de profundidade separada seria uma
regra que nunca dispara — pelo mesmo motivo que os marcadores estruturais saíram da
heurística da camada 1 na fase 05.

O comportamento medido virou teste, que é o que impede a conclusão de envelhecer em
silêncio.

### Superfícies que não existem

| Ausência | Elimina |
|---|---|
| Nenhum banco de dados | SQL / NoSQL injection |
| Nenhuma URL controlada pelo usuário | SSRF |
| Nenhum `exec`, `eval` ou spawn de processo | Command injection |
| Nenhuma leitura de arquivo por caminho do usuário | Path traversal |
| Nenhum upload | Malware, zip bomb |
| Nenhuma sessão, cookie ou autenticação | CSRF, fixação de sessão, roubo de sessão |
| Nenhuma renderização de HTML no servidor | XSS refletido |

Listar isso não é enfeite: torna explícito **o que mudaria** se um desses recursos fosse
adicionado. Quem incluir um banco depois precisa reabrir esta tabela.

---

## Segredos

| Regra | Verificação |
|---|---|
| Key só no servidor, nunca no Flutter | `grep -rniE '(api[_-]?key|secret)' flutter_app/lib/` |
| Key lida em um único arquivo (`pkg/config/env.ts`) | Revisão de código |
| Key nunca em log, em nenhum nível | Revisão do logger |
| Key nunca em resposta HTTP | Formato único de erro |
| `.env` no `.gitignore` desde a fase 01 | `git ls-files \| grep '\.env$'` |
| `.env.example` sem valor real | **Teste automatizado** (`tests/unit/env-example.test.ts`) |
| `.env.example` cobre toda variável que o código lê | **Teste automatizado**, derivado do schema |
| Nenhuma key no histórico do Git | `git log -p --all \| grep -E 'sk-\|AIza'` |

> **O `.env.example` já tinha desincronizado.** As duas variáveis de retry criadas na fase
> 04 (`LLM_MAX_RETRIES`, `LLM_RETRY_BASE_DELAY_MS`) nunca chegaram ao exemplo — ou seja, o
> único documento de configuração que um avaliador lê antes de rodar o projeto escondia
> dois botões. Corrigido, e agora guardado por um teste que deriva a lista do próprio
> schema Zod, em vez de depender de alguém lembrar.

**Procedimento em caso de exposição:** revogar a key no provider **primeiro**, limpar o
histórico depois. Chave exposta em repositório público é varrida por bots em minutos —
limpar o histórico antes de revogar resolve a aparência e não o problema.

Auditoria completa na [`fase 15`](../02-phases/phase-15-pre-delivery-review.md).

---

## Log — sanitização e privacidade

### Log injection (T8)

Entrada do usuário registrada sem sanitização permite forjar linhas de log:

```
occasion = "birthday\n2026-09-03 INFO  admin login succeeded"
```

Em log de linha, isso vira uma entrada falsa e envenena a investigação de um incidente.

**Duas defesas, sobrepostas:**
1. A camada 1 já **rejeita** quebra de linha na entrada.
2. O logger emite **JSON estruturado** (Pino), onde `\n` dentro de um valor é escapado e
   não cria linha nova.

### O que pode e o que não pode ir para o log

| Dado | `info` | `debug` |
|---|---|---|
| `requestId`, método, rota, status, latência | ✅ | ✅ |
| Nome do provider e do modelo | ✅ | ✅ |
| `degraded` e `reason` | ✅ | ✅ |
| **Valores de `occasion` / `relationship`** | ❌ | ✅ |
| **Prompt completo** | ❌ | ✅ |
| **Resposta completa do modelo** | ❌ | ✅ |
| **API key** | ❌ | ❌ **nunca** |

`debug` é para desenvolvimento. Em produção, `LOG_LEVEL=info` — e essa é a razão de a
distinção existir: os campos podem conter dado pessoal digitado pelo usuário (T5).

---

## Dependências (LLM03)

| Prática | Backend | Flutter |
|---|---|---|
| Lockfile versionado | `package-lock.json` | `pubspec.lock` |
| Instalação reprodutível | `npm ci` | `flutter pub get` |
| Auditoria antes da entrega | `npm audit --audit-level=high` | `flutter pub outdated` |
| Superfície mínima | Poucas dependências diretas | Só `http` |
| Versões fixadas | ✅ sem `^` em dependência de runtime | — |

### Resultado medido — 2026-09-03

```
$ npm audit --audit-level=high
found 0 vulnerabilities
```

As seis dependências de runtime, fixadas em versão exata para que um `npm install` numa
máquina nova não puxe silenciosamente um minor diferente do que foi testado:

| Pacote | Versão | Por que existe |
|---|---|---|
| `express` | 5.2.1 | Servidor HTTP |
| `helmet` | 8.3.0 | Cabeçalhos de segurança |
| `cors` | 2.8.6 | CORS configurável por ambiente |
| `zod` | 4.5.4 | Validação de entrada e de saída do modelo |
| `pino` | 10.3.1 | Log estruturado |
| `dotenv` | 17.4.2 | Carrega `.env` em desenvolvimento |

Nenhum SDK de provider de LLM: os três adapters usam `fetch` nativo
([`D33`](../00-overview/decisions-log.md)). Três dependências a menos, e três superfícies
a menos que precisariam de auditoria.

**Menos dependência é menos superfície.** É mais uma razão para a regra R1 (embrulhar
pacote externo atrás de interface própria): trocar uma dependência comprometida por outra
custa um arquivo, não uma refatoração — o que muda a resposta a incidente de "semanas" para
"tarde".

---

## Flutter

### Sem segredo no cliente

O app conhece **apenas** `API_BASE_URL`. Nenhuma key, nenhum token, nenhuma credencial.

`--dart-define` foi escolhido em vez de `.env` como asset justamente para não sugerir que
existe lugar seguro para segredo no cliente — não existe. Asset de app publicado é
extraível ([`ADR-0007`](../01-architecture/decisions/adr-0007-flutter-clean-dart.md)).

### Renderização

Regra da camada 4 ([`llm-security.md`](llm-security.md)): texto de sugestão só em `Text`,
nunca em widget que interprete marcação, sem `linkify`.

### Cleartext HTTP — configuração que **não pode** ir para release

Para o app falar com `http://localhost:3000` (ou `10.0.2.2`) durante o desenvolvimento:

- **Android** (API 28+) bloqueia cleartext por padrão. Exige `usesCleartextTraffic` ou um
  `network_security_config.xml`.
- **iOS** exige exceção de ATS.

**Ambas as permissões ficam restritas ao build de debug.** Uma delas vazando para release
transformaria todo o tráfego do app em texto claro, interceptável em qualquer rede
hostil — do tipo de erro que passa despercebido porque "funciona".

Item explícito de verificação na fase 15.

---

## Deploy — pendências ao publicar

Enquanto o alvo não é decidido ([`../04-operations/deploy.md`](../04-operations/deploy.md)),
o que já se sabe que será obrigatório:

- [ ] HTTPS obrigatório, com HSTS
- [ ] `CORS_ORIGINS` explícito — nunca `*`
- [ ] `NODE_ENV=production` (desliga stack trace e CORS permissivo)
- [ ] `LOG_LEVEL=info` — nunca `debug`
- [ ] Key como segredo do ambiente, jamais na imagem
- [ ] Rate limit revisado para exposição pública
- [ ] Teto de gasto e alerta configurados no provider de LLM
- [ ] `/health` sem dependência do LLM (já é assim)
- [ ] Container rodando com usuário não-root
- [ ] Decidir se `/docs` fica público

O teto de gasto no provider merece destaque: é o único controle que funciona quando **todos
os outros falharem**. Rate limit protege contra abuso conhecido; o teto protege contra o
que ninguém previu.
