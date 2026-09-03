# ADR-0005 — Rate limiting por IP

**Status:** Aceito · **Data:** 2026-09-03 · **Autoria:** Humano (D12)

## Contexto

O enunciado marca rate limiting como **opcional**, mas condiciona:

> *"**Rate limiting (optional):** If you implement it, **document the limit and the
> behavior when it is exceeded**."*

O endpoint tem uma característica que torna a decisão relevante: **toda requisição que não
acerta o cache custa dinheiro real** em token de LLM. Um endpoint público sem limite é um
endpoint onde qualquer pessoa com um `while true; do curl; done` gasta o orçamento do dono.

Isso não é hipótese distante — é o modo mais comum de uma API de LLM exposta virar uma
fatura inesperada.

## Opções consideradas

### Opção A — Não implementar
- ✅ É opcional; nada é perdido em conformidade.
- ❌ Deixa de lado exatamente a preocupação que o enunciado sinaliza ao falar de custo.
- ❌ Um endpoint que gasta dinheiro por chamada e não tem limite é um defeito de projeto,
  não uma simplificação.

### Opção B — Limite por IP em memória *(escolhida)*
`express-rate-limit`, janela fixa, contador em memória do processo.

- ✅ Simples, sem infraestrutura adicional.
- ✅ Suficiente para demonstrar a decisão e testá-la.
- ❌ Não funciona corretamente com múltiplas instâncias — cada uma conta o seu.
- ❌ IP é identidade fraca: NAT corporativo agrupa muita gente sob um IP; um atacante
  distribui entre muitos.

### Opção C — Redis + limite por usuário autenticado
- ✅ Funciona horizontalmente; identidade forte.
- ❌ Não existe autenticação neste escopo — e adicioná-la seria inventar requisito.
- ❌ Exige Redis, que quebraria o "clone e roda" avaliado em *"Clear run instructions"*.

## Decisão

**Opção B**, com os parâmetros configuráveis por ambiente:

| Parâmetro | Valor | Variável |
|---|---|---|
| Janela | 5 minutos | `RATE_LIMIT_WINDOW_MS=300000` |
| Máximo por IP na janela | 30 requisições | `RATE_LIMIT_MAX=30` |
| Escopo | Rotas `/api/v1/*` | — |
| Fora do escopo | `/health`, `/docs` | — |

### Comportamento ao exceder

Resposta `429`, seguindo o formato único de erro do [`ADR-0004`](adr-0004-error-taxonomy.md):

```jsonc
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "details": { "retryAfterSeconds": 143 }
  },
  "meta": { "requestId": "req_...", "timestamp": "..." }
}
```

Headers acompanham o padrão `RateLimit-*` (RFC 9239 draft):

```
RateLimit-Limit: 30
RateLimit-Remaining: 0
RateLimit-Reset: 143
Retry-After: 143
```

**Três pontos deliberados:**

1. **Excedente não recebe fallback.** `429` é sinal para desacelerar. Servir sugestões a
   quem estourou o limite anularia o limite — e o cliente aprenderia que insistir funciona.
2. **`/health` fica de fora.** Health check de orquestrador bate com frequência e por
   design; limitá-lo derruba o serviço saudável.
3. **A chamada ao LLM nunca acontece.** O middleware corta antes do controller, então
   requisição bloqueada custa zero em token — que é o ponto inteiro.

### Por que 30 / 5 min

É um número **escolhido para o contexto do teste**, não medido em produção. O raciocínio:

- Uso humano legítimo gira em torno de 3–5 gerações por sessão. 30 dá folga de ~6x.
- Um teste automatizado do avaliador batendo no endpoint não deve esbarrar no limite por acidente.
- Ainda assim, corta cedo o abuso: 30 requisições a cada 5 minutos limita o gasto a algo
  previsível por IP.

Em produção o número viria de dados — p99 de requisições por sessão real —, não de
estimativa. Isso está registrado aqui justamente para não passar por medição o que é
palpite informado.

## Consequências

**Positivas**
- Teto de custo por IP, tornando abuso trivial economicamente inviável.
- O comportamento é testável de forma determinística ([`phase-08`](../../02-phases/phase-08-backend-tests.md)).
- Configurável por ambiente: dá para afrouxar em dev e apertar em produção sem tocar em código.

**Negativas — assumidas**
- **Não funciona com múltiplas instâncias.** Com N réplicas, o limite efetivo vira 30×N.
  Documentado aqui como limitação conhecida; a correção é um *store* Redis, que o
  `express-rate-limit` já suporta trocando uma linha na configuração.
- **IP é identidade frágil.** NAT corporativo pode fazer usuários legítimos se bloquearem
  mutuamente; um atacante com IPs rotativos passa por baixo.
- **Janela fixa tem efeito de borda:** dá para enviar 60 requisições na virada de duas
  janelas. *Sliding window* resolveria, ao custo de mais estado.

## Em produção, o que mudaria

1. Store em Redis, para o limite valer no cluster inteiro.
2. Chave por **usuário autenticado**, com IP apenas como fallback para anônimo.
3. Faixas por plano (free / paid), em vez de número único.
4. Limite de **custo** além de limite de requisição — um teto de tokens por período,
   que é a métrica que realmente importa.
5. Alerta quando a taxa de `429` sobe: costuma indicar ou abuso, ou limite mal calibrado.
