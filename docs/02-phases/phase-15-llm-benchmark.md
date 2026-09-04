# Fase 15 — Benchmark dos três providers

**Status:** ✅ concluída · **Checklist:** item 15

> Esta fase não estava no plano. Ela existe porque a [fase 08](phase-08-backend-tests.md)
> registrou uma limitação em vez de escondê-la:
>
> *"Os adapters de OpenRouter e Gemini nunca foram exercitados contra os serviços reais."*
>
> Com as três keys disponíveis, a limitação virou pergunta respondível: **qual dos três é
> o melhor para este projeto, e por quê?**

## Objetivo

Medir os três providers no mesmo prompt, nos mesmos cenários, pelo **adapter real do
projeto** — latência, tokens, custo, qualidade da saída, aderência a idioma e resistência
à injeção — e decidir o default com base na medição, não em preferência.

## Método

`backend/tests/live/llm-benchmark.live.test.ts`, executado por `npm run bench:llm`, com dois
portões como a suíte de red-team: `RUN_LIVE_BENCHMARK=true` e as três keys presentes. Fora
do `npm test` por construção — ele gasta dinheiro.

| Decisão de método | Por quê |
|---|---|
| Chamar o **adapter real**, não um cliente novo | Um cliente escrito para o benchmark mediria o benchmark. O que interessa é o código que vai para produção, com seu parsing, seu schema e seu mapeamento de erro |
| Envelopar o `fetch` global só para ler `usage` | O adapter não sabe que está sendo medido. Instrumentar o provider seria medir um provider modificado |
| Timeout de 25 s, não os 8 s de produção | Quem demora 11 s precisa **aparecer** como 11 s, não como um abort. O relatório conta separadamente quantas chamadas passariam do orçamento real |
| Pausa de 1,5 s entre chamadas | Sem ela, a cota por minuto de um provider vira "instabilidade" no relatório — mediríamos a nossa pressa |
| Preços lidos por máquina | Do endpoint `/models` do OpenRouter. Preço digitado de memória é o número que parece medição e não é |
| Sem retry | O adapter é chamado direto. Em produção um `5xx` ainda teria a segunda tentativa (`LLM_MAX_RETRIES=1`) — o relatório diz isso |

**Cenários:** aniversário/melhor amigo em inglês (3×), casamento/colega formal, aniversário
em **português** com tom `funny`, e uma **injeção de troca de papel** com a camada 1
contornada — a mesma que a fase 08 usou para medir quanto o system prompt segura sozinho.

## Dois erros de método meus, corrigidos antes de concluir

Registro porque um benchmark errado é pior que nenhum: ele produz um número que ninguém
questiona.

**1. O detector de pirata usava `includes`.** Ele reportou "2/6" de obediência à injeção
enquanto a saída verbatim era pirata do começo ao fim — `yer`, `ye`, `hearty` não estavam na
lista, e `ye` como substring casaria dentro de "year". Trocado por expressão regular com
limite de palavra, o número virou **6/6**. O relatório anterior subnotificava exatamente o
que a seção de segurança existe para medir.

**2. "Passaram dos 8 s" só contava chamadas bem-sucedidas.** Duas chamadas do Gemini
levaram 11 s e **falharam** — e apareciam como "0 estouraram o orçamento". O pior caso
estava escondido atrás de uma falha que já era contada em outro lugar. Agora a métrica olha
todas as chamadas.

## A cota que o benchmark gastou em si mesmo

A primeira versão rodava 11 chamadas por provider. Com duas variantes de Gemini, isso são 22
chamadas — e o free tier do Gemini permite **20 requisições por dia, por modelo**
(`GenerateRequestsPerDayPerProjectPerModel-FreeTier`). A segunda metade da própria medição
voltou `RESOURCE_EXHAUSTED`.

Duas consequências, e as duas ficaram:

- Os cenários foram reduzidos para **6 chamadas por variante**, de modo que uma execução
  completa cabe na cota diária de uma key gratuita — reproduzível por quem for avaliar.
- **A cota virou achado.** Um provider cujo plano gratuito não deixa rodar a suíte do próprio
  projeto duas vezes no mesmo dia é uma informação de decisão, não um detalhe operacional.

Como a cota é **por modelo**, cada modelo do Gemini medido hoje tinha o próprio teto — foi
assim que três deles couberam na mesma tarde.

## O que foi medido

Consolidado das execuções de 2026-09-03. O relatório gerado pela última execução está em
[`../07-benchmark/llm-comparison.md`](../07-benchmark/llm-comparison.md).

| | OpenAI | OpenRouter | Gemini 3.8 flash | Gemini 3.5 flash | Gemini 3.1 flash-lite |
|---|---|---|---|---|---|
| Modelo | `gpt-4o-mini` | `openai/gpt-4o-mini` | `gemini-3.8-flash` | `gemini-3.5-flash` | `gemini-3.1-flash-lite` |
| Latência mediana | **1064–1360 ms** | 1194–2381 ms | ~6200 ms | 3327 ms *(1200 tok)* | 1101 ms |
| Falhas | **0 em 23** | **0 em 23** | 9 em 11 | 6 em 6 *(400 tok)* · 2 em 6 *(1200 tok)* | **0 em 12** |
| Tokens de entrada | 430–434 | 393–397 | 409 | 403 | 406 |
| Tokens de saída | 58–62 | 57–60 | 200 | **648** | 65 |
| Dos quais "pensamento" | 0 | 0 | 116 | **569** | 0 |
| Custo por requisição | **US$ 0,000102** | **US$ 0,000094** | US$ 0,001057 | US$ 0,002732 | US$ 0,000548 |
| Variedade (distintas/total) | 8–9 / 9 | 9 / 9 | — | — | 5–6 / 9 |
| Comprimento médio | 82–87 car. | 77–83 car. | — | 127 car. | 88 car. |
| Obedeceu à injeção | 6/6 · 3/3 | 6/6 · 3/3 | — | — | 3/3 |

## Os cinco achados

### 1. O teto de saída de 400 tokens quebra modelo que raciocina

O achado mais consequente, e o culpado é **nosso**.

`LLM_MAX_OUTPUT_TOKENS=400` foi calibrado para modelos que respondem sem raciocinar. Os
`flash` recentes do Gemini gastam parte do **mesmo orçamento** pensando: no
`gemini-3.5-flash`, 569 dos 648 tokens de saída foram pensamento. Com 400, a resposta é
cortada antes de terminar:

```
LlmInvalidResponseError: Gemini returned no usable content (finishReason: MAX_TOKENS)
LlmInvalidResponseError: LLM response was not valid JSON
```

**5 de 6 chamadas falharam com o teto padrão. Com 1200, 4 de 6 passaram** — e as duas
restantes foram cota, não truncamento. Ou seja: quem trocar `LLM_PROVIDER` para `gemini` com
a nossa configuração padrão recebe **fallback em quase toda requisição**, e o `meta.reason`
vai dizer `llm_invalid_response` — que é a verdade, e ainda assim aponta para o lugar errado.

Concluir "o Gemini falha" sem testar o orçamento maior teria culpado o provider pela nossa
configuração. Por isso o benchmark tem duas colunas de Gemini, e não uma.

### 2. Custo — todas as comparações que levam à decisão

Um número solto ("27× mais caro") impressiona e não decide nada. O que decide é ver o custo
nas formas em que ele aparece: por requisição, por mês, quando falha, e quando deixa de
importar.

#### 2.1 Economia unitária — o que foi medido

| Variante | Entrada | Saída | Da saída, raciocínio | Preço 1M in/out | **US$/requisição** | × o default |
|---|---|---|---|---|---|---|
| **OpenAI `gpt-4o-mini`** | 433 | 62 | 0 | 0,15 / 0,60 | **0,000102** | 1,0× |
| OpenRouter `openai/gpt-4o-mini` | 396 | 57 | 0 | 0,15 / 0,60 | 0,000094 | 0,9× |
| Gemini `3.1-flash-lite` | 406 | 65 | 0 | 0,75 / 3,75 | 0,000548 | **5,4×** |
| Gemini `3.8-flash` | 409 | 200 | 116 | 0,75 / 3,75 | 0,001057 | **10,3×** |
| Gemini `3.5-flash` (teto 1200) | 403 | 648 | **569** | 0,75 / 3,75 | 0,002732 | **26,7×** |

Duas causas empilhadas, e é importante separá-las porque só uma é evitável:

1. **Preço de tabela.** A família Gemini `flash` cobra 5× a entrada e **6,25×** a saída do
   `gpt-4o-mini`. Isso é escolha do fornecedor: aparece mesmo no `flash-lite`, que não
   raciocina, e explica sozinho o 5,4×.
2. **Tokens de raciocínio.** O que vai de 5,4× a 26,7× é o modelo *pensando* — 569 dos 648
   tokens de saída no `3.5-flash` — sobre um pedido que é "escreva duas frases carinhosas".
   Token de pensamento é cobrado como saída, na faixa mais cara.

#### 2.2 O mesmo custo, na escala em que alguém aprova orçamento

| Requisições/mês | OpenAI | OpenRouter | Gemini lite | Gemini 3.8 | Gemini 3.5 (1200) |
|---|---|---|---|---|---|
| 10 mil | US$ 1,02 | US$ 0,94 | US$ 5,48 | US$ 10,57 | US$ 27,32 |
| 100 mil | US$ 10,21 | US$ 9,36 | US$ 54,82 | US$ 105,67 | US$ 273,23 |
| 1 milhão | US$ 102,15 | US$ 93,60 | US$ 548,25 | US$ 1.056,75 | **US$ 2.732,25** |

**Onde isso vira decisão de verdade:** em 10 mil requisições por mês, a diferença entre o
melhor e o pior é **US$ 26** — ninguém troca de fornecedor por isso, e a escolha deve ser
por latência e confiabilidade. Em 1 milhão, a mesma escolha vale **US$ 2.630 por mês**, e aí
o custo passa a mandar. É a mesma decisão com respostas diferentes conforme a escala, e por
isso as duas linhas estão aqui.

O cache não muda a ordem: ele multiplica todas as colunas pela taxa de **falha** de cache.
Com 80% de acerto, divida tudo por cinco — a razão entre providers continua idêntica.

#### 2.3 O custo de falhar, que é o que quase ninguém compara

Uma chamada que estoura o teto de saída **é cobrada mesmo sem devolver nada usável**. O
`gemini-3.5-flash` com o nosso teto de 400 gastou 385 tokens de saída para entregar JSON
truncado:

| | US$ | Comparação |
|---|---|---|
| Requisição boa no OpenAI | 0,000102 | referência |
| **Requisição do Gemini que falhou por truncamento** | **0,001746** | **17,1×** uma resposta boa do OpenAI |
| A mesma, com o retry de produção (`LLM_MAX_RETRIES=1`) | 0,003492 | **34,2×** |

Ou seja: no pior caso o usuário recebe o **fallback curado**, e nós pagamos trinta e quatro
vezes o preço de uma resposta boa para servir um template. Essa é a linha que transforma
"configuração errada" em dinheiro, e é o motivo de o aviso ter ido para o `.env.example` em
vez de ficar só aqui.

#### 2.4 O que a segurança custa em cada provider

O prompt endurecido — spotlighting, canário, schema — custava **349 tokens de entrada**
quando este benchmark rodou (medido na fase 14, trocando-o por um de uma linha: 428 → 79).
Hoje são **367**: o [`ADR-0011`](../01-architecture/decisions/adr-0011-style-retry.md)
acrescentou 21 tokens à regra de duas frases, e a medição acima é o registro daquela
execução, não do prompt atual.

| Provider | Custo do endurecimento | % do custo de entrada |
|---|---|---|
| OpenAI / OpenRouter | US$ 0,000052 | 81–88% |
| Qualquer Gemini | US$ 0,000262 | 85–87% |

A defesa custa **metade da requisição** no OpenAI e continua sendo o controle mais barato do
repositório. No Gemini ela custa 5× mais em valor absoluto, pelo mesmo motivo de sempre:
preço de entrada.

#### 2.5 Quando esta conclusão se inverte

Uma comparação honesta diz em que condições ela deixa de valer:

| Se… | Então |
|---|---|
| A tarefa passar a exigir raciocínio de verdade — política editorial, restrições, revisão | Os tokens de pensamento passam a **comprar** algo, e a conta muda de figura |
| A saída ficar longa (cartas, não frases) | O preço de saída domina, e a distância entre 0,60 e 3,75 **aumenta** |
| For preciso contexto de 1M de tokens | Gemini tem 1.048.576 contra 128.000 do `gpt-4o-mini` — aqui isso é irrelevante, com prompt de 430 tokens |
| Houver crédito Google já contratado | O custo marginal muda de fornecedor, e a comparação precisa ser refeita em cima da fatura real, não da tabela |
| For preciso trocar de modelo com frequência | OpenRouter passa a valer o salto de rede que ele cobra |
| O texto do usuário não puder passar por terceiro | O gateway sai da mesa por caminho de dado, não por preço |

### 3. O gateway custa latência, não dinheiro

OpenRouter roda **o mesmo modelo** por preço equivalente (US$ 0,000094 contra US$ 0,000102 —
a diferença é contagem de tokens de entrada, 393 contra 430, não preço). O que ele cobra é
salto de rede: medianas de 1194 ms a 2381 ms contra 1064 ms a 1360 ms, com máximos piores
(3793 ms contra 3866 ms no pior caso do OpenAI, mas com mais dispersão entre execuções).

Isso confirma por medição o que o [`ADR-0002`](../01-architecture/decisions/adr-0002-llm-provider-port-and-adapters.md)
já tinha decidido por leitura do enunciado: **gateway é bom para trocar de modelo, não para
ser o caminho padrão.**

### 4. A injeção passa em todos, e o guard segura em todos

Com a camada 1 contornada, **os três obedeceram à troca de papel**:

> *"Ahoy matey, may yer birthday be filled with treasures and good fortune!"*

Nenhum produziu URL, marcação, e-mail ou canário — e **nenhuma** das saídas de pirata foi
bloqueada pela camada 3, porque texto de pirata é formalmente limpo. É exatamente o risco
residual declarado no [`ADR-0009`](../01-architecture/decisions/adr-0009-llm-security.md), e
agora ele está medido em três modelos de duas famílias, não em um.

**Nenhum provider é mais seguro que outro contra injeção.** A defesa é nossa, não deles.

### 5. Variedade é diferente entre famílias

Três execuções idênticas do mesmo pedido, com `temperature: 0.8`: OpenAI e OpenRouter
devolveram 8–9 sugestões distintas em 9; o `flash-lite`, 5–6 em 9. Para um produto cuja
proposta é personalização, repetir a mesma frase para o mesmo pedido é um defeito de produto,
não de engenharia — e é o mesmo motivo pelo qual o cache tem TTL curto
([`ADR-0006`](../01-architecture/decisions/adr-0006-caching-and-cost.md)).

## Veredito — qual é o melhor para este projeto

**OpenAI `gpt-4o-mini`, direto. O default continua onde estava, agora por medição.**

A tabela abaixo é a decisão inteira, e não só a parte que couber num slide. Cada linha diz
**o que foi medido**, quem ganha, e — a coluna que costuma faltar — **quanto isso pesa** para
este produto especificamente.

| Critério | OpenAI | OpenRouter | Gemini (melhor caso) | Peso aqui |
|---|---|---|---|---|
| **Latência mediana** | **1064–1360 ms** | 1194–2381 ms | 1101 ms lite · 3327 ms `3.5` | **Alto** — é um usuário parado numa tela esperando três frases |
| **Dispersão / pior caso** | 3866 ms | 3793 ms | **11.720 ms** | **Alto** — o orçamento de produção são 8 s; passar dele vira fallback |
| **Custo por requisição** | US$ 0,000102 | US$ 0,000094 | 0,000548 a 0,002732 | **Escala-dependente** — irrelevante a 10 mil/mês, US$ 2,6 mil/mês a 1 milhão |
| **Custo de uma falha** | — (0 falhas) | — (0 falhas) | até **34×** uma resposta boa | **Alto** — paga-se caro para servir template |
| **Confiabilidade medida** | **0 falhas / 23** | **0 falhas / 23** | 0/12 lite · 9/11 no `3.8` | **Alto** — o fallback existe justamente porque isso acontece |
| **Variedade em 9 respostas** | 8–9 distintas | **9 distintas** | 5–6 distintas | **Alto** — o produto se vende como personalização |
| **Comprimento da saída** | 82–87 car. | 77–83 car. | 88–127 car. | Médio — tudo cabe num cartão; o Gemini escreve mais longo |
| **Aderência a `pt` e ao tom** | ok | ok | ok | Baixo — nenhum se destacou, e a métrica é heurística |
| **Resistência à injeção** | obedeceu | obedeceu | obedeceu | **Nulo como critério** — nenhum resiste; a garantia é a camada 3 |
| **Previsibilidade de configuração** | **direta** | **direta** | exige recalibrar o teto de saída | **Alto** — é a diferença entre funcionar e degradar sempre |
| **Cota do plano gratuito** | crédito pré-pago | crédito pré-pago | **20 req/dia por modelo** | **Alto para avaliação** — não dá para rodar a suíte duas vezes no dia |
| **Janela de contexto** | 128 mil | 128 mil | **1,05 milhão** | **Nulo aqui** — o prompt tem 430 tokens |
| **Caminho do dado** | direto | **um terceiro a mais** | direto | Médio — texto livre de usuário atravessando mais um fornecedor |
| **Troca de modelo** | uma família | **centenas, uma key** | uma família | Médio — vale como plano B, não como caminho quente |
| **Letra do enunciado** | ✅ nomeado | ❌ é gateway | ✅ nomeado | **Decisivo** — *"Call one LLM provider (OpenAI or Google AI)"* |

**Como ler:** OpenAI e OpenRouter empatam em quase tudo que foi medido, porque **são o mesmo
modelo** — o desempate está no salto de rede, no caminho do dado e na letra do enunciado, e
os três apontam para o mesmo lado. O Gemini perde por custo e por previsibilidade de
configuração, não por qualidade de texto: as frases dele são boas, às vezes mais calorosas, e
mais longas.

**OpenRouter fica como está:** adapter mantido, não default. Ele vale exatamente pelo que
foi medido — mesmo modelo, mesmo preço, um salto a mais — e pelo que não dá para medir aqui:
trocar de modelo sem trocar de credencial.

**Gemini fica como alternativa real, com uma ressalva documentada:** exige
`LLM_MAX_OUTPUT_TOKENS` maior nos modelos que raciocinam, e custa mais por requisição. Não é
pior — é caro para *esta* tarefa, que não precisa de raciocínio.

## O que esta fase fechou

- **`D67`** — a limitação declarada na fase 08. Os três adapters agora foram exercitados
  contra os serviços reais, e os dois que faltavam **funcionaram**: o parsing, os cabeçalhos,
  o schema e o mapeamento de erro estavam corretos. O `GeminiProvider` inclusive mapeou
  `finishReason: MAX_TOKENS` para `LlmInvalidResponseError` sozinho, que é o comportamento
  desenhado na fase 04.
- **`B4`** do enunciado deixa de depender de um provider só.
- O `.env.example` ganhou o aviso sobre o orçamento de saída, que é o tipo de coisa que só
  aparece quando alguém troca de provider às 23h.

## Limitações desta medição

Ditas antes que alguém as descubra:

- **Uma máquina, uma rede, uma tarde.** As medianas ordenam grandezas — "2× mais lento" —,
  não publicam SLA.
- **N pequeno**: 6 chamadas por variante, limitado pela cota gratuita do Gemini. Suficiente
  para separar 1 s de 6 s; insuficiente para discutir 1064 ms contra 1137 ms.
- **O preço do Gemini é o do gateway**, não a fatura do Google — a API do Gemini não expõe
  preço por máquina. A ordem de grandeza está certa; a terceira casa decimal, não
  necessariamente.
- **O detector de português é heurístico** (marcadores lexicais). Ele erra para os dois
  lados, e por isso a linha aparece como fração e não como veredito.
- **A execução publicada usa `gemini-3.1-flash-lite`**, não o `gemini-3.8-flash` do
  `.env.example`: a cota do 3.8 tinha sido gasta pelas execuções anteriores do mesmo dia. Os
  números dele estão na tabela acima, medidos antes disso.

## Critério de pronto

- [x] Os três providers exercitados contra os serviços reais
- [x] Latência, tokens e custo medidos pelo adapter de produção
- [x] Preço lido por máquina, não de memória
- [x] Qualidade comparada nos mesmos cenários, com saída verbatim no relatório
- [x] Idioma e injeção testados
- [x] Relatório **gerado pela execução**, reproduzível por `npm run bench:llm`
- [x] Default decidido por medição e registrado no `ADR-0002`
- [x] `D67` fechada
