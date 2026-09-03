# ADR-0006 — Cache em memória e estratégia de custo

**Status:** Aceito · **Data:** 2026-09-03 · **Autoria:** Humano (D13)

## Contexto

Exigência do enunciado:

> *"**Cost and caching:** In your README, describe **how you would reduce cost in
> production** and **whether you implemented any caching in this test (and why or why
> not)**."*

Note que são **duas perguntas distintas**: uma sobre produção (hipotética) e outra sobre
esta entrega (factual). Este ADR responde as duas separadamente, porque misturá-las é a
forma mais fácil de parecer que se fez mais do que se fez.

O espaço de entrada favorece cache de um jeito raro: `occasion` × `relationship` é um
domínio **pequeno e altamente repetitivo**. Poucas dezenas de combinações cobrem a
esmagadora maioria do tráfego real — "birthday + friend" será pedido milhares de vezes.

---

## Parte 1 — Foi implementado cache nesta entrega?

**Sim.** LRU em memória, com TTL, atrás de um port de domínio.

### Configuração

| Aspecto | Escolha |
|---|---|
| Estrutura | LRU em memória, no processo |
| Chave | `sha1(provider · model · occasion · relationship · tone · language · count)`, tudo normalizado (minúsculas, `trim`) |
| TTL | 10 minutos (`CACHE_TTL_MS`) |
| Capacidade | 500 entradas (`CACHE_MAX_ENTRIES`) |
| Desligável | `CACHE_ENABLED=false` |
| Abstração | Port `SuggestionCache` em `domain/repositories/` |

### Por que o `model` entra na chave

Sem ele, trocar `LLM_PROVIDER` no `.env` faria o sistema servir resultado do provider
antigo por até 10 minutos — bug sutil, difícil de diagnosticar e exatamente do tipo que
aparece em demonstração. Com o modelo na chave, a troca invalida naturalmente.

### O que **não** é cacheado

- Respostas de **fallback**. Cachear degradação é congelar o pior momento do sistema:
  o LLM se recupera em 30 segundos e nós continuamos servindo template por 10 minutos.
- Requisições que resultaram em erro.

### O trade-off honesto

**Cache torna a resposta repetitiva.** Dois usuários pedindo "birthday + friend" na mesma
janela de 10 minutos recebem **exatamente** as mesmas três mensagens. Para um produto de
cartão-presente, isso é ruim: a proposta é personalização, e duas pessoas podem acabar
mandando o mesmo texto.

Aceitamos aqui porque a janela é curta e o benefício de demonstração é claro. **Em
produção a correção seria outra:** cachear um **pool** de 10–15 sugestões por chave e
sortear 3 a cada requisição. Mantém-se ~80% da economia e devolve-se a variedade. Não foi
feito neste teste por ser complexidade sem valor de avaliação — mas está registrado aqui
como o caminho que existe.

### Por que atrás de um port

```ts
// domain/repositories/suggestion-cache.ts
export interface SuggestionCache {
  get(key: string): Promise<Suggestion[] | null>;
  set(key: string, value: Suggestion[], ttlMs: number): Promise<void>;
}
```

A interface é **assíncrona de propósito**, mesmo com a implementação em memória sendo
síncrona. Se fosse síncrona, trocar por Redis depois exigiria mudar a assinatura e
propagar `async` por todos os chamadores. Assinatura assíncrona desde o início faz de
`RedisSuggestionCache` um arquivo novo, e nada mais.

---

## Parte 2 — Como reduzir custo em produção

Ordenado por relação impacto/esforço, do melhor para o pior.

### 1. Cache com pool e TTL longo — impacto **alto**, esforço **baixo**

Dado que o espaço de entrada é minúsculo e repetitivo, um pool de 10–15 sugestões por
chave com TTL de horas atende a maior parte do tráfego sem chamar o modelo. Um trabalho
em segundo plano reabastece pools populares fora do pico. **É de longe a maior economia
disponível** e deveria ser feito antes de qualquer outra coisa.

### 2. Pré-computar as combinações de cauda curta — impacto **alto**, esforço **baixo**

As ~50 combinações mais pedidas provavelmente cobrem >80% do tráfego. Gerá-las em lote
uma vez por dia, guardá-las, e servir do banco. O LLM passa a ser chamado apenas na cauda
longa — o que muda o custo de "por requisição" para "por dia".

### 3. Escolher o modelo pelo trabalho — impacto **alto**, esforço **baixo**

Escrever duas frases de cartão não exige raciocínio de fronteira. Modelos da classe
`gpt-4o-mini` / `gemini-flash` custam uma fração de um modelo de topo e são plenamente
adequados aqui. Usar modelo caro nesta tarefa é desperdício sem ganho perceptível — e é
por isso que o próprio enunciado sugere justamente essa classe.

### 4. Enxugar o prompt — impacto **médio**, esforço **baixo**

Token de entrada é cobrado. Prompts crescem por acúmulo, raramente encolhem. Instrução
compacta com saída estruturada custa menos que instrução prolixa com exemplos longos.
Limitar `max_tokens` de saída também impede resposta inflada.

### 5. Cache de prompt do provider — impacto **médio**, esforço **baixo**

Com system prompt fixo e alto volume, os mecanismos de *prompt caching* dos provedores
descontam significativamente os tokens de entrada repetidos. É configuração, não
arquitetura.

### 6. Requisições em lote — impacto **médio**, esforço **médio**

Para geração assíncrona (pré-computação do item 2), as APIs de *batch* costumam custar
cerca de metade, em troca de latência maior. Não serve para o caminho interativo; serve
perfeitamente para o trabalho em segundo plano.

### 7. Orçamento e alerta de custo — impacto **preventivo**, esforço **baixo**

Teto de gasto diário por ambiente e alerta em percentual do orçamento. Não reduz o custo
unitário — evita o incidente de fatura, que costuma ser o dano maior.

### 8. Rate limiting — impacto **preventivo**

Já implementado. Ver [`ADR-0005`](adr-0005-rate-limiting.md).

### O que estimativa de custo **não** é

Não colocamos aqui número de "R$ X por 1000 requisições". Preço de token muda, varia por
região e depende do tamanho real do prompt em produção. Publicar número inventado com cara
de medição seria pior que não publicar nada. O que dá para afirmar com segurança é a
**ordem** das alavancas — e ela está acima.

---

## Consequências

**Positivas**
- Redução imediata de custo e latência em requisições repetidas.
- Troca por Redis é adicionar um arquivo; o use case não muda.
- Cache pode ser desligado por variável de ambiente, o que torna os testes determinísticos.

**Negativas — assumidas**
- **Repetição de conteúdo** dentro da janela de TTL, como detalhado acima.
- Cache em memória **não é compartilhado** entre instâncias: com N réplicas, a taxa de
  acerto cai e o consumo de memória se multiplica.
- Cache quente se perde a cada *deploy*.
- Mais um caminho de código a testar — e um cache mal invalidado é fonte clássica de bug
  difícil de reproduzir. Mitigado pela chave incluir tudo que afeta o resultado.
