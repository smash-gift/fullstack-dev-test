# Baseline de segurança da aplicação

Segurança que não é específica de LLM: HTTP, segredos, dependências e configuração de
cliente. Complementa [`llm-security.md`](llm-security.md).

---

## Backend — HTTP

| Controle | Implementação | Ameaça |
|---|---|---|
| Cabeçalhos de segurança | `helmet` | Diversos |
| `X-Powered-By` desligado | `app.disable('x-powered-by')` | Fingerprinting |
| Limite de corpo | `express.json({ limit: '4kb' })` | T3 — DoS por payload |
| Validação de entrada | Zod na borda | T1, entrada malformada |
| Rate limiting | 30 / 5 min por IP | T3 |
| CORS | Lista explícita em produção | Uso cruzado indevido |
| Sem stack trace na resposta | `error-handler` final | Vazamento de informação |
| Timeout em toda chamada externa | `AbortController` | Exaustão de recurso |

**4 KB de limite de corpo** é generoso para uma requisição cujo maior campo tem 60
caracteres. Corpo grande aqui só existe por engano ou por má-fé.

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
| `.env.example` sem valor real | Inspeção |
| Nenhuma key no histórico do Git | `git log -p --all \| grep -E 'sk-\|AIza'` |

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
| Versões fixadas | Sem `^` em dependência de runtime | — |

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
