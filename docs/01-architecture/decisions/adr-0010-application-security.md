# ADR-0010 — Baseline de segurança da aplicação

**Status:** Aceito · **Data:** 2026-09-03 · **Autoria:** Assistente (D25, D26, D27)

## Contexto

Além das ameaças específicas de LLM ([`ADR-0009`](adr-0009-llm-security.md)), o sistema é
uma API HTTP pública e um app cliente. Valem as preocupações de sempre: cabeçalhos,
limites, segredos, dependências e configuração de cliente.

Duas restrições orientam o quanto investir:

1. O enunciado avalia *"Clear run instructions"* — controle que exija infraestrutura extra
   piora a entrega.
2. O sistema tem **superfície pequena**: sem banco, sem autenticação, sem upload, sem URL
   controlada pelo usuário. Muita coisa do checklist tradicional simplesmente não se aplica.

Aplicar controle onde não há ameaça é teatro. Vale mais mapear o que **não existe** e
concentrar esforço no que existe.

## Decisão

Baseline enxuto, com cada controle amarrado a uma ameaça do
[`threat-model.md`](../../05-security/threat-model.md).

### Controles adotados

| Controle | Ameaça | Custo |
|---|---|---|
| `helmet` | Diversos | 1 linha |
| `x-powered-by` desligado | Fingerprinting | 1 linha |
| Corpo limitado a 4 KB | T3 — DoS por payload | 1 linha |
| Validação Zod na borda | T1, entrada malformada | já existia |
| Rate limit | T3 | [ADR-0005](adr-0005-rate-limiting.md) |
| Formato único de erro, sem stack | Vazamento de informação | [ADR-0004](adr-0004-error-taxonomy.md) |
| Log JSON estruturado | T8 — log injection | já existia (Pino) |
| Política de nível de log | T5 — privacidade | convenção |
| Lockfile + `npm audit` | T7 — supply chain | comando na fase 16 |
| Auditoria de segredo no histórico | T6 | comando na fase 16 |
| Cleartext HTTP só em debug | Interceptação de tráfego | config de manifesto |

### Superfícies declaradas como inexistentes

| Ausência | Elimina |
|---|---|
| Nenhum banco | SQL / NoSQL injection |
| Nenhuma URL controlada pelo usuário | SSRF |
| Nenhum `exec` / `eval` / spawn | Command injection |
| Nenhuma leitura de arquivo por caminho do usuário | Path traversal |
| Nenhum upload | Malware, zip bomb |
| Nenhuma sessão ou cookie | CSRF, fixação, roubo de sessão |
| Nenhuma renderização de HTML no servidor | XSS refletido |

Esta tabela é parte do controle, não enfeite: torna explícito **o que precisa ser
reavaliado** quando alguém adicionar um desses recursos.

### Três pontos que merecem destaque

**1. `4kb` de limite de corpo.** O maior campo tem 60 caracteres. Corpo grande aqui só
existe por engano ou por má-fé — e o limite corta antes de qualquer parsing custoso.

**2. Nível de log é decisão de privacidade, não de verbosidade.** `occasion` e
`relationship` são texto livre: o usuário pode digitar nome de pessoa. Por isso valores de
campo e prompt completo só saem em `debug`, e produção roda em `info`.

**3. Cleartext HTTP em Android/iOS é a armadilha silenciosa.** Para o app falar com
`http://10.0.2.2:3000` em desenvolvimento, é preciso permitir tráfego não criptografado.
Essa permissão **vazando para o build de release** transformaria todo o tráfego do app em
texto claro, interceptável em qualquer rede hostil. É o tipo de erro que passa despercebido
porque "funciona". Vira item bloqueante do checklist da fase 16.

## Alternativas descartadas

| Descartado | Motivo |
|---|---|
| **WAF / proxy de segurança** | Infraestrutura extra; quebra o "clone e roda" |
| **Autenticação de API (key ou JWT)** | Não há requisito de conta; o enunciado pede "One main screen". Rate limit por IP cobre o abuso realista |
| **CSP restritiva** | API JSON não renderiza HTML; só faria diferença para o Swagger UI |
| **`npm ci --ignore-scripts`** | Quebra pacotes legítimos com build nativo; ganho pequeno diante do risco |
| **Assinatura de commits** | Não protege contra nenhuma ameaça deste modelo |
| **Certificate pinning no Flutter** | Ganho real, mas o backend é `localhost` no teste. Entraria com deploy em domínio fixo |

## Consequências

**Positivas**
- Custo de implementação baixo — a maioria é uma linha ou uma convenção.
- Cada controle é rastreável a uma ameaça nomeada, e não a um checklist genérico.
- Superfícies inexistentes documentadas, o que orienta quem estender o sistema.

**Negativas — assumidas**
- **Sem autenticação**, o rate limit por IP é a única barreira de custo, com as fraquezas
  já admitidas no [`ADR-0005`](adr-0005-rate-limiting.md): NAT compartilhado e IP rotativo.
- **Sem WAF**, ataques em camada de rede não são tratados — ficariam a cargo do provedor
  de deploy.
- Auditoria de dependência é manual (comando na fase 16), não automatizada em CI. Em
  projeto de vida longa, seria um job agendado.
