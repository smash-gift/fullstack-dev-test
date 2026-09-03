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
| B1 | *"Input: `occasion` and `relationship`"* | ⬜ | `03-api/contract.md` |
| B2 | *"Output: 2–3 short message suggestions suitable for a gift card"* | ⬜ | `03-api/contract.md` |
| B3 | *"You choose the HTTP method, request/response format, **and document it**"* | ⬜ | `03-api/contract.md` |
| B4 | *"Call one LLM provider (OpenAI or Google AI)"* | ⬜ | `ADR-0002` |
| B5 | *"How you structure the prompt ... is up to you"* | ⬜ | `01-architecture/backend.md` |
| B6 | *"the backend must **not expose raw errors** to the client"* | ⬜ | `ADR-0004` |
| B7 | *"Document ... **what you consider a failure**, how you respond to the client, and why"* | ⬜ | `ADR-0003` |
| B8 | *"Rate limiting (optional) — if you implement it, document the limit and the behavior"* | ⬜ | `ADR-0005` |
| B9 | *"describe how you would **reduce cost in production**"* | ⬜ | `ADR-0006` |
| B10 | *"whether you implemented any **caching** in this test (and why or why not)"* | ⬜ | `ADR-0006` |

## 2. Frontend (Flutter / Dart)

| # | Requisito | Status | Onde |
|---|---|---|---|
| F1 | *"One main screen: inputs for occasion and relationship"* | ⬜ | `01-architecture/frontend.md` |
| F2 | *"a way to request suggestions, and display of the results"* | ⬜ | `phase-09` |
| F3 | *"At least one flow (e.g. **Birthday + Friend**) must work end-to-end"* | ⬜ | `phase-12` |
| F4 | *"Handle **loading, success, and error** states"* | ⬜ | `phase-11` |
| F5 | *"The app must call your backend; the **base URL should be configurable**"* | ⬜ | `04-operations/environment.md` |
| F6 | *"README must explain how to run backend and app and **which URL to use**"* | ⬜ | `04-operations/running-locally.md` |
| F7 | *"Organize the project so that **UI, API client, and state are clearly separated**"* | ⬜ | `ADR-0007` |

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
| T1 | *"at least one test that covers the **fallback path when the LLM fails**"* | ⬜ | `phase-08` |
| T2 | *"More tests (happy path, rate limiting) are a plus"* | ⬜ | `phase-08` |
| T3 | *"Flutter: unit or widget tests for the main screen are a plus"* | ⬜ | `phase-13` |

## 5. Processo de entrega

| # | Requisito | Status | Onde |
|---|---|---|---|
| P1 | *"Fork this repository to your own GitHub account"* | ✅ | `ToteADS/fullstack-dev-test` |
| P2 | *"Create a branch (e.g. `candidate/jane-doe`)"* | ✅ | `candidate/tote-araujo` |
| P3 | *"two folders at the root ... (e.g. `backend/` and `flutter_app/`)"* | ⬜ | `phase-01` |
| P4 | *"Open a Pull Request from your branch to the original repository's main"* | ⬜ | `phase-16` |

---

## 6. Requisitos acrescentados além do enunciado

O enunciado não menciona segurança. Estes itens foram acrescentados por decisão própria,
porque o sistema aceita texto livre do usuário e o envia a um LLM — superfície de ataque
que existe independentemente de o enunciado citá-la.

| # | Item | Status | Onde |
|---|---|---|---|
| S1 | Modelo de ameaça do sistema | ✅ | `05-security/threat-model.md` |
| S2 | Defesa em 4 camadas contra prompt injection | ⬜ | `ADR-0009` · `phase-05` |
| S3 | Validação de saída do modelo antes de exibir | ⬜ | `05-security/llm-security.md` |
| S4 | Baseline de segurança HTTP e de segredos | ⬜ | `ADR-0010` · `phase-06` |
| S5 | Suíte de testes de segurança (offline) | ⬜ | `phase-08` |
| S6 | Suíte live de red-team, com relatório | ⬜ | `05-security/security-testing.md` |
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
