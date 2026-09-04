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
| Rate limiting | 30 / 5 min por IP, antes do body parser | T3 | ✅ fase 07 |
| CORS | Lista explícita em produção, **imposta no boot** | Uso cruzado indevido | ✅ fase 07 |
| CSP | Escopada em `/docs` | XSS na única página HTML | ✅ fase 07 |
| Identidade do cliente | `TRUST_PROXY_HOPS`, nunca `trust proxy: true` | Bypass do rate limit por `X-Forwarded-For` forjado | ✅ fase 07 |
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
| `contentSecurityPolicy: false` **globalmente** | Esta API não devolve documento que um navegador renderize. A fase 07 **reativou** a política, escopada em `/docs` — a única rota que serve HTML |
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

### A CSP de `/docs`

A única rota que devolve HTML, e a única com política:

```
default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self'; connect-src 'self';
base-uri 'none'; form-action 'none'; frame-ancestors 'none'
```

`script-src 'self'` só é possível porque a página e o inicializador do Swagger UI são
**arquivos nossos**: o `swagger-ui-express` injetaria `<script>` inline e obrigaria
`'unsafe-inline'` no diretivo que mais importa. `style-src 'unsafe-inline'` é um
afrouxamento real — o Swagger UI injeta estilo em runtime —, confinado a uma página cujo
conteúdo inteiro nós escrevemos.

Os assets vêm de uma **allowlist de três arquivos**; `.map`, `package.json` e
`oauth2-redirect.html` respondem `404`, com teste. Uma atualização de dependência não
decide o que esta API expõe.

Verificado renderizando em Chrome headless — as duas operações aparecem, com zero violações
de CSP —, e não lendo a documentação do `helmet`.

### Rate limiting: a ordem é o controle

O limitador é montado **antes** do body parser e do controller, e **depois** do CORS. As
três propriedades que saem disso não são acidente:

| Propriedade | Por quê |
|---|---|
| Requisição bloqueada custa zero em token | O middleware corta antes de qualquer chamada ao modelo |
| `429` chega ao navegador com `Access-Control-Allow-Origin` | CORS roda antes; sem isso o cliente vê "erro de CORS" e nunca sabe que foi limitado |
| Preflight `OPTIONS` não consome quota | Respondido pelo CORS, nunca chega ao contador |

**A identidade do cliente é o ponto frágil**, e a mitigação óbvia é a errada:
`trust proxy: true` faria o Express aceitar o que o `X-Forwarded-For` disser, deixando o
limite a um cabeçalho de distância de ser contornado. Por isso `TRUST_PROXY_HOPS` é uma
contagem de saltos, o schema **rejeita** o valor `true`, e há teste confirmando que um
`X-Forwarded-For` forjado não cria identidade nova quando não há proxy configurado.

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
| Key só no servidor, nunca no Flutter | **Teste automatizado** (`flutter_app/test/architecture/`) |
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

Auditoria completa na [`fase 16`](../02-phases/phase-16-pre-delivery-review.md).

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
| `zod` | 4.5.4 | Validação de entrada, de saída do modelo **e geração do OpenAPI** |
| `pino` | 10.3.1 | Log estruturado |
| `dotenv` | 17.4.2 | Carrega `.env` em desenvolvimento |
| `express-rate-limit` | 8.7.0 | Rate limiting por IP *(fase 07)* |
| `swagger-ui-dist` | 5.32.14 | Assets do Swagger UI, servidos localmente *(fase 07)* |

> **A fase 07 não instalou o gerador de OpenAPI que o plano previa.** O Zod 4.5 emite JSON
> Schema nativamente, então `@asteasolutions/zod-to-openapi` e suas duas dependências
> ficaram de fora. Menos superfície pela via mais barata: perceber que já havia a
> ferramenta.

**As versões fixadas agora têm teste** (`tests/unit/dependency-policy.test.ts`), em vez de
serem uma afirmação num documento.

### Telemetria de instalação — encontrada e desligada

`swagger-ui-dist` depende de `@scarf/scarf`, cujo `postinstall` reporta a instalação a um
terceiro. Quem clona este repositório não concordou com isso, então o opt-out está no
manifesto:

```json
"scarfSettings": { "enabled": false }
```

Escolhido em vez de `ignore-scripts=true` no `.npmrc`, que silenciaria esta telemetria
desabilitando o script de instalação de **todas** as dependências. Há teste garantindo que
o campo não seja perdido numa regeneração do `package.json`.

> A leitura do `report.js` do pacote (`userHasOptedOut`) confirma que o campo é lido do
> manifesto raiz. Não foi possível reproduzir a chamada de rede fora de uma instalação
> real: o que está documentado é o caminho de código, não uma requisição medida.

Nenhum SDK de provider de LLM: os três adapters usam `fetch` nativo
([`D33`](../00-overview/decisions-log.md)). Três dependências a menos, e três superfícies
a menos que precisariam de auditoria.

**Menos dependência é menos superfície.** É mais uma razão para a regra R1 (embrulhar
pacote externo atrás de interface própria): trocar uma dependência comprometida por outra
custa um arquivo, não uma refatoração — o que muda a resposta a incidente de "semanas" para
"tarde".

---

## Flutter

### Sem segredo no cliente — ✅ verificado por teste

O app conhece **apenas** `API_BASE_URL`. Nenhuma key, nenhum token, nenhuma credencial.

Três testes estáticos guardam isso: nada em `lib/` casa com o formato de uma chave real,
nada em `lib/` sequer **nomeia** uma credencial (`apiKey`, `secret`, `bearer`,
`authorization`), e o `AppConfig` não menciona `KEY`, `TOKEN` nem `SECRET`.

`--dart-define` foi escolhido em vez de `.env` como asset justamente para não sugerir que
existe lugar seguro para segredo no cliente — não existe. Asset de app publicado é
extraível ([`ADR-0007`](../01-architecture/decisions/adr-0007-flutter-clean-dart.md)).

### Renderização — ✅ verificado por teste

Regra da camada 4 ([`llm-security.md`](llm-security.md)): texto de sugestão só em `Text`,
nunca em widget que interprete marcação, sem `linkify`.

Nenhum pacote de HTML, Markdown, linkify, `url_launcher` ou webview existe no `pubspec`, e
nenhum símbolo desses aparece em `lib/`. Payloads reais — URL, `<script>`, link markdown —
são renderizados literalmente, e a asserção é que **nenhum ancestral do texto é um
`InkWell` ou `GestureDetector`**: o que escapar do guard do backend fica visível, nunca
tocável.

### Cleartext HTTP — configuração que **não pode** ir para release

Para o app falar com `http://localhost:3000` (ou `10.0.2.2`) durante o desenvolvimento:

- **Android** (API 28+) bloqueia cleartext por padrão. Exige `usesCleartextTraffic` ou um
  `network_security_config.xml`.
- **iOS** exige exceção de ATS.

**Ambas as permissões ficam restritas ao build de debug.** Uma delas vazando para release
transformaria todo o tráfego do app em texto claro, interceptável em qualquer rede
hostil — do tipo de erro que passa despercebido porque "funciona".

### Como isso foi implementado, e verificado

| Plataforma | Mecanismo | Por que é garantia e não convenção |
|---|---|---|
| Android | `network_security_config.xml` em `src/debug/res/xml/` | A **localização** é o controle: um build de release não compila esse diretório, edite quem editar o arquivo |
| iOS | `Info-Debug.plist` para Debug, `Info.plist` para Release e Profile | A exceção não existe no arquivo que o release compila; não há literal para alguém esquecer de remover |

Verificado nos **binários**, não no fonte:

```
app-release.apk   networkSecurityConfig ausente · usesCleartextTraffic ausente
                  network_security_config.xml não empacotado
app-debug.apk     exceção presente
Runner.app (rel)  nenhuma chave de ATS
Runner.app (dbg)  NSAllowsLocalNetworking = true
```

Mesmo em debug o iOS usa `NSAllowsLocalNetworking`, nunca `NSAllowsArbitraryLoads`:
cleartext alcança apenas hostnames locais.

> **A abordagem óbvia não funciona.** Substituir uma variável de build dentro do
> `Info.plist` (`<${VAR}/>`) quebra o build — o Xcode lê o arquivo como property list antes
> de expandir build settings. E mudar `INFOPLIST_FILE` só no xcconfig não tem efeito:
> configuração de target sobrepõe xcconfig. Os dois só apareceram porque os builds foram
> inspecionados.

Dois plists podem divergir, então **um teste afirma que a única diferença entre eles é o
bloco de ATS**.

---

## Deploy — pendências ao publicar

Enquanto o alvo não é decidido ([`../04-operations/deploy.md`](../04-operations/deploy.md)),
o que já se sabe que será obrigatório:

- [ ] HTTPS obrigatório, com HSTS
- [x] `CORS_ORIGINS` explícito — nunca `*` · **imposto pelo boot desde a fase 07**
- [ ] `NODE_ENV=production` (desliga stack trace e CORS permissivo)
- [ ] `LOG_LEVEL=info` — nunca `debug`
- [ ] Key como segredo do ambiente, jamais na imagem
- [ ] `TRUST_PROXY_HOPS` igual ao número real de proxies à frente — sem isso o rate
      limit conta todo mundo como um cliente só
- [ ] Rate limit revisado para exposição pública
- [ ] Teto de gasto e alerta configurados no provider de LLM
- [ ] `/health` sem dependência do LLM (já é assim)
- [ ] Container rodando com usuário não-root
- [ ] Decidir se `/docs` fica público (`DOCS_ENABLED`)

O teto de gasto no provider merece destaque: é o único controle que funciona quando **todos
os outros falharem**. Rate limit protege contra abuso conhecido; o teto protege contra o
que ninguém previu.
