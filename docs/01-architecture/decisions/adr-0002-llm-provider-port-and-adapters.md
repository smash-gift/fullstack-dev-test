# ADR-0002 — Port `LlmProvider` com três adapters

**Status:** Aceito · **Data:** 2026-09-03 · **Autoria:** Conjunto (D05, D06, D07, D08)

## Contexto

O enunciado é literal quanto ao provider:

> *"**LLM integration:** Call one LLM provider (**OpenAI or Google AI**)."*
> *"**LLM API access:** OpenAI API key **or** Google AI (Vertex AI / Gemini) API key — you
> choose one. Use a single model (e.g. GPT-4o-mini, or Gemini Flash) to keep cost and
> latency reasonable."*

A intenção inicial do desenvolvedor era usar **OpenRouter**, um gateway que expõe dezenas
de modelos atrás de uma API única — o que facilitaria trocar de modelo sem trocar de
código.

**O conflito.** OpenRouter não é OpenAI nem Google AI; é um intermediário. Cumprir a
preferência do desenvolvedor ao pé da letra significaria entregar algo que um avaliador
criterioso pode marcar como requisito não atendido — e o critério declarado de avaliação
começa por *"Correctness"*.

Há ainda a regra R1 do projeto: nenhum pacote externo substituível pode ser importado
diretamente pelo código de negócio.

## Opções consideradas

### Opção A — Só OpenRouter
- ✅ Uma única implementação; troca de modelo por variável de ambiente.
- ✅ Uma única API key para todos os modelos.
- ❌ **Não cumpre a letra do requisito.** Risco direto no critério "Correctness".
- ❌ Adiciona um intermediário entre o sistema e o provider — mais um ponto de falha.

### Opção B — Só OpenAI (ou só Gemini)
- ✅ Cumpre o requisito sem qualquer ruído.
- ✅ Menos código, menos superfície de teste.
- ❌ Desperdiça a abstração: com um adapter só, a interface parece cerimônia vazia.
- ❌ Não atende à preferência do desenvolvedor por trocar de modelo com facilidade.

### Opção C — Port + três adapters, OpenAI como default *(escolhida)*
Interface `LlmProvider` no `domain/`; adapters `OpenAiProvider`, `OpenRouterProvider` e
`GeminiProvider` no `infra/`; escolha por `LLM_PROVIDER`, default `openai`.

- ✅ **Cumpre a letra do requisito**: o caminho default é OpenAI, um dos dois permitidos.
- ✅ Atende à preferência do desenvolvedor: OpenRouter disponível trocando uma variável.
- ✅ Prova que a abstração é real. Com um adapter só, a interface é promessa; com três
  honrando o mesmo contrato, é fato verificável.
- ✅ Torna a substituibilidade **demonstrável** em vez de alegada.
- ❌ Três adapters para manter, três formatos de erro para mapear.
- ❌ Só um deles é exercitado de verdade durante a avaliação.

## Decisão

**Opção C**, com `LLM_PROVIDER=openai` como default.

O enunciado diz *"Call **one** LLM provider"*. Interpretamos como restrição de **runtime**,
não de base de código: cada requisição chama **exatamente um** provider — sem fan-out,
sem cascata, sem failover automático entre providers. É essa restrição que preserva a
razão declarada no próprio enunciado, *"to keep cost and latency reasonable"*.

Ter três implementações disponíveis não viola isso, do mesmo modo que ter três drivers de
banco de dados no classpath não significa consultar três bancos por requisição.

### Por que não há failover entre providers

Tentador — "se OpenAI falhar, tenta Gemini" — e recusado por três motivos:

1. **Contraria o requisito** de chamar um provider por requisição.
2. **Multiplica a latência do pior caso.** Timeout de 8s no primeiro + 8s no segundo = 16s
   de espera antes de o usuário ver qualquer coisa. O fallback local responde em ~1ms.
3. **Multiplica o custo exatamente na hora errada.** Um incidente do provider vira
   cobrança dobrada em cima de um sistema já degradado.

Quando o provider falha, o caminho é o **fallback local** ([`ADR-0003`](adr-0003-fallback-strategy.md)):
determinístico, gratuito e instantâneo.

## Consequências

**Positivas**
- Trocar de provider é `LLM_PROVIDER=openrouter` no `.env`. Zero linha de código.
- O use case é testável sem qualquer SDK instalado.
- Os três adapters compartilham o **mesmo prompt** (`infra/llm/prompt/`), o que torna a
  comparação entre modelos honesta e mantém a diferença restrita ao transporte.

**Negativas — assumidas**
- Adapters de OpenRouter e Gemini receberão menos exercício real que o de OpenAI. Mitigado
  por testes de contrato que rodam a mesma bateria contra os três.
- Cada API tem seu próprio formato de erro; o mapeamento para erros de domínio é trabalho
  manual e precisa ser mantido.
- Uma key por provider no `.env.example`, o que exige explicar que **apenas a do provider
  ativo é obrigatória**.

**Riscos**
- Se um dos providers mudar seu contrato, o adapter quebra silenciosamente até alguém
  ativá-lo. Mitigação: cada adapter valida a resposta com Zod, então a quebra vira
  `LlmInvalidResponseError` explícito, e não dado corrompido passando adiante.

## Confirmação por medição — 2026-09-03 (fase 15)

Esta decisão foi tomada por leitura do enunciado e por raciocínio de arquitetura. Com as três
keys disponíveis, ela passou a ser **verificável**, e a
[fase 15](../../02-phases/phase-15-llm-benchmark.md) mediu os três pelo adapter real.
Relatório gerado: [`07-benchmark/llm-comparison.md`](../../07-benchmark/llm-comparison.md).

| | OpenAI | OpenRouter | Gemini (melhor caso medido) |
|---|---|---|---|
| Latência mediana | **1064–1360 ms** | 1194–2381 ms | 1101 ms (`flash-lite`) · 3327 ms (`3.5-flash`) |
| Custo por requisição | **US$ 0,000102** | US$ 0,000094 | US$ 0,000548 a US$ 0,002732 |
| Falhas | 0 em 23 | 0 em 23 | 0 em 12 (`flash-lite`) · 9 em 11 (`3.8-flash`) |
| Variedade em 9 respostas | 8–9 distintas | 9 distintas | 5–6 distintas |

**O default não muda: `openai`.** O que muda é o motivo — antes era a letra do enunciado,
agora é a letra do enunciado **mais** a medição.

Três coisas que a medição acrescentou e o raciocínio não tinha:

1. **OpenRouter cobra latência, não dinheiro.** Mesmo modelo, preço equivalente, um salto de
   rede a mais e mais dispersão entre execuções. Isso reforça a decisão original — gateway
   serve para trocar de modelo, não para ser o caminho quente.
2. **O custo do Gemini é de 5,4× a 27×** para esta tarefa, porque os `flash` recentes gastam
   tokens raciocinando sobre um pedido que não pede raciocínio, e token de pensamento é
   cobrado como saída a 6,25× o preço do `gpt-4o-mini`.
3. **`LLM_MAX_OUTPUT_TOKENS=400` é hostil a modelo que raciocina.** Com o teto padrão,
   `gemini-3.5-flash` falhou 5 de 6 vezes com `finishReason: MAX_TOKENS`; com 1200, passou.
   Está avisado no `.env.example` — e é o tipo de armadilha que só aparece quando alguém
   troca de provider às onze da noite.

**A limitação declarada na fase 08 (`D67`) está fechada.** Os adapters de OpenRouter e Gemini
eram corretos *por contrato*; agora são corretos *por execução*. O `GeminiProvider`, em
particular, mapeou `finishReason: MAX_TOKENS` para `LlmInvalidResponseError` sem ajuda
nenhuma — o comportamento desenhado na fase 04, encontrado na natureza.

## Nota de segurança

Nenhuma API key existe no lado do Flutter, em nenhuma hipótese. O app conhece apenas a
URL do backend. Toda credencial de LLM vive no servidor, lida uma única vez em
`pkg/config/env.ts`, e **nunca** é escrita em log.

Essa é, aliás, a razão de o teste pedir um backend em vez de o app chamar o LLM direto:
uma key embarcada em app publicado é extraível por qualquer pessoa que descompile o
binário.
