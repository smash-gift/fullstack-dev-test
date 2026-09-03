# Matriz de rastreabilidade — requisito → entrega

Documento que existe para responder a uma pergunta só: **cada exigência escrita no
enunciado foi atendida, e onde?**

O enunciado original está preservado em
[`original-test.md`](original-test.md).

Legenda de status:
`✅ feito` · `🚧 em andamento` · `⬜ pendente` · `🟦 decisão documentada` (requisito
resolvido por decisão explícita, não por código)

---

## 1. Backend (Node.js / TypeScript)

| # | Requisito (citação do enunciado) | Status | Onde |
|---|---|---|---|
| B1 | *"Input: `occasion` and `relationship`"* | ✅ | `03-api/contract.md` |
| B2 | *"Output: 2–3 short message suggestions suitable for a gift card"* | ✅ | `03-api/contract.md` |
| B3 | *"You choose the HTTP method, request/response format, **and document it**"* | ✅ | `03-api/contract.md` |
| B4 | *"Call one LLM provider (OpenAI or Google AI)"* | ✅ | `ADR-0002` · OpenAI verificado ao vivo em 2026-09-03 |
| B5 | *"How you structure the prompt ... is up to you"* | ✅ | `01-architecture/backend.md` |
| B6 | *"the backend must **not expose raw errors** to the client"* | ✅ | `ADR-0004` |
| B7 | *"Document ... **what you consider a failure**, how you respond to the client, and why"* | ✅ | `ADR-0003` |
| B8 | *"Rate limiting (optional) — if you implement it, document the limit and the behavior"* | ✅ | `ADR-0005` · `03-api/contract.md` |
| B9 | *"**In your README**, describe how you would **reduce cost in production**"* | 🟦 | `ADR-0006` — análise pronta; **o README só nasce na fase 14** |
| B10 | *"**In your README** ... whether you implemented any **caching** in this test (and why or why not)"* | 🟦 | `ADR-0006` — decisão registrada; **o README só nasce na fase 14** |

> **B9 e B10 estavam marcados como ⬜ e ✅ respectivamente, e nenhum dos dois estava certo.**
> O enunciado exige as duas respostas **no README**, que ainda não existe. O conteúdo está
> pronto no `ADR-0006`; o que falta é o lugar onde o enunciado pede que ele apareça. Marcar
> B10 como feito era afirmar uma entrega que ninguém consegue ler. Ambos viram `✅` na
> [fase 14](../02-phases/phase-14-readme.md).

## 2. Frontend (Flutter / Dart)

| # | Requisito | Status | Onde |
|---|---|---|---|
| F1 | *"One main screen: inputs for occasion and relationship"* | ✅ | `suggestions_page.dart` — uma rota, ajustes em modal |
| F2 | *"a way to request suggestions, and display of the results"* | ✅ | `phase-09` — com copiar e contagem de caracteres |
| F3 | *"At least one flow (e.g. **Birthday + Friend**) must work end-to-end"* | ✅ | `phase-12` — medido contra `gpt-4o-mini`, e também em pt |
| F4 | *"Handle **loading, success, and error** states"* | ✅ | `phase-11` — **cinco** estados; degradado é o quarto |
| F5 | *"The app must call your backend; the **base URL should be configurable**"* | ✅ | `--dart-define` **e** editável em runtime |
| F6 | *"README must explain how to run backend and app and **which URL to use**"* | 🟦 | `04-operations/running-locally.md` — **o README nasce na fase 14** |
| F7 | *"Organize the project so that **UI, API client, and state are clearly separated**"* | ✅ | `phase-10` — 22 testes estáticos guardando as camadas |

## 3. Documentação (no README do fork)

| # | Requisito | Status | Onde |
|---|---|---|---|
| D1 | *"how to run the project (backend and app)"* | ⬜ | `README.md` (EN) |
| D2 | *"a short description of the architecture (**a diagram is encouraged**)"* | ⬜ | `README.md` + `01-architecture/overview.md` |
| D3 | *"your decisions and trade-offs (errors, rate limiting, cost/caching)"* | ⬜ | `README.md` + ADRs |
| D4 | *"if you used an AI assistant — **how you used it and what you implemented or decided yourself**"* | ⬜ | `06-ai-usage/ai-usage.md` |

## 4. Testes (opcional, mas valorizado)

| # | Requisito | Status | Onde |
|---|---|---|---|
| T1 | *"at least one test that covers the **fallback path when the LLM fails**"* | ✅ | `tests/integration/fallback.route.test.ts` — 39 casos, os cinco modos de falha |
| T2 | *"More tests (happy path, rate limiting) are a plus"* | ✅ | 707 testes offline, 99,58% de statements |
| T3 | *"Flutter: unit or widget tests for the main screen are a plus"* | ✅ | 95 testes offline · os cinco estados · `phase-13` |

## 5. Processo de entrega

| # | Requisito | Status | Onde |
|---|---|---|---|
| P1 | *"Fork this repository to your own GitHub account"* | ✅ | `ToteADS/fullstack-dev-test` |
| P2 | *"Create a branch (e.g. `candidate/jane-doe`)"* | ✅ | `candidate/tote-araujo` |
| P3 | *"two folders at the root ... (e.g. `backend/` and `flutter_app/`)"* | 🚧 | `backend/` ✅ · `flutter_app/` na `phase-09` |
| P4 | *"Open a Pull Request from your branch to the original repository's main"* | ⬜ | `phase-16` |

---

## 6. Requisitos acrescentados além do enunciado

O enunciado não menciona segurança. Estes itens foram acrescentados por decisão própria,
porque o sistema aceita texto livre do usuário e o envia a um LLM — superfície de ataque
que existe independentemente de o enunciado citá-la.

| # | Item | Status | Onde |
|---|---|---|---|
| S1 | Modelo de ameaça do sistema | ✅ | `05-security/threat-model.md` |
| S2 | Defesa em 4 camadas contra prompt injection | ✅ | `ADR-0009` · `phase-05` |
| S3 | Validação de saída do modelo antes de exibir | ✅ | `phase-05` — guard como porta do domínio |
| S4 | Baseline de segurança HTTP e de segredos | ✅ | `ADR-0010` · `phase-06` |
| S5 | Suíte de testes de segurança (offline) | ✅ | `phase-08` — corpus de 38 payloads, S1–S6 |
| S6 | Suíte live de red-team, com relatório | ✅ | [`live-redteam-report.md`](../05-security/live-redteam-report.md) |
| S8 | Regras de arquitetura verificadas por máquina | ✅ | `tests/architecture/architecture-rules.test.ts` |
| S7 | Cobertura do OWASP LLM Top 10 mapeada | ✅ | `05-security/llm-security.md` |

**Nota de escopo.** Isso amplia o escopo além do pedido, o que normalmente seria um erro em
prova cronometrada. A justificativa: entregar um endpoint que recebe texto livre e o
repassa a um LLM sem qualquer tratamento seria construir a vulnerabilidade sabendo dela —
e o enunciado avalia explicitamente *"architectural choices"* e *"error handling"*.

---

## Ambiguidades do enunciado e como foram resolvidas

Nenhuma dessas resoluções é palpite silencioso: cada uma está justificada em um ADR.

### A1 — "Firebase (Firestore, Cloud Functions, Auth)" na linha de stack

**A ambiguidade.** Firebase aparece **uma única vez** no enunciado inteiro, na linha
`Stack:` do cabeçalho. Não aparece em *Prerequisites*, *Detailed requirements*,
*Documentation*, *Tests* nem *What we evaluate*.

**Evidência decisiva.** A seção *Prerequisites* lista explicitamente "LLM API access:
OpenAI API key **or** Google AI key" — mas **não lista projeto Firebase**. Se Firebase
fosse necessário para executar a solução, estaria ali junto dos outros pré-requisitos.

**Resolução.** Interpretado como **descrição da stack da empresa**, não como requisito
deste teste. Some-se a isso que a feature é *stateless* (`occasion + relationship → LLM →
sugestões`): não há entidade a persistir, usuário a autenticar nem sessão a manter.
Firebase fica fora do runtime, e o `ADR-0008` documenta exatamente onde cada peça
(Firestore, Cloud Functions, Auth) se encaixaria na arquitetura proposta.

→ [`ADR-0008`](../01-architecture/decisions/adr-0008-firebase-out-of-runtime.md)

### A2 — "2–3 suggestions": o número é fixo ou faixa?

**Resolução.** Tratado como **faixa válida**. A API aceita `count` opcional, restrito a
`2..3`, com **default 3**. Qualquer valor fora da faixa é rejeitado com `400`. O fallback
também respeita a faixa, para o cliente nunca receber uma quantidade diferente da pedida.

### A3 — Falha do LLM deve devolver erro HTTP?

**A ambiguidade.** O enunciado diz *"the backend should return a safe fallback instead of
an error stack"*, mas não define o status HTTP.

**Resolução.** `HTTP 200` com o campo `degraded: true` e o motivo em `meta.reason`.
O raciocínio completo — inclusive por que `503` foi descartado — está no `ADR-0003`.

→ [`ADR-0003`](../01-architecture/decisions/adr-0003-fallback-strategy.md)

### A4 — "Call **one** LLM provider"

**A ambiguidade.** "One provider" restringe o **runtime** (uma chamada por requisição) ou
a **base de código** (só um adapter pode existir)?

**Resolução.** Interpretado como restrição de **runtime**: cada requisição chama
exatamente um provider, sem fan-out e sem cascata entre providers — que é o que mantém
custo e latência sob controle, a razão declarada no próprio enunciado ("to keep cost and
latency reasonable"). A base de código tem três adapters selecionáveis por variável de
ambiente, sendo o **OpenAI o default** para cumprir a letra do requisito.

→ [`ADR-0002`](../01-architecture/decisions/adr-0002-llm-provider-port-and-adapters.md)
