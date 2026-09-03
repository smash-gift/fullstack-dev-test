# Fase 03 — Integração com o LLM

**Status:** ✅ concluída · **Checklist:** item 3

## Objetivo

Substituir o stub por adapters reais de LLM, com prompt bem projetado e **validação
rigorosa da saída do modelo**. Ao fim desta fase, `birthday + friend` produz sugestões
geradas de verdade.

## Tasks

- [x] Confirmar os identificadores exatos de modelo de cada provider
- [x] Implementar `OpenAiProvider` (default)
- [x] Implementar `OpenRouterProvider`
- [x] Implementar `GeminiProvider`
- [x] Criar `llm-provider.factory.ts` selecionando por `LLM_PROVIDER`
- [x] Escrever o prompt compartilhado em `infra/llm/prompt/`
- [x] Criar o schema Zod de validação da resposta do modelo
- [x] Garantir 2–3 sugestões, de 1–2 frases cada
- [x] Ler as keys **só** em `pkg/config/env.ts`
- [x] Preencher os defaults de modelo em `04-operations/environment.md`
- [x] Confirmar: **nenhuma key no lado Flutter** *(o projeto Flutter ainda não existe)*
- [x] **Executar uma chamada real contra a OpenAI** — feito em 2026-09-03

## Design do prompt

O prompt vive em **um arquivo só**, compartilhado pelos três adapters. Isso mantém a
diferença entre providers restrita ao transporte — o que torna comparar modelos honesto.

Restrições que o prompt precisa impor:

| Restrição | Motivo |
|---|---|
| Saída em **JSON estruturado** | Parsear prosa de LLM é fonte crônica de bug |
| Exatamente `count` sugestões | O contrato promete 2–3; entregar 1 quebra o contrato |
| 1–2 frases por sugestão | Exigência literal do enunciado |
| Sem nome próprio inventado | O modelo não sabe o nome do destinatário; inventar produz constrangimento |
| Sem emoji por padrão | Nem todo cartão comporta; melhor deixar o usuário adicionar |
| Tom coerente com `tone` | O campo existe para ser respeitado |
| Idioma conforme `language` | Idem |

Onde o provider oferece *JSON mode* ou *structured output*, ele é usado — é mais confiável
que pedir JSON em prosa e torcer.

### Temperatura

Default `0.8`. O raciocínio: temperatura baixa produz três sugestões quase idênticas, o
que anula o propósito de pedir três; temperatura alta produz texto estranho para um cartão.
`0.8` é ponto de partida, ajustável por `LLM_TEMPERATURE` sem recompilar.

## Validação da saída — o ponto crítico

```
resposta bruta do provider
        ↓
JSON.parse          → falhou? LlmInvalidResponseError
        ↓
schema Zod          → falhou? LlmInvalidResponseError
        ↓
regras de negócio   → contagem errada, texto vazio, texto longo demais?
        ↓                 LlmInvalidResponseError
Suggestion[]
```

**Um `200 OK` com corpo inútil é falha.** É a classe de erro mais esquecida em integração
com LLM: trata-se o erro de transporte e ignora-se o erro de contrato, deixando dado
inválido seguir adiante para quebrar três camadas depois, longe da causa.

Aqui a validação acontece **dentro do adapter**, então a falha nasce no ponto exato onde a
informação sobre ela ainda existe.

## Segurança

> As defesas contra prompt injection são construídas na
> [`fase 05`](phase-05-llm-security.md). Esta fase deixa os pontos de extensão prontos:
> o prompt em arquivo próprio, e a validação da saída já isolada em
> `infra/llm/parsing/`, que é onde o guard de saída vai se apoiar.

- Keys lidas **exclusivamente** em `pkg/config/env.ts`
- Nenhuma key em log, em nenhum nível — nem em `debug`
- `.env` no `.gitignore`; `.env.example` sem valor real
- **Zero** credencial no projeto Flutter

## Identificadores de modelo — confirmados, não chutados

Verificados em **2026-09-03** contra as fontes vivas, e não contra memória:

| Provider | Default adotado | Como foi confirmado |
|---|---|---|
| OpenAI | `gpt-4o-mini` | Nomeado pelo próprio enunciado; presença confirmada no catálogo |
| OpenRouter | `openai/gpt-4o-mini` | `GET https://openrouter.ai/api/v1/models` — 425 modelos no catálogo |
| Gemini | `gemini-3.8-flash` | Documentação oficial da Gemini API + catálogo do OpenRouter |

**Por que a verificação valeu a pena.** A expectativa inicial era encontrar
`gemini-2.0-flash` ou `gemini-2.5-flash`. O catálogo atual traz a linha **3.x**, com
`gemini-3.8-flash` como Flash mais recente. Documentar de memória teria produzido
instrução que parece correta e falha na primeira execução — exatamente o que a pendência
declarada existia para evitar.

**Por que a versão é fixada em vez de usar um alias.** A documentação da Google descreve o
padrão `-latest` como convenção de nomenclatura, **sem confirmar** que
`gemini-flash-latest` é um endpoint ativo. Além disso, um alias "hot-swap a cada release"
significa que o modelo pode mudar sob nossos pés, alterando latência, custo e
comportamento sem aviso. Versão fixada é reproduzível.

**Escolha do default do OpenRouter.** `openai/gpt-4o-mini` — o **mesmo modelo** que o
adapter direto. Isso torna a comparação entre os dois caminhos honesta: a única diferença
passa a ser o transporte, e não o modelo.

## Decisões técnicas da fase

### `fetch` nativo, sem SDK de provider

Os três adapters usam `fetch` do Node 20. Nenhuma dependência nova.

| Motivo | Detalhe |
|---|---|
| **Superfície de supply chain** | Zero pacote novo — três SDKs seriam três árvores de dependência (LLM03) |
| **O timeout continua nosso** | SDKs trazem retry e timeout próprios, que competiriam com a política do use case |
| **Mapeamento de erro explícito** | Status → erro de domínio em **uma tabela legível**, em vez de inferido de exceções específicas de cada SDK |

**O custo, declarado:** os corpos de requisição são escritos à mão e podem divergir se um
provider mudar a API. Contido: resposta divergente reprova na validação Zod, vira
`LlmInvalidResponseError` e degrada — não corrompe dado.

### Saída estruturada: `json_schema` na OpenAI, `json_object` no OpenRouter

A OpenAI recebe `response_format: json_schema` com `strict: true` — o modelo é restringido
**na decodificação**, não apenas solicitado com educação.

O OpenRouter recebe `json_object`. O modelo ali é escolhido pelo usuário, e nem todo
modelo do catálogo suporta decodificação restrita por schema. O Gemini usa
`responseMimeType: application/json` com `responseSchema`, seu equivalente.

**Em todos os três, a validação Zod roda mesmo assim.** Saída estruturada estreita os
modos de falha; não elimina a necessidade de verificar.

### Key do Gemini em header, nunca em query string

A API do Gemini aceita `?key=...`. Usamos `x-goog-api-key`. Query string aparece em log de
acesso, log de proxy e histórico de navegador — e credencial não pertence a nenhum deles.

### Vazamento fechado antes do commit

O primeiro teste com key inválida provou que o adapter funciona (chegou na OpenAI, tomou
`401`, mapeou para `LlmAuthError`) — **mas a resposta devolvia `500` contendo o nome do
provider e o motivo interno**. O enunciado proíbe isso explicitamente.

O fallback é entregue na fase 04, mas um estado intermediário que vaza o fornecedor não
podia ser commitado. O `error-handler` passou a converter qualquer `LlmError` em
`INTERNAL_ERROR` genérico, mantendo o detalhe **apenas no log**, correlacionado por
`requestId`. Com teste cobrindo.

## Resultado verificado

| Verificação | Resultado |
|---|---|
| `npm run verify` (typecheck + lint + format + testes) | ✅ |
| Testes | ✅ **119 testes**, sem rede e sem API key |
| Cobertura | **96,09%** statements · 86,55% branches |
| Servidor sem key, `LLM_PROVIDER=openai` | ✅ **recusa subir**, exit code `1`, mensagem apontando a variável |
| Servidor com `LLM_PROVIDER=stub` | ✅ sobe sem credencial |
| Chamada real com key inválida | ✅ chegou na OpenAI, `401` → `LlmAuthError` |
| Resposta ao cliente nesse caso | ✅ `INTERNAL_ERROR` genérico, **sem** nome de provider |
| Log do servidor nesse caso | ✅ mantém `LLM_AUTH_ERROR` e o motivo, com `requestId` |

## Teste ao vivo — OpenAI, 2026-09-03

Executado com key real, `gpt-4o-mini`.

### Caso obrigatório do enunciado

`{"occasion":"birthday","relationship":"friend"}` → `200`, **3 sugestões**, ~2,9 s:

> *"Wishing you a birthday filled with joy and laughter. You deserve all the happiness today and always!"*
> *"Happy birthday to a wonderful friend! May this year bring you new adventures and cherished memories."*
> *"Cheers to another year of amazing friendship! Hope your birthday is as fantastic as you are."*

Todas com 1–2 frases, tom coerente, sem nome inventado, sem emoji, sem link.

### Matriz verificada

| Cenário | Resultado |
|---|---|
| `count: 2` | ✅ exatamente 2 sugestões |
| `language: pt` + `tone: funny` | ✅ *"Parabéns, irmã! Agora você está oficialmente mais velha e mais sábia... ou apenas mais velha mesmo!"* |
| `language: es` + `tone: formal` | ✅ *"Felicitaciones por este logro tan significativo en tu carrera profesional."* |
| `thank you` + `parent` | ✅ 3 sugestões apropriadas |
| Cache, mesma chamada | ✅ **1235 ms → 11 ms** (112×) |
| Cache, `count` diferente | ✅ não colide — chave distinta |
| Key no log | ✅ zero ocorrências |
| Valores digitados pelo usuário no log em `info` | ✅ zero ocorrências |

### Baseline de prompt injection

Aproveitando a key ativa, seis payloads foram disparados contra o modelo real **antes** das
defesas da fase 05 existirem. **Cinco resistiram, um vazou** — e o resultado confirmou
empiricamente o risco residual que o `ADR-0009` já declarava.

→ [`../05-security/injection-baseline-2026-09-03.md`](../05-security/injection-baseline-2026-09-03.md)

### O que continua não verificado

O adapter do **Gemini** não foi exercitado contra a API real: não há key de Google AI.
Está coberto por testes com `fetch` simulado, o que valida a forma da requisição, o header
de credencial e o mapeamento de erro — **não** a compatibilidade com o serviço. O mesmo
vale para o **OpenRouter**.

Registrado aqui em vez de omitido: "os três adapters funcionam" seria afirmação que eu não
posso sustentar. O que posso sustentar é que **um** foi verificado ponta a ponta e que os
três satisfazem o mesmo contrato, verificado por teste.

## Arquivos criados

```
src/infra/llm/
├── prompt/suggestion-prompt.ts        # system prompt CONSTANTE + user message JSON
├── parsing/llm-response.schema.ts     # Zod + parsing, com recuperação de cerca markdown
├── http/llm-http.ts                   # fetch + mapeamento status → erro de domínio
├── openai/openai.provider.ts          # default
├── openrouter/openrouter.provider.ts
├── gemini/gemini.provider.ts
├── stub/stub-llm.provider.ts
└── llm-provider.factory.ts
```

## Critério de pronto

- [x] `LLM_PROVIDER=openai` gera sugestões reais para `birthday + friend`
- [x] Todas as sugestões têm 1–2 frases
- [x] A quantidade retornada é exatamente a pedida em `count`
- [ ] `LLM_PROVIDER=openrouter` funciona trocando só a variável *(sem key de OpenRouter)*
- [x] JSON inválido simulado resulta em `LlmInvalidResponseError`
- [x] `grep -ri "sk-" src/` não retorna nada
- [x] Log em nível `info` não contém key nem prompt completo

## Riscos

| Risco | Mitigação |
|---|---|
| Modelo devolve prosa em vez de JSON | *Structured output* + validação Zod + caminho de fallback |
| Sugestões longas demais | Regra explícita no prompt + validação de tamanho + `max_tokens` |
| As 3 sugestões saem quase iguais | Temperatura calibrada e configurável |
| Identificador de modelo mudou no catálogo | Confirmado nesta fase; erro de modelo cai em `llm_unavailable`, com fallback |
| Custo durante o desenvolvimento | Modelo barato + cache ativo + rate limit |
