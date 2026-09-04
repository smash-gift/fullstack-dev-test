# ADR-0011 — Uma segunda tentativa para a mensagem que só está fora de forma

**Status:** Aceito · **Data:** 2026-09-03 · **Autoria:** Humano (D89)

## Contexto

O app foi instalado num aparelho físico e o fluxo foi executado à mão. Com o tom
**`funny`**, a tela mostrou o aviso âmbar de degradação. O backend registrou:

```
WARN: LLM failed, serving fallback suggestions
  code: "LLM_INVALID_RESPONSE"
  reason: "llm_invalid_response"
  violation: "sentence_count"
```

Nada estava quebrado. O modelo escreveu **três frases** onde o contrato permite duas, o
guarda de saída rejeitou, e o sistema serviu o catálogo — exatamente como projetado.

A medição contra a API real mostrou que não era acaso:

| Tom | Degradou |
|---|---|
| `funny` | **3 de 16** |
| `warm` | 0 de 10 |

Humor precisa de três tempos — preparação, virada, remate. O limite de duas frases briga
com o tom que o próprio app oferece.

## O problema não é a taxa, é onde a regra mora

`sentence_count` estava na mesma lista de `canary`, `url`, `html_tag`, `contact_details` —
violações de **segurança**. Era a única regra de **estilo** dentro do guarda de segurança, e
o efeito era o mesmo para as duas: jogar a resposta fora.

Só que as duas não são a mesma coisa:

| | Segurança | Estilo |
|---|---|---|
| Exemplo | canário vazado, URL, HTML | três frases em vez de duas |
| A mensagem é segura? | **não** | **sim** |
| É sobre o assunto e útil? | irrelevante | **sim** |
| Pedir de novo ajuda? | não — é gastar dinheiro a favor de quem ataca, e arriscar vazar duas vezes | **sim** — outra amostra costuma acertar |

Descartar uma mensagem boa e segura para servir um texto genérico do catálogo é **uma
resposta pior** do que a que foi descartada.

## Decisão

**Duas mudanças, ambas medidas.**

### 1. O guarda classifica; o caso de uso decide

`LlmOutputBlockedError` ganhou `recoverable`, ao lado de `severe`. O guarda marca — hoje só
`sentence_count` — e o caso de uso faz **uma** nova tentativa antes de degradar.

O padrão é `false`: uma violação nova, acrescentada sem pensar nisso, **nunca** é repetida
por acidente. É a direção segura de errar.

```ts
const STYLE_VIOLATIONS: ReadonlySet<OutputViolation> = new Set(['sentence_count']);
```

**A segunda tentativa roda sob o mesmo `AbortController`.** Um timeout novo deixaria um
modelo lento gastar o orçamento duas vezes, e quem está olhando a tela não tem como saber
por que ela ficou parada o dobro do tempo.

**Uma, e só uma.** Não é configurável, diferente de `LLM_MAX_RETRIES`: aquele existe porque
indisponibilidade de provider varia e um operador precisa ajustar a espera. Esta é regra de
produto — um modelo que erra a forma duas vezes para a mesma entrada não vai acertar na
terceira, e alguém está esperando.

### 2. A regra do prompt passou a falar a língua do verificador

O prompt já dizia `- Each suggestion is 1 to 2 short sentences. Never longer.` e era
desobedecido em ~44% das requisições `funny`. "Frase" é julgamento do modelo; a nossa
verificação é **contagem de terminadores** (`.`, `!`, `?`). A regra passou a dizer isso:

```
- Each suggestion has at most TWO sentence endings. A sentence ending is
  . or ! or ? - count them. Two is the limit, three is unusable.
```

## Resultado medido

42 requisições contra a API real, cache e rate limit desligados:

| | Antes | Depois |
|---|---|---|
| Modelo erra a forma, por tentativa | ~44% (`funny`) | **14%** (6 de 42) |
| Chega degradado ao usuário | 19% (`funny`) | **2,4%** (1 de 42) |
| `funny/en` | 3 de 16 | **1 de 20** |
| `warm` · `formal` · `funny/pt` | — | **0** |

**As duas mudanças eram necessárias.** Só o retry levaria 44% a 19% (0,44², tentativas
independentes — o número medido bateu com a previsão). Só o prompt levaria a 14%. Juntas,
a 2,4%.

## Custo

| | |
|---|---|
| Regra afiada no prompt | **+21 tokens de entrada** por requisição (426–428 → 446–449) |
| Custo por requisição | US$ 0,000102 → **US$ 0,000103** |
| Segunda tentativa | uma chamada extra em ~14% das requisições |

A regra mais longa **se paga**: 21 tokens em toda requisição, contra uma chamada inteira de
~449 tokens evitada em 30 pontos percentuais das requisições `funny`.

## Consequências

**Positivas**
- O usuário recebe a mensagem do modelo, não o catálogo, em 8 de cada 10 casos que antes
  degradavam.
- A distinção segurança × estilo ficou explícita no tipo, em vez de implícita numa lista.
- A taxa continua observável: a segunda tentativa escreve uma linha de log própria.

**Negativas — assumidas**
- Uma requisição em sete faz duas chamadas ao modelo, o que dobra a latência dela.
- Mais um caminho no caso de uso, coberto por 10 testes novos.
- A classificação é nossa opinião: se um dia `meta_response` virar "estilo", a discussão
  volta. Por isso o padrão é não repetir.

## Alternativas descartadas

**Cortar em duas frases em vez de rejeitar.** Cortar o remate estraga a piada, e entregar
uma piada sem remate é pior que entregar o catálogo.

**Elevar o limite para três frases.** O enunciado pede *"1–2 sentences each"*. Afrouxar o
produto para acomodar o modelo é resolver o problema errado.

**Deixar como estava e documentar os 19%.** Defensável — o sistema fazia o que prometia —,
mas conviver com o sintoma quando a causa é barata de corrigir não é engenharia.
