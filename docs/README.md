# Documentação — AI Gift Card Message Suggester

> **Idioma:** esta pasta `/docs` é escrita em **português (PT-BR)** e serve como
> documentação interna de processo, arquitetura e rastreabilidade.
> O `README.md` na raiz do repositório é escrito em **inglês** — é o documento
> que o avaliador da Smash lê.
> Todo **código, nome de arquivo, variável, função e comentário em código** é
> escrito em inglês, sem exceção.

---

## Para que serve esta pasta

O teste técnico afirma explicitamente:

> *"We are interested in your **architectural choices**, **error handling**, and how you
> **document trade-offs** — not only in 'making the API call work.'"*

Ou seja: a documentação **não é acessório deste teste, é entregável de primeira classe**.
Esta pasta existe para tornar visível o raciocínio por trás de cada decisão — o que foi
escolhido, o que foi descartado, e **por quê**.

---

## Mapa da documentação

| Pasta | Conteúdo | Quando ler |
|---|---|---|
| [`00-overview/`](00-overview/) | Enunciado original, matriz de rastreabilidade, checklist, log de decisões | Para entender **o que** foi pedido |
| [`01-architecture/`](01-architecture/) | Visão geral, backend, frontend e os **ADRs** | Para entender **como** foi construído e **por quê** |
| [`02-phases/`](02-phases/) | As 16 fases de execução, com tasks e critério de pronto | Para acompanhar o **progresso** |
| [`03-api/`](03-api/) | Contrato da API, exemplos, códigos de erro | Para **consumir** a API |
| [`04-operations/`](04-operations/) | Variáveis de ambiente, execução local, deploy | Para **rodar** o projeto |
| [`05-security/`](05-security/) | Modelo de ameaça, prompt injection, testes de segurança | Para entender **como o sistema se defende** |
| [`06-ai-usage/`](06-ai-usage/) | Transparência sobre uso de IA no desenvolvimento | Item **avaliado** pelo teste ("Transparency") |
| [`07-benchmark/`](07-benchmark/) | Comparação medida entre os três providers | Relatório **gerado** por `npm run bench:llm` |

---

## Rota rápida por objetivo

**"Só quero rodar o projeto."**
→ [`04-operations/running-locally.md`](04-operations/running-locally.md)

**"Quero entender a arquitetura."**
→ [`01-architecture/overview.md`](01-architecture/overview.md)

**"Quero saber por que a falha do LLM devolve HTTP 200."**
→ [`01-architecture/decisions/adr-0003-fallback-strategy.md`](01-architecture/decisions/adr-0003-fallback-strategy.md)

**"Cadê o Firebase que o teste citou?"**
→ [`01-architecture/decisions/adr-0008-firebase-out-of-runtime.md`](01-architecture/decisions/adr-0008-firebase-out-of-runtime.md)

**"E se alguém digitar 'ignore previous instructions' no campo?"**
→ [`05-security/llm-security.md`](05-security/llm-security.md)

**"Quero conferir se todos os requisitos foram cumpridos."**
→ [`00-overview/test-requirements.md`](00-overview/test-requirements.md)

---

## Estrutura do repositório

```
fullstack-dev-test/
├── README.md              # Inglês — entregável avaliado
├── docs/                  # Português — esta pasta
├── backend/               # API Node.js + TypeScript (Clean Architecture)
└── flutter_app/           # App Flutter (Clean Dart)
```

---

## Convenções desta documentação

1. **Nada é inventado.** Quando um requisito do teste é ambíguo, a ambiguidade é
   registrada explicitamente e a interpretação escolhida é justificada — em vez de
   fingir que a dúvida não existia.
2. **Toda decisão relevante vira ADR.** Formato: contexto → opções → decisão →
   consequências (incluindo as ruins).
3. **Trade-off tem dois lados.** Um documento que só lista vantagens não é análise,
   é propaganda. Toda decisão aqui declara o que se perdeu ao escolhê-la.
4. **Fase = item do checklist.** As 16 fases em `02-phases/` correspondem 1:1 aos itens
   do checklist de execução, para não existir trabalho fora de rastreamento. As fases 05 e
   06 foram acrescentadas ao checklist original quando o LLM foi reconhecido também como
   superfície de ataque, e não só como dependência que pode cair.
