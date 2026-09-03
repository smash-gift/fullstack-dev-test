# Log de decisões — quem decidiu o quê

O teste avalia explicitamente **Transparency**:

> *"if you used an AI assistant — **how you used it and what you implemented or decided
> yourself**"*

Este arquivo é o registro bruto disso: cada decisão de projeto, quem a tomou, e qual foi
a alternativa descartada. A versão narrativa e resumida está em
[`../06-ai-usage/ai-usage.md`](../06-ai-usage/ai-usage.md); o README em inglês traz a
versão curta para o avaliador.

**Convenção de autoria:**

- **Humano** — decidido pelo desenvolvedor (Tote Araujo). O assistente apresentou opções
  e trade-offs; a escolha foi humana.
- **Assistente** — proposto pelo assistente de IA e aceito sem alteração.
- **Conjunto** — o assistente identificou um conflito ou risco que o humano não havia
  considerado, e a decisão final foi do humano em resposta a isso.

---

## Decisões estruturais

| # | Decisão | Escolha | Autoria | Alternativa descartada |
|---|---|---|---|---|
| D01 | Arquitetura geral | Clean Architecture + SOLID nos dois projetos | **Humano** | Camadas simples (controller/service) |
| D02 | Idioma da documentação | README em inglês, `/docs` em português | **Humano** | Tudo em inglês; tudo em português |
| D03 | Organização de `/docs` | Dividida por fases, 1 fase = 1 item do checklist | **Humano** | Documento único monolítico |
| D04 | Estrutura de pastas raiz | `backend/` + `flutter_app/` | **Humano** | Monorepo com workspaces |

## Decisões de LLM

| # | Decisão | Escolha | Autoria | Alternativa descartada |
|---|---|---|---|---|
| D05 | Abstração do provider | Port `LlmProvider` no domain + adapters no infra | **Conjunto** | Chamar o SDK direto no service |
| D06 | Quantos adapters | Três: OpenAI, OpenRouter, Gemini | **Humano** | Um só |
| D07 | Provider default | OpenAI | **Conjunto** | OpenRouter como default |
| D08 | Uma chamada por request | Sem cascata entre providers | **Assistente** | Failover automático entre providers |

**Contexto de D07 — o conflito que motivou a decisão.** A intenção inicial do
desenvolvedor era usar **OpenRouter** como gateway, pela facilidade de trocar de modelo.
O assistente apontou que o enunciado exige literalmente *"Call one LLM provider (OpenAI
**or** Google AI)"* e que OpenRouter, sendo um *gateway*, não é nenhum dos dois — o que
poderia ser lido pelo avaliador como requisito não cumprido. A decisão final, humana, foi
manter os três adapters mas **promover OpenAI a default**, satisfazendo a letra do
requisito sem abrir mão da flexibilidade. O trade-off está registrado em `ADR-0002`.

## Decisões de resiliência

| # | Decisão | Escolha | Autoria | Alternativa descartada |
|---|---|---|---|---|
| D09 | Status HTTP no fallback | `200` + `degraded: true` | **Assistente** | `503 Service Unavailable` |
| D10 | Origem do fallback | Banco de templates curados | **Assistente** | Cache obsoleto; mensagem de erro só |
| D11 | Política de retry | 1 retry em 5xx/timeout, zero em 429 | **Assistente** | Retry exponencial em tudo |
| D12 | Rate limiting | 30 req / 5 min por IP | **Humano** | Não implementar (é opcional no teste) |
| D13 | Cache | LRU em memória, TTL 10 min, atrás de port | **Humano** | Não implementar; Redis desde já |

## Decisões de Flutter

| # | Decisão | Escolha | Autoria | Alternativa descartada |
|---|---|---|---|---|
| D14 | Gerência de estado | `ChangeNotifier` puro | **Humano** | MobX (padrão pessoal do dev, exige codegen) |
| D15 | Injeção de dependência | Manual, sem `flutter_modular` | **Humano** | Modular |
| D16 | Cliente HTTP | Pacote `http` atrás de interface própria | **Assistente** | `dio` direto nos datasources |
| D17 | Configuração da URL | `--dart-define=API_BASE_URL` | **Assistente** | Constante hardcoded; arquivo `.env` no app |

## Decisões de segurança

| # | Decisão | Escolha | Autoria | Alternativa descartada |
|---|---|---|---|---|
| D22 | Tratar segurança de LLM como escopo | Incluída, apesar de o enunciado não pedir | **Humano** | Ignorar, por não constar do enunciado |
| D23 | Estratégia de defesa | 4 camadas, com peso na **validação de saída** | **Conjunto** | Só filtro de entrada; classificador via LLM |
| D24 | Destino de uma violação | Reutilizar o caminho de fallback do ADR-0003 | **Assistente** | Erro dedicado `422`; resposta específica de segurança |
| D25 | Suíte live de red-team | Implementada, gated e pulada por default | **Humano** | Só offline; live obrigatória |
| D26 | Heurística de injeção na entrada | Rejeita com `400`, aceitando falso positivo | **Assistente** | Sanitizar em silêncio e prosseguir |
| D27 | Moderação de conteúdo via API | **Não** implementada | **Assistente** | Chamada extra de moderação por requisição |

**Contexto de D22 — a lacuna apontada pelo desenvolvedor.** A proposta inicial de
arquitetura tratava o LLM apenas como dependência que pode **falhar**, cobrindo timeout,
`429` e `5xx`. O desenvolvedor apontou que faltava a dimensão de **segurança**: o LLM
também é superfície de ataque, e o projeto precisava cobrir prompt injection e os demais
riscos conhecidos, com testes. A lacuna era real. Disso nasceram as fases 05 e 06, a seção
`05-security/` e os ADRs 0009 e 0010.

**Contexto de D24 — por que não criar um caminho de erro próprio.** A proposta do
assistente foi reutilizar o funil de fallback já construído na fase 04. Além de economizar
código, isso produz uma propriedade de segurança que um caminho dedicado não teria: a
resposta a uma injeção bloqueada fica **indistinguível** da resposta a um timeout do
provider. O atacante não recebe sinal sobre qual regra disparou — o que encarece a
exploração por tentativa e erro.

## Decisões de escopo

| # | Decisão | Escolha | Autoria | Alternativa descartada |
|---|---|---|---|---|
| D18 | Firebase | Fora do runtime, documentado em `ADR-0008` | **Conjunto** | Firestore como cache; Cloud Functions como deploy; Auth |
| D19 | Framework de teste (backend) | Vitest | **Assistente** | Jest |
| D20 | Documentação de API | Swagger UI a partir dos schemas Zod | **Humano** | Markdown apenas |
| D21 | Deploy | Decisão adiada para o fim do projeto | **Humano** | Definir antes de começar |

**Contexto de D18 — a dúvida levantada pelo desenvolvedor.** O desenvolvedor questionou
se o Firebase citado no enunciado seria o banco de dados da solução. O assistente
levantou a evidência textual (Firebase ausente de *Prerequisites*, presente apenas na
linha de stack) e o fato de a feature ser *stateless*, apresentou quatro caminhos
possíveis — inclusive abrir uma *issue* no repositório original, como o próprio enunciado
sugere — e a decisão humana foi **manter fora do runtime com ADR explicando os encaixes**.

## Decisões tomadas durante a implementação

| # | Decisão | Escolha | Autoria | Alternativa descartada | Fase |
|---|---|---|---|---|---|
| D28 | Antecipar o cache LRU | Implementado na fase 02, não na 07 | **Assistente** | Entregar só `NoOpCache` e manter o cronograma | 02 |
| D29 | Sistema de módulos | ESM + `NodeNext` | **Assistente** | CommonJS | 02 |
| D30 | Framework HTTP | Express 5 | **Assistente** | Express 4; Fastify | 02 |
| D31 | Valor `stub` em `LLM_PROVIDER`, como default | Servidor sobe com `.env` vazio | **Assistente** | Exigir key desde a fase 02 | 02 |
| D32 | `pkg/errors/` não criado | Erros vivem em `domain/errors/` | **Assistente** | Classe `AppError` genérica em `pkg/` | 02 |
| D33 | Cliente HTTP dos adapters | `fetch` nativo, sem SDK de provider | **Assistente** | SDKs oficiais das três APIs | 03 |
| D34 | Versão de modelo | **Fixada** (`gemini-3.8-flash`) | **Assistente** | Alias `-latest` | 03 |
| D35 | Modelo default do OpenRouter | `openai/gpt-4o-mini` — o mesmo do adapter direto | **Assistente** | Um modelo diferente, mais barato | 03 |
| D36 | Key do Gemini | Header `x-goog-api-key` | **Assistente** | Query string `?key=` | 03 |
| D37 | Saída estruturada | `json_schema` na OpenAI, `json_object` no OpenRouter | **Assistente** | `json_object` em todos; nenhum dos dois | 03 |
| D38 | Script `verify` | Um comando roda typecheck + lint + format + testes | **Assistente** | Depender de lembrar cada comando | 03 |

**Contexto de D33 — por que não usar os SDKs oficiais.** Três razões, em ordem de peso:
o timeout continua sendo nosso (SDKs trazem retry e timeout próprios, que competiriam com
a política do use case); o mapeamento de status HTTP para erro de domínio fica em **uma
tabela legível**, em vez de inferido de tipos de exceção específicos de cada SDK; e a
superfície de supply chain não cresce (LLM03). O custo declarado é que os corpos de
requisição são escritos à mão — contido pela validação Zod, que transforma divergência de
API em `LlmInvalidResponseError` e degradação, não em dado corrompido.

**Contexto de D34 — a verificação que mudou o valor.** A expectativa era `gemini-2.0-flash`
ou `gemini-2.5-flash`. A consulta ao catálogo real do OpenRouter (425 modelos) e à
documentação da Google mostrou a linha **3.x**, com `gemini-3.8-flash` como Flash mais
recente. Documentar de memória teria produzido instrução que parece certa e falha na
primeira execução. O alias `-latest` foi descartado porque a documentação não confirma que
`gemini-flash-latest` seja endpoint ativo, e porque um alias com hot-swap a cada release
muda latência, custo e comportamento sem aviso.

**Contexto de D38 — a lacuna no processo.** O `npm test` passou verde com um erro de tipo
presente nos testes: Vitest não faz typecheck. O erro só apareceu quando `npm run
typecheck` foi rodado à parte. Em vez de confiar em lembrar de rodar cada comando, o
script `verify` passou a encadear os quatro.

**Contexto de D28 — quando o plano cede.** O plano previa o cache na fase 07. Só que o
`.env.example` da fase 02 já documenta `CACHE_ENABLED=true`, e o use case já depende do
port `SuggestionCache`. Entregar a fase com apenas um `NoOpSuggestionCache` publicaria uma
flag de configuração que **não faz nada** — documentação que mente, o que é pior que
atrasar cronograma. O cache foi antecipado e o desvio registrado nas duas fases envolvidas,
em vez de o plano ser silenciosamente reescrito.

**Contexto de D31 — otimizar para quem vai avaliar.** Com `stub` como default, `npm run
dev` funciona sem nenhuma configuração. O avaliador consegue exercitar o contrato inteiro,
a validação e o formato de resposta **antes** de precisar de qualquer API key. A fase 03
promove `openai` a default, conforme o `ADR-0002`.

---

## Como este log é mantido

Cada nova decisão relevante entra na tabela da seção correspondente **no momento em que é
tomada**, não retroativamente no fim do projeto. Decisões que se mostrarem erradas durante
a execução não são apagadas: ganham uma linha nova marcando a reversão e o motivo, porque
uma decisão revista com justificativa é informação mais útil ao avaliador do que um
histórico limpo.
