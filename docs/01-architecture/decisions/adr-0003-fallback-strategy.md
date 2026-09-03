# ADR-0003 — Estratégia de fallback: HTTP 200 com `degraded: true`

**Status:** Aceito · **Data:** 2026-09-03 · **Autoria:** Assistente (D09, D10, D11)

> Este é o ADR central do teste. O enunciado dedica uma seção inteira ao tema e exige
> explicitamente que ele seja documentado:
>
> *"When the LLM API fails, the backend **must not expose raw errors** to the client.
> **Document in your README what you consider a failure, how you respond to the client,
> and why.**"*

---

## Parte 1 — O que consideramos "falha"

Sem essa definição, "tratar falha" é frase vazia. Definimos falha como
**qualquer condição em que o backend não consegue obter, do LLM, sugestões válidas dentro
do orçamento de tempo.** São cinco classes:

| # | Classe | Como se manifesta | Erro de domínio |
|---|---|---|---|
| 1 | **Timeout** | Provider não responde em `LLM_TIMEOUT_MS` (default 8000) | `LlmTimeoutError` |
| 2 | **Rate limit** | HTTP `429` do provider (cota estourada) | `LlmRateLimitError` |
| 3 | **Indisponibilidade** | HTTP `5xx`, DNS, TCP recusado, TLS | `LlmUnavailableError` |
| 4 | **Resposta inválida** | HTTP `200`, mas o corpo não passa no schema Zod | `LlmInvalidResponseError` |
| 5 | **Configuração** | Key ausente/inválida, `401`/`403` | `LlmAuthError` |

### A classe 4 é a que costuma ser esquecida

Um `200 OK` cujo corpo é prosa em vez de JSON, ou JSON com uma sugestão em vez de três, ou
sugestões de sete frases quando pedimos duas — **é falha**. O LLM respondeu; simplesmente
não respondeu o que serve.

Esta é a diferença entre tratar erro de *transporte* e tratar erro de *contrato*. Sistemas
que só tratam o primeiro passam dado inválido adiante e quebram três camadas depois, longe
da causa. Por isso a validação com Zod acontece **dentro do adapter**: se não passa, vira
falha ali mesmo, com o motivo preservado.

### O que **não** é falha do LLM

- **Input inválido do cliente** (`occasion` vazio, `count: 9`) → é erro do chamador,
  responde `400` e **nunca** aciona fallback. Servir fallback a quem mandou requisição
  malformada esconderia o bug do cliente.
- **Nosso rate limit** → `429`, também sem fallback. O cliente precisa desacelerar, não
  ser recompensado com resposta.

---

## Parte 2 — Como respondemos ao cliente

### Opções consideradas

#### Opção A — `503 Service Unavailable` com corpo de erro
- ✅ Semanticamente correto em HTTP: o recurso a montante está fora.
- ✅ Monitoramento detecta na hora.
- ❌ **O usuário fica sem nada.** O objetivo do produto era ter uma mensagem para o cartão.
- ❌ Contraria o enunciado: *"return a safe **fallback** instead of an error stack"* — o
  enunciado pede fallback, não erro bem formatado.

#### Opção B — `200` com fallback, indistinguível do sucesso real
- ✅ Cliente simples: sempre `200`, sempre sugestões.
- ❌ **Desonesto.** O cliente não tem como saber que a qualidade caiu.
- ❌ Impossível medir taxa de degradação sem parsear logs.
- ❌ Mascara incidente: o LLM pode estar fora há horas e nenhum dashboard acusa.

#### Opção C — `200` com fallback + `degraded: true` explícito *(escolhida)*
```jsonc
{
  "data": {
    "suggestions": [ /* ... */ ],
    "source": "fallback",
    "model": null,
    "degraded": true
  },
  "meta": { "requestId": "req_...", "reason": "llm_timeout" }
}
```
- ✅ Usuário recebe algo utilizável — o objetivo do produto é cumprido.
- ✅ Cliente **sabe** que é degradado e pode agir (banner, botão de tentar de novo).
- ✅ `meta.reason` dá diagnóstico sem vazar nada interno.
- ✅ Métrica de saúde é direta: taxa de `degraded: true` sobre o total.
- ❌ Cliente ingênuo pode ignorar o campo e nunca perceber a degradação.
- ❌ Pureza de HTTP: há quem argumente que degradação merece `203` ou header próprio.

### Decisão

**Opção C.**

O raciocínio decisivo: **a requisição foi processada com sucesso.** O cliente pediu
sugestões de mensagem; o backend entregou sugestões de mensagem. Que a origem tenha sido
um catálogo curado em vez de um modelo generativo é informação sobre *qualidade*, não
sobre *falha da operação*.

`5xx` significa "não consegui atender você". Nós conseguimos — só que com qualidade
reduzida, e dizemos isso em voz alta no corpo da resposta.

Sobre `203 Non-Authoritative Information`: tecnicamente defensável, praticamente ruim.
Cliente HTTP, proxy e biblioteca tratam `203` de formas inconsistentes, e o ganho
semântico não compensa o risco de comportamento estranho no meio do caminho. `200` com
campo explícito é mais previsível — e previsibilidade vale mais que elegância aqui.

---

## Parte 3 — De onde vem o conteúdo do fallback

### Opções consideradas

| Opção | Avaliação |
|---|---|
| **Última resposta boa em cache** | Bom quando existe; inútil em *cold start* ou par inédito. Não pode ser a única estratégia. |
| **Mensagem de erro no lugar das sugestões** | É a Opção A disfarçada. O usuário continua sem mensagem. |
| **Catálogo de templates curados** ✅ | Sempre disponível, custo zero, latência ~1ms, qualidade previsível porque foi escrito por humano. |

### Decisão: catálogo curado, com degradação em três níveis

```
1. Match exato    → templates para (occasion × relationship)
                    ex.: birthday × friend
2. Match parcial  → templates só por occasion
                    ex.: birthday × <relacionamento não catalogado>
3. Genérico       → mensagens neutras que servem a qualquer par
```

O catálogo cobre as combinações citadas no enunciado (`birthday`, `wedding`, `thank you`
× `friend`, `colleague`, `parent`) e degrada com elegância fora delas. Fica atrás do port
`FallbackCatalog`, então trocá-lo por uma fonte remota depois não toca no use case.

**O que se perde, honestamente:** as mensagens de fallback **não são personalizadas** —
é literalmente o oposto da proposta do produto. São genéricas, e um usuário atento vai
notar. Aceitamos isso porque a alternativa é tela vazia, e uma mensagem genérica é mais
útil que nenhuma mensagem. O banner de *degraded* existe justamente para não fingir o
contrário.

---

## Parte 4 — Política de retry

| Situação | Retry? | Por quê |
|---|---|---|
| Timeout | **1x** | Pode ser lentidão transitória. Mais de um retry estoura o orçamento de latência do usuário. |
| `5xx` | **1x**, com jitter | Instabilidade costuma ser breve. Jitter evita *thundering herd* de todos os clientes retentando junto. |
| `429` | **Nunca** | Retentar contra rate limit é agressão ao provider e piora a situação. Respeitamos `Retry-After` e caímos direto no fallback. |
| Resposta inválida | **Nunca** | O modelo já respondeu. Repetir o mesmo prompt tende a produzir o mesmo formato ruim, pagando dobrado por isso. |
| `401` / `403` | **Nunca** | Erro de configuração. Retry não conserta key errada; só atrasa o diagnóstico. |

**Orçamento de latência do pior caso:** `8s` (tentativa) + `~0.3s` (jitter) + `8s` (retry)
+ `~1ms` (fallback) ≈ **16,3s**. É muito para uma tela de espera. Por isso o app mostra
progresso desde o primeiro milissegundo, e por isso `LLM_TIMEOUT_MS` é configurável — em
produção, com dados reais de latência p99, esse número seria ajustado para baixo.

---

## Consequências

**Positivas**
- Nunca existe tela vazia por falha de terceiro.
- Cliente e operação enxergam a degradação em vez de adivinhá-la.
- Taxa de `degraded` vira métrica de saúde de primeira classe, sem instrumentação extra.

**Negativas — assumidas**
- Sugestões de fallback são genéricas; a promessa de personalização não se cumpre nesses casos.
- Um cliente que ignore `degraded` exibirá conteúdo degradado como se fosse gerado por IA.
- O catálogo é conteúdo curado: precisa de manutenção humana e não escala para dezenas de
  idiomas sem esforço proporcional.

**Não implementado nesta entrega, e por quê**
- **Circuit breaker.** Após N falhas seguidas, pular a chamada e ir direto ao fallback por
  alguns minutos, economizando latência e custo durante um incidente. Não implementado
  porque exige estado compartilhado entre instâncias para funcionar de verdade, e o teste
  roda em processo único — seria complexidade sem benefício demonstrável aqui. Em produção,
  entraria antes de qualquer outra otimização.
